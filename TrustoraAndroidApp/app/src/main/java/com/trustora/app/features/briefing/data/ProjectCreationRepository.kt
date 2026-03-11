package com.trustora.app.features.briefing.data

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonPrimitive
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.DashboardBudget
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.models.ProjectCreationAIBriefResponse
import com.trustora.app.core.models.ProjectCreationAIMessage
import com.trustora.app.core.models.ProjectCreationAIStatus
import com.trustora.app.core.models.ProjectCreationBrief
import com.trustora.app.core.models.ProjectCreationBriefLine
import com.trustora.app.core.models.ProjectCreationBriefMilestone
import com.trustora.app.core.models.ProjectCreationProviderCandidate
import com.trustora.app.core.models.ProjectCreationProviderServiceInput
import com.trustora.app.core.models.ProjectCreationServiceOption
import com.trustora.app.core.models.ProjectCreationServiceRecommendation
import com.trustora.app.core.models.ProjectCreationServicesPage
import com.trustora.app.core.models.ProjectCreationOAuthProvider
import com.trustora.app.di.NetworkModule
import com.trustora.app.core.network.TrustoraApi
import com.trustora.app.core.utils.arrayOrNull
import com.trustora.app.core.utils.asBooleanOrNull
import com.trustora.app.core.utils.asDoubleOrNull
import com.trustora.app.core.utils.asIntOrNull
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.booleanOrNull
import com.trustora.app.core.utils.intOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import java.util.Locale
import java.util.UUID
import kotlin.math.ceil

class ProjectCreationRepository(
    private val api: TrustoraApi,
) {
    suspend fun getProjectCreationServices(
        page: Int,
        limit: Int,
        search: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ): ProjectCreationServicesPage {
        val payload = api.getProjectCreationServices(
            bearerToken = "Bearer $token",
            page = maxOf(1, page),
            limit = maxOf(1, limit),
            search = search?.trim()?.takeIf { it.isNotEmpty() },
            language = language,
            currency = currency.raw,
        )

        return projectCreationServicesPage(
            payload = payload,
            language = language,
            fallbackPage = page,
            fallbackLimit = limit,
        )
    }

    suspend fun recommendProjectCreationServices(
        brief: String,
        language: String,
        token: String,
    ): List<ProjectCreationServiceRecommendation> {
        val body = JsonObject().apply {
            addProperty("brief", brief)
        }

        val payload = api.recommendProjectCreationServices(
            bearerToken = "Bearer $token",
            language = language,
            payload = body,
        )
        return projectCreationServiceRecommendations(payload = payload, language = language)
    }

    suspend fun recommendProjectCreationProviders(
        projectTitle: String,
        description: String,
        services: List<ProjectCreationProviderServiceInput>,
        specificRequirements: List<String>,
        language: String,
        token: String,
    ): Map<String, List<ProjectCreationProviderCandidate>> {
        val servicesPayload = JsonArray().apply {
            services.forEach { service ->
                add(
                    JsonObject().apply {
                        addProperty("name", service.name)
                        service.id?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("id", it) }
                    },
                )
            }
        }

        val body = JsonObject().apply {
            addProperty("project_title", projectTitle)
            addProperty("description", description)
            add("services", servicesPayload)
            addProperty("top_per_service", 2)
            addProperty("candidate_limit", 50)
            if (specificRequirements.isNotEmpty()) {
                add(
                    "specific_requirements",
                    JsonArray().apply {
                        specificRequirements.forEach { requirement ->
                            add(JsonPrimitive(requirement))
                        }
                    },
                )
            }
        }

        val payload = api.recommendProjectCreationProviders(
            bearerToken = "Bearer $token",
            language = language,
            payload = body,
        )
        return projectCreationRecommendedProviders(payload)
    }

    suspend fun buildProjectCreationBrief(
        locale: String,
        messages: List<ProjectCreationAIMessage>,
        token: String,
    ): ProjectCreationAIBriefResponse {
        val body = JsonObject().apply {
            addProperty("locale", locale)
            add(
                "messages",
                JsonArray().apply {
                    messages.forEach { message ->
                        add(
                            JsonObject().apply {
                                addProperty("role", message.role)
                                addProperty("content", message.content)
                            },
                        )
                    }
                },
            )
        }

        val payload = api.buildProjectCreationBrief(
            bearerToken = "Bearer $token",
            language = locale,
            payload = body,
        )

        return normalizeProjectCreationAIBriefPayload(payload = payload, language = locale)
            ?: throw IllegalStateException("Invalid AI brief response.")
    }

    suspend fun getProjectCreationBriefResult(
        id: String,
        locale: String,
        token: String,
    ): ProjectCreationAIBriefResponse {
        val payload = api.getProjectCreationBriefResult(
            id = id,
            bearerToken = "Bearer $token",
            language = locale,
        )

        return normalizeProjectCreationAIBriefPayload(payload = payload, language = locale)
            ?: throw IllegalStateException("Invalid AI brief result response.")
    }

    fun normalizeProjectCreationAIBriefPayload(
        payload: JsonElement,
        language: String,
    ): ProjectCreationAIBriefResponse? {
        val root = projectCreationObject(payload) ?: JsonObject()
        val source = projectCreationObject(root["result"])
            ?: projectCreationObject(root["data"])
            ?: root
        val sourceResponsePayload = projectCreationObject(source["response_payload"])
        val rootResponsePayload = projectCreationObject(root["response_payload"])
        val sourceDebugResponsePayload = projectCreationObject(source.objectOrNull("debug")?.get("response_payload"))
        val rootDebugResponsePayload = projectCreationObject(root.objectOrNull("debug")?.get("response_payload"))

        val statusRaw = firstNonEmptyString(
            source["status"],
            root["status"],
            sourceResponsePayload?.get("status"),
            rootResponsePayload?.get("status"),
            sourceDebugResponsePayload?.get("status"),
            rootDebugResponsePayload?.get("status"),
        )?.uppercase(Locale.ROOT).orEmpty()
        val status = when (statusRaw) {
            "FINAL" -> ProjectCreationAIStatus.FINAL
            "PROCESSING" -> ProjectCreationAIStatus.PROCESSING
            else -> ProjectCreationAIStatus.CLARIFY
        }

        val questionCandidates = listOf(
            projectCreationArray(source["questions"]),
            projectCreationArray(root["questions"]),
            projectCreationArray(sourceResponsePayload?.get("questions")),
            projectCreationArray(rootResponsePayload?.get("questions")),
            projectCreationArray(sourceDebugResponsePayload?.get("questions")),
            projectCreationArray(rootDebugResponsePayload?.get("questions")),
        )
        val questionsRaw = questionCandidates.firstOrNull { it.isNotEmpty() } ?: emptyList()
        val questions = questionsRaw.mapNotNull { value ->
            normalizedString(value)
                ?: projectCreationObject(value)?.stringOrNull("question")
        }

        val briefResultId = firstNonEmptyString(
            source["brief_result_id"],
            root["brief_result_id"],
            source["id"],
            root["id"],
            sourceResponsePayload?.get("brief_result_id"),
            rootResponsePayload?.get("brief_result_id"),
            sourceDebugResponsePayload?.get("brief_result_id"),
            rootDebugResponsePayload?.get("brief_result_id"),
        )

        val finalBriefSourceCandidates = listOf(
            projectCreationObject(source["final_brief_modular"]),
            projectCreationObject(source["final_brief"]),
            projectCreationObject(root["final_brief_modular"]),
            projectCreationObject(root["final_brief"]),
            projectCreationObject(sourceResponsePayload?.get("final_brief_modular")),
            projectCreationObject(sourceResponsePayload?.get("final_brief")),
            projectCreationObject(rootResponsePayload?.get("final_brief_modular")),
            projectCreationObject(rootResponsePayload?.get("final_brief")),
            projectCreationObject(sourceDebugResponsePayload?.get("final_brief_modular")),
            projectCreationObject(sourceDebugResponsePayload?.get("final_brief")),
            projectCreationObject(rootDebugResponsePayload?.get("final_brief_modular")),
            projectCreationObject(rootDebugResponsePayload?.get("final_brief")),
            if (status == ProjectCreationAIStatus.FINAL) source else null,
        )
        val finalBrief = finalBriefSourceCandidates.firstNotNullOfOrNull { it?.let { row -> projectCreationBrief(row, language) } }
        val recommendedProviders = projectCreationRecommendedProviders(payload)

        val hasUsefulPayload =
            finalBrief != null ||
                questions.isNotEmpty() ||
                recommendedProviders.isNotEmpty() ||
                status == ProjectCreationAIStatus.PROCESSING ||
                statusRaw.isNotEmpty()
        if (!hasUsefulPayload) return null

        return ProjectCreationAIBriefResponse(
            status = status,
            briefResultId = briefResultId,
            questions = questions,
            finalBrief = finalBrief,
            recommendedProviders = recommendedProviders,
        )
    }

    fun extractProjectCreationBriefResultId(payload: JsonElement): String? {
        val root = projectCreationObject(payload) ?: JsonObject()
        val source = projectCreationObject(root["result"])
            ?: projectCreationObject(root["data"])
            ?: root
        val sourcePayload = projectCreationObject(source["payload"])
        val rootPayload = projectCreationObject(root["payload"])
        val dataPayload = projectCreationObject(projectCreationObject(root["data"])?.get("payload"))
        val sourceResponsePayload = projectCreationObject(source["response_payload"])
        val rootResponsePayload = projectCreationObject(root["response_payload"])
        val sourceDebugResponsePayload = projectCreationObject(source.objectOrNull("debug")?.get("response_payload"))
        val rootDebugResponsePayload = projectCreationObject(root.objectOrNull("debug")?.get("response_payload"))

        return firstNonEmptyString(
            source["brief_result_id"],
            root["brief_result_id"],
            source["id"],
            root["id"],
            sourceResponsePayload?.get("brief_result_id"),
            rootResponsePayload?.get("brief_result_id"),
            sourceDebugResponsePayload?.get("brief_result_id"),
            rootDebugResponsePayload?.get("brief_result_id"),
            sourcePayload?.get("brief_result_id"),
            rootPayload?.get("brief_result_id"),
            dataPayload?.get("brief_result_id"),
            sourcePayload?.get("id"),
            rootPayload?.get("id"),
            dataPayload?.get("id"),
        )
    }

    fun extractProjectCreationBriefFailureMessage(payload: JsonElement): String? {
        val root = projectCreationObject(payload) ?: JsonObject()
        val source = projectCreationObject(root["result"])
            ?: projectCreationObject(root["data"])
            ?: root
        val sourcePayload = projectCreationObject(source["payload"])
        val rootPayload = projectCreationObject(root["payload"])
        val dataPayload = projectCreationObject(projectCreationObject(root["data"])?.get("payload"))
        val sourceResponsePayload = projectCreationObject(source["response_payload"])
        val rootResponsePayload = projectCreationObject(root["response_payload"])
        val sourceDebugResponsePayload = projectCreationObject(source.objectOrNull("debug")?.get("response_payload"))
        val rootDebugResponsePayload = projectCreationObject(root.objectOrNull("debug")?.get("response_payload"))

        return firstNonEmptyString(
            source["errorMessage"],
            source["error_message"],
            source["message"],
            source["error"],
            source["reason"],
            sourceResponsePayload?.get("errorMessage"),
            sourceResponsePayload?.get("error_message"),
            sourceResponsePayload?.get("message"),
            sourceResponsePayload?.get("error"),
            rootResponsePayload?.get("errorMessage"),
            rootResponsePayload?.get("error_message"),
            rootResponsePayload?.get("message"),
            rootResponsePayload?.get("error"),
            sourceDebugResponsePayload?.get("errorMessage"),
            sourceDebugResponsePayload?.get("error_message"),
            sourceDebugResponsePayload?.get("message"),
            sourceDebugResponsePayload?.get("error"),
            rootDebugResponsePayload?.get("errorMessage"),
            rootDebugResponsePayload?.get("error_message"),
            rootDebugResponsePayload?.get("message"),
            rootDebugResponsePayload?.get("error"),
            sourcePayload?.get("errorMessage"),
            sourcePayload?.get("error_message"),
            sourcePayload?.get("message"),
            sourcePayload?.get("error"),
            rootPayload?.get("errorMessage"),
            rootPayload?.get("error_message"),
            rootPayload?.get("message"),
            rootPayload?.get("error"),
            dataPayload?.get("errorMessage"),
            dataPayload?.get("error_message"),
            dataPayload?.get("message"),
            dataPayload?.get("error"),
            root["message"],
            root["error"],
        )
    }

    suspend fun createClientProject(
        payload: JsonObject,
        language: String,
        currency: AppCurrency,
        token: String,
    ): DashboardProjectSummary? {
        val response = api.createClientProject(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = payload,
        )

        val project = extractProjectObject(response) ?: return null
        return parseProjectSummary(project)
    }

    fun oauthRedirectUrl(provider: ProjectCreationOAuthProvider): String? {
        val baseApi = NetworkModule.baseApiUrl()
        val basePath = baseApi.encodedPath.trimEnd('/')
        val rootPath = if (basePath.endsWith("/api")) {
            basePath.removeSuffix("/api")
        } else {
            basePath
        }
        val providerPath = "/auth/${provider.name.lowercase(Locale.ROOT)}/redirect"
        return baseApi.newBuilder()
            .encodedPath((rootPath + providerPath).ifBlank { providerPath })
            .query(null)
            .build()
            .toString()
    }

    private fun projectCreationServicesPage(
        payload: JsonElement,
        language: String,
        fallbackPage: Int,
        fallbackLimit: Int,
    ): ProjectCreationServicesPage {
        val root = payload.asJsonObjectOrNull() ?: JsonObject()
        val dataObject = root.objectOrNull("data")
        val pagination = root.objectOrNull("pagination")
            ?: dataObject?.objectOrNull("pagination")
            ?: root.objectOrNull("meta")
            ?: dataObject?.objectOrNull("meta")

        val rows = mutableListOf<JsonObject>()
        if (root["data"]?.isJsonObject == true) {
            collectProjectCreationServiceRows(
                payload = root["data"],
                categoryName = null,
                categoryId = null,
                subcategoryName = null,
                rows = rows,
            )
        } else {
            collectProjectCreationServiceRows(
                payload = payload,
                categoryName = null,
                categoryId = null,
                subcategoryName = null,
                rows = rows,
            )
        }

        if (rows.isEmpty()) {
            rows.addAll(extractMarketplaceRows(payload))
        }

        val seen = mutableSetOf<String>()
        val services = rows.mapNotNull { row ->
            projectCreationServiceOption(row, language)
        }.filter { service ->
            seen.add(service.id)
        }

        val total = pagination?.intOrNull("total")
            ?: root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: services.size
        val page = pagination?.intOrNull("page", "current_page")
            ?: root.intOrNull("page", "current_page")
            ?: fallbackPage
        val limit = pagination?.intOrNull("limit", "per_page")
            ?: root.intOrNull("limit", "per_page")
            ?: fallbackLimit
        val totalPages = pagination?.intOrNull("total_pages", "last_page")
            ?: root.intOrNull("total_pages", "last_page")
            ?: maxOf(1, ceil(maxOf(1, total).toDouble() / maxOf(1, limit).toDouble()).toInt())
        val hasMore = pagination?.booleanOrNull("has_more") ?: (page < totalPages)

        return ProjectCreationServicesPage(
            services = services,
            page = maxOf(1, page),
            limit = maxOf(1, limit),
            total = maxOf(0, total),
            totalPages = maxOf(1, totalPages),
            hasMore = hasMore,
        )
    }

    private fun collectProjectCreationServiceRows(
        payload: JsonElement?,
        categoryName: String?,
        categoryId: String?,
        subcategoryName: String?,
        rows: MutableList<JsonObject>,
    ) {
        if (payload == null || payload is JsonNull) return

        if (payload.isJsonArray) {
            val array = payload.asJsonArray
            for (index in 0 until array.size()) {
                collectProjectCreationServiceRows(
                    payload = array[index],
                    categoryName = categoryName,
                    categoryId = categoryId,
                    subcategoryName = subcategoryName,
                    rows = rows,
                )
            }
            return
        }

        val dictionary = payload.asJsonObjectOrNull() ?: return
        if (dictionary.entrySet().isEmpty()) return

        if (isProjectCreationServiceDictionary(dictionary)) {
            val row = dictionary.deepCopy()
            if (row["category_name"] == null && !categoryName.isNullOrBlank()) {
                row.addProperty("category_name", categoryName)
            }
            if (row["category_id"] == null && !categoryId.isNullOrBlank()) {
                row.addProperty("category_id", categoryId)
            }
            if (row["subcategory_name"] == null && !subcategoryName.isNullOrBlank()) {
                row.addProperty("subcategory_name", subcategoryName)
            }
            rows.add(row)
            return
        }

        val nextCategoryName = dictionary.stringOrNull("category_name")
            ?: localizedString(
                value = dictionary["name"],
                language = Locale.getDefault().language.takeIf { it.isNotEmpty() } ?: "en",
            )
            ?: categoryName
        val nextCategoryId = dictionary.stringOrNull("category_id")
            ?: dictionary.stringOrNull("id")
            ?: categoryId

        dictionary.entrySet().forEach { (key, value) ->
            val lowered = key.lowercase(Locale.ROOT)
            if (lowered == "pagination" || lowered == "meta" || lowered == "total" || lowered == "page") {
                return@forEach
            }

            val nextSubcategory = when {
                lowered == "services" || lowered == "data" || lowered == "categories" -> subcategoryName
                subcategoryName == null && categoryName != null -> key
                else -> subcategoryName
            }

            collectProjectCreationServiceRows(
                payload = value,
                categoryName = categoryName ?: nextCategoryName,
                categoryId = nextCategoryId,
                subcategoryName = nextSubcategory,
                rows = rows,
            )
        }
    }

    private fun isProjectCreationServiceDictionary(dictionary: JsonObject): Boolean {
        val hasId = !dictionary.stringOrNull("id", "service_id").isNullOrBlank()
        val hasName = !localizedString(dictionary["name"], "en").isNullOrBlank() ||
            !dictionary.stringOrNull("service_name", "title").isNullOrBlank()
        return hasId && hasName
    }

    private fun projectCreationServiceOption(
        row: JsonObject,
        language: String,
    ): ProjectCreationServiceOption? {
        val nestedService = row.objectOrNull("service")
        val categoryObject = row.objectOrNull("category")

        val serviceId = row.stringOrNull("id", "service_id")
            ?: nestedService?.stringOrNull("id")
        val serviceName = localizedString(row["name"], language)
            ?: row.stringOrNull("service_name", "title")
            ?: localizedString(nestedService?.get("name"), language)
            ?: nestedService?.stringOrNull("service_name")
        if (serviceName.isNullOrBlank()) return null

        val normalizedDeliveryProvider = projectCreationNormalizedDeliveryProvider(row, nestedService)
        val normalizedId = serviceId ?: "${serviceName.lowercase(Locale.ROOT)}::$normalizedDeliveryProvider"
        val categoryName = localizedString(row["category_name"], language)
            ?: localizedString(categoryObject?.get("name"), language)
            ?: row.stringOrNull("category_name", "category")
            ?: "Other"
        val subcategoryName = localizedString(row["subcategory_name"], language)
            ?: row.stringOrNull("subcategory_name", "subcategory")

        return ProjectCreationServiceOption(
            id = normalizedId,
            name = serviceName,
            description = localizedString(row["description"], language)
                ?: row.stringOrNull("description")
                ?: "",
            categoryName = categoryName,
            categoryId = row.stringOrNull("category_id", "categoryId")
                ?: categoryObject?.stringOrNull("id"),
            subcategoryName = subcategoryName,
            deliveryProvider = normalizedDeliveryProvider,
        )
    }

    private fun projectCreationNormalizedDeliveryProvider(
        row: JsonObject,
        nestedService: JsonObject?,
    ): String {
        val raw = row.stringOrNull("delivery_provider", "provider")
            ?: nestedService?.stringOrNull("delivery_provider", "provider")
            ?: "manual_upload"
        return when (raw.lowercase(Locale.ROOT)) {
            "github" -> "github"
            "figma" -> "figma"
            "google_drive" -> "google_drive"
            "google_analytics" -> "google_analytics"
            else -> "manual_upload"
        }
    }

    private fun projectCreationServiceRecommendations(
        payload: JsonElement,
        language: String,
    ): List<ProjectCreationServiceRecommendation> {
        val root = payload.asJsonObjectOrNull() ?: JsonObject()
        val source = root.objectOrNull("result")
            ?: root.objectOrNull("data")
            ?: root

        val recommendedRaw = when {
            source["services"]?.isJsonArray == true -> source["services"].asJsonArray.toList()
            source.stringOrNull("service_name", "name", "id") != null -> listOf(source)
            else -> source.entrySet().firstNotNullOfOrNull { (_, value) ->
                if (value.isJsonArray && value.asJsonArray.size() > 0) value.asJsonArray.toList() else null
            } ?: emptyList()
        }

        val recommendations = mutableListOf<ProjectCreationServiceRecommendation>()
        recommendations += mapProjectCreationRecommendations(
            rows = recommendedRaw,
            language = language,
            isAlternative = false,
            fallbackCategoryName = null,
        )

        val alternativeGroups = source["similar_services_by_category"]?.takeIf { it.isJsonArray }?.asJsonArray ?: JsonArray()
        for (index in 0 until alternativeGroups.size()) {
            val group = alternativeGroups[index].asJsonObjectOrNull() ?: continue
            val services = group["services"]?.takeIf { it.isJsonArray }?.asJsonArray?.toList().orEmpty()
            val categoryName = group.stringOrNull("category_name")
            recommendations += mapProjectCreationRecommendations(
                rows = services,
                language = language,
                isAlternative = true,
                fallbackCategoryName = categoryName,
            )
        }

        val seen = mutableSetOf<String>()
        return recommendations.filter { recommendation ->
            val key = recommendation.serviceId?.lowercase(Locale.ROOT)
                ?: "${recommendation.serviceName.lowercase(Locale.ROOT)}::${recommendation.deliveryProvider}::${recommendation.categoryName?.lowercase(Locale.ROOT).orEmpty()}"
            seen.add(key)
        }
    }

    private fun mapProjectCreationRecommendations(
        rows: List<JsonElement>,
        language: String,
        isAlternative: Boolean,
        fallbackCategoryName: String?,
    ): List<ProjectCreationServiceRecommendation> {
        return rows.mapNotNull { value ->
            val row = value.asJsonObjectOrNull() ?: return@mapNotNull null
            val nestedService = row.objectOrNull("service")
            val serviceId = row.stringOrNull("service_id", "id")
                ?: nestedService?.stringOrNull("id")
            val serviceName = row.stringOrNull("service_name")
                ?: localizedString(row["name"], language)
                ?: row.stringOrNull("title")
                ?: localizedString(nestedService?.get("name"), language)
            if (serviceName.isNullOrBlank()) return@mapNotNull null

            val categoryName = row.stringOrNull("category_name") ?: fallbackCategoryName
            val description = row.stringOrNull("description", "reason").orEmpty()
            val deliveryProvider = projectCreationNormalizedDeliveryProvider(row, nestedService)

            ProjectCreationServiceRecommendation(
                id = serviceId ?: "${serviceName.lowercase(Locale.ROOT)}::$deliveryProvider::${categoryName?.lowercase(Locale.ROOT).orEmpty()}",
                serviceId = serviceId,
                serviceName = serviceName,
                deliveryProvider = deliveryProvider,
                description = description,
                categoryName = categoryName,
                isAlternative = isAlternative || (row["is_alternative"].asBooleanOrNull() ?: false),
            )
        }
    }

    private fun projectCreationRecommendedProviders(payload: JsonElement): Map<String, List<ProjectCreationProviderCandidate>> {
        val root = projectCreationObject(payload) ?: JsonObject()
        val source = projectCreationObject(root["result"])
            ?: projectCreationObject(root["data"])
            ?: root
        val sourceResponsePayload = projectCreationObject(source["response_payload"])
        val rootResponsePayload = projectCreationObject(root["response_payload"])
        val sourceDebugResponsePayload = projectCreationObject(source.objectOrNull("debug")?.get("response_payload"))
        val rootDebugResponsePayload = projectCreationObject(root.objectOrNull("debug")?.get("response_payload"))

        val providersObject = projectCreationObject(source["recommended_providers"])
            ?: projectCreationObject(root["recommended_providers"])
            ?: projectCreationObject(sourceResponsePayload?.get("recommended_providers"))
            ?: projectCreationObject(rootResponsePayload?.get("recommended_providers"))
            ?: projectCreationObject(sourceDebugResponsePayload?.get("recommended_providers"))
            ?: projectCreationObject(rootDebugResponsePayload?.get("recommended_providers"))
            ?: JsonObject()

        val result = linkedMapOf<String, List<ProjectCreationProviderCandidate>>()
        providersObject.entrySet().forEach { (serviceName, value) ->
            val rows = projectCreationArray(value)
                .mapNotNull { projectCreationObject(it) }
                .mapNotNull { row -> projectCreationProvider(row, serviceName) }
            if (rows.isNotEmpty()) {
                result[serviceName] = rows
            }
        }
        return result
    }

    private fun projectCreationProvider(
        row: JsonObject,
        serviceName: String?,
    ): ProjectCreationProviderCandidate? {
        val id = row.stringOrNull("id") ?: return null
        val firstName = row.stringOrNull("firstName", "first_name").orEmpty()
        val lastName = row.stringOrNull("lastName", "last_name").orEmpty()
        return ProjectCreationProviderCandidate(
            id = id,
            firstName = firstName,
            lastName = lastName,
            avatarUrl = row.stringOrNull("avatar"),
            matchScore = row["matchScore"].asDoubleOrNull() ?: row["match_score"].asDoubleOrNull(),
            serviceName = serviceName,
        )
    }

    private fun projectCreationBrief(
        dictionary: JsonObject,
        language: String,
    ): ProjectCreationBrief? {
        val title = dictionary.stringOrNull("title") ?: "AI Generated Project"
        val description = dictionary.stringOrNull("description").orEmpty()
        val duration = dictionary.stringOrNull("project_duration", "recommended_duration", "duration").orEmpty()
        val paymentPlan = dictionary.stringOrNull("payment_plan") ?: "MILESTONE"
        val currency = dictionary.stringOrNull("currency") ?: "USD"

        val technologies = projectCreationArray(dictionary["technologies"]).mapNotNull(::normalizedString)
        val specificRequirements = projectCreationArray(dictionary["specific_requirements"]).mapNotNull(::normalizedString)

        val linesRaw = projectCreationArray(dictionary["project_lines"]).mapNotNull { it.asJsonObjectOrNull() }
        var lines = linesRaw.mapNotNull { row ->
            val serviceName = row.stringOrNull("service_name")
                ?: localizedString(row["name"], language)
                ?: row.stringOrNull("title")
            if (serviceName.isNullOrBlank()) return@mapNotNull null

            val milestones = projectCreationArray(row["milestones"])
                .mapNotNull { it.asJsonObjectOrNull() }
                .mapNotNull { milestone ->
                    val amount = milestone["amount"].asDoubleOrNull() ?: 0.0
                    if (amount <= 0.0) return@mapNotNull null

                    ProjectCreationBriefMilestone(
                        id = milestone.stringOrNull("id") ?: UUID.randomUUID().toString(),
                        title = milestone.stringOrNull("title") ?: "Milestone",
                        description = milestone.stringOrNull("description").orEmpty(),
                        percentage = milestone["percentage"].asDoubleOrNull(),
                        amount = amount,
                        assignedProviderId = milestone.stringOrNull("assigned_provider_id", "provider_id"),
                    )
                }

            ProjectCreationBriefLine(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                serviceId = row.stringOrNull("service_id"),
                serviceName = serviceName,
                deliveryProvider = projectCreationNormalizedDeliveryProvider(row, null),
                description = row.stringOrNull("description").orEmpty(),
                budgetPercentage = row["budget_percentage"].asDoubleOrNull() ?: 0.0,
                milestones = milestones,
            )
        }

        if (lines.isEmpty()) {
            lines = technologies.mapIndexed { index, technology ->
                ProjectCreationBriefLine(
                    id = "line-${index + 1}",
                    serviceId = null,
                    serviceName = technology,
                    deliveryProvider = "manual_upload",
                    description = description,
                    budgetPercentage = 0.0,
                    milestones = emptyList(),
                )
            }
        }

        if (lines.isEmpty()) return null
        return ProjectCreationBrief(
            title = title,
            description = description,
            lines = lines,
            technologies = technologies,
            specificRequirements = specificRequirements,
            duration = duration,
            paymentPlan = paymentPlan,
            currency = currency,
        )
    }

    private fun extractProjectObject(payload: JsonElement): JsonObject? {
        val dictionary = payload.asJsonObjectOrNull() ?: return null
        if (dictionary["id"] != null || dictionary["project_lines"] != null) {
            return dictionary
        }
        dictionary.objectOrNull("project")?.let { return it }
        val data = dictionary.objectOrNull("data")
        if (data != null) {
            if (data["id"] != null || data["project_lines"] != null) {
                return data
            }
            data.objectOrNull("project")?.let { return it }
        }
        return null
    }

    private fun parseProjectSummary(row: JsonObject): DashboardProjectSummary {
        val budgetObject = row.objectOrNull("budget")
        val budgetAmount = budgetObject?.get("amount").asDoubleOrNull() ?: row["budget"].asDoubleOrNull()

        return DashboardProjectSummary(
            id = row.stringOrNull("id", "project_id") ?: UUID.randomUUID().toString(),
            slug = row.stringOrNull("slug"),
            title = row.stringOrNull("title") ?: "Untitled",
            description = row.stringOrNull("description").orEmpty(),
            status = (row.stringOrNull("status") ?: "PENDING").uppercase(Locale.ROOT),
            budget = DashboardBudget(
                amount = budgetAmount,
                currency = budgetObject?.stringOrNull("currency") ?: row.stringOrNull("currency") ?: "USD",
                originalUsd = budgetObject?.get("original_usd").asDoubleOrNull(),
            ),
            createdAtIso = row.stringOrNull("created_at"),
            category = row.stringOrNull("category"),
            deadline = row.stringOrNull("deadline"),
            offersCount = row["offers_count"].asIntOrNull() ?: 0,
            milestoneCount = row["milestone_count"].asIntOrNull() ?: 0,
            providersCount = row.arrayOrNull("providers")?.size() ?: 0,
            milestones = emptyList(),
        )
    }

    private fun extractMarketplaceRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.toList().mapNotNull { it.asJsonObjectOrNull() }
        }
        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        val candidates = root.entrySet().mapNotNull { (_, value) ->
            if (value.isJsonArray) value.asJsonArray else null
        }
        for (candidate in candidates) {
            val rows = candidate.toList().mapNotNull { it.asJsonObjectOrNull() }
            if (rows.isNotEmpty()) {
                return rows
            }
        }
        return if (root.entrySet().isNotEmpty()) listOf(root) else emptyList()
    }

    private fun projectCreationObject(value: JsonElement?): JsonObject? {
        if (value == null || value is JsonNull) return null
        if (value.isJsonObject) return value.asJsonObject
        if (value.isJsonPrimitive && value.asJsonPrimitive.isString) {
            val parsed = runCatching { JsonParser.parseString(value.asString) }.getOrNull()
            if (parsed != null && parsed.isJsonObject) return parsed.asJsonObject
        }
        return null
    }

    private fun projectCreationArray(value: JsonElement?): List<JsonElement> {
        if (value == null || value is JsonNull) return emptyList()
        if (value.isJsonArray) return value.asJsonArray.toList()
        if (value.isJsonPrimitive && value.asJsonPrimitive.isString) {
            val parsed = runCatching { JsonParser.parseString(value.asString) }.getOrNull()
            if (parsed != null && parsed.isJsonArray) return parsed.asJsonArray.toList()
        }
        return emptyList()
    }

    private fun localizedString(value: JsonElement?, language: String): String? {
        val direct = normalizedString(value)
        if (!direct.isNullOrBlank()) return direct
        val dictionary = value.asJsonObjectOrNull() ?: return null
        return dictionary.stringOrNull(language, "en", "ro")
            ?: dictionary.entrySet().firstNotNullOfOrNull { (_, nested) -> normalizedString(nested) }
    }

    private fun firstNonEmptyString(vararg values: JsonElement?): String? {
        values.forEach { value ->
            normalizedString(value)?.let { return it }
        }
        return null
    }

    private fun normalizedString(value: JsonElement?): String? {
        if (value == null || value is JsonNull) return null
        if (value.isJsonPrimitive) {
            val primitive = value.asJsonPrimitive
            return when {
                primitive.isString -> primitive.asString.trim().takeIf { it.isNotEmpty() }
                primitive.isNumber -> primitive.asNumber.toString()
                primitive.isBoolean -> primitive.asBoolean.toString()
                else -> null
            }
        }
        return null
    }

    private fun JsonElement?.asJsonObjectOrNull(): JsonObject? {
        if (this == null || !isJsonObject) return null
        return asJsonObject
    }

    private fun JsonArray.toList(): List<JsonElement> = buildList {
        for (index in 0 until this@toList.size()) {
            add(this@toList[index])
        }
    }
}

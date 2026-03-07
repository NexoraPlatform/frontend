package com.trustora.app.features.dashboard.data

import android.content.Context
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminCreateUserPayload
import com.trustora.app.core.models.AdminCategoriesCollection
import com.trustora.app.core.models.AdminCategoryDetail
import com.trustora.app.core.models.AdminCategoryEditorDraft
import com.trustora.app.core.models.AdminCategorySummary
import com.trustora.app.core.models.AdminActivitiesCollection
import com.trustora.app.core.models.AdminActivityEntry
import com.trustora.app.core.models.AdminAuditLogEntry
import com.trustora.app.core.models.AdminAuditLogsCollection
import com.trustora.app.core.models.AdminCallServiceSummary
import com.trustora.app.core.models.AdminCallSummary
import com.trustora.app.core.models.AdminCallTestResultSummary
import com.trustora.app.core.models.AdminCallUserSummary
import com.trustora.app.core.models.AdminCallsCollection
import com.trustora.app.core.models.AdminLegalClause
import com.trustora.app.core.models.AdminLegalClausePayload
import com.trustora.app.core.models.AdminLegalClauseUpdatePayload
import com.trustora.app.core.models.AdminLegalClausesCollection
import com.trustora.app.core.models.AdminNewsletterSubscriber
import com.trustora.app.core.models.AdminNewsletterSubscribersCollection
import com.trustora.app.core.models.AdminOrderParticipantSummary
import com.trustora.app.core.models.AdminOrderServiceSummary
import com.trustora.app.core.models.AdminOrderSummary
import com.trustora.app.core.models.AdminOrdersCollection
import com.trustora.app.core.models.AdminSendNewsletterPayload
import com.trustora.app.core.models.AdminCreateTestPayload
import com.trustora.app.core.models.AdminDeliveryProviderOption
import com.trustora.app.core.models.AdminEarlyAccessClientEntry
import com.trustora.app.core.models.AdminEarlyAccessGroupedCollection
import com.trustora.app.core.models.AdminEarlyAccessPagination
import com.trustora.app.core.models.AdminEarlyAccessProviderEntry
import com.trustora.app.core.models.AdminCreateRolePayload
import com.trustora.app.core.models.AdminPermissionGroup
import com.trustora.app.core.models.AdminPermissionSummary
import com.trustora.app.core.models.AdminRoleDetail
import com.trustora.app.core.models.AdminRoleLite
import com.trustora.app.core.models.AdminRoleSummary
import com.trustora.app.core.models.AdminRolesCollection
import com.trustora.app.core.models.AdminTestDetail
import com.trustora.app.core.models.AdminTestEditorDraft
import com.trustora.app.core.models.AdminTestQuestion
import com.trustora.app.core.models.AdminTestQuestionResult
import com.trustora.app.core.models.AdminTestQuestionTestCase
import com.trustora.app.core.models.AdminTestServiceOption
import com.trustora.app.core.models.AdminTestStatistics
import com.trustora.app.core.models.AdminTestSummary
import com.trustora.app.core.models.AdminTestsCollection
import com.trustora.app.core.models.AdminUpdateRolePayload
import com.trustora.app.core.models.AdminUpdateTestPayload
import com.trustora.app.core.models.AdminServiceCategoryOption
import com.trustora.app.core.models.AdminServiceDetail
import com.trustora.app.core.models.AdminServiceEditorDraft
import com.trustora.app.core.models.AdminServiceStatusAction
import com.trustora.app.core.models.AdminServiceSummary
import com.trustora.app.core.models.AdminServicesCollection
import com.trustora.app.core.models.AdminDashboardStats
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AdminUserListItem
import com.trustora.app.core.models.AdminUsersCollection
import com.trustora.app.core.models.AdminUserStatusAction
import com.trustora.app.core.models.DashboardBudget
import com.trustora.app.core.models.DashboardChatGroup
import com.trustora.app.core.models.DashboardChatMessage
import com.trustora.app.core.models.DashboardCompanyDetailsPayload
import com.trustora.app.core.models.DashboardCompanySearchResult
import com.trustora.app.core.models.DashboardCompanyUser
import com.trustora.app.core.models.DashboardCurrencyOption
import com.trustora.app.core.models.DashboardLocationCity
import com.trustora.app.core.models.DashboardLocationCountry
import com.trustora.app.core.models.DashboardLocationState
import com.trustora.app.core.models.DashboardProjectMilestone
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.models.DashboardRapydOnboarding
import com.trustora.app.core.models.DashboardRecentActivity
import com.trustora.app.core.models.DashboardServiceItem
import com.trustora.app.core.models.DashboardStats
import com.trustora.app.core.models.DashboardWalletBalance
import com.trustora.app.core.network.TrustoraApi
import com.trustora.app.core.utils.TrustoraLocationCatalog
import com.trustora.app.core.utils.arrayOrNull
import com.trustora.app.core.utils.asBooleanOrNull
import com.trustora.app.core.utils.asDoubleOrNull
import com.trustora.app.core.utils.asIntOrNull
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.booleanOrNull
import com.trustora.app.core.utils.doubleOrNull
import com.trustora.app.core.utils.intOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import java.util.Locale
import java.util.UUID

class DashboardRepository(
    private val api: TrustoraApi,
    context: Context,
) {
    private val locationCatalog = TrustoraLocationCatalog(context)

    suspend fun getStats(language: String, currency: AppCurrency, token: String): DashboardStats {
        val payload = api.getDashboardStats(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull()
        val data = root?.objectOrNull("data")
        val source = data ?: root ?: JsonObject()

        val role = source.stringOrNull("role")?.lowercase()
            ?: root?.stringOrNull("role")?.lowercase()
            ?: "client"
        val statsObject = source.objectOrNull("stats")
            ?: root?.objectOrNull("stats")
            ?: JsonObject()

        val values = mutableMapOf<String, Double>()
        for ((key, value) in statsObject.entrySet()) {
            if (value.isJsonObject) {
                val node = value.asJsonObject
                val parsedValue = node["value"].asDoubleOrNull()
                    ?: node["amount"].asDoubleOrNull()
                    ?: 0.0
                values[key] = parsedValue

                node["change"].asDoubleOrNull()?.let { values["${key}_change"] = it }
                node["changePercentage"].asDoubleOrNull()?.let { values["${key}_change_percentage"] = it }
                node["change_percentage"].asDoubleOrNull()?.let { values["${key}_change_percentage"] = it }
            } else {
                values[key] = value.asDoubleOrNull() ?: 0.0
            }
        }

        return DashboardStats(role = role, values = values)
    }

    suspend fun getAdminDashboardStats(language: String, currency: AppCurrency, token: String): AdminDashboardStats {
        val payload = api.getAdminDashboardStats(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull() ?: JsonObject()
        val data = root.objectOrNull("data")
        val source = data ?: root

        return AdminDashboardStats(
            totalUsers = source.intOrNull("totalUsers", "total_users") ?: 0,
            currentMonthUsers = source.intOrNull("currentMonthUsers", "current_month_users") ?: 0,
            currentMonthVsLastMonthUsers = source.doubleOrNull("currentMonthVsLastMonthUsers", "current_month_vs_last_month_users") ?: 0.0,
            activeServices = source.intOrNull("activeServices", "active_services") ?: 0,
            currentMonthServices = source.intOrNull("currentMonthServices", "current_month_services") ?: 0,
            currentMonthVsLastMonthServices = source.doubleOrNull("currentMonthVsLastMonthServices", "current_month_vs_last_month_services") ?: 0.0,
            totalProjects = source.intOrNull("totalProjects", "total_projects") ?: 0,
            currentMonthProjects = source.intOrNull("currentMonthProjects", "current_month_projects") ?: 0,
            totalPendingProjects = source.intOrNull("totalPendingProjects", "total_pending_projects") ?: 0,
            currentMonthVsLastMonthProjects = source.doubleOrNull("currentMonthVsLastMonthProjects", "current_month_vs_last_month_projects") ?: 0.0,
            totalRevenue = source.doubleOrNull("totalRevenue", "total_revenue") ?: 0.0,
            currentMonthRevenue = source.doubleOrNull("currentMonthRevenue", "current_month_revenue") ?: 0.0,
            currentMonthVsLastMonthRevenue = source.doubleOrNull("currentMonthVsLastMonthRevenue", "current_month_vs_last_month_revenue") ?: 0.0,
            pendingUsers = source.intOrNull("pendingUsers", "pending_users") ?: 0,
            pendingServices = source.intOrNull("pendingServices", "pending_services") ?: 0,
            pendingCalls = source.intOrNull("pendingCalls", "pending_calls") ?: 0,
            totalScheduleCalls = source.intOrNull("totalScheduleCalls", "total_schedule_calls") ?: 0,
        )
    }

    suspend fun getAdminUsers(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminUsersCollection {
        val payload = api.getAdminUsers(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminUsersCollection(payload = payload, defaultPerPage = perPage)
    }

    suspend fun getAdminEarlyAccessGrouped(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminEarlyAccessGroupedCollection {
        val payload = api.getAdminEarlyAccessGrouped(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminEarlyAccessCollection(payload = payload)
    }

    suspend fun getAdminActivities(
        page: Int,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminActivitiesCollection {
        val payload = api.getAdminActivities(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = maxOf(1, page),
        )

        return parseAdminActivitiesCollection(payload = payload)
    }

    suspend fun getAdminAuditLogs(
        page: Int,
        event: String?,
        userId: Int?,
        subjectType: String?,
        dateFrom: String?,
        dateTo: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminAuditLogsCollection {
        val payload = api.getAdminAuditLogs(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = maxOf(1, page),
            event = event?.trim()?.takeIf { it.isNotEmpty() },
            userId = userId,
            subjectType = subjectType?.trim()?.takeIf { it.isNotEmpty() },
            dateFrom = dateFrom?.trim()?.takeIf { it.isNotEmpty() },
            dateTo = dateTo?.trim()?.takeIf { it.isNotEmpty() },
        )

        return parseAdminAuditLogsCollection(payload = payload)
    }

    suspend fun getAdminCalls(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminCallsCollection {
        val payload = api.getAdminCalls(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminCallsCollection(
            payload = payload,
            language = language,
            defaultPerPage = perPage,
        )
    }

    suspend fun updateAdminCallStatus(
        callId: String,
        status: String,
        note: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            addProperty("status", status.trim().uppercase())
            val trimmedNote = note?.trim()
            if (!trimmedNote.isNullOrEmpty()) {
                addProperty("note", trimmedNote)
            } else {
                add("note", com.google.gson.JsonNull.INSTANCE)
            }
        }

        api.updateAdminCallStatus(
            callId = callId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun getAdminOrders(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminOrdersCollection {
        val payload = api.getAdminOrders(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminOrdersCollection(
            payload = payload,
            language = language,
            defaultPerPage = perPage,
        )
    }

    suspend fun getAdminOrderDetail(
        orderId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminOrderSummary {
        val payload = api.getAdminOrder(
            orderId = orderId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val row = parseAdminOrderRows(payload).firstOrNull()
            ?: throw IllegalStateException("Could not load order.")
        return parseAdminOrderSummary(row = row, language = language)
    }

    suspend fun updateAdminOrder(
        orderId: String,
        status: String,
        adminNotes: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminOrderSummary? {
        val body = JsonObject().apply {
            addProperty("status", status.trim().uppercase())
            val notes = adminNotes?.trim()
            if (!notes.isNullOrEmpty()) {
                addProperty("adminNotes", notes)
                addProperty("admin_notes", notes)
            } else {
                add("adminNotes", com.google.gson.JsonNull.INSTANCE)
                add("admin_notes", com.google.gson.JsonNull.INSTANCE)
            }
        }

        val payload = api.updateAdminOrder(
            orderId = orderId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminOrderRows(payload).firstOrNull() ?: return null
        return parseAdminOrderSummary(row = row, language = language)
    }

    suspend fun getAdminTestStatistics(
        testId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminTestStatistics {
        val payload = api.getAdminTestStatistics(
            testId = testId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
        return parseAdminTestStatistics(payload = payload, language = language)
    }

    suspend fun getAdminServices(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminServicesCollection {
        val payload = api.getAdminServices(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminServicesCollection(
            payload = payload,
            language = language,
            defaultPerPage = perPage,
        )
    }

    suspend fun getAdminServiceDetail(
        serviceId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminServiceDetail {
        val payload = api.getAdminService(
            serviceId = serviceId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val row = parseAdminServiceRows(payload).firstOrNull()
            ?: throw IllegalStateException("Could not load service.")
        return parseAdminServiceDetail(row = row, language = language)
    }

    suspend fun createAdminService(
        draft: AdminServiceEditorDraft,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminServiceDetail? {
        val body = JsonObject().apply {
            addProperty("title", draft.name.trim())
            addProperty("slug", draft.slug.trim())
            addProperty("description", draft.description.trim())
            addProperty("requirements", draft.requirements.trim())
            addProperty("category_id", draft.categoryId.trim())
            addProperty("delivery_provider", draft.deliveryProvider.trim())
            add("skills", toJsonStringArray(normalizeTextItems(draft.skills)))
            add("tags", toJsonStringArray(normalizeTextItems(draft.tags)))
            addProperty("basePrice", 0)
            addProperty("pricingType", "CUSTOM")
        }

        val payload = api.createAdminService(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminServiceRows(payload).firstOrNull() ?: return null
        return parseAdminServiceDetail(row = row, language = language)
    }

    suspend fun updateAdminService(
        serviceId: String,
        draft: AdminServiceEditorDraft,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminServiceDetail? {
        val body = JsonObject().apply {
            addProperty("name", draft.name.trim())
            addProperty("slug", draft.slug.trim())
            addProperty("description", draft.description.trim())
            addProperty("requirements", draft.requirements.trim())
            addProperty("category_id", draft.categoryId.trim())
            addProperty("delivery_provider", draft.deliveryProvider.trim())
            add("skills", toJsonStringArray(normalizeTextItems(draft.skills)))
            add("tags", toJsonStringArray(normalizeTextItems(draft.tags)))
            addProperty("status", draft.status.trim().uppercase())
        }

        val payload = api.updateAdminService(
            serviceId = serviceId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminServiceRows(payload).firstOrNull() ?: return null
        return parseAdminServiceDetail(row = row, language = language)
    }

    suspend fun updateAdminServiceStatus(
        serviceId: String,
        action: AdminServiceStatusAction,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            addProperty("status", action.raw)
        }
        api.updateAdminServiceStatus(
            serviceId = serviceId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun deleteAdminService(
        serviceId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        api.deleteAdminService(
            serviceId = serviceId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
    }

    suspend fun getAdminCategories(
        language: String,
        currency: AppCurrency,
        token: String,
        page: Int,
        perPage: Int,
    ): AdminCategoriesCollection {
        val payload = api.getAdminCategories(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = page,
            perPage = perPage,
        )

        return parseAdminCategoriesCollection(
            payload = payload,
            language = language,
            defaultPerPage = perPage,
        )
    }

    suspend fun getAdminCategoryDetail(
        categoryId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminCategoryDetail {
        val payload = api.getAdminCategory(
            categoryId = categoryId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val row = parseAdminCategoryRows(payload).firstOrNull()
            ?: throw IllegalStateException("Could not load category.")
        return parseAdminCategoryDetail(row = row, language = language)
    }

    suspend fun createAdminCategory(
        draft: AdminCategoryEditorDraft,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminCategoryDetail? {
        val payload = api.createAdminCategory(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = buildAdminCategoryBody(draft),
        )

        val row = parseAdminCategoryRows(payload).firstOrNull() ?: return null
        return parseAdminCategoryDetail(row = row, language = language)
    }

    suspend fun updateAdminCategory(
        categoryId: String,
        draft: AdminCategoryEditorDraft,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminCategoryDetail? {
        val payload = api.updateAdminCategory(
            categoryId = categoryId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = buildAdminCategoryBody(draft),
        )

        val row = parseAdminCategoryRows(payload).firstOrNull() ?: return null
        return parseAdminCategoryDetail(row = row, language = language)
    }

    suspend fun deleteAdminCategory(
        categoryId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        api.deleteAdminCategory(
            categoryId = categoryId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
    }

    suspend fun getAdminCategorySlug(
        categoryId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): String? {
        val payload = api.getAdminCategorySlug(
            categoryId = categoryId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull() ?: return null
        return root.stringOrNull("slug")
            ?: root.objectOrNull("data")?.stringOrNull("slug")
    }

    suspend fun getAdminLegalClauses(
        language: String,
        currency: AppCurrency,
        token: String,
        params: Map<String, String?> = emptyMap(),
    ): AdminLegalClausesCollection {
        val queryParams = buildMap<String, String> {
            params.forEach { (key, value) ->
                val normalizedValue = value?.trim().orEmpty()
                if (normalizedValue.isNotEmpty()) {
                    put(key, normalizedValue)
                }
            }
        }

        val payload = api.getAdminLegalClauses(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            params = queryParams,
        )

        val defaultPerPage = queryParams["per_page"]?.toIntOrNull() ?: 15
        return parseAdminLegalClausesCollection(
            payload = payload,
            defaultPerPage = defaultPerPage,
        )
    }

    suspend fun getAdminLegalClause(
        clauseId: String,
        languageFilter: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminLegalClause {
        val requestedLanguage = languageFilter?.trim().takeIf { !it.isNullOrEmpty() } ?: "ro"
        val payload = api.getAdminLegalClause(
            clauseId = clauseId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            languageFilter = requestedLanguage,
        )

        val row = parseAdminLegalClauseRows(payload).firstOrNull()
            ?: throw IllegalStateException("Could not load legal clause.")
        return parseAdminLegalClause(row)
    }

    suspend fun getAdminLegalClauseCategories(
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<String> {
        val payload = api.getAdminLegalClauseCategories(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val values = linkedSetOf<String>()
        fun append(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isNotEmpty()) {
                values.add(normalized)
            }
        }

        fun appendFromElement(element: JsonElement?) {
            when {
                element == null || element.isJsonNull -> return
                element.isJsonPrimitive -> append(element.asStringOrNull())
                element.isJsonObject -> {
                    val row = element.asJsonObject
                    append(row.stringOrNull("category", "name", "title", "value"))
                }

                element.isJsonArray -> {
                    element.asJsonArray.forEach(::appendFromElement)
                }
            }
        }

        appendFromElement(payload)
        if (values.isNotEmpty()) {
            return values.toList()
        }

        val root = payload.asJsonObjectOrNull()
        appendFromElement(root?.arrayOrNull("categories"))
        appendFromElement(root?.objectOrNull("data")?.arrayOrNull("categories"))
        appendFromElement(root?.arrayOrNull("data"))
        appendFromElement(root?.objectOrNull("data"))

        return values.toList()
    }

    suspend fun createAdminLegalClause(
        payloadData: AdminLegalClausePayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminLegalClause? {
        val body = JsonObject().apply {
            addProperty("identifier", payloadData.identifier.trim())
            addProperty("category", payloadData.category.trim())
            add("content", JsonObject().apply {
                payloadData.content.forEach { (key, value) ->
                    val normalizedKey = key.trim()
                    val normalizedValue = value.trim()
                    if (normalizedKey.isNotEmpty() && normalizedValue.isNotEmpty()) {
                        addProperty(normalizedKey, normalizedValue)
                    }
                }
            })
        }

        val payload = api.createAdminLegalClause(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminLegalClauseRows(payload).firstOrNull() ?: return null
        return parseAdminLegalClause(row)
    }

    suspend fun updateAdminLegalClause(
        clauseId: String,
        payloadData: AdminLegalClauseUpdatePayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminLegalClause? {
        val body = JsonObject().apply {
            payloadData.identifier?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("identifier", it) }
            payloadData.category?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("category", it) }
            payloadData.content?.let { values ->
                val contentObject = JsonObject()
                values.forEach { (key, value) ->
                    val normalizedKey = key.trim()
                    val normalizedValue = value.trim()
                    if (normalizedKey.isNotEmpty() && normalizedValue.isNotEmpty()) {
                        contentObject.addProperty(normalizedKey, normalizedValue)
                    }
                }
                add("content", contentObject)
            }
        }

        val payload = api.updateAdminLegalClause(
            clauseId = clauseId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminLegalClauseRows(payload).firstOrNull() ?: return null
        return parseAdminLegalClause(row)
    }

    suspend fun deleteAdminLegalClause(
        clauseId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        api.deleteAdminLegalClause(
            clauseId = clauseId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
    }

    suspend fun getAdminNewsletterTemplates(
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<String> {
        val payload = api.getAdminNewsletterTemplates(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val values = linkedSetOf<String>()
        fun append(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isNotEmpty()) {
                values.add(normalized)
            }
        }

        if (payload.isJsonArray) {
            payload.asJsonArray.forEach { append(it.asStringOrNull()) }
            return values.toList()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("templates")?.forEach { append(it.asStringOrNull()) }
        root.objectOrNull("data")?.arrayOrNull("templates")?.forEach { append(it.asStringOrNull()) }
        root.arrayOrNull("data")?.forEach { append(it.asStringOrNull()) }
        return values.toList()
    }

    suspend fun getAdminNewsletterTemplateContent(
        template: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): String {
        val payload = api.getAdminNewsletterTemplateContent(
            template = template,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull()
        return root?.stringOrNull("content")
            ?: root?.objectOrNull("data")?.stringOrNull("content")
            ?: payload.asStringOrNull().orEmpty()
    }

    suspend fun getAdminNewsletterSubscribers(
        language: String,
        currency: AppCurrency,
        token: String,
        perPage: Int,
        onlyActive: Boolean,
    ): AdminNewsletterSubscribersCollection {
        val payload = api.getAdminNewsletterSubscribers(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            perPage = maxOf(1, perPage),
            onlyActive = onlyActive,
        )
        return parseAdminNewsletterSubscribersCollection(
            payload = payload,
            defaultPerPage = perPage,
        )
    }

    suspend fun sendAdminNewsletter(
        payloadData: AdminSendNewsletterPayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ): Int {
        val body = JsonObject().apply {
            addProperty("template", payloadData.template.trim())
            addProperty("subject", payloadData.subject.trim())

            payloadData.data
                ?.mapValues { it.value.trim() }
                ?.filterValues { it.isNotEmpty() }
                ?.takeIf { it.isNotEmpty() }
                ?.let { dataMap ->
                    val dataObject = JsonObject()
                    dataMap.forEach { (key, value) ->
                        val normalizedKey = key.trim()
                        if (normalizedKey.isNotEmpty()) {
                            dataObject.addProperty(normalizedKey, value)
                        }
                    }
                    if (dataObject.entrySet().isNotEmpty()) {
                        add("data", dataObject)
                    }
                }

            payloadData.userType?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("user_type", it) }

            payloadData.recipients
                ?.map { it.trim() }
                ?.filter { it.isNotEmpty() }
                ?.takeIf { it.isNotEmpty() }
                ?.let { recipients ->
                    add("recipients", toJsonStringArray(recipients))
                }

            payloadData.language?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("language", it) }
        }

        val payload = api.sendAdminNewsletter(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val root = payload.asJsonObjectOrNull()
        return root?.intOrNull("sent")
            ?: root?.objectOrNull("data")?.intOrNull("sent")
            ?: 0
    }

    suspend fun getAdminServiceCategories(
        language: String,
        token: String,
    ): List<AdminServiceCategoryOption> {
        val payload = api.getAdminServiceCategories(
            bearerToken = "Bearer $token",
            language = language,
        )

        return parseAdminServiceCategoryRows(payload = payload, language = language)
    }

    suspend fun getAdminServiceCategorySlug(
        categoryId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): String? {
        val payload = api.getAdminServiceCategorySlug(
            categoryId = categoryId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull() ?: return null
        return root.stringOrNull("slug")
            ?: root.objectOrNull("data")?.stringOrNull("slug")
    }

    suspend fun getAdminServiceDeliveryProviders(
        language: String,
        currency: AppCurrency,
        token: String?,
    ): List<AdminDeliveryProviderOption> {
        val payload = api.getAdminServiceDeliveryProviders(
            bearerToken = token?.let { "Bearer $it" },
            language = language,
            currency = currency.raw,
        )

        val rows = parseDeliveryProviderRows(payload)
        val seen = linkedSetOf<String>()
        return rows.mapNotNull { row ->
            val value = row.stringOrNull("value", "id", "key")?.trim().orEmpty()
            val label = row.stringOrNull("label", "name", "title")?.trim().orEmpty()
            if (value.isEmpty() || label.isEmpty()) {
                return@mapNotNull null
            }
            if (!seen.add(value)) {
                return@mapNotNull null
            }
            AdminDeliveryProviderOption(value = value, label = label)
        }
    }

    suspend fun createAdminUser(
        payload: AdminCreateUserPayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            addProperty("firstName", payload.firstName)
            addProperty("lastName", payload.lastName)
            addProperty("email", payload.email)
            addProperty("password", payload.password)
            addProperty("role", payload.role.uppercase())
            payload.phone?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("phone", it) }
        }

        api.createAdminUser(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun updateAdminUserStatus(
        userId: String,
        action: AdminUserStatusAction,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            addProperty("status", action.raw)
        }
        api.updateAdminUserStatus(
            userId = userId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun deleteAdminUser(
        userId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        api.deleteAdminUser(
            userId = userId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
    }

    suspend fun setAdminUserSuperuser(
        userId: String,
        isSuperuser: Boolean,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        if (isSuperuser) {
            api.removeAdminUserSuper(
                userId = userId,
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        } else {
            api.makeAdminUserSuper(
                userId = userId,
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        }
    }

    suspend fun getAdminRoles(
        language: String,
        currency: AppCurrency,
        token: String,
        search: String?,
        page: Int,
        pageSize: Int,
    ): AdminRolesCollection {
        val payload = api.getAdminRoles(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = maxOf(1, page),
            pageSize = maxOf(1, pageSize),
            search = search?.trim()?.takeIf { it.isNotEmpty() },
        )

        return parseAdminRolesCollection(
            payload = payload,
            defaultPageSize = maxOf(1, pageSize),
        )
    }

    suspend fun getAdminRolesLite(
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<AdminRoleLite> {
        val payload = api.getAdminRoles(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            page = 1,
            pageSize = 1000,
            search = null,
        )

        return parseAdminRolesCollection(
            payload = payload,
            defaultPageSize = 1000,
        ).roles.map { role ->
            AdminRoleLite(
                id = role.id,
                name = role.name,
                slug = role.slug,
            )
        }
    }

    suspend fun getAdminRole(
        roleId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminRoleDetail {
        val payload = api.getAdminRole(
            roleId = roleId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        val row = parseAdminRoleRows(payload).firstOrNull()
            ?: throw IllegalStateException("Could not load role.")
        return parseAdminRoleDetail(row)
    }

    suspend fun getAdminPermissionGroups(
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<AdminPermissionGroup> {
        val payload = api.getAdminPermissionGroups(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        return parseAdminPermissionGroupRows(payload).map(::parseAdminPermissionGroup)
    }

    suspend fun getAdminRolePermissionSlugs(
        roleSlug: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<String> {
        val payload = api.getAdminRolePermissionSlugs(
            roleSlug = roleSlug,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )

        return parseAdminRolePermissionSlugs(payload)
    }

    suspend fun createAdminRole(
        payloadData: AdminCreateRolePayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminRoleDetail? {
        val body = JsonObject().apply {
            addProperty("name", payloadData.name)
            addProperty("description", payloadData.description)
            val permissions = toRolePermissionIdsArray(payloadData.permissionIds)
            if (permissions.size() > 0) {
                add("permissions", permissions)
            }
        }

        val payload = api.createAdminRole(
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminRoleRows(payload).firstOrNull() ?: return null
        return parseAdminRoleDetail(row)
    }

    suspend fun updateAdminRole(
        roleId: String,
        payloadData: AdminUpdateRolePayload,
        language: String,
        currency: AppCurrency,
        token: String,
    ): AdminRoleDetail? {
        val body = JsonObject().apply {
            addProperty("name", payloadData.name)
            addProperty("description", payloadData.description)
            add("permissions", toRolePermissionIdsArray(payloadData.permissionIds))
        }

        val payload = api.updateAdminRole(
            roleId = roleId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )

        val row = parseAdminRoleRows(payload).firstOrNull() ?: return null
        return parseAdminRoleDetail(row)
    }

    suspend fun updateAdminRoleSortOrder(
        roleId: String,
        sortOrder: Int,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            addProperty("sortOrder", sortOrder)
        }

        api.updateAdminRoleSortOrder(
            roleId = roleId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun updateAdminRolePermissionsBySlug(
        roleId: String,
        permissionSlugs: List<String>,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        val body = JsonObject().apply {
            val normalized = permissionSlugs
                .map { it.trim() }
                .filter { it.isNotEmpty() }
            val values = JsonArray()
            normalized.forEach(values::add)
            add("permission_slugs", values)
        }

        api.updateAdminRolePermissionsBySlug(
            roleId = roleId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
            payload = body,
        )
    }

    suspend fun deleteAdminRole(
        roleId: String,
        language: String,
        currency: AppCurrency,
        token: String,
    ) {
        api.deleteAdminRole(
            roleId = roleId,
            bearerToken = "Bearer $token",
            language = language,
            currency = currency.raw,
        )
    }

    suspend fun getRecentActivities(language: String, token: String): List<DashboardRecentActivity> {
        val payload = api.getRecentActivities(
            bearerToken = "Bearer $token",
            language = language,
        )

        return extractRows(payload, explicitKeys = listOf("activities")).map { row ->
            DashboardRecentActivity(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                title = row.stringOrNull("title", "action", "description") ?: "Activity",
                timeAgo = row.stringOrNull("time_ago"),
                action = row.stringOrNull("action"),
                type = row.stringOrNull("type"),
                actorName = row.objectOrNull("actor")?.stringOrNull("name"),
                actorRole = row.objectOrNull("actor")?.stringOrNull("role"),
                createdAtIso = row.stringOrNull("created_at", "createdAt", "timestamp"),
            )
        }.sortedWith(
            compareByDescending<DashboardRecentActivity> { it.createdAtIso.orEmpty() }
                .thenByDescending { it.id },
        )
    }

    suspend fun getProjects(
        isProvider: Boolean,
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<DashboardProjectSummary> {
        val payload = if (isProvider) {
            api.getProviderProjectRequests(
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        } else {
            api.getClientProjectRequests(
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        }

        val root = payload.asJsonObjectOrNull()
        if (root != null && root["success"].asBooleanOrNull() == false) {
            val message = root.stringOrNull("message", "error")
                ?: "Failed to load project requests."
            throw IllegalStateException(message)
        }

        return extractProjectsCollection(payload).map(::parseProject)
    }

    suspend fun respondToProjectRequest(
        projectId: String,
        response: String,
        language: String,
        token: String,
        proposedBudget: Double? = null,
        reason: String? = null,
        refusalScope: String? = null,
        milestoneIds: List<String>? = null,
        suggestionsLimit: Int? = null,
    ) {
        val body = JsonObject().apply {
            addProperty("response", response.uppercase())
            proposedBudget?.let { addProperty("proposedBudget", it) }
            reason?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("reason", it) }
            refusalScope?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("refusal_scope", it) }
            milestoneIds?.takeIf { it.isNotEmpty() }?.let { ids ->
                val array = JsonArray()
                ids.forEach(array::add)
                add("milestone_ids", array)
            }
            suggestionsLimit?.let { addProperty("suggestions_limit", it) }
        }

        api.respondToProjectRequest(
            projectId = projectId,
            bearerToken = "Bearer $token",
            language = language,
            payload = body,
        )
    }

    suspend fun markProjectMilestone(
        projectId: String,
        milestoneId: String,
        status: String,
        token: String,
    ): DashboardProjectSummary? {
        val body = JsonObject().apply {
            addProperty("milestone", milestoneId)
            addProperty("status", status.lowercase())
        }
        val payload = api.markProjectMilestone(
            projectId = projectId,
            bearerToken = "Bearer $token",
            payload = body,
        )

        val root = payload.asJsonObjectOrNull() ?: return null
        val projectObject = root.objectOrNull("project")
            ?: root.objectOrNull("data")?.objectOrNull("project")
            ?: root.objectOrNull("data")
            ?: root.takeIf { it.entrySet().isNotEmpty() }
            ?: return null
        return parseProject(projectObject)
    }

    suspend fun getServices(
        providerId: String?,
        language: String,
        currency: AppCurrency,
        token: String,
    ): List<DashboardServiceItem> {
        val payload = if (!providerId.isNullOrBlank()) {
            api.getProviderServices(
                providerId = providerId,
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        } else {
            api.getPopularServices(
                bearerToken = "Bearer $token",
                language = language,
                currency = currency.raw,
            )
        }

        return extractRows(payload, explicitKeys = listOf("services")).map { row ->
            val service = row.objectOrNull("service") ?: row
            DashboardServiceItem(
                id = service.stringOrNull("id") ?: UUID.randomUUID().toString(),
                title = localizedString(service["title"], language)
                    ?: localizedString(service["name"], language)
                    ?: service.stringOrNull("title", "name")
                    ?: "Service",
                category = localizedString(service.objectOrNull("category")?.get("name"), language)
                    ?: service.stringOrNull("category", "category_name"),
                rating = service["rating"].asDoubleOrNull(),
                reviewCount = service.asIntByPath("reviewCount", "reviews_count"),
                orderCount = service.asIntByPath("orderCount", "orders_count"),
                level = row.stringOrNull("level") ?: service.stringOrNull("level"),
                priceAmount = service.objectOrNull("price")?.get("amount").asDoubleOrNull()
                    ?: service.objectOrNull("budget")?.get("amount").asDoubleOrNull()
                    ?: service["price"].asDoubleOrNull()
                    ?: service["budget"].asDoubleOrNull(),
                currency = service.objectOrNull("price")?.stringOrNull("currency")
                    ?: service.objectOrNull("budget")?.stringOrNull("currency")
                    ?: service.stringOrNull("currency"),
            )
        }
    }

    suspend fun getChatGroups(token: String): List<DashboardChatGroup> {
        val payload = api.getChatGroups(bearerToken = bearerToken(token))
        val root = payload.asJsonObjectOrNull()
        val rows = root?.arrayOrNull("groups")?.jsonObjects()
            ?: extractRowsLikeIos(payload)

        return rows.map { row ->
            val lastMessage = row.objectOrNull("last_message")
            DashboardChatGroup(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                name = row.stringOrNull("name") ?: "Conversation",
                type = row.stringOrNull("type") ?: "DIRECT",
                unreadCount = row.asIntByPath("unreadCount", "unread_count") ?: 0,
                lastMessage = chatText(
                    translations = lastMessage?.get("translations"),
                    fallback = lastMessage?.get("content").asStringOrNull(),
                ),
                updatedAtIso = row.stringOrNull("updated_at")
                    ?: lastMessage?.stringOrNull("timestamp"),
            )
        }.sortedWith(
            compareByDescending<DashboardChatGroup> { it.unreadCount }
                .thenByDescending { it.updatedAtIso.orEmpty() },
        )
    }

    suspend fun getChatMessages(
        groupId: String,
        page: Int,
        limit: Int,
        token: String,
    ): List<DashboardChatMessage> {
        val payload = api.getChatMessages(
            groupId = groupId,
            bearerToken = bearerToken(token),
            page = page,
            limit = limit,
        )
        val root = payload.asJsonObjectOrNull()
        val rows = root?.arrayOrNull("messages")?.jsonObjects()
            ?: extractRowsLikeIos(payload)
        return rows.map { row ->
            val sender = row.objectOrNull("sender")
            val firstName = sender?.stringOrNull("firstName", "first_name").orEmpty()
            val lastName = sender?.stringOrNull("lastName", "last_name").orEmpty()
            val fullName = listOf(firstName, lastName).joinToString(" ").trim()

            DashboardChatMessage(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                senderId = row.stringOrNull("sender_id")
                    ?: sender?.stringOrNull("id")
                    ?: "",
                senderName = fullName.ifEmpty {
                    row.stringOrNull("senderName")
                        ?: sender?.stringOrNull("name")
                        ?: "User"
                },
                content = chatText(row["translations"], row.stringOrNull("content")) ?: "",
                timestampIso = row.stringOrNull("timestamp", "created_at"),
                isRead = row.asBooleanByPath("isRead", "is_read") ?: false,
            )
        }.sortedBy { it.timestampIso.orEmpty() }
    }

    suspend fun sendChatMessage(
        groupId: String,
        content: String,
        language: String,
        token: String,
    ): DashboardChatMessage? {
        val body = JsonObject().apply {
            addProperty("content", content)
            add("attachments", JsonArray())
        }

        val payload = api.sendChatMessage(
            groupId = groupId,
            bearerToken = bearerToken(token),
            language = language,
            payload = body,
        )

        val root = payload.asJsonObjectOrNull()
        val message = root?.objectOrNull("message")
            ?: root?.takeIf { it.entrySet().isNotEmpty() }
            ?: return null
        return parseChatMessage(message)
    }

    suspend fun markChatGroupRead(groupId: String, token: String) {
        api.markChatGroupRead(
            groupId = groupId,
            bearerToken = bearerToken(token),
            payload = JsonObject(),
        )
    }

    suspend fun getRapydWalletBalances(language: String, token: String): List<DashboardWalletBalance> {
        val payload = api.getRapydWalletBalances(
            bearerToken = bearerToken(token),
            language = language,
        )

        return extractRows(payload, explicitKeys = listOf("wallets")).mapNotNull { row ->
            val id = row.stringOrNull("id") ?: UUID.randomUUID().toString()
            val currency = row.stringOrNull("currency", "alias").orEmpty()
            if (currency.isBlank()) return@mapNotNull null
            DashboardWalletBalance(
                id = id,
                currency = currency,
                balance = row["balance"].asDoubleOrNull(),
                receivedBalance = row["received_balance"].asDoubleOrNull(),
                onHoldBalance = row["on_hold_balance"].asDoubleOrNull(),
            )
        }
    }

    suspend fun rapydOnboarding(language: String, token: String): DashboardRapydOnboarding {
        val payload = api.rapydOnboarding(
            bearerToken = bearerToken(token),
            language = language,
        )

        payload.asJsonObjectOrNull()?.let(::parseRapydOnboardingObject)?.let { return it }

        payload.asJsonArrayOrNull()?.let { array ->
            for (index in 0 until array.size()) {
                val value = array[index]
                value.asJsonObjectOrNull()?.let(::parseRapydOnboardingObject)?.let { return it }
            }

            for (index in 0 until array.size()) {
                val value = array[index]
                val asString = value.asStringOrNull()
                if (!asString.isNullOrBlank()) {
                    return DashboardRapydOnboarding(url = asString.trim())
                }
            }
        }

        payload.asStringOrNull()?.trim()?.takeIf { it.isNotEmpty() }?.let { url ->
            return DashboardRapydOnboarding(url = url)
        }

        return DashboardRapydOnboarding()
    }

    suspend fun createRapydPayoutBank(
        amount: Double,
        sourceCurrency: String?,
        language: String,
        appCurrency: AppCurrency,
        token: String,
    ) {
        val payload = JsonObject().apply {
            addProperty("amount", amount)
            sourceCurrency?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("currency", it) }
        }
        api.createRapydPayoutBank(
            bearerToken = bearerToken(token),
            language = language,
            currency = appCurrency.raw,
            payload = payload,
        )
    }

    suspend fun searchCompanies(query: String, limit: Int = 10): List<DashboardCompanySearchResult> {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return emptyList()

        val payload = api.searchCompanies(query = trimmed, limit = limit)
        return extractRows(payload).mapNotNull { row ->
            val name = row.stringOrNull("name").orEmpty()
            if (name.isBlank()) return@mapNotNull null
            DashboardCompanySearchResult(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                name = name,
                taxId = row.stringOrNull("tax_id"),
                tradeRegistryNumber = row.stringOrNull("trade_registry_number"),
                companyCountry = row.stringOrNull("company_country"),
                companyCity = row.stringOrNull("company_city"),
                companyZip = row.stringOrNull("company_zip"),
                companyAddress = row.stringOrNull("company_address"),
            )
        }
    }

    suspend fun getCurrencies(search: String?, token: String?): List<DashboardCurrencyOption> {
        val payload = api.getCurrencies(
            bearerToken = token?.trim()?.takeIf { it.isNotEmpty() }?.let(::bearerToken),
            search = search?.trim()?.takeIf { it.isNotEmpty() },
        )
        return extractRows(payload).mapNotNull { row ->
            val code = row.stringOrNull("code", "currency", "id")?.uppercase().orEmpty()
            if (code.isBlank()) return@mapNotNull null
            DashboardCurrencyOption(
                code = code,
                name = row.stringOrNull("name") ?: code,
                countryCode = row.stringOrNull("country_code"),
            )
        }.sortedBy { it.code }
    }

    suspend fun updateUserCompanyDetails(
        payload: DashboardCompanyDetailsPayload,
        token: String,
    ) {
        val body = JsonObject().apply {
            payload.companyId?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("company_id", it) }
            addProperty("name", payload.name)
            addProperty("represented_by", payload.representedBy)
            addProperty("email", payload.email)
            addProperty("company_address", payload.companyAddress)
            addProperty("company_city", payload.companyCity)
            addProperty("company_county", payload.companyCounty)
            addProperty("company_zip", payload.companyZip)
            addProperty("company_country", payload.companyCountry)
            addProperty("company_bank_iban", payload.companyBankIban)
            addProperty("company_bank_name", payload.companyBankName)
            addProperty("company_bank_bic", payload.companyBankBic)
            addProperty("id_type", payload.idType)
            addProperty("id_number", payload.idNumber)
            addProperty("bank_currency", payload.bankCurrency)
        }

        api.updateUserCompanyDetails(
            bearerToken = "Bearer $token",
            payload = body,
        )
    }

    suspend fun getCompanyManagers(companyId: String, token: String): List<DashboardCompanyUser> {
        val payload = api.getCompanyManagers(
            bearerToken = "Bearer $token",
            companyId = companyId,
        )

        val root = payload.asJsonObjectOrNull()
        val emailArray = root?.arrayOrNull("editor_emails")?.toStringList()
        if (!emailArray.isNullOrEmpty()) {
            return emailArray.map {
                DashboardCompanyUser(
                    id = it.trim().lowercase(),
                    email = it.trim().lowercase(),
                )
            }
        }

        return extractRows(payload, explicitKeys = listOf("editors"))
            .map(::parseCompanyUser)
            .distinctBy { it.id }
    }

    suspend fun getCompanyMembers(companyId: String, token: String): List<DashboardCompanyUser> {
        val payload = api.getCompanyMembers(
            bearerToken = "Bearer $token",
            companyId = companyId,
        )

        return extractRows(payload, explicitKeys = listOf("members"))
            .map(::parseCompanyUser)
            .distinctBy { it.id }
    }

    suspend fun searchUsersForCompany(search: String, token: String): List<DashboardCompanyUser> {
        val trimmed = search.trim()
        if (trimmed.isEmpty()) return emptyList()

        val payload = api.searchUsersForCompany(
            bearerToken = "Bearer $token",
            search = trimmed,
        )
        return extractRows(payload)
            .map(::parseCompanyUser)
            .distinctBy { it.id }
    }

    suspend fun updateCompanyEditorsOrOwnership(
        companyId: String,
        editorEmails: List<String>?,
        transferOwnerEmail: String?,
        token: String,
    ) {
        val payload = JsonObject().apply {
            addProperty("company_id", companyId)
            editorEmails?.let { emails ->
                val array = JsonArray()
                emails.forEach(array::add)
                add("editor_emails", array)
            }
            transferOwnerEmail?.trim()?.takeIf { it.isNotEmpty() }?.let {
                addProperty("transfer_owner_email", it)
            }
        }

        api.updateCompanyEditorsOrOwnership(
            bearerToken = "Bearer $token",
            payload = payload,
        )
    }

    fun getLocationCountries(): List<DashboardLocationCountry> {
        return locationCatalog.allCountries()
    }

    fun getLocationStates(countryIso: String): List<DashboardLocationState> {
        return locationCatalog.statesOf(countryIso)
    }

    fun getLocationCities(countryIso: String, stateIso: String): List<DashboardLocationCity> {
        return locationCatalog.citiesOf(countryIso = countryIso, stateIso = stateIso)
    }

    fun findLocationCountry(value: String): DashboardLocationCountry? {
        return locationCatalog.countryMatching(value)
    }

    fun normalizeLocationStateIso(countryIso: String, stateValue: String?): String {
        return locationCatalog.normalizeStateIso(countryIso = countryIso, stateValue = stateValue)
    }

    private fun parseProject(row: JsonObject): DashboardProjectSummary {
        val budgetObject = row.objectOrNull("budget")
        val milestones = extractProjectMilestones(row)
        val budgetAmount = budgetObject?.get("amount").asDoubleOrNull() ?: row["budget"].asDoubleOrNull()

        return DashboardProjectSummary(
            id = row.stringOrNull("id", "project_id") ?: UUID.randomUUID().toString(),
            slug = row.stringOrNull("slug"),
            title = row.stringOrNull("title") ?: "Untitled",
            description = row.stringOrNull("description").orEmpty(),
            status = (row.stringOrNull("status") ?: "PENDING").uppercase(),
            createdAtIso = row.stringOrNull("created_at"),
            budget = DashboardBudget(
                amount = budgetAmount,
                currency = budgetObject?.stringOrNull("currency") ?: row.stringOrNull("currency") ?: "USD",
                originalUsd = budgetObject?.get("original_usd").asDoubleOrNull(),
            ),
            category = row.stringOrNull("category"),
            deadline = row.stringOrNull("deadline"),
            offersCount = row.asIntByPath("offers_count") ?: 0,
            milestoneCount = row.asIntByPath("milestone_count") ?: milestones.size,
            providersCount = row.arrayOrNull("providers")?.size() ?: 0,
            milestones = milestones,
        )
    }

    private fun extractProjectsCollection(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()

        root.arrayOrNull("projects")?.jsonObjects()?.takeIf { it.isNotEmpty() }?.let { return it }
        root.objectOrNull("data")?.arrayOrNull("projects")?.jsonObjects()?.takeIf { it.isNotEmpty() }?.let { return it }
        root.arrayOrNull("data")?.jsonObjects()?.takeIf { it.isNotEmpty() }?.let { return it }
        root.objectOrNull("projects")?.arrayOrNull("data")?.jsonObjects()?.takeIf { it.isNotEmpty() }?.let { return it }

        return emptyList()
    }

    private fun extractProjectMilestones(project: JsonObject): List<DashboardProjectMilestone> {
        val directMilestones = project.arrayOrNull("project_line_milestones")?.jsonObjects().orEmpty()

        val lineMilestones = project.arrayOrNull("project_lines")?.jsonObjects().orEmpty().flatMap { line ->
            line.arrayOrNull("milestones")?.jsonObjects().orEmpty().map { milestone ->
                milestone.deepCopy().apply {
                    if (stringOrNull("project_line_id").isNullOrBlank()) {
                        line.stringOrNull("id")?.let { addProperty("project_line_id", it) }
                    }
                    if (stringOrNull("service_name").isNullOrBlank()) {
                        line.stringOrNull("service_name")?.let { addProperty("service_name", it) }
                    }
                }
            }
        }

        var rootMilestones = project.arrayOrNull("milestones")?.jsonObjects().orEmpty()
        if (rootMilestones.any { it.arrayOrNull("milestones")?.size() ?: 0 > 0 }) {
            rootMilestones = rootMilestones.flatMap { bucket ->
                val providerId = bucket.stringOrNull("providerId", "provider_id")
                bucket.arrayOrNull("milestones")?.jsonObjects().orEmpty().map { milestone ->
                    milestone.deepCopy().apply {
                        if (stringOrNull("assigned_provider_id").isNullOrBlank() && !providerId.isNullOrBlank()) {
                            addProperty("assigned_provider_id", providerId)
                        }
                    }
                }
            }
        }

        val sourceRows = when {
            directMilestones.isNotEmpty() -> directMilestones
            lineMilestones.isNotEmpty() -> lineMilestones
            else -> rootMilestones
        }

        val seenIds = mutableSetOf<String>()
        return sourceRows.mapNotNull { row ->
            val milestoneId = row.stringOrNull("id", "milestone_id", "milestoneId", "uuid") ?: UUID.randomUUID().toString()
            if (!seenIds.add(milestoneId)) return@mapNotNull null

            DashboardProjectMilestone(
                id = milestoneId,
                title = row.stringOrNull("title", "name") ?: "Milestone",
                amount = row["amount"].asDoubleOrNull(),
                proposedAmount = row["proposed_amount"].asDoubleOrNull() ?: row["proposedAmount"].asDoubleOrNull(),
                percentage = row["percentage"].asDoubleOrNull(),
                status = (row.stringOrNull("status") ?: "PENDING").uppercase(),
                budgetStatus = (row.stringOrNull("budget_status", "budgetStatus") ?: "PENDING").uppercase(),
                paymentStatus = row.stringOrNull("payment_status", "paymentStatus"),
                assignedProviderId = row.stringOrNull(
                    "assigned_provider_id",
                    "assignedProviderId",
                    "provider_id",
                    "providerId",
                ),
                serviceName = row.stringOrNull("service_name", "serviceName"),
                projectLineId = row.stringOrNull("project_line_id", "projectLineId"),
                sortOrder = row.asIntByPath("sequence", "order", "order_index", "orderIndex", "position"),
            )
        }
    }

    private fun parseChatMessage(row: JsonObject): DashboardChatMessage {
        val sender = row.objectOrNull("sender")
        val firstName = sender?.stringOrNull("firstName", "first_name").orEmpty()
        val lastName = sender?.stringOrNull("lastName", "last_name").orEmpty()
        val fullName = listOf(firstName, lastName).joinToString(" ").trim()

        return DashboardChatMessage(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            senderId = row.stringOrNull("sender_id") ?: sender?.stringOrNull("id") ?: "",
            senderName = fullName.ifEmpty {
                row.stringOrNull("senderName") ?: sender?.stringOrNull("name") ?: "User"
            },
            content = chatText(row["translations"], row.stringOrNull("content")) ?: "",
            timestampIso = row.stringOrNull("timestamp", "created_at"),
            isRead = row.asBooleanByPath("isRead", "is_read") ?: false,
        )
    }

    // Mirrors iOS `extractDictionaryArray` fallback semantics for chat payloads.
    private fun extractRowsLikeIos(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("data")?.let { return it.jsonObjects() }

        val nestedData = root.objectOrNull("data")
        nestedData?.arrayOrNull("data")?.let { return it.jsonObjects() }
        if (nestedData != null && nestedData.entrySet().isNotEmpty()) {
            return listOf(nestedData)
        }

        return if (root.entrySet().isNotEmpty()) listOf(root) else emptyList()
    }

    private fun parseCompanyUser(row: JsonObject): DashboardCompanyUser {
        val userId = row.stringOrNull("id", "user_id")
        val email = row.stringOrNull("email")
        val normalizedEmail = email?.trim()?.lowercase()
        return DashboardCompanyUser(
            id = normalizedEmail?.takeIf { it.isNotEmpty() } ?: userId ?: UUID.randomUUID().toString(),
            userId = userId,
            firstName = row.stringOrNull("firstName", "first_name"),
            lastName = row.stringOrNull("lastName", "last_name"),
            email = email,
            avatar = row.stringOrNull("avatar"),
        )
    }

    private fun buildAdminCategoryBody(draft: AdminCategoryEditorDraft): JsonObject {
        val trimmedParentId = draft.parentId.trim().takeIf { it.isNotEmpty() }
        return JsonObject().apply {
            addProperty("name", draft.name.trim())
            addProperty("slug", draft.slug.trim())
            addProperty("description", draft.description.trim())
            addProperty("icon", draft.icon.trim())
            addProperty("sortOrder", draft.sortOrder)
            addProperty("sort_order", draft.sortOrder)
            if (trimmedParentId != null) {
                addProperty("parentId", trimmedParentId)
                addProperty("parent_id", trimmedParentId)
            } else {
                add("parentId", com.google.gson.JsonNull.INSTANCE)
                add("parent_id", com.google.gson.JsonNull.INSTANCE)
            }
        }
    }

    private fun parseAdminCategoriesCollection(
        payload: JsonElement,
        language: String,
        defaultPerPage: Int,
    ): AdminCategoriesCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map { parseAdminCategorySummary(it, language) }
            val perPage = maxOf(1, parsed.size)
            return AdminCategoriesCollection(
                categories = parsed,
                total = parsed.size,
                currentPage = 1,
                perPage = perPage,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminCategoriesCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminCategoryRows(payload)
        val categories = rows.map { parseAdminCategorySummary(it, language) }

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: categories.size
        val currentPage = root.intOrNull("current_page", "page")
            ?: dataObject?.intOrNull("current_page", "page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val resolvedPerPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, resolvedPerPage)
        val explicitLastPage = root.intOrNull("last_page", "total_pages")
            ?: dataObject?.intOrNull("last_page", "total_pages")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminCategoriesCollection(
            categories = categories,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminCategoryRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("categories")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("category")?.let { return listOf(it) }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("categories")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminCategorySummary(
        row: JsonObject,
        language: String,
    ): AdminCategorySummary {
        return AdminCategorySummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = localizedString(row["name"], language)
                ?: row.stringOrNull("name")
                ?: "Category",
            description = localizedString(row["description"], language)
                ?: row.stringOrNull("description")
                ?: "",
            slug = row.stringOrNull("slug") ?: "",
            parentId = row.stringOrNull("parent_id", "parentId"),
            sortOrder = row.intOrNull("sortOrder", "sort_order", "order") ?: 0,
            icon = row.stringOrNull("icon"),
            isActive = row.booleanOrNull("isActive", "is_active") ?: true,
        )
    }

    private fun parseAdminCategoryDetail(
        row: JsonObject,
        language: String,
    ): AdminCategoryDetail {
        val summary = parseAdminCategorySummary(row = row, language = language)
        return AdminCategoryDetail(
            id = summary.id,
            name = summary.name,
            slug = summary.slug,
            description = summary.description,
            icon = summary.icon.orEmpty(),
            parentId = summary.parentId,
            sortOrder = summary.sortOrder,
            isActive = summary.isActive,
        )
    }

    private fun parseAdminLegalClausesCollection(
        payload: JsonElement,
        defaultPerPage: Int,
    ): AdminLegalClausesCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminLegalClause)
            val perPage = maxOf(1, parsed.size)
            return AdminLegalClausesCollection(
                clauses = parsed,
                total = parsed.size,
                currentPage = 1,
                perPage = perPage,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminLegalClausesCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminLegalClauseRows(payload)
        val clauses = rows.map(::parseAdminLegalClause)

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: clauses.size
        val currentPage = root.intOrNull("current_page", "page")
            ?: dataObject?.intOrNull("current_page", "page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val resolvedPerPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, resolvedPerPage)
        val explicitLastPage = root.intOrNull("last_page", "total_pages")
            ?: dataObject?.intOrNull("last_page", "total_pages")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminLegalClausesCollection(
            clauses = clauses,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminLegalClauseRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("clauses")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("clause")?.let { return listOf(it) }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("clauses")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.objectOrNull("clause")?.let { return listOf(it) }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminLegalClause(row: JsonObject): AdminLegalClause {
        return AdminLegalClause(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            identifier = row.stringOrNull("identifier").orEmpty(),
            category = row.stringOrNull("category").orEmpty(),
            content = parseAdminLegalClauseContent(row["content"]),
            createdAtIso = row.stringOrNull("created_at"),
            updatedAtIso = row.stringOrNull("updated_at"),
        )
    }

    private fun parseAdminLegalClauseContent(raw: JsonElement?): Map<String, String> {
        if (raw == null || raw.isJsonNull) return emptyMap()

        if (raw.isJsonObject) {
            val values = linkedMapOf<String, String>()
            raw.asJsonObject.entrySet().forEach { (key, value) ->
                val languageCode = key.trim()
                if (languageCode.isEmpty()) return@forEach
                val text = parseAdminLegalClauseContentValue(value)?.trim().orEmpty()
                if (text.isNotEmpty()) {
                    values[languageCode] = text
                }
            }
            return values
        }

        if (raw.isJsonPrimitive) {
            val text = raw.asStringOrNull()?.trim().orEmpty()
            if (text.isEmpty()) {
                return emptyMap()
            }
            val parsedObject = runCatching { JsonParser.parseString(text) }
                .getOrNull()
                ?.takeIf { it.isJsonObject }
            if (parsedObject != null) {
                return parseAdminLegalClauseContent(parsedObject)
            }
        }

        return emptyMap()
    }

    private fun parseAdminLegalClauseContentValue(raw: JsonElement?): String? {
        if (raw == null || raw.isJsonNull) return null
        if (raw.isJsonPrimitive) return raw.asStringOrNull()

        if (raw.isJsonObject) {
            val objectValue = raw.asJsonObject
            return objectValue.stringOrNull("value", "text", "content")
                ?: objectValue.entrySet().firstNotNullOfOrNull { (_, nested) -> nested.asStringOrNull() }
        }

        if (raw.isJsonArray) {
            return if (raw.asJsonArray.size() > 0) {
                raw.asJsonArray[0].asStringOrNull()
            } else {
                null
            }
        }

        return null
    }

    private fun parseAdminNewsletterSubscribersCollection(
        payload: JsonElement,
        defaultPerPage: Int,
    ): AdminNewsletterSubscribersCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminNewsletterSubscriber)
            val perPage = maxOf(1, parsed.size)
            return AdminNewsletterSubscribersCollection(
                subscribers = parsed,
                total = parsed.size,
                perPage = perPage,
                currentPage = 1,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminNewsletterSubscribersCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val paginationRoot = root.objectOrNull("pagination")
        val paginationNested = dataObject?.objectOrNull("pagination")

        val rows = parseAdminNewsletterSubscriberRows(payload)
        val subscribers = rows.map(::parseAdminNewsletterSubscriber)

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: paginationRoot?.intOrNull("total")
            ?: paginationNested?.intOrNull("total")
            ?: subscribers.size
        val perPageRaw = root.intOrNull("per_page")
            ?: dataObject?.intOrNull("per_page")
            ?: paginationRoot?.intOrNull("per_page")
            ?: paginationNested?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, perPageRaw)
        val currentPage = root.intOrNull("current_page")
            ?: dataObject?.intOrNull("current_page")
            ?: paginationRoot?.intOrNull("current_page")
            ?: paginationNested?.intOrNull("current_page")
            ?: 1
        val explicitLastPage = root.intOrNull("last_page")
            ?: dataObject?.intOrNull("last_page")
            ?: paginationRoot?.intOrNull("last_page")
            ?: paginationNested?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminNewsletterSubscribersCollection(
            subscribers = subscribers,
            total = maxOf(0, total),
            perPage = perPage,
            currentPage = maxOf(1, currentPage),
            lastPage = lastPage,
        )
    }

    private fun parseAdminNewsletterSubscriberRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("subscribers")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("subscribers")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminNewsletterSubscriber(row: JsonObject): AdminNewsletterSubscriber {
        return AdminNewsletterSubscriber(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            email = row.stringOrNull("email") ?: "-",
            name = row.stringOrNull("name"),
            userType = row.stringOrNull("user_type", "userType") ?: "client",
            company = row.stringOrNull("company"),
            language = row.stringOrNull("language"),
            subscribedAtIso = row.stringOrNull("subscribed_at"),
            unsubscribedAtIso = row.stringOrNull("unsubscribed_at"),
        )
    }

    private fun parseAdminActivitiesCollection(payload: JsonElement): AdminActivitiesCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminActivityEntry)
            val perPage = maxOf(1, parsed.size)
            return AdminActivitiesCollection(
                activities = parsed,
                total = parsed.size,
                perPage = perPage,
                currentPage = 1,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminActivitiesCollection()
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminActivityRows(payload)
        val activities = rows.map(::parseAdminActivityEntry)

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: activities.size
        val perPage = root.intOrNull("per_page")
            ?: dataObject?.intOrNull("per_page")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: activities.size
        val currentPage = root.intOrNull("current_page")
            ?: dataObject?.intOrNull("current_page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val lastPage = root.intOrNull("last_page")
            ?: dataObject?.intOrNull("last_page")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
            ?: 1

        return AdminActivitiesCollection(
            activities = activities,
            total = maxOf(0, total),
            perPage = maxOf(0, perPage),
            currentPage = maxOf(1, currentPage),
            lastPage = maxOf(1, lastPage),
        )
    }

    private fun parseAdminActivityRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("activities")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("activities")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminActivityEntry(row: JsonObject): AdminActivityEntry {
        return AdminActivityEntry(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            type = row.stringOrNull("type") ?: "unknown",
            metadata = parseAdminActivityMetadata(row["metadata"]),
            readAtIso = row.stringOrNull("read_at"),
            createdAtIso = row.stringOrNull("created_at"),
            createdAtHuman = row.stringOrNull("created_at_human").orEmpty(),
        )
    }

    private fun parseAdminActivityMetadata(raw: JsonElement?): Map<String, String> {
        if (raw == null || raw.isJsonNull) return emptyMap()
        val objectValue = raw.asJsonObjectOrNull() ?: return emptyMap()

        val parsed = linkedMapOf<String, String>()
        objectValue.entrySet().forEach { (key, value) ->
            if (key.isBlank()) return@forEach

            val resolved = when {
                value.isJsonNull -> null
                value.isJsonPrimitive -> value.asStringOrNull()
                value.isJsonObject -> value.asJsonObject.toString()
                value.isJsonArray -> value.asJsonArray.toString()
                else -> null
            }?.trim()

            if (!resolved.isNullOrEmpty()) {
                parsed[key] = resolved
            }
        }
        return parsed
    }

    private fun parseAdminAuditLogsCollection(payload: JsonElement): AdminAuditLogsCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminAuditLogEntry)
            return AdminAuditLogsCollection(
                logs = parsed,
                total = parsed.size,
                currentPage = 1,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminAuditLogsCollection()
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminAuditLogRows(payload)
        val logs = rows.map(::parseAdminAuditLogEntry)

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: logs.size
        val currentPage = root.intOrNull("current_page")
            ?: dataObject?.intOrNull("current_page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val lastPage = root.intOrNull("last_page")
            ?: dataObject?.intOrNull("last_page")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
            ?: 1

        return AdminAuditLogsCollection(
            logs = logs,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            lastPage = maxOf(1, lastPage),
        )
    }

    private fun parseAdminAuditLogRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("logs")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("logs")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminAuditLogEntry(row: JsonObject): AdminAuditLogEntry {
        return AdminAuditLogEntry(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            actorName = row.stringOrNull("actor_name", "actorName") ?: "-",
            action = row.stringOrNull("action") ?: "-",
            event = (row.stringOrNull("event") ?: "unknown").lowercase(),
            subjectType = row.stringOrNull("subject_type", "subjectType") ?: "-",
            subjectId = row.stringOrNull("subject_id", "subjectId") ?: "-",
            oldValues = parseAdminAuditLogValueMap(row["old_values"]),
            newValues = parseAdminAuditLogValueMap(row["new_values"]),
            ip = row.stringOrNull("ip") ?: "-",
            createdAtIso = row.stringOrNull("created_at"),
        )
    }

    private fun parseAdminAuditLogValueMap(raw: JsonElement?): Map<String, String> {
        if (raw == null || raw.isJsonNull) return emptyMap()
        val objectValue = raw.asJsonObjectOrNull() ?: return emptyMap()

        val parsed = linkedMapOf<String, String>()
        objectValue.entrySet().forEach { (key, value) ->
            if (key.isBlank()) return@forEach
            val resolved = parseAdminAuditLogValueToString(value)?.trim().orEmpty()
            if (resolved.isNotEmpty()) {
                parsed[key] = resolved
            }
        }
        return parsed
    }

    private fun parseAdminAuditLogValueToString(raw: JsonElement?): String? {
        if (raw == null || raw.isJsonNull) return null
        return when {
            raw.isJsonPrimitive -> raw.asStringOrNull()
            raw.isJsonObject -> raw.asJsonObject.toString()
            raw.isJsonArray -> raw.asJsonArray.toString()
            else -> null
        }
    }

    private fun parseAdminCallsCollection(
        payload: JsonElement,
        language: String,
        defaultPerPage: Int,
    ): AdminCallsCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map { parseAdminCallSummary(it, language) }
            val perPage = maxOf(1, parsed.size)
            return AdminCallsCollection(
                calls = parsed,
                total = parsed.size,
                currentPage = 1,
                perPage = perPage,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminCallsCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminCallRows(payload)
        val calls = rows.map { parseAdminCallSummary(it, language) }

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: calls.size
        val currentPage = root.intOrNull("current_page", "page")
            ?: dataObject?.intOrNull("current_page", "page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val resolvedPerPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, resolvedPerPage)
        val explicitLastPage = root.intOrNull("last_page", "total_pages")
            ?: dataObject?.intOrNull("last_page", "total_pages")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminCallsCollection(
            calls = calls,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminCallRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("calls")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("call")?.let { return listOf(it) }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("calls")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminCallSummary(
        row: JsonObject,
        language: String,
    ): AdminCallSummary {
        return AdminCallSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            status = (row.stringOrNull("status") ?: "WAITING").uppercase(),
            passedValue = row.intOrNull("passed", "is_passed"),
            dateTimeIso = row.stringOrNull("date_time", "scheduled_at"),
            createdAtIso = row.stringOrNull("created_at"),
            callUrl = row.stringOrNull("call_url", "url"),
            interviewer = row.objectOrNull("interviewer")?.let(::parseAdminCallUserSummary),
            attendee = row.objectOrNull("attendees", "attendee")?.let(::parseAdminCallUserSummary),
            service = row.objectOrNull("service")?.let { parseAdminCallServiceSummary(it, language) },
            testResult = row.objectOrNull("test_result", "testResult")?.let(::parseAdminCallTestResultSummary),
            resultsCount = row.intOrNull("results_count") ?: row.arrayOrNull("results")?.size() ?: 0,
            note = row.stringOrNull("note"),
        )
    }

    private fun parseAdminCallUserSummary(row: JsonObject): AdminCallUserSummary {
        return AdminCallUserSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            firstName = row.stringOrNull("firstName", "first_name").orEmpty(),
            lastName = row.stringOrNull("lastName", "last_name").orEmpty(),
            email = row.stringOrNull("email").orEmpty(),
        )
    }

    private fun parseAdminCallServiceSummary(
        row: JsonObject,
        language: String,
    ): AdminCallServiceSummary {
        val category = row.objectOrNull("category")
        return AdminCallServiceSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            title = localizedString(row["name"], language)
                ?: localizedString(row["title"], language)
                ?: row.stringOrNull("name", "title")
                ?: "-",
            categoryName = localizedString(category?.get("name"), language)
                ?: category?.stringOrNull("name")
                ?: row.stringOrNull("category_name")
                ?: "-",
        )
    }

    private fun parseAdminCallTestResultSummary(row: JsonObject): AdminCallTestResultSummary {
        return AdminCallTestResultSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            skillTestId = row.stringOrNull("skill_test_id", "skillTestId", "test_id"),
            score = row.doubleOrNull("score", "result") ?: 0.0,
            passed = row.booleanOrNull("passed"),
        )
    }

    private fun parseAdminOrdersCollection(
        payload: JsonElement,
        language: String,
        defaultPerPage: Int,
    ): AdminOrdersCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map { parseAdminOrderSummary(it, language) }
            val perPage = maxOf(1, parsed.size)
            return AdminOrdersCollection(
                orders = parsed,
                total = parsed.size,
                currentPage = 1,
                perPage = perPage,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminOrdersCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminOrderRows(payload)
        val orders = rows.map { parseAdminOrderSummary(it, language) }

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: orders.size
        val currentPage = root.intOrNull("current_page", "page")
            ?: dataObject?.intOrNull("current_page", "page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val resolvedPerPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, resolvedPerPage)
        val explicitLastPage = root.intOrNull("last_page", "total_pages")
            ?: dataObject?.intOrNull("last_page", "total_pages")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminOrdersCollection(
            orders = orders,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminOrderRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("orders")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("order")?.let { return listOf(it) }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("orders")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.objectOrNull("order")?.let { return listOf(it) }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminOrderSummary(
        row: JsonObject,
        language: String,
    ): AdminOrderSummary {
        val serviceObject = row.objectOrNull("service")
        val clientObject = row.objectOrNull("client", "client_user", "customer")
        val providerObject = row.objectOrNull("provider", "provider_user", "seller")

        val id = row.stringOrNull("id") ?: UUID.randomUUID().toString()
        val orderNumber = row.stringOrNull("orderNumber", "order_number", "number") ?: id
        val amount = row.doubleOrNull("amount", "total", "budget") ?: 0.0
        val currency = (row.stringOrNull("currency") ?: "USD").uppercase()
        val status = (row.stringOrNull("status") ?: "PENDING").uppercase()
        val paymentStatus = (row.stringOrNull("paymentStatus", "payment_status") ?: "PENDING").uppercase()

        val deliverables = parseAdminOrderDeliverables(row)

        return AdminOrderSummary(
            id = id,
            orderNumber = orderNumber,
            amount = amount,
            currency = currency,
            status = status,
            paymentStatus = paymentStatus,
            createdAtIso = row.stringOrNull("createdAt", "created_at"),
            deliveryDateIso = row.stringOrNull("deliveryDate", "delivery_date", "deadline"),
            requirements = row.stringOrNull("requirements", "description").orEmpty(),
            clientNotes = row.stringOrNull("clientNotes", "client_notes").orEmpty(),
            providerNotes = row.stringOrNull("providerNotes", "provider_notes").orEmpty(),
            adminNotes = row.stringOrNull("adminNotes", "admin_notes").orEmpty(),
            deliverables = deliverables,
            service = serviceObject?.let { parseAdminOrderServiceSummary(it, language) },
            client = clientObject?.let(::parseAdminOrderParticipantSummary),
            provider = providerObject?.let(::parseAdminOrderParticipantSummary),
        )
    }

    private fun parseAdminOrderParticipantSummary(row: JsonObject): AdminOrderParticipantSummary {
        return AdminOrderParticipantSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            firstName = row.stringOrNull("firstName", "first_name").orEmpty(),
            lastName = row.stringOrNull("lastName", "last_name").orEmpty(),
            email = row.stringOrNull("email").orEmpty(),
            avatarUrl = row.stringOrNull("avatar", "profile_photo_url"),
        )
    }

    private fun parseAdminOrderServiceSummary(
        row: JsonObject,
        language: String,
    ): AdminOrderServiceSummary {
        val category = row.objectOrNull("category")
        return AdminOrderServiceSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            title = localizedString(row["title"], language)
                ?: localizedString(row["name"], language)
                ?: row.stringOrNull("title", "name")
                ?: "-",
            categoryName = localizedString(category?.get("name"), language)
                ?: category?.stringOrNull("name")
                ?: row.stringOrNull("category_name")
                ?: "-",
        )
    }

    private fun parseAdminOrderDeliverables(row: JsonObject): List<String> {
        val result = mutableListOf<String>()
        val seen = linkedSetOf<String>()

        fun appendValue(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isEmpty()) return
            val key = normalized.lowercase()
            if (seen.add(key)) {
                result.add(normalized)
            }
        }

        fun appendFromElement(element: JsonElement?) {
            when {
                element == null || element.isJsonNull -> return
                element.isJsonPrimitive -> {
                    appendValue(element.asStringOrNull())
                }

                element.isJsonObject -> {
                    val obj = element.asJsonObject
                    appendValue(obj.stringOrNull("title", "name", "description"))
                }

                element.isJsonArray -> {
                    element.asJsonArray.forEach(::appendFromElement)
                }
            }
        }

        appendFromElement(row["deliverables"])
        appendFromElement(row["project_deliverables"])
        return result
    }

    private fun parseAdminTestStatistics(
        payload: JsonElement,
        language: String,
    ): AdminTestStatistics {
        val root = payload.asJsonObjectOrNull() ?: JsonObject()
        val base = root.objectOrNull("data") ?: root
        val testResultValue = base["test_results"] ?: base["testResult"]
        val testResult = when {
            testResultValue?.isJsonObject == true -> testResultValue.asJsonObject
            testResultValue?.isJsonArray == true -> testResultValue.asJsonArray.jsonObjects().firstOrNull()
            else -> null
        } ?: JsonObject()

        val user = testResult.objectOrNull("user")
        val userFirstName = user?.stringOrNull("firstName", "first_name").orEmpty()
        val userLastName = user?.stringOrNull("lastName", "last_name").orEmpty()
        val userFullName = listOf(userFirstName, userLastName).joinToString(" ").trim().ifEmpty { "-" }
        val service = base.objectOrNull("service")

        val passed = testResult.booleanOrNull("passed")
            ?: testResult.stringOrNull("passed")?.let { value ->
                val normalized = value.trim().lowercase()
                normalized == "yes" || normalized == "true" || normalized == "1"
            }
            ?: false

        val questions = base.arrayOrNull("questions")
            ?.jsonObjects()
            ?.map(::parseAdminTestQuestion)
            .orEmpty()
        val questionResults = testResult.arrayOrNull("question_results")
            ?.jsonObjects()
            ?.map(::parseAdminTestQuestionResult)
            .orEmpty()

        return AdminTestStatistics(
            id = base.stringOrNull("id") ?: UUID.randomUUID().toString(),
            title = localizedString(base["title"], language)
                ?: base.stringOrNull("title")
                ?: "Test",
            level = (base.stringOrNull("level") ?: "JUNIOR").uppercase(),
            serviceTitle = localizedString(service?.get("title"), language)
                ?: localizedString(service?.get("name"), language)
                ?: service?.stringOrNull("title", "name")
                ?: "-",
            userFullName = userFullName,
            passed = passed,
            score = testResult.doubleOrNull("score") ?: 0.0,
            timeSpentMinutes = testResult.intOrNull("timeSpent", "time_spent") ?: 0,
            questions = questions,
            questionResults = questionResults,
        )
    }

    private fun parseAdminTestQuestion(row: JsonObject): AdminTestQuestion {
        val normalizedType = AdminTestQuestion.normalizedQuestionType(
            row.stringOrNull("type") ?: "SINGLE_CHOICE",
        )
        val meta = parseAdminTestQuestionMeta(row["meta"])

        return AdminTestQuestion(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            type = normalizedType,
            question = row.stringOrNull("question").orEmpty(),
            points = row.intOrNull("points") ?: 0,
            options = parseAdminTestStringArray(row["options"]),
            correctAnswers = parseAdminTestStringArray(row["correct_answers"] ?: row["correctAnswers"]),
            explanation = row.stringOrNull("explanation")
                ?: meta.stringOrNull("explanation")
                ?: "",
            codeTemplate = row.stringOrNull("codeTemplate", "code_template")
                ?: meta.stringOrNull("codeTemplate", "code_template")
                ?: "",
            codeSolution = row.stringOrNull("codeSolution", "code_solution")
                ?: meta.stringOrNull("codeSolution", "code_solution")
                ?: "",
            expectedOutput = row.stringOrNull("expectedOutput", "expected_output")
                ?: meta.stringOrNull("expectedOutput", "expected_output")
                ?: "",
            testCases = parseAdminTestCases(meta["testCases"] ?: meta["test_cases"]),
            order = row.intOrNull("order") ?: 0,
        )
    }

    private fun parseAdminTestQuestionResult(row: JsonObject): AdminTestQuestionResult {
        return AdminTestQuestionResult(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            questionId = row.stringOrNull("skill_test_question_id", "question_id").orEmpty(),
            answer = parseAdminTestStringArray(row["answer"]),
            pointsEarned = row.doubleOrNull("points_earned", "pointsEarned") ?: 0.0,
            isCorrect = row.booleanOrNull("is_correct", "isCorrect") ?: false,
        )
    }

    private fun parseAdminTestQuestionMeta(raw: JsonElement?): JsonObject {
        if (raw == null) return JsonObject()
        if (raw.isJsonObject) return raw.asJsonObject
        val rawText = raw.asStringOrNull()?.trim().orEmpty()
        if (rawText.isEmpty()) return JsonObject()
        return runCatching {
            val parsed = JsonParser.parseString(rawText)
            if (parsed.isJsonObject) parsed.asJsonObject else JsonObject()
        }.getOrElse { JsonObject() }
    }

    private fun parseAdminTestStringArray(raw: JsonElement?): List<String> {
        if (raw == null || raw.isJsonNull) return emptyList()

        val result = mutableListOf<String>()
        val seen = linkedSetOf<String>()
        fun append(rawText: String?) {
            val normalized = rawText?.trim().orEmpty()
            if (normalized.isEmpty()) return
            val key = normalized.lowercase()
            if (seen.add(key)) {
                result.add(normalized)
            }
        }

        if (raw.isJsonArray) {
            raw.asJsonArray.forEach { item ->
                if (item.isJsonPrimitive) {
                    append(item.asStringOrNull())
                } else if (item.isJsonObject) {
                    append(item.asJsonObject.stringOrNull("value", "label", "name", "title"))
                }
            }
            return result
        }

        val text = raw.asStringOrNull()?.trim().orEmpty()
        if (text.isEmpty()) return emptyList()
        runCatching {
            val parsed = JsonParser.parseString(text)
            if (parsed.isJsonArray) {
                parsed.asJsonArray.forEach { item ->
                    if (item.isJsonPrimitive) {
                        append(item.asStringOrNull())
                    } else if (item.isJsonObject) {
                        append(item.asJsonObject.stringOrNull("value", "label", "name", "title"))
                    }
                }
                return result
            }
        }

        text.split(",").forEach { append(it) }
        return result
    }

    private fun parseAdminTestCases(raw: JsonElement?): List<AdminTestQuestionTestCase> {
        if (raw == null || raw.isJsonNull) return emptyList()

        val rows: List<JsonObject> = when {
            raw.isJsonArray -> raw.asJsonArray.jsonObjects()
            raw.isJsonPrimitive -> {
                val text = raw.asStringOrNull()?.trim().orEmpty()
                if (text.isEmpty()) {
                    emptyList()
                } else {
                    runCatching {
                        val parsed = JsonParser.parseString(text)
                        if (parsed.isJsonArray) parsed.asJsonArray.jsonObjects() else emptyList()
                    }.getOrElse { emptyList() }
                }
            }

            else -> emptyList()
        }

        return rows.map { row ->
            AdminTestQuestionTestCase(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                input = row.stringOrNull("input").orEmpty(),
                expectedOutput = row.stringOrNull("expectedOutput", "expected_output").orEmpty(),
                description = row.stringOrNull("description").orEmpty(),
            )
        }
    }

    private fun parseAdminRolesCollection(
        payload: JsonElement,
        defaultPageSize: Int,
    ): AdminRolesCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminRoleSummary)
            val pageSize = maxOf(1, parsed.size)
            return AdminRolesCollection(
                roles = parsed,
                total = parsed.size,
                currentPage = 1,
                lastPage = 1,
                pageSize = pageSize,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminRolesCollection(pageSize = maxOf(1, defaultPageSize))
        val dataObject = root.objectOrNull("data")

        val roles = parseAdminRoleRows(payload).map(::parseAdminRoleSummary)

        val total = root.intOrNull("count", "total")
            ?: dataObject?.intOrNull("total")
            ?: roles.size

        val currentPage = root.intOrNull("page", "current_page")
            ?: dataObject?.intOrNull("current_page")
            ?: 1

        val resolvedPageSize = root.intOrNull("page_size", "per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: defaultPageSize
        val pageSize = maxOf(1, resolvedPageSize)

        val explicitLastPage = root.intOrNull("last_page")
            ?: dataObject?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + pageSize - 1) / pageSize)

        return AdminRolesCollection(
            roles = roles,
            total = total,
            currentPage = maxOf(1, currentPage),
            lastPage = lastPage,
            pageSize = pageSize,
        )
    }

    private fun parseAdminRoleRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()

        root.arrayOrNull("results")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("roles")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        root.objectOrNull("role")?.let { return listOf(it) }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("roles")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminRoleSummary(row: JsonObject): AdminRoleSummary {
        val permissionsCount = when {
            row.arrayOrNull("permissions") != null -> row.arrayOrNull("permissions")!!.size()
            row.arrayOrNull("permission_slugs") != null -> row.arrayOrNull("permission_slugs")!!.size()
            row.arrayOrNull("permission_slug") != null -> row.arrayOrNull("permission_slug")!!.size()
            else -> 0
        }

        return AdminRoleSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = row.stringOrNull("name") ?: "-",
            slug = row.stringOrNull("slug") ?: "-",
            description = row.stringOrNull("description").orEmpty(),
            sortOrder = row.intOrNull("sort_order", "sortOrder"),
            permissionsCount = permissionsCount,
        )
    }

    private fun parseAdminRoleDetail(row: JsonObject): AdminRoleDetail {
        val permissionIds = when {
            row.arrayOrNull("permissions") != null -> {
                row.arrayOrNull("permissions")!!.mapNotNull { value ->
                    when {
                        value.isJsonObject -> value.asJsonObject.stringOrNull("id")
                        value.isJsonPrimitive -> value.asStringOrNull()
                        else -> null
                    }
                }
            }

            else -> emptyList()
        }

        return AdminRoleDetail(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = row.stringOrNull("name").orEmpty(),
            slug = row.stringOrNull("slug").orEmpty(),
            description = row.stringOrNull("description").orEmpty(),
            sortOrder = row.intOrNull("sort_order", "sortOrder") ?: 0,
            permissionIds = permissionIds,
        )
    }

    private fun parseAdminPermissionGroupRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("permissions")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("permissions")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminPermissionGroup(row: JsonObject): AdminPermissionGroup {
        val permissions = row.arrayOrNull("permissions")?.jsonObjects()?.map(::parseAdminPermissionSummary).orEmpty()
        return AdminPermissionGroup(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = row.stringOrNull("name") ?: "-",
            slug = row.stringOrNull("slug") ?: "-",
            permissions = permissions,
        )
    }

    private fun parseAdminPermissionSummary(row: JsonObject): AdminPermissionSummary {
        return AdminPermissionSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            groupId = row.stringOrNull("permission_group_id"),
            name = row.stringOrNull("name") ?: "-",
            slug = row.stringOrNull("slug") ?: "-",
            description = row.stringOrNull("description").orEmpty(),
            isActive = row.booleanOrNull("is_active") ?: true,
        )
    }

    private fun parseAdminRolePermissionSlugs(payload: JsonElement): List<String> {
        val result = mutableListOf<String>()
        val seen = linkedSetOf<String>()

        fun append(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isEmpty()) return
            if (seen.add(normalized.lowercase())) {
                result.add(normalized)
            }
        }

        fun appendFromArray(array: JsonArray) {
            array.forEach { value ->
                when {
                    value.isJsonObject -> append(value.asJsonObject.stringOrNull("slug"))
                    value.isJsonPrimitive -> append(value.asStringOrNull())
                }
            }
        }

        if (payload.isJsonArray) {
            appendFromArray(payload.asJsonArray)
            return result
        }

        if (payload.isJsonPrimitive) {
            val text = payload.asStringOrNull()?.trim().orEmpty()
            if (text.isEmpty()) return emptyList()
            runCatching { JsonParser.parseString(text) }.getOrNull()?.let { parsed ->
                if (parsed.isJsonArray) {
                    appendFromArray(parsed.asJsonArray)
                    return result
                }
            }
            append(text)
            return result
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()

        root.arrayOrNull("permission_slugs", "permission_slug")?.let { appendFromArray(it) }
        root.arrayOrNull("permissions")?.let { appendFromArray(it) }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("permission_slugs", "permission_slug")?.let { appendFromArray(it) }
            dataObject.arrayOrNull("permissions")?.let { appendFromArray(it) }
        }

        return result
    }

    private fun toRolePermissionIdsArray(permissionIds: List<String>): JsonArray {
        val array = JsonArray()
        permissionIds.forEach { id ->
            id.trim().toIntOrNull()?.let(array::add)
        }
        return array
    }

    private fun parseAdminUsersCollection(
        payload: JsonElement,
        defaultPerPage: Int,
    ): AdminUsersCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map(::parseAdminUser)
            return AdminUsersCollection(
                users = parsed,
                total = parsed.size,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminUsersCollection()
        val dataObject = root.objectOrNull("data")

        val rows: List<JsonObject> = when {
            root.arrayOrNull("users") != null -> root.arrayOrNull("users")!!.jsonObjects()
            dataObject?.arrayOrNull("users") != null -> dataObject.arrayOrNull("users")!!.jsonObjects()
            root.arrayOrNull("data") != null -> root.arrayOrNull("data")!!.jsonObjects()
            dataObject?.arrayOrNull("data") != null -> dataObject.arrayOrNull("data")!!.jsonObjects()
            !root.stringOrNull("id").isNullOrBlank() -> listOf(root)
            dataObject != null && !dataObject.stringOrNull("id").isNullOrBlank() -> listOf(dataObject)
            else -> emptyList()
        }

        val parsedUsers = rows.map(::parseAdminUser)
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: parsedUsers.size

        val page = root.intOrNull("page", "current_page")
            ?: dataObject?.intOrNull("page", "current_page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")

        val perPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage

        val explicitLastPage = root.intOrNull("last_page")
            ?: dataObject?.intOrNull("last_page")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")

        val resolvedPerPage = if (perPage <= 0) defaultPerPage else perPage
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: ((maxOf(1, total) + resolvedPerPage - 1) / resolvedPerPage)

        return AdminUsersCollection(
            users = parsedUsers,
            total = total,
            page = page,
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminUser(row: JsonObject): AdminUserListItem {
        val explicitVerified = row.booleanOrNull("isVerified", "is_verified")
        val testVerified = row.booleanOrNull("testVerified", "test_verified") ?: false
        val callVerified = row.booleanOrNull("callVerified", "call_verified") ?: false

        val roleValues = linkedSetOf<String>()
        row.arrayOrNull("roles")?.forEach { value ->
            when {
                value.isJsonObject -> value.asJsonObject.stringOrNull("slug", "name")
                    ?.trim()
                    ?.uppercase()
                    ?.takeIf { it.isNotEmpty() }
                    ?.let(roleValues::add)

                value.isJsonPrimitive -> value.asStringOrNull()
                    ?.trim()
                    ?.uppercase()
                    ?.takeIf { it.isNotEmpty() }
                    ?.let(roleValues::add)
            }
        }

        val rootRole = row.stringOrNull("role")?.trim()?.uppercase()?.takeIf { it.isNotEmpty() }
        rootRole?.let(roleValues::add)

        return AdminUserListItem(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            firstName = row.stringOrNull("firstName", "first_name").orEmpty(),
            lastName = row.stringOrNull("lastName", "last_name").orEmpty(),
            email = row.stringOrNull("email").orEmpty(),
            phone = row.stringOrNull("phone"),
            avatarUrl = row.stringOrNull("avatar", "profile_photo_url"),
            role = rootRole ?: roleValues.firstOrNull() ?: "CLIENT",
            roles = roleValues.toList(),
            status = (row.stringOrNull("status") ?: "ACTIVE").uppercase(),
            isSuperuser = row.booleanOrNull("is_superuser") ?: false,
            isVerified = explicitVerified ?: (testVerified && callVerified),
            rating = row.doubleOrNull("rating") ?: 0.0,
            reviewCount = row.intOrNull("reviewCount", "review_count") ?: 0,
            createdAtIso = row.stringOrNull("created_at"),
            profileUrl = row.stringOrNull("profile_url"),
        )
    }

    private fun parseAdminServicesCollection(
        payload: JsonElement,
        language: String,
        defaultPerPage: Int,
    ): AdminServicesCollection {
        if (payload.isJsonArray) {
            val parsed = payload.asJsonArray.jsonObjects().map { parseAdminServiceSummary(it, language) }
            val perPage = maxOf(1, parsed.size)
            return AdminServicesCollection(
                services = parsed,
                total = parsed.size,
                currentPage = 1,
                perPage = perPage,
                lastPage = 1,
            )
        }

        val root = payload.asJsonObjectOrNull() ?: return AdminServicesCollection(perPage = maxOf(1, defaultPerPage))
        val dataObject = root.objectOrNull("data")
        val rootMeta = root.objectOrNull("meta")
        val dataMeta = dataObject?.objectOrNull("meta")

        val rows = parseAdminServiceRows(payload)
        val services = rows.map { parseAdminServiceSummary(it, language) }

        val total = root.intOrNull("total")
            ?: dataObject?.intOrNull("total")
            ?: rootMeta?.intOrNull("total")
            ?: dataMeta?.intOrNull("total")
            ?: services.size
        val currentPage = root.intOrNull("current_page", "page")
            ?: dataObject?.intOrNull("current_page", "page")
            ?: rootMeta?.intOrNull("current_page")
            ?: dataMeta?.intOrNull("current_page")
            ?: 1
        val resolvedPerPage = root.intOrNull("per_page", "limit")
            ?: dataObject?.intOrNull("per_page", "limit")
            ?: rootMeta?.intOrNull("per_page")
            ?: dataMeta?.intOrNull("per_page")
            ?: defaultPerPage
        val perPage = maxOf(1, resolvedPerPage)
        val explicitLastPage = root.intOrNull("last_page", "total_pages")
            ?: dataObject?.intOrNull("last_page", "total_pages")
            ?: rootMeta?.intOrNull("last_page")
            ?: dataMeta?.intOrNull("last_page")
        val lastPage = explicitLastPage?.coerceAtLeast(1)
            ?: maxOf(1, (maxOf(1, total) + perPage - 1) / perPage)

        return AdminServicesCollection(
            services = services,
            total = maxOf(0, total),
            currentPage = maxOf(1, currentPage),
            perPage = perPage,
            lastPage = lastPage,
        )
    }

    private fun parseAdminServiceRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("services")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("service")?.let { return listOf(it) }
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }

        val dataObject = root.objectOrNull("data")
        if (dataObject != null) {
            dataObject.arrayOrNull("services")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            dataObject.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
            if (!dataObject.stringOrNull("id").isNullOrBlank()) {
                return listOf(dataObject)
            }
        }

        if (!root.stringOrNull("id").isNullOrBlank()) {
            return listOf(root)
        }

        return emptyList()
    }

    private fun parseAdminServiceSummary(
        row: JsonObject,
        language: String,
    ): AdminServiceSummary {
        val category = row.objectOrNull("category")
        return AdminServiceSummary(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = localizedString(row["name"], language)
                ?: localizedString(row["title"], language)
                ?: row.stringOrNull("name", "title")
                ?: "Service",
            description = localizedString(row["description"], language)
                ?: row.stringOrNull("description")
                ?: "",
            status = (row.stringOrNull("status") ?: "DRAFT").uppercase(),
            isFeatured = row.booleanOrNull("isFeatured", "is_featured") ?: false,
            slug = row.stringOrNull("slug") ?: "",
            categoryId = row.stringOrNull("category_id") ?: category?.stringOrNull("id"),
            categoryName = localizedString(category?.get("name"), language)
                ?: category?.stringOrNull("name")
                ?: localizedString(row["category_name"], language)
                ?: row.stringOrNull("category_name")
                ?: "-",
            categorySlug = category?.stringOrNull("slug") ?: row.stringOrNull("category_slug"),
            rating = row.doubleOrNull("rating") ?: 0.0,
            reviewCount = row.intOrNull("reviewCount", "review_count") ?: 0,
            orderCount = row.intOrNull("orderCount", "order_count") ?: 0,
            viewCount = row.intOrNull("viewCount", "view_count") ?: 0,
        )
    }

    private fun parseAdminServiceDetail(
        row: JsonObject,
        language: String,
    ): AdminServiceDetail {
        val category = row.objectOrNull("category")
        return AdminServiceDetail(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = localizedString(row["name"], language)
                ?: localizedString(row["title"], language)
                ?: row.stringOrNull("name", "title")
                ?: "",
            slug = row.stringOrNull("slug") ?: "",
            description = localizedString(row["description"], language)
                ?: row.stringOrNull("description")
                ?: "",
            requirements = localizedString(row["requirements"], language)
                ?: row.stringOrNull("requirements")
                ?: "",
            categoryId = row.stringOrNull("category_id")
                ?: category?.stringOrNull("id")
                ?: "",
            categorySlug = category?.stringOrNull("slug") ?: row.stringOrNull("category_slug"),
            deliveryProvider = row.stringOrNull("delivery_provider", "deliveryProvider") ?: "",
            skills = parseTextItemsFromJson(row["skills"]),
            tags = parseTextItemsFromJson(row["tags"]),
            status = (row.stringOrNull("status") ?: "DRAFT").uppercase(),
        )
    }

    private fun parseAdminServiceCategoryRows(
        payload: JsonElement,
        language: String,
    ): List<AdminServiceCategoryOption> {
        val rows = when {
            payload.isJsonArray -> payload.asJsonArray.jsonObjects()
            else -> {
                val root = payload.asJsonObjectOrNull() ?: return emptyList()
                root.arrayOrNull("categories")?.jsonObjects()
                    ?: root.objectOrNull("data")?.arrayOrNull("categories")?.jsonObjects()
                    ?: root.arrayOrNull("data")?.jsonObjects()
                    ?: emptyList()
            }
        }

        return rows.mapNotNull { row ->
            val id = row.stringOrNull("id") ?: UUID.randomUUID().toString()
            val name = localizedString(row["name"], language)
                ?: row.stringOrNull("name", "title")
                ?: "Category"
            if (id.isBlank() || name.isBlank()) {
                return@mapNotNull null
            }
            AdminServiceCategoryOption(
                id = id,
                name = name,
                parentId = row.stringOrNull("parent_id", "parentID"),
                slug = row.stringOrNull("slug"),
            )
        }
    }

    private fun parseDeliveryProviderRows(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }
        val root = payload.asJsonObjectOrNull() ?: return emptyList()
        root.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.objectOrNull("data")?.arrayOrNull("data")?.jsonObjects()?.let { if (it.isNotEmpty()) return it }
        root.arrayOrNull("delivery_providers", "deliveryProviders", "providers")?.jsonObjects()?.let {
            if (it.isNotEmpty()) return it
        }

        val nestedArrays = root.entrySet()
            .mapNotNull { (_, value) -> value.asJsonArrayOrNull() }
        nestedArrays.forEach { array ->
            val rows = array.jsonObjects()
            if (rows.isNotEmpty()) return rows
        }

        return emptyList()
    }

    private fun parseTextItemsFromJson(value: JsonElement?): List<String> {
        if (value == null) return emptyList()
        val result = mutableListOf<String>()
        val seen = linkedSetOf<String>()

        fun appendValue(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isEmpty()) return
            val key = normalized.lowercase()
            if (seen.add(key)) {
                result.add(normalized)
            }
        }

        if (value.isJsonPrimitive) {
            val text = value.asStringOrNull().orEmpty()
            text.split(",").forEach { appendValue(it) }
            return result
        }

        if (value.isJsonArray) {
            value.asJsonArray.forEach { item ->
                if (item.isJsonPrimitive) {
                    appendValue(item.asStringOrNull())
                } else if (item.isJsonObject) {
                    val obj = item.asJsonObject
                    appendValue(obj.stringOrNull("name", "title", "value", "label"))
                }
            }
        }

        return result
    }

    private fun toJsonStringArray(values: List<String>): JsonArray {
        return JsonArray().apply {
            values.forEach(::add)
        }
    }

    private fun normalizeTextItems(values: List<String>): List<String> {
        val seen = linkedSetOf<String>()
        val result = mutableListOf<String>()
        values.forEach { value ->
            val trimmed = value.trim()
            if (trimmed.isEmpty()) return@forEach
            val key = trimmed.lowercase()
            if (seen.add(key)) {
                result.add(trimmed)
            }
        }
        return result
    }

    private fun parseAdminEarlyAccessCollection(
        payload: JsonElement,
    ): AdminEarlyAccessGroupedCollection {
        val root = payload.asJsonObjectOrNull() ?: return AdminEarlyAccessGroupedCollection()
        val data = root.objectOrNull("data")

        val providersRows = root.arrayOrNull("providers")
            ?: data?.arrayOrNull("providers")
        val clientsRows = root.arrayOrNull("clients")
            ?: data?.arrayOrNull("clients")

        val providers = providersRows?.jsonObjects()?.map(::parseAdminEarlyAccessProvider) ?: emptyList()
        val clients = clientsRows?.jsonObjects()?.map(::parseAdminEarlyAccessClient) ?: emptyList()

        val paginationObject = root.objectOrNull("pagination")
            ?: data?.objectOrNull("pagination")
            ?: root.objectOrNull("meta")
            ?: data?.objectOrNull("meta")

        val pagination = paginationObject?.let(::parseAdminEarlyAccessPagination)

        return AdminEarlyAccessGroupedCollection(
            providers = providers,
            clients = clients,
            pagination = pagination,
        )
    }

    private fun parseAdminEarlyAccessProvider(row: JsonObject): AdminEarlyAccessProviderEntry {
        return AdminEarlyAccessProviderEntry(
            id = row.stringOrNull("id", "uuid") ?: UUID.randomUUID().toString(),
            applicationId = row.stringOrNull("application_id", "applicationId") ?: "-",
            fullName = row.stringOrNull("full_name", "fullName", "name") ?: "-",
            email = row.stringOrNull("email") ?: "-",
            country = row.stringOrNull("country"),
            language = row.stringOrNull("language") ?: "-",
            score = row.intOrNull("score") ?: 0,
            isEmailVerified = row.booleanOrNull("email_verification", "emailVerification") ?: false,
            isEmailVerificationExpired = row.booleanOrNull(
                "email_verification_expired",
                "emailVerificationExpired",
            ) ?: false,
            emailVerificationSentAtIso = row.stringOrNull("email_verification_sent_at", "emailVerificationSentAt"),
            emailVerificationExpiresAtIso = row.stringOrNull("email_verification_expires_at", "emailVerificationExpiresAt"),
            createdAtIso = row.stringOrNull("created_at", "createdAt"),
        )
    }

    private fun parseAdminEarlyAccessClient(row: JsonObject): AdminEarlyAccessClientEntry {
        return AdminEarlyAccessClientEntry(
            id = row.stringOrNull("id", "uuid") ?: UUID.randomUUID().toString(),
            applicationId = row.stringOrNull("application_id", "applicationId") ?: "-",
            contactName = row.stringOrNull("contact_name", "contactName", "name") ?: "-",
            companyName = row.stringOrNull("company_name", "companyName") ?: "-",
            email = row.stringOrNull("email") ?: "-",
            country = row.stringOrNull("country"),
            language = row.stringOrNull("language") ?: "-",
            score = row.intOrNull("score") ?: 0,
            isEmailVerified = row.booleanOrNull("email_verification", "emailVerification") ?: false,
            isEmailVerificationExpired = row.booleanOrNull(
                "email_verification_expired",
                "emailVerificationExpired",
            ) ?: false,
            emailVerificationSentAtIso = row.stringOrNull("email_verification_sent_at", "emailVerificationSentAt"),
            emailVerificationExpiresAtIso = row.stringOrNull("email_verification_expires_at", "emailVerificationExpiresAt"),
            createdAtIso = row.stringOrNull("created_at", "createdAt"),
        )
    }

    private fun parseAdminEarlyAccessPagination(json: JsonObject): AdminEarlyAccessPagination? {
        val currentPage = json.intOrNull("current_page", "currentPage", "page") ?: return null
        val perPage = json.intOrNull("per_page", "perPage", "limit") ?: return null
        val total = json.intOrNull("total") ?: return null
        val explicitLastPage = json.intOrNull("last_page", "lastPage")
        val resolvedPerPage = maxOf(1, perPage)
        val lastPage = explicitLastPage
            ?: maxOf(1, (maxOf(1, total) + resolvedPerPage - 1) / resolvedPerPage)

        return AdminEarlyAccessPagination(
            currentPage = maxOf(1, currentPage),
            perPage = resolvedPerPage,
            total = maxOf(0, total),
            lastPage = maxOf(1, lastPage),
        )
    }

    private fun extractRows(payload: JsonElement, explicitKeys: List<String> = emptyList()): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }
        val root = payload.asJsonObjectOrNull() ?: return emptyList()

        val keys = explicitKeys + listOf(
            "data",
            "projects",
            "services",
            "activities",
            "messages",
            "groups",
            "wallets",
            "members",
            "editors",
        )

        keys.forEach { key ->
            val array = root.arrayOrNull(key)
            if (array != null) {
                val rows = array.jsonObjects()
                if (rows.isNotEmpty()) return rows
            }

            val nestedData = root.objectOrNull("data")?.arrayOrNull(key)
            if (nestedData != null) {
                val rows = nestedData.jsonObjects()
                if (rows.isNotEmpty()) return rows
            }
        }

        val nestedArrays = root.entrySet()
            .mapNotNull { (_, value) -> if (value is JsonArray) value else null }
        nestedArrays.forEach { array ->
            val rows = array.jsonObjects()
            if (rows.isNotEmpty()) return rows
        }

        return if (root.entrySet().isNotEmpty()) listOf(root) else emptyList()
    }

    private fun localizedString(value: JsonElement?, language: String): String? {
        val direct = value.asStringOrNull()?.trim().orEmpty()
        if (direct.isNotEmpty()) return direct

        if (value == null || !value.isJsonObject) return null
        val objectValue = value.asJsonObject
        return objectValue.stringOrNull(language, "en", "ro")
            ?: objectValue.entrySet().firstNotNullOfOrNull { (_, nested) -> nested.asStringOrNull() }
    }

    private fun chatText(translations: JsonElement?, fallback: String?): String? {
        val fromTranslations = when {
            translations == null -> null
            translations.isJsonPrimitive -> translations.asStringOrNull()?.trim()?.takeIf { it.isNotEmpty() }
            translations.isJsonObject -> {
                val languageCode = Locale.getDefault().language.lowercase(Locale.ROOT)
                translations.asJsonObject.stringOrNull(languageCode, "en", "ro")
                    ?: translations.asJsonObject.entrySet().firstNotNullOfOrNull { (_, nested) -> nested.asStringOrNull() }
            }

            else -> null
        }
        return fromTranslations ?: fallback?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun parseRapydOnboardingObject(root: JsonObject): DashboardRapydOnboarding {
        val nestedData = root.objectOrNull("data")
        return DashboardRapydOnboarding(
            url = root.stringOrNull("url", "onboarding_url", "redirect_url")
                ?: nestedData?.stringOrNull("url", "onboarding_url", "redirect_url"),
            walletId = root.stringOrNull("wallet_id", "walletId")
                ?: nestedData?.stringOrNull("wallet_id", "walletId"),
            contactId = root.stringOrNull("rapyd_contact_id", "contact_id", "contactId")
                ?: nestedData?.stringOrNull("rapyd_contact_id", "contact_id", "contactId"),
        )
    }

    private fun bearerToken(rawToken: String): String {
        val normalized = rawToken.trim()
        return if (normalized.startsWith("Bearer ", ignoreCase = true)) {
            normalized
        } else {
            "Bearer $normalized"
        }
    }

    private fun JsonArray.jsonObjects(): List<JsonObject> = buildList {
        for (index in 0 until size()) {
            val value = this@jsonObjects[index]
            if (value.isJsonObject) add(value.asJsonObject)
        }
    }

    private fun JsonArray.toStringList(): List<String> = buildList {
        for (index in 0 until size()) {
            this@toStringList[index].asStringOrNull()?.let(::add)
        }
    }

    private fun JsonObject.asIntByPath(vararg keys: String): Int? {
        for (key in keys) {
            this[key].asIntOrNull()?.let { return it }
        }
        return null
    }

    private fun JsonObject.asBooleanByPath(vararg keys: String): Boolean? {
        for (key in keys) {
            this[key].asBooleanOrNull()?.let { return it }
        }
        return null
    }

    private fun JsonElement.asJsonObjectOrNull(): JsonObject? = if (isJsonObject) asJsonObject else null
    private fun JsonElement.asJsonArrayOrNull(): JsonArray? = if (isJsonArray) asJsonArray else null
}

package com.trustora.app.core.repository

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.MarketplaceCategory
import com.trustora.app.core.models.MarketplaceService
import com.trustora.app.core.models.MarketplaceServiceProvider
import com.trustora.app.core.models.MarketplaceServicesPage
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
import java.util.UUID

class MarketplaceRepository(
    private val api: TrustoraApi,
) {
    suspend fun getCategories(language: String): List<MarketplaceCategory> {
        val payload = api.getCategories(language = language)

        val root = payload.asJsonObjectOrNull()
        val rows = when {
            root?.arrayOrNull("categories") != null -> root.arrayOrNull("categories")!!.jsonObjects()
            root?.objectOrNull("data")?.arrayOrNull("categories") != null -> {
                root.objectOrNull("data")!!.arrayOrNull("categories")!!.jsonObjects()
            }

            else -> extractDictionaryArray(payload)
        }

        return rows.mapNotNull { row ->
            val name = localizedString(row["name"], language) ?: return@mapNotNull null
            MarketplaceCategory(
                id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
                name = name,
            )
        }
    }

    suspend fun getServices(
        categoryId: String?,
        skills: List<String>,
        page: Int,
        limit: Int,
        language: String,
        currency: AppCurrency,
    ): MarketplaceServicesPage {
        val payload = api.getServices(
            page = page.coerceAtLeast(1),
            limit = limit.coerceAtLeast(1),
            categoryId = categoryId?.takeUnless { it.equals("all", ignoreCase = true) },
            skills = skills.map { it.trim() }.filter { it.isNotBlank() && !it.equals("all", ignoreCase = true) }
                .ifEmpty { null },
            language = language,
            currency = currency.raw,
        )

        val root = payload.asJsonObjectOrNull()
        val rows = extractServiceRows(payload)

        val services = rows.map { row ->
            parseService(row, language)
        }

        val source = root?.objectOrNull("data") ?: root
        val total = source?.intOrNull("total") ?: services.size
        val currentPage = source?.intOrNull("page", "current_page") ?: page
        val pageLimit = source?.intOrNull("limit", "per_page") ?: limit
        val totalPages = source?.intOrNull("total_pages", "last_page")
            ?: if (pageLimit > 0) ((total + pageLimit - 1) / pageLimit).coerceAtLeast(1) else 1

        return MarketplaceServicesPage(
            services = services,
            total = total,
            page = currentPage,
            limit = pageLimit,
            totalPages = totalPages,
        )
    }

    private fun extractServiceRows(payload: JsonElement): List<JsonObject> {
        val root = payload.asJsonObjectOrNull()

        val rootData = root?.objectOrNull("data")

        val candidates = listOfNotNull(
            root?.arrayOrNull("services"),
            root?.arrayOrNull("data"),
            rootData?.arrayOrNull("services"),
            rootData?.arrayOrNull("data"),
            if (payload.isJsonArray) payload.asJsonArray else null,
        )

        for (candidate in candidates) {
            val rows = candidate.jsonObjects()
            if (rows.isNotEmpty()) return rows
        }

        return extractDictionaryArray(payload)
    }

    private fun parseService(row: JsonObject, language: String): MarketplaceService {
        val categoryObject = row.objectOrNull("category")
        val tags = row.arrayOrNull("tags").orEmpty().mapNotNull { it.asStringOrNull() }
        val skills = row.arrayOrNull("skills").orEmpty().mapNotNull { localizedString(it, language) ?: it.asStringOrNull() }
        val technologies = (skills + tags)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase() }
            .sortedWith(String.CASE_INSENSITIVE_ORDER)

        val providers = row.arrayOrNull("providers")
            .orEmpty()
            .mapNotNull { providerValue ->
                val provider = providerValue.asJsonObjectOrNull() ?: return@mapNotNull null
                MarketplaceServiceProvider(
                    id = provider.stringOrNull("id") ?: UUID.randomUUID().toString(),
                    firstName = provider.stringOrNull("firstName", "first_name").orEmpty(),
                    lastName = provider.stringOrNull("lastName", "last_name").orEmpty(),
                    avatarUrl = provider.stringOrNull("avatar", "profile_photo_url"),
                    rating = provider["rating"].asDoubleOrNull(),
                )
            }

        return MarketplaceService(
            id = row.stringOrNull("id") ?: UUID.randomUUID().toString(),
            name = localizedString(row["name"], language)
                ?: row.stringOrNull("title")
                ?: "Service",
            description = localizedString(row["description"], language)
                ?: row.stringOrNull("description")
                ?: "",
            categoryName = categoryObject?.let { localizedString(it["name"], language) ?: it.stringOrNull("name", "title") }
                ?: localizedString(row["category"], language)
                ?: row.stringOrNull("category")
                ?: "Other",
            isFeatured = row.booleanOrNull("isFeatured", "is_featured") ?: false,
            technologies = technologies,
            providers = providers,
        )
    }

    private fun localizedString(value: JsonElement?, language: String): String? {
        val asString = value.asStringOrNull()?.trim().orEmpty()
        if (asString.isNotEmpty()) return asString

        val dictionary = value?.asJsonObjectOrNull() ?: return null
        return dictionary.stringOrNull(language, "en", "ro")
            ?: dictionary.entrySet().firstNotNullOfOrNull { (_, nested) -> nested.asStringOrNull() }
    }

    private fun extractDictionaryArray(payload: JsonElement): List<JsonObject> {
        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        val root = payload.asJsonObjectOrNull() ?: return emptyList()

        val candidates = root.entrySet().mapNotNull { (_, value) ->
            if (value.isJsonArray) value.asJsonArray else null
        }

        for (candidate in candidates) {
            val rows = candidate.jsonObjects()
            if (rows.isNotEmpty()) return rows
        }

        return if (root.entrySet().isNotEmpty()) listOf(root) else emptyList()
    }

    private fun JsonElement.asJsonObjectOrNull(): JsonObject? = if (isJsonObject) asJsonObject else null

    private fun JsonArray.jsonObjects(): List<JsonObject> = buildList {
        for (index in 0 until size()) {
            val value = this@jsonObjects[index]
            if (value.isJsonObject) {
                add(value.asJsonObject)
            }
        }
    }

    private fun JsonArray?.orEmpty(): List<JsonElement> {
        if (this == null) return emptyList()
        return buildList {
            for (index in 0 until this@orEmpty.size()) {
                add(this@orEmpty[index])
            }
        }
    }
}

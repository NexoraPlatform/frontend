package com.trustora.app.core.repository

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.trustora.app.core.models.ProviderProfileAvailability
import com.trustora.app.core.models.ProviderProfileCertification
import com.trustora.app.core.models.ProviderProfileData
import com.trustora.app.core.models.ProviderProfileEducation
import com.trustora.app.core.models.ProviderProfileLanguageEntry
import com.trustora.app.core.models.ProviderProfileLanguageOption
import com.trustora.app.core.models.ProviderProfilePortfolio
import com.trustora.app.core.models.ProviderProfileTrustMetrics
import com.trustora.app.core.models.ProviderProfileUpdatePayload
import com.trustora.app.core.models.ProviderProfileWeekDay
import com.trustora.app.core.models.ProviderProfileWorkHistory
import com.trustora.app.core.models.ProviderProfileWorkingHour
import com.trustora.app.core.network.TrustoraApi
import com.trustora.app.core.utils.arrayOrNull
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
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class ProviderProfileRepository(
    private val api: TrustoraApi,
) {
    suspend fun getProviderProfile(
        bearerToken: String,
        language: String,
    ): ProviderProfileData {
        val payload = api.getProviderProfile(
            bearerToken = "Bearer $bearerToken",
            language = language,
        )

        val dictionary = extractProviderProfileDictionary(payload)
        return providerProfileFrom(dictionary)
    }

    suspend fun updateProviderProfile(
        profile: ProviderProfileData,
        bearerToken: String,
        language: String,
    ) {
        api.updateProviderProfile(
            bearerToken = "Bearer $bearerToken",
            language = language,
            payload = ProviderProfileUpdatePayload(profile).toJsonObject(),
        )
    }

    suspend fun getProviderProfileLanguages(language: String): List<ProviderProfileLanguageOption> {
        val payload = api.getProviderProfileLanguages(language = language)
        val rows = extractDictionaryArray(payload)

        val result = mutableListOf<ProviderProfileLanguageOption>()
        val seenIds = linkedSetOf<String>()
        rows.forEach { row ->
            val id = row.stringOrNull("id", "code") ?: UUID.randomUUID().toString()
            val name = row.stringOrNull("name", "language").orEmpty()
            if (name.isBlank()) return@forEach
            if (!seenIds.add(id)) return@forEach

            result += ProviderProfileLanguageOption(
                id = id,
                name = name,
                code = row.stringOrNull("code") ?: name,
                locale = row.stringOrNull("locale"),
                flag = row.stringOrNull("flag").orEmpty(),
                timezone = row.stringOrNull("timezone"),
            )
        }
        return result
    }

    suspend fun uploadAvatar(
        imageData: ByteArray,
        fileName: String,
        mimeType: String,
        bearerToken: String,
        language: String?,
    ): String? {
        val requestBody = imageData.toRequestBody(mimeType.toMediaTypeOrNull())
        val avatarPart = MultipartBody.Part.createFormData(
            name = "avatar",
            filename = fileName,
            body = requestBody,
        )
        val payload = api.uploadProviderAvatar(
            bearerToken = "Bearer $bearerToken",
            language = language?.trim()?.takeIf { it.isNotEmpty() },
            avatar = avatarPart,
        )
        return extractUploadedAvatarURL(payload)
    }

    private fun extractProviderProfileDictionary(payload: JsonElement): JsonObject {
        val root = payload.asJsonObjectOrNull() ?: return JsonObject()

        if (root.hasProviderProfileData()) {
            return root
        }

        val data = root.objectOrNull("data")
        if (data != null && data.hasProviderProfileData()) {
            return data
        }

        root.objectOrNull("user")?.let { return it }
        root.objectOrNull("provider")?.let { return it }

        return root
    }

    private fun providerProfileFrom(dictionary: JsonObject): ProviderProfileData {
        val profile = dictionary.objectOrNull("profile") ?: JsonObject()
        val companyObject = dictionary.objectOrNull("company")

        val workingHours = ProviderProfileAvailability.empty().workingHours.toMutableMap()
        ProviderProfileWeekDay.entries.forEach { day ->
            val defaults = ProviderProfileWorkingHour.defaults(day)
            val prefix = "working_${day.rawValue}"
            workingHours[day] = ProviderProfileWorkingHour(
                start = normalizedProviderProfileTime(
                    value = profile["${prefix}_from"],
                    fallback = defaults.start,
                ),
                end = normalizedProviderProfileTime(
                    value = profile["${prefix}_to"],
                    fallback = defaults.end,
                ),
                enabled = profile.booleanOrNull("${prefix}_enabled") ?: defaults.enabled,
            )
        }

        val availability = ProviderProfileAvailability(
            status = normalizedProviderProfileStatus(
                profile.stringOrNull("availability", "availability_status"),
            ),
            hoursPerWeek = profileString(profile["working_hours_per_week"]) ?: "",
            timezone = profile.stringOrNull("timezone")
                ?: dictionary.stringOrNull("timezone")
                ?: "Europe/Bucharest",
            responseTime = normalizedProviderProfileDigits(
                profile.stringOrNull("answer_hour")
                    ?: profileString(profile["answer_hour"])
                    ?: profile.stringOrNull("avg_response_time_minutes")
                    ?: profileString(profile["avg_response_time_minutes"]),
                fallback = ProviderProfileAvailability.empty().responseTime,
            ),
            workingHours = workingHours,
        )

        val languages = extractDictionaryArray(dictionary["languages"])
            .map { row ->
                ProviderProfileLanguageEntry(
                    name = row.stringOrNull("language", "name").orEmpty(),
                    level = row.stringOrNull("proficiency", "level") ?: "Basic",
                    flag = row.stringOrNull("flag").orEmpty(),
                )
            }
            .filter { it.name.isNotBlank() }

        val certifications = extractDictionaryArray(dictionary["certifications"])
            .map { row ->
                ProviderProfileCertification(
                    name = row.stringOrNull("name").orEmpty(),
                    issuer = row.stringOrNull("issuer_name", "issuer").orEmpty(),
                    date = row.stringOrNull("issued_at", "date").orEmpty(),
                    credentialID = row.stringOrNull("credential_id", "credentialId").orEmpty(),
                    verified = row.booleanOrNull("verified") ?: false,
                )
            }
            .filter { it.name.isNotBlank() || it.issuer.isNotBlank() }

        val educationRows = if (dictionary["education"] != null) {
            extractDictionaryArray(dictionary["education"])
        } else {
            extractDictionaryArray(dictionary["educations"])
        }

        val education = educationRows
            .map { row ->
                ProviderProfileEducation(
                    degree = row.stringOrNull("degree").orEmpty(),
                    institution = row.stringOrNull("institution").orEmpty(),
                    attendedFrom = row.stringOrNull("attended_from").orEmpty(),
                    attendedTo = row.stringOrNull("attended_to").orEmpty(),
                    studyArea = row.stringOrNull("study_area").orEmpty(),
                )
            }
            .filter { it.degree.isNotBlank() || it.institution.isNotBlank() }

        val workRows = if (dictionary["work_history"] != null) {
            extractDictionaryArray(dictionary["work_history"])
        } else {
            extractDictionaryArray(dictionary["workHistory"])
        }

        val workHistory = workRows
            .map { row ->
                ProviderProfileWorkHistory(
                    title = row.stringOrNull("title").orEmpty(),
                    position = row.stringOrNull("position").orEmpty(),
                    company = row.stringOrNull("company").orEmpty(),
                    city = row.stringOrNull("city").orEmpty(),
                    country = row.stringOrNull("country").orEmpty(),
                    startDate = row.stringOrNull("start_date").orEmpty(),
                    endDate = row.stringOrNull("end_date").orEmpty(),
                    description = row.stringOrNull("description").orEmpty(),
                    currentWorking = row.booleanOrNull("current_working") ?: false,
                )
            }
            .filter { it.position.isNotBlank() || it.company.isNotBlank() || it.title.isNotBlank() }

        val portfolioRows = if (dictionary["portfolio"] != null) {
            extractDictionaryArray(dictionary["portfolio"])
        } else {
            extractDictionaryArray(dictionary["portfolios"])
        }

        val portfolio = portfolioRows
            .map { row ->
                ProviderProfilePortfolio(
                    title = row.stringOrNull("project_title", "title").orEmpty(),
                    description = row.stringOrNull("description").orEmpty(),
                    image = row.stringOrNull("image").orEmpty(),
                    role = row.stringOrNull("role").orEmpty(),
                    technologies = (row["technologies_used"] ?: row["technologies"])
                        .asStringList(),
                    url = row.stringOrNull("url").orEmpty(),
                )
            }
            .filter { it.title.isNotBlank() || it.description.isNotBlank() }

        val trustMetrics = ProviderProfileTrustMetrics(
            rating = profileString(dictionary["rating"]) ?: "-",
            reviewCount = profileString(dictionary["reviewCount"] ?: dictionary["review_count"]) ?: "0",
            jobSuccessScore = profileString(profile["job_success_score"])
                ?: profile.stringOrNull("job_success_score")
                ?: "-",
            totalProjectsCompleted = profileString(profile["total_projects_completed"]) ?: "0",
            responseRate = profileString(profile["response_rate"])
                ?: profile.stringOrNull("response_rate")
                ?: "-",
            averageResponseTimeMinutes = profileString(profile["avg_response_time_minutes"])
                ?: profile.stringOrNull("avg_response_time_minutes")
                ?: "-",
            kycStatus = profile.stringOrNull("kyc_status") ?: "-",
            testVerified = dictionary.booleanOrNull("testVerified", "test_verified") ?: false,
            callVerified = dictionary.booleanOrNull("callVerified", "call_verified") ?: false,
            totalEarned = providerProfileMoneyString(profile.doubleOrNull("total_earned_cents")),
            badges = profile.arrayOrNull("badges").asStringList(),
        )

        return ProviderProfileData(
            firstName = dictionary.stringOrNull("firstName", "first_name").orEmpty(),
            lastName = dictionary.stringOrNull("lastName", "last_name").orEmpty(),
            email = dictionary.stringOrNull("email").orEmpty(),
            phone = dictionary.stringOrNull("phone").orEmpty(),
            bio = profile.stringOrNull("bio").orEmpty(),
            company = dictionary.stringOrNull("company")
                ?: companyObject?.stringOrNull("name")
                ?: dictionary.stringOrNull("company_name")
                ?: "",
            website = profile.stringOrNull("website")
                ?: dictionary.stringOrNull("website")
                ?: "",
            location = profile.stringOrNull("location").orEmpty(),
            avatar = dictionary.stringOrNull("avatar", "profile_photo_url", "avatar_url", "profile_photo").orEmpty(),
            companyName = dictionary.stringOrNull("company_name").orEmpty(),
            taxID = dictionary.stringOrNull("tax_id").orEmpty(),
            tradeRegistryNumber = dictionary.stringOrNull("trade_registry_number").orEmpty(),
            billingAddress = dictionary.stringOrNull("billing_address").orEmpty(),
            billingCity = dictionary.stringOrNull("billing_city").orEmpty(),
            billingState = dictionary.stringOrNull("billing_state").orEmpty(),
            billingPostalCode = dictionary.stringOrNull("billing_postal_code").orEmpty(),
            availability = availability,
            languages = languages,
            certifications = certifications,
            education = education,
            workHistory = workHistory,
            portfolio = portfolio,
            trustMetrics = trustMetrics,
        )
    }

    private fun extractUploadedAvatarURL(payload: JsonElement): String? {
        val dictionary = payload.asJsonObjectOrNull() ?: return null
        val data = dictionary.objectOrNull("data")
        val user = dictionary.objectOrNull("user")
        return dictionary.stringOrNull("url", "avatar", "profile_photo_url")
            ?: data?.stringOrNull("url", "avatar", "profile_photo_url")
            ?: user?.stringOrNull("avatar", "profile_photo_url")
    }

    private fun normalizedProviderProfileStatus(value: String?): String {
        val normalized = value?.trim()?.uppercase().orEmpty()
        return if (normalized in setOf("AVAILABLE", "BUSY", "UNAVAILABLE")) normalized else "AVAILABLE"
    }

    private fun normalizedProviderProfileDigits(value: String?, fallback: String): String {
        val digits = value.orEmpty().filter(Char::isDigit)
        return if (digits.isEmpty()) fallback else digits
    }

    private fun normalizedProviderProfileTime(value: JsonElement?, fallback: String): String {
        val text = value.asStringOrNull().orEmpty().trim()
        if (text.isEmpty()) return fallback
        return if (text.length >= 5) text.take(5) else fallback
    }

    private fun providerProfileMoneyString(cents: Double?): String? {
        val value = cents ?: return null
        val amount = value / 100.0
        return if (amount == amount.toLong().toDouble()) {
            amount.toLong().toString()
        } else {
            String.format(Locale.US, "%.2f", amount)
        }
    }

    private fun profileString(value: JsonElement?): String? {
        val element = value ?: return null
        if (element.isJsonNull) return null
        if (element.isJsonPrimitive) {
            val primitive = element.asJsonPrimitive
            if (primitive.isString) {
                return primitive.asString.trim().takeIf { it.isNotEmpty() }
            }
            if (primitive.isNumber) {
                val number = primitive.asDoubleOrNull() ?: return null
                return if (number == number.toLong().toDouble()) {
                    number.toLong().toString()
                } else {
                    number.toString()
                }
            }
            if (primitive.isBoolean) {
                return primitive.asBoolean.toString()
            }
        }
        return null
    }

    private fun extractDictionaryArray(payload: JsonElement?): List<JsonObject> {
        if (payload == null || payload.isJsonNull) return emptyList()

        if (payload.isJsonArray) {
            return payload.asJsonArray.jsonObjects()
        }

        if (payload.isJsonPrimitive) {
            val text = payload.asStringOrNull()?.trim().orEmpty()
            if (text.isEmpty()) return emptyList()
            val parsed = runCatching { JsonParser.parseString(text) }.getOrNull()
            return extractDictionaryArray(parsed)
        }

        val dictionary = payload.asJsonObjectOrNull() ?: return emptyList()
        dictionary.arrayOrNull("data")?.let { rows ->
            val parsed = rows.jsonObjects()
            if (parsed.isNotEmpty()) return parsed
        }

        dictionary.objectOrNull("data")?.let { nested ->
            nested.arrayOrNull("data")?.let { nestedRows ->
                val parsed = nestedRows.jsonObjects()
                if (parsed.isNotEmpty()) return parsed
            }
            if (nested.entrySet().isNotEmpty()) {
                return listOf(nested)
            }
        }

        return if (dictionary.entrySet().isNotEmpty()) listOf(dictionary) else emptyList()
    }

    private fun JsonObject.hasProviderProfileData(): Boolean {
        return this["firstName"] != null ||
            this["first_name"] != null ||
            this["profile"] != null ||
            this["languages"] != null
    }

    private fun JsonElement.asJsonObjectOrNull(): JsonObject? {
        return if (isJsonObject) asJsonObject else null
    }

    private fun JsonArray.jsonObjects(): List<JsonObject> {
        val rows = ArrayList<JsonObject>(size())
        for (index in 0 until size()) {
            val element = this[index]
            val obj = element.asJsonObjectOrNull()
            if (obj != null) {
                rows += obj
            } else if (element.isJsonPrimitive) {
                val parsed = runCatching { JsonParser.parseString(element.asStringOrNull().orEmpty()) }.getOrNull()
                if (parsed != null && parsed.isJsonObject) {
                    rows += parsed.asJsonObject
                }
            }
        }
        return rows
    }

    private fun JsonElement?.asStringList(): List<String> {
        val value = this ?: return emptyList()
        val result = mutableListOf<String>()
        val seen = linkedSetOf<String>()

        fun addValue(raw: String?) {
            val normalized = raw?.trim().orEmpty()
            if (normalized.isEmpty()) return
            val key = normalized.lowercase(Locale.ROOT)
            if (seen.add(key)) {
                result += normalized
            }
        }

        when {
            value.isJsonNull -> return emptyList()
            value.isJsonPrimitive -> {
                val text = value.asStringOrNull()?.trim().orEmpty()
                if (text.isEmpty()) return emptyList()
                runCatching { JsonParser.parseString(text) }.getOrNull()?.let { parsed ->
                    if (parsed.isJsonArray) {
                        return parsed.asJsonArray.asStringList()
                    }
                }
                text.split(",").forEach(::addValue)
            }

            value.isJsonArray -> {
                value.asJsonArray.forEach { item ->
                    when {
                        item.isJsonPrimitive -> addValue(item.asStringOrNull())
                        item.isJsonObject -> addValue(item.asJsonObject.stringOrNull("name", "title", "label", "value"))
                    }
                }
            }

            value.isJsonObject -> {
                addValue(value.asJsonObject.stringOrNull("name", "title", "label", "value"))
            }
        }

        return result
    }
}

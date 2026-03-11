package com.trustora.app.core.models

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import java.util.UUID

enum class ProviderProfileTab {
    BASIC,
    AVAILABILITY,
    LANGUAGES,
    EXPERIENCE,
    EDUCATION,
    PORTFOLIO,
}

enum class ProviderPublicProfileTab {
    OVERVIEW,
    AVAILABILITY,
    EXPERIENCE,
    PORTFOLIO,
}

enum class ProviderProfileWeekDay(val rawValue: String) {
    MONDAY("monday"),
    TUESDAY("tuesday"),
    WEDNESDAY("wednesday"),
    THURSDAY("thursday"),
    FRIDAY("friday"),
    SATURDAY("saturday"),
    SUNDAY("sunday");
}

data class ProviderProfileWorkingHour(
    var start: String,
    var end: String,
    var enabled: Boolean,
) {
    companion object {
        fun defaults(day: ProviderProfileWeekDay): ProviderProfileWorkingHour {
            return when (day) {
                ProviderProfileWeekDay.MONDAY,
                ProviderProfileWeekDay.TUESDAY,
                ProviderProfileWeekDay.WEDNESDAY,
                ProviderProfileWeekDay.THURSDAY,
                ProviderProfileWeekDay.FRIDAY,
                -> ProviderProfileWorkingHour(start = "09:00", end = "18:00", enabled = true)

                ProviderProfileWeekDay.SATURDAY,
                ProviderProfileWeekDay.SUNDAY,
                -> ProviderProfileWorkingHour(start = "10:00", end = "14:00", enabled = false)
            }
        }
    }
}

data class ProviderProfileAvailability(
    var status: String,
    var hoursPerWeek: String,
    var timezone: String,
    var responseTime: String,
    var workingHours: Map<ProviderProfileWeekDay, ProviderProfileWorkingHour>,
) {
    companion object {
        fun empty(): ProviderProfileAvailability {
            val hours = linkedMapOf<ProviderProfileWeekDay, ProviderProfileWorkingHour>()
            ProviderProfileWeekDay.entries.forEach { day ->
                hours[day] = ProviderProfileWorkingHour.defaults(day)
            }

            return ProviderProfileAvailability(
                status = "AVAILABLE",
                hoursPerWeek = "40",
                timezone = "Europe/Bucharest",
                responseTime = "2",
                workingHours = hours,
            )
        }
    }
}

data class ProviderProfileLanguageOption(
    val id: String,
    val name: String,
    val code: String,
    val locale: String?,
    val flag: String,
    val timezone: String?,
)

data class ProviderProfileLanguageEntry(
    val id: String = UUID.randomUUID().toString(),
    var name: String,
    var level: String,
    var flag: String,
)

data class ProviderProfileCertification(
    val id: String = UUID.randomUUID().toString(),
    var name: String,
    var issuer: String,
    var date: String,
    var credentialID: String,
    var verified: Boolean,
)

data class ProviderProfileEducation(
    val id: String = UUID.randomUUID().toString(),
    var degree: String,
    var institution: String,
    var attendedFrom: String,
    var attendedTo: String,
    var studyArea: String,
)

data class ProviderProfileWorkHistory(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var position: String,
    var company: String,
    var city: String,
    var country: String,
    var startDate: String,
    var endDate: String,
    var description: String,
    var currentWorking: Boolean,
)

data class ProviderProfilePortfolio(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var description: String,
    var image: String,
    var role: String,
    var technologies: List<String>,
    var url: String,
)

data class ProviderProfileTrustMetrics(
    var rating: String,
    var reviewCount: String,
    var jobSuccessScore: String,
    var totalProjectsCompleted: String,
    var responseRate: String,
    var averageResponseTimeMinutes: String,
    var kycStatus: String,
    var testVerified: Boolean,
    var callVerified: Boolean,
    var totalEarned: String?,
    var badges: List<String>,
) {
    companion object {
        val EMPTY = ProviderProfileTrustMetrics(
            rating = "-",
            reviewCount = "0",
            jobSuccessScore = "-",
            totalProjectsCompleted = "0",
            responseRate = "-",
            averageResponseTimeMinutes = "-",
            kycStatus = "-",
            testVerified = false,
            callVerified = false,
            totalEarned = null,
            badges = emptyList(),
        )
    }
}

data class ProviderProfileData(
    var firstName: String,
    var lastName: String,
    var email: String,
    var phone: String,
    var bio: String,
    var company: String,
    var website: String,
    var location: String,
    var avatar: String,
    var companyName: String,
    var taxID: String,
    var tradeRegistryNumber: String,
    var billingAddress: String,
    var billingCity: String,
    var billingState: String,
    var billingPostalCode: String,
    var availability: ProviderProfileAvailability,
    var languages: List<ProviderProfileLanguageEntry>,
    var certifications: List<ProviderProfileCertification>,
    var education: List<ProviderProfileEducation>,
    var workHistory: List<ProviderProfileWorkHistory>,
    var portfolio: List<ProviderProfilePortfolio>,
    var trustMetrics: ProviderProfileTrustMetrics,
) {
    companion object {
        fun empty(): ProviderProfileData {
            return ProviderProfileData(
                firstName = "",
                lastName = "",
                email = "",
                phone = "",
                bio = "",
                company = "",
                website = "",
                location = "",
                avatar = "",
                companyName = "",
                taxID = "",
                tradeRegistryNumber = "",
                billingAddress = "",
                billingCity = "",
                billingState = "",
                billingPostalCode = "",
                availability = ProviderProfileAvailability.empty(),
                languages = emptyList(),
                certifications = emptyList(),
                education = emptyList(),
                workHistory = emptyList(),
                portfolio = emptyList(),
                trustMetrics = ProviderProfileTrustMetrics.EMPTY,
            )
        }
    }
}

enum class ProviderProfileValidationField {
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE,
    BIO,
    AVAILABILITY_STATUS,
    HOURS_PER_WEEK,
}

data class ProviderProfileUpdatePayload(
    val profile: ProviderProfileData,
) {
    fun toJsonObject(): JsonObject {
        val availability = JsonObject().apply {
            addProperty("status", normalizedStatus(profile.availability.status))

            val parsedHours = trimmed(profile.availability.hoursPerWeek).toIntOrNull()
            if (parsedHours == null) {
                addProperty("hoursPerWeek", "")
            } else {
                addProperty("hoursPerWeek", parsedHours)
            }

            addProperty(
                "timezone",
                trimmedOrFallback(profile.availability.timezone, fallback = "Europe/Bucharest"),
            )
            addProperty(
                "responseTime",
                normalizedDigits(profile.availability.responseTime, fallback = "2"),
            )

            add(
                "workingHours",
                JsonObject().apply {
                    ProviderProfileWeekDay.entries.forEach { day ->
                        val defaults = ProviderProfileWorkingHour.defaults(day)
                        val current = profile.availability.workingHours[day] ?: defaults
                        add(
                            day.rawValue,
                            JsonObject().apply {
                                addProperty("start", normalizedTime(current.start, defaults.start))
                                addProperty("end", normalizedTime(current.end, defaults.end))
                                addProperty("enabled", current.enabled)
                            },
                        )
                    }
                },
            )
        }

        return JsonObject().apply {
            addProperty("firstName", trimmed(profile.firstName))
            addProperty("lastName", trimmed(profile.lastName))
            addProperty("email", trimmed(profile.email))
            addProperty("phone", trimmed(profile.phone))
            addProperty("bio", trimmed(profile.bio))
            addProperty("company", trimmed(profile.company))
            addProperty("website", trimmed(profile.website))
            addProperty("location", trimmed(profile.location))
            addProperty("avatar", trimmed(profile.avatar))
            add("availability", availability)

            add(
                "languages",
                JsonArray().apply {
                    profile.languages.forEach { language ->
                        add(
                            JsonObject().apply {
                                addProperty("name", trimmed(language.name))
                                addProperty("level", trimmedOrFallback(language.level, fallback = "Basic"))
                                addProperty("flag", trimmed(language.flag))
                            },
                        )
                    }
                },
            )

            add("skills", JsonArray())

            add(
                "certifications",
                JsonArray().apply {
                    profile.certifications.forEach { certification ->
                        add(
                            JsonObject().apply {
                                addProperty("name", trimmed(certification.name))
                                addProperty("issuer", trimmed(certification.issuer))
                                addProperty("date", trimmed(certification.date))
                                addProperty("credentialId", trimmed(certification.credentialID))
                                addProperty("verified", certification.verified)
                            },
                        )
                    }
                },
            )

            add(
                "education",
                JsonArray().apply {
                    profile.education.forEach { education ->
                        add(
                            JsonObject().apply {
                                addProperty("degree", trimmed(education.degree))
                                addProperty("institution", trimmed(education.institution))
                                addProperty("attended_from", trimmed(education.attendedFrom))
                                addProperty("attended_to", trimmed(education.attendedTo))
                                addProperty("study_area", trimmed(education.studyArea))
                            },
                        )
                    }
                },
            )

            add(
                "workHistory",
                JsonArray().apply {
                    profile.workHistory.forEach { work ->
                        add(
                            JsonObject().apply {
                                addProperty("title", trimmed(work.title))
                                addProperty("position", trimmed(work.position))
                                addProperty("company", trimmed(work.company))
                                addProperty("city", trimmed(work.city))
                                addProperty("country", trimmed(work.country))
                                addProperty("start_date", trimmed(work.startDate))
                                addProperty("end_date", trimmed(work.endDate))
                                addProperty("description", trimmed(work.description))
                                addProperty("current_working", work.currentWorking)
                            },
                        )
                    }
                },
            )

            add(
                "portfolio",
                JsonArray().apply {
                    profile.portfolio.forEach { item ->
                        add(
                            JsonObject().apply {
                                addProperty("title", trimmed(item.title))
                                addProperty("description", trimmed(item.description))
                                addProperty("image", trimmed(item.image))
                                addProperty("role", trimmed(item.role))
                                add(
                                    "technologies",
                                    JsonArray().apply {
                                        item.technologies
                                            .map(::trimmed)
                                            .filter { it.isNotEmpty() }
                                            .forEach(::add)
                                    },
                                )
                                addProperty("url", trimmed(item.url))
                            },
                        )
                    }
                },
            )

            addProperty("company_name", trimmed(profile.companyName))
            addProperty("tax_id", trimmed(profile.taxID))
            addProperty("trade_registry_number", trimmed(profile.tradeRegistryNumber))
            addProperty("billing_address", trimmed(profile.billingAddress))
            addProperty("billing_city", trimmed(profile.billingCity))
            addProperty("billing_state", trimmed(profile.billingState))
            addProperty("billing_postal_code", trimmed(profile.billingPostalCode))
        }
    }

    private fun normalizedStatus(status: String): String {
        val normalized = trimmed(status).uppercase()
        return if (normalized in setOf("AVAILABLE", "BUSY", "UNAVAILABLE")) normalized else "AVAILABLE"
    }

    private fun normalizedDigits(value: String, fallback: String): String {
        val digits = value.filter(Char::isDigit)
        return if (digits.isEmpty()) fallback else digits
    }

    private fun normalizedTime(value: String, fallback: String): String {
        val text = trimmed(value)
        if (text.isEmpty()) return fallback
        return if (text.length >= 5) text.take(5) else fallback
    }

    private fun trimmedOrFallback(value: String, fallback: String): String {
        val normalized = trimmed(value)
        return if (normalized.isEmpty()) fallback else normalized
    }

    private fun trimmed(value: String): String {
        return value.trim()
    }
}

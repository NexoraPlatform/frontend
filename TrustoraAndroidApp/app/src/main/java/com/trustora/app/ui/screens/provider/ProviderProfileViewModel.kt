package com.trustora.app.ui.screens.provider

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.trustora.app.core.models.ProviderProfileCertification
import com.trustora.app.core.models.ProviderProfileData
import com.trustora.app.core.models.ProviderProfileEducation
import com.trustora.app.core.models.ProviderProfileLanguageEntry
import com.trustora.app.core.models.ProviderProfileLanguageOption
import com.trustora.app.core.models.ProviderProfileTab
import com.trustora.app.core.models.ProviderProfileValidationField
import com.trustora.app.core.models.ProviderProfileWeekDay
import com.trustora.app.core.models.ProviderProfileWorkHistory
import com.trustora.app.core.models.ProviderProfilePortfolio
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import java.util.Locale
import kotlinx.coroutines.launch
import retrofit2.HttpException

class ProviderProfileViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var activeTab by mutableStateOf(ProviderProfileTab.BASIC)

    var profile by mutableStateOf(ProviderProfileData.empty())
        private set
    var availableLanguages by mutableStateOf<List<ProviderProfileLanguageOption>>(emptyList())
        private set

    var isLoading by mutableStateOf(false)
        private set
    var isSaving by mutableStateOf(false)
        private set
    var isUploadingAvatar by mutableStateOf(false)
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set
    var successMessage by mutableStateOf<String?>(null)
        private set

    var validationErrors by mutableStateOf<Set<ProviderProfileValidationField>>(emptySet())
        private set

    var newLanguageName by mutableStateOf("")
    var newLanguageLevel by mutableStateOf("Basic")

    var newCertificationName by mutableStateOf("")
    var newCertificationIssuer by mutableStateOf("")
    var newCertificationDate by mutableStateOf("")
    var newCertificationCredentialID by mutableStateOf("")

    var newEducationDegree by mutableStateOf("")
    var newEducationInstitution by mutableStateOf("")
    var newEducationFrom by mutableStateOf("")
    var newEducationTo by mutableStateOf("")
    var newEducationStudyArea by mutableStateOf("")

    var newWorkTitle by mutableStateOf("")
    var newWorkPosition by mutableStateOf("")
    var newWorkCompany by mutableStateOf("")
    var newWorkCity by mutableStateOf("")
    var newWorkCountry by mutableStateOf("")
    var newWorkStartDate by mutableStateOf("")
    var newWorkEndDate by mutableStateOf("")
    var newWorkDescription by mutableStateOf("")
    var newWorkCurrentWorking by mutableStateOf(false)

    var newPortfolioTitle by mutableStateOf("")
    var newPortfolioDescription by mutableStateOf("")
    var newPortfolioImage by mutableStateOf("")
    var newPortfolioRole by mutableStateOf("")
    var newPortfolioTechnologies by mutableStateOf("")
    var newPortfolioURL by mutableStateOf("")

    private var hasLoaded = false
    private var lastContextKey: String? = null
    private var originalFirstName = ""
    private var originalLastName = ""

    val didLoadInitialData: Boolean
        get() = hasLoaded

    val languageLevels: List<String>
        get() = listOf("Native", "Fluent", "Conversational", "Basic")

    val availabilityStatusOptions: List<String>
        get() = listOf("AVAILABLE", "BUSY", "UNAVAILABLE")

    val responseTimeOptions: List<String>
        get() = listOf("1", "2", "4", "8", "24")

    val timezoneOptions: List<String>
        get() {
            val zones = availableLanguages
                .mapNotNull { it.timezone?.trim() }
                .filter { it.isNotEmpty() }

            val merged = (zones + listOf(profile.availability.timezone))
                .map { it.trim() }
                .filter { it.isNotEmpty() }
                .toSet()
                .sorted()

            return if (merged.isEmpty()) listOf("Europe/Bucharest") else merged
        }

    val nameHasChanged: Boolean
        get() {
            return profile.firstName.trim() != originalFirstName.trim() ||
                profile.lastName.trim() != originalLastName.trim()
        }

    fun load(token: String, language: String, force: Boolean = false) {
        if (isLoading) return
        val contextKey = "${token.trim()}|${language.trim().lowercase(Locale.ROOT)}"
        if (!force && hasLoaded && lastContextKey == contextKey) return

        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            runCatching {
                val loadedProfile = appContainer.providerProfileRepository.getProviderProfile(
                    bearerToken = token,
                    language = language,
                )
                val languageOptions = runCatching {
                    appContainer.providerProfileRepository.getProviderProfileLanguages(language = language)
                }.getOrElse { emptyList() }

                availableLanguages = languageOptions
                applyLoadedProfile(loadedProfile, languageOptions)
                validationErrors = emptySet()
                hasLoaded = true
                lastContextKey = contextKey
                errorMessage = null
            }.onFailure { error ->
                if (!hasLoaded) {
                    errorMessage = resolvedMessage(
                        error = error,
                        fallback = "Nu am putut încărca profilul provider.",
                    )
                }
            }

            isLoading = false
        }
    }

    fun save(
        token: String,
        language: String,
        onCompleted: (Boolean) -> Unit = {},
    ) {
        if (isSaving) return
        if (!validate()) {
            errorMessage = "Completează câmpurile obligatorii."
            onCompleted(false)
            return
        }

        isSaving = true
        errorMessage = null
        successMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.providerProfileRepository.updateProviderProfile(
                    profile = profile,
                    bearerToken = token,
                    language = language,
                )
                val refreshed = appContainer.providerProfileRepository.getProviderProfile(
                    bearerToken = token,
                    language = language,
                )
                applyLoadedProfile(refreshed, availableLanguages)
                validationErrors = emptySet()
                successMessage = "Profilul provider a fost actualizat."
                true
            }.getOrElse { error ->
                errorMessage = resolvedMessage(
                    error = error,
                    fallback = "A apărut o eroare la salvarea profilului.",
                )
                false
            }

            isSaving = false
            onCompleted(success)
        }
    }

    fun uploadAvatar(
        imageData: ByteArray,
        fileName: String,
        mimeType: String,
        token: String,
        language: String,
        onCompleted: (Boolean) -> Unit = {},
    ) {
        if (isUploadingAvatar) return

        isUploadingAvatar = true
        errorMessage = null
        successMessage = null

        viewModelScope.launch {
            val success = runCatching {
                val uploadedUrl = appContainer.providerProfileRepository.uploadAvatar(
                    imageData = imageData,
                    fileName = fileName,
                    mimeType = mimeType,
                    bearerToken = token,
                    language = language,
                )
                val refreshed = appContainer.providerProfileRepository.getProviderProfile(
                    bearerToken = token,
                    language = language,
                )
                applyLoadedProfile(refreshed, availableLanguages)

                if (!uploadedUrl.isNullOrBlank()) {
                    updateProfile { it.avatar = uploadedUrl }
                }

                successMessage = "Poza de profil a fost actualizată."
                true
            }.getOrElse { error ->
                errorMessage = resolvedMessage(
                    error = error,
                    fallback = "Nu am putut actualiza poza de profil.",
                )
                false
            }

            isUploadingAvatar = false
            onCompleted(success)
        }
    }

    fun clearStatusMessages() {
        errorMessage = null
        successMessage = null
    }

    fun showError(message: String) {
        successMessage = null
        errorMessage = message.trim().ifEmpty { message }
    }

    fun updateProfile(mutator: (ProviderProfileData) -> Unit) {
        val next = profile.deepCopy()
        mutator(next)
        profile = next
    }

    fun validate(): Boolean {
        val fields = linkedSetOf<ProviderProfileValidationField>()
        if (profile.firstName.trim().isEmpty()) fields += ProviderProfileValidationField.FIRST_NAME
        if (profile.lastName.trim().isEmpty()) fields += ProviderProfileValidationField.LAST_NAME
        if (profile.email.trim().isEmpty()) fields += ProviderProfileValidationField.EMAIL
        if (profile.phone.trim().isEmpty()) fields += ProviderProfileValidationField.PHONE
        if (profile.bio.trim().isEmpty()) fields += ProviderProfileValidationField.BIO
        if (profile.availability.status.trim().isEmpty()) fields += ProviderProfileValidationField.AVAILABILITY_STATUS
        if (profile.availability.hoursPerWeek.trim().isEmpty()) fields += ProviderProfileValidationField.HOURS_PER_WEEK
        validationErrors = fields
        return fields.isEmpty()
    }

    fun addLanguage() {
        val trimmedName = newLanguageName.trim()
        if (trimmedName.isEmpty()) return

        val option = availableLanguages.firstOrNull {
            it.name.equals(trimmedName, ignoreCase = true)
        }

        updateProfile { current ->
            val next = current.languages.toMutableList()
            next += ProviderProfileLanguageEntry(
                name = option?.name ?: trimmedName,
                level = newLanguageLevel.trim().ifEmpty { "Basic" },
                flag = option?.flag.orEmpty(),
            )
            current.languages = next
        }

        newLanguageName = ""
        newLanguageLevel = "Basic"
    }

    fun removeLanguage(id: String) {
        updateProfile { current ->
            current.languages = current.languages.filterNot { it.id == id }
        }
    }

    fun addCertification() {
        if (newCertificationName.trim().isEmpty() || newCertificationIssuer.trim().isEmpty()) return
        updateProfile { current ->
            val next = current.certifications.toMutableList()
            next += ProviderProfileCertification(
                name = newCertificationName,
                issuer = newCertificationIssuer,
                date = newCertificationDate,
                credentialID = newCertificationCredentialID,
                verified = false,
            )
            current.certifications = next
        }
        newCertificationName = ""
        newCertificationIssuer = ""
        newCertificationDate = ""
        newCertificationCredentialID = ""
    }

    fun removeCertification(id: String) {
        updateProfile { current ->
            current.certifications = current.certifications.filterNot { it.id == id }
        }
    }

    fun addEducation() {
        if (newEducationDegree.trim().isEmpty() || newEducationInstitution.trim().isEmpty()) return
        updateProfile { current ->
            val next = current.education.toMutableList()
            next += ProviderProfileEducation(
                degree = newEducationDegree,
                institution = newEducationInstitution,
                attendedFrom = newEducationFrom,
                attendedTo = newEducationTo,
                studyArea = newEducationStudyArea,
            )
            current.education = next
        }
        newEducationDegree = ""
        newEducationInstitution = ""
        newEducationFrom = ""
        newEducationTo = ""
        newEducationStudyArea = ""
    }

    fun removeEducation(id: String) {
        updateProfile { current ->
            current.education = current.education.filterNot { it.id == id }
        }
    }

    fun addWorkHistory() {
        if (newWorkPosition.trim().isEmpty() || newWorkCompany.trim().isEmpty()) return
        updateProfile { current ->
            val next = current.workHistory.toMutableList()
            next += ProviderProfileWorkHistory(
                title = newWorkTitle,
                position = newWorkPosition,
                company = newWorkCompany,
                city = newWorkCity,
                country = newWorkCountry,
                startDate = newWorkStartDate,
                endDate = newWorkEndDate,
                description = newWorkDescription,
                currentWorking = newWorkCurrentWorking,
            )
            current.workHistory = next
        }
        newWorkTitle = ""
        newWorkPosition = ""
        newWorkCompany = ""
        newWorkCity = ""
        newWorkCountry = ""
        newWorkStartDate = ""
        newWorkEndDate = ""
        newWorkDescription = ""
        newWorkCurrentWorking = false
    }

    fun removeWorkHistory(id: String) {
        updateProfile { current ->
            current.workHistory = current.workHistory.filterNot { it.id == id }
        }
    }

    fun addPortfolio() {
        if (newPortfolioTitle.trim().isEmpty() || newPortfolioDescription.trim().isEmpty()) return
        val technologies = newPortfolioTechnologies
            .split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
        updateProfile { current ->
            val next = current.portfolio.toMutableList()
            next += ProviderProfilePortfolio(
                title = newPortfolioTitle,
                description = newPortfolioDescription,
                image = newPortfolioImage,
                role = newPortfolioRole,
                technologies = technologies,
                url = newPortfolioURL,
            )
            current.portfolio = next
        }
        newPortfolioTitle = ""
        newPortfolioDescription = ""
        newPortfolioImage = ""
        newPortfolioRole = ""
        newPortfolioTechnologies = ""
        newPortfolioURL = ""
    }

    fun removePortfolio(id: String) {
        updateProfile { current ->
            current.portfolio = current.portfolio.filterNot { it.id == id }
        }
    }

    fun updateWorkingHours(
        day: ProviderProfileWeekDay,
        start: String? = null,
        end: String? = null,
        enabled: Boolean? = null,
    ) {
        updateProfile { current ->
            val workingHours = current.availability.workingHours.toMutableMap()
            val existing = (workingHours[day] ?: com.trustora.app.core.models.ProviderProfileWorkingHour.defaults(day)).copy()
            if (start != null) existing.start = start
            if (end != null) existing.end = end
            if (enabled != null) existing.enabled = enabled
            workingHours[day] = existing

            current.availability = current.availability.copy(
                workingHours = workingHours,
            )
        }
    }

    fun flagForLanguage(languageName: String): String {
        return availableLanguages.firstOrNull { option ->
            option.name.equals(languageName.trim(), ignoreCase = true)
        }?.flag.orEmpty()
    }

    private fun applyLoadedProfile(
        loadedProfile: ProviderProfileData,
        languageOptions: List<ProviderProfileLanguageOption>,
    ) {
        profile = applyLanguageFlags(profile = loadedProfile, options = languageOptions)
        originalFirstName = profile.firstName
        originalLastName = profile.lastName
    }

    private fun applyLanguageFlags(
        profile: ProviderProfileData,
        options: List<ProviderProfileLanguageOption>,
    ): ProviderProfileData {
        val next = profile.deepCopy()
        next.languages = next.languages.map { entry ->
            if (entry.flag.trim().isNotEmpty()) {
                entry
            } else {
                val derivedFlag = options.firstOrNull {
                    it.name.equals(entry.name.trim(), ignoreCase = true)
                }?.flag.orEmpty()
                entry.copy(flag = derivedFlag)
            }
        }
        return next
    }

    private fun resolvedMessage(error: Throwable, fallback: String): String {
        if (error is HttpException) {
            val payload = error.response()?.errorBody()?.string().orEmpty()
            if (payload.isNotBlank()) {
                val root = runCatching { JsonParser.parseString(payload).asJsonObject }.getOrNull()
                if (root != null) {
                    root.objectOrNull("errors")?.let { errors ->
                        firstErrorMessage(errors)?.let { return it }
                    }
                    root.stringOrNull("message")?.let { return it }
                }
            }
        }

        val explicit = error.message?.trim().orEmpty()
        if (explicit.isNotEmpty()) {
            return explicit
        }
        return fallback
    }

    private fun firstErrorMessage(errors: JsonObject): String? {
        errors.entrySet().forEach { (_, value) ->
            if (value.isJsonArray) {
                val first = value.asJsonArray.firstOrNull()?.asStringOrNull()?.trim()
                if (!first.isNullOrEmpty()) return first
            }
            if (value.isJsonPrimitive) {
                val message = value.asStringOrNull()?.trim()
                if (!message.isNullOrEmpty()) return message
            }
        }
        return null
    }

    private fun ProviderProfileData.deepCopy(): ProviderProfileData {
        return copy(
            availability = availability.copy(
                workingHours = availability.workingHours.mapValues { (_, hour) -> hour.copy() },
            ),
            languages = languages.map { it.copy() },
            certifications = certifications.map { it.copy() },
            education = education.map { it.copy() },
            workHistory = workHistory.map { it.copy() },
            portfolio = portfolio.map { it.copy() },
            trustMetrics = trustMetrics.copy(
                badges = trustMetrics.badges.toList(),
            ),
        )
    }

    private fun com.google.gson.JsonElement.asStringOrNull(): String? {
        return runCatching { asString }.getOrNull()
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ProviderProfileViewModel(appContainer) as T
        }
    }
}

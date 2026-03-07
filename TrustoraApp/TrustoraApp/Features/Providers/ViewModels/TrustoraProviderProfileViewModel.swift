import Foundation
import Combine

final class TrustoraProviderProfileViewModel: ObservableObject {
    @Published var activeTab: ProviderProfileTab = .basic
    @Published var profile: ProviderProfileData = .empty
    @Published var availableLanguages: [ProviderProfileLanguageOption] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var isUploadingAvatar = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var validationErrors: Set<ProviderProfileValidationField> = []

    @Published var newLanguageName = ""
    @Published var newLanguageLevel = "Basic"

    @Published var newCertificationName = ""
    @Published var newCertificationIssuer = ""
    @Published var newCertificationDate = ""
    @Published var newCertificationCredentialID = ""

    @Published var newEducationDegree = ""
    @Published var newEducationInstitution = ""
    @Published var newEducationFrom = ""
    @Published var newEducationTo = ""
    @Published var newEducationStudyArea = ""

    @Published var newWorkTitle = ""
    @Published var newWorkPosition = ""
    @Published var newWorkCompany = ""
    @Published var newWorkCity = ""
    @Published var newWorkCountry = ""
    @Published var newWorkStartDate = ""
    @Published var newWorkEndDate = ""
    @Published var newWorkDescription = ""
    @Published var newWorkCurrentWorking = false

    @Published var newPortfolioTitle = ""
    @Published var newPortfolioDescription = ""
    @Published var newPortfolioImage = ""
    @Published var newPortfolioRole = ""
    @Published var newPortfolioTechnologies = ""
    @Published var newPortfolioURL = ""

    private var hasLoaded = false
    private var originalFirstName = ""
    private var originalLastName = ""

    var didLoadInitialData: Bool {
        hasLoaded
    }

    var languageLevels: [String] {
        ["Native", "Fluent", "Conversational", "Basic"]
    }

    var availabilityStatusOptions: [(value: String, labelKey: String)] {
        [
            ("AVAILABLE", "provider.profile.availability.available"),
            ("BUSY", "provider.profile.availability.busy"),
            ("UNAVAILABLE", "provider.profile.availability.unavailable"),
        ]
    }

    var responseTimeOptions: [String] {
        ["1", "2", "4", "8", "24"]
    }

    var timezoneOptions: [String] {
        let zones = availableLanguages
            .compactMap(\.timezone)
            .filter { !$0.isEmpty }

        let merged = Array(Set(zones + [profile.availability.timezone]))
            .filter { !$0.isEmpty }
            .sorted()

        return merged.isEmpty ? ["Europe/Bucharest"] : merged
    }

    var nameHasChanged: Bool {
        trimmed(profile.firstName) != trimmed(originalFirstName) ||
        trimmed(profile.lastName) != trimmed(originalLastName)
    }

    @MainActor
    func loadIfNeeded(token: String, language: String) async {
        guard !hasLoaded else {
            return
        }

        await load(token: token, language: language)
    }

    @MainActor
    func load(token: String, language: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let loadedProfile = try await TrustoraAPIClient.shared.getProviderProfile(
                bearerToken: token,
                language: language
            )

            let languageOptions = (try? await TrustoraAPIClient.shared.getProviderProfileLanguages(language: language)) ?? []

            availableLanguages = languageOptions
            applyLoadedProfile(loadedProfile, languageOptions: languageOptions)
            errorMessage = nil
            validationErrors = []
            hasLoaded = true
        } catch {
            if !hasLoaded {
                errorMessage = message(
                    from: error,
                    fallback: "Nu am putut încărca profilul provider."
                )
            }
        }

        isLoading = false
    }

    @MainActor
    func save(token: String, language: String) async -> Bool {
        guard validate() else {
            errorMessage = "Completează câmpurile obligatorii."
            return false
        }

        isSaving = true
        errorMessage = nil
        successMessage = nil

        do {
            try await TrustoraAPIClient.shared.updateProviderProfile(
                ProviderProfileUpdatePayload(profile: profile),
                bearerToken: token,
                language: language
            )

            let refreshedProfile = try await TrustoraAPIClient.shared.getProviderProfile(
                bearerToken: token,
                language: language
            )

            applyLoadedProfile(refreshedProfile, languageOptions: availableLanguages)
            successMessage = "Profilul provider a fost actualizat."
            validationErrors = []
            isSaving = false
            return true
        } catch {
            errorMessage = message(
                from: error,
                fallback: "A apărut o eroare la salvarea profilului."
            )
            isSaving = false
            return false
        }
    }

    @MainActor
    func uploadAvatar(
        imageData: Data,
        fileName: String,
        mimeType: String,
        bearerToken: String,
        language: String
    ) async -> Bool {
        isUploadingAvatar = true
        errorMessage = nil
        successMessage = nil

        do {
            let uploadedURL = try await TrustoraAPIClient.shared.uploadAvatar(
                imageData,
                fileName: fileName,
                mimeType: mimeType,
                bearerToken: bearerToken,
                language: language
            )

            let refreshedProfile = try await TrustoraAPIClient.shared.getProviderProfile(
                bearerToken: bearerToken,
                language: language
            )

            applyLoadedProfile(refreshedProfile, languageOptions: availableLanguages)

            if let uploadedURL, !trimmed(uploadedURL).isEmpty {
                profile.avatar = uploadedURL
            }

            successMessage = "Poza de profil a fost actualizată."
            isUploadingAvatar = false
            return true
        } catch {
            errorMessage = message(
                from: error,
                fallback: "Nu am putut actualiza poza de profil."
            )
            isUploadingAvatar = false
            return false
        }
    }

    func clearStatusMessages() {
        errorMessage = nil
        successMessage = nil
    }

    func validate() -> Bool {
        var fields = Set<ProviderProfileValidationField>()

        if trimmed(profile.firstName).isEmpty { fields.insert(.firstName) }
        if trimmed(profile.lastName).isEmpty { fields.insert(.lastName) }
        if trimmed(profile.email).isEmpty { fields.insert(.email) }
        if trimmed(profile.phone).isEmpty { fields.insert(.phone) }
        if trimmed(profile.bio).isEmpty { fields.insert(.bio) }
        if trimmed(profile.availability.status).isEmpty { fields.insert(.availabilityStatus) }
        if trimmed(profile.availability.hoursPerWeek).isEmpty { fields.insert(.hoursPerWeek) }

        validationErrors = fields
        return fields.isEmpty
    }

    func addLanguage() {
        let trimmedName = trimmed(newLanguageName)
        guard !trimmedName.isEmpty else {
            return
        }

        let option = availableLanguages.first {
            $0.name.caseInsensitiveCompare(trimmedName) == .orderedSame
        }

        let flag = option?.flag ?? ""
        profile.languages.append(
            ProviderProfileLanguageEntry(
                name: option?.name ?? trimmedName,
                level: trimmedOrFallback(newLanguageLevel, fallback: "Basic"),
                flag: flag
            )
        )

        newLanguageName = ""
        newLanguageLevel = "Basic"
    }

    func removeLanguage(id: ProviderProfileLanguageEntry.ID) {
        profile.languages.removeAll { $0.id == id }
    }

    func addCertification() {
        guard !trimmed(newCertificationName).isEmpty, !trimmed(newCertificationIssuer).isEmpty else {
            return
        }

        profile.certifications.append(
            ProviderProfileCertification(
                name: newCertificationName,
                issuer: newCertificationIssuer,
                date: newCertificationDate,
                credentialID: newCertificationCredentialID,
                verified: false
            )
        )

        newCertificationName = ""
        newCertificationIssuer = ""
        newCertificationDate = ""
        newCertificationCredentialID = ""
    }

    func removeCertification(id: ProviderProfileCertification.ID) {
        profile.certifications.removeAll { $0.id == id }
    }

    func addEducation() {
        guard !trimmed(newEducationDegree).isEmpty, !trimmed(newEducationInstitution).isEmpty else {
            return
        }

        profile.education.append(
            ProviderProfileEducation(
                degree: newEducationDegree,
                institution: newEducationInstitution,
                attendedFrom: newEducationFrom,
                attendedTo: newEducationTo,
                studyArea: newEducationStudyArea
            )
        )

        newEducationDegree = ""
        newEducationInstitution = ""
        newEducationFrom = ""
        newEducationTo = ""
        newEducationStudyArea = ""
    }

    func removeEducation(id: ProviderProfileEducation.ID) {
        profile.education.removeAll { $0.id == id }
    }

    func addWorkHistory() {
        guard !trimmed(newWorkPosition).isEmpty, !trimmed(newWorkCompany).isEmpty else {
            return
        }

        profile.workHistory.append(
            ProviderProfileWorkHistory(
                title: newWorkTitle,
                position: newWorkPosition,
                company: newWorkCompany,
                city: newWorkCity,
                country: newWorkCountry,
                startDate: newWorkStartDate,
                endDate: newWorkEndDate,
                description: newWorkDescription,
                currentWorking: newWorkCurrentWorking
            )
        )

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

    func removeWorkHistory(id: ProviderProfileWorkHistory.ID) {
        profile.workHistory.removeAll { $0.id == id }
    }

    func addPortfolio() {
        guard !trimmed(newPortfolioTitle).isEmpty, !trimmed(newPortfolioDescription).isEmpty else {
            return
        }

        let technologies = newPortfolioTechnologies
            .split(separator: ",")
            .map { trimmed(String($0)) }
            .filter { !$0.isEmpty }

        profile.portfolio.append(
            ProviderProfilePortfolio(
                title: newPortfolioTitle,
                description: newPortfolioDescription,
                image: newPortfolioImage,
                role: newPortfolioRole,
                technologies: technologies,
                url: newPortfolioURL
            )
        )

        newPortfolioTitle = ""
        newPortfolioDescription = ""
        newPortfolioImage = ""
        newPortfolioRole = ""
        newPortfolioTechnologies = ""
        newPortfolioURL = ""
    }

    func removePortfolio(id: ProviderProfilePortfolio.ID) {
        profile.portfolio.removeAll { $0.id == id }
    }

    func updateWorkingHours(
        day: ProviderProfileWeekDay,
        start: String? = nil,
        end: String? = nil,
        enabled: Bool? = nil
    ) {
        var current = profile.availability.workingHours[day] ?? .defaults(for: day)
        if let start {
            current.start = start
        }
        if let end {
            current.end = end
        }
        if let enabled {
            current.enabled = enabled
        }
        profile.availability.workingHours[day] = current
    }

    func flag(for languageName: String) -> String {
        availableLanguages.first {
            $0.name.caseInsensitiveCompare(trimmed(languageName)) == .orderedSame
        }?.flag ?? ""
    }

    private func applyingLanguageFlags(
        to profile: ProviderProfileData,
        options: [ProviderProfileLanguageOption]
    ) -> ProviderProfileData {
        var next = profile
        next.languages = profile.languages.map { entry in
            let existingFlag = trimmed(entry.flag)
            if !existingFlag.isEmpty {
                return entry
            }

            let derivedFlag = options.first {
                $0.name.caseInsensitiveCompare(trimmed(entry.name)) == .orderedSame
            }?.flag ?? ""

            return ProviderProfileLanguageEntry(
                id: entry.id,
                name: entry.name,
                level: entry.level,
                flag: derivedFlag
            )
        }

        return next
    }

    private func applyLoadedProfile(
        _ loadedProfile: ProviderProfileData,
        languageOptions: [ProviderProfileLanguageOption]
    ) {
        profile = applyingLanguageFlags(to: loadedProfile, options: languageOptions)
        originalFirstName = profile.firstName
        originalLastName = profile.lastName
    }

    private func message(from error: Error, fallback: String) -> String {
        if case let TrustoraNetworkError.httpError(_, payload) = error,
           let data = payload.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            if let errors = json["errors"] as? [String: Any] {
                for value in errors.values {
                    if let messages = value as? [String],
                       let firstMessage = messages.first,
                       !firstMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        return firstMessage
                    }
                }
            }

            if let message = json["message"] as? String,
               !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return message
            }
        }

        return fallback
    }
    private func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func trimmedOrFallback(_ value: String, fallback: String) -> String {
        let value = trimmed(value)
        return value.isEmpty ? fallback : value
    }
}

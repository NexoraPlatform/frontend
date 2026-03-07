import SwiftUI
import PhotosUI
import UIKit

struct TrustoraProviderProfileView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String

    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraProviderProfileViewModel()
    @State private var selectedAvatarItem: PhotosPickerItem?
    @State private var avatarCropDraft: ProviderAvatarCropDraft?

    private let primary = TrustoraTheme.primary
    private let background = TrustoraTheme.background
    private let accent = TrustoraTheme.accent

    private var appLanguage: AppLanguage {
        AppLanguage(rawValue: appLanguageRaw) ?? .system
    }

    private var resolvedLanguageCode: String {
        if appLanguage == .system {
            let preferred = Locale.preferredLanguages.first ?? "en"
            let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
            return code == "ro" ? "ro" : "en"
        }

        return appLanguage.rawValue
    }

    private var refreshKey: String {
        [
            authSession.user?.id ?? "guest",
            authSession.accessToken ?? "none",
            resolvedLanguageCode,
        ].joined(separator: "|")
    }

    private var canEditProviderProfile: Bool {
        authSession.user?.hasRole("provider") == true && authSession.accessToken != nil
    }

    var body: some View {
        NavigationStack {
            ZStack {
                background.ignoresSafeArea()

                if !canEditProviderProfile {
                    unavailableState
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: TrustoraMetrics.sectionSpacing) {
                            profileHero
                            tabSelector
                            activeTabContent
                            saveFooterButton
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, 32)
                    }
                    .scrollIndicators(.hidden)
                }

                if viewModel.isLoading && !viewModel.didLoadInitialData {
                    loadingOverlay
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(strings("dashboard.actions.close")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(strings("provider.profile.title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await saveProfile()
                        }
                    } label: {
                        if viewModel.isSaving {
                            ProgressView()
                                .tint(primary)
                        } else {
                            Text(strings("provider.profile.save"))
                                .font(TrustoraTypography.control)
                        }
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(accent)
                    .disabled(!canEditProviderProfile || viewModel.isSaving || viewModel.isLoading || viewModel.isUploadingAvatar)
                }
            }
        }
        .task(id: refreshKey) {
            guard let token = authSession.accessToken, authSession.user?.hasRole("provider") == true else {
                return
            }

            await viewModel.load(token: token, language: resolvedLanguageCode)
        }
        .onChange(of: selectedAvatarItem) { _, newItem in
            guard let newItem else {
                return
            }

            Task {
                await handleAvatarSelection(newItem)
            }
        }
        .sheet(item: $avatarCropDraft) { draft in
            ProviderAvatarCropSheet(
                image: draft.image,
                strings: strings,
                onCancel: {
                    avatarCropDraft = nil
                },
                onApply: { croppedImageData in
                    avatarCropDraft = nil

                    Task {
                        await uploadCroppedAvatar(croppedImageData)
                    }
                }
            )
        }
    }

    private var unavailableState: some View {
        VStack(spacing: 14) {
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(accent)

            Text(strings("provider.profile.unavailable.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)
                .multilineTextAlignment(.center)

            Text(strings("provider.profile.unavailable.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var loadingOverlay: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(accent)
                .scaleEffect(1.1)

            Text(strings("provider.profile.loading"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)
        }
        .padding(20)
        .trustoraCardStyle()
    }

    private var profileHero: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                profileAvatar(size: 68)

                VStack(alignment: .leading, spacing: 6) {
                    Text(fullName)
                        .font(TrustoraTypography.pageTitle)
                        .foregroundStyle(primary)
                        .lineLimit(2)

                    Text(strings("provider.profile.subtitle"))
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 0)

                avatarUploadControl
            }

            if let errorMessage = viewModel.errorMessage, !errorMessage.isEmpty {
                statusBanner(
                    icon: "exclamationmark.triangle.fill",
                    text: errorMessage,
                    foreground: Color(hex: 0x7F1D1D),
                    background: Color(hex: 0xFEE2E2),
                    border: Color(hex: 0xFCA5A5)
                )
            }

            if let successMessage = viewModel.successMessage, !successMessage.isEmpty {
                statusBanner(
                    icon: "checkmark.circle.fill",
                    text: successMessage,
                    foreground: Color(hex: 0x14532D),
                    background: Color(hex: 0xDCFCE7),
                    border: Color(hex: 0x86EFAC)
                )
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(ProviderProfileTab.allCases) { tab in
                    Button {
                        viewModel.activeTab = tab
                    } label: {
                        Text(strings(tabTitleKey(tab)))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.activeTab == tab ? TrustoraTheme.accentButtonText : primary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(viewModel.activeTab == tab ? accent : TrustoraTheme.surface)
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(viewModel.activeTab == tab ? accent : TrustoraTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(6)
        }
        .padding(2)
        .background(TrustoraTheme.surface.opacity(0.82))
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private var avatarUploadControl: some View {
        VStack(alignment: .trailing, spacing: 8) {
            PhotosPicker(selection: $selectedAvatarItem, matching: .images) {
                HStack(spacing: 8) {
                    if viewModel.isUploadingAvatar {
                        ProgressView()
                            .controlSize(.small)
                            .tint(accent)
                    } else {
                        Image(systemName: "photo.badge.plus")
                            .font(.system(size: 12, weight: .bold))
                    }

                    Text(
                        strings(
                            viewModel.isUploadingAvatar
                                ? "provider.profile.avatar.uploading"
                                : "provider.profile.avatar.change"
                        )
                    )
                    .font(TrustoraTypography.control)
                }
                .foregroundStyle(primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 9)
                .background(TrustoraTheme.surface.opacity(0.9))
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(!canEditProviderProfile || viewModel.isLoading || viewModel.isSaving || viewModel.isUploadingAvatar)

            Text(strings("provider.profile.avatar.hint"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 132, alignment: .trailing)
        }
    }

    @ViewBuilder
    private var activeTabContent: some View {
        switch viewModel.activeTab {
        case .basic:
            basicSection
        case .availability:
            availabilitySection
        case .languages:
            languagesSection
        case .experience:
            experienceSection
        case .education:
            educationSection
        case .portfolio:
            portfolioSection
        }
    }

    private var basicSection: some View {
        VStack(spacing: 12) {
            sectionCard(
                title: strings("provider.profile.basic.title"),
                subtitle: strings("provider.profile.basic.subtitle")
            ) {
                VStack(alignment: .leading, spacing: 14) {
                    twoColumnFields(
                        fieldRow(
                            title: strings("provider.profile.fields.first_name"),
                            text: $viewModel.profile.firstName,
                            invalid: viewModel.validationErrors.contains(.firstName)
                        ),
                        fieldRow(
                            title: strings("provider.profile.fields.last_name"),
                            text: $viewModel.profile.lastName,
                            invalid: viewModel.validationErrors.contains(.lastName)
                        )
                    )

                    if viewModel.nameHasChanged {
                        statusBanner(
                            icon: "exclamationmark.circle.fill",
                            text: strings("provider.profile.basic.name_change_warning"),
                            foreground: Color(hex: 0x92400E),
                            background: Color(hex: 0xFEF3C7),
                            border: Color(hex: 0xFCD34D)
                        )
                    }

                    twoColumnFields(
                        fieldRow(
                            title: strings("provider.profile.fields.email"),
                            text: $viewModel.profile.email,
                            keyboard: .emailAddress,
                            autocapitalization: .never,
                            invalid: viewModel.validationErrors.contains(.email)
                        ),
                        fieldRow(
                            title: strings("provider.profile.fields.phone"),
                            text: $viewModel.profile.phone,
                            keyboard: .phonePad,
                            invalid: viewModel.validationErrors.contains(.phone)
                        )
                    )

                    multilineField(
                        title: strings("provider.profile.fields.bio"),
                        text: $viewModel.profile.bio,
                        invalid: viewModel.validationErrors.contains(.bio),
                        minHeight: 120
                    )

                    HStack {
                        Spacer(minLength: 0)
                        Text("\(viewModel.profile.bio.count)/500")
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                    }

                    twoColumnFields(
                        fieldRow(
                            title: strings("provider.profile.fields.website"),
                            text: $viewModel.profile.website,
                            keyboard: .URL,
                            autocapitalization: .never
                        ),
                        fieldRow(title: strings("provider.profile.fields.location"), text: $viewModel.profile.location)
                    )
                }
            }

            sectionCard(
                title: strings("provider.profile.trust.title"),
                subtitle: strings("provider.profile.trust.subtitle")
            ) {
                VStack(spacing: 14) {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        trustMetricCard(strings("provider.profile.trust.rating"), viewModel.profile.trustMetrics.rating)
                        trustMetricCard(strings("provider.profile.trust.reviews"), viewModel.profile.trustMetrics.reviewCount)
                        trustMetricCard(strings("provider.profile.trust.job_success"), viewModel.profile.trustMetrics.jobSuccessScore)
                        trustMetricCard(strings("provider.profile.trust.projects_completed"), viewModel.profile.trustMetrics.totalProjectsCompleted)
                        trustMetricCard(strings("provider.profile.trust.response_rate"), viewModel.profile.trustMetrics.responseRate)
                        trustMetricCard(strings("provider.profile.trust.response_time"), viewModel.profile.trustMetrics.averageResponseTimeMinutes)
                        trustMetricCard(strings("provider.profile.trust.kyc"), viewModel.profile.trustMetrics.kycStatus)
                        trustMetricCard(strings("provider.profile.trust.test_verified"), yesNo(viewModel.profile.trustMetrics.testVerified))
                        trustMetricCard(strings("provider.profile.trust.call_verified"), yesNo(viewModel.profile.trustMetrics.callVerified))
                    }

                    if let totalEarned = viewModel.profile.trustMetrics.totalEarned, !totalEarned.isEmpty {
                        trustMetricCard(strings("provider.profile.trust.total_earned"), totalEarned)
                    }

                    if !viewModel.profile.trustMetrics.badges.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(strings("provider.profile.trust.badges"))
                                .font(TrustoraTypography.label)
                                .foregroundStyle(TrustoraTheme.secondaryText)

                            WrapFlowLayout(items: viewModel.profile.trustMetrics.badges, spacing: 8) { badge in
                                Text(badge)
                                    .font(TrustoraTypography.control)
                                    .foregroundStyle(primary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 7)
                                    .background(TrustoraTheme.mutedSurface)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(TrustoraTheme.border, lineWidth: 1)
                                    )
                            }
                        }
                    }
                }
            }
        }
    }

    private var availabilitySection: some View {
        VStack(spacing: 12) {
            sectionCard(
                title: strings("provider.profile.availability.title"),
                subtitle: strings("provider.profile.availability.subtitle")
            ) {
                VStack(spacing: 14) {
                    menuField(
                        title: strings("provider.profile.availability.status"),
                        invalid: viewModel.validationErrors.contains(.availabilityStatus),
                        currentValue: availabilityLabel(for: viewModel.profile.availability.status)
                    ) {
                        ForEach(viewModel.availabilityStatusOptions, id: \.value) { option in
                            Button(strings(option.labelKey)) {
                                viewModel.profile.availability.status = option.value
                            }
                        }
                    }

                    twoColumnFields(
                        fieldRow(
                            title: strings("provider.profile.availability.hours_per_week"),
                            text: $viewModel.profile.availability.hoursPerWeek,
                            keyboard: .numberPad,
                            invalid: viewModel.validationErrors.contains(.hoursPerWeek)
                        ),
                        menuField(
                            title: strings("provider.profile.availability.response_time"),
                            currentValue: strings("provider.profile.availability.response_time_value").replacingOccurrences(of: "{hours}", with: viewModel.profile.availability.responseTime)
                        ) {
                            ForEach(viewModel.responseTimeOptions, id: \.self) { option in
                                Button(strings("provider.profile.availability.response_time_value").replacingOccurrences(of: "{hours}", with: option)) {
                                    viewModel.profile.availability.responseTime = option
                                }
                            }
                        }
                    )

                    menuField(
                        title: strings("provider.profile.availability.timezone"),
                        currentValue: viewModel.profile.availability.timezone
                    ) {
                        ForEach(viewModel.timezoneOptions, id: \.self) { option in
                            Button(option) {
                                viewModel.profile.availability.timezone = option
                            }
                        }
                    }
                }
            }

            sectionCard(
                title: strings("provider.profile.availability.schedule_title"),
                subtitle: strings("provider.profile.availability.schedule_subtitle")
            ) {
                VStack(spacing: 12) {
                    ForEach(ProviderProfileWeekDay.allCases) { day in
                        let hours = viewModel.profile.availability.workingHours[day] ?? .defaults(for: day)

                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 10) {
                                Toggle(
                                    isOn: Binding(
                                        get: { hours.enabled },
                                        set: { viewModel.updateWorkingHours(day: day, enabled: $0) }
                                    )
                                ) {
                                    Text(strings(dayLabelKey(day)))
                                        .font(TrustoraTypography.emphasis)
                                        .foregroundStyle(primary)
                                }
                            }

                            if hours.enabled {
                                twoColumnFields(
                                    fieldRow(
                                        title: strings("provider.profile.availability.start"),
                                        text: Binding(
                                            get: { viewModel.profile.availability.workingHours[day]?.start ?? hours.start },
                                            set: { viewModel.updateWorkingHours(day: day, start: $0) }
                                        ),
                                        placeholder: "09:00"
                                    ),
                                    fieldRow(
                                        title: strings("provider.profile.availability.end"),
                                        text: Binding(
                                            get: { viewModel.profile.availability.workingHours[day]?.end ?? hours.end },
                                            set: { viewModel.updateWorkingHours(day: day, end: $0) }
                                        ),
                                        placeholder: "18:00"
                                    )
                                )
                            }
                        }
                        .padding(12)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )
                    }
                }
            }
        }
    }

    private var languagesSection: some View {
        VStack(spacing: 12) {
            sectionCard(
                title: strings("provider.profile.languages.title"),
                subtitle: strings("provider.profile.languages.subtitle")
            ) {
                VStack(spacing: 14) {
                    if viewModel.availableLanguages.isEmpty {
                        fieldRow(
                            title: strings("provider.profile.languages.language"),
                            text: $viewModel.newLanguageName
                        )
                    } else {
                        menuField(
                            title: strings("provider.profile.languages.language"),
                            currentValue: viewModel.newLanguageName.isEmpty
                                ? strings("provider.profile.languages.select")
                                : viewModel.newLanguageName
                        ) {
                            ForEach(viewModel.availableLanguages) { option in
                                Button(option.name) {
                                    viewModel.newLanguageName = option.name
                                }
                            }
                        }
                    }

                    menuField(
                        title: strings("provider.profile.languages.level"),
                        currentValue: viewModel.newLanguageLevel
                    ) {
                        ForEach(viewModel.languageLevels, id: \.self) { level in
                            Button(level) {
                                viewModel.newLanguageLevel = level
                            }
                        }
                    }

                    addButton(strings("provider.profile.languages.add")) {
                        viewModel.addLanguage()
                    }

                    VStack(spacing: 8) {
                        if viewModel.profile.languages.isEmpty {
                            emptyState(strings("provider.profile.languages.empty"))
                        } else {
                            ForEach(viewModel.profile.languages) { language in
                                removableRow(
                                    title: language.name,
                                    subtitle: language.level,
                                    leadingText: language.flag
                                ) {
                                    viewModel.removeLanguage(id: language.id)
                                }
                            }
                        }
                    }
                }
            }

            sectionCard(
                title: strings("provider.profile.certifications.title"),
                subtitle: strings("provider.profile.certifications.subtitle")
            ) {
                VStack(spacing: 14) {
                    twoColumnFields(
                        fieldRow(title: strings("provider.profile.certifications.name"), text: $viewModel.newCertificationName),
                        fieldRow(title: strings("provider.profile.certifications.issuer"), text: $viewModel.newCertificationIssuer)
                    )

                    twoColumnFields(
                        fieldRow(title: strings("provider.profile.certifications.date"), text: $viewModel.newCertificationDate, placeholder: "YYYY-MM-DD"),
                        fieldRow(title: strings("provider.profile.certifications.credential_id"), text: $viewModel.newCertificationCredentialID)
                    )

                    addButton(strings("provider.profile.certifications.add")) {
                        viewModel.addCertification()
                    }

                    VStack(spacing: 8) {
                        if viewModel.profile.certifications.isEmpty {
                            emptyState(strings("provider.profile.certifications.empty"))
                        } else {
                            ForEach(viewModel.profile.certifications) { certification in
                                removableRow(
                                    title: certification.name,
                                    subtitle: [certification.issuer, certification.date]
                                        .filter { !trimmed($0).isEmpty }
                                        .joined(separator: " • ")
                                ) {
                                    viewModel.removeCertification(id: certification.id)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private var experienceSection: some View {
        sectionCard(
            title: strings("provider.profile.experience.title"),
            subtitle: strings("provider.profile.experience.subtitle")
        ) {
            VStack(spacing: 14) {
                twoColumnFields(
                    fieldRow(title: strings("provider.profile.experience.professional_title"), text: $viewModel.newWorkTitle),
                    fieldRow(title: strings("provider.profile.experience.position"), text: $viewModel.newWorkPosition)
                )

                twoColumnFields(
                    fieldRow(title: strings("provider.profile.experience.company"), text: $viewModel.newWorkCompany),
                    fieldRow(title: strings("provider.profile.experience.city"), text: $viewModel.newWorkCity)
                )

                twoColumnFields(
                    fieldRow(title: strings("provider.profile.experience.country"), text: $viewModel.newWorkCountry),
                    Toggle(isOn: $viewModel.newWorkCurrentWorking) {
                        Text(strings("provider.profile.experience.current_working"))
                            .font(TrustoraTypography.label)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                    }
                    .padding(.top, 22)
                )

                twoColumnFields(
                    fieldRow(title: strings("provider.profile.experience.start_date"), text: $viewModel.newWorkStartDate, placeholder: "YYYY-MM-DD"),
                    fieldRow(title: strings("provider.profile.experience.end_date"), text: $viewModel.newWorkEndDate, placeholder: "YYYY-MM-DD")
                )

                multilineField(
                    title: strings("provider.profile.experience.description"),
                    text: $viewModel.newWorkDescription,
                    minHeight: 100
                )

                addButton(strings("provider.profile.experience.add")) {
                    viewModel.addWorkHistory()
                }

                VStack(spacing: 8) {
                    if viewModel.profile.workHistory.isEmpty {
                        emptyState(strings("provider.profile.experience.empty"))
                    } else {
                        ForEach(viewModel.profile.workHistory) { item in
                            removableRow(
                                title: trimmed(item.position).isEmpty ? item.company : item.position,
                                subtitle: [item.company, item.city, item.country]
                                    .filter { !trimmed($0).isEmpty }
                                    .joined(separator: " • ")
                            ) {
                                viewModel.removeWorkHistory(id: item.id)
                            }
                        }
                    }
                }
            }
        }
    }

    private var educationSection: some View {
        sectionCard(
            title: strings("provider.profile.education.title"),
            subtitle: strings("provider.profile.education.subtitle")
        ) {
            VStack(spacing: 14) {
                twoColumnFields(
                    fieldRow(title: strings("provider.profile.education.degree"), text: $viewModel.newEducationDegree),
                    fieldRow(title: strings("provider.profile.education.institution"), text: $viewModel.newEducationInstitution)
                )

                twoColumnFields(
                    fieldRow(title: strings("provider.profile.education.attended_from"), text: $viewModel.newEducationFrom, placeholder: "YYYY-MM-DD"),
                    fieldRow(title: strings("provider.profile.education.attended_to"), text: $viewModel.newEducationTo, placeholder: "YYYY-MM-DD")
                )

                fieldRow(title: strings("provider.profile.education.study_area"), text: $viewModel.newEducationStudyArea)

                addButton(strings("provider.profile.education.add")) {
                    viewModel.addEducation()
                }

                VStack(spacing: 8) {
                    if viewModel.profile.education.isEmpty {
                        emptyState(strings("provider.profile.education.empty"))
                    } else {
                        ForEach(viewModel.profile.education) { item in
                            removableRow(
                                title: item.degree,
                                subtitle: [item.institution, item.studyArea]
                                    .filter { !trimmed($0).isEmpty }
                                    .joined(separator: " • ")
                            ) {
                                viewModel.removeEducation(id: item.id)
                            }
                        }
                    }
                }
            }
        }
    }

    private var portfolioSection: some View {
        sectionCard(
            title: strings("provider.profile.portfolio.title"),
            subtitle: strings("provider.profile.portfolio.subtitle")
        ) {
            VStack(spacing: 14) {
                twoColumnFields(
                    fieldRow(title: strings("provider.profile.portfolio.project_title"), text: $viewModel.newPortfolioTitle),
                    fieldRow(title: strings("provider.profile.portfolio.role"), text: $viewModel.newPortfolioRole)
                )

                fieldRow(
                    title: strings("provider.profile.portfolio.project_url"),
                    text: $viewModel.newPortfolioURL,
                    keyboard: .URL,
                    autocapitalization: .never
                )

                fieldRow(
                    title: strings("provider.profile.portfolio.image_url"),
                    text: $viewModel.newPortfolioImage,
                    keyboard: .URL,
                    autocapitalization: .never
                )

                fieldRow(
                    title: strings("provider.profile.portfolio.technologies"),
                    text: $viewModel.newPortfolioTechnologies,
                    placeholder: strings("provider.profile.portfolio.technologies_placeholder")
                )

                multilineField(
                    title: strings("provider.profile.portfolio.description"),
                    text: $viewModel.newPortfolioDescription,
                    minHeight: 100
                )

                addButton(strings("provider.profile.portfolio.add")) {
                    viewModel.addPortfolio()
                }

                VStack(spacing: 8) {
                    if viewModel.profile.portfolio.isEmpty {
                        emptyState(strings("provider.profile.portfolio.empty"))
                    } else {
                        ForEach(viewModel.profile.portfolio) { item in
                            removableRow(
                                title: item.title,
                                subtitle: trimmed(item.role).isEmpty ? item.url : item.role
                            ) {
                                viewModel.removePortfolio(id: item.id)
                            }
                        }
                    }
                }
            }
        }
    }

    private var saveFooterButton: some View {
        Button {
            Task {
                await saveProfile()
            }
        } label: {
            HStack(spacing: 10) {
                if viewModel.isSaving {
                    ProgressView()
                        .tint(TrustoraTheme.accentButtonText)
                } else {
                    Image(systemName: "square.and.arrow.down.fill")
                        .font(.system(size: 15, weight: .bold))
                }

                Text(strings("provider.profile.save"))
                    .font(TrustoraTypography.emphasis)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(TrustoraTheme.accentButtonText)
            .background(accent)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(viewModel.isSaving || viewModel.isLoading)
    }

    private func saveProfile() async {
        guard let token = authSession.accessToken else {
            return
        }

        let didSave = await viewModel.save(token: token, language: resolvedLanguageCode)
        if didSave {
            await authSession.reloadProfile()
        }
    }

    private func sectionCard<Content: View>(
        title: String,
        subtitle: String? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)

                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(TrustoraTypography.paragraph)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            content()
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func fieldRow(
        title: String,
        text: Binding<String>,
        placeholder: String = "",
        keyboard: UIKeyboardType = .default,
        autocapitalization: TextInputAutocapitalization = .sentences,
        invalid: Bool = false
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.label)
                .foregroundStyle(invalid ? Color.red : TrustoraTheme.secondaryText)

            TextField(placeholder, text: text)
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)
                .textInputAutocapitalization(autocapitalization)
                .keyboardType(keyboard)
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(invalid ? Color.red.opacity(0.65) : TrustoraTheme.border, lineWidth: 1)
                )
        }
    }

    private func multilineField(
        title: String,
        text: Binding<String>,
        invalid: Bool = false,
        minHeight: CGFloat
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.label)
                .foregroundStyle(invalid ? Color.red : TrustoraTheme.secondaryText)

            TextEditor(text: text)
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)
                .frame(minHeight: minHeight)
                .padding(8)
                .scrollContentBackground(.hidden)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(invalid ? Color.red.opacity(0.65) : TrustoraTheme.border, lineWidth: 1)
                )
        }
    }

    private func menuField<Items: View>(
        title: String,
        invalid: Bool = false,
        currentValue: String,
        @ViewBuilder items: () -> Items
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.label)
                .foregroundStyle(invalid ? Color.red : TrustoraTheme.secondaryText)

            Menu {
                items()
            } label: {
                HStack(spacing: 10) {
                    Text(currentValue)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)
                        .lineLimit(1)

                    Spacer(minLength: 0)

                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(invalid ? Color.red.opacity(0.65) : TrustoraTheme.border, lineWidth: 1)
                )
            }
        }
    }

    private func addButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                Text(title)
                    .font(TrustoraTypography.control)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .foregroundStyle(TrustoraTheme.accentButtonText)
            .background(accent.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func removableRow(
        title: String,
        subtitle: String,
        leadingText: String? = nil,
        onRemove: @escaping () -> Void
    ) -> some View {
        HStack(alignment: .top, spacing: 10) {
            if let leadingText, !trimmed(leadingText).isEmpty {
                Text(leadingText)
                    .font(TrustoraTypography.body)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TrustoraTypography.emphasis)
                    .foregroundStyle(primary)
                    .fixedSize(horizontal: false, vertical: true)

                if !trimmed(subtitle).isEmpty {
                    Text(subtitle)
                        .font(TrustoraTypography.paragraph)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Spacer(minLength: 0)

            Button {
                onRemove()
            } label: {
                Image(systemName: "trash.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color(hex: 0xB91C1C))
                    .frame(width: 32, height: 32)
                    .background(Color(hex: 0xFEE2E2))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private func trustMetricCard(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TrustoraTypography.label)
                .foregroundStyle(TrustoraTheme.secondaryText)

            Text(value)
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(primary)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private func emptyState(_ text: String) -> some View {
        Text(text)
            .font(TrustoraTypography.paragraph)
            .foregroundStyle(TrustoraTheme.secondaryText)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(TrustoraTheme.border, lineWidth: 1)
            )
    }

    private func statusBanner(
        icon: String,
        text: String,
        foreground: Color,
        background: Color,
        border: Color
    ) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .bold))
            Text(text)
                .font(TrustoraTypography.paragraph)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(foreground)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(border, lineWidth: 1)
        )
    }

    private func profileAvatar(size: CGFloat) -> some View {
        Group {
            if let url = URL(string: viewModel.profile.avatar), !trimmed(viewModel.profile.avatar).isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackAvatar(size: size)
                    }
                }
            } else if let user = authSession.user {
                AuthAvatarView(user: user, size: size)
            } else {
                fallbackAvatar(size: size)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.28, style: .continuous))
    }

    private func fallbackAvatar(size: CGFloat) -> some View {
        ZStack {
            LinearGradient(
                colors: [accent, primary],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(String(fullName.prefix(2)).uppercased())
                .font(.system(size: max(16, size * 0.3), weight: .black))
                .foregroundStyle(Color.white)
        }
    }

    private func twoColumnFields<Left: View, Right: View>(_ left: Left, _ right: Right) -> some View {
        HStack(alignment: .top, spacing: 12) {
            left.frame(maxWidth: .infinity, alignment: .topLeading)
            right.frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }

    private func threeColumnFields<One: View, Two: View, Three: View>(
        _ one: One,
        _ two: Two,
        _ three: Three
    ) -> some View {
        VStack(spacing: 12) {
            twoColumnFields(one, two)
            three
        }
    }

    private func tabTitleKey(_ tab: ProviderProfileTab) -> String {
        switch tab {
        case .basic: return "provider.profile.tabs.basic"
        case .availability: return "provider.profile.tabs.availability"
        case .languages: return "provider.profile.tabs.languages"
        case .experience: return "provider.profile.tabs.experience"
        case .education: return "provider.profile.tabs.education"
        case .portfolio: return "provider.profile.tabs.portfolio"
        }
    }

    private func dayLabelKey(_ day: ProviderProfileWeekDay) -> String {
        "provider.profile.days.\(day.rawValue)"
    }

    private func availabilityLabel(for value: String) -> String {
        switch value.uppercased() {
        case "BUSY":
            return strings("provider.profile.availability.busy")
        case "UNAVAILABLE":
            return strings("provider.profile.availability.unavailable")
        default:
            return strings("provider.profile.availability.available")
        }
    }

    private func yesNo(_ value: Bool) -> String {
        value ? strings("common.yes") : strings("common.no")
    }

    private var avatarUploadFileName: String {
        let sanitized = fullName
            .lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" }

        if sanitized.isEmpty {
            return "avatar.png"
        }

        return "avatar_\(sanitized).png"
    }

    private var fullName: String {
        let name = "\(viewModel.profile.firstName) \(viewModel.profile.lastName)"
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !name.isEmpty {
            return name
        }

        if let user = authSession.user {
            return user.displayName
        }

        return "Trustora"
    }

    private func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    @MainActor
    private func handleAvatarSelection(_ item: PhotosPickerItem) async {
        defer {
            selectedAvatarItem = nil
        }

        guard let rawData = try? await item.loadTransferable(type: Data.self),
              let image = normalizedAvatarImage(from: rawData)
        else {
            viewModel.successMessage = nil
            viewModel.errorMessage = strings("provider.profile.avatar.invalid_image")
            return
        }

        viewModel.clearStatusMessages()
        avatarCropDraft = ProviderAvatarCropDraft(image: image)
    }

    @MainActor
    private func uploadCroppedAvatar(_ imageData: Data) async {
        guard let token = authSession.accessToken else {
            return
        }

        let didUpload = await viewModel.uploadAvatar(
            imageData: imageData,
            fileName: avatarUploadFileName,
            mimeType: "image/png",
            bearerToken: token,
            language: resolvedLanguageCode
        )

        if didUpload {
            await authSession.reloadProfile()
        }
    }

    private func normalizedAvatarImage(from rawData: Data) -> UIImage? {
        UIImage(data: rawData)
    }
}

private struct ProviderAvatarCropDraft: Identifiable {
    let id = UUID()
    let image: UIImage
}

private struct ProviderAvatarCropSheet: View {
    let image: UIImage
    let strings: (String) -> String
    let onCancel: () -> Void
    let onApply: (Data) -> Void

    @State private var zoomScale: CGFloat = 1
    @State private var committedZoomScale: CGFloat = 1
    @State private var imageOffset: CGSize = .zero
    @State private var committedImageOffset: CGSize = .zero

    private let minimumZoom: CGFloat = 1
    private let maximumZoom: CGFloat = 4
    private let exportSize: CGFloat = 512

    private var sourceImageSize: CGSize {
        if let cgImage = image.cgImage {
            return CGSize(width: cgImage.width, height: cgImage.height)
        }

        return image.size
    }

    var body: some View {
        NavigationStack {
            GeometryReader { proxy in
                let cropSize = min(proxy.size.width - 40, proxy.size.height * 0.52, 320)

                VStack(spacing: 22) {
                    VStack(spacing: 8) {
                        Text(strings("provider.profile.avatar.crop.title"))
                            .font(TrustoraTypography.sectionTitle)
                            .foregroundStyle(TrustoraTheme.primary)

                        Text(strings("provider.profile.avatar.crop.subtitle"))
                            .font(TrustoraTypography.body)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 8)

                    cropCanvas(cropSize: cropSize)
                        .frame(maxWidth: .infinity)

                    HStack(spacing: 12) {
                        Button(strings("provider.profile.avatar.crop.reset")) {
                            resetCropState()
                        }
                        .buttonStyle(.plain)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.primary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(TrustoraTheme.surface.opacity(0.9))
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )

                        Spacer(minLength: 0)
                    }

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, TrustoraMetrics.pageTopPadding)
                .padding(.bottom, 20)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(TrustoraTheme.background.ignoresSafeArea())
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button(strings("common.cancel")) {
                            onCancel()
                        }
                        .buttonStyle(.plain)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.primary)
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        Button(strings("provider.profile.avatar.crop.apply")) {
                            if let croppedData = renderCroppedAvatar(cropSize: cropSize) {
                                onApply(croppedData)
                            }
                        }
                        .buttonStyle(.plain)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.accent)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func cropCanvas(cropSize: CGFloat) -> some View {
        let baseImageScale = baseScale(for: cropSize)
        let renderedImageSize = CGSize(
            width: sourceImageSize.width * baseImageScale * zoomScale,
            height: sourceImageSize.height * baseImageScale * zoomScale
        )

        ZStack {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color.black.opacity(0.75))

            Image(uiImage: image)
                .resizable()
                .frame(width: renderedImageSize.width, height: renderedImageSize.height)
                .offset(imageOffset)
                .frame(width: cropSize, height: cropSize)
                .clipShape(Circle())
                .contentShape(Circle())
                .gesture(dragGesture(cropSize: cropSize))
                .simultaneousGesture(magnificationGesture(cropSize: cropSize))

            Circle()
                .stroke(Color.white.opacity(0.95), lineWidth: 2)
                .frame(width: cropSize, height: cropSize)

            cropMaskOverlay(cropSize: cropSize)
                .allowsHitTesting(false)
        }
        .frame(width: cropSize + 36, height: cropSize + 36)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private func cropMaskOverlay(cropSize: CGFloat) -> some View {
        Canvas { context, size in
            var path = Path(CGRect(origin: .zero, size: size))
            let circleRect = CGRect(
                x: (size.width - cropSize) / 2,
                y: (size.height - cropSize) / 2,
                width: cropSize,
                height: cropSize
            )
            path.addEllipse(in: circleRect)
            context.fill(path, with: .color(Color.black.opacity(0.42)), style: FillStyle(eoFill: true))
        }
    }

    private func dragGesture(cropSize: CGFloat) -> some Gesture {
        DragGesture()
            .onChanged { value in
                let proposedOffset = CGSize(
                    width: committedImageOffset.width + value.translation.width,
                    height: committedImageOffset.height + value.translation.height
                )
                imageOffset = clampedOffset(proposedOffset, cropSize: cropSize, zoom: zoomScale)
            }
            .onEnded { value in
                let proposedOffset = CGSize(
                    width: committedImageOffset.width + value.translation.width,
                    height: committedImageOffset.height + value.translation.height
                )
                let clamped = clampedOffset(proposedOffset, cropSize: cropSize, zoom: zoomScale)
                imageOffset = clamped
                committedImageOffset = clamped
            }
    }

    private func magnificationGesture(cropSize: CGFloat) -> some Gesture {
        MagnificationGesture()
            .onChanged { value in
                let proposedZoom = clampedZoom(committedZoomScale * value)
                zoomScale = proposedZoom

                let clamped = clampedOffset(imageOffset, cropSize: cropSize, zoom: proposedZoom)
                imageOffset = clamped
            }
            .onEnded { value in
                let proposedZoom = clampedZoom(committedZoomScale * value)
                zoomScale = proposedZoom
                committedZoomScale = proposedZoom

                let clamped = clampedOffset(imageOffset, cropSize: cropSize, zoom: proposedZoom)
                imageOffset = clamped
                committedImageOffset = clamped
            }
    }

    private func resetCropState() {
        zoomScale = 1
        committedZoomScale = 1
        imageOffset = .zero
        committedImageOffset = .zero
    }

    private func clampedZoom(_ proposedZoom: CGFloat) -> CGFloat {
        min(max(proposedZoom, minimumZoom), maximumZoom)
    }

    private func baseScale(for cropSize: CGFloat) -> CGFloat {
        guard sourceImageSize.width > 0, sourceImageSize.height > 0 else {
            return 1
        }

        return max(cropSize / sourceImageSize.width, cropSize / sourceImageSize.height)
    }

    private func clampedOffset(_ proposedOffset: CGSize, cropSize: CGFloat, zoom: CGFloat) -> CGSize {
        let renderedWidth = sourceImageSize.width * baseScale(for: cropSize) * zoom
        let renderedHeight = sourceImageSize.height * baseScale(for: cropSize) * zoom
        let maxX = max((renderedWidth - cropSize) / 2, 0)
        let maxY = max((renderedHeight - cropSize) / 2, 0)

        return CGSize(
            width: min(max(proposedOffset.width, -maxX), maxX),
            height: min(max(proposedOffset.height, -maxY), maxY)
        )
    }

    private func renderCroppedAvatar(cropSize: CGFloat) -> Data? {
        guard sourceImageSize.width > 0, sourceImageSize.height > 0 else {
            return nil
        }

        let displayScale = baseScale(for: cropSize) * zoomScale
        let outputScale = exportSize / cropSize
        let renderedWidth = sourceImageSize.width * displayScale * outputScale
        let renderedHeight = sourceImageSize.height * displayScale * outputScale
        let drawRect = CGRect(
            x: (exportSize - renderedWidth) / 2 + imageOffset.width * outputScale,
            y: (exportSize - renderedHeight) / 2 + imageOffset.height * outputScale,
            width: renderedWidth,
            height: renderedHeight
        )

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = false

        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: exportSize, height: exportSize),
            format: format
        )

        return renderer.pngData { context in
            let canvasRect = CGRect(x: 0, y: 0, width: exportSize, height: exportSize)
            UIBezierPath(ovalIn: canvasRect).addClip()
            image.draw(in: drawRect)
        }
    }
}

private struct WrapFlowLayout<Item: Hashable, Content: View>: View {
    let items: [Item]
    let spacing: CGFloat
    let content: (Item) -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: spacing) {
            let rows = chunked(items, size: 3)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                HStack(spacing: spacing) {
                    ForEach(row, id: \.self) { item in
                        content(item)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func chunked(_ values: [Item], size: Int) -> [[Item]] {
        guard size > 0 else { return [values] }
        return stride(from: 0, to: values.count, by: size).map {
            Array(values[$0..<min($0 + size, values.count)])
        }
    }
}

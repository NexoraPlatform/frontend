import SwiftUI

private enum ProviderPublicProfileTab: CaseIterable, Identifiable {
    case overview
    case availability
    case experience
    case portfolio

    var id: Self { self }

    var titleKey: String {
        switch self {
        case .overview:
            return "dashboard.tabs.overview"
        case .availability:
            return "provider.profile.tabs.availability"
        case .experience:
            return "provider.profile.tabs.experience"
        case .portfolio:
            return "provider.profile.tabs.portfolio"
        }
    }
}

struct TrustoraProviderPublicProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String

    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraProviderProfileViewModel()
    @State private var activeTab: ProviderPublicProfileTab = .overview

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

    private var canViewProviderProfile: Bool {
        authSession.user?.hasRole("provider") == true && authSession.accessToken != nil
    }

    private var fullName: String {
        let loadedName = "\(viewModel.profile.firstName) \(viewModel.profile.lastName)"
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !loadedName.isEmpty {
            return loadedName
        }

        if let user = authSession.user {
            return user.displayName
        }

        return "Trustora"
    }

    private var initials: String {
        let values = [viewModel.profile.firstName, viewModel.profile.lastName]
            .map { trimmed($0) }
            .filter { !$0.isEmpty }

        if values.isEmpty, let user = authSession.user {
            let parts = user.displayName
                .split(separator: " ")
                .map(String.init)
                .filter { !$0.isEmpty }
            return parts.prefix(2).compactMap(\.first).map(String.init).joined()
        }

        return values.prefix(2).compactMap(\.first).map(String.init).joined()
    }

    private var isVerified: Bool {
        viewModel.profile.trustMetrics.callVerified && viewModel.profile.trustMetrics.testVerified
    }

    var body: some View {
        NavigationStack {
            ZStack {
                background.ignoresSafeArea()

                if !canViewProviderProfile {
                    unavailableState
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: TrustoraMetrics.sectionSpacing) {
                            heroCard
                            tabSelector
                            activeTabContent
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, 30)
                    }
                    .scrollIndicators(.hidden)

                    if viewModel.isLoading && !viewModel.didLoadInitialData {
                        loadingOverlay
                    }
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
                    Text(strings("provider.public.title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard let token = authSession.accessToken, canViewProviderProfile else {
                    return
                }
                await viewModel.load(token: token, language: resolvedLanguageCode)
            }
        }
    }

    private var unavailableState: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(primary)

            Text(strings("provider.profile.unavailable.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)
                .multilineTextAlignment(.center)

            Text(strings("provider.profile.unavailable.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(TrustoraMetrics.cardPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.18)
                .ignoresSafeArea()

            ProgressView(strings("provider.profile.loading"))
                .font(TrustoraTypography.control)
                .padding(16)
                .background(TrustoraTheme.surface.opacity(0.95))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                avatarView(size: 78)

                VStack(alignment: .leading, spacing: 6) {
                    Text(fullName)
                        .font(TrustoraTypography.pageTitle)
                        .foregroundStyle(primary)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        statusBadge(
                            text: availabilityLabel(for: viewModel.profile.availability.status),
                            foreground: Color(hex: 0x0F172A),
                            background: Color(hex: 0xE2E8F0)
                        )

                        statusBadge(
                            text: isVerified ? strings("provider.public.verified") : strings("provider.public.unverified"),
                            foreground: isVerified ? Color(hex: 0x065F46) : Color(hex: 0x7C2D12),
                            background: isVerified ? Color(hex: 0xD1FAE5) : Color(hex: 0xFFEDD5)
                        )
                    }

                    if !trimmed(viewModel.profile.location).isEmpty {
                        Label(trimmed(viewModel.profile.location), systemImage: "mappin.and.ellipse")
                            .font(TrustoraTypography.body)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                            .lineLimit(2)
                    }
                }

                Spacer(minLength: 0)
            }

            if !trimmed(viewModel.profile.bio).isEmpty {
                Text(trimmed(viewModel.profile.bio))
                    .font(TrustoraTypography.paragraph)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineSpacing(2)
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 2), spacing: 8) {
                statItem(
                    title: strings("provider.profile.trust.rating"),
                    value: trimmedOrFallback(viewModel.profile.trustMetrics.rating, fallback: "-")
                )
                statItem(
                    title: strings("provider.profile.trust.reviews"),
                    value: trimmedOrFallback(viewModel.profile.trustMetrics.reviewCount, fallback: "0")
                )
                statItem(
                    title: strings("provider.profile.trust.projects_completed"),
                    value: trimmedOrFallback(viewModel.profile.trustMetrics.totalProjectsCompleted, fallback: "0")
                )
                statItem(
                    title: strings("provider.profile.availability.response_time"),
                    value: responseTimeLabel(viewModel.profile.availability.responseTime)
                )
            }

            if let errorMessage = viewModel.errorMessage, viewModel.didLoadInitialData {
                Text(errorMessage)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(Color(hex: 0xB91C1C))
                    .padding(.top, 2)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(ProviderPublicProfileTab.allCases) { tab in
                    Button {
                        withAnimation(.spring(response: 0.28, dampingFraction: 0.85)) {
                            activeTab = tab
                        }
                    } label: {
                        Text(strings(tab.titleKey))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(activeTab == tab ? TrustoraTheme.accentButtonText : TrustoraTheme.secondaryText)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(activeTab == tab ? accent : TrustoraTheme.surface)
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(activeTab == tab ? accent : TrustoraTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(6)
        }
        .trustoraCardStyle(cornerRadius: TrustoraMetrics.compactCardRadius, background: TrustoraTheme.mutedSurface)
    }

    @ViewBuilder
    private var activeTabContent: some View {
        switch activeTab {
        case .overview:
            overviewContent
        case .availability:
            availabilityContent
        case .experience:
            experienceContent
        case .portfolio:
            portfolioContent
        }
    }

    private var overviewContent: some View {
        VStack(spacing: TrustoraMetrics.sectionSpacing) {
            sectionCard(
                titleKey: "provider.public.about_title",
                subtitleKey: "provider.public.about_subtitle"
            ) {
                Text(trimmedOrFallback(viewModel.profile.bio, fallback: strings("provider.public.empty.bio")))
                    .font(TrustoraTypography.paragraph)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineSpacing(2)
            }

            sectionCard(titleKey: "provider.public.contact_title") {
                VStack(spacing: 10) {
                    contactRow(icon: "envelope.fill", label: strings("provider.profile.fields.email"), value: viewModel.profile.email)
                    contactRow(icon: "phone.fill", label: strings("provider.profile.fields.phone"), value: viewModel.profile.phone)
                    contactRow(icon: "building.2.fill", label: strings("provider.profile.fields.company"), value: viewModel.profile.company)
                    contactRow(icon: "globe", label: strings("provider.profile.fields.website"), value: viewModel.profile.website, isLink: true)
                    contactRow(icon: "mappin.and.ellipse", label: strings("provider.profile.fields.location"), value: viewModel.profile.location)
                }
            }

            if !viewModel.profile.languages.isEmpty {
                sectionCard(titleKey: "provider.profile.languages.title") {
                    VStack(spacing: 10) {
                        ForEach(viewModel.profile.languages) { language in
                            HStack(spacing: 10) {
                                if !trimmed(language.flag).isEmpty {
                                    Text(language.flag)
                                        .font(.system(size: 20))
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(trimmedOrFallback(language.name, fallback: "-"))
                                        .font(TrustoraTypography.body)
                                        .foregroundStyle(primary)
                                    Text(trimmedOrFallback(language.level, fallback: "-"))
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }
                                Spacer(minLength: 0)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 4)
                        }
                    }
                }
            }

            if !viewModel.profile.certifications.isEmpty {
                sectionCard(titleKey: "provider.profile.certifications.title") {
                    VStack(spacing: 10) {
                        ForEach(viewModel.profile.certifications) { certification in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack(spacing: 8) {
                                    Text(trimmedOrFallback(certification.name, fallback: "-"))
                                        .font(TrustoraTypography.body)
                                        .foregroundStyle(primary)
                                    if certification.verified {
                                        statusBadge(
                                            text: strings("provider.public.verified"),
                                            foreground: Color(hex: 0x065F46),
                                            background: Color(hex: 0xD1FAE5)
                                        )
                                    }
                                }
                                Text(trimmedOrFallback(certification.issuer, fallback: "-"))
                                    .font(TrustoraTypography.paragraph)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                if !trimmed(certification.date).isEmpty {
                                    Text(certification.date)
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .trustoraCardStyle(
                                cornerRadius: TrustoraMetrics.compactCardRadius,
                                background: TrustoraTheme.mutedSurface
                            )
                        }
                    }
                }
            }

            if !viewModel.profile.education.isEmpty {
                sectionCard(titleKey: "provider.profile.education.title") {
                    VStack(spacing: 10) {
                        ForEach(viewModel.profile.education) { education in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(trimmedOrFallback(education.degree, fallback: "-"))
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(primary)
                                Text(trimmedOrFallback(education.institution, fallback: "-"))
                                    .font(TrustoraTypography.paragraph)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                Text(educationDateRange(for: education))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .trustoraCardStyle(
                                cornerRadius: TrustoraMetrics.compactCardRadius,
                                background: TrustoraTheme.mutedSurface
                            )
                        }
                    }
                }
            }
        }
    }

    private var availabilityContent: some View {
        VStack(spacing: TrustoraMetrics.sectionSpacing) {
            sectionCard(
                titleKey: "provider.profile.availability.title",
                subtitleKey: "provider.public.availability_subtitle"
            ) {
                VStack(spacing: 10) {
                    infoRow(
                        label: strings("provider.profile.availability.status"),
                        value: availabilityLabel(for: viewModel.profile.availability.status)
                    )
                    infoRow(
                        label: strings("provider.profile.availability.hours_per_week"),
                        value: "\(trimmedOrFallback(viewModel.profile.availability.hoursPerWeek, fallback: "0"))h"
                    )
                    infoRow(
                        label: strings("provider.profile.availability.timezone"),
                        value: trimmedOrFallback(viewModel.profile.availability.timezone, fallback: "-")
                    )
                    infoRow(
                        label: strings("provider.profile.availability.response_time"),
                        value: responseTimeLabel(viewModel.profile.availability.responseTime)
                    )
                }
            }

            sectionCard(
                titleKey: "provider.profile.availability.schedule_title",
                subtitleKey: "provider.profile.availability.schedule_subtitle"
            ) {
                VStack(spacing: 8) {
                    ForEach(ProviderProfileWeekDay.allCases) { day in
                        let hours = viewModel.profile.availability.workingHours[day] ?? .defaults(for: day)
                        HStack(spacing: 10) {
                            Text(dayLabel(day))
                                .font(TrustoraTypography.body)
                                .foregroundStyle(primary)
                            Spacer(minLength: 0)
                            Text(scheduleLabel(for: hours))
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(hours.enabled ? Color(hex: 0x0C8F5D) : TrustoraTheme.tertiaryText)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
    }

    private var experienceContent: some View {
        VStack(spacing: TrustoraMetrics.sectionSpacing) {
            if viewModel.profile.workHistory.isEmpty {
                emptyStateCard(
                    titleKey: "provider.profile.experience.title",
                    messageKey: "provider.public.empty.experience"
                )
            } else {
                sectionCard(titleKey: "provider.profile.experience.title") {
                    VStack(spacing: 10) {
                        ForEach(viewModel.profile.workHistory) { work in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(trimmedOrFallback(work.position, fallback: trimmedOrFallback(work.title, fallback: "-")))
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(primary)
                                Text(trimmedOrFallback(work.company, fallback: "-"))
                                    .font(TrustoraTypography.paragraph)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                Text(workDateRange(for: work))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                if !trimmed(work.city).isEmpty || !trimmed(work.country).isEmpty {
                                    Text([trimmed(work.city), trimmed(work.country)]
                                        .filter { !$0.isEmpty }
                                        .joined(separator: ", "))
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }
                                if !trimmed(work.description).isEmpty {
                                    Text(trimmed(work.description))
                                        .font(TrustoraTypography.paragraph)
                                        .foregroundStyle(TrustoraTheme.secondaryText)
                                        .lineSpacing(2)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .trustoraCardStyle(
                                cornerRadius: TrustoraMetrics.compactCardRadius,
                                background: TrustoraTheme.mutedSurface
                            )
                        }
                    }
                }
            }
        }
    }

    private var portfolioContent: some View {
        VStack(spacing: TrustoraMetrics.sectionSpacing) {
            if viewModel.profile.portfolio.isEmpty {
                emptyStateCard(
                    titleKey: "provider.profile.portfolio.title",
                    messageKey: "provider.public.empty.portfolio"
                )
            } else {
                sectionCard(titleKey: "provider.profile.portfolio.title") {
                    VStack(spacing: 12) {
                        ForEach(viewModel.profile.portfolio) { item in
                            VStack(alignment: .leading, spacing: 8) {
                                if let imageURL = URL(string: trimmed(item.image)), !trimmed(item.image).isEmpty {
                                    AsyncImage(url: imageURL) { phase in
                                        switch phase {
                                        case .empty:
                                            ZStack {
                                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                                    .fill(Color(hex: 0xE2E8F0))
                                                ProgressView()
                                            }
                                        case .success(let image):
                                            image
                                                .resizable()
                                                .scaledToFill()
                                        case .failure:
                                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                                .fill(Color(hex: 0xE2E8F0))
                                                .overlay(
                                                    Image(systemName: "photo")
                                                        .font(.system(size: 20, weight: .bold))
                                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                                )
                                        @unknown default:
                                            EmptyView()
                                        }
                                    }
                                    .frame(height: 130)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                }

                                Text(trimmedOrFallback(item.title, fallback: "-"))
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(primary)

                                if !trimmed(item.role).isEmpty {
                                    Text(item.role)
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }

                                if !trimmed(item.description).isEmpty {
                                    Text(item.description)
                                        .font(TrustoraTypography.paragraph)
                                        .foregroundStyle(TrustoraTheme.secondaryText)
                                        .lineSpacing(2)
                                }

                                if !item.technologies.isEmpty {
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 6) {
                                            ForEach(Array(item.technologies.enumerated()), id: \.offset) { _, technology in
                                                if !trimmed(technology).isEmpty {
                                                    Text(technology)
                                                        .font(TrustoraTypography.caption)
                                                        .foregroundStyle(primary)
                                                        .padding(.horizontal, 10)
                                                        .padding(.vertical, 5)
                                                        .background(TrustoraTheme.surface)
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

                                if let url = URL(string: trimmed(item.url)), !trimmed(item.url).isEmpty {
                                    Button {
                                        openURL(url)
                                    } label: {
                                        Label(strings("provider.public.open_project"), systemImage: "arrow.up.right.square")
                                            .font(TrustoraTypography.control)
                                            .foregroundStyle(primary)
                                    }
                                    .buttonStyle(.plain)
                                    .padding(.top, 2)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .trustoraCardStyle(
                                cornerRadius: TrustoraMetrics.compactCardRadius,
                                background: TrustoraTheme.mutedSurface
                            )
                        }
                    }
                }
            }
        }
    }

    private func sectionCard<Content: View>(
        titleKey: String,
        subtitleKey: String? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(strings(titleKey))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(primary)

            if let subtitleKey, !subtitleKey.isEmpty {
                Text(strings(subtitleKey))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }

            content()
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func emptyStateCard(titleKey: String, messageKey: String) -> some View {
        sectionCard(titleKey: titleKey) {
            Text(strings(messageKey))
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
        }
    }

    private func avatarView(size: CGFloat) -> some View {
        Group {
            if let url = URL(string: trimmed(viewModel.profile.avatar)), !trimmed(viewModel.profile.avatar).isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(width: size, height: size)
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                            .frame(width: size, height: size)
                            .clipShape(Circle())
                    case .failure:
                        fallbackAvatar(size: size)
                    @unknown default:
                        fallbackAvatar(size: size)
                    }
                }
            } else {
                fallbackAvatar(size: size)
            }
        }
        .overlay(
            Circle()
                .stroke(Color.white, lineWidth: 2)
        )
    }

    private func fallbackAvatar(size: CGFloat) -> some View {
        Circle()
            .fill(Color(hex: 0xD1FAE5))
            .overlay(
                Text(initials.isEmpty ? "T" : initials)
                    .font(.system(size: size * 0.34, weight: .black))
                    .foregroundStyle(Color(hex: 0x065F46))
            )
            .frame(width: size, height: size)
    }

    private func statusBadge(text: String, foreground: Color, background: Color) -> some View {
        Text(text)
            .font(TrustoraTypography.caption)
            .foregroundStyle(foreground)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(background)
            .clipShape(Capsule())
    }

    private func statItem(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(TrustoraTypography.emphasis)
                .foregroundStyle(primary)
            Text(title)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.mutedSurface
        )
    }

    @ViewBuilder
    private func contactRow(icon: String, label: String, value: String, isLink: Bool = false) -> some View {
        let cleanValue = trimmed(value)
        if !cleanValue.isEmpty {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(width: 16, alignment: .center)

                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    if isLink, let url = URL(string: cleanValue) {
                        Button(cleanValue) {
                            openURL(url)
                        }
                        .buttonStyle(.plain)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Text(cleanValue)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                    }
                }

                Spacer(minLength: 0)
            }
        }
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack(spacing: 10) {
            Text(label)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
            Spacer(minLength: 0)
            Text(value)
                .font(TrustoraTypography.emphasis)
                .foregroundStyle(primary)
                .multilineTextAlignment(.trailing)
        }
    }

    private func availabilityLabel(for status: String) -> String {
        switch trimmed(status).uppercased() {
        case "AVAILABLE":
            return strings("provider.profile.availability.available")
        case "BUSY":
            return strings("provider.profile.availability.busy")
        case "UNAVAILABLE":
            return strings("provider.profile.availability.unavailable")
        default:
            return strings("provider.profile.availability.unavailable")
        }
    }

    private func responseTimeLabel(_ hours: String) -> String {
        let normalized = trimmedOrFallback(hours, fallback: "2")
        let template = strings("provider.profile.availability.response_time_value")
        return template.replacingOccurrences(of: "{hours}", with: normalized)
    }

    private func dayLabel(_ day: ProviderProfileWeekDay) -> String {
        switch day {
        case .monday:
            return strings("provider.profile.days.monday")
        case .tuesday:
            return strings("provider.profile.days.tuesday")
        case .wednesday:
            return strings("provider.profile.days.wednesday")
        case .thursday:
            return strings("provider.profile.days.thursday")
        case .friday:
            return strings("provider.profile.days.friday")
        case .saturday:
            return strings("provider.profile.days.saturday")
        case .sunday:
            return strings("provider.profile.days.sunday")
        }
    }

    private func scheduleLabel(for hours: ProviderProfileWorkingHour) -> String {
        guard hours.enabled else {
            return strings("provider.public.unavailable")
        }

        return "\(trimmedOrFallback(hours.start, fallback: "09:00")) - \(trimmedOrFallback(hours.end, fallback: "18:00"))"
    }

    private func educationDateRange(for education: ProviderProfileEducation) -> String {
        let start = trimmed(education.attendedFrom)
        let end = trimmed(education.attendedTo)

        if !start.isEmpty && !end.isEmpty {
            return "\(start) - \(end)"
        }
        if !start.isEmpty {
            return start
        }
        if !end.isEmpty {
            return end
        }

        return "-"
    }

    private func workDateRange(for work: ProviderProfileWorkHistory) -> String {
        let start = trimmed(work.startDate)
        let end = trimmed(work.endDate)

        if !start.isEmpty && !end.isEmpty {
            return "\(start) - \(end)"
        }
        if !start.isEmpty && work.currentWorking {
            return "\(start) - \(strings("provider.public.now"))"
        }
        if !start.isEmpty {
            return start
        }
        if !end.isEmpty {
            return end
        }

        return "-"
    }

    private func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func trimmedOrFallback(_ value: String, fallback: String) -> String {
        let clean = trimmed(value)
        return clean.isEmpty ? fallback : clean
    }
}

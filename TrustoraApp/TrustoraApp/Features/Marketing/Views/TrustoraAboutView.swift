import SwiftUI

struct TrustoraAboutView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String

    let strings: (String) -> String
    let useSharedChrome: Bool
    let onBack: (() -> Void)?
    let onOpenServices: (() -> Void)?
    let onOpenDashboard: (() -> Void)?
    let onOpenAuth: ((TrustoraAuthMode) -> Void)?

    @State private var isServicesPresented = false
    @State private var isDashboardPresented = false
    @State private var activeAuthMode: TrustoraAuthMode?

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary
    private let lightBackground = TrustoraTheme.background

    init(
        authSession: AuthSessionStore,
        appLanguageRaw: Binding<String>,
        appCurrencyRaw: Binding<String>,
        strings: @escaping (String) -> String,
        useSharedChrome: Bool = false,
        onBack: (() -> Void)? = nil,
        onOpenServices: (() -> Void)? = nil,
        onOpenDashboard: (() -> Void)? = nil,
        onOpenAuth: ((TrustoraAuthMode) -> Void)? = nil
    ) {
        self.authSession = authSession
        self._appLanguageRaw = appLanguageRaw
        self._appCurrencyRaw = appCurrencyRaw
        self.strings = strings
        self.useSharedChrome = useSharedChrome
        self.onBack = onBack
        self.onOpenServices = onOpenServices
        self.onOpenDashboard = onOpenDashboard
        self.onOpenAuth = onOpenAuth
    }

    private var appLanguage: AppLanguage {
        AppLanguage(rawValue: appLanguageRaw) ?? .system
    }

    private var appCurrency: AppCurrency {
        AppCurrency(rawValue: appCurrencyRaw) ?? .defaultCurrency
    }

    private var resolvedLanguageCode: String {
        if appLanguage == .system {
            let preferred = Locale.preferredLanguages.first ?? "en"
            let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
            return code == "ro" ? "ro" : "en"
        }

        return appLanguage.rawValue
    }

    private var aboutStats: [AboutStat] {
        [
            AboutStat(id: "experts", number: "500+", label: s("about.stats.items.0.label")),
            AboutStat(id: "projects", number: "2,000+", label: s("about.stats.items.1.label")),
            AboutStat(id: "satisfaction", number: "98%", label: s("about.stats.items.2.label")),
            AboutStat(id: "cities", number: "50+", label: s("about.stats.items.3.label"))
        ]
    }

    private var missionPoints: [AboutMissionPoint] {
        [
            AboutMissionPoint(
                id: "accessibility",
                title: s("about.mission.points.0.title"),
                description: s("about.mission.points.0.description")
            ),
            AboutMissionPoint(
                id: "transparency",
                title: s("about.mission.points.1.title"),
                description: s("about.mission.points.1.description")
            ),
            AboutMissionPoint(
                id: "excellence",
                title: s("about.mission.points.2.title"),
                description: s("about.mission.points.2.description")
            )
        ]
    }

    private var values: [AboutValue] {
        [
            AboutValue(
                id: "trust",
                iconName: "shield.fill",
                title: s("about.values.items.0.title"),
                description: s("about.values.items.0.description")
            ),
            AboutValue(
                id: "quality",
                iconName: "rosette",
                title: s("about.values.items.1.title"),
                description: s("about.values.items.1.description")
            ),
            AboutValue(
                id: "speed",
                iconName: "bolt.fill",
                title: s("about.values.items.2.title"),
                description: s("about.values.items.2.description")
            ),
            AboutValue(
                id: "support",
                iconName: "heart.fill",
                title: s("about.values.items.3.title"),
                description: s("about.values.items.3.description")
            )
        ]
    }

    private var timelineEntries: [AboutTimelineEntry] {
        [
            AboutTimelineEntry(
                id: "2020",
                year: "2020",
                title: s("about.timeline.items.0.title"),
                description: s("about.timeline.items.0.description")
            ),
            AboutTimelineEntry(
                id: "2021",
                year: "2021",
                title: s("about.timeline.items.1.title"),
                description: s("about.timeline.items.1.description")
            ),
            AboutTimelineEntry(
                id: "2022",
                year: "2022",
                title: s("about.timeline.items.2.title"),
                description: s("about.timeline.items.2.description")
            ),
            AboutTimelineEntry(
                id: "2023",
                year: "2023",
                title: s("about.timeline.items.3.title"),
                description: s("about.timeline.items.3.description")
            ),
            AboutTimelineEntry(
                id: "2024",
                year: "2024",
                title: s("about.timeline.items.4.title"),
                description: s("about.timeline.items.4.description")
            )
        ]
    }

    private var teamMembers: [AboutTeamMember] {
        [
            AboutTeamMember(
                id: "alexandru",
                name: s("about.team.items.0.name"),
                role: s("about.team.items.0.role"),
                description: s("about.team.items.0.description"),
                avatarURL: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200"
            ),
            AboutTeamMember(
                id: "maria",
                name: s("about.team.items.1.name"),
                role: s("about.team.items.1.role"),
                description: s("about.team.items.1.description"),
                avatarURL: "https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=200"
            ),
            AboutTeamMember(
                id: "andrei",
                name: s("about.team.items.2.name"),
                role: s("about.team.items.2.role"),
                description: s("about.team.items.2.description"),
                avatarURL: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200"
            ),
            AboutTeamMember(
                id: "diana",
                name: s("about.team.items.3.name"),
                role: s("about.team.items.3.role"),
                description: s("about.team.items.3.description"),
                avatarURL: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200"
            )
        ]
    }

    var body: some View {
        Group {
            if useSharedChrome {
                aboutSections
            } else {
                NavigationStack {
                    VStack(spacing: 0) {
                        header

                        ScrollView {
                            aboutSections
                        }
                    }
                    .background(lightBackground.ignoresSafeArea())
                    .navigationBarHidden(true)
                }
            }
        }
        .fullScreenCover(isPresented: $isServicesPresented) {
            TrustoraServicesView(
                appLanguageRaw: $appLanguageRaw,
                appCurrencyRaw: $appCurrencyRaw,
                strings: { key in
                    s(key)
                }
            )
        }
        .fullScreenCover(isPresented: $isDashboardPresented) {
            TrustoraDashboardView(
                authSession: authSession,
                appLanguageRaw: $appLanguageRaw,
                appCurrencyRaw: $appCurrencyRaw,
                strings: { key in
                    s(key)
                }
            )
        }
        .fullScreenCover(item: $activeAuthMode) { mode in
            TrustoraAuthFlowView(
                initialMode: mode,
                authSession: authSession,
                strings: { key in
                    s(key)
                }
            )
        }
    }

    private var aboutSections: some View {
        VStack(spacing: TrustoraMetrics.sectionSpacing) {
            heroSection
            statsSection
            missionAndVisionSection
            valuesSection
            timelineSection
            teamSection
            ctaSection
        }
        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
        .padding(.top, TrustoraMetrics.pageTopPadding)
        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    if let onBack {
                        onBack()
                    } else {
                        dismiss()
                    }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .frame(width: 32, height: 32)
                        .background(Color.white.opacity(0.72))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
                        )
                }
                .buttonStyle(.plain)

                BrandLockup(compact: true, tagline: s("common.trustora_tagline"), forceSingleLine: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                languageMenuButton
                currencyMenuButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
        }
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Divider().overlay(Color(hex: 0xE2E8F0))
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(s("about.hero.badge"))
                .font(TrustoraTypography.label)
                .foregroundStyle(midnightBlue)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(s("about.hero.title"))
                    .font(TrustoraTypography.pageTitle)
                    .foregroundStyle(midnightBlue)
                    .fixedSize(horizontal: false, vertical: true)

                Text(s("about.hero.highlight"))
                    .font(TrustoraTypography.pageTitle)
                    .foregroundStyle(trustoraGreen)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Text(s("about.hero.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 10) {
                primaryActionButton(
                    title: s("about.hero.primary_cta"),
                    systemImage: "square.grid.2x2.fill",
                    action: {
                        openServicesPage()
                    }
                )

                secondaryActionButton(
                    title: s("about.hero.secondary_cta"),
                    systemImage: authSession.isAuthenticated ? "rectangle.grid.1x2.fill" : "person.crop.circle.badge.plus",
                    action: {
                        handleSecondaryCTA()
                    }
                )
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .trustoraCardStyle()
    }

    private var statsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(aboutStats) { stat in
                VStack(spacing: 8) {
                    Text(stat.number)
                        .font(TrustoraTypography.pageTitle)
                        .foregroundStyle(midnightBlue)

                    Text(stat.label)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .multilineTextAlignment(.center)
                        .textCase(.uppercase)
                        .tracking(1.1)
                }
                .frame(maxWidth: .infinity, minHeight: 118)
                .padding(.horizontal, 10)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
            }
        }
    }

    private var missionAndVisionSection: some View {
        VStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 14) {
                sectionKicker(s("about.mission.kicker"))

                Text(s("about.mission.title"))
                    .font(TrustoraTypography.sectionTitle)
                    .foregroundStyle(midnightBlue)
                    .fixedSize(horizontal: false, vertical: true)

                Text(s("about.mission.description"))
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(spacing: 12) {
                    ForEach(missionPoints) { point in
                        HStack(alignment: .top, spacing: 12) {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(trustoraGreen.opacity(0.12))
                                .frame(width: 38, height: 38)
                                .overlay {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundStyle(trustoraGreen)
                                }

                            VStack(alignment: .leading, spacing: 3) {
                                Text(point.title)
                                    .font(TrustoraTypography.emphasis)
                                    .foregroundStyle(midnightBlue)

                                Text(point.description)
                                    .font(TrustoraTypography.paragraph)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .fixedSize(horizontal: false, vertical: true)
                            }

                            Spacer(minLength: 0)
                        }
                    }
                }
            }
            .padding(TrustoraMetrics.cardPadding)
            .trustoraCardStyle()

            VStack(alignment: .leading, spacing: 14) {
                sectionKicker(s("about.vision.kicker"))

                RoundedRectangle(cornerRadius: 18)
                    .fill(trustoraGreen.opacity(0.12))
                    .frame(width: 62, height: 62)
                    .overlay {
                        Image(systemName: "target")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(trustoraGreen)
                    }

                Text(s("about.vision.title"))
                    .font(TrustoraTypography.sectionTitle)
                    .foregroundStyle(midnightBlue)
                    .fixedSize(horizontal: false, vertical: true)

                Text(s("about.vision.description"))
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(TrustoraMetrics.cardPadding)
            .background(
                LinearGradient(
                    colors: [
                        Color.white,
                        Color(hex: 0xECFDF5)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color(hex: 0xD1FAE5), lineWidth: 1)
            )
        }
    }

    private var valuesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionKicker(s("about.values.kicker"))

            Text(s("about.values.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(midnightBlue)
                .fixedSize(horizontal: false, vertical: true)

            Text(s("about.values.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(values) { value in
                    AboutValueCard(
                        value: value,
                        trustoraGreen: trustoraGreen,
                        midnightBlue: midnightBlue
                    )
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(s("about.timeline.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(midnightBlue)
                .fixedSize(horizontal: false, vertical: true)

            Text(s("about.timeline.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 0) {
                ForEach(Array(timelineEntries.enumerated()), id: \.element.id) { index, milestone in
                    HStack(alignment: .top, spacing: 12) {
                        VStack(spacing: 0) {
                            Circle()
                                .fill(trustoraGreen)
                                .frame(width: 14, height: 14)
                                .padding(.top, 4)

                            if index < timelineEntries.count - 1 {
                                Rectangle()
                                    .fill(Color(hex: 0xDCE7E3))
                                    .frame(width: 2)
                                    .padding(.top, 4)
                                    .frame(maxHeight: .infinity)
                            }
                        }
                        .frame(width: 16)

                        VStack(alignment: .leading, spacing: 8) {
                            Text(milestone.year)
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                                )

                            VStack(alignment: .leading, spacing: 6) {
                                Text(milestone.title)
                                    .font(TrustoraTypography.cardTitle)
                                    .foregroundStyle(midnightBlue)

                                Text(milestone.description)
                                    .font(TrustoraTypography.paragraph)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(TrustoraMetrics.compactCardPadding)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .trustoraCardStyle(cornerRadius: 16)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, index < timelineEntries.count - 1 ? 12 : 0)
                }
            }
            .padding(.top, 2)
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle(background: TrustoraTheme.mutedSurface)
    }

    private var teamSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionKicker(s("about.team.kicker"))

            Text(s("about.team.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(midnightBlue)
                .fixedSize(horizontal: false, vertical: true)

            Text(s("about.team.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: 12)], spacing: 12) {
                ForEach(teamMembers) { member in
                    AboutTeamCard(
                        member: member,
                        trustoraGreen: trustoraGreen,
                        midnightBlue: midnightBlue
                    )
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var ctaSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(s("about.cta.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(Color.white)
                .fixedSize(horizontal: false, vertical: true)

            Text(s("about.cta.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(Color.white.opacity(0.72))
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 10) {
                primaryActionButton(
                    title: s("about.cta.primary_cta"),
                    systemImage: "magnifyingglass",
                    action: {
                        openServicesPage()
                    }
                )

                Button {
                    handleSecondaryCTA()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: authSession.isAuthenticated ? "rectangle.grid.1x2.fill" : "person.crop.circle.badge.plus")
                            .font(.system(size: 13, weight: .bold))
                        Text(s("about.cta.secondary_cta"))
                            .font(.system(size: 14, weight: .bold))
                            .lineLimit(1)
                    }
                    .foregroundStyle(Color.white)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 13)
                    .background(Color.white.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.24), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    midnightBlue,
                    Color(hex: 0x11263B)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var languageMenuButton: some View {
        Menu {
            Picker(selection: $appLanguageRaw, label: EmptyView()) {
                ForEach(AppLanguage.allCases) { language in
                    Text(s(language.titleKey)).tag(language.rawValue)
                }
            }
        } label: {
            HStack(spacing: 6) {
                Text(selectedLanguageIcon)
                    .font(.system(size: 13, weight: .semibold))
                Text(languageShortLabel)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(midnightBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.65))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
            )
        }
    }

    private var currencyMenuButton: some View {
        Menu {
            Picker(selection: $appCurrencyRaw, label: EmptyView()) {
                ForEach(AppCurrency.allCases) { currency in
                    Text(s(currency.titleKey)).tag(currency.rawValue)
                }
            }
        } label: {
            HStack(spacing: 6) {
                Text(selectedCurrencyIcon)
                    .font(.system(size: 13, weight: .semibold))
                Text(appCurrency.rawValue)
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(midnightBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.65))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
            )
        }
    }

    private var languageShortLabel: String {
        switch appLanguage {
        case .system:
            return s("settings.language.system.short")
        case .en:
            return "EN"
        case .ro:
            return "RO"
        }
    }

    private var selectedLanguageIcon: String {
        switch appLanguage == .system ? resolvedLanguageCode : appLanguage.rawValue {
        case "ro":
            return "🇷🇴"
        case "en":
            return "🇺🇸"
        default:
            return "🌐"
        }
    }

    private var selectedCurrencyIcon: String {
        switch appCurrency {
        case .usd:
            return "🇺🇸"
        case .eur:
            return "🇪🇺"
        case .ron:
            return "🇷🇴"
        }
    }

    private func primaryActionButton(
        title: String,
        systemImage: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(TrustoraTypography.paragraph)
                Text(title)
                    .font(TrustoraTypography.emphasis)
                    .lineLimit(1)
            }
            .foregroundStyle(TrustoraTheme.accentButtonText)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(trustoraGreen)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }

    private func secondaryActionButton(
        title: String,
        systemImage: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(TrustoraTypography.paragraph)
                Text(title)
                    .font(TrustoraTypography.emphasis)
                    .lineLimit(1)
            }
            .foregroundStyle(midnightBlue)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func sectionKicker(_ title: String) -> some View {
        Text(title)
            .font(TrustoraTypography.caption)
            .foregroundStyle(TrustoraTheme.tertiaryText)
            .textCase(.uppercase)
            .tracking(1.1)
    }

    private func handleSecondaryCTA() {
        if authSession.isAuthenticated {
            if let onOpenDashboard {
                onOpenDashboard()
            } else {
                isDashboardPresented = true
            }
        } else {
            if let onOpenAuth {
                onOpenAuth(.signUp)
            } else {
                activeAuthMode = .signUp
            }
        }
    }

    private func openServicesPage() {
        if let onOpenServices {
            onOpenServices()
        } else {
            isServicesPresented = true
        }
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}


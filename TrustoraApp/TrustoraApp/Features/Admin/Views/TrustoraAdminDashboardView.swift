import SwiftUI

struct TrustoraAdminDashboardView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String

    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminDashboardViewModel()
    @State private var featureNotice = false
    @State private var isAdminUsersPresented = false
    @State private var isAdminServicesPresented = false
    @State private var isAdminEarlyAccessPresented = false
    @State private var isAdminCategoriesPresented = false
    @State private var isAdminCallsPresented = false
    @State private var isAdminTestsPresented = false
    @State private var isAdminProjectsPresented = false
    @State private var isAdminDisputesPresented = false
    @State private var isAdminLegalClausesPresented = false
    @State private var isAdminActivitiesPresented = false
    @State private var isAdminAuditLogsPresented = false
    @State private var isAdminRolesPresented = false
    @State private var isAdminAnalyticsPresented = false
    @State private var adminUsersOpenCreate = false
    @State private var adminCategoriesOpenCreate = false
    @State private var adminTestsOpenCreate = false

    private let primary = TrustoraTheme.primary
    private let background = TrustoraTheme.background
    private let accent = TrustoraTheme.accent

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

    private var refreshKey: String {
        [
            authSession.user?.id ?? "guest",
            authSession.accessToken ?? "none",
            resolvedLanguageCode,
            appCurrency.rawValue,
        ].joined(separator: "|")
    }

    private var canAccessAdmin: Bool {
        guard let user = authSession.user, authSession.accessToken != nil else {
            return false
        }
        return (user.isSuperuser ?? false) || user.hasRole("admin")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                background.ignoresSafeArea()

                if !canAccessAdmin {
                    unavailableState
                } else {
                    ScrollView {
                        VStack(spacing: TrustoraMetrics.sectionSpacing) {
                            headerCard
                            statsGrid
                            quickActionsCard
                            sectionsCard
                            activityCard
                            systemStatusCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                }

                if viewModel.isLoading && canAccessAdmin {
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
                    Text(s("navigation.admin_panel"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard let token = authSession.accessToken, canAccessAdmin else {
                    return
                }
                await viewModel.load(
                    token: token,
                    language: resolvedLanguageCode,
                    currency: appCurrency
                )
            }
            .alert(s("admin.dashboard.notice.title"), isPresented: $featureNotice) {
                Button(s("common.ok")) {
                }
            } message: {
                Text(s("admin.dashboard.notice.body"))
            }
            .fullScreenCover(isPresented: $isAdminUsersPresented) {
                TrustoraAdminUsersView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings,
                    openCreateOnAppear: adminUsersOpenCreate
                )
            }
            .fullScreenCover(isPresented: $isAdminServicesPresented) {
                TrustoraAdminServicesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminEarlyAccessPresented) {
                TrustoraAdminEarlyAccessView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminCategoriesPresented) {
                TrustoraAdminCategoriesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings,
                    openCreateOnAppear: adminCategoriesOpenCreate
                )
            }
            .fullScreenCover(isPresented: $isAdminTestsPresented) {
                TrustoraAdminTestsView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings,
                    openCreateOnAppear: adminTestsOpenCreate
                )
            }
            .fullScreenCover(isPresented: $isAdminCallsPresented) {
                TrustoraAdminCallsView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminProjectsPresented) {
                TrustoraAdminProjectsView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminDisputesPresented) {
                TrustoraAdminDisputesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminLegalClausesPresented) {
                TrustoraAdminLegalClausesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminActivitiesPresented) {
                TrustoraAdminActivitiesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminAuditLogsPresented) {
                TrustoraAdminAuditLogsView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminRolesPresented) {
                TrustoraAdminRolesView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
            .fullScreenCover(isPresented: $isAdminAnalyticsPresented) {
                TrustoraAdminAnalyticsView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: strings
                )
            }
        }
    }

    private var unavailableState: some View {
        VStack(spacing: 12) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(primary)

            Text(s("admin.dashboard.unavailable.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)
                .multilineTextAlignment(.center)

            Text(s("admin.dashboard.unavailable.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(TrustoraMetrics.cardPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.16)
                .ignoresSafeArea()

            ProgressView(s("admin.loading"))
                .font(TrustoraTypography.control)
                .padding(16)
                .background(TrustoraTheme.surface.opacity(0.95))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Trustora Admin")
                .font(TrustoraTypography.label)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.dashboard.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.dashboard.subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .background(
            LinearGradient(
                colors: [TrustoraTheme.surface, Color(hex: 0xF0FDF4)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: TrustoraMetrics.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TrustoraMetrics.cardRadius, style: .continuous)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }

    private var statsGrid: some View {
        let cards = viewModel.statsCards()
        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            ForEach(cards) { card in
                Button {
                    featureNotice = true
                } label: {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(alignment: .top) {
                            Text(s(card.titleKey))
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                            Image(systemName: card.icon)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(card.color)
                        }

                        Text(displayValue(card.value, isCurrency: card.isCurrency))
                            .font(TrustoraTypography.cardTitle)
                            .foregroundStyle(primary)
                            .lineLimit(1)

                        HStack(spacing: 6) {
                            Text("(\(displayValue(card.current, isCurrency: card.isCurrency)))")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                            Image(systemName: card.current <= 0 ? "arrow.down.right" : "arrow.up.right")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(card.current <= 0 ? Color(hex: 0xDC2626) : Color(hex: 0x16A34A))
                        }

                        if card.change != 0 {
                            Text(sf("admin.dashboard.stats.change_template", ["percent": signedPercent(card.change)]))
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(card.change < 0 ? Color(hex: 0xDC2626) : Color(hex: 0x16A34A))
                                .lineLimit(1)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .trustoraCardStyle(cornerRadius: TrustoraMetrics.compactCardRadius)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var quickActionsCard: some View {
        sectionCard(
            title: s("admin.dashboard.quick_actions.title"),
            subtitle: s("admin.dashboard.quick_actions.description"),
            icon: "plus.circle.fill"
        ) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                ForEach(viewModel.quickActions()) { action in
                    Button {
                        if action.titleKey == "admin.dashboard.quick_actions.add_user.title" {
                            openAdminUsers(openCreate: true)
                        } else if action.titleKey == "admin.dashboard.quick_actions.add_category.title" {
                            openAdminCategories(openCreate: true)
                        } else if action.titleKey == "admin.dashboard.quick_actions.add_test.title" {
                            openAdminTests(openCreate: true)
                        } else if action.titleKey == "admin.dashboard.quick_actions.view_reports.title" {
                            openAdminAnalytics()
                        } else {
                            featureNotice = true
                        }
                    } label: {
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: action.icon)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(Color.white)
                                .frame(width: 32, height: 32)
                                .background(accent)
                                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))

                            VStack(alignment: .leading, spacing: 3) {
                                Text(s(action.titleKey))
                                    .font(TrustoraTypography.control)
                                    .foregroundStyle(primary)
                                    .multilineTextAlignment(.leading)
                                Text(s(action.descriptionKey))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .multilineTextAlignment(.leading)
                            }

                            Spacer(minLength: 0)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var sectionsCard: some View {
        sectionCard(
            title: s("admin.dashboard.sections.title"),
            subtitle: s("admin.dashboard.sections.description"),
            icon: "slider.horizontal.3"
        ) {
            let availableSections = viewModel.sections().filter { viewModel.canAccess($0, user: authSession.user) }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                ForEach(availableSections) { section in
                    Button {
                        if section.titleKey == "admin.dashboard.sections.users.title" {
                            openAdminUsers()
                        } else if section.titleKey == "admin.dashboard.sections.early_access.title" {
                            openAdminEarlyAccess()
                        } else if section.titleKey == "admin.dashboard.sections.services.title" {
                            openAdminServices()
                        } else if section.titleKey == "admin.dashboard.sections.categories.title" {
                            openAdminCategories()
                        } else if section.titleKey == "admin.dashboard.sections.tests.title" {
                            openAdminTests()
                        } else if section.titleKey == "admin.dashboard.sections.calls.title" {
                            openAdminCalls()
                        } else if section.titleKey == "admin.dashboard.sections.projects.title" {
                            openAdminProjects()
                        } else if section.titleKey == "admin.dashboard.sections.disputes.title" {
                            openAdminDisputes()
                        } else if section.titleKey == "admin.dashboard.sections.legal_clauses.title" {
                            openAdminLegalClauses()
                        } else if section.titleKey == "admin.dashboard.sections.activities.title" {
                            openAdminActivities()
                        } else if section.titleKey == "admin.dashboard.sections.audit_logs.title" {
                            openAdminAuditLogs()
                        } else if section.titleKey == "admin.dashboard.sections.roles.title" {
                            openAdminRoles()
                        } else if section.titleKey == "admin.dashboard.sections.analytics.title" {
                            openAdminAnalytics()
                        } else {
                            featureNotice = true
                        }
                    } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: section.icon)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(Color(hex: 0x0284C7))
                                    .frame(width: 30, height: 30)
                                    .background(Color(hex: 0xE0F2FE))
                                    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))

                                Spacer(minLength: 0)

                                if section.pendingCount > 0 {
                                    Text(sf("admin.dashboard.pending_template", ["count": "\(section.pendingCount)"]))
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(Color(hex: 0x991B1B))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(hex: 0xFEE2E2))
                                        .clipShape(Capsule())
                                }
                            }

                            Text(s(section.titleKey))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(primary)
                                .multilineTextAlignment(.leading)
                            Text(s(section.descriptionKey))
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .multilineTextAlignment(.leading)

                            if let statsText = sectionStatsText(section) {
                                Text(statsText)
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                    .lineLimit(1)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var activityCard: some View {
        sectionCard(
            title: s("admin.dashboard.activity.title"),
            subtitle: nil,
            icon: "clock.arrow.circlepath"
        ) {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(Color(hex: 0xB91C1C))
            } else if viewModel.recentActivities.isEmpty {
                Text(s("admin.dashboard.activity.empty"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.recentActivities) { activity in
                        HStack(spacing: 10) {
                            Image(systemName: activityIconName(for: activity))
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Color(hex: 0x64748B))
                                .frame(width: 30, height: 30)
                                .background(Color(hex: 0xF1F5F9))
                                .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 2) {
                                Text(activity.title)
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(primary)
                                    .lineLimit(2)
                                if !activity.timeAgo.isEmpty {
                                    Text(activity.timeAgo)
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(TrustoraTheme.tertiaryText)
                                }
                            }

                            Spacer(minLength: 0)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 3)
                    }

                    Button {
                        openAdminActivities()
                    } label: {
                        HStack(spacing: 6) {
                            Text(s("admin.dashboard.activity.view_all"))
                                .font(TrustoraTypography.control)
                            Image(systemName: "arrow.right")
                                .font(.system(size: 10, weight: .bold))
                        }
                        .foregroundStyle(primary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 4)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var systemStatusCard: some View {
        sectionCard(
            title: s("admin.dashboard.system_status.title"),
            subtitle: nil,
            icon: "bell.badge.fill"
        ) {
            VStack(spacing: 8) {
                ForEach(Array(viewModel.systemStatus().enumerated()), id: \.offset) { _, status in
                    HStack(spacing: 8) {
                        Text(s(status.labelKey))
                            .font(TrustoraTypography.body)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                        Spacer(minLength: 0)
                        Text(s(status.valueKey))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(Color(hex: 0x065F46))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(hex: 0xD1FAE5))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }

    private func sectionCard<Content: View>(
        title: String,
        subtitle: String?,
        icon: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(primary)
                Text(title)
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func sectionStatsText(_ section: AdminDashboardSection) -> String? {
        guard let key = section.statsKey, !key.isEmpty else {
            return nil
        }
        if let count = section.statsCount {
            return sf(key, ["count": "\(count)"])
        }
        return s(key)
    }

    private func displayValue(_ value: Double, isCurrency: Bool) -> String {
        if isCurrency {
            let locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
            let formatter = NumberFormatter()
            formatter.locale = locale
            formatter.numberStyle = .currency
            formatter.currencyCode = appCurrency.rawValue
            formatter.maximumFractionDigits = 0
            formatter.minimumFractionDigits = 0
            return formatter.string(from: NSNumber(value: value)) ?? "\(Int(value)) \(appCurrency.rawValue)"
        }

        if value.rounded() == value {
            return String(Int(value))
        }
        return String(format: "%.2f", value)
    }

    private func signedPercent(_ value: Double) -> String {
        let rounded = Int(value.rounded())
        return rounded > 0 ? "+\(rounded)" : "\(rounded)"
    }

    private func activityIconName(for activity: DashboardRecentActivity) -> String {
        let action = (activity.action ?? activity.type ?? "").lowercased()
        let title = activity.title.lowercased()

        if action == "project.created" || title.contains("project created") || title.contains("proiect creat") {
            return "doc.text.fill"
        }
        if action.contains("payment") || title.contains("paid") || title.contains("platit") || title.contains("plătit") {
            return "chart.line.uptrend.xyaxis"
        }
        if action.contains("proposal") || title.contains("proposal") || title.contains("propunere") {
            return "doc.plaintext.fill"
        }
        return "clock.fill"
    }

    private func s(_ key: String) -> String {
        strings(key)
    }

    private func openAdminUsers(openCreate: Bool = false) {
        adminUsersOpenCreate = openCreate
        isAdminUsersPresented = true
    }

    private func openAdminServices() {
        isAdminServicesPresented = true
    }

    private func openAdminEarlyAccess() {
        isAdminEarlyAccessPresented = true
    }

    private func openAdminCategories(openCreate: Bool = false) {
        adminCategoriesOpenCreate = openCreate
        isAdminCategoriesPresented = true
    }

    private func openAdminTests(openCreate: Bool = false) {
        adminTestsOpenCreate = openCreate
        isAdminTestsPresented = true
    }

    private func openAdminCalls() {
        isAdminCallsPresented = true
    }

    private func openAdminProjects() {
        isAdminProjectsPresented = true
    }

    private func openAdminDisputes() {
        isAdminDisputesPresented = true
    }

    private func openAdminLegalClauses() {
        isAdminLegalClausesPresented = true
    }

    private func openAdminActivities() {
        isAdminActivitiesPresented = true
    }

    private func openAdminAuditLogs() {
        isAdminAuditLogsPresented = true
    }

    private func openAdminRoles() {
        isAdminRolesPresented = true
    }

    private func openAdminAnalytics() {
        isAdminAnalyticsPresented = true
    }

    private func sf(_ key: String, _ placeholders: [String: String]) -> String {
        var text = s(key)
        for (name, value) in placeholders {
            text = text.replacingOccurrences(of: "{\(name)}", with: value)
        }
        return text
    }
}

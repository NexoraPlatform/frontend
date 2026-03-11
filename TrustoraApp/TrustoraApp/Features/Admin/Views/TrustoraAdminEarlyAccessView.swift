import SwiftUI

struct TrustoraAdminEarlyAccessView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminEarlyAccessViewModel()

    private let primary = TrustoraTheme.primary
    private let background = TrustoraTheme.background

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

    private var canAccessAdmin: Bool {
        guard let user = authSession.user, authSession.accessToken != nil else {
            return false
        }
        return (user.isSuperuser ?? false) || user.hasRole("admin")
    }

    private var refreshKey: String {
        [
            authSession.user?.id ?? "guest",
            authSession.accessToken ?? "none",
            resolvedLanguageCode,
            appCurrency.rawValue,
        ].joined(separator: "|")
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
                            tabsCard
                            listCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reload()
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
                    Text(s("admin.early_access.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reload()
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

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(s("admin.early_access.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.early_access.manage_subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)

            if let pagination = viewModel.pagination {
                Text(
                    sf(
                        "admin.early_access.pagination",
                        [
                            "current": "\(pagination.currentPage)",
                            "last": "\(pagination.lastPage)",
                            "total": "\(pagination.total)",
                            "per_page": "\(pagination.perPage)",
                        ]
                    )
                )
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var tabsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Picker("", selection: $viewModel.selectedTab) {
                Text(s("admin.early_access.providers.title")).tag(AdminEarlyAccessTab.providers)
                Text(s("admin.early_access.clients.title")).tag(AdminEarlyAccessTab.clients)
            }
            .pickerStyle(.segmented)
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var listCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "person.badge.clock.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)

                Text(viewModel.selectedTab == .providers ? s("admin.early_access.providers.title") : s("admin.early_access.clients.title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(viewModel.selectedTab == .providers
                 ? sf("admin.early_access.providers.description", ["count": "\(viewModel.providers.count)"])
                 : sf("admin.early_access.clients.description", ["count": "\(viewModel.clients.count)"]))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if let errorMessage = viewModel.errorMessage {
                Text("\(s("admin.early_access.error")) \(errorMessage)")
                    .font(TrustoraTypography.body)
                    .foregroundStyle(Color(hex: 0xB91C1C))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .trustoraCardStyle(
                        cornerRadius: TrustoraMetrics.compactCardRadius,
                        background: Color(hex: 0xFEF2F2),
                        border: Color(hex: 0xFECACA)
                    )
            } else {
                switch viewModel.selectedTab {
                case .providers:
                    providersList
                case .clients:
                    clientsList
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var providersList: some View {
        Group {
            if viewModel.providers.isEmpty {
                Text(s("admin.early_access.providers.empty"))
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.providers) { provider in
                        providerRow(provider)
                            .onAppear {
                                if provider.id == viewModel.providers.last?.id {
                                    Task {
                                        await loadMoreEarlyAccessIfNeeded()
                                    }
                                }
                            }
                    }
                }

                if viewModel.isLoadingMore && viewModel.selectedTab == .providers {
                    HStack {
                        Spacer()
                        ProgressView()
                            .tint(TrustoraTheme.accent)
                            .padding(.vertical, 10)
                        Spacer()
                    }
                }
            }
        }
    }

    private var clientsList: some View {
        Group {
            if viewModel.clients.isEmpty {
                Text(s("admin.early_access.clients.empty"))
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.clients) { client in
                        clientRow(client)
                            .onAppear {
                                if client.id == viewModel.clients.last?.id {
                                    Task {
                                        await loadMoreEarlyAccessIfNeeded()
                                    }
                                }
                            }
                    }
                }

                if viewModel.isLoadingMore && viewModel.selectedTab == .clients {
                    HStack {
                        Spacer()
                        ProgressView()
                            .tint(TrustoraTheme.accent)
                            .padding(.vertical, 10)
                        Spacer()
                    }
                }
            }
        }
    }

    private func providerRow(_ provider: AdminEarlyAccessProviderEntry) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(provider.fullName)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)

                    Text(provider.email)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }

                Spacer(minLength: 0)

                scoreBadge(provider.score)
            }

            keyValue(label: s("admin.early_access.columns.application_id"), value: provider.applicationID)
            keyValue(label: s("admin.early_access.columns.country"), value: provider.country ?? "-")
            keyValue(label: s("admin.early_access.columns.language"), value: provider.language.uppercased())

            HStack(spacing: 8) {
                Text(s("admin.early_access.columns.verification"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)

                verificationBadge(
                    verified: provider.isEmailVerified,
                    expired: provider.isEmailVerificationExpired
                )
            }

            keyValue(label: s("admin.early_access.columns.verification_sent"), value: formatDateTime(provider.emailVerificationSentAt))
            keyValue(label: s("admin.early_access.columns.verification_expires"), value: formatDateTime(provider.emailVerificationExpiresAt))
            keyValue(label: s("admin.early_access.columns.created_at"), value: formatDate(provider.createdAt))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func clientRow(_ client: AdminEarlyAccessClientEntry) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(client.contactName)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)

                    Text(client.email)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }

                Spacer(minLength: 0)

                scoreBadge(client.score)
            }

            keyValue(label: s("admin.early_access.columns.company_name"), value: client.companyName)
            keyValue(label: s("admin.early_access.columns.application_id"), value: client.applicationID)
            keyValue(label: s("admin.early_access.columns.country"), value: client.country ?? "-")
            keyValue(label: s("admin.early_access.columns.language"), value: client.language.uppercased())

            HStack(spacing: 8) {
                Text(s("admin.early_access.columns.verification"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)

                verificationBadge(
                    verified: client.isEmailVerified,
                    expired: client.isEmailVerificationExpired
                )
            }

            keyValue(label: s("admin.early_access.columns.verification_sent"), value: formatDateTime(client.emailVerificationSentAt))
            keyValue(label: s("admin.early_access.columns.verification_expires"), value: formatDateTime(client.emailVerificationExpiresAt))
            keyValue(label: s("admin.early_access.columns.created_at"), value: formatDate(client.createdAt))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func keyValue(label: String, value: String) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.secondaryText)

            Spacer(minLength: 0)

            Text(value)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.primaryText)
                .multilineTextAlignment(.trailing)
        }
    }

    private func scoreBadge(_ score: Int) -> some View {
        Text("\(score)")
            .font(TrustoraTypography.caption)
            .foregroundStyle(Color(hex: 0x065F46))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(hex: 0xD1FAE5))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(Color(hex: 0xA7F3D0), lineWidth: 1)
            )
    }

    private func verificationBadge(verified: Bool, expired: Bool) -> some View {
        let text: String
        let style: (text: Color, fill: Color, border: Color)

        if verified {
            text = s("admin.early_access.status.verified")
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        } else if expired {
            text = s("admin.early_access.status.expired")
            style = (Color(hex: 0x991B1B), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        } else {
            text = s("admin.early_access.status.unverified")
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
        }

        return Text(text)
            .font(TrustoraTypography.caption)
            .foregroundStyle(style.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(style.fill)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(style.border, lineWidth: 1)
            )
    }

    private func formatDate(_ date: Date?) -> String {
        guard let date else {
            return "-"
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }

    private func formatDateTime(_ date: Date?) -> String {
        guard let date else {
            return "-"
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func reload() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreEarlyAccessIfNeeded() async {
        guard let token = authSession.accessToken,
              viewModel.hasMorePages
        else {
            return
        }

        await viewModel.loadNextPage(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func s(_ key: String) -> String {
        strings(key)
    }

    private func sf(_ key: String, _ placeholders: [String: String]) -> String {
        var text = s(key)
        for (name, value) in placeholders {
            text = text.replacingOccurrences(of: "{\(name)}", with: value)
        }
        return text
    }
}

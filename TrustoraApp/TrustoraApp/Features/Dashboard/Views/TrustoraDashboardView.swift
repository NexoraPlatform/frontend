import SwiftUI
import Combine

private enum CompanyLocationPickerKind: String, Identifiable {
    case country
    case county
    case city

    var id: String { rawValue }
}

private struct CompanyPickerOption: Identifiable {
    let id: String
    let value: String
    let title: String
    let subtitle: String?
}

struct TrustoraDashboardView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String

    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraDashboardViewModel()
    @State private var showTransferConfirmation = false
    @State private var showOwnershipTransferConfirmation = false
    @State private var ownershipTransferCandidate: DashboardCompanyUser?
    @State private var showCompanyInformationSheet = false
    @State private var showCompanyManagersSheet = false
    @State private var showProviderProfileSheet = false
    @State private var showCreateProjectSheet = false
    @State private var companyMembersSearchTerm = ""
    @State private var activeCompanyLocationPicker: CompanyLocationPickerKind?
    @State private var subscribedRealtimeChatGroupID: String?

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary
    private let lightBackground = TrustoraTheme.background
    private let dashboardBottomNavigationHeight: CGFloat = 62
    private let dashboardBottomNavigationBottomPadding: CGFloat = 8
    private let dashboardBottomContentSpacing: CGFloat = 22

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

    private var realtimeChatEventsPublisher: AnyPublisher<Notification, Never> {
        Publishers.MergeMany(
            NotificationCenter.default.publisher(for: .trustoraRealtimeChatMessageSent),
            NotificationCenter.default.publisher(for: .trustoraRealtimeChatMessageUpdated),
            NotificationCenter.default.publisher(for: .trustoraRealtimeChatGroupCreated)
        )
        .eraseToAnyPublisher()
    }

    private var realtimePresenceEventsPublisher: AnyPublisher<Notification, Never> {
        Publishers.MergeMany(
            NotificationCenter.default.publisher(for: .trustoraRealtimeChatUserJoined),
            NotificationCenter.default.publisher(for: .trustoraRealtimeChatUserLeft),
            NotificationCenter.default.publisher(for: .trustoraRealtimePresenceHere),
            NotificationCenter.default.publisher(for: .trustoraRealtimePresenceJoining),
            NotificationCenter.default.publisher(for: .trustoraRealtimePresenceLeaving)
        )
        .eraseToAnyPublisher()
    }

    private var hasRapydConnected: Bool {
        authSession.user?.rapydWalletID?.nilIfEmpty != nil
    }

    private var hasPhoneForRapyd: Bool {
        authSession.user?.phone?.nilIfEmpty != nil
    }

    private var hasCompanyForRapyd: Bool {
        guard let company = authSession.user?.company else {
            return false
        }

        return company.id?.nilIfEmpty != nil || company.name?.nilIfEmpty != nil
    }

    private var canConnectRapyd: Bool {
        hasPhoneForRapyd && hasCompanyForRapyd
    }

    private var rapydRequirementsMessage: String? {
        if hasPhoneForRapyd && hasCompanyForRapyd {
            return nil
        }

        if !hasPhoneForRapyd && !hasCompanyForRapyd {
            return s("dashboard.finance.rapyd.requirements.phone_company")
        }

        if !hasPhoneForRapyd {
            return s("dashboard.finance.rapyd.requirements.phone")
        }

        return s("dashboard.finance.rapyd.requirements.company")
    }

    @MainActor
    private func refreshFinanceAfterRapydConnection(token: String) async {
        await viewModel.loadFinance(token: token, language: resolvedLanguageCode)

        // Backend may persist wallet linkage with a slight delay.
        if viewModel.wallets.isEmpty {
            try? await Task.sleep(nanoseconds: 900_000_000)
            await viewModel.loadFinance(token: token, language: resolvedLanguageCode)
        }
    }

    private var dashboardScrollBottomPadding: CGFloat {
        dashboardBottomNavigationHeight + dashboardBottomNavigationBottomPadding + dashboardBottomContentSpacing
    }

    private var filteredCompanyMembers: [DashboardCompanyUser] {
        let query = companyMembersSearchTerm
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        guard !query.isEmpty else {
            return viewModel.companyMembers
        }

        return viewModel.companyMembers.filter { member in
            let name = member.displayName.lowercased()
            let email = member.normalizedEmail ?? ""
            return name.contains(query) || email.contains(query)
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                if authSession.user == nil || authSession.accessToken == nil {
                    unauthenticatedState
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            contentForActiveTab
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 14)
                        .padding(.bottom, dashboardScrollBottomPadding)
                    }
                }
            }
            .background(lightBackground.ignoresSafeArea())
            .navigationBarHidden(true)
        }
        .safeAreaInset(edge: .bottom) {
            if authSession.user != nil, authSession.accessToken != nil {
                dashboardBottomNavigation
            }
        }
        .task(id: refreshKey) {
            await viewModel.reloadAll(
                user: authSession.user,
                token: authSession.accessToken,
                language: resolvedLanguageCode,
                currency: appCurrency
            )
        }
        .onChange(of: viewModel.searchTerm) {
            viewModel.currentPage = 1
        }
        .onChange(of: viewModel.statusFilter) {
            viewModel.currentPage = 1
        }
        .onChange(of: viewModel.sortBy) {
            viewModel.currentPage = 1
        }
        .onChange(of: viewModel.sortOrder) {
            viewModel.currentPage = 1
        }
        .onChange(of: viewModel.activeTab) {
            syncRealtimeChatPresenceSubscription()
            Task {
                await loadDataForActiveTab()
            }
        }
        .onChange(of: viewModel.selectedChatGroupID) {
            syncRealtimeChatPresenceSubscription()
        }
        .onReceive(NotificationCenter.default.publisher(for: .trustoraRealtimeUserNotification)) { notification in
            handleRealtimeUserNotification(notification)
        }
        .onReceive(realtimeChatEventsPublisher) { notification in
            handleRealtimeChatNotification(notification)
        }
        .onReceive(realtimePresenceEventsPublisher) { _ in
            handleRealtimePresenceNotification()
        }
        .onDisappear {
            let previousGroupID = subscribedRealtimeChatGroupID
            subscribedRealtimeChatGroupID = nil
            guard let previousGroupID else { return }
            Task {
                await TrustoraRealtimeService.shared.unsubscribeChatGroupPresence(previousGroupID)
            }
        }
        .alert(
            sf("dashboard.finance.confirm_transfer", [
                "amount": transferConfirmationAmount,
            ]),
            isPresented: $showTransferConfirmation
        ) {
            Button(s("common.cancel"), role: .cancel) {
            }

            Button(s("dashboard.finance.transfer")) {
                Task {
                    guard let token = authSession.accessToken else {
                        return
                    }

                    _ = await viewModel.transfer(
                        token: token,
                        language: resolvedLanguageCode,
                        currency: appCurrency,
                        invalidAmountText: s("dashboard.finance.invalid_amount"),
                        insufficientBalanceText: s("dashboard.finance.insufficient_balance")
                    )
                }
            }
        }
        .confirmationDialog(
            s("dashboard.settings.profile.company_managers_transfer_button"),
            isPresented: $showOwnershipTransferConfirmation,
            titleVisibility: .visible
        ) {
            Button(s("dashboard.settings.profile.company_managers_transfer_button"), role: .destructive) {
                Task {
                    guard let token = authSession.accessToken,
                          let candidate = ownershipTransferCandidate
                    else { return }
                    _ = await viewModel.transferCompanyOwnership(
                        to: candidate,
                        user: authSession.user,
                        token: token,
                        language: resolvedLanguageCode
                    )
                    await authSession.reloadProfile()
                }
            }
            Button(s("common.cancel"), role: .cancel) {
            }
        } message: {
            Text(
                sf(
                    "dashboard.settings.profile.company_managers_transfer_confirm",
                    ["name": ownershipTransferCandidate?.displayName ?? ""]
                )
            )
        }
        .sheet(isPresented: $showCompanyInformationSheet) {
            companyInformationSheet
        }
        .sheet(isPresented: $showCompanyManagersSheet, onDismiss: {
            companyMembersSearchTerm = ""
        }) {
            companyManagersSheet
        }
        .fullScreenCover(isPresented: $showProviderProfileSheet) {
            TrustoraProviderProfileView(
                authSession: authSession,
                appLanguageRaw: $appLanguageRaw,
                strings: strings
            )
        }
        .fullScreenCover(isPresented: $showCreateProjectSheet) {
            TrustoraCreateProjectView(
                authSession: authSession,
                appLanguageRaw: $appLanguageRaw,
                appCurrencyRaw: $appCurrencyRaw,
                strings: strings
            ) { _ in
                Task {
                    guard let token = authSession.accessToken else { return }
                    await viewModel.loadProjects(
                        token: token,
                        language: resolvedLanguageCode,
                        currency: appCurrency
                    )
                    await viewModel.loadOverview(
                        token: token,
                        language: resolvedLanguageCode,
                        currency: appCurrency
                    )
                }
            }
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .frame(width: 32, height: 32)
                        .background(TrustoraTheme.surface.opacity(0.82))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(TrustoraTheme.border.opacity(0.9), lineWidth: 0.8)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s("dashboard.actions.close"))

                BrandLockup(compact: true, tagline: s("common.trustora_tagline"), forceSingleLine: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                languageMenuButton
                currencyMenuButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)

            if let user = authSession.user {
                VStack(alignment: .leading, spacing: 4) {
                    Text(sf("dashboard.hero.welcome", ["name": user.displayName]))
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(midnightBlue)
                        .lineLimit(1)

                    Text(viewModel.isProvider ? s("dashboard.hero.subtitle.provider") : s("dashboard.hero.subtitle.client"))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: 0x475569))
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
            }
        }
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Divider().overlay(TrustoraTheme.border)
        }
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
            .background(TrustoraTheme.surface.opacity(0.78))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(TrustoraTheme.border.opacity(0.9), lineWidth: 0.8)
            )
        }
        .accessibilityLabel(s("settings.language"))
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
            .background(TrustoraTheme.surface.opacity(0.78))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(TrustoraTheme.border.opacity(0.9), lineWidth: 0.8)
            )
        }
        .accessibilityLabel(s("settings.currency"))
    }

    private var dashboardPrimaryTabs: [DashboardTab] {
        [.overview, .projects, .services, .messages]
            .filter { viewModel.availableTabs.contains($0) }
    }

    private var dashboardSecondaryTabs: [DashboardTab] {
        viewModel.availableTabs.filter { !dashboardPrimaryTabs.contains($0) }
    }

    private var dashboardBottomNavigation: some View {
        HStack(spacing: 0) {
            HStack(spacing: 0) {
                ForEach(dashboardPrimaryTabs) { tab in
                    dashboardBottomTabButton(tab)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            if !dashboardSecondaryTabs.isEmpty {
                Menu {
                    ForEach(dashboardSecondaryTabs) { tab in
                        Button {
                            withAnimation(.spring(response: 0.32, dampingFraction: 0.84)) {
                                viewModel.activeTab = tab
                            }
                        } label: {
                            HStack {
                                Label(s("dashboard.tabs.\(tab.rawValue)"), systemImage: tabIcon(for: tab))
                                if tab == viewModel.activeTab {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(dashboardSecondaryTabs.contains(viewModel.activeTab) ? Color(hex: 0x071A12) : Color(hex: 0x334155))
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .frame(width: 58)
                .frame(maxHeight: .infinity)
                .background(
                    Rectangle()
                        .fill(dashboardSecondaryTabs.contains(viewModel.activeTab) ? trustoraGreen.opacity(0.88) : Color.clear)
                )
                .accessibilityLabel(s("navigation.open_main_user_menu"))
            }
        }
        .frame(height: dashboardBottomNavigationHeight)
        .background(.ultraThinMaterial, in: Capsule())
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(
                    LinearGradient(
                        colors: [Color.white.opacity(0.72), Color.white.opacity(0.18)],
                        startPoint: .top,
                        endPoint: .bottom
                    ),
                    lineWidth: 1
                )
        )
        .shadow(color: Color.black.opacity(0.08), radius: 14, x: 0, y: 8)
        .padding(.horizontal, 14)
        .padding(.bottom, dashboardBottomNavigationBottomPadding)
    }

    private func dashboardBottomTabButton(_ tab: DashboardTab) -> some View {
        let isActive = viewModel.activeTab == tab

        return Button {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.84)) {
                viewModel.activeTab = tab
            }
        } label: {
            VStack(spacing: 3) {
                Image(systemName: tabIcon(for: tab))
                    .font(.system(size: 15, weight: .semibold))

                Text(s("dashboard.tabs.\(tab.rawValue)"))
                    .font(.system(size: 10, weight: isActive ? .bold : .semibold))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .foregroundStyle(isActive ? Color(hex: 0x071A12) : Color(hex: 0x334155))
            .contentShape(Rectangle())
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            Rectangle()
                .fill(isActive ? trustoraGreen.opacity(0.88) : Color.clear)
        )
        .buttonStyle(.plain)
    }

    private func tabIcon(for tab: DashboardTab) -> String {
        switch tab {
        case .overview:
            return "square.grid.2x2.fill"
        case .projects:
            return "briefcase.fill"
        case .services:
            return "target"
        case .messages:
            return "bubble.left.and.bubble.right.fill"
        case .finance:
            return "dollarsign.circle.fill"
        case .settings:
            return "gearshape.fill"
        }
    }

    @ViewBuilder
    private var contentForActiveTab: some View {
        switch viewModel.activeTab {
        case .overview:
            overviewContent
        case .projects:
            projectsContent
        case .services:
            servicesContent
        case .messages:
            messagesContent
        case .finance:
            financeContent
        case .settings:
            settingsContent
        }
    }

    private func loadDataForActiveTab() async {
        guard let token = authSession.accessToken else {
            return
        }

        switch viewModel.activeTab {
        case .overview:
            await viewModel.loadOverview(token: token, language: resolvedLanguageCode, currency: appCurrency)
        case .projects:
            await viewModel.loadProjects(token: token, language: resolvedLanguageCode, currency: appCurrency)
        case .services:
            await viewModel.loadServices(
                token: token,
                language: resolvedLanguageCode,
                currency: appCurrency,
                providerID: viewModel.isProvider ? authSession.user?.id : nil
            )
        case .messages:
            await viewModel.loadChatGroups(token: token)
        case .finance:
            if viewModel.isProvider {
                if hasRapydConnected {
                    await viewModel.loadFinance(token: token, language: resolvedLanguageCode)
                } else {
                    viewModel.clearFinanceState()
                }
            }
        case .settings:
            await viewModel.loadSettings(
                user: authSession.user,
                token: token,
                language: resolvedLanguageCode
            )
        }
    }

    private func syncRealtimeChatPresenceSubscription() {
        let nextGroupID: String?
        if viewModel.activeTab == .messages {
            nextGroupID = normalizedString(viewModel.selectedChatGroupID)
        } else {
            nextGroupID = nil
        }

        guard nextGroupID != subscribedRealtimeChatGroupID else {
            return
        }

        let previousGroupID = subscribedRealtimeChatGroupID
        subscribedRealtimeChatGroupID = nextGroupID

        Task {
            if let previousGroupID {
                await TrustoraRealtimeService.shared.unsubscribeChatGroupPresence(previousGroupID)
            }
            if let nextGroupID {
                await TrustoraRealtimeService.shared.subscribeChatGroupPresence(nextGroupID)
            }
        }
    }

    private func handleRealtimeUserNotification(_ notification: Notification) {
        guard let token = authSession.accessToken else {
            return
        }

        let payloadRaw = notification.userInfo?["payload"] ?? notification.userInfo ?? [:]
        let payload = dictionaryValue(payloadRaw) ?? [:]
        let data = dictionaryValue(payload["data"]) ?? [:]
        let dataPayload = dictionaryValue(data["payload"]) ?? [:]
        let payloadPayload = dictionaryValue(payload["payload"]) ?? [:]

        let rawType = normalizedString(payload["type"])?.lowercased() ?? ""
        let declaredType = normalizedString(data["type"])?.lowercased() ?? ""
        let projectID = firstNonEmptyString(
            data["projectId"],
            data["project_id"],
            payload["projectId"],
            payload["project_id"],
            dataPayload["projectId"],
            dataPayload["project_id"],
            payloadPayload["projectId"],
            payloadPayload["project_id"]
        )
        let payloadStatus = (firstNonEmptyString(
            dataPayload["status"],
            payloadPayload["status"]
        ) ?? "").uppercased()

        let isBudgetAcceptedByProvider =
            declaredType == "budget.accepted.by_provider" ||
            rawType.contains("provideracceptedclientbudget")
        let isProjectEvent =
            declaredType.hasPrefix("project.") ||
            declaredType.hasPrefix("budget.")
        let isProjectStatusUpdatedEvent =
            declaredType == "project.status.updated" ||
            rawType.contains("projectstatusupdated")
        let isProviderFinishedNotification =
            isProjectStatusUpdatedEvent && payloadStatus == "FINISHED"
        let isRapydEvent = declaredType.hasPrefix("rapyd.")
        let isFallbackProjectEvent = declaredType.isEmpty && projectID != nil

        let shouldRefetchProjects =
            isProjectEvent ||
            isProjectStatusUpdatedEvent ||
            isProviderFinishedNotification ||
            isBudgetAcceptedByProvider ||
            isFallbackProjectEvent ||
            (isRapydEvent && projectID != nil)

        let shouldRefreshOverview =
            viewModel.activeTab == .overview &&
            (isProjectEvent || isBudgetAcceptedByProvider || isRapydEvent)

        Task {
            if isRapydEvent && viewModel.isProvider {
                await viewModel.loadFinance(token: token, language: resolvedLanguageCode)
            }

            if shouldRefetchProjects {
                await viewModel.loadProjects(
                    token: token,
                    language: resolvedLanguageCode,
                    currency: appCurrency
                )
            }

            if shouldRefreshOverview {
                await viewModel.loadOverview(
                    token: token,
                    language: resolvedLanguageCode,
                    currency: appCurrency
                )
            }
        }
    }

    private func handleRealtimeChatNotification(_ notification: Notification) {
        guard let token = authSession.accessToken else {
            return
        }

        let payloadRaw = notification.userInfo?["payload"] ?? notification.userInfo ?? [:]
        let payload = dictionaryValue(payloadRaw) ?? [:]
        let message = dictionaryValue(payload["message"]) ?? payload
        let targetGroupID = firstNonEmptyString(
            message["groupId"],
            message["group_id"],
            payload["groupId"],
            payload["group_id"]
        )

        Task {
            await viewModel.loadChatGroups(token: token)
            if let targetGroupID,
               viewModel.activeTab == .messages,
               viewModel.selectedChatGroupID == targetGroupID
            {
                await viewModel.markSelectedGroupAsRead(token: token)
            }
        }
    }

    private func handleRealtimePresenceNotification() {
        guard let token = authSession.accessToken else {
            return
        }
        guard viewModel.activeTab == .messages else {
            return
        }

        Task {
            await viewModel.loadChatGroups(token: token)
        }
    }

    private func dictionaryValue(_ value: Any?) -> [String: Any]? {
        value as? [String: Any]
    }

    private func normalizedString(_ value: Any?) -> String? {
        if let string = value as? String {
            let normalized = string.trimmingCharacters(in: .whitespacesAndNewlines)
            return normalized.isEmpty ? nil : normalized
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }

    private func firstNonEmptyString(_ values: Any?...) -> String? {
        for value in values {
            if let normalized = normalizedString(value) {
                return normalized
            }
        }
        return nil
    }

    private var overviewContent: some View {
        VStack(spacing: 14) {
            if viewModel.isLoadingOverview {
                loadingCard(text: s("dashboard.loading.dashboard"))
            } else {
                if let overviewError = viewModel.overviewError, !overviewError.isEmpty {
                    errorCard(text: sf("dashboard.errors.generic", ["message": overviewError]))
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(overviewStats) { stat in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: stat.icon)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(stat.color)
                                    .frame(width: 30, height: 30)
                                    .background(stat.color.opacity(0.15), in: Circle())

                                Spacer()
                            }

                            Text(stat.title)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Color(hex: 0x64748B))
                                .lineLimit(2)

                            Text(stat.value)
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundStyle(midnightBlue)
                                .lineLimit(1)

                            Text(stat.change)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x475569))
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(TrustoraTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                        )
                    }
                }

                sectionCard(title: projectsTitle, subtitle: s("dashboard.tabs.projects")) {
                    if viewModel.overviewProjects.isEmpty {
                        Text(viewModel.isProvider ? s("dashboard.projects.empty.title.provider") : s("dashboard.projects.empty.title.client"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                    } else {
                        VStack(spacing: 10) {
                            ForEach(viewModel.overviewProjects) { project in
                                projectRow(project)
                            }
                        }
                    }
                }

                sectionCard(title: s("dashboard.activity.title"), subtitle: s("dashboard.tabs.messages")) {
                    if viewModel.recentActivities.isEmpty {
                        Text(s("dashboard.activity.empty"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                    } else {
                        VStack(spacing: 10) {
                            ForEach(viewModel.recentActivities.prefix(3)) { activity in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(activity.title)
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(midnightBlue)
                                        .fixedSize(horizontal: false, vertical: true)

                                    HStack(spacing: 6) {
                                        Text(activity.timeAgo)
                                        if let actor = activity.actorName, !actor.isEmpty {
                                            Text("•")
                                            Text(actor)
                                        }
                                    }
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(Color(hex: 0x64748B))
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(10)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }
                }
            }
        }
    }

    private var projectsContent: some View {
        VStack(spacing: 12) {
            if !viewModel.isProvider {
                HStack {
                    Spacer()

                    Button {
                        showCreateProjectSheet = true
                    } label: {
                        Label(s("project.new.actions.open"), systemImage: "plus")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(Color(hex: 0x04120C))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(trustoraGreen)
                            .clipShape(RoundedRectangle(cornerRadius: 11))
                    }
                    .buttonStyle(.plain)
                }
            }

            VStack(spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x64748B))

                    TextField(s("dashboard.filters.search_placeholder"), text: $viewModel.searchTerm)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.system(size: 14, weight: .medium))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )

                HStack(spacing: 8) {
                    Menu {
                        ForEach(statusOptions, id: \.self) { option in
                            Button {
                                viewModel.statusFilter = option
                            } label: {
                                HStack {
                                    Text(statusLabel(for: option))
                                    if option == viewModel.statusFilter {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        filterCapsule(title: statusLabel(for: viewModel.statusFilter), icon: "line.3.horizontal.decrease")
                    }

                    Menu {
                        ForEach(DashboardProjectSort.allCases) { sort in
                            Button {
                                viewModel.sortBy = sort
                            } label: {
                                HStack {
                                    Text(sortLabel(for: sort))
                                    if sort == viewModel.sortBy {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        filterCapsule(title: sortLabel(for: viewModel.sortBy), icon: "arrow.up.arrow.down")
                    }

                    Button {
                        viewModel.sortOrder.toggle()
                    } label: {
                        Image(systemName: viewModel.sortOrder == .asc ? "arrow.up" : "arrow.down")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(midnightBlue)
                            .frame(width: 38, height: 38)
                            .background(TrustoraTheme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 11))
                            .overlay(
                                RoundedRectangle(cornerRadius: 11)
                                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }

                if viewModel.searchTerm.isEmpty == false || viewModel.statusFilter != "all" || viewModel.sortBy != .newest || viewModel.sortOrder != .desc {
                    HStack {
                        Text(s("dashboard.filters.active"))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Color(hex: 0x64748B))

                        Spacer()

                        Button {
                            viewModel.resetFilters()
                        } label: {
                            Text(s("dashboard.filters.reset_all"))
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Color(hex: 0x0C8F5D))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 4)
                }
            }
            .padding(12)
            .background(TrustoraTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
            )

            if viewModel.isLoadingProjects {
                loadingCard(text: s("dashboard.loading.projects"))
            } else if let projectsError = viewModel.projectsError, !projectsError.isEmpty {
                errorCard(text: sf("dashboard.errors.projects_load_failed", ["message": projectsError]))
            } else if viewModel.paginatedProjects.isEmpty {
                emptyProjectsCard
            } else {
                VStack(spacing: 10) {
                    HStack {
                        Text(sf("dashboard.projects.found", ["count": String(viewModel.filteredProjects.count)]))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                        Spacer()
                    }

                    ForEach(viewModel.paginatedProjects) { project in
                        projectRow(project)
                    }

                    paginationControls
                }
            }
        }
    }

    private var servicesContent: some View {
        sectionCard(
            title: viewModel.isProvider ? s("dashboard.services.title.provider") : s("dashboard.services.title.client"),
            subtitle: viewModel.isProvider ? s("dashboard.services.description.provider") : s("dashboard.services.description.client")
        ) {
            if viewModel.isLoadingServices {
                loadingCard(text: s("dashboard.loading.dashboard"))
            } else if let servicesError = viewModel.servicesError, !servicesError.isEmpty {
                errorCard(text: sf("dashboard.errors.generic", ["message": servicesError]))
            } else if viewModel.services.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Label(
                        viewModel.isProvider ? s("dashboard.services.empty.title.provider") : s("dashboard.services.empty.title.client"),
                        systemImage: "target"
                    )
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(midnightBlue)

                    Text(viewModel.isProvider ? s("dashboard.services.empty.description.provider") : s("dashboard.services.empty.description.client"))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color(hex: 0x64748B))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                VStack(spacing: 10) {
                    ForEach(viewModel.services.prefix(12)) { service in
                        serviceRow(service)
                    }
                }
            }
        }
    }

    private var messagesContent: some View {
        sectionCard(title: s("dashboard.messages.title"), subtitle: s("dashboard.messages.description")) {
            if viewModel.isLoadingChatGroups, viewModel.chatGroups.isEmpty {
                loadingCard(text: s("dashboard.loading.dashboard"))
            } else if let messagesError = viewModel.messagesError, !messagesError.isEmpty, viewModel.chatGroups.isEmpty {
                errorCard(text: sf("dashboard.errors.generic", ["message": messagesError]))
            } else if viewModel.chatGroups.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Label(s("dashboard.messages.empty.title"), systemImage: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(midnightBlue)

                    Text(s("dashboard.messages.empty.description"))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color(hex: 0x64748B))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                VStack(spacing: 12) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(viewModel.chatGroups) { group in
                                let isSelected = viewModel.selectedChatGroupID == group.id

                                Button {
                                    Task {
                                        guard let token = authSession.accessToken else { return }
                                        await viewModel.selectChatGroup(group.id, token: token)
                                    }
                                } label: {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(spacing: 6) {
                                            Text(group.name)
                                                .font(.system(size: 12, weight: .bold))
                                                .lineLimit(1)

                                            if group.unreadCount > 0 {
                                                Text("\(group.unreadCount)")
                                                    .font(.system(size: 10, weight: .black))
                                                    .padding(.horizontal, 6)
                                                    .padding(.vertical, 2)
                                                    .background(Color(hex: 0x071A12), in: Capsule())
                                                    .foregroundStyle(Color.white)
                                            }
                                        }

                                        if let lastMessage = group.lastMessage, !lastMessage.isEmpty {
                                            Text(lastMessage)
                                                .font(.system(size: 10, weight: .medium))
                                                .lineLimit(1)
                                        } else {
                                            Text(group.type.uppercased())
                                                .font(.system(size: 10, weight: .semibold))
                                                .lineLimit(1)
                                        }
                                    }
                                    .foregroundStyle(isSelected ? Color(hex: 0x071A12) : Color(hex: 0x334155))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 10)
                                    .background(
                                        RoundedRectangle(cornerRadius: 11)
                                            .fill(isSelected ? trustoraGreen.opacity(0.9) : Color(hex: 0xF8FAFC))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 11)
                                            .stroke(
                                                isSelected ? trustoraGreen.opacity(0.75) : Color(hex: 0xE2E8F0),
                                                lineWidth: 1
                                            )
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 2)
                    }

                    if viewModel.isLoadingChatMessages {
                        loadingCard(text: s("dashboard.loading.dashboard"))
                    } else if let messagesError = viewModel.messagesError, !messagesError.isEmpty {
                        errorCard(text: sf("dashboard.errors.generic", ["message": messagesError]))
                    } else if viewModel.chatMessages.isEmpty {
                        Text(s("dashboard.messages.empty.description"))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color(hex: 0x64748B))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color(hex: 0xF8FAFC))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    } else {
                        VStack(spacing: 8) {
                            ForEach(Array(viewModel.chatMessages.suffix(30))) { message in
                                messageBubbleRow(message)
                            }
                        }
                        .padding(12)
                        .background(Color(hex: 0xF8FAFC))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    HStack(spacing: 8) {
                        TextField(s("dashboard.messages.input_placeholder"), text: $viewModel.chatDraft, axis: .vertical)
                            .lineLimit(1...4)
                            .font(.system(size: 13, weight: .medium))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(TrustoraTheme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 11))
                            .overlay(
                                RoundedRectangle(cornerRadius: 11)
                                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                            )

                        Button {
                            Task {
                                guard let token = authSession.accessToken else { return }
                                await viewModel.sendCurrentChatMessage(token: token, language: resolvedLanguageCode)
                            }
                        } label: {
                            if viewModel.isSendingChatMessage {
                                ProgressView()
                                    .tint(Color(hex: 0x071A12))
                                    .frame(width: 44, height: 44)
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundStyle(Color(hex: 0x071A12))
                                    .frame(width: 44, height: 44)
                            }
                        }
                        .background(trustoraGreen)
                        .clipShape(RoundedRectangle(cornerRadius: 11))
                        .buttonStyle(.plain)
                        .disabled(
                            viewModel.selectedChatGroupID == nil ||
                            viewModel.chatDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                            viewModel.isSendingChatMessage
                        )
                    }
                }
            }
        }
    }

    private var financeContent: some View {
        Group {
            if !viewModel.isProvider {
                sectionCard(title: s("dashboard.tabs.finance"), subtitle: s("dashboard.hero.role.client")) {
                    Text(s("dashboard.finance.unavailable"))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x64748B))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                sectionCard(
                    title: s("dashboard.finance.title"),
                    subtitle: !hasRapydConnected
                        ? s("dashboard.hero.rapyd.connect")
                        : viewModel.selectedWallet == nil
                        ? s("dashboard.hero.balance.error")
                        : sf("dashboard.finance.wallet_balance_value", [
                            "amount": formatAmount(value: viewModel.selectedWallet?.balance, currency: viewModel.selectedWallet?.currency),
                        ])
                ) {
                    VStack(spacing: 12) {
                        if !hasRapydConnected {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(s("dashboard.hero.balance.error"))
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Color(hex: 0x64748B))

                                if let requirementsMessage = rapydRequirementsMessage {
                                    Text(requirementsMessage)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(Color(hex: 0xB45309))
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }

                                if let financeError = viewModel.financeError, !financeError.isEmpty {
                                    errorCard(text: sf("dashboard.errors.generic", ["message": financeError]))
                                }
                                
                                Button {
                                    Task {
                                        guard let token = authSession.accessToken else {
                                            return
                                        }

                                        guard canConnectRapyd else {
                                            return
                                        }

                                        if let onboarding = await viewModel.connectRapyd(
                                            token: token,
                                            language: resolvedLanguageCode
                                        ) {
                                            if onboarding.walletID != nil || onboarding.contactID != nil {
                                                authSession.updateRapydIdentifiers(
                                                    walletID: onboarding.walletID,
                                                    contactID: onboarding.contactID
                                                )
                                            }

                                            await refreshFinanceAfterRapydConnection(token: token)
                                        }
                                    }
                                } label: {
                                    HStack(spacing: 8) {
                                        if viewModel.isRapydConnecting {
                                            ProgressView().tint(Color(hex: 0x071A12))
                                        } else {
                                            Image(systemName: "link.badge.plus")
                                                .font(.system(size: 13, weight: .black))
                                        }

                                        Text(s("dashboard.hero.rapyd.connect"))
                                            .font(.system(size: 14, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(trustoraGreen)
                                    .foregroundStyle(Color(hex: 0x071A12))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.plain)
                                .disabled(viewModel.isRapydConnecting || !canConnectRapyd)
                            }
                        } else if viewModel.isLoadingFinance {
                            loadingCard(text: s("dashboard.hero.balance.loading"))
                        } else if let financeError = viewModel.financeError, !financeError.isEmpty {
                            errorCard(text: sf("dashboard.errors.generic", ["message": financeError]))
                        } else if viewModel.wallets.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(s("dashboard.hero.balance.error"))
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Color(hex: 0x64748B))

                                if let requirementsMessage = rapydRequirementsMessage {
                                    Text(requirementsMessage)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(Color(hex: 0xB45309))
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }

                                if let financeError = viewModel.financeError, !financeError.isEmpty {
                                    errorCard(text: sf("dashboard.errors.generic", ["message": financeError]))
                                }

                                Button {
                                    Task {
                                        guard let token = authSession.accessToken else {
                                            return
                                        }

                                        guard canConnectRapyd else {
                                            return
                                        }

                                        if let onboarding = await viewModel.connectRapyd(
                                            token: token,
                                            language: resolvedLanguageCode
                                        ) {
                                            if onboarding.walletID != nil || onboarding.contactID != nil {
                                                authSession.updateRapydIdentifiers(
                                                    walletID: onboarding.walletID,
                                                    contactID: onboarding.contactID
                                                )
                                            }

                                            await refreshFinanceAfterRapydConnection(token: token)
                                        }
                                    }
                                } label: {
                                    HStack(spacing: 8) {
                                        if viewModel.isRapydConnecting {
                                            ProgressView().tint(Color(hex: 0x071A12))
                                        } else {
                                            Image(systemName: "link.badge.plus")
                                                .font(.system(size: 13, weight: .black))
                                        }

                                        Text(s("dashboard.hero.rapyd.connect"))
                                            .font(.system(size: 14, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(trustoraGreen)
                                    .foregroundStyle(Color(hex: 0x071A12))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.plain)
                                .disabled(viewModel.isRapydConnecting || !canConnectRapyd)
                            }
                        } else {
                            VStack(spacing: 12) {
                                if viewModel.wallets.count > 1 {
                                    Menu {
                                        ForEach(viewModel.wallets) { wallet in
                                            Button {
                                                viewModel.applyWalletSelection(wallet.id)
                                            } label: {
                                                HStack {
                                                    Text("\(wallet.currency) • \(formatAmount(value: wallet.balance, currency: wallet.currency))")
                                                    if wallet.id == viewModel.selectedWalletID {
                                                        Image(systemName: "checkmark")
                                                    }
                                                }
                                            }
                                        }
                                    } label: {
                                        filterCapsule(
                                            title: viewModel.selectedWallet.map {
                                                "\($0.currency) • \(formatAmount(value: $0.balance, currency: $0.currency))"
                                            } ?? s("dashboard.finance.select_wallet"),
                                            icon: "wallet.pass"
                                        )
                                    }
                                }

                                VStack(alignment: .leading, spacing: 10) {
                                    financeBalanceRow(
                                        label: s("dashboard.hero.balance.available"),
                                        value: formatAmount(value: viewModel.selectedWallet?.balance, currency: viewModel.selectedWallet?.currency)
                                    )
                                    financeBalanceRow(
                                        label: s("dashboard.hero.balance.on_hold"),
                                        value: formatAmount(value: viewModel.selectedWallet?.onHoldBalance, currency: viewModel.selectedWallet?.currency)
                                    )
                                    financeBalanceRow(
                                        label: s("dashboard.hero.balance.received"),
                                        value: formatAmount(value: viewModel.selectedWallet?.receivedBalance, currency: viewModel.selectedWallet?.currency)
                                    )
                                }
                                .padding(12)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 12))

                                VStack(alignment: .leading, spacing: 8) {
                                    Text(s("dashboard.finance.transfer_amount"))
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(Color(hex: 0x334155))

                                    HStack(spacing: 8) {
                                        TextField("0.00", text: $viewModel.transferAmount)
                                            .keyboardType(.decimalPad)
                                            .font(.system(size: 14, weight: .semibold))
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 11)
                                            .background(TrustoraTheme.surface)
                                            .clipShape(RoundedRectangle(cornerRadius: 11))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 11)
                                                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                                            )

                                        Button {
                                            viewModel.fillTransferMax()
                                        } label: {
                                            Text(s("dashboard.finance.max"))
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundStyle(midnightBlue)
                                                .frame(width: 56, height: 42)
                                                .background(TrustoraTheme.surface)
                                                .clipShape(RoundedRectangle(cornerRadius: 11))
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 11)
                                                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                                                )
                                        }
                                        .buttonStyle(.plain)
                                    }

                                    if let transferError = viewModel.transferError, !transferError.isEmpty {
                                        Text(transferError)
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundStyle(Color(hex: 0xB91C1C))
                                    }

                                    Button {
                                        showTransferConfirmation = true
                                    } label: {
                                        HStack(spacing: 8) {
                                            if viewModel.isLoadingTransfer {
                                                ProgressView().tint(Color(hex: 0x071A12))
                                            } else {
                                                Image(systemName: "paperplane.fill")
                                                    .font(.system(size: 13, weight: .black))
                                            }

                                            Text(s("dashboard.finance.transfer"))
                                                .font(.system(size: 14, weight: .bold))
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(trustoraGreen)
                                        .foregroundStyle(Color(hex: 0x071A12))
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(viewModel.isLoadingTransfer || viewModel.transferAmount.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private var settingsContent: some View {
        VStack(spacing: 12) {
            sectionCard(title: s("dashboard.tabs.settings"), subtitle: s("dashboard.settings.profile.title")) {
                VStack(spacing: 10) {
                    if let user = authSession.user {
                        HStack(spacing: 10) {
                            DashboardUserAvatarView(user: user, size: 44)

                            VStack(alignment: .leading, spacing: 3) {
                                Text(user.displayName)
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(midnightBlue)
                                    .lineLimit(1)

                                Text(user.email)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(Color(hex: 0x64748B))
                                    .lineLimit(1)
                            }

                            Spacer(minLength: 0)

                            if viewModel.isProvider {
                                Button {
                                    showProviderProfileSheet = true
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "pencil")
                                            .font(.system(size: 12, weight: .bold))
                                        Text(s("navigation.edit_profile"))
                                            .font(.system(size: 12, weight: .bold))
                                    }
                                    .foregroundStyle(midnightBlue)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 8)
                                    .background(TrustoraTheme.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(12)
                        .background(Color(hex: 0xF8FAFC))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        Task {
                            await authSession.signOut()
                            dismiss()
                        }
                    } label: {
                        Text(s("navigation.logout"))
                            .font(.system(size: 14, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .foregroundStyle(Color(hex: 0x7F1D1D))
                            .background(Color(hex: 0xFEE2E2))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: 0xFCA5A5), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .disabled(authSession.isLoading)
                }
            }

            if viewModel.isProvider {
                sectionCard(
                    title: s("dashboard.settings.profile.company_informations"),
                    subtitle: s("dashboard.settings.profile.company_informations_subtitle")
                ) {
                    VStack(spacing: 10) {
                        settingsActionButton(
                            systemImage: "building.2.fill",
                            title: s("dashboard.settings.profile.company_informations"),
                            subtitle: s("dashboard.settings.profile.company_informations_subtitle")
                        ) {
                            viewModel.resetCompanyForm(user: authSession.user)
                            showCompanyInformationSheet = true
                            Task {
                                guard let token = authSession.accessToken else { return }
                                await viewModel.loadSettings(
                                    user: authSession.user,
                                    token: token,
                                    language: resolvedLanguageCode
                                )
                            }
                        }

                        settingsActionButton(
                            systemImage: "person.3.fill",
                            title: s("dashboard.settings.profile.company_managers"),
                            subtitle: s("dashboard.settings.profile.company_managers_subtitle"),
                            disabled: !viewModel.canManageCompanySettings(user: authSession.user)
                        ) {
                            viewModel.resetCompanyForm(user: authSession.user)
                            showCompanyManagersSheet = true
                            Task {
                                guard let token = authSession.accessToken else { return }
                                await viewModel.loadSettings(
                                    user: authSession.user,
                                    token: token,
                                    language: resolvedLanguageCode
                                )
                            }
                        }

                        if !viewModel.canManageCompanySettings(user: authSession.user) {
                            Text(s("dashboard.settings.profile.company_access_unavailable"))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x64748B))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
            }
        }
    }

    private var companyInformationSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    sheetPanelHeader(
                        systemImage: "building.2.fill",
                        title: s("dashboard.settings.profile.company_informations"),
                        subtitle: s("dashboard.settings.profile.company_informations_subtitle")
                    )

                    settingsPanelContainer {
                        companyInformationPanelContent
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 24)
            }
            .background(lightBackground.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(s("dashboard.settings.profile.close")) {
                        showCompanyInformationSheet = false
                    }
                    .font(.system(size: 13, weight: .bold))
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .task {
            await viewModel.loadLocationOptionsIfNeeded()
        }
        .sheet(item: $activeCompanyLocationPicker, onDismiss: {
            activeCompanyLocationPicker = nil
        }) { picker in
            companyLocationPickerSheet(for: picker)
        }
    }

    private var companyManagersSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    sheetPanelHeader(
                        systemImage: "person.3.fill",
                        title: s("dashboard.settings.profile.company_managers"),
                        subtitle: s("dashboard.settings.profile.company_managers_subtitle")
                    )

                    settingsPanelContainer {
                        companyManagersPanelContent
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 24)
            }
            .background(lightBackground.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(s("dashboard.settings.profile.close")) {
                        showCompanyManagersSheet = false
                    }
                    .font(.system(size: 13, weight: .bold))
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private var companyInformationPanelContent: some View {
        VStack(spacing: 10) {
            settingsTextField(
                title: s("dashboard.settings.profile.legal_name"),
                text: $viewModel.companyForm.name,
                placeholder: s("dashboard.settings.profile.placeholders.company")
            )
            .onChange(of: viewModel.companyForm.name) {
                viewModel.companySearchTerm = viewModel.companyForm.name
                viewModel.scheduleCompanySearch()
            }

            if viewModel.isSearchingCompanies {
                loadingCard(text: s("dashboard.loading.dashboard"))
            } else if !viewModel.companySearchResults.isEmpty {
                VStack(spacing: 6) {
                    ForEach(viewModel.companySearchResults.prefix(5)) { company in
                        Button {
                            viewModel.applyCompanySearchResult(company)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(company.name)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(midnightBlue)
                                Text(
                                    [
                                        company.taxID ?? company.tradeRegistryNumber,
                                        company.companyCity,
                                        company.companyCountry,
                                    ]
                                        .compactMap { $0 }
                                        .joined(separator: " • ")
                                )
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(Color(hex: 0x64748B))
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .background(Color(hex: 0xF8FAFC))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                settingsTextField(
                    title: s("dashboard.settings.profile.represented_by"),
                    text: $viewModel.companyForm.representedBy,
                    placeholder: s("dashboard.settings.profile.placeholders.represented_by")
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.contact_email"),
                    text: $viewModel.companyForm.email,
                    placeholder: s("dashboard.settings.profile.placeholders.email")
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.id_type"),
                    text: $viewModel.companyForm.idType,
                    placeholder: s("dashboard.settings.profile.placeholders.id_type")
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.id_code"),
                    text: $viewModel.companyForm.idNumber,
                    placeholder: s("dashboard.settings.profile.placeholders.id_code")
                )
                settingsSelectableField(
                    title: s("dashboard.settings.profile.country"),
                    value: viewModel.selectedCountryDisplayName,
                    placeholder: s("dashboard.settings.profile.placeholders.country"),
                    disabled: viewModel.isLoadingLocations,
                    action: {
                        Task {
                            await viewModel.loadLocationOptionsIfNeeded()
                            activeCompanyLocationPicker = .country
                        }
                    }
                )

                if viewModel.locationStates.isEmpty {
                    settingsTextField(
                        title: s("dashboard.settings.profile.state"),
                        text: $viewModel.companyForm.companyCounty,
                        placeholder: s("dashboard.settings.profile.placeholders.state")
                    )
                } else {
                    settingsSelectableField(
                        title: s("dashboard.settings.profile.state"),
                        value: viewModel.selectedCountyDisplayName,
                        placeholder: s("dashboard.settings.profile.placeholders.state"),
                        disabled: viewModel.companyForm.companyCountry.trimmed.isEmpty,
                        action: {
                            activeCompanyLocationPicker = .county
                        }
                    )
                }

                if viewModel.locationCities.isEmpty {
                    settingsTextField(
                        title: s("dashboard.settings.profile.city"),
                        text: $viewModel.companyForm.companyCity,
                        placeholder: s("dashboard.settings.profile.placeholders.city"),
                        disabled: viewModel.companyForm.companyCounty.trimmed.isEmpty
                    )
                } else {
                    settingsSelectableField(
                        title: s("dashboard.settings.profile.city"),
                        value: viewModel.companyForm.companyCity,
                        placeholder: s("dashboard.settings.profile.placeholders.city"),
                        disabled: viewModel.companyForm.companyCounty.trimmed.isEmpty,
                        action: {
                            activeCompanyLocationPicker = .city
                        }
                    )
                }
                settingsTextField(
                    title: s("dashboard.settings.profile.zip"),
                    text: $viewModel.companyForm.companyZip,
                    placeholder: s("dashboard.settings.profile.placeholders.zip")
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.currency"),
                    text: $viewModel.companyForm.bankCurrency,
                    placeholder: s("dashboard.settings.profile.placeholders.currency"),
                    textInputAutocapitalization: .characters
                )
                .onChange(of: viewModel.companyForm.bankCurrency) {
                    viewModel.currencySearchTerm = viewModel.companyForm.bankCurrency
                    viewModel.scheduleCurrencySearch()
                }
                settingsTextField(
                    title: s("dashboard.settings.profile.bank_name"),
                    text: $viewModel.companyForm.companyBankName,
                    placeholder: s("dashboard.settings.profile.placeholders.bank_name")
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.iban"),
                    text: $viewModel.companyForm.companyBankIBAN,
                    placeholder: "RO49AAAA1B31007593840000",
                    textInputAutocapitalization: .characters
                )
                settingsTextField(
                    title: s("dashboard.settings.profile.bic_swift"),
                    text: $viewModel.companyForm.companyBankBIC,
                    placeholder: s("dashboard.settings.profile.placeholders.bic"),
                    textInputAutocapitalization: .characters
                )
            }

            if viewModel.isLoadingLocations {
                Text(s("dashboard.loading.dashboard"))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if let locationError = viewModel.locationOptionsError, !locationError.isEmpty {
                errorCard(text: sf("dashboard.errors.generic", ["message": locationError]))
            }

            settingsTextField(
                title: s("dashboard.settings.profile.street"),
                text: $viewModel.companyForm.companyAddress,
                placeholder: s("dashboard.settings.profile.placeholders.address")
            )

            if viewModel.isLoadingCurrencies {
                Text(s("dashboard.loading.dashboard"))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if !viewModel.currencyOptions.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(viewModel.currencyOptions.prefix(12)) { option in
                            let isActive = option.code.uppercased() == viewModel.companyForm.bankCurrency.uppercased()
                            Button {
                                viewModel.applyCurrency(option)
                            } label: {
                                Text("\(option.code) • \(option.name)")
                                    .font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 7)
                                    .foregroundStyle(isActive ? Color(hex: 0x071A12) : Color(hex: 0x334155))
                                    .background(
                                        RoundedRectangle(cornerRadius: 9)
                                            .fill(isActive ? trustoraGreen.opacity(0.88) : Color(hex: 0xF8FAFC))
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            if let companyError = viewModel.companySettingsError, !companyError.isEmpty {
                errorCard(text: sf("dashboard.errors.generic", ["message": companyError]))
            }

            if viewModel.companySettingsSuccess {
                Text(s("dashboard.settings.profile.success"))
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color(hex: 0x166534))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Color(hex: 0xDCFCE7))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            Button {
                Task {
                    guard let token = authSession.accessToken else { return }
                    let didSave = await viewModel.saveCompanyInformation(
                        user: authSession.user,
                        token: token
                    )
                    if didSave {
                        await authSession.reloadProfile()
                        viewModel.resetCompanyForm(user: authSession.user)
                    }
                }
            } label: {
                HStack(spacing: 8) {
                    if viewModel.isSavingCompanyInfo {
                        ProgressView().tint(Color(hex: 0x071A12))
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 13, weight: .black))
                    }
                    Text(s("dashboard.settings.profile.save"))
                        .font(.system(size: 14, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(trustoraGreen)
                .foregroundStyle(Color(hex: 0x071A12))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isSavingCompanyInfo)
        }
    }

    private var companyManagersPanelContent: some View {
        VStack(spacing: 10) {
            if !viewModel.canManageCompanySettings(user: authSession.user) {
                Text(s("dashboard.settings.profile.company_access_unavailable"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                if viewModel.isLoadingCompanyManagers {
                    loadingCard(text: s("dashboard.loading.projects"))
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(s("dashboard.settings.profile.company_managers_list_label"))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Color(hex: 0x334155))

                        if viewModel.companyManagers.isEmpty {
                            Text(s("dashboard.settings.profile.company_managers_empty"))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x64748B))
                        } else {
                            ForEach(viewModel.companyManagers) { manager in
                                HStack(spacing: 10) {
                                    Circle()
                                        .fill(Color(hex: 0xDBEAFE))
                                        .frame(width: 34, height: 34)
                                        .overlay(
                                            Text(String(manager.displayName.prefix(2)).uppercased())
                                                .font(.system(size: 10, weight: .black))
                                                .foregroundStyle(Color(hex: 0x1E40AF))
                                        )

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(manager.displayName)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(midnightBlue)
                                            .lineLimit(1)
                                        if let email = manager.email, !email.isEmpty {
                                            Text(email)
                                                .font(.system(size: 10, weight: .medium))
                                                .foregroundStyle(Color(hex: 0x64748B))
                                                .lineLimit(1)
                                        }
                                    }

                                    Spacer(minLength: 0)

                                    Button {
                                        Task {
                                            guard let token = authSession.accessToken else { return }
                                            await viewModel.removeCompanyManager(
                                                manager,
                                                user: authSession.user,
                                                token: token,
                                                language: resolvedLanguageCode
                                            )
                                        }
                                    } label: {
                                        Text(s("dashboard.settings.profile.company_managers_remove"))
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(Color(hex: 0x7F1D1D))
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 5)
                                            .background(Color(hex: 0xFEE2E2))
                                            .clipShape(Capsule())
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(viewModel.isSavingCompanyManagers)
                                }
                                .padding(10)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }

                    settingsTextField(
                        title: s("dashboard.settings.profile.company_managers_add_label"),
                        text: $viewModel.companyManagerSearchTerm,
                        placeholder: s("dashboard.settings.profile.company_managers_search_placeholder")
                    )
                    .onChange(of: viewModel.companyManagerSearchTerm) {
                        guard let token = authSession.accessToken else { return }
                        viewModel.scheduleCompanyManagerSearch(token: token)
                    }

                    if viewModel.isSearchingCompanyUsers {
                        Text(s("dashboard.loading.projects"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else if viewModel.companyManagerSearchTerm.trimmed.count >= 2 && viewModel.companyManagerSearchResults.isEmpty {
                        Text(s("dashboard.settings.profile.company_managers_no_results"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        VStack(spacing: 6) {
                            ForEach(viewModel.companyManagerSearchResults.prefix(6)) { candidate in
                                let alreadyAdded = viewModel.isExistingCompanyManager(candidate)
                                HStack(spacing: 10) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(candidate.displayName)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(midnightBlue)
                                        if let email = candidate.email, !email.isEmpty {
                                            Text(email)
                                                .font(.system(size: 10, weight: .medium))
                                                .foregroundStyle(Color(hex: 0x64748B))
                                                .lineLimit(1)
                                        }
                                    }
                                    Spacer(minLength: 0)
                                    Button {
                                        Task {
                                            guard let token = authSession.accessToken else { return }
                                            await viewModel.addCompanyManager(
                                                candidate,
                                                user: authSession.user,
                                                token: token,
                                                language: resolvedLanguageCode
                                            )
                                        }
                                    } label: {
                                        Text(
                                            alreadyAdded
                                                ? s("dashboard.settings.profile.company_managers_added")
                                                : s("dashboard.settings.profile.company_managers_add_button")
                                        )
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(alreadyAdded ? Color(hex: 0x334155) : Color(hex: 0x071A12))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(alreadyAdded ? Color(hex: 0xE2E8F0) : trustoraGreen)
                                        .clipShape(Capsule())
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(alreadyAdded || viewModel.isSavingCompanyManagers)
                                }
                                .padding(10)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }

                    settingsTextField(
                        title: s("dashboard.settings.profile.company_managers_members_label"),
                        text: $companyMembersSearchTerm,
                        placeholder: s("dashboard.settings.profile.company_managers_members_placeholder")
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        if filteredCompanyMembers.isEmpty {
                            Text(s("dashboard.settings.profile.company_managers_members_empty"))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x64748B))
                        } else {
                            ForEach(filteredCompanyMembers) { member in
                                HStack(spacing: 10) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(member.displayName)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(midnightBlue)
                                        if let email = member.email, !email.isEmpty {
                                            Text(email)
                                                .font(.system(size: 10, weight: .medium))
                                                .foregroundStyle(Color(hex: 0x64748B))
                                                .lineLimit(1)
                                        }
                                    }
                                    Spacer(minLength: 0)

                                    if member.userID != authSession.user?.id {
                                        Button {
                                            ownershipTransferCandidate = member
                                            showOwnershipTransferConfirmation = true
                                        } label: {
                                            HStack(spacing: 5) {
                                                if viewModel.transferringOwnershipEmail == member.normalizedEmail {
                                                    ProgressView()
                                                        .tint(Color(hex: 0x071A12))
                                                        .scaleEffect(0.8)
                                                } else {
                                                    Image(systemName: "arrow.triangle.2.circlepath")
                                                        .font(.system(size: 10, weight: .black))
                                                }
                                                Text(s("dashboard.settings.profile.company_managers_transfer_button"))
                                                    .font(.system(size: 10, weight: .bold))
                                            }
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 5)
                                            .foregroundStyle(Color(hex: 0x071A12))
                                            .background(trustoraGreen.opacity(0.88))
                                            .clipShape(Capsule())
                                        }
                                        .buttonStyle(.plain)
                                        .disabled(viewModel.transferringOwnershipEmail != nil)
                                    }
                                }
                                .padding(10)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }
                }

                if let managersError = viewModel.companyManagersError, !managersError.isEmpty {
                    errorCard(text: sf("dashboard.errors.generic", ["message": managersError]))
                }
            }
        }
    }

    private func settingsActionButton(
        systemImage: String,
        title: String,
        subtitle: String,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(disabled ? Color(hex: 0x94A3B8) : trustoraGreen)
                    .frame(width: 36, height: 36)
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 11))

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(disabled ? Color(hex: 0x94A3B8) : midnightBlue)
                        .lineLimit(1)

                    Text(subtitle)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color(hex: 0x64748B))
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color(hex: 0x94A3B8))
            }
            .padding(12)
            .background(Color(hex: 0xF8FAFC))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
            )
            .opacity(disabled ? 0.72 : 1)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    private func sheetPanelHeader(systemImage: String, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(trustoraGreen)
                .frame(width: 44, height: 44)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(midnightBlue)

                Text(subtitle)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color(hex: 0x64748B))
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func settingsPanelContainer<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func settingsSelectableField(
        title: String,
        value: String,
        placeholder: String,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Color(hex: 0x334155))

            Button(action: action) {
                HStack(spacing: 8) {
                    Text(value.isEmpty ? placeholder : value)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(value.isEmpty ? Color(hex: 0x94A3B8) : midnightBlue)
                        .lineLimit(1)

                    Spacer(minLength: 0)

                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color(hex: 0x64748B))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(disabled)
            .opacity(disabled ? 0.62 : 1)
        }
    }

    private func settingsTextField(
        title: String,
        text: Binding<String>,
        placeholder: String,
        textInputAutocapitalization: TextInputAutocapitalization = .never,
        disabled: Bool = false
    ) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Color(hex: 0x334155))
            TextField(placeholder, text: text)
                .textInputAutocapitalization(textInputAutocapitalization)
                .autocorrectionDisabled()
                .disabled(disabled)
                .font(.system(size: 12, weight: .medium))
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                )
                .opacity(disabled ? 0.62 : 1)
        }
    }

    private func companyLocationPickerSheet(for picker: CompanyLocationPickerKind) -> some View {
        let options = pickerOptions(for: picker)
        let configuration: (title: String, placeholder: String, emptyText: String, selectedValue: String)

        switch picker {
        case .country:
            configuration = (
                title: s("dashboard.settings.profile.country"),
                placeholder: s("dashboard.settings.profile.picker.search_country"),
                emptyText: s("dashboard.settings.profile.picker.no_country"),
                selectedValue: viewModel.companyForm.companyCountry
            )
        case .county:
            configuration = (
                title: s("dashboard.settings.profile.state"),
                placeholder: s("dashboard.settings.profile.picker.search_state"),
                emptyText: s("dashboard.settings.profile.picker.no_state"),
                selectedValue: viewModel.companyForm.companyCounty
            )
        case .city:
            configuration = (
                title: s("dashboard.settings.profile.city"),
                placeholder: s("dashboard.settings.profile.picker.search_city"),
                emptyText: s("dashboard.settings.profile.picker.no_city"),
                selectedValue: viewModel.companyForm.companyCity
            )
        }

        return NavigationStack {
            CompanySearchPickerSheet(
                title: configuration.title,
                closeLabel: s("dashboard.actions.close"),
                searchPlaceholder: configuration.placeholder,
                emptyText: configuration.emptyText,
                options: options,
                selectedValue: configuration.selectedValue
            ) { option in
                switch picker {
                case .country:
                    Task {
                        await viewModel.selectCompanyCountry(option.value)
                    }
                case .county:
                    Task {
                        await viewModel.selectCompanyCounty(option.value)
                    }
                case .city:
                    viewModel.selectCompanyCity(option.value)
                }
            }
        }
    }

    private func pickerOptions(for picker: CompanyLocationPickerKind) -> [CompanyPickerOption] {
        switch picker {
        case .country:
            return viewModel.locationCountries.map { country in
                CompanyPickerOption(
                    id: country.isoCode,
                    value: country.isoCode,
                    title: country.flag.isEmpty ? country.name : "\(country.flag) \(country.name)",
                    subtitle: country.isoCode
                )
            }
        case .county:
            return viewModel.locationStates.map { state in
                CompanyPickerOption(
                    id: state.id,
                    value: state.isoCode,
                    title: state.name,
                    subtitle: state.isoCode
                )
            }
        case .city:
            return viewModel.locationCities.map { city in
                CompanyPickerOption(
                    id: city.id,
                    value: city.name,
                    title: city.name,
                    subtitle: nil
                )
            }
        }
    }

    private var unauthenticatedState: some View {
        VStack(spacing: 14) {
            Spacer(minLength: 0)
            Image(systemName: "lock.shield")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(Color(hex: 0x64748B))

            Text(s("dashboard.auth.required"))
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(midnightBlue)

            Button {
                dismiss()
            } label: {
                Text(s("dashboard.actions.close"))
                    .font(.system(size: 14, weight: .bold))
                    .frame(maxWidth: 220)
                    .padding(.vertical, 12)
                    .background(trustoraGreen)
                    .foregroundStyle(Color(hex: 0x071A12))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            Spacer(minLength: 0)
        }
        .padding(16)
    }

    private func sectionCard<Content: View>(title: String, subtitle: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(midnightBlue)

            Text(subtitle)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color(hex: 0x64748B))

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func projectRow(_ project: DashboardProjectSummary) -> some View {
        let visibleMilestones = viewModel.projectMilestones(
            for: project,
            currentUserID: authSession.user?.id
        )
        let projectDisplayStatus = viewModel.projectDisplayStatus(
            for: project,
            currentUserID: authSession.user?.id
        )
        let projectIsResponding = viewModel.respondingProjectIDs.contains(project.id)
        let providerCanRespond = viewModel.canProviderRespond(to: project)
        let displayedMilestoneCount: Int = {
            if viewModel.isProvider {
                return visibleMilestones.count
            }
            return max(project.milestoneCount, project.milestones.count)
        }()

        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .lineLimit(2)

                    if !project.description.isEmpty {
                        Text(project.description)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color(hex: 0x64748B))
                            .lineLimit(3)
                    }
                }

                Spacer(minLength: 0)

                projectStatusBadge(projectDisplayStatus)
            }

            HStack(spacing: 10) {
                Label(
                    formatAmount(value: project.budget.amount, currency: project.budget.currency),
                    systemImage: "banknote.fill"
                )

                if let createdAt = project.createdAt {
                    Label(projectDateFormatter.string(from: createdAt), systemImage: "calendar")
                }

                if displayedMilestoneCount > 0 {
                    Label(
                        sf("dashboard.projects.milestones_count", ["count": String(displayedMilestoneCount)]),
                        systemImage: "flag.fill"
                    )
                }
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Color(hex: 0x475569))

            if !visibleMilestones.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text(s("dashboard.projects.milestones_title"))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(hex: 0x334155))

                    ForEach(visibleMilestones) { milestone in
                        let action = viewModel.nextMilestoneAction(for: milestone)
                        let updateKey = "\(project.id)|\(milestone.id)"
                        let isUpdating = viewModel.updatingMilestoneIDs.contains(updateKey)

                        VStack(alignment: .leading, spacing: 6) {
                            HStack(alignment: .top, spacing: 8) {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(milestone.title)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(midnightBlue)
                                        .lineLimit(2)

                                    if let serviceName = milestone.serviceName, !serviceName.isEmpty {
                                        Text(serviceName)
                                            .font(.system(size: 10, weight: .medium))
                                            .foregroundStyle(Color(hex: 0x64748B))
                                            .lineLimit(1)
                                    }
                                }

                                Spacer(minLength: 0)

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text(formatAmount(value: milestone.amount, currency: project.budget.currency))
                                        .font(.system(size: 12, weight: .black))
                                        .foregroundStyle(midnightBlue)

                                    if let proposedAmount = milestone.proposedAmount, proposedAmount > 0 {
                                        Text("→ \(formatAmount(value: proposedAmount, currency: project.budget.currency))")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(Color(hex: 0x1D4ED8))
                                    }
                                }
                            }

                            HStack(spacing: 6) {
                                milestoneStatusBadge(milestone.status)

                                if let paymentStatus = milestone.paymentStatus,
                                   !paymentStatus.isEmpty,
                                   paymentStatus.uppercased() != milestone.status.uppercased() {
                                    milestonePaymentStatusBadge(paymentStatus)
                                }

                                if milestone.budgetStatus == "PROPOSED" {
                                    budgetStatusBadge(milestone.budgetStatus)
                                }
                            }

                            if viewModel.isProvider, let action {
                                Button {
                                    Task {
                                        guard let token = authSession.accessToken else { return }
                                        _ = await viewModel.advanceMilestone(
                                            projectID: project.id,
                                            milestone: milestone,
                                            token: token,
                                            language: resolvedLanguageCode,
                                            currency: appCurrency
                                        )
                                    }
                                } label: {
                                    HStack(spacing: 6) {
                                        if isUpdating {
                                            ProgressView().tint(Color(hex: 0x071A12))
                                        } else {
                                            Image(systemName: action.status == "work_in_progress" ? "play.fill" : "checkmark.circle.fill")
                                                .font(.system(size: 12, weight: .black))
                                        }
                                        Text(s(action.titleKey))
                                            .font(.system(size: 11, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 9)
                                    .background(trustoraGreen)
                                    .foregroundStyle(Color(hex: 0x071A12))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                                .buttonStyle(.plain)
                                .disabled(isUpdating)
                            }
                        }
                        .padding(10)
                        .background(TrustoraTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                        )
                    }
                }
                .padding(10)
                .background(Color(hex: 0xF1F5F9))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            } else if viewModel.isProvider {
                Text(s("dashboard.projects.provider_no_milestones"))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            if providerCanRespond {
                HStack(spacing: 8) {
                    Button {
                        Task {
                            guard let token = authSession.accessToken else { return }
                            _ = await viewModel.respondToProject(
                                projectID: project.id,
                                response: "ACCEPTED",
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        }
                    } label: {
                        HStack(spacing: 6) {
                            if projectIsResponding {
                                ProgressView().tint(Color(hex: 0x071A12))
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 12, weight: .black))
                            }
                            Text(s("dashboard.projects.actions.approve"))
                                .font(.system(size: 12, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(trustoraGreen)
                        .foregroundStyle(Color(hex: 0x071A12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                    .disabled(projectIsResponding)

                    Button {
                        Task {
                            guard let token = authSession.accessToken else { return }
                            _ = await viewModel.respondToProject(
                                projectID: project.id,
                                response: "REJECTED",
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        }
                    } label: {
                        Text(s("dashboard.projects.actions.reject"))
                            .font(.system(size: 12, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .foregroundStyle(Color(hex: 0x7F1D1D))
                            .background(Color(hex: 0xFEE2E2))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color(hex: 0xFCA5A5), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .disabled(projectIsResponding)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(hex: 0xF8FAFC))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func projectStatusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let title = statusLabel(for: status)

        let style: (background: Color, foreground: Color)
        switch normalized {
        case "PENDING":
            style = (Color(hex: 0xFEF3C7), Color(hex: 0x92400E))
        case "WORK_IN_PROGRESS", "IN_PROGRESS":
            style = (Color(hex: 0xDBEAFE), Color(hex: 0x1E40AF))
        case "ESCROW", "BLOCKED":
            style = (Color(hex: 0xDCFCE7), Color(hex: 0x166534))
        case "ACCEPTED", "COMPLETED", "FINISHED":
            style = (Color(hex: 0xD1FAE5), Color(hex: 0x065F46))
        case "REJECTED", "CANCELLED":
            style = (Color(hex: 0xFEE2E2), Color(hex: 0x991B1B))
        case "NEW_PROPOSE", "BUDGET_PROPOSED", "AWAITING_BUDGET_APPROVAL":
            style = (Color(hex: 0xE0E7FF), Color(hex: 0x3730A3))
        default:
            style = (Color(hex: 0xE2E8F0), Color(hex: 0x334155))
        }

        return Text(title)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(style.foreground)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(style.background)
            .clipShape(Capsule())
    }

    private func milestoneStatusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let title = statusLabel(for: status)

        let style: (background: Color, foreground: Color)
        switch normalized {
        case "PENDING":
            style = (Color(hex: 0xFEF3C7), Color(hex: 0x92400E))
        case "WORK_IN_PROGRESS", "IN_PROGRESS":
            style = (Color(hex: 0xDBEAFE), Color(hex: 0x1E40AF))
        case "ESCROW", "BLOCKED":
            style = (Color(hex: 0xDCFCE7), Color(hex: 0x166534))
        case "FINISHED", "COMPLETED", "PAID":
            style = (Color(hex: 0xD1FAE5), Color(hex: 0x065F46))
        case "REJECTED":
            style = (Color(hex: 0xFEE2E2), Color(hex: 0x991B1B))
        default:
            style = (Color(hex: 0xE2E8F0), Color(hex: 0x334155))
        }

        return Text(title)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(style.foreground)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(style.background)
            .clipShape(Capsule())
    }

    private func milestonePaymentStatusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let title = statusLabel(for: status)

        let style: (background: Color, foreground: Color)
        switch normalized {
        case "PENDING":
            style = (Color(hex: 0xFEF3C7), Color(hex: 0x92400E))
        case "ESCROW", "BLOCKED":
            style = (Color(hex: 0xDCFCE7), Color(hex: 0x166534))
        case "PAID", "RELEASED":
            style = (Color(hex: 0xBBF7D0), Color(hex: 0x14532D))
        case "REJECTED":
            style = (Color(hex: 0xFEE2E2), Color(hex: 0x991B1B))
        default:
            style = (Color(hex: 0xE2E8F0), Color(hex: 0x334155))
        }

        return Text(title)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(style.foreground)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(style.background)
            .clipShape(Capsule())
    }

    private func budgetStatusBadge(_ status: String) -> some View {
        Text(statusLabel(for: status))
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(Color(hex: 0x1D4ED8))
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(Color(hex: 0xDBEAFE))
            .clipShape(Capsule())
    }

    private func serviceRow(_ service: DashboardServiceItem) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(service.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .lineLimit(2)

                    if let category = service.category, !category.isEmpty {
                        Text(category)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color(hex: 0x64748B))
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                Text(formatAmount(value: service.priceAmount, currency: service.currency))
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(midnightBlue)
                    .lineLimit(1)
            }

            HStack(spacing: 10) {
                if let rating = service.rating {
                    Label(String(format: "%.1f", rating), systemImage: "star.fill")
                }
                if let reviewCount = service.reviewCount {
                    Label("\(reviewCount)", systemImage: "text.bubble.fill")
                }
                if let orderCount = service.orderCount {
                    Label("\(orderCount)", systemImage: "bag.fill")
                }
                if let level = service.level, !level.isEmpty {
                    Label(level, systemImage: "chart.bar.fill")
                }
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Color(hex: 0x475569))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(hex: 0xF8FAFC))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func messageBubbleRow(_ message: DashboardChatMessage) -> some View {
        let isMine = message.senderID == (authSession.user?.id ?? "")

        return HStack(alignment: .bottom, spacing: 8) {
            if isMine {
                Spacer(minLength: 40)
            }

            VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
                if !isMine {
                    Text(message.senderName)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color(hex: 0x475569))
                }

                Text(message.content)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(midnightBlue)
                    .fixedSize(horizontal: false, vertical: true)

                if let timestamp = message.timestamp {
                    Text(messageTimeFormatter.string(from: timestamp))
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x64748B))
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(isMine ? trustoraGreen.opacity(0.26) : TrustoraTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isMine ? trustoraGreen.opacity(0.55) : Color(hex: 0xE2E8F0), lineWidth: 1)
            )

            if !isMine {
                Spacer(minLength: 40)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func filterCapsule(title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .bold))
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .lineLimit(1)
        }
        .foregroundStyle(midnightBlue)
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 11))
        .overlay(
            RoundedRectangle(cornerRadius: 11)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func loadingCard(text: String) -> some View {
        HStack(spacing: 10) {
            ProgressView()
                .tint(Color(hex: 0x0C8F5D))
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color(hex: 0x64748B))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private func errorCard(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color(hex: 0xB91C1C))

            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color(hex: 0x7F1D1D))
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(hex: 0xFEE2E2))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: 0xFCA5A5), lineWidth: 1)
        )
    }

    private func financeBalanceRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color(hex: 0x64748B))

            Spacer(minLength: 0)

            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(midnightBlue)
        }
    }

    private var emptyProjectsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(viewModel.isProvider ? s("dashboard.projects.empty.title.provider") : s("dashboard.projects.empty.title.client"))
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(midnightBlue)

            Text(viewModel.isProvider ? s("dashboard.projects.empty.description.provider") : s("dashboard.projects.empty.description.client"))
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color(hex: 0x64748B))
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }

    private var paginationControls: some View {
        HStack {
            Button {
                viewModel.goToPreviousPage()
            } label: {
                Text(s("dashboard.pagination.previous"))
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(viewModel.currentPage > 1 ? midnightBlue : Color(hex: 0x94A3B8))
            }
            .buttonStyle(.plain)
            .disabled(viewModel.currentPage <= 1)

            Spacer(minLength: 0)

            Text(sf("dashboard.pagination.page", [
                "current": String(viewModel.currentPage),
                "total": String(viewModel.totalPages),
            ]))
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(Color(hex: 0x64748B))

            Spacer(minLength: 0)

            Button {
                viewModel.goToNextPage()
            } label: {
                Text(s("dashboard.pagination.next"))
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(viewModel.currentPage < viewModel.totalPages ? midnightBlue : Color(hex: 0x94A3B8))
            }
            .buttonStyle(.plain)
            .disabled(viewModel.currentPage >= viewModel.totalPages)
        }
        .padding(.horizontal, 6)
        .padding(.top, 6)
    }

    private var projectsTitle: String {
        viewModel.isProvider ? s("dashboard.projects.title.provider") : s("dashboard.projects.title.client")
    }

    private var statusOptions: [String] {
        if viewModel.isProvider {
            return ["all", "PENDING", "ACCEPTED", "REJECTED", "BUDGET_PROPOSED"]
        }

        return ["all", "PENDING_RESPONSES", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    }

    private var overviewStats: [DashboardStatDisplay] {
        if viewModel.isProvider {
            let providerStats = viewModel.stats?.providerStats

            return [
                DashboardStatDisplay(
                    title: s("dashboard.overview.provider.active_projects.title"),
                    value: numericText(providerStats?.activeProjects.value, fallbackKey: "dashboard.overview.provider.active_projects.value"),
                    change: signedChangeText(providerStats?.activeProjects.change, fallbackKey: "dashboard.overview.provider.active_projects.change"),
                    icon: "briefcase.fill",
                    color: Color(hex: 0x2563EB)
                ),
                DashboardStatDisplay(
                    title: s("dashboard.overview.provider.monthly_revenue.title"),
                    value: providerMoneyText(
                        providerStats?.monthlyRevenue.value,
                        currency: providerStats?.monthlyRevenue.currency,
                        fallbackKey: "dashboard.overview.provider.monthly_revenue.value"
                    ),
                    change: percentageText(providerStats?.monthlyRevenue.changePercentage, fallbackKey: "dashboard.overview.provider.monthly_revenue.change"),
                    icon: "banknote.fill",
                    color: Color(hex: 0x059669)
                ),
                DashboardStatDisplay(
                    title: s("dashboard.overview.provider.average_rating.title"),
                    value: numericText(providerStats?.averageRating.value, fallbackKey: "dashboard.overview.provider.average_rating.value"),
                    change: signedChangeText(providerStats?.averageRating.change, fallbackKey: "dashboard.overview.provider.average_rating.change"),
                    icon: "star.fill",
                    color: Color(hex: 0xF59E0B)
                ),
                DashboardStatDisplay(
                    title: s("dashboard.overview.provider.new_requests.title"),
                    value: numericText(providerStats?.newRequests.value, fallbackKey: "dashboard.overview.provider.new_requests.value"),
                    change: signedChangeText(providerStats?.newRequests.change, fallbackKey: "dashboard.overview.provider.new_requests.change"),
                    icon: "bell.fill",
                    color: Color(hex: 0x7C3AED)
                ),
            ]
        }

        let clientStats = viewModel.stats?.clientStats

        return [
            DashboardStatDisplay(
                title: s("dashboard.overview.client.projects_posted.title"),
                value: numericText(clientStats?.projectsPosted.value, fallbackKey: "dashboard.overview.client.projects_posted.value"),
                change: signedChangeText(clientStats?.projectsPosted.change, fallbackKey: "dashboard.overview.client.projects_posted.change"),
                icon: "doc.text.fill",
                color: Color(hex: 0x2563EB)
            ),
            DashboardStatDisplay(
                title: s("dashboard.overview.client.budget_spent.title"),
                value: providerMoneyText(
                    clientStats?.budgetSpent.value,
                    currency: clientStats?.budgetSpent.currency,
                    fallbackKey: "dashboard.overview.client.budget_spent.value"
                ),
                change: percentageText(clientStats?.budgetSpent.changePercentage, fallbackKey: "dashboard.overview.client.budget_spent.change"),
                icon: "banknote.fill",
                color: Color(hex: 0x059669)
            ),
            DashboardStatDisplay(
                title: s("dashboard.overview.client.projects_completed.title"),
                value: numericText(clientStats?.projectsCompleted.value, fallbackKey: "dashboard.overview.client.projects_completed.value"),
                change: signedChangeText(clientStats?.projectsCompleted.change, fallbackKey: "dashboard.overview.client.projects_completed.change"),
                icon: "checkmark.seal.fill",
                color: Color(hex: 0x0C8F5D)
            ),
            DashboardStatDisplay(
                title: s("dashboard.overview.client.active_providers.title"),
                value: numericText(clientStats?.activeProviders.value, fallbackKey: "dashboard.overview.client.active_providers.value"),
                change: signedChangeText(clientStats?.activeProviders.change, fallbackKey: "dashboard.overview.client.active_providers.change"),
                icon: "person.2.fill",
                color: Color(hex: 0x7C3AED)
            ),
        ]
    }

    private var transferConfirmationAmount: String {
        let normalized = viewModel.transferAmount.replacingOccurrences(of: ",", with: ".")
        let value = Double(normalized)
        return formatAmount(value: value, currency: viewModel.selectedWallet?.currency)
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
        let code = appLanguage == .system ? resolvedLanguageCode : appLanguage.rawValue
        switch code {
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

    private var projectDateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        return formatter
    }

    private var messageTimeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        return formatter
    }

    private func numericText(_ value: Double?, fallbackKey: String) -> String {
        guard let value else {
            return s(fallbackKey)
        }

        if value.rounded() == value {
            return String(Int(value))
        }

        return String(format: "%.1f", value)
    }

    private func signedChangeText(_ value: Double?, fallbackKey: String) -> String {
        guard let value else {
            return s(fallbackKey)
        }

        let sign = value > 0 ? "+" : ""
        if value.rounded() == value {
            return "\(sign)\(Int(value))"
        }

        return "\(sign)\(String(format: "%.1f", value))"
    }

    private func percentageText(_ value: Double?, fallbackKey: String) -> String {
        guard let value else {
            return s(fallbackKey)
        }

        let sign = value > 0 ? "+" : ""
        return "\(sign)\(String(format: "%.1f", value))%"
    }

    private func providerMoneyText(_ value: Double?, currency: String?, fallbackKey: String) -> String {
        guard let value else {
            return s(fallbackKey)
        }

        return formatAmount(value: value, currency: currency)
    }

    private func statusLabel(for rawStatus: String) -> String {
        let normalized = rawStatus.lowercased()

        switch normalized {
        case "all":
            return s("dashboard.filters.status.all")
        case "pending_responses":
            return s("dashboard.filters.status.pending_responses")
        case "work_in_progress":
            return s("dashboard.filters.status.in_progress")
        case "in_progress":
            return s("dashboard.filters.status.in_progress")
        case "awaiting_budget_approval":
            return s("dashboard.filters.status.budget_proposed")
        case "completed":
            return s("dashboard.filters.status.completed")
        case "finished":
            return s("dashboard.projects.milestone_status.finished")
        case "paid":
            return s("dashboard.projects.milestone_status.paid")
        case "cancelled":
            return s("dashboard.filters.status.cancelled")
        case "pending":
            return s("dashboard.filters.status.pending")
        case "accepted":
            return s("dashboard.filters.status.accepted")
        case "rejected":
            return s("dashboard.filters.status.rejected")
        case "new_propose":
            return s("dashboard.filters.status.budget_proposed")
        case "budget_proposed":
            return s("dashboard.filters.status.budget_proposed")
        case "proposed":
            return s("dashboard.filters.status.budget_proposed")
        case "escrow", "blocked":
            return s("dashboard.projects.payment_status.escrow")
        case "released":
            return s("dashboard.projects.payment_status.paid")
        default:
            return rawStatus
        }
    }

    private func sortLabel(for sort: DashboardProjectSort) -> String {
        switch sort {
        case .newest:
            return s("dashboard.filters.sort.newest")
        case .oldest:
            return s("dashboard.filters.sort.oldest")
        case .budget:
            return s("dashboard.filters.sort.budget")
        case .title:
            return s("dashboard.filters.sort.title")
        }
    }

    private func formatAmount(value: Double?, currency: String?) -> String {
        guard let value else {
            return "--"
        }

        let locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .currency
        formatter.currencyCode = currency ?? appCurrency.rawValue
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0

        let number = NSNumber(value: value)
        return formatter.string(from: number) ?? "\(number) \(currency ?? appCurrency.rawValue)"
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

private struct CompanySearchPickerSheet: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    let closeLabel: String
    let searchPlaceholder: String
    let emptyText: String
    let options: [CompanyPickerOption]
    let selectedValue: String
    let onSelect: (CompanyPickerOption) -> Void

    @State private var searchTerm = ""

    private var filteredOptions: [CompanyPickerOption] {
        let query = searchTerm.trimmed.lowercased()
        guard !query.isEmpty else {
            return options
        }

        return options.filter { option in
            option.title.lowercased().contains(query)
            || option.value.lowercased().contains(query)
            || (option.subtitle?.lowercased().contains(query) ?? false)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color(hex: 0x64748B))

                TextField(searchPlaceholder, text: $searchTerm)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.system(size: 13, weight: .medium))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color(hex: 0xF8FAFC))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
            )
            .padding(.horizontal, 16)
            .padding(.top, 12)

            if filteredOptions.isEmpty {
                Text(emptyText)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                    .padding(.horizontal, 16)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(filteredOptions) { option in
                            Button {
                                onSelect(option)
                                dismiss()
                            } label: {
                                HStack(spacing: 10) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(option.title)
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(Color(hex: 0x0B1C2D))
                                            .lineLimit(1)

                                        if let subtitle = option.subtitle, !subtitle.isEmpty {
                                            Text(subtitle)
                                                .font(.system(size: 11, weight: .medium))
                                                .foregroundStyle(Color(hex: 0x64748B))
                                                .lineLimit(1)
                                        }
                                    }

                                    Spacer(minLength: 0)

                                    if option.value.caseInsensitiveCompare(selectedValue) == .orderedSame {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 15, weight: .bold))
                                            .foregroundStyle(Color(hex: 0x1BC47D))
                                    }
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(hex: 0xF8FAFC))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
            }
        }
        .background(TrustoraTheme.background.ignoresSafeArea())
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(closeLabel) {
                    dismiss()
                }
                .font(.system(size: 13, weight: .bold))
            }
        }
    }
}

private struct DashboardUserAvatarView: View {
    let user: TrustoraAuthUser
    let size: CGFloat

    private var initials: String {
        let firstInitial = user.firstName.first.map { String($0) } ?? ""
        let lastInitial = user.lastName.first.map { String($0) } ?? ""
        let combined = (firstInitial + lastInitial).uppercased()
        return combined.isEmpty ? "U" : combined
    }

    var body: some View {
        Group {
            if let avatar = user.avatar,
               let url = URL(string: avatar),
               !avatar.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackAvatar
                    }
                }
            } else {
                fallbackAvatar
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                .stroke(Color.white.opacity(0.72), lineWidth: 1)
        )
    }

    private var fallbackAvatar: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1BC47D), Color(hex: 0x0B1C2D)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(initials)
                .font(.system(size: max(12, size * 0.34), weight: .black))
                .foregroundStyle(Color.white)
        }
    }
}

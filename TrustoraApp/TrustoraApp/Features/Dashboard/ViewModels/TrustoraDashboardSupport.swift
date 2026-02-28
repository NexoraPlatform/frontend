import SwiftUI
import Combine

enum DashboardTab: String, CaseIterable, Identifiable {
    case overview
    case projects
    case services
    case messages
    case finance
    case settings

    var id: String { rawValue }
}

enum DashboardProjectSort: String, CaseIterable, Identifiable {
    case newest
    case oldest
    case budget
    case title

    var id: String { rawValue }
}

enum DashboardSortOrder {
    case asc
    case desc

    mutating func toggle() {
        self = self == .asc ? .desc : .asc
    }
}

struct DashboardCompanyFormState {
    var companyID: String?
    var name = ""
    var representedBy = ""
    var email = ""
    var idType = ""
    var idNumber = ""
    var bankCurrency = ""
    var companyCountry = ""
    var companyCounty = ""
    var companyCity = ""
    var companyZip = ""
    var companyAddress = ""
    var companyBankIBAN = ""
    var companyBankName = ""
    var companyBankBIC = ""

    init(user: TrustoraAuthUser?) {
        let company = user?.company
        companyID = company?.id?.nilIfEmpty
        name = company?.name ?? user?.companyName ?? ""
        representedBy = user?.displayName ?? ""
        email = user?.email ?? ""
        idType = company?.idType ?? ""
        idNumber = company?.idNumber ?? ""
        bankCurrency = company?.bankCurrency ?? ""
        companyCountry = company?.companyCountry ?? ""
        companyCounty = company?.companyCounty ?? ""
        companyCity = company?.companyCity ?? ""
        companyZip = company?.companyZip ?? ""
        companyAddress = company?.companyAddress ?? ""
        companyBankIBAN = company?.companyBankIBAN ?? ""
        companyBankName = company?.companyBankName ?? ""
        companyBankBIC = company?.companyBankBIC ?? ""
    }

    func payload() -> DashboardCompanyDetailsPayload {
        DashboardCompanyDetailsPayload(
            companyID: companyID?.nilIfEmpty,
            name: name.trimmed,
            representedBy: representedBy.trimmed,
            email: email.trimmed,
            companyAddress: companyAddress.trimmed,
            companyCity: companyCity.trimmed,
            companyCounty: companyCounty.trimmed,
            companyZip: companyZip.trimmed,
            companyCountry: companyCountry.trimmed.uppercased(),
            companyBankIBAN: companyBankIBAN.trimmed,
            companyBankName: companyBankName.trimmed,
            companyBankBIC: companyBankBIC.trimmed,
            idType: idType.trimmed,
            idNumber: idNumber.trimmed,
            bankCurrency: bankCurrency.trimmed.uppercased()
        )
    }
}

struct DashboardStatDisplay: Identifiable {
    let id = UUID()
    let title: String
    let value: String
    let change: String
    let icon: String
    let color: Color
}

@MainActor
final class TrustoraDashboardViewModel: ObservableObject {
    @Published var activeTab: DashboardTab = .overview

    @Published var stats: DashboardStatsResponse?
    @Published var allProjects: [DashboardProjectSummary] = []
    @Published var overviewProjects: [DashboardProjectSummary] = []
    @Published var recentActivities: [DashboardRecentActivity] = []
    @Published var services: [DashboardServiceItem] = []
    @Published var chatGroups: [DashboardChatGroup] = []
    @Published var chatMessages: [DashboardChatMessage] = []
    @Published var selectedChatGroupID: String?
    @Published var chatDraft = ""
    @Published var wallets: [DashboardWalletBalance] = []
    @Published var selectedWalletID: String?

    @Published var searchTerm = ""
    @Published var statusFilter = "all"
    @Published var sortBy: DashboardProjectSort = .newest
    @Published var sortOrder: DashboardSortOrder = .desc
    @Published var currentPage = 1

    @Published var transferAmount = ""
    @Published var transferError: String?

    @Published var isLoadingOverview = false
    @Published var isLoadingProjects = false
    @Published var isLoadingServices = false
    @Published var isLoadingChatGroups = false
    @Published var isLoadingChatMessages = false
    @Published var isSendingChatMessage = false
    @Published var respondingProjectIDs: Set<String> = []
    @Published var updatingMilestoneIDs: Set<String> = []
    @Published var isLoadingFinance = false
    @Published var isLoadingTransfer = false
    @Published var isRapydConnecting = false
    @Published var isSavingCompanyInfo = false
    @Published var isLoadingCompanyManagers = false
    @Published var isSavingCompanyManagers = false

    @Published var overviewError: String?
    @Published var projectsError: String?
    @Published var servicesError: String?
    @Published var messagesError: String?
    @Published var financeError: String?
    @Published var companySettingsError: String?
    @Published var companySettingsSuccess = false
    @Published var companyManagersError: String?

    @Published var companyForm = DashboardCompanyFormState(user: nil)
    @Published var companySearchTerm = ""
    @Published var companySearchResults: [DashboardCompanySearchResult] = []
    @Published var isSearchingCompanies = false
    @Published var companySearchError: String?

    @Published var currencySearchTerm = ""
    @Published var currencyOptions: [DashboardCurrencyOption] = []
    @Published var isLoadingCurrencies = false
    @Published var currencySearchError: String?

    @Published var companyManagers: [DashboardCompanyUser] = []
    @Published var companyMembers: [DashboardCompanyUser] = []
    @Published var companyManagerSearchTerm = ""
    @Published var companyManagerSearchResults: [DashboardCompanyUser] = []
    @Published var isSearchingCompanyUsers = false
    @Published var transferringOwnershipEmail: String?

    @Published private(set) var roleSlugs: [String] = []

    private let projectsPerPage = 6
    private var companySearchTask: Task<Void, Never>?
    private var currencySearchTask: Task<Void, Never>?
    private var managerSearchTask: Task<Void, Never>?

    var isProvider: Bool {
        roleSlugs.contains("provider")
    }

    var isClient: Bool {
        roleSlugs.contains("client")
    }

    var hasRoleInfo: Bool {
        !roleSlugs.isEmpty
    }

    func canManageCompanySettings(user: TrustoraAuthUser?) -> Bool {
        guard isProvider else { return false }
        return user?.company?.id?.nilIfEmpty != nil
    }

    var availableTabs: [DashboardTab] {
        if hasRoleInfo && !isProvider {
            return [.overview, .projects, .services, .messages, .settings]
        }
        return [.overview, .projects, .services, .messages, .finance, .settings]
    }

    var selectedWallet: DashboardWalletBalance? {
        guard let selectedWalletID else {
            return wallets.first
        }
        return wallets.first(where: { $0.id == selectedWalletID }) ?? wallets.first
    }

    var selectedChatGroup: DashboardChatGroup? {
        guard let selectedChatGroupID else {
            return nil
        }
        return chatGroups.first(where: { $0.id == selectedChatGroupID })
    }

    var filteredProjects: [DashboardProjectSummary] {
        var result = allProjects

        if !searchTerm.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let normalized = searchTerm.lowercased()
            result = result.filter { project in
                project.title.lowercased().contains(normalized)
                || project.description.lowercased().contains(normalized)
            }
        }

        if statusFilter != "all" {
            result = result.filter { $0.status.uppercased() == statusFilter.uppercased() }
        }

        result.sort { lhs, rhs in
            switch sortBy {
            case .title:
                if sortOrder == .asc {
                    return lhs.title.localizedCaseInsensitiveCompare(rhs.title) == .orderedAscending
                }
                return lhs.title.localizedCaseInsensitiveCompare(rhs.title) == .orderedDescending
            case .budget:
                let left = lhs.budget.amount ?? 0
                let right = rhs.budget.amount ?? 0
                return sortOrder == .asc ? left < right : left > right
            case .oldest:
                let left = lhs.createdAt ?? .distantPast
                let right = rhs.createdAt ?? .distantPast
                return sortOrder == .asc ? left < right : left > right
            case .newest:
                let left = lhs.createdAt ?? .distantPast
                let right = rhs.createdAt ?? .distantPast
                return sortOrder == .asc ? left < right : left > right
            }
        }

        return result
    }

    var totalPages: Int {
        max(1, Int(ceil(Double(filteredProjects.count) / Double(projectsPerPage))))
    }

    var paginatedProjects: [DashboardProjectSummary] {
        let safePage = min(max(1, currentPage), totalPages)
        let startIndex = (safePage - 1) * projectsPerPage
        let endIndex = min(startIndex + projectsPerPage, filteredProjects.count)

        guard startIndex < endIndex else {
            return []
        }

        return Array(filteredProjects[startIndex..<endIndex])
    }

    func configureRole(for user: TrustoraAuthUser?) {
        guard let user else {
            roleSlugs = []
            activeTab = .overview
            return
        }

        var nextRoles = Set(user.roleSlugs)

        if let role = user.role?.lowercased(), !role.isEmpty {
            nextRoles.insert(role)
        }

        roleSlugs = Array(nextRoles)

        if !availableTabs.contains(activeTab) {
            activeTab = availableTabs.first ?? .overview
        }
    }

    func reloadAll(
        user: TrustoraAuthUser?,
        token: String?,
        language: String,
        currency: AppCurrency
    ) async {
        configureRole(for: user)
        resetCompanyForm(user: user)

        guard let token, !token.isEmpty else {
            allProjects = []
            overviewProjects = []
            recentActivities = []
            services = []
            chatGroups = []
            chatMessages = []
            selectedChatGroupID = nil
            chatDraft = ""
            wallets = []
            selectedWalletID = nil
            companyManagers = []
            companyMembers = []
            companyManagerSearchResults = []
            companySearchResults = []
            currencyOptions = []
            companySettingsError = nil
            companyManagersError = nil
            companySettingsSuccess = false
            return
        }

        await loadProjects(token: token, language: language, currency: currency)
        await loadOverview(token: token, language: language, currency: currency)
        await loadServices(token: token, language: language, currency: currency, providerID: isProvider ? user?.id : nil)
        await loadChatGroups(token: token)

        if isProvider {
            await loadFinance(token: token, language: language)
        } else {
            wallets = []
            selectedWalletID = nil
        }

        if activeTab == .settings {
            await loadSettings(user: user, token: token, language: language)
        }
    }

    func loadOverview(token: String, language: String, currency: AppCurrency) async {
        isLoadingOverview = true
        overviewError = nil

        do {
            let fetchedStats = try await TrustoraAPIClient.shared.getDashboardStats(
                language: language,
                currency: currency,
                bearerToken: token
            )
            stats = fetchedStats

            let fetchedActivities = try await TrustoraAPIClient.shared.getRecentActivitiesQuick(
                language: language,
                bearerToken: token
            )
            recentActivities = Array(fetchedActivities.prefix(3))

            overviewProjects = Array(
                allProjects
                    .sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }
                    .prefix(2)
            )
        } catch {
            overviewError = error.localizedDescription
        }

        isLoadingOverview = false
    }

    func loadProjects(token: String, language: String, currency: AppCurrency) async {
        isLoadingProjects = true
        projectsError = nil

        do {
            if isProvider {
                allProjects = try await TrustoraAPIClient.shared.getProviderProjectRequests(
                    language: language,
                    currency: currency,
                    bearerToken: token
                )
            } else {
                allProjects = try await TrustoraAPIClient.shared.getClientProjectRequests(
                    language: language,
                    currency: currency,
                    bearerToken: token
                )
            }

            let latestTwo = allProjects
                .sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }
                .prefix(2)
            overviewProjects = Array(latestTwo)

            currentPage = min(max(1, currentPage), totalPages)
        } catch {
            projectsError = error.localizedDescription
            allProjects = []
            overviewProjects = []
        }

        isLoadingProjects = false
    }

    func projectMilestones(
        for project: DashboardProjectSummary,
        currentUserID: String?
    ) -> [DashboardProjectMilestone] {
        if !isProvider {
            return project.milestones
        }

        guard let currentUserID else {
            return []
        }

        let normalizedCurrentUserID = currentUserID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedCurrentUserID.isEmpty else {
            return []
        }

        let assignedToCurrentProvider = project.milestones.filter { milestone in
            let assignedProviderID = milestone.assignedProviderID?
                .trimmingCharacters(in: .whitespacesAndNewlines)
            return assignedProviderID == normalizedCurrentUserID
        }

        if !assignedToCurrentProvider.isEmpty {
            return assignedToCurrentProvider
        }

        return []
    }

    func projectDisplayStatus(
        for project: DashboardProjectSummary,
        currentUserID: String?
    ) -> String {
        if !isProvider {
            return project.status
        }

        let ownedMilestones = projectMilestones(for: project, currentUserID: currentUserID)
        let hasCurrentProviderWorkInProgress = ownedMilestones.contains { milestone in
            let milestoneStatus = normalizeStatus(milestone.status)
            return milestoneStatus == "WORK_IN_PROGRESS" || milestoneStatus == "IN_PROGRESS"
        }

        if hasCurrentProviderWorkInProgress {
            return "WORK_IN_PROGRESS"
        }

        return project.status
    }

    func canProviderRespond(to project: DashboardProjectSummary) -> Bool {
        isProvider && project.status == "PENDING"
    }

    func canProviderAdvanceMilestone(_ milestone: DashboardProjectMilestone) -> Bool {
        let normalizedStatus = normalizeStatus(milestone.status)
        if ["FINISHED", "COMPLETED", "PAID", "REJECTED"].contains(normalizedStatus) {
            return false
        }

        if ["PENDING", "ESCROW", "BLOCKED"].contains(normalizedStatus) {
            if normalizedStatus == "PENDING" {
                return isMilestonePaymentSecured(milestone)
            }
            return true
        }

        return normalizedStatus == "WORK_IN_PROGRESS" || normalizedStatus == "IN_PROGRESS"
    }

    func nextMilestoneAction(
        for milestone: DashboardProjectMilestone
    ) -> (status: String, titleKey: String)? {
        guard canProviderAdvanceMilestone(milestone) else {
            return nil
        }

        let normalizedStatus = normalizeStatus(milestone.status)
        if ["PENDING", "ESCROW", "BLOCKED"].contains(normalizedStatus) {
            return ("work_in_progress", "dashboard.projects.actions.start_work")
        }

        return ("finished", "dashboard.projects.actions.mark_finished")
    }

    func respondToProject(
        projectID: String,
        response: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        respondingProjectIDs.insert(projectID)
        defer { respondingProjectIDs.remove(projectID) }

        do {
            var refusalScope: String?
            var reason: String?
            var suggestionsLimit: Int?

            if response.uppercased() == "REJECTED" {
                refusalScope = "project"
                reason = "Provider rejected project participation"
                suggestionsLimit = 5
            }

            try await TrustoraAPIClient.shared.respondToProjectRequest(
                projectId: projectID,
                response: response,
                language: language,
                proposedBudget: nil,
                reason: reason,
                refusalScope: refusalScope,
                milestoneIDs: nil,
                suggestionsLimit: suggestionsLimit,
                bearerToken: token
            )

            await loadProjects(token: token, language: language, currency: currency)
            await loadOverview(token: token, language: language, currency: currency)
            return true
        } catch {
            projectsError = error.localizedDescription
            return false
        }
    }

    func advanceMilestone(
        projectID: String,
        milestone: DashboardProjectMilestone,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        guard let action = nextMilestoneAction(for: milestone) else {
            return false
        }

        let updateKey = "\(projectID)|\(milestone.id)"
        updatingMilestoneIDs.insert(updateKey)
        defer { updatingMilestoneIDs.remove(updateKey) }

        do {
            _ = try await TrustoraAPIClient.shared.markProjectMilestone(
                projectId: projectID,
                milestoneId: milestone.id,
                status: action.status,
                bearerToken: token
            )

            await loadProjects(token: token, language: language, currency: currency)
            await loadOverview(token: token, language: language, currency: currency)
            return true
        } catch {
            projectsError = error.localizedDescription
            return false
        }
    }

    func loadServices(
        token: String,
        language: String,
        currency: AppCurrency,
        providerID: String?
    ) async {
        isLoadingServices = true
        servicesError = nil

        do {
            services = try await TrustoraAPIClient.shared.getDashboardServices(
                providerId: providerID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            servicesError = error.localizedDescription
            services = []
        }

        isLoadingServices = false
    }

    func loadChatGroups(token: String) async {
        isLoadingChatGroups = true
        messagesError = nil

        do {
            let groups = try await TrustoraAPIClient.shared.getChatGroups(bearerToken: token)
            chatGroups = groups

            if let selectedChatGroupID,
               groups.contains(where: { $0.id == selectedChatGroupID }) {
                await loadChatMessages(token: token, groupID: selectedChatGroupID)
            } else {
                selectedChatGroupID = groups.first?.id
                chatMessages = []
                if let firstID = selectedChatGroupID {
                    await loadChatMessages(token: token, groupID: firstID)
                }
            }
        } catch {
            messagesError = error.localizedDescription
            chatGroups = []
            chatMessages = []
            selectedChatGroupID = nil
        }

        isLoadingChatGroups = false
    }

    func selectChatGroup(_ groupID: String, token: String) async {
        selectedChatGroupID = groupID
        await loadChatMessages(token: token, groupID: groupID)
        await markSelectedGroupAsRead(token: token)
    }

    func loadChatMessages(token: String, groupID: String? = nil) async {
        guard let targetGroupID = groupID ?? selectedChatGroupID else {
            chatMessages = []
            return
        }

        isLoadingChatMessages = true
        messagesError = nil

        do {
            chatMessages = try await TrustoraAPIClient.shared.getChatMessages(
                groupId: targetGroupID,
                page: 1,
                limit: 60,
                bearerToken: token
            )
        } catch {
            messagesError = error.localizedDescription
            chatMessages = []
        }

        isLoadingChatMessages = false
    }

    func sendCurrentChatMessage(token: String, language: String) async {
        guard let targetGroupID = selectedChatGroupID else {
            return
        }

        let trimmed = chatDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return
        }

        isSendingChatMessage = true
        defer { isSendingChatMessage = false }
        messagesError = nil

        do {
            let sentMessage = try await TrustoraAPIClient.shared.sendChatMessage(
                groupId: targetGroupID,
                content: trimmed,
                language: language,
                bearerToken: token
            )
            chatDraft = ""

            if let sentMessage {
                chatMessages.append(sentMessage)
            } else {
                await loadChatMessages(token: token, groupID: targetGroupID)
            }

            for index in chatGroups.indices {
                if chatGroups[index].id == targetGroupID {
                    let current = chatGroups[index]
                    chatGroups[index] = DashboardChatGroup(
                        id: current.id,
                        name: current.name,
                        type: current.type,
                        unreadCount: 0,
                        lastMessage: trimmed,
                        updatedAt: Date()
                    )
                }
            }

            chatGroups.sort { lhs, rhs in
                if lhs.unreadCount != rhs.unreadCount {
                    return lhs.unreadCount > rhs.unreadCount
                }
                return (lhs.updatedAt ?? .distantPast) > (rhs.updatedAt ?? .distantPast)
            }
        } catch {
            messagesError = error.localizedDescription
        }
    }

    func markSelectedGroupAsRead(token: String) async {
        guard let targetGroupID = selectedChatGroupID else {
            return
        }

        do {
            try await TrustoraAPIClient.shared.markChatGroupRead(
                groupId: targetGroupID,
                bearerToken: token
            )

            for index in chatGroups.indices where chatGroups[index].id == targetGroupID {
                let current = chatGroups[index]
                chatGroups[index] = DashboardChatGroup(
                    id: current.id,
                    name: current.name,
                    type: current.type,
                    unreadCount: 0,
                    lastMessage: current.lastMessage,
                    updatedAt: current.updatedAt
                )
            }
        } catch {
            messagesError = error.localizedDescription
        }
    }

    func loadFinance(token: String, language: String) async {
        isLoadingFinance = true
        financeError = nil

        do {
            let fetchedWallets = try await TrustoraAPIClient.shared.getRapydWalletBalances(
                language: language,
                bearerToken: token
            )
            wallets = fetchedWallets

            if selectedWalletID == nil {
                selectedWalletID = fetchedWallets.first?.id
            }

            if let selectedWalletID,
               !fetchedWallets.contains(where: { $0.id == selectedWalletID }) {
                self.selectedWalletID = fetchedWallets.first?.id
            }
        } catch {
            financeError = error.localizedDescription
            wallets = []
            selectedWalletID = nil
        }

        isLoadingFinance = false
    }

    func connectRapyd(token: String, language: String) async -> URL? {
        isRapydConnecting = true
        defer { isRapydConnecting = false }

        do {
            let response = try await TrustoraAPIClient.shared.rapydOnboarding(
                language: language,
                bearerToken: token
            )
            return response.url
        } catch {
            financeError = error.localizedDescription
            return nil
        }
    }

    func applyWalletSelection(_ walletID: String) {
        selectedWalletID = walletID
        transferAmount = ""
        transferError = nil
    }

    func fillTransferMax() {
        guard let balance = selectedWallet?.balance else {
            return
        }

        transferAmount = String(format: "%.2f", balance)
        transferError = nil
    }

    func transfer(
        token: String,
        language: String,
        currency: AppCurrency,
        invalidAmountText: String,
        insufficientBalanceText: String
    ) async -> Bool {
        transferError = nil

        guard let wallet = selectedWallet,
              let walletBalance = wallet.balance
        else {
            transferError = invalidAmountText
            return false
        }

        let normalizedInput = transferAmount.replacingOccurrences(of: ",", with: ".")
        guard let decimalAmount = Decimal(string: normalizedInput), decimalAmount > 0 else {
            transferError = invalidAmountText
            return false
        }

        let requested = NSDecimalNumber(decimal: decimalAmount).doubleValue
        guard requested <= walletBalance else {
            transferError = insufficientBalanceText
            return false
        }

        isLoadingTransfer = true
        defer { isLoadingTransfer = false }

        do {
            _ = try await TrustoraAPIClient.shared.createRapydPayoutBank(
                payload: RapydPayoutPayload(amount: decimalAmount, currency: wallet.currency),
                language: language,
                currency: currency,
                bearerToken: token
            )
            transferAmount = ""
            transferError = nil
            await loadFinance(token: token, language: language)
            return true
        } catch {
            transferError = error.localizedDescription
            return false
        }
    }

    func resetCompanyForm(user: TrustoraAuthUser?) {
        companyForm = DashboardCompanyFormState(user: user)
        companySearchTerm = ""
        companySearchResults = []
        companySearchError = nil
        currencySearchTerm = companyForm.bankCurrency
        currencySearchError = nil
        companyManagerSearchTerm = ""
        companyManagerSearchResults = []
    }

    func loadSettings(
        user: TrustoraAuthUser?,
        token: String,
        language _: String
    ) async {
        resetCompanyForm(user: user)
        companySettingsError = nil
        companySettingsSuccess = false

        guard let companyID = user?.company?.id?.nilIfEmpty else {
            companyManagers = []
            companyMembers = []
            companyManagersError = nil
            isLoadingCompanyManagers = false
            await loadCurrenciesIfNeeded()
            return
        }

        isLoadingCompanyManagers = true
        companyManagersError = nil

        do {
            async let fetchedEditors = TrustoraAPIClient.shared.getCompanyManagers(
                companyID: companyID,
                bearerToken: token
            )
            async let fetchedMembers = TrustoraAPIClient.shared.getCompanyMembers(
                companyID: companyID,
                bearerToken: token
            )
            companyManagers = try await fetchedEditors
            companyMembers = try await fetchedMembers
        } catch {
            companyManagers = []
            companyMembers = []
            companyManagersError = error.localizedDescription
        }

        isLoadingCompanyManagers = false
        await loadCurrenciesIfNeeded()
    }

    func scheduleCompanySearch() {
        companySearchTask?.cancel()
        companySearchError = nil

        let query = companySearchTerm.trimmed
        guard query.count >= 2 else {
            companySearchResults = []
            isSearchingCompanies = false
            return
        }

        companySearchTask = Task { [query] in
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }

            isSearchingCompanies = true
            defer { isSearchingCompanies = false }

            do {
                let results = try await TrustoraAPIClient.shared.searchCompanies(query: query)
                guard !Task.isCancelled else { return }
                companySearchResults = results
            } catch {
                guard !Task.isCancelled else { return }
                companySearchResults = []
                companySearchError = error.localizedDescription
            }
        }
    }

    func applyCompanySearchResult(_ company: DashboardCompanySearchResult) {
        companyForm.name = company.name
        companyForm.idNumber = company.taxID ?? company.tradeRegistryNumber ?? companyForm.idNumber
        companyForm.companyCountry = company.companyCountry ?? companyForm.companyCountry
        companyForm.companyCity = company.companyCity ?? companyForm.companyCity
        companyForm.companyZip = company.companyZip ?? companyForm.companyZip
        companyForm.companyAddress = company.companyAddress ?? companyForm.companyAddress
        companySearchTerm = company.name
        companySearchResults = []
    }

    func scheduleCurrencySearch() {
        currencySearchTask?.cancel()
        currencySearchError = nil

        let query = currencySearchTerm.trimmed
        currencySearchTask = Task { [query] in
            try? await Task.sleep(nanoseconds: 240_000_000)
            guard !Task.isCancelled else { return }

            isLoadingCurrencies = true
            defer { isLoadingCurrencies = false }

            do {
                let results = try await TrustoraAPIClient.shared.getCurrencies(search: query.nilIfEmpty)
                guard !Task.isCancelled else { return }
                currencyOptions = results
            } catch {
                guard !Task.isCancelled else { return }
                currencyOptions = []
                currencySearchError = error.localizedDescription
            }
        }
    }

    func loadCurrenciesIfNeeded() async {
        if !currencyOptions.isEmpty {
            return
        }

        isLoadingCurrencies = true
        defer { isLoadingCurrencies = false }
        do {
            currencyOptions = try await TrustoraAPIClient.shared.getCurrencies(search: nil)
        } catch {
            currencySearchError = error.localizedDescription
            currencyOptions = []
        }
    }

    func applyCurrency(_ option: DashboardCurrencyOption) {
        let normalized = option.code.uppercased()
        companyForm.bankCurrency = normalized
        currencySearchTerm = normalized
        currencySearchError = nil
    }

    func saveCompanyInformation(
        user: TrustoraAuthUser?,
        token: String
    ) async -> Bool {
        guard isProvider else {
            return false
        }

        isSavingCompanyInfo = true
        defer { isSavingCompanyInfo = false }

        companySettingsError = nil
        companySettingsSuccess = false

        if companyForm.companyID == nil {
            companyForm.companyID = user?.company?.id?.nilIfEmpty
        }

        do {
            try await TrustoraAPIClient.shared.updateUserCompanyDetails(
                payload: companyForm.payload(),
                bearerToken: token
            )
            companySettingsSuccess = true
            return true
        } catch {
            companySettingsError = error.localizedDescription
            return false
        }
    }

    func scheduleCompanyManagerSearch(token: String) {
        managerSearchTask?.cancel()

        let query = companyManagerSearchTerm.trimmed
        guard query.count >= 2 else {
            companyManagerSearchResults = []
            isSearchingCompanyUsers = false
            return
        }

        managerSearchTask = Task { [query] in
            try? await Task.sleep(nanoseconds: 320_000_000)
            guard !Task.isCancelled else { return }

            isSearchingCompanyUsers = true
            defer { isSearchingCompanyUsers = false }

            do {
                let users = try await TrustoraAPIClient.shared.searchUsersForCompany(
                    search: query,
                    bearerToken: token
                )
                guard !Task.isCancelled else { return }
                companyManagerSearchResults = users
            } catch {
                guard !Task.isCancelled else { return }
                companyManagerSearchResults = []
                companyManagersError = error.localizedDescription
            }
        }
    }

    func isExistingCompanyManager(_ candidate: DashboardCompanyUser) -> Bool {
        companyManagers.contains(where: { manager in
            if let leftEmail = manager.normalizedEmail,
               let rightEmail = candidate.normalizedEmail,
               leftEmail == rightEmail {
                return true
            }
            if let leftUserID = manager.userID?.nilIfEmpty,
               let rightUserID = candidate.userID?.nilIfEmpty,
               leftUserID == rightUserID {
                return true
            }
            return manager.id == candidate.id
        })
    }

    func addCompanyManager(
        _ candidate: DashboardCompanyUser,
        user: TrustoraAuthUser?,
        token: String,
        language: String
    ) async {
        guard !isExistingCompanyManager(candidate) else {
            return
        }

        companyManagers.append(candidate)
        companyManagerSearchTerm = ""
        companyManagerSearchResults = []
        _ = await persistCompanyManagers(user: user, token: token, language: language)
    }

    func removeCompanyManager(
        _ manager: DashboardCompanyUser,
        user: TrustoraAuthUser?,
        token: String,
        language: String
    ) async {
        companyManagers.removeAll(where: { $0.id == manager.id })
        _ = await persistCompanyManagers(user: user, token: token, language: language)
    }

    func transferCompanyOwnership(
        to member: DashboardCompanyUser,
        user: TrustoraAuthUser?,
        token: String,
        language: String
    ) async -> Bool {
        guard canManageCompanySettings(user: user),
              let companyID = user?.company?.id?.nilIfEmpty,
              let transferEmail = member.normalizedEmail
        else {
            return false
        }

        transferringOwnershipEmail = transferEmail
        defer { transferringOwnershipEmail = nil }

        do {
            try await TrustoraAPIClient.shared.updateCompanyEditorsOrOwnership(
                companyID: companyID,
                editorEmails: nil,
                transferOwnerEmail: transferEmail,
                bearerToken: token
            )
            companyManagersError = nil
            await loadSettings(user: user, token: token, language: language)
            return true
        } catch {
            companyManagersError = error.localizedDescription
            return false
        }
    }

    private func persistCompanyManagers(
        user: TrustoraAuthUser?,
        token: String,
        language: String
    ) async -> Bool {
        guard canManageCompanySettings(user: user),
              let companyID = user?.company?.id?.nilIfEmpty
        else {
            return false
        }

        isSavingCompanyManagers = true
        defer { isSavingCompanyManagers = false }

        let editorEmails = companyManagers.compactMap(\.normalizedEmail)

        do {
            try await TrustoraAPIClient.shared.updateCompanyEditorsOrOwnership(
                companyID: companyID,
                editorEmails: editorEmails,
                transferOwnerEmail: nil,
                bearerToken: token
            )
            companyManagersError = nil
            return true
        } catch {
            companyManagersError = error.localizedDescription
            await loadSettings(user: user, token: token, language: language)
            return false
        }
    }

    func resetFilters() {
        searchTerm = ""
        statusFilter = "all"
        sortBy = .newest
        sortOrder = .desc
        currentPage = 1
    }

    func goToPreviousPage() {
        currentPage = max(1, currentPage - 1)
    }

    func goToNextPage() {
        currentPage = min(totalPages, currentPage + 1)
    }

    private func normalizeStatus(_ value: String?) -> String {
        (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    }

    private func isMilestonePaymentSecured(_ milestone: DashboardProjectMilestone) -> Bool {
        let payment = normalizeStatus(milestone.paymentStatus)
        let state = normalizeStatus(milestone.status)

        if payment == "ESCROW" || payment == "BLOCKED" || payment == "PAID" || payment == "RELEASED" {
            return true
        }

        if payment.contains("ESCROW") || payment.contains("BLOCK") || payment.contains("PAID") || payment.contains("RELEASE") {
            return true
        }

        return state == "ESCROW" || state == "BLOCKED"
    }
}

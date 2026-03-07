import Foundation
import SwiftUI
import Combine

extension Notification.Name {
    static let trustoraProjectCreationStarted = Notification.Name("trustora.project.creation.started")
    static let trustoraProjectCreated = Notification.Name("trustora.project.created")
    static let trustoraProjectOAuthConnectRequested = Notification.Name("trustora.project.oauth.connect.requested")
}

@MainActor
final class TrustoraCreateProjectViewModel: ObservableObject {
    @Published var mode: ProjectCreationMode = .ai
    @Published var step: ProjectCreationWizardStep = .intent

    @Published var intent = ""

    @Published var manualTitle = ""
    @Published var manualSpecificRequirements = ""
    @Published var manualDuration = ""
    @Published var manualPaymentPlan = "MILESTONE"
    @Published var manualCurrency = "USD"
    @Published var manualLines: [ProjectCreationLineDraft] = []

    @Published var serviceSearch = ""
    @Published private(set) var groupedServices: [ProjectCreationServiceOption] = []
    @Published private(set) var groupedServicesPage = 1
    @Published private(set) var groupedServicesHasMore = true
    @Published private(set) var isLoadingServices = false
    @Published private(set) var isLoadingMoreServices = false

    @Published var selectedManualServiceIDs: [String] = []
    @Published private(set) var selectedManualServicesMap: [String: ProjectCreationServiceOption] = [:]

    @Published private(set) var recommendations: [ProjectCreationServiceRecommendation] = []
    @Published var selectedRecommendationIDs = Set<String>()
    @Published private(set) var isLoadingRecommendation = false

    @Published private(set) var aiMessages: [ProjectCreationAIMessage] = []
    @Published private(set) var aiStatus: ProjectCreationAIStatus = .clarify
    @Published private(set) var aiQuestions: [String] = []
    @Published var aiClarificationAnswer = ""
    @Published private(set) var isLoadingBrief = false

    @Published private(set) var brief: ProjectCreationBrief?
    @Published var totalBudget = ""
    @Published var editableDuration = ""
    @Published var editablePaymentPlan = ""

    @Published private(set) var recommendedProviders: [String: [ProjectCreationProviderCandidate]] = [:]
    @Published var selectedProvidersByService: [String: Set<String>] = [:]
    @Published var selectedMilestoneProviderByKey: [String: String] = [:]
    @Published private(set) var isLoadingProviders = false

    @Published private(set) var isCreatingProject = false
    @Published private(set) var createdProject: DashboardProjectSummary?
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private var serviceLineCounter = 1
    private var milestoneCounter = 1

    var wizardSteps: [ProjectCreationWizardStep] {
        mode.wizardSteps
    }

    var selectedManualServices: [ProjectCreationServiceOption] {
        selectedManualServiceIDs.compactMap { selectedManualServicesMap[$0] }
    }

    var selectedRecommendationServices: [ProjectCreationServiceRecommendation] {
        recommendations.filter { selectedRecommendationIDs.contains($0.id) }
    }

    var selectedServicesForProviderRecommendations: [ProjectCreationProviderServiceInput] {
        if mode == .manual {
            return selectedManualServices.map { service in
                ProjectCreationProviderServiceInput(id: service.id, name: service.name)
            }
        }

        return selectedRecommendationServices.map { recommendation in
            ProjectCreationProviderServiceInput(id: recommendation.serviceID, name: recommendation.serviceName)
        }
    }

    var reviewLines: [ProjectCreationBriefLine] {
        guard let brief else { return [] }
        let budget = parsedTotalBudget
        guard budget > 0 else { return brief.lines }

        return brief.lines.map { line in
            let allocated = (budget * line.budgetPercentage) / 100
            let updatedMilestones = line.milestones.map { milestone in
                if milestone.amount > 0 {
                    return milestone
                }
                let fallback = milestone.percentage.map { allocated * $0 / 100 } ?? 0
                return ProjectCreationBriefMilestone(
                    id: milestone.id,
                    title: milestone.title,
                    description: milestone.description,
                    percentage: milestone.percentage,
                    amount: fallback,
                    assignedProviderID: milestone.assignedProviderID
                )
            }
            return ProjectCreationBriefLine(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description,
                budgetPercentage: line.budgetPercentage,
                milestones: updatedMilestones
            )
        }
    }

    var parsedTotalBudget: Double {
        let normalized = totalBudget.replacingOccurrences(of: ",", with: ".").trimmed
        return Double(normalized) ?? 0
    }

    func requiredOAuthProviders() -> [ProjectCreationOAuthProvider] {
        var required: [ProjectCreationOAuthProvider] = []
        for line in reviewLines {
            guard let provider = oauthProvider(for: line.deliveryProvider) else { continue }
            if !required.contains(provider) {
                required.append(provider)
            }
        }
        return required
    }

    func requiredServices(for provider: ProjectCreationOAuthProvider) -> [String] {
        var services: [String] = []
        for line in reviewLines {
            guard oauthProvider(for: line.deliveryProvider) == provider else { continue }
            if !services.contains(line.serviceName) {
                services.append(line.serviceName)
            }
        }
        return services
    }

    func connectedOAuthProviders(user: TrustoraAuthUser?) -> Set<ProjectCreationOAuthProvider> {
        guard let user else { return [] }
        var connected = Set<ProjectCreationOAuthProvider>()

        for account in user.connectedAccounts ?? [] {
            switch account.provider.lowercased() {
            case "github":
                connected.insert(.github)
            case "figma":
                connected.insert(.figma)
            case "google":
                connected.insert(.google)
            default:
                break
            }
        }

        if (user.githubToken?.nilIfEmpty) != nil {
            connected.insert(.github)
        }

        return connected
    }

    func missingOAuthProviders(user: TrustoraAuthUser?) -> [ProjectCreationOAuthProvider] {
        let required = requiredOAuthProviders()
        let connected = connectedOAuthProviders(user: user)
        return required.filter { !connected.contains($0) }
    }

    func canContinueFromConnections(user: TrustoraAuthUser?) -> Bool {
        guard brief != nil else { return false }
        return missingOAuthProviders(user: user).isEmpty
    }

    func applyMode(_ mode: ProjectCreationMode) {
        if self.mode == mode { return }
        self.mode = mode
        errorMessage = nil
        successMessage = nil
        step = .intent

        recommendations = []
        selectedRecommendationIDs = []
        aiMessages = []
        aiStatus = .clarify
        aiQuestions = []
        aiClarificationAnswer = ""

        if mode == .ai {
            brief = nil
            recommendedProviders = [:]
            selectedProvidersByService = [:]
            selectedMilestoneProviderByKey = [:]
        }
    }

    func transition(to nextStep: ProjectCreationWizardStep) {
        guard wizardSteps.contains(nextStep) else { return }
        step = nextStep
    }

    func goToNextStep() {
        guard let currentIndex = wizardSteps.firstIndex(of: step) else { return }
        guard currentIndex + 1 < wizardSteps.count else { return }
        step = wizardSteps[currentIndex + 1]
    }

    func goToPreviousStep() {
        guard let currentIndex = wizardSteps.firstIndex(of: step), currentIndex > 0 else { return }
        step = wizardSteps[currentIndex - 1]
    }

    func loadGroupedServices(
        reset: Bool,
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        if reset {
            groupedServicesPage = 1
            groupedServicesHasMore = true
            groupedServices = []
        }

        if isLoadingServices || isLoadingMoreServices {
            return
        }

        if !reset, !groupedServicesHasMore {
            return
        }

        if reset {
            isLoadingServices = true
        } else {
            isLoadingMoreServices = true
        }
        errorMessage = nil

        defer {
            isLoadingServices = false
            isLoadingMoreServices = false
        }

        do {
            let response = try await TrustoraAPIClient.shared.getProjectCreationServices(
                page: groupedServicesPage,
                limit: 3,
                search: serviceSearch.trimmed.nilIfEmpty,
                language: language,
                currency: currency,
                bearerToken: token
            )

            if reset {
                groupedServices = response.services
            } else {
                let unique = response.services.filter { incoming in
                    !groupedServices.contains(where: { $0.id == incoming.id })
                }
                groupedServices.append(contentsOf: unique)
            }

            groupedServicesHasMore = response.hasMore
            if response.hasMore {
                groupedServicesPage = response.page + 1
            }

            syncSelectedServicesFromLoadedPage()
        } catch {
            errorMessage = error.localizedDescription
            groupedServicesHasMore = false
        }
    }

    func shouldLoadNextServicesPage(after serviceID: String, threshold: Int = 3) -> Bool {
        guard groupedServicesHasMore else { return false }
        guard let index = groupedServices.firstIndex(where: { $0.id == serviceID }) else { return false }
        let trigger = max(groupedServices.count - max(1, threshold), 0)
        return index >= trigger
    }

    func toggleManualService(_ service: ProjectCreationServiceOption, selected: Bool) {
        if selected {
            if !selectedManualServiceIDs.contains(service.id) {
                selectedManualServiceIDs.append(service.id)
            }
            selectedManualServicesMap[service.id] = service
        } else {
            selectedManualServiceIDs.removeAll { $0 == service.id }
            selectedManualServicesMap.removeValue(forKey: service.id)
        }

        syncManualLinesWithSelectedServices()
    }

    func updateManualLine(_ lineID: String, description: String? = nil, budgetPercentage: String? = nil) {
        manualLines = manualLines.map { line in
            guard line.id == lineID else { return line }
            return ProjectCreationLineDraft(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: description ?? line.description,
                budgetPercentage: budgetPercentage ?? line.budgetPercentage,
                milestones: line.milestones
            )
        }
    }

    func addManualMilestone(to lineID: String) {
        let milestoneID = "manual-milestone-\(milestoneCounter)"
        milestoneCounter += 1

        manualLines = manualLines.map { line in
            guard line.id == lineID else { return line }
            var milestones = line.milestones
            milestones.append(
                ProjectCreationMilestoneDraft(
                    id: milestoneID,
                    title: "",
                    description: "",
                    percentage: "",
                    amount: ""
                )
            )
            return ProjectCreationLineDraft(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description,
                budgetPercentage: line.budgetPercentage,
                milestones: milestones
            )
        }
    }

    func removeManualMilestone(lineID: String, milestoneID: String) {
        manualLines = manualLines.map { line in
            guard line.id == lineID else { return line }
            return ProjectCreationLineDraft(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description,
                budgetPercentage: line.budgetPercentage,
                milestones: line.milestones.filter { $0.id != milestoneID }
            )
        }
    }

    func updateManualMilestone(
        lineID: String,
        milestoneID: String,
        title: String? = nil,
        description: String? = nil,
        percentage: String? = nil,
        amount: String? = nil
    ) {
        manualLines = manualLines.map { line in
            guard line.id == lineID else { return line }

            let milestones = line.milestones.map { milestone in
                guard milestone.id == milestoneID else { return milestone }
                return ProjectCreationMilestoneDraft(
                    id: milestone.id,
                    title: title ?? milestone.title,
                    description: description ?? milestone.description,
                    percentage: percentage ?? milestone.percentage,
                    amount: amount ?? milestone.amount
                )
            }

            return ProjectCreationLineDraft(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description,
                budgetPercentage: line.budgetPercentage,
                milestones: milestones
            )
        }
    }

    func requestRecommendations(token: String, language: String) async {
        let normalizedIntent = intent.trimmed
        guard !normalizedIntent.isEmpty else {
            errorMessage = "project.new.error.intent_required"
            return
        }

        isLoadingRecommendation = true
        errorMessage = nil
        defer { isLoadingRecommendation = false }

        do {
            let response = try await TrustoraAPIClient.shared.recommendProjectCreationServices(
                brief: normalizedIntent,
                language: language,
                bearerToken: token
            )

            recommendations = response
            selectedRecommendationIDs = Set(
                response
                    .filter { !$0.isAlternative }
                    .map(\.id)
            )
            if selectedRecommendationIDs.isEmpty {
                selectedRecommendationIDs = Set(response.map(\.id))
            }
            step = .recommendation
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleRecommendation(_ recommendationID: String) {
        if selectedRecommendationIDs.contains(recommendationID) {
            selectedRecommendationIDs.remove(recommendationID)
        } else {
            selectedRecommendationIDs.insert(recommendationID)
        }
    }

    func confirmRecommendationAndStartBrief(token: String, language: String) async {
        let selectedServices = selectedRecommendationServices
        guard !selectedServices.isEmpty else {
            errorMessage = "project.new.error.select_service"
            return
        }

        let lines = selectedServices.enumerated().map { index, service in
            "\(index + 1). \(service.serviceName) (\(providerLabel(for: service.deliveryProvider)))"
        }
        let content = [
            "Client intent: \(intent.trimmed)",
            "Recommended services:\n\(lines.joined(separator: "\n"))",
            "Generate a modular project brief grouped by project lines with milestone amounts and budget percentages.",
        ].joined(separator: "\n\n")

        let messages = [ProjectCreationAIMessage(role: "user", content: content)]
        aiMessages = messages
        aiQuestions = []
        aiClarificationAnswer = ""
        brief = nil
        recommendedProviders = [:]
        selectedProvidersByService = [:]
        selectedMilestoneProviderByKey = [:]
        editableDuration = ""
        editablePaymentPlan = ""
        step = .briefing

        await requestBrief(messages: messages, token: token, language: language)
    }

    func sendClarification(token: String, language: String) async {
        let normalized = aiClarificationAnswer.trimmed
        guard !normalized.isEmpty else {
            errorMessage = "project.new.error.answer_required"
            return
        }

        let messages = aiMessages + [ProjectCreationAIMessage(role: "user", content: normalized)]
        aiMessages = messages
        aiClarificationAnswer = ""

        await requestBrief(messages: messages, token: token, language: language)
    }

    func consumeRealtimeBriefGenerated(
        payload: Any,
        token: String,
        language: String
    ) async {
        let extractedResultID = TrustoraAPIClient.shared.extractProjectCreationBriefResultID(from: payload)
        if let resultID = extractedResultID?.nilIfEmpty {
            isLoadingBrief = false
            errorMessage = nil
            aiStatus = .processing
            await refreshBriefResult(resultID: resultID, token: token, language: language)
            return
        }

        if let response = TrustoraAPIClient.shared.normalizeProjectCreationAIBriefRealtimePayload(
            payload,
            language: language
        ) {
            isLoadingBrief = false
            errorMessage = nil
            applyRealtimeAwareBriefResponse(response)
            return
        }
    }

    func consumeRealtimeBriefFailed(payload: Any) {
        isLoadingBrief = false
        aiStatus = .clarify
        errorMessage = TrustoraAPIClient.shared.extractProjectCreationBriefFailureMessage(from: payload)
            ?? "project.new.error.brief_generation_failed"
    }

    func continueManualFlowToProviders(token: String, language: String) async {
        guard let generatedBrief = buildBriefFromManualInput() else {
            return
        }

        brief = generatedBrief
        aiStatus = .final
        aiQuestions = []
        editableDuration = generatedBrief.duration
        editablePaymentPlan = generatedBrief.paymentPlan

        if totalBudget.trimmed.isEmpty {
            let inferredBudget = generatedBrief.lines
                .flatMap(\.milestones)
                .reduce(0) { $0 + $1.amount }
            if inferredBudget > 0 {
                totalBudget = String(Int(inferredBudget.rounded()))
            }
        }

        await loadProviderRecommendations(token: token, language: language)
        step = .providers
    }

    func continueFromBriefToProviders(token: String, language: String) async {
        guard brief != nil else {
            errorMessage = "project.new.error.brief_missing"
            return
        }

        await loadProviderRecommendations(token: token, language: language)
        step = .providers
    }

    func continueToReview() {
        guard brief != nil else {
            errorMessage = "project.new.error.brief_missing"
            return
        }
        step = .review
    }

    func toggleProvider(serviceName: String, providerID: String) {
        let key = serviceKey(serviceName)
        var selected = selectedProvidersByService[key] ?? Set<String>()

        if selected.contains(providerID) {
            selected.remove(providerID)
        } else {
            selected.insert(providerID)
        }

        selectedProvidersByService[key] = selected

        selectedMilestoneProviderByKey = selectedMilestoneProviderByKey.filter { assignment in
            guard assignment.key.hasPrefix("\(key)::") else { return true }
            return selected.contains(assignment.value)
        }
    }

    func assignMilestone(
        serviceName: String,
        lineID: String,
        milestoneID: String,
        providerID: String
    ) {
        let key = serviceKey(serviceName)
        guard (selectedProvidersByService[key] ?? []).contains(providerID) else {
            return
        }

        selectedMilestoneProviderByKey[milestoneAssignmentKey(serviceName: serviceName, lineID: lineID, milestoneID: milestoneID)] = providerID
    }

    func removeMilestoneAssignment(serviceName: String, lineID: String, milestoneID: String) {
        selectedMilestoneProviderByKey.removeValue(
            forKey: milestoneAssignmentKey(serviceName: serviceName, lineID: lineID, milestoneID: milestoneID)
        )
    }

    func createProject(
        token: String,
        user: TrustoraAuthUser,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        guard let brief else {
            errorMessage = "project.new.error.brief_missing"
            return false
        }

        let budget = parsedTotalBudget
        guard budget > 0 else {
            errorMessage = "project.new.error.invalid_budget"
            return false
        }

        let duration = effectiveDuration
        guard !duration.isEmpty else {
            errorMessage = "project.new.error.duration_required"
            return false
        }

        let paymentPlan = effectivePaymentPlan
        guard !paymentPlan.isEmpty else {
            errorMessage = "project.new.error.payment_plan_required"
            return false
        }

        isCreatingProject = true
        errorMessage = nil
        successMessage = nil
        NotificationCenter.default.post(name: .trustoraProjectCreationStarted, object: nil)

        defer {
            isCreatingProject = false
        }

        do {
            let payload = makeCreatePayload(
                brief: brief,
                budget: budget,
                userID: user.id,
                paymentPlan: paymentPlan,
                duration: duration
            )

            let created = try await TrustoraAPIClient.shared.createClientProject(
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )

            createdProject = created
            successMessage = "project.new.success.created"
            NotificationCenter.default.post(
                name: .trustoraProjectCreated,
                object: created,
                userInfo: [
                    "project_id": created?.id ?? "",
                    "project_slug": created?.slug ?? "",
                ]
            )
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func providerOptions(for serviceName: String) -> [ProjectCreationProviderCandidate] {
        recommendedProviders[serviceName] ?? []
    }

    func isProviderSelected(serviceName: String, providerID: String) -> Bool {
        (selectedProvidersByService[serviceKey(serviceName)] ?? []).contains(providerID)
    }

    func selectedProviderIDForMilestone(serviceName: String, lineID: String, milestoneID: String) -> String? {
        selectedMilestoneProviderByKey[milestoneAssignmentKey(serviceName: serviceName, lineID: lineID, milestoneID: milestoneID)]
    }

    func providerByID(serviceName: String, providerID: String) -> ProjectCreationProviderCandidate? {
        providerOptions(for: serviceName).first(where: { $0.id == providerID })
    }

    private var effectiveDuration: String {
        editableDuration.trimmed.nilIfEmpty ?? brief?.duration ?? manualDuration.trimmed
    }

    private var effectivePaymentPlan: String {
        (editablePaymentPlan.trimmed.nilIfEmpty ?? brief?.paymentPlan ?? manualPaymentPlan.trimmed).uppercased()
    }

    private func applyRealtimeAwareBriefResponse(_ response: ProjectCreationAIBriefResponse) {
        if aiStatus == .final, response.status != .final {
            return
        }

        if response.status == .processing, aiStatus == .clarify {
            return
        }

        applyBriefResponse(response)
    }

    private func refreshBriefResult(
        resultID: String,
        token: String,
        language: String
    ) async {
        do {
            let response = try await TrustoraAPIClient.shared.getProjectCreationBriefResult(
                id: resultID,
                locale: language,
                bearerToken: token
            )
            applyRealtimeAwareBriefResponse(response)
        } catch {
            aiStatus = .clarify
            errorMessage = error.localizedDescription
        }
    }

    private func requestBrief(
        messages: [ProjectCreationAIMessage],
        token: String,
        language: String
    ) async {
        isLoadingBrief = true
        aiStatus = .processing
        aiQuestions = []
        errorMessage = nil

        defer {
            isLoadingBrief = false
        }

        do {
            let response = try await TrustoraAPIClient.shared.buildProjectCreationBrief(
                locale: language,
                messages: messages,
                bearerToken: token
            )
            applyRealtimeAwareBriefResponse(response)

            if response.status == .processing, let resultID = response.briefResultID?.nilIfEmpty {
                do {
                    let nextResponse = try await TrustoraAPIClient.shared.getProjectCreationBriefResult(
                        id: resultID,
                        locale: language,
                        bearerToken: token
                    )
                    applyRealtimeAwareBriefResponse(nextResponse)
                } catch {
                    // Keep waiting for realtime event fallback.
                }
            }
        } catch {
            aiStatus = .clarify
            errorMessage = error.localizedDescription
        }
    }

    private func applyBriefResponse(_ response: ProjectCreationAIBriefResponse) {
        aiStatus = response.status
        aiQuestions = response.questions

        if let finalBrief = response.finalBrief {
            brief = finalBrief
            if editableDuration.trimmed.isEmpty {
                editableDuration = finalBrief.duration
            }
            if editablePaymentPlan.trimmed.isEmpty {
                editablePaymentPlan = finalBrief.paymentPlan
            }
        }

        if !response.recommendedProviders.isEmpty {
            recommendedProviders = response.recommendedProviders
            autoSelectRecommendedProviders()
        }
    }

    private func loadProviderRecommendations(token: String, language: String) async {
        guard !selectedServicesForProviderRecommendations.isEmpty else {
            recommendedProviders = [:]
            selectedProvidersByService = [:]
            selectedMilestoneProviderByKey = [:]
            return
        }

        isLoadingProviders = true
        errorMessage = nil
        defer { isLoadingProviders = false }

        do {
            let result = try await TrustoraAPIClient.shared.recommendProjectCreationProviders(
                projectTitle: generatedProjectTitle,
                description: generatedProjectDescription,
                services: selectedServicesForProviderRecommendations,
                specificRequirements: normalizedSpecificRequirements,
                language: language,
                bearerToken: token
            )

            recommendedProviders = result
            autoSelectRecommendedProviders()
        } catch {
            recommendedProviders = [:]
            selectedProvidersByService = [:]
            selectedMilestoneProviderByKey = [:]
            errorMessage = error.localizedDescription
        }
    }

    private var generatedProjectTitle: String {
        if mode == .manual {
            return manualTitle.trimmed.nilIfEmpty ?? fallbackProjectTitle(from: intent)
        }

        return brief?.title.trimmed.nilIfEmpty ?? fallbackProjectTitle(from: intent)
    }

    private var generatedProjectDescription: String {
        if mode == .manual {
            return intent.trimmed
        }

        return brief?.description.trimmed.nilIfEmpty ?? intent.trimmed
    }

    private var normalizedSpecificRequirements: [String] {
        let fromManual = manualSpecificRequirements
            .split(separator: "\n")
            .map { String($0).trimmed }
            .filter { !$0.isEmpty }
        if !fromManual.isEmpty {
            return fromManual
        }
        return brief?.specificRequirements ?? []
    }

    private func autoSelectRecommendedProviders() {
        var selected: [String: Set<String>] = [:]

        for (serviceName, providers) in recommendedProviders {
            let key = serviceKey(serviceName)
            selected[key] = Set(providers.map(\.id))
        }

        selectedProvidersByService = selected

        if let brief {
            var assignments: [String: String] = [:]
            for line in brief.lines {
                let key = serviceKey(line.serviceName)
                guard let firstProviderID = selected[key]?.first else { continue }

                for milestone in line.milestones {
                    assignments[milestoneAssignmentKey(serviceName: line.serviceName, lineID: line.id, milestoneID: milestone.id)] = firstProviderID
                }
            }
            selectedMilestoneProviderByKey = assignments
        }
    }

    private func syncSelectedServicesFromLoadedPage() {
        for service in groupedServices where selectedManualServiceIDs.contains(service.id) {
            selectedManualServicesMap[service.id] = service
        }
    }

    private func syncManualLinesWithSelectedServices() {
        let selectedServices = selectedManualServices
        let existingByServiceID = Dictionary(uniqueKeysWithValues: manualLines.map { ($0.serviceID, $0) })

        let updated = selectedServices.map { service -> ProjectCreationLineDraft in
            if let existing = existingByServiceID[service.id] {
                return ProjectCreationLineDraft(
                    id: existing.id,
                    serviceID: service.id,
                    serviceName: service.name,
                    deliveryProvider: service.deliveryProvider,
                    description: existing.description,
                    budgetPercentage: existing.budgetPercentage,
                    milestones: existing.milestones
                )
            }

            let lineID = "manual-line-\(serviceLineCounter)"
            serviceLineCounter += 1
            return ProjectCreationLineDraft(
                id: lineID,
                serviceID: service.id,
                serviceName: service.name,
                deliveryProvider: service.deliveryProvider,
                description: "",
                budgetPercentage: "",
                milestones: []
            )
        }

        manualLines = updated
    }

    private func buildBriefFromManualInput() -> ProjectCreationBrief? {
        let title = manualTitle.trimmed.nilIfEmpty ?? fallbackProjectTitle(from: intent)
        if title.isEmpty {
            errorMessage = "project.new.error.title_required"
            return nil
        }

        guard !selectedManualServices.isEmpty else {
            errorMessage = "project.new.error.select_service"
            return nil
        }

        let lines: [ProjectCreationBriefLine] = manualLines.compactMap { line in
            guard let percentage = parseNumber(line.budgetPercentage), percentage > 0 else {
                return nil
            }

            let milestones: [ProjectCreationBriefMilestone] = line.milestones.compactMap { milestone in
                guard let amount = parseNumber(milestone.amount), amount > 0 else {
                    return nil
                }

                return ProjectCreationBriefMilestone(
                    id: milestone.id,
                    title: milestone.title.trimmed.nilIfEmpty ?? "Milestone",
                    description: milestone.description.trimmed,
                    percentage: parseNumber(milestone.percentage),
                    amount: amount,
                    assignedProviderID: nil
                )
            }

            return ProjectCreationBriefLine(
                id: line.id,
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description.trimmed,
                budgetPercentage: percentage,
                milestones: milestones
            )
        }

        guard !lines.isEmpty else {
            errorMessage = "project.new.error.invalid_lines"
            return nil
        }

        let totalPercentage = lines.reduce(0) { $0 + $1.budgetPercentage }
        if totalPercentage > 100.0001 {
            errorMessage = "project.new.error.percentage_over_100"
            return nil
        }

        return ProjectCreationBrief(
            title: title,
            description: intent.trimmed,
            lines: lines,
            technologies: selectedManualServices.map(\.name),
            specificRequirements: normalizedSpecificRequirements,
            duration: manualDuration.trimmed,
            paymentPlan: manualPaymentPlan.trimmed.uppercased(),
            currency: manualCurrency.trimmed.uppercased().nilIfEmpty ?? "USD"
        )
    }

    private func makeCreatePayload(
        brief: ProjectCreationBrief,
        budget: Double,
        userID: String,
        paymentPlan: String,
        duration: String
    ) -> ProjectCreationCreatePayload {
        let linePayloads: [ProjectCreationCreateProjectLinePayload] = reviewLines.enumerated().map { index, line in
            let budgetAllocation = budget * line.budgetPercentage / 100
            let milestones = line.milestones.map { milestone in
                let assignedProviderID = selectedMilestoneProviderByKey[
                    milestoneAssignmentKey(serviceName: line.serviceName, lineID: line.id, milestoneID: milestone.id)
                ].flatMap { Int($0) }

                return ProjectCreationCreateMilestonePayload(
                    title: milestone.title,
                    description: milestone.description.trimmed.nilIfEmpty,
                    percentage: milestone.percentage,
                    amount: milestone.amount,
                    assignedProviderID: assignedProviderID
                )
            }

            return ProjectCreationCreateProjectLinePayload(
                id: line.id.nilIfEmpty ?? "line-\(index + 1)",
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                status: "pending",
                price: budgetAllocation,
                budgetAllocation: line.budgetPercentage,
                budgetPercentage: line.budgetPercentage,
                milestones: milestones,
                description: line.description
            )
        }

        let briefLinePayloads = linePayloads.map { line in
            ProjectCreationCreateBriefLinePayload(
                serviceID: line.serviceID,
                serviceName: line.serviceName,
                deliveryProvider: line.deliveryProvider,
                description: line.description,
                budgetPercentage: line.budgetPercentage,
                milestones: line.milestones
            )
        }

        let selectedProviders = selectedProvidersPayload()

        return ProjectCreationCreatePayload(
            clientID: userID,
            title: fallbackProjectTitle(from: brief.title),
            description: brief.description.trimmed.nilIfEmpty ?? intent.trimmed,
            budget: budget,
            currency: (brief.currency.trimmed.nilIfEmpty ?? manualCurrency.trimmed.nilIfEmpty ?? "USD").uppercased(),
            paymentPlan: paymentPlan,
            duration: duration,
            brief: ProjectCreationCreateBriefPayload(
                title: brief.title,
                projectLines: briefLinePayloads,
                duration: duration.nilIfEmpty,
                recommendedDuration: duration.nilIfEmpty,
                projectDuration: duration.nilIfEmpty,
                paymentPlan: paymentPlan.nilIfEmpty,
                selectedProviders: selectedProviders
            ),
            projectLines: linePayloads
        )
    }

    private func selectedProvidersPayload() -> [ProjectCreationSelectedProviderPayload] {
        var payload: [ProjectCreationSelectedProviderPayload] = []
        var seen = Set<String>()

        for (serviceName, providers) in recommendedProviders {
            let selected = selectedProvidersByService[serviceKey(serviceName)] ?? []
            for provider in providers where selected.contains(provider.id) {
                if seen.contains(provider.id) {
                    continue
                }
                seen.insert(provider.id)

                payload.append(
                    ProjectCreationSelectedProviderPayload(
                        id: Int(provider.id) ?? 0,
                        firstName: provider.firstName.nilIfEmpty,
                        lastName: provider.lastName.nilIfEmpty,
                        avatar: provider.avatarURL?.nilIfEmpty,
                        matchScore: provider.matchScore,
                        serviceName: provider.serviceName ?? serviceName
                    )
                )
            }
        }

        return payload.filter { $0.id > 0 }
    }

    private func fallbackProjectTitle(from source: String) -> String {
        let value = source.trimmed
        guard !value.isEmpty else { return "Modular Project" }
        if value.count <= 80 { return value }
        return "\(value.prefix(77))..."
    }

    private func parseNumber(_ value: String) -> Double? {
        let normalized = value.replacingOccurrences(of: ",", with: ".").trimmed
        guard !normalized.isEmpty else { return nil }
        return Double(normalized)
    }

    private func serviceKey(_ value: String) -> String {
        value.trimmed.lowercased()
    }

    private func milestoneAssignmentKey(serviceName: String, lineID: String, milestoneID: String) -> String {
        "\(serviceKey(serviceName))::\(lineID)::\(milestoneID)"
    }

    private func providerLabel(for deliveryProvider: String) -> String {
        switch deliveryProvider.lowercased() {
        case "github":
            return "GitHub"
        case "figma":
            return "Figma"
        case "google_drive":
            return "Google Drive"
        case "google_analytics":
            return "Google Analytics"
        default:
            return "Manual Upload"
        }
    }

    private func oauthProvider(for deliveryProvider: String) -> ProjectCreationOAuthProvider? {
        switch deliveryProvider.lowercased() {
        case "github":
            return .github
        case "figma":
            return .figma
        case "google_drive", "google_analytics":
            return .google
        default:
            return nil
        }
    }
}

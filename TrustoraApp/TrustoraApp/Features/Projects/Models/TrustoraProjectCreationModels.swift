import Foundation

enum ProjectCreationMode: String, CaseIterable, Identifiable {
    case ai
    case manual

    var id: String { rawValue }
}

enum ProjectCreationWizardStep: String, CaseIterable, Identifiable {
    case intent
    case recommendation
    case briefing
    case providers
    case connections
    case review

    var id: String { rawValue }
}

enum ProjectCreationOAuthProvider: String, CaseIterable, Identifiable {
    case github
    case figma
    case google

    var id: String { rawValue }
}

struct ProjectCreationServiceOption: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let categoryName: String
    let categoryID: String?
    let subcategoryName: String?
    let deliveryProvider: String
}

struct ProjectCreationServicesPage: Equatable {
    let services: [ProjectCreationServiceOption]
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
    let hasMore: Bool
}

struct ProjectCreationServiceRecommendation: Identifiable, Equatable {
    let id: String
    let serviceID: String?
    let serviceName: String
    let deliveryProvider: String
    let description: String
    let categoryName: String?
    let isAlternative: Bool
}

struct ProjectCreationProviderCandidate: Identifiable, Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let avatarURL: String?
    let matchScore: Double?
    let serviceName: String?

    var displayName: String {
        let full = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return full.isEmpty ? "Provider" : full
    }
}

struct ProjectCreationProviderServiceInput: Equatable {
    let id: String?
    let name: String
}

struct ProjectCreationAIMessage: Equatable {
    let role: String
    let content: String
}

struct ProjectCreationMilestoneDraft: Identifiable, Equatable {
    let id: String
    var title: String
    var description: String
    var percentage: String
    var amount: String
}

struct ProjectCreationLineDraft: Identifiable, Equatable {
    let id: String
    var serviceID: String
    var serviceName: String
    var deliveryProvider: String
    var description: String
    var budgetPercentage: String
    var milestones: [ProjectCreationMilestoneDraft]
}

struct ProjectCreationBriefMilestone: Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let percentage: Double?
    let amount: Double
    let assignedProviderID: String?
}

struct ProjectCreationBriefLine: Identifiable, Equatable {
    let id: String
    let serviceID: String?
    let serviceName: String
    let deliveryProvider: String
    let description: String
    let budgetPercentage: Double
    let milestones: [ProjectCreationBriefMilestone]
}

struct ProjectCreationBrief: Equatable {
    let title: String
    let description: String
    let lines: [ProjectCreationBriefLine]
    let technologies: [String]
    let specificRequirements: [String]
    let duration: String
    let paymentPlan: String
    let currency: String
}

enum ProjectCreationAIStatus: String {
    case processing = "PROCESSING"
    case clarify = "CLARIFY"
    case final = "FINAL"
}

struct ProjectCreationAIBriefResponse: Equatable {
    let status: ProjectCreationAIStatus
    let briefResultID: String?
    let questions: [String]
    let finalBrief: ProjectCreationBrief?
    let recommendedProviders: [String: [ProjectCreationProviderCandidate]]
}

struct ProjectCreationCreateMilestonePayload: Encodable {
    let title: String
    let description: String?
    let percentage: Double?
    let amount: Double
    let assignedProviderID: Int?

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case percentage
        case amount
        case assignedProviderID = "assigned_provider_id"
    }
}

struct ProjectCreationCreateBriefLinePayload: Encodable {
    let serviceID: String?
    let serviceName: String
    let deliveryProvider: String
    let description: String
    let budgetPercentage: Double
    let milestones: [ProjectCreationCreateMilestonePayload]

    enum CodingKeys: String, CodingKey {
        case serviceID = "service_id"
        case serviceName = "service_name"
        case deliveryProvider = "delivery_provider"
        case description
        case budgetPercentage = "budget_percentage"
        case milestones
    }
}

struct ProjectCreationCreateProjectLinePayload: Encodable {
    let id: String
    let serviceID: String?
    let serviceName: String
    let deliveryProvider: String
    let status: String
    let price: Double
    let budgetAllocation: Double
    let budgetPercentage: Double
    let milestones: [ProjectCreationCreateMilestonePayload]
    let description: String

    enum CodingKeys: String, CodingKey {
        case id
        case serviceID = "service_id"
        case serviceName = "service_name"
        case deliveryProvider = "delivery_provider"
        case status
        case price
        case budgetAllocation = "budget_allocation"
        case budgetPercentage = "budget_percentage"
        case milestones
        case description
    }
}

struct ProjectCreationCreateBriefPayload: Encodable {
    let title: String
    let projectLines: [ProjectCreationCreateBriefLinePayload]
    let duration: String?
    let recommendedDuration: String?
    let projectDuration: String?
    let paymentPlan: String?
    let selectedProviders: [ProjectCreationSelectedProviderPayload]

    enum CodingKeys: String, CodingKey {
        case title
        case projectLines = "project_lines"
        case duration
        case recommendedDuration = "recommended_duration"
        case projectDuration = "project_duration"
        case paymentPlan = "payment_plan"
        case selectedProviders = "selected_providers"
    }
}

struct ProjectCreationSelectedProviderPayload: Encodable, Equatable {
    let id: Int
    let firstName: String?
    let lastName: String?
    let avatar: String?
    let matchScore: Double?
    let serviceName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case firstName
        case lastName
        case avatar
        case matchScore
        case serviceName = "service_name"
    }
}

struct ProjectCreationCreatePayload: Encodable {
    let clientID: String?
    let title: String
    let description: String
    let budget: Double
    let currency: String?
    let paymentPlan: String?
    let duration: String?
    let brief: ProjectCreationCreateBriefPayload
    let projectLines: [ProjectCreationCreateProjectLinePayload]

    enum CodingKeys: String, CodingKey {
        case clientID = "clientId"
        case title
        case description
        case budget
        case currency
        case paymentPlan
        case duration
        case brief
        case projectLines = "project_lines"
    }
}

extension ProjectCreationMode {
    var supportsRecommendation: Bool {
        self == .ai
    }

    var wizardSteps: [ProjectCreationWizardStep] {
        switch self {
        case .ai:
            return [.intent, .recommendation, .briefing, .providers, .connections, .review]
        case .manual:
            return [.intent, .providers, .connections, .review]
        }
    }
}

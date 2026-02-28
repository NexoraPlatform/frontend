import Foundation

struct PublicProjectsQuery {
    var page: Int?
    var search: String?
    var category: String?
    var technologies: [String] = []
    var budgetMin: Double?
    var budgetMax: Double?
}

struct ProjectBudgetResponse: Decodable {
    let amount: Double?
    let currency: String
    let originalUSD: Double?

    enum CodingKeys: String, CodingKey {
        case amount
        case currency
        case originalUSD = "original_usd"
    }
}

struct PublicProjectResponse: Decodable {
    let id: String
    let title: String
    let description: String
    let category: String
    let technologies: [String]
    let budget: ProjectBudgetResponse
    let budgetMin: Double?
    let budgetMax: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case category
        case technologies
        case budget
        case budgetMin = "budget_min"
        case budgetMax = "budget_max"
    }
}

struct MarketplaceCategory: Identifiable, Equatable {
    let id: String
    let name: String
}

struct MarketplaceServiceProvider: Identifiable, Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let avatarURL: String?
    let rating: Double?

    var displayName: String {
        let fullName = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return fullName.isEmpty ? "Provider" : fullName
    }
}

struct MarketplaceService: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let categoryName: String
    let isFeatured: Bool
    let technologies: [String]
    let providers: [MarketplaceServiceProvider]
}

struct MarketplaceServicesPage {
    let services: [MarketplaceService]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}

struct DashboardCompanySearchResult: Identifiable {
    let id: String
    let name: String
    let taxID: String?
    let tradeRegistryNumber: String?
    let companyCountry: String?
    let companyCity: String?
    let companyZip: String?
    let companyAddress: String?

    init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name = DashboardJSON.string(json["name"]) ?? ""
        taxID = DashboardJSON.string(json["tax_id"])
        tradeRegistryNumber = DashboardJSON.string(json["trade_registry_number"])
        companyCountry = DashboardJSON.string(json["company_country"])
        companyCity = DashboardJSON.string(json["company_city"])
        companyZip = DashboardJSON.string(json["company_zip"])
        companyAddress = DashboardJSON.string(json["company_address"])
    }
}

struct DashboardCurrencyOption: Identifiable, Equatable {
    var id: String { code.uppercased() }

    let code: String
    let name: String
    let countryCode: String?

    init(json: [String: Any]) {
        let rawCode = DashboardJSON.string(json["code"])
            ?? DashboardJSON.string(json["currency"])
            ?? DashboardJSON.string(json["id"])
            ?? ""
        code = rawCode.uppercased()
        name = DashboardJSON.string(json["name"]) ?? code
        countryCode = DashboardJSON.string(json["country_code"])
    }
}

struct DashboardCompanyUser: Identifiable, Equatable {
    let id: String
    let userID: String?
    let firstName: String?
    let lastName: String?
    let email: String?
    let avatar: String?

    var displayName: String {
        let fullName = "\(firstName ?? "") \(lastName ?? "")"
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !fullName.isEmpty {
            return fullName
        }
        if let email, !email.isEmpty {
            return email
        }
        if let userID, !userID.isEmpty {
            return "User \(userID)"
        }
        return "User"
    }

    var normalizedEmail: String? {
        email?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased().nilIfEmpty
    }

    init(json: [String: Any]) {
        let rawUserID = DashboardJSON.string(json["id"]) ?? DashboardJSON.string(json["user_id"])
        let rawEmail = DashboardJSON.string(json["email"])
        let normalizedEmail = rawEmail?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased().nilIfEmpty

        userID = rawUserID
        firstName = DashboardJSON.string(json["firstName"]) ?? DashboardJSON.string(json["first_name"])
        lastName = DashboardJSON.string(json["lastName"]) ?? DashboardJSON.string(json["last_name"])
        email = rawEmail
        avatar = DashboardJSON.string(json["avatar"])
        id = normalizedEmail ?? rawUserID ?? UUID().uuidString
    }

    init(emailOnly: String) {
        let normalizedEmail = emailOnly.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        id = normalizedEmail
        userID = nil
        firstName = nil
        lastName = nil
        email = normalizedEmail
        avatar = nil
    }
}

struct DashboardCompanyDetailsPayload {
    var companyID: String?
    var name: String
    var representedBy: String
    var email: String
    var companyAddress: String
    var companyCity: String
    var companyCounty: String
    var companyZip: String
    var companyCountry: String
    var companyBankIBAN: String
    var companyBankName: String
    var companyBankBIC: String
    var idType: String
    var idNumber: String
    var bankCurrency: String

    func requestBody() throws -> Data {
        var payload: [String: Any] = [
            "name": name,
            "represented_by": representedBy,
            "email": email,
            "company_address": companyAddress,
            "company_city": companyCity,
            "company_county": companyCounty,
            "company_zip": companyZip,
            "company_country": companyCountry,
            "company_bank_iban": companyBankIBAN,
            "company_bank_name": companyBankName,
            "company_bank_bic": companyBankBIC,
            "id_type": idType,
            "id_number": idNumber,
            "bank_currency": bankCurrency,
        ]
        if let companyID, !companyID.isEmpty {
            payload["company_id"] = companyID
        }
        return try JSONSerialization.data(withJSONObject: payload, options: [])
    }
}

struct RapydCheckoutPayload: Encodable {
    let currency: String
    let country: String
}

struct RapydPayoutPayload: Encodable {
    let amount: Decimal
    let currency: String?
}

enum JSONValue: Decodable {
    case string(String)
    case number(Double)
    case object([String: JSONValue])
    case array([JSONValue])
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.typeMismatch(
                JSONValue.self,
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unsupported JSON type")
            )
        }
    }
}

struct GenericApiResponse: Decodable {
    let success: Bool?
    let status: String?
    let message: String?
    let data: JSONValue?
}

struct DashboardStatsEntry {
    let value: Double
    let change: Double
    let changeType: String

    init(json: [String: Any]) {
        value = DashboardJSON.double(json["value"]) ?? 0
        change = DashboardJSON.double(json["change"]) ?? 0
        changeType = DashboardJSON.string(json["change_type"]) ?? "neutral"
    }
}

struct DashboardMoneyStatsEntry {
    let value: Double
    let change: Double
    let changeType: String
    let currency: String
    let changePercentage: Double

    init(json: [String: Any]) {
        value = DashboardJSON.double(json["value"]) ?? 0
        change = DashboardJSON.double(json["change"]) ?? 0
        changeType = DashboardJSON.string(json["change_type"]) ?? "neutral"
        currency = DashboardJSON.string(json["currency"]) ?? "USD"
        changePercentage = DashboardJSON.double(json["change_percentage"]) ?? 0
    }
}

struct ProviderDashboardStats {
    let activeProjects: DashboardStatsEntry
    let monthlyRevenue: DashboardMoneyStatsEntry
    let averageRating: DashboardStatsEntry
    let newRequests: DashboardStatsEntry

    init(json: [String: Any]) {
        activeProjects = DashboardStatsEntry(json: DashboardJSON.dictionary(json["active_projects"]) ?? [:])
        monthlyRevenue = DashboardMoneyStatsEntry(json: DashboardJSON.dictionary(json["monthly_revenue"]) ?? [:])
        averageRating = DashboardStatsEntry(json: DashboardJSON.dictionary(json["average_rating"]) ?? [:])
        newRequests = DashboardStatsEntry(json: DashboardJSON.dictionary(json["new_requests"]) ?? [:])
    }
}

struct ClientDashboardStats {
    let projectsPosted: DashboardStatsEntry
    let budgetSpent: DashboardMoneyStatsEntry
    let projectsCompleted: DashboardStatsEntry
    let activeProviders: DashboardStatsEntry

    init(json: [String: Any]) {
        projectsPosted = DashboardStatsEntry(json: DashboardJSON.dictionary(json["projects_posted"]) ?? [:])
        budgetSpent = DashboardMoneyStatsEntry(json: DashboardJSON.dictionary(json["budget_spent"]) ?? [:])
        projectsCompleted = DashboardStatsEntry(json: DashboardJSON.dictionary(json["projects_completed"]) ?? [:])
        activeProviders = DashboardStatsEntry(json: DashboardJSON.dictionary(json["active_providers"]) ?? [:])
    }
}

struct DashboardStatsResponse {
    let role: String
    let providerStats: ProviderDashboardStats?
    let clientStats: ClientDashboardStats?

    init(json: [String: Any]) {
        let parsedRole = (DashboardJSON.string(json["role"]) ?? "").lowercased()
        let stats = DashboardJSON.dictionary(json["stats"]) ?? [:]

        if parsedRole == "provider" {
            role = "provider"
            providerStats = ProviderDashboardStats(json: stats)
            clientStats = nil
        } else {
            role = "client"
            providerStats = nil
            clientStats = ClientDashboardStats(json: stats)
        }
    }
}

struct DashboardRecentActivity: Identifiable {
    let id: String
    let title: String
    let timeAgo: String
    let action: String?
    let type: String?
    let actorName: String?
    let actorRole: String?
    let createdAt: Date?

    init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        title = DashboardJSON.string(json["title"]) ?? "-"
        timeAgo = DashboardJSON.string(json["time_ago"]) ?? ""
        action = DashboardJSON.string(json["action"])
        type = DashboardJSON.string(json["type"])

        let actor = DashboardJSON.dictionary(json["actor"]) ?? [:]
        actorName = DashboardJSON.string(actor["name"])
        actorRole = DashboardJSON.string(actor["role"])
        createdAt = DashboardJSON.date(json["created_at"])
    }
}

struct DashboardProjectBudget {
    let amount: Double?
    let currency: String
    let originalUSD: Double?

    init(json: [String: Any]) {
        amount = DashboardJSON.double(json["amount"])
        currency = DashboardJSON.string(json["currency"]) ?? "USD"
        originalUSD = DashboardJSON.double(json["original_usd"])
    }
}

struct DashboardProjectMilestone: Identifiable {
    let id: String
    let title: String
    let amount: Double?
    let proposedAmount: Double?
    let percentage: Double?
    let status: String
    let budgetStatus: String
    let paymentStatus: String?
    let assignedProviderID: String?
    let serviceName: String?
    let projectLineID: String?
    let sortOrder: Int?
}

struct DashboardProjectSummary: Identifiable {
    let id: String
    let slug: String?
    let title: String
    let description: String
    let status: String
    let createdAt: Date?
    let budget: DashboardProjectBudget
    let category: String?
    let deadline: String?
    let offersCount: Int
    let milestoneCount: Int
    let providersCount: Int
    let milestones: [DashboardProjectMilestone]

    init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? DashboardJSON.string(json["project_id"]) ?? UUID().uuidString
        slug = DashboardJSON.string(json["slug"])
        title = DashboardJSON.string(json["title"]) ?? "Untitled"
        description = DashboardJSON.string(json["description"]) ?? ""
        status = (DashboardJSON.string(json["status"]) ?? "PENDING").uppercased()
        createdAt = DashboardJSON.date(json["created_at"])

        if let budgetObject = DashboardJSON.dictionary(json["budget"]) {
            budget = DashboardProjectBudget(json: budgetObject)
        } else {
            budget = DashboardProjectBudget(
                json: [
                    "amount": json["budget"] as Any,
                    "currency": DashboardJSON.string(json["currency"]) ?? "USD",
                    "original_usd": json["budget"] as Any,
                ]
            )
        }

        category = DashboardJSON.string(json["category"])
        deadline = DashboardJSON.string(json["deadline"])
        offersCount = DashboardJSON.int(json["offers_count"]) ?? 0

        milestones = Self.extractMilestones(from: json)

        if let directMilestoneCount = DashboardJSON.int(json["milestone_count"]) {
            milestoneCount = directMilestoneCount
        } else {
            milestoneCount = milestones.count
        }

        let providers = DashboardJSON.array(json["providers"]).compactMap { DashboardJSON.dictionary($0) }
        providersCount = providers.count
    }

    private static func extractMilestones(from json: [String: Any]) -> [DashboardProjectMilestone] {
        let directMilestones = DashboardJSON.array(json["project_line_milestones"])
            .compactMap { DashboardJSON.dictionary($0) }

        let lineMilestones = DashboardJSON.array(json["project_lines"])
            .compactMap { DashboardJSON.dictionary($0) }
            .flatMap { line -> [[String: Any]] in
                DashboardJSON.array(line["milestones"])
                    .compactMap { DashboardJSON.dictionary($0) }
                    .map { milestone in
                        var next = milestone
                        if next["project_line_id"] == nil {
                            next["project_line_id"] = line["id"]
                        }
                        if next["service_name"] == nil {
                            next["service_name"] = line["service_name"]
                        }
                        return next
                    }
            }

        var rootMilestones = DashboardJSON.array(json["milestones"])
            .compactMap { DashboardJSON.dictionary($0) }

        if !rootMilestones.isEmpty {
            let hasNestedMilestoneBuckets = rootMilestones.contains {
                !DashboardJSON.array($0["milestones"]).isEmpty
            }

            if hasNestedMilestoneBuckets {
                rootMilestones = rootMilestones.flatMap { bucket in
                    let providerID =
                        DashboardJSON.string(bucket["providerId"]) ??
                        DashboardJSON.string(bucket["provider_id"])

                    return DashboardJSON.array(bucket["milestones"])
                        .compactMap { DashboardJSON.dictionary($0) }
                        .map { milestone in
                            var next = milestone
                            if next["assigned_provider_id"] == nil, let providerID {
                                next["assigned_provider_id"] = providerID
                            }
                            return next
                        }
                }
            }
        }

        let sourceRows: [[String: Any]]
        if !directMilestones.isEmpty {
            sourceRows = directMilestones
        } else if !lineMilestones.isEmpty {
            sourceRows = lineMilestones
        } else {
            sourceRows = rootMilestones
        }

        var seenIDs = Set<String>()
        let mapped = sourceRows.compactMap { row -> DashboardProjectMilestone? in
            let milestoneID =
                DashboardJSON.string(row["id"]) ??
                DashboardJSON.string(row["milestone_id"]) ??
                DashboardJSON.string(row["milestoneId"]) ??
                DashboardJSON.string(row["uuid"]) ??
                UUID().uuidString

            let dedupeKey = milestoneID
            if seenIDs.contains(dedupeKey) {
                return nil
            }
            seenIDs.insert(dedupeKey)

            let normalizedStatus = (DashboardJSON.string(row["status"]) ?? "PENDING").uppercased()
            let normalizedBudgetStatus =
                (DashboardJSON.string(row["budget_status"]) ?? DashboardJSON.string(row["budgetStatus"]) ?? "PENDING")
                    .uppercased()

            let assignedProviderID =
                DashboardJSON.string(row["assigned_provider_id"]) ??
                DashboardJSON.string(row["assignedProviderId"]) ??
                DashboardJSON.string(row["provider_id"]) ??
                DashboardJSON.string(row["providerId"])

            return DashboardProjectMilestone(
                id: milestoneID,
                title: DashboardJSON.string(row["title"]) ?? "Milestone",
                amount: DashboardJSON.double(row["amount"]),
                proposedAmount: DashboardJSON.double(row["proposed_amount"]) ?? DashboardJSON.double(row["proposedAmount"]),
                percentage: DashboardJSON.double(row["percentage"]),
                status: normalizedStatus,
                budgetStatus: normalizedBudgetStatus,
                paymentStatus: DashboardJSON.string(row["payment_status"]) ?? DashboardJSON.string(row["paymentStatus"]),
                assignedProviderID: assignedProviderID,
                serviceName: DashboardJSON.string(row["service_name"]) ?? DashboardJSON.string(row["serviceName"]),
                projectLineID: DashboardJSON.string(row["project_line_id"]) ?? DashboardJSON.string(row["projectLineId"]),
                sortOrder:
                    DashboardJSON.int(row["sequence"]) ??
                    DashboardJSON.int(row["order"]) ??
                    DashboardJSON.int(row["order_index"]) ??
                    DashboardJSON.int(row["orderIndex"]) ??
                    DashboardJSON.int(row["position"])
            )
        }

        // Preserve API order exactly as received.
        return mapped
    }
}

struct DashboardWalletBalance: Identifiable {
    let id: String
    let currency: String
    let balance: Double?
    let receivedBalance: Double?
    let onHoldBalance: Double?

    init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        currency = DashboardJSON.string(json["currency"]) ?? DashboardJSON.string(json["alias"]) ?? "USD"
        balance = DashboardJSON.double(json["balance"])
        receivedBalance = DashboardJSON.double(json["received_balance"])
        onHoldBalance = DashboardJSON.double(json["on_hold_balance"])
    }
}

struct DashboardRapydOnboarding {
    let url: URL?
    let walletID: String?
    let contactID: String?

    init(json: [String: Any]) {
        let directURL = DashboardJSON.string(json["url"])
        let nestedData = DashboardJSON.dictionary(json["data"]) ?? [:]
        let nestedURL = DashboardJSON.string(nestedData["url"])

        url = URL(string: directURL ?? nestedURL ?? "")
        walletID = DashboardJSON.string(json["wallet_id"]) ?? DashboardJSON.string(nestedData["wallet_id"])
        contactID =
            DashboardJSON.string(json["rapyd_contact_id"]) ??
            DashboardJSON.string(json["contact_id"]) ??
            DashboardJSON.string(nestedData["rapyd_contact_id"]) ??
            DashboardJSON.string(nestedData["contact_id"])
    }
}

struct DashboardServiceItem: Identifiable {
    let id: String
    let title: String
    let category: String?
    let rating: Double?
    let reviewCount: Int?
    let orderCount: Int?
    let level: String?
    let priceAmount: Double?
    let currency: String?

    init(json: [String: Any], fallbackLevel: String? = nil) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        title = DashboardJSON.string(json["title"]) ?? DashboardJSON.string(json["name"]) ?? "Untitled service"

        if let categoryObject = DashboardJSON.dictionary(json["category"]) {
            category = DashboardJSON.string(categoryObject["name"])
        } else {
            category = DashboardJSON.string(json["category"])
        }

        rating = DashboardJSON.double(json["rating"])
        reviewCount = DashboardJSON.int(json["reviewCount"]) ?? DashboardJSON.int(json["reviews_count"])
        orderCount = DashboardJSON.int(json["orderCount"]) ?? DashboardJSON.int(json["orders_count"])
        level = fallbackLevel ?? DashboardJSON.string(json["level"])

        if let priceObject = DashboardJSON.dictionary(json["price"]) {
            priceAmount = DashboardJSON.double(priceObject["amount"])
            currency = DashboardJSON.string(priceObject["currency"])
        } else if let budgetObject = DashboardJSON.dictionary(json["budget"]) {
            priceAmount = DashboardJSON.double(budgetObject["amount"])
            currency = DashboardJSON.string(budgetObject["currency"])
        } else {
            priceAmount = DashboardJSON.double(json["price"]) ?? DashboardJSON.double(json["budget"])
            currency = DashboardJSON.string(json["currency"])
        }
    }
}

struct DashboardChatGroup: Identifiable {
    let id: String
    let name: String
    let type: String
    let unreadCount: Int
    let lastMessage: String?
    let updatedAt: Date?
}

struct DashboardChatMessage: Identifiable {
    let id: String
    let senderID: String
    let senderName: String
    let content: String
    let timestamp: Date?
    let isRead: Bool
}

enum TrustoraNetworkError: Error {
    case invalidURL
    case invalidResponse
    case httpError(Int, String)
}

private enum DashboardJSON {
    private static let iso8601WithFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let iso8601Basic: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static func dictionary(_ value: Any?) -> [String: Any]? {
        value as? [String: Any]
    }

    static func array(_ value: Any?) -> [Any] {
        value as? [Any] ?? []
    }

    static func string(_ value: Any?) -> String? {
        if let string = value as? String {
            let normalized = string.trimmingCharacters(in: .whitespacesAndNewlines)
            return normalized.isEmpty ? nil : normalized
        }

        if let number = value as? NSNumber {
            return number.stringValue
        }

        return nil
    }

    static func double(_ value: Any?) -> Double? {
        if let number = value as? NSNumber {
            return number.doubleValue
        }

        if let string = string(value) {
            let normalized = string.replacingOccurrences(of: ",", with: ".")
            return Double(normalized)
        }

        return nil
    }

    static func int(_ value: Any?) -> Int? {
        if let number = value as? NSNumber {
            return number.intValue
        }

        if let string = string(value) {
            return Int(string)
        }

        return nil
    }

    static func bool(_ value: Any?) -> Bool? {
        if let bool = value as? Bool {
            return bool
        }

        if let number = value as? NSNumber {
            return number.boolValue
        }

        if let string = string(value)?.lowercased() {
            switch string {
            case "1", "true", "yes":
                return true
            case "0", "false", "no":
                return false
            default:
                return nil
            }
        }

        return nil
    }

    static func date(_ value: Any?) -> Date? {
        guard let raw = string(value) else {
            return nil
        }

        if let parsed = iso8601WithFractional.date(from: raw) {
            return parsed
        }

        return iso8601Basic.date(from: raw)
    }
}

final class TrustoraAPIClient {
    static let shared = TrustoraAPIClient()

    private let baseAPIURL: URL
    private let session: URLSession

    init(
        baseAPIURL: URL = URL(string: "http://127.0.0.1:8000/api")!,
        session: URLSession = .shared
    ) {
        self.baseAPIURL = baseAPIURL
        self.session = session
    }

    func getPublicProjects(
        query: PublicProjectsQuery,
        language: String,
        currency: AppCurrency
    ) async throws -> [PublicProjectResponse] {
        var queryItems = [URLQueryItem]()
        if let page = query.page { queryItems.append(URLQueryItem(name: "page", value: String(page))) }
        if let search = query.search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }
        if let category = query.category, !category.isEmpty {
            queryItems.append(URLQueryItem(name: "category", value: category))
        }
        for technology in query.technologies where !technology.isEmpty {
            queryItems.append(URLQueryItem(name: "technologies", value: technology))
        }
        if let budgetMin = query.budgetMin {
            queryItems.append(URLQueryItem(name: "budget_min", value: String(budgetMin)))
        }
        if let budgetMax = query.budgetMax {
            queryItems.append(URLQueryItem(name: "budget_max", value: String(budgetMax)))
        }

        let request = try makeRequest(
            path: "projects",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: Optional<Data>.none,
            bearerToken: nil
        )

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)

        if let projects = try? JSONDecoder().decode([PublicProjectResponse].self, from: data) {
            return projects
        }

        if let wrapped = try? JSONDecoder().decode([String: [PublicProjectResponse]].self, from: data),
           let projects = wrapped["projects"] {
            return projects
        }

        if let wrapped = try? JSONDecoder().decode([String: [PublicProjectResponse]].self, from: data),
           let projects = wrapped["data"] {
            return projects
        }

        return []
    }

    func getMarketplaceCategories(language: String) async throws -> [MarketplaceCategory] {
        let payload = try await requestJSON(
            path: "categories",
            method: "GET",
            queryItems: [],
            language: language,
            currency: nil,
            body: nil,
            bearerToken: nil
        )

        let rows: [[String: Any]]
        if let dictionary = DashboardJSON.dictionary(payload),
           let categories = dictionary["categories"] as? [[String: Any]] {
            rows = categories
        } else if let dictionary = DashboardJSON.dictionary(payload),
                  let dataCategories = DashboardJSON.dictionary(dictionary["data"])?["categories"] as? [[String: Any]] {
            rows = dataCategories
        } else {
            rows = extractDictionaryArray(payload)
        }

        return rows.compactMap { row in
            let id = DashboardJSON.string(row["id"]) ?? UUID().uuidString
            let name = localizedString(from: row["name"], language: language)
            guard let name, !name.isEmpty else {
                return nil
            }
            return MarketplaceCategory(id: id, name: name)
        }
    }

    func getMarketplaceServices(
        categoryID: String? = nil,
        skills: [String] = [],
        page: Int = 1,
        limit: Int = 12,
        language: String,
        currency: AppCurrency
    ) async throws -> MarketplaceServicesPage {
        var queryItems = [
            URLQueryItem(name: "page", value: String(max(1, page))),
            URLQueryItem(name: "limit", value: String(max(1, limit))),
        ]

        if let categoryID, !categoryID.isEmpty, categoryID != "all" {
            queryItems.append(URLQueryItem(name: "categoryId", value: categoryID))
        }

        for skill in skills {
            let trimmed = skill.trimmed
            if !trimmed.isEmpty && trimmed.lowercased() != "all" {
                queryItems.append(URLQueryItem(name: "skills", value: trimmed))
            }
        }

        let payload = try await requestJSON(
            path: "services",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: nil
        )

        return marketplaceServicesPage(from: payload, language: language, fallbackPage: page, fallbackLimit: limit)
    }

    func getMarketplaceTechnologyOptions(
        categoryID: String,
        language: String,
        currency: AppCurrency
    ) async throws -> [String] {
        let payload = try await requestJSON(
            path: "services/category/\(categoryID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: nil
        )

        if let dictionary = DashboardJSON.dictionary(payload),
           dictionary["services"] != nil || dictionary["data"] != nil {
            let servicesPage = marketplaceServicesPage(
                from: payload,
                language: language,
                fallbackPage: 1,
                fallbackLimit: 100
            )
            return technologies(from: servicesPage.services)
        }

        if let dictionary = DashboardJSON.dictionary(payload) {
            var results: [String] = []
            for (_, value) in dictionary {
                let rows = DashboardJSON.array(value)
                for row in rows {
                    if let item = DashboardJSON.dictionary(row) {
                        if let localizedName = localizedString(from: item["name"], language: language), !localizedName.isEmpty {
                            results.append(localizedName)
                        } else if let text = DashboardJSON.string(item["name"]), !text.isEmpty {
                            results.append(text)
                        }
                    } else if let string = DashboardJSON.string(row), !string.isEmpty {
                        results.append(string)
                    }
                }
            }
            return normalizedTechnologyList(results)
        }

        let rows = extractDictionaryArray(payload)
        let services = rows.map { marketplaceService(from: $0, language: language) }
        return technologies(from: services)
    }

    func getDashboardStats(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> DashboardStatsResponse {
        let jsonObject = try await requestJSON(
            path: "dashboard/stats",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let dictionary = DashboardJSON.dictionary(jsonObject) else {
            throw TrustoraNetworkError.invalidResponse
        }

        return DashboardStatsResponse(json: dictionary)
    }

    func getRecentActivitiesQuick(
        language: String,
        bearerToken: String
    ) async throws -> [DashboardRecentActivity] {
        let jsonObject = try await requestJSON(
            path: "activities/recent",
            method: "GET",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let activityDictionaries = extractDictionaryArray(jsonObject)
        return activityDictionaries
            .map(DashboardRecentActivity.init)
            .sorted { lhs, rhs in
                switch (lhs.createdAt, rhs.createdAt) {
                case let (left?, right?):
                    return left > right
                case (.some, .none):
                    return true
                case (.none, .some):
                    return false
                default:
                    return lhs.id > rhs.id
                }
            }
    }

    func getProviderProjectRequests(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [DashboardProjectSummary] {
        try await getProjectRequests(
            path: "projects/requests",
            language: language,
            currency: currency,
            bearerToken: bearerToken
        )
    }

    func getClientProjectRequests(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [DashboardProjectSummary] {
        try await getProjectRequests(
            path: "projects/my-requests",
            language: language,
            currency: currency,
            bearerToken: bearerToken
        )
    }

    func getRapydWalletBalances(
        language: String,
        bearerToken: String
    ) async throws -> [DashboardWalletBalance] {
        let jsonObject = try await requestJSON(
            path: "rapyd/balance",
            method: "GET",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let walletDictionaries = extractDictionaryArray(jsonObject)
        return walletDictionaries
            .map(DashboardWalletBalance.init)
            .filter { !$0.id.isEmpty && !$0.currency.isEmpty }
    }

    func rapydOnboarding(
        language: String,
        bearerToken: String
    ) async throws -> DashboardRapydOnboarding {
        let jsonObject = try await requestJSON(
            path: "rapyd/onboard",
            method: "POST",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        guard let dictionary = DashboardJSON.dictionary(jsonObject) else {
            throw TrustoraNetworkError.invalidResponse
        }

        return DashboardRapydOnboarding(json: dictionary)
    }

    func createRapydCheckoutSession(
        projectId: String,
        milestoneId: String? = nil,
        payload: RapydCheckoutPayload,
        language: String,
        currency: AppCurrency
    ) async throws -> GenericApiResponse {
        let path = milestoneId.map { "rapyd/checkout/\(projectId)/\($0)" } ?? "rapyd/checkout/\(projectId)"
        let body = try JSONEncoder().encode(payload)

        let request = try makeRequest(
            path: path,
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: body,
            bearerToken: nil
        )

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(GenericApiResponse.self, from: data)
    }

    func createRapydPayoutBank(
        payload: RapydPayoutPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String? = nil
    ) async throws -> GenericApiResponse {
        let body = try JSONEncoder().encode(payload)

        let request = try makeRequest(
            path: "rapyd/payout/bank",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: body,
            bearerToken: bearerToken
        )

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(GenericApiResponse.self, from: data)
    }

    func getDashboardServices(
        providerId: String?,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [DashboardServiceItem] {
        if let providerId, !providerId.isEmpty {
            let payload = try await requestJSON(
                path: "users/providers/\(providerId)/services",
                method: "GET",
                queryItems: [],
                language: language,
                currency: currency,
                body: nil,
                bearerToken: bearerToken
            )

            let rows = extractDictionaryArray(payload)
            return rows.compactMap { row in
                if let service = DashboardJSON.dictionary(row["service"]) {
                    return DashboardServiceItem(json: service, fallbackLevel: DashboardJSON.string(row["level"]))
                }
                return DashboardServiceItem(json: row, fallbackLevel: DashboardJSON.string(row["level"]))
            }
        }

        let payload = try await requestJSON(
            path: "services/popular",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        let rows = extractDictionaryArray(payload)
        return rows.map { DashboardServiceItem(json: $0) }
    }

    func getChatGroups(
        bearerToken: String
    ) async throws -> [DashboardChatGroup] {
        let payload = try await requestJSON(
            path: "chat/groups",
            method: "GET",
            queryItems: [],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]]
        if let dictionary = DashboardJSON.dictionary(payload),
           let groups = dictionary["groups"] as? [[String: Any]] {
            rows = groups
        } else {
            rows = extractDictionaryArray(payload)
        }

        return rows
            .map { row in
                let lastMessageObject = DashboardJSON.dictionary(row["last_message"])
                let lastMessageText = chatTextValue(
                    translations: lastMessageObject?["translations"],
                    fallback: lastMessageObject?["content"]
                )

                return DashboardChatGroup(
                    id: DashboardJSON.string(row["id"]) ?? UUID().uuidString,
                    name: DashboardJSON.string(row["name"]) ?? "Conversation",
                    type: DashboardJSON.string(row["type"]) ?? "DIRECT",
                    unreadCount: DashboardJSON.int(row["unreadCount"]) ?? DashboardJSON.int(row["unread_count"]) ?? 0,
                    lastMessage: lastMessageText,
                    updatedAt: DashboardJSON.date(row["updated_at"]) ?? DashboardJSON.date(lastMessageObject?["timestamp"])
                )
            }
            .sorted { lhs, rhs in
                if lhs.unreadCount != rhs.unreadCount {
                    return lhs.unreadCount > rhs.unreadCount
                }
                return (lhs.updatedAt ?? .distantPast) > (rhs.updatedAt ?? .distantPast)
            }
    }

    func getChatMessages(
        groupId: String,
        page: Int = 1,
        limit: Int = 50,
        bearerToken: String
    ) async throws -> [DashboardChatMessage] {
        let payload = try await requestJSON(
            path: "chat/groups/\(groupId)/messages",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "limit", value: String(limit)),
            ],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]]
        if let dictionary = DashboardJSON.dictionary(payload),
           let messages = dictionary["messages"] as? [[String: Any]] {
            rows = messages
        } else {
            rows = extractDictionaryArray(payload)
        }

        return rows
            .map { row in
                let sender = DashboardJSON.dictionary(row["sender"]) ?? [:]
                let firstName = DashboardJSON.string(sender["firstName"]) ?? DashboardJSON.string(sender["first_name"]) ?? ""
                let lastName = DashboardJSON.string(sender["lastName"]) ?? DashboardJSON.string(sender["last_name"]) ?? ""
                let fullName = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)

                return DashboardChatMessage(
                    id: DashboardJSON.string(row["id"]) ?? UUID().uuidString,
                    senderID: DashboardJSON.string(row["sender_id"]) ?? DashboardJSON.string(sender["id"]) ?? "",
                    senderName: fullName.isEmpty
                        ? (DashboardJSON.string(row["senderName"]) ?? DashboardJSON.string(sender["name"]) ?? "User")
                        : fullName,
                    content: chatTextValue(translations: row["translations"], fallback: row["content"]),
                    timestamp: DashboardJSON.date(row["timestamp"]) ?? DashboardJSON.date(row["created_at"]),
                    isRead: DashboardJSON.bool(row["isRead"]) ?? DashboardJSON.bool(row["is_read"]) ?? false
                )
            }
            .sorted { ($0.timestamp ?? .distantPast) < ($1.timestamp ?? .distantPast) }
    }

    func sendChatMessage(
        groupId: String,
        content: String,
        language: String,
        bearerToken: String
    ) async throws -> DashboardChatMessage? {
        let body = try JSONSerialization.data(
            withJSONObject: [
                "content": content,
                "attachments": [],
            ]
        )

        let payload = try await requestJSON(
            path: "chat/groups/\(groupId)/messages",
            method: "POST",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(payload),
           let message = DashboardJSON.dictionary(dictionary["message"]) {
            return getChatMessagesFromRows([message]).first
        }

        if let dictionary = DashboardJSON.dictionary(payload) {
            return getChatMessagesFromRows([dictionary]).first
        }

        return nil
    }

    func markChatGroupRead(
        groupId: String,
        bearerToken: String
    ) async throws {
        let body = try JSONSerialization.data(withJSONObject: [:])
        _ = try await requestJSON(
            path: "chat/groups/\(groupId)/read",
            method: "POST",
            queryItems: [],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )
    }

    func respondToProjectRequest(
        projectId: String,
        response: String,
        language: String,
        proposedBudget: Double? = nil,
        reason: String? = nil,
        refusalScope: String? = nil,
        milestoneIDs: [String]? = nil,
        suggestionsLimit: Int? = nil,
        bearerToken: String
    ) async throws {
        var payload: [String: Any] = [
            "response": response.uppercased(),
        ]

        if let proposedBudget {
            payload["proposedBudget"] = proposedBudget
        }
        if let reason, !reason.isEmpty {
            payload["reason"] = reason
        }
        if let refusalScope, !refusalScope.isEmpty {
            payload["refusal_scope"] = refusalScope
        }
        if let milestoneIDs, !milestoneIDs.isEmpty {
            payload["milestone_ids"] = milestoneIDs
        }
        if let suggestionsLimit {
            payload["suggestions_limit"] = suggestionsLimit
        }

        let body = try JSONSerialization.data(withJSONObject: payload)

        _ = try await requestJSON(
            path: "projects/\(projectId)/respond",
            method: "POST",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )
    }

    func markProjectMilestone(
        projectId: String,
        milestoneId: String,
        status: String,
        bearerToken: String
    ) async throws -> DashboardProjectSummary? {
        let body = try JSONSerialization.data(
            withJSONObject: [
                "milestone": milestoneId,
                "status": status.lowercased(),
            ]
        )

        let payload = try await requestJSON(
            path: "projects/\(projectId)/markMilestone",
            method: "POST",
            queryItems: [],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )

        if let project = extractProjectDictionary(payload) {
            return DashboardProjectSummary(json: project)
        }

        return nil
    }

    func searchCompanies(
        query: String,
        limit: Int = 10
    ) async throws -> [DashboardCompanySearchResult] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            return []
        }

        let payload = try await requestJSON(
            path: "companies/search",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "q", value: trimmedQuery),
                URLQueryItem(name: "limit", value: String(limit)),
            ],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: nil
        )

        let rows = extractDictionaryArray(payload)
        return rows
            .map(DashboardCompanySearchResult.init)
            .filter { !$0.name.isEmpty }
    }

    func getCurrencies(search: String?) async throws -> [DashboardCurrencyOption] {
        let payload = try await requestJSON(
            path: "users/currencies",
            method: "GET",
            queryItems: search?.trimmed.nilIfEmpty != nil
                ? [URLQueryItem(name: "search", value: search?.trimmed)]
                : [],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: nil
        )

        let rows = extractDictionaryArray(payload)
        let mapped = rows
            .map(DashboardCurrencyOption.init)
            .filter { !$0.code.isEmpty }

        // Prefer stable display order when API returns noisy ordering.
        return mapped.sorted { lhs, rhs in
            lhs.code.localizedCaseInsensitiveCompare(rhs.code) == .orderedAscending
        }
    }

    func updateUserCompanyDetails(
        payload: DashboardCompanyDetailsPayload,
        bearerToken: String
    ) async throws {
        let body = try payload.requestBody()
        _ = try await requestJSON(
            path: "users/update/company",
            method: "PATCH",
            queryItems: [],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )
    }

    func getCompanyManagers(
        companyID: String,
        bearerToken: String
    ) async throws -> [DashboardCompanyUser] {
        let payload = try await requestJSON(
            path: "users/company/editors",
            method: "GET",
            queryItems: [URLQueryItem(name: "company_id", value: companyID)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]]
        if let dictionary = DashboardJSON.dictionary(payload),
           let editors = dictionary["editors"] as? [[String: Any]] {
            rows = editors
        } else if let dictionary = DashboardJSON.dictionary(payload),
                  let editorEmails = dictionary["editor_emails"] as? [String] {
            return editorEmails
                .map(DashboardCompanyUser.init(emailOnly:))
                .filter { $0.normalizedEmail != nil }
        } else {
            rows = extractDictionaryArray(payload)
        }

        return rows
            .map(DashboardCompanyUser.init)
            .uniqued { $0.id }
    }

    func searchUsersForCompany(
        search: String,
        bearerToken: String
    ) async throws -> [DashboardCompanyUser] {
        let trimmedSearch = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSearch.isEmpty else {
            return []
        }

        let payload = try await requestJSON(
            path: "users/company/search/users",
            method: "GET",
            queryItems: [URLQueryItem(name: "search", value: trimmedSearch)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows = extractDictionaryArray(payload)
        return rows
            .map(DashboardCompanyUser.init)
            .uniqued { $0.id }
    }

    func getCompanyMembers(
        companyID: String,
        bearerToken: String
    ) async throws -> [DashboardCompanyUser] {
        let payload = try await requestJSON(
            path: "users/company/members",
            method: "GET",
            queryItems: [URLQueryItem(name: "company_id", value: companyID)],
            language: nil,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]]
        if let dictionary = DashboardJSON.dictionary(payload),
           let members = dictionary["members"] as? [[String: Any]] {
            rows = members
        } else {
            rows = extractDictionaryArray(payload)
        }

        return rows
            .map(DashboardCompanyUser.init)
            .uniqued { $0.id }
    }

    func updateCompanyEditorsOrOwnership(
        companyID: String,
        editorEmails: [String]?,
        transferOwnerEmail: String?,
        bearerToken: String
    ) async throws {
        var payload: [String: Any] = [
            "company_id": companyID,
        ]

        if let editorEmails {
            payload["editor_emails"] = editorEmails
        }

        if let transferOwnerEmail, !transferOwnerEmail.isEmpty {
            payload["transfer_owner_email"] = transferOwnerEmail
        }

        let body = try JSONSerialization.data(withJSONObject: payload, options: [])

        _ = try await requestJSON(
            path: "users/company/access",
            method: "PATCH",
            queryItems: [],
            language: nil,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )
    }

    private func getProjectRequests(
        path: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [DashboardProjectSummary] {
        let jsonObject = try await requestJSON(
            path: path,
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(jsonObject),
           let success = DashboardJSON.bool(dictionary["success"]),
           success == false {
            let message = DashboardJSON.string(dictionary["message"])
                ?? DashboardJSON.string(dictionary["error"])
                ?? "Failed to load project requests."
            throw TrustoraNetworkError.httpError(422, message)
        }

        let projectDictionaries = extractProjectsCollection(jsonObject)
        return projectDictionaries.map(DashboardProjectSummary.init)
    }

    private func extractProjectDictionary(_ payload: Any) -> [String: Any]? {
        if let dictionary = DashboardJSON.dictionary(payload) {
            if dictionary["id"] != nil || dictionary["project_lines"] != nil {
                return dictionary
            }

            if let project = DashboardJSON.dictionary(dictionary["project"]) {
                return project
            }

            if let data = DashboardJSON.dictionary(dictionary["data"]) {
                if data["id"] != nil || data["project_lines"] != nil {
                    return data
                }

                if let nestedProject = DashboardJSON.dictionary(data["project"]) {
                    return nestedProject
                }
            }
        }

        return nil
    }

    private func getChatMessagesFromRows(_ rows: [[String: Any]]) -> [DashboardChatMessage] {
        rows.map { row in
            let sender = DashboardJSON.dictionary(row["sender"]) ?? [:]
            let firstName = DashboardJSON.string(sender["firstName"]) ?? DashboardJSON.string(sender["first_name"]) ?? ""
            let lastName = DashboardJSON.string(sender["lastName"]) ?? DashboardJSON.string(sender["last_name"]) ?? ""
            let fullName = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)

            return DashboardChatMessage(
                id: DashboardJSON.string(row["id"]) ?? UUID().uuidString,
                senderID: DashboardJSON.string(row["sender_id"]) ?? DashboardJSON.string(sender["id"]) ?? "",
                senderName: fullName.isEmpty
                    ? (DashboardJSON.string(row["senderName"]) ?? DashboardJSON.string(sender["name"]) ?? "User")
                    : fullName,
                content: chatTextValue(translations: row["translations"], fallback: row["content"]),
                timestamp: DashboardJSON.date(row["timestamp"]) ?? DashboardJSON.date(row["created_at"]),
                isRead: DashboardJSON.bool(row["isRead"]) ?? DashboardJSON.bool(row["is_read"]) ?? false
            )
        }
    }

    private func chatTextValue(translations: Any?, fallback: Any?) -> String {
        if let text = DashboardJSON.string(translations), !text.isEmpty {
            return text
        }

        if let dictionary = DashboardJSON.dictionary(translations) {
            let preferredLanguage = Locale.preferredLanguages.first?
                .split(separator: "-")
                .first
                .map(String.init)?
                .lowercased()

            if let preferredLanguage,
               let preferredText = DashboardJSON.string(dictionary[preferredLanguage]),
               !preferredText.isEmpty {
                return preferredText
            }

            if let englishText = DashboardJSON.string(dictionary["en"]), !englishText.isEmpty {
                return englishText
            }

            if let romanianText = DashboardJSON.string(dictionary["ro"]), !romanianText.isEmpty {
                return romanianText
            }

            for (_, value) in dictionary {
                if let firstText = DashboardJSON.string(value), !firstText.isEmpty {
                    return firstText
                }
            }
        }

        return DashboardJSON.string(fallback) ?? ""
    }

    private func extractProjectsCollection(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let projects = dictionary["projects"] as? [[String: Any]] {
            return projects
        }

        if let dataProjects = DashboardJSON.dictionary(dictionary["data"])?["projects"] as? [[String: Any]] {
            return dataProjects
        }

        if let dataList = dictionary["data"] as? [[String: Any]] {
            return dataList
        }

        if let nested = DashboardJSON.dictionary(dictionary["projects"]),
           let nestedList = nested["data"] as? [[String: Any]] {
            return nestedList
        }

        return []
    }

    private func extractDictionaryArray(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        if let dictionary = DashboardJSON.dictionary(payload) {
            if let directData = dictionary["data"] as? [[String: Any]] {
                return directData
            }

            if let nested = DashboardJSON.dictionary(dictionary["data"]),
               let nestedData = nested["data"] as? [[String: Any]] {
                return nestedData
            }

            if let single = DashboardJSON.dictionary(dictionary["data"]), !single.isEmpty {
                return [single]
            }

            if !dictionary.isEmpty {
                return [dictionary]
            }
        }

        return []
    }

    private func marketplaceServicesPage(
        from payload: Any,
        language: String,
        fallbackPage: Int,
        fallbackLimit: Int
    ) -> MarketplaceServicesPage {
        let rows = extractMarketplaceServiceRows(payload)
        let services = rows.map { marketplaceService(from: $0, language: language) }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let data = DashboardJSON.dictionary(root["data"]) ?? [:]
        let meta = DashboardJSON.dictionary(root["meta"]) ?? DashboardJSON.dictionary(data["meta"]) ?? [:]

        let total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(data["total"]) ??
            DashboardJSON.int(meta["total"]) ??
            services.count

        let resolvedPage =
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(data["page"]) ??
            DashboardJSON.int(data["current_page"]) ??
            DashboardJSON.int(meta["current_page"]) ??
            fallbackPage

        let resolvedLimit =
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(data["limit"]) ??
            DashboardJSON.int(data["per_page"]) ??
            DashboardJSON.int(meta["per_page"]) ??
            fallbackLimit

        let totalPages =
            DashboardJSON.int(root["totalPages"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(data["totalPages"]) ??
            DashboardJSON.int(data["total_pages"]) ??
            DashboardJSON.int(meta["last_page"]) ??
            max(1, Int(ceil(Double(max(total, services.count)) / Double(max(1, resolvedLimit)))))

        return MarketplaceServicesPage(
            services: services,
            total: total,
            page: resolvedPage,
            limit: resolvedLimit,
            totalPages: max(1, totalPages)
        )
    }

    private func extractMarketplaceServiceRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let services = dictionary["services"] as? [[String: Any]] {
            return services
        }

        if let dataServices = DashboardJSON.dictionary(dictionary["data"])?["services"] as? [[String: Any]] {
            return dataServices
        }

        if let nestedData = dictionary["data"] as? [[String: Any]] {
            return nestedData
        }

        if dictionary["id"] != nil {
            return [dictionary]
        }

        return []
    }

    private func marketplaceService(from row: [String: Any], language: String) -> MarketplaceService {
        let id = DashboardJSON.string(row["id"]) ?? UUID().uuidString
        let name =
            localizedString(from: row["name"], language: language) ??
            DashboardJSON.string(row["title"]) ??
            "Service"
        let description =
            localizedString(from: row["description"], language: language) ??
            DashboardJSON.string(row["description"]) ??
            ""

        let categoryName: String = {
            if let categoryObject = DashboardJSON.dictionary(row["category"]) {
                return localizedString(from: categoryObject["name"], language: language)
                    ?? DashboardJSON.string(categoryObject["name"])
                    ?? DashboardJSON.string(categoryObject["title"])
                    ?? "Other"
            }
            return localizedString(from: row["category"], language: language)
                ?? DashboardJSON.string(row["category"])
                ?? "Other"
        }()

        let tags = DashboardJSON.array(row["tags"]).compactMap { DashboardJSON.string($0) }
        let skills = DashboardJSON.array(row["skills"]).compactMap {
            localizedString(from: $0, language: language) ?? DashboardJSON.string($0)
        }
        let technologies = normalizedTechnologyList(skills + tags)

        let providers = DashboardJSON.array(row["providers"])
            .compactMap { DashboardJSON.dictionary($0) }
            .map { providerRow in
                MarketplaceServiceProvider(
                    id: DashboardJSON.string(providerRow["id"]) ?? UUID().uuidString,
                    firstName:
                        DashboardJSON.string(providerRow["firstName"]) ??
                        DashboardJSON.string(providerRow["first_name"]) ??
                        "",
                    lastName:
                        DashboardJSON.string(providerRow["lastName"]) ??
                        DashboardJSON.string(providerRow["last_name"]) ??
                        "",
                    avatarURL:
                        DashboardJSON.string(providerRow["avatar"]) ??
                        DashboardJSON.string(providerRow["profile_photo_url"]),
                    rating: DashboardJSON.double(providerRow["rating"])
                )
            }

        return MarketplaceService(
            id: id,
            name: name,
            description: description,
            categoryName: categoryName,
            isFeatured: DashboardJSON.bool(row["isFeatured"]) ?? DashboardJSON.bool(row["is_featured"]) ?? false,
            technologies: technologies,
            providers: providers
        )
    }

    private func technologies(from services: [MarketplaceService]) -> [String] {
        let collected = services.flatMap { service in
            [service.name] + service.technologies
        }
        return normalizedTechnologyList(collected)
    }

    private func normalizedTechnologyList(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var result: [String] = []

        for value in values {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { continue }

            let key = trimmed.lowercased()
            if seen.insert(key).inserted {
                result.append(trimmed)
            }
        }

        return result.sorted {
            $0.localizedCaseInsensitiveCompare($1) == .orderedAscending
        }
    }

    private func localizedString(from value: Any?, language: String) -> String? {
        if let direct = DashboardJSON.string(value), !direct.isEmpty {
            return direct
        }

        guard let dictionary = DashboardJSON.dictionary(value) else {
            return nil
        }

        if let exact = DashboardJSON.string(dictionary[language]), !exact.isEmpty {
            return exact
        }

        if let english = DashboardJSON.string(dictionary["en"]), !english.isEmpty {
            return english
        }

        if let romanian = DashboardJSON.string(dictionary["ro"]), !romanian.isEmpty {
            return romanian
        }

        for (_, nestedValue) in dictionary {
            if let first = DashboardJSON.string(nestedValue), !first.isEmpty {
                return first
            }
        }

        return nil
    }

    private func requestJSON(
        path: String,
        method: String,
        queryItems: [URLQueryItem],
        language: String?,
        currency: AppCurrency?,
        body: Data?,
        bearerToken: String?
    ) async throws -> Any {
        let request = try makeRequest(
            path: path,
            method: method,
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: body,
            bearerToken: bearerToken
        )

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)

        if data.isEmpty {
            return [:]
        }

        return (try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])) ?? [:]
    }

    private func makeRequest(
        path: String,
        method: String,
        queryItems: [URLQueryItem],
        language: String?,
        currency: AppCurrency?,
        body: Data?,
        bearerToken: String?
    ) throws -> URLRequest {
        guard var components = URLComponents(
            url: baseAPIURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        ) else {
            throw TrustoraNetworkError.invalidURL
        }

        var items = queryItems
        if let language {
            items.append(URLQueryItem(name: "language", value: language))
        }
        if let currency {
            items.append(URLQueryItem(name: "currency", value: currency.rawValue))
        }
        components.queryItems = items.isEmpty ? nil : items

        guard let url = components.url else {
            throw TrustoraNetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        if let bearerToken, !bearerToken.isEmpty {
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw TrustoraNetworkError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let payload = String(data: data, encoding: .utf8) ?? "Unknown API error"
            throw TrustoraNetworkError.httpError(httpResponse.statusCode, payload)
        }
    }
}

private extension Array {
    func uniqued<Key: Hashable>(by keySelector: (Element) -> Key) -> [Element] {
        var seen = Set<Key>()
        var result: [Element] = []
        result.reserveCapacity(count)

        for element in self {
            let key = keySelector(element)
            if seen.insert(key).inserted {
                result.append(element)
            }
        }

        return result
    }
}

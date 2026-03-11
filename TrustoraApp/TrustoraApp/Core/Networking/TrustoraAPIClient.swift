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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

struct AdminDashboardStats {
    let totalUsers: Int
    let currentMonthUsers: Int
    let currentMonthVsLastMonthUsers: Double

    let activeServices: Int
    let currentMonthServices: Int
    let currentMonthVsLastMonthServices: Double

    let totalProjects: Int
    let currentMonthProjects: Int
    let totalPendingProjects: Int
    let currentMonthVsLastMonthProjects: Double

    let totalRevenue: Double
    let currentMonthRevenue: Double
    let currentMonthVsLastMonthRevenue: Double

    let pendingUsers: Int
    let pendingServices: Int
    let pendingCalls: Int
    let totalScheduleCalls: Int

    nonisolated init(json: [String: Any]) {
        totalUsers = DashboardJSON.int(json["totalUsers"]) ?? DashboardJSON.int(json["total_users"]) ?? 0
        currentMonthUsers = DashboardJSON.int(json["currentMonthUsers"]) ?? DashboardJSON.int(json["current_month_users"]) ?? 0
        currentMonthVsLastMonthUsers = DashboardJSON.double(json["currentMonthVsLastMonthUsers"]) ?? DashboardJSON.double(json["current_month_vs_last_month_users"]) ?? 0

        activeServices = DashboardJSON.int(json["activeServices"]) ?? DashboardJSON.int(json["active_services"]) ?? 0
        currentMonthServices = DashboardJSON.int(json["currentMonthServices"]) ?? DashboardJSON.int(json["current_month_services"]) ?? 0
        currentMonthVsLastMonthServices = DashboardJSON.double(json["currentMonthVsLastMonthServices"]) ?? DashboardJSON.double(json["current_month_vs_last_month_services"]) ?? 0

        totalProjects = DashboardJSON.int(json["totalProjects"]) ?? DashboardJSON.int(json["total_projects"]) ?? 0
        currentMonthProjects = DashboardJSON.int(json["currentMonthProjects"]) ?? DashboardJSON.int(json["current_month_projects"]) ?? 0
        totalPendingProjects = DashboardJSON.int(json["totalPendingProjects"]) ?? DashboardJSON.int(json["total_pending_projects"]) ?? 0
        currentMonthVsLastMonthProjects = DashboardJSON.double(json["currentMonthVsLastMonthProjects"]) ?? DashboardJSON.double(json["current_month_vs_last_month_projects"]) ?? 0

        totalRevenue = DashboardJSON.double(json["totalRevenue"]) ?? DashboardJSON.double(json["total_revenue"]) ?? 0
        currentMonthRevenue = DashboardJSON.double(json["currentMonthRevenue"]) ?? DashboardJSON.double(json["current_month_revenue"]) ?? 0
        currentMonthVsLastMonthRevenue = DashboardJSON.double(json["currentMonthVsLastMonthRevenue"]) ?? DashboardJSON.double(json["current_month_vs_last_month_revenue"]) ?? 0

        pendingUsers = DashboardJSON.int(json["pendingUsers"]) ?? DashboardJSON.int(json["pending_users"]) ?? 0
        pendingServices = DashboardJSON.int(json["pendingServices"]) ?? DashboardJSON.int(json["pending_services"]) ?? 0
        pendingCalls = DashboardJSON.int(json["pendingCalls"]) ?? DashboardJSON.int(json["pending_calls"]) ?? 0
        totalScheduleCalls = DashboardJSON.int(json["totalScheduleCalls"]) ?? DashboardJSON.int(json["total_schedule_calls"]) ?? 0
    }
}

struct AdminUserListItem: Identifiable, Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let avatarURL: String?
    let role: String
    let roles: [String]
    let status: String
    let isSuperuser: Bool
    let isVerified: Bool
    let rating: Double
    let reviewCount: Int
    let createdAt: Date?
    let profileURL: String?

    var displayName: String {
        let full = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return full.isEmpty ? email : full
    }

    var initials: String {
        let first = firstName.first.map { String($0).uppercased() } ?? ""
        let last = lastName.first.map { String($0).uppercased() } ?? ""
        let combined = (first + last).trimmingCharacters(in: .whitespacesAndNewlines)
        return combined.isEmpty ? "U" : combined
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        firstName = DashboardJSON.string(json["firstName"]) ?? DashboardJSON.string(json["first_name"]) ?? ""
        lastName = DashboardJSON.string(json["lastName"]) ?? DashboardJSON.string(json["last_name"]) ?? ""
        email = DashboardJSON.string(json["email"]) ?? ""
        phone = DashboardJSON.string(json["phone"])
        avatarURL = DashboardJSON.string(json["avatar"]) ?? DashboardJSON.string(json["profile_photo_url"])
        status = (DashboardJSON.string(json["status"]) ?? "ACTIVE").uppercased()
        isSuperuser = DashboardJSON.bool(json["is_superuser"]) ?? false

        let explicitVerified = DashboardJSON.bool(json["isVerified"]) ?? DashboardJSON.bool(json["is_verified"])
        let testVerified = DashboardJSON.bool(json["testVerified"]) ?? DashboardJSON.bool(json["test_verified"]) ?? false
        let callVerified = DashboardJSON.bool(json["callVerified"]) ?? DashboardJSON.bool(json["call_verified"]) ?? false
        isVerified = explicitVerified ?? (testVerified && callVerified)

        rating = DashboardJSON.double(json["rating"]) ?? 0
        reviewCount = DashboardJSON.int(json["reviewCount"]) ?? DashboardJSON.int(json["review_count"]) ?? 0
        createdAt = DashboardJSON.date(json["created_at"])
        profileURL = DashboardJSON.string(json["profile_url"])

        let objectRoles = DashboardJSON.array(json["roles"])
            .compactMap { DashboardJSON.dictionary($0) }
            .compactMap { role in
                DashboardJSON.string(role["slug"]) ?? DashboardJSON.string(role["name"])
            }
            .map { $0.uppercased() }
        let stringRoles = DashboardJSON.array(json["roles"])
            .compactMap { DashboardJSON.string($0) }
            .map { $0.uppercased() }
        let rootRole = DashboardJSON.string(json["role"])?.uppercased()

        var seen = Set<String>()
        var parsedRoles: [String] = []
        for roleValue in objectRoles + stringRoles + [rootRole].compactMap({ $0 }) {
            if seen.insert(roleValue).inserted {
                parsedRoles.append(roleValue)
            }
        }
        roles = parsedRoles
        role = rootRole ?? parsedRoles.first ?? "CLIENT"
    }

    func hasRole(_ roleSlug: String) -> Bool {
        let normalized = roleSlug.uppercased()
        return roles.contains(normalized) || role == normalized
    }
}

struct AdminUsersCollection {
    let users: [AdminUserListItem]
    let total: Int
    let page: Int?
    let perPage: Int?
    let lastPage: Int?

    init(payload: Any) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map(AdminUserListItem.init)
            users = parsed
            total = parsed.count
            page = nil
            perPage = nil
            lastPage = nil
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])

        let rows: [[String: Any]] = {
            if let directUsers = root["users"] as? [[String: Any]] {
                return directUsers
            }
            if let dataUsers = dataObject?["users"] as? [[String: Any]] {
                return dataUsers
            }
            if let directData = root["data"] as? [[String: Any]] {
                return directData
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject {
                if dataObject["id"] != nil {
                    return [dataObject]
                }
            }
            return []
        }()

        let parsedUsers = rows.map(AdminUserListItem.init)
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])
        users = parsedUsers
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsedUsers.count
        page =
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"])
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"])
        perPage = resolvedPerPage
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else if let resolvedPerPage, resolvedPerPage > 0 {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(resolvedPerPage))))
        } else {
            lastPage = nil
        }
    }
}

struct AdminCreateUserPayload: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let password: String
    let role: String
    let phone: String?
}

struct AdminServiceSummary: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let status: String
    let isFeatured: Bool
    let slug: String
    let categoryID: String?
    let categoryName: String
    let categorySlug: String?
    let rating: Double
    let reviewCount: Int
    let orderCount: Int
    let viewCount: Int

    nonisolated init(json: [String: Any], language: String) {
        func localized(_ value: Any?) -> String? {
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

        let categoryObject = DashboardJSON.dictionary(json["category"])

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name =
            localized(json["name"]) ??
            localized(json["title"]) ??
            DashboardJSON.string(json["name"]) ??
            DashboardJSON.string(json["title"]) ??
            "Service"
        description =
            localized(json["description"]) ??
            DashboardJSON.string(json["description"]) ??
            ""
        status = (DashboardJSON.string(json["status"]) ?? "DRAFT").uppercased()
        isFeatured = DashboardJSON.bool(json["isFeatured"]) ?? DashboardJSON.bool(json["is_featured"]) ?? false
        slug = DashboardJSON.string(json["slug"]) ?? ""
        categoryID =
            DashboardJSON.string(json["category_id"]) ??
            DashboardJSON.string(categoryObject?["id"])
        categoryName =
            localized(categoryObject?["name"]) ??
            DashboardJSON.string(categoryObject?["name"]) ??
            localized(json["category_name"]) ??
            DashboardJSON.string(json["category_name"]) ??
            "-"
        categorySlug =
            DashboardJSON.string(categoryObject?["slug"]) ??
            DashboardJSON.string(json["category_slug"])
        rating = DashboardJSON.double(json["rating"]) ?? 0
        reviewCount = DashboardJSON.int(json["reviewCount"]) ?? DashboardJSON.int(json["review_count"]) ?? 0
        orderCount = DashboardJSON.int(json["orderCount"]) ?? DashboardJSON.int(json["order_count"]) ?? 0
        viewCount = DashboardJSON.int(json["viewCount"]) ?? DashboardJSON.int(json["view_count"]) ?? 0
    }
}

struct AdminServicesCollection {
    let services: [AdminServiceSummary]
    let total: Int
    let currentPage: Int
    let perPage: Int
    let lastPage: Int

    init(payload: Any, language: String) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map { AdminServiceSummary(json: $0, language: language) }
            services = parsed
            total = parsed.count
            currentPage = 1
            perPage = max(1, parsed.count)
            lastPage = 1
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let directServices = root["services"] as? [[String: Any]] {
                return directServices
            }
            if let dataServices = dataObject?["services"] as? [[String: Any]] {
                return dataServices
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map { AdminServiceSummary(json: $0, language: language) }
        services = parsed
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count
        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
        perPage = max(1, resolvedPerPage)
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(dataObject?["total_pages"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, perPage)))))
        }
    }
}

struct AdminServiceDetail {
    let id: String
    let name: String
    let slug: String
    let description: String
    let requirements: String
    let categoryID: String
    let categorySlug: String?
    let deliveryProvider: String
    let skills: [String]
    let tags: [String]
    let status: String

    nonisolated init(json: [String: Any], language: String) {
        func localized(_ value: Any?) -> String? {
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

        func arrayStrings(_ value: Any?) -> [String] {
            if let text = DashboardJSON.string(value), !text.isEmpty {
                return text
                    .split(separator: ",")
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    .filter { !$0.isEmpty }
            }

            return DashboardJSON.array(value).compactMap { item in
                if let direct = DashboardJSON.string(item), !direct.isEmpty {
                    return direct
                }
                if let dictionary = DashboardJSON.dictionary(item) {
                    return
                        DashboardJSON.string(dictionary["name"]) ??
                        DashboardJSON.string(dictionary["title"]) ??
                        DashboardJSON.string(dictionary["value"]) ??
                        DashboardJSON.string(dictionary["label"])
                }
                return nil
            }
        }

        let categoryObject = DashboardJSON.dictionary(json["category"])

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name =
            localized(json["name"]) ??
            localized(json["title"]) ??
            DashboardJSON.string(json["name"]) ??
            DashboardJSON.string(json["title"]) ??
            ""
        slug = DashboardJSON.string(json["slug"]) ?? ""
        description = localized(json["description"]) ?? DashboardJSON.string(json["description"]) ?? ""
        requirements = localized(json["requirements"]) ?? DashboardJSON.string(json["requirements"]) ?? ""
        categoryID =
            DashboardJSON.string(json["category_id"]) ??
            DashboardJSON.string(categoryObject?["id"]) ??
            ""
        categorySlug =
            DashboardJSON.string(categoryObject?["slug"]) ??
            DashboardJSON.string(json["category_slug"])
        deliveryProvider =
            DashboardJSON.string(json["delivery_provider"]) ??
            DashboardJSON.string(json["deliveryProvider"]) ??
            ""
        skills = arrayStrings(json["skills"])
        tags = arrayStrings(json["tags"])
        status = (DashboardJSON.string(json["status"]) ?? "DRAFT").uppercased()
    }
}

struct AdminServiceCategoryOption: Identifiable, Equatable {
    let id: String
    let name: String
    let parentID: String?
    let slug: String?

    nonisolated init(json: [String: Any], language: String) {
        func localized(_ value: Any?) -> String? {
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

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name =
            localized(json["name"]) ??
            DashboardJSON.string(json["name"]) ??
            DashboardJSON.string(json["title"]) ??
            "Category"
        parentID =
            DashboardJSON.string(json["parent_id"]) ??
            DashboardJSON.string(json["parentID"])
        slug = DashboardJSON.string(json["slug"])
    }
}

struct AdminDeliveryProviderOption: Identifiable, Equatable {
    let id: String
    let value: String
    let label: String

    init(value: String, label: String) {
        self.id = value
        self.value = value
        self.label = label
    }

    init?(json: [String: Any]) {
        let resolvedValue =
            DashboardJSON.string(json["value"]) ??
            DashboardJSON.string(json["id"]) ??
            DashboardJSON.string(json["key"])
        let resolvedLabel =
            DashboardJSON.string(json["label"]) ??
            DashboardJSON.string(json["name"]) ??
            DashboardJSON.string(json["title"])

        guard let resolvedValue, let resolvedLabel else {
            return nil
        }

        self.init(value: resolvedValue, label: resolvedLabel)
    }
}

struct AdminCreateServicePayload: Encodable {
    let title: String
    let slug: String
    let description: String
    let requirements: String
    let categoryID: String
    let deliveryProvider: String
    let skills: [String]
    let tags: [String]
    let basePrice: Int
    let pricingType: String

    enum CodingKeys: String, CodingKey {
        case title
        case slug
        case description
        case requirements
        case categoryID = "category_id"
        case deliveryProvider = "delivery_provider"
        case skills
        case tags
        case basePrice
        case pricingType
    }
}

struct AdminUpdateServicePayload: Encodable {
    let name: String
    let slug: String
    let description: String
    let requirements: String
    let categoryID: String
    let deliveryProvider: String
    let skills: [String]
    let tags: [String]
    let status: String

    enum CodingKeys: String, CodingKey {
        case name
        case slug
        case description
        case requirements
        case categoryID = "category_id"
        case deliveryProvider = "delivery_provider"
        case skills
        case tags
        case status
    }
}

struct AdminCategorySummary: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let slug: String
    let parentID: String?
    let sortOrder: Int
    let icon: String?
    let isActive: Bool

    nonisolated init(json: [String: Any], language: String) {
        func localized(_ value: Any?) -> String? {
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

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name =
            localized(json["name"]) ??
            DashboardJSON.string(json["name"]) ??
            "Category"
        description =
            localized(json["description"]) ??
            DashboardJSON.string(json["description"]) ??
            ""
        slug = DashboardJSON.string(json["slug"]) ?? ""
        parentID =
            DashboardJSON.string(json["parent_id"]) ??
            DashboardJSON.string(json["parentId"])
        sortOrder =
            DashboardJSON.int(json["sortOrder"]) ??
            DashboardJSON.int(json["sort_order"]) ??
            DashboardJSON.int(json["order"]) ??
            0
        icon = DashboardJSON.string(json["icon"])
        isActive = DashboardJSON.bool(json["isActive"]) ?? DashboardJSON.bool(json["is_active"]) ?? true
    }
}

struct AdminCategoriesCollection {
    let categories: [AdminCategorySummary]
    let total: Int
    let currentPage: Int
    let perPage: Int
    let lastPage: Int

    init(payload: Any, language: String) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map { AdminCategorySummary(json: $0, language: language) }
            categories = parsed
            total = parsed.count
            currentPage = 1
            perPage = max(1, parsed.count)
            lastPage = 1
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let direct = root["categories"] as? [[String: Any]] {
                return direct
            }
            if let nested = dataObject?["categories"] as? [[String: Any]] {
                return nested
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map { AdminCategorySummary(json: $0, language: language) }
        categories = parsed
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count
        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
        perPage = max(1, resolvedPerPage)
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(dataObject?["total_pages"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, perPage)))))
        }
    }
}

struct AdminCategoryDetail {
    let id: String
    let name: String
    let slug: String
    let description: String
    let icon: String
    let parentID: String?
    let sortOrder: Int
    let isActive: Bool

    nonisolated init(json: [String: Any], language: String) {
        let summary = AdminCategorySummary(json: json, language: language)
        id = summary.id
        name = summary.name
        slug = summary.slug
        description = summary.description
        icon = summary.icon ?? ""
        parentID = summary.parentID
        sortOrder = summary.sortOrder
        isActive = summary.isActive
    }
}

struct AdminCategoryPayload {
    let name: String
    let slug: String
    let description: String
    let icon: String
    let parentID: String?
    let sortOrder: Int
}

struct AdminLegalClause: Identifiable, Equatable {
    let id: String
    let identifier: String
    let category: String
    let content: [String: String]
    let createdAt: Date?
    let updatedAt: Date?

    var translationCount: Int {
        content.values.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        identifier = DashboardJSON.string(json["identifier"]) ?? ""
        category = DashboardJSON.string(json["category"]) ?? ""
        createdAt = DashboardJSON.date(json["created_at"])
        updatedAt = DashboardJSON.date(json["updated_at"])

        let rawContent = DashboardJSON.dictionary(json["content"]) ?? [:]
        var parsedContent: [String: String] = [:]
        for (key, value) in rawContent {
            if let text = DashboardJSON.string(value) {
                parsedContent[key] = text
            }
        }
        content = parsedContent
    }
}

struct AdminLegalClausesCollection {
    let clauses: [AdminLegalClause]
    let total: Int
    let currentPage: Int
    let lastPage: Int
    let perPage: Int

    init(payload: Any) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let direct = root["clauses"] as? [[String: Any]] {
                return direct
            }
            if let nested = dataObject?["clauses"] as? [[String: Any]] {
                return nested
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if let singleClause = DashboardJSON.dictionary(root["clause"]) {
                return [singleClause]
            }
            if let nestedClause = DashboardJSON.dictionary(dataObject?["clause"]) {
                return [nestedClause]
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map(AdminLegalClause.init)
        clauses = parsed

        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count

        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1

        lastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"]) ??
            1

        perPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
    }
}

struct AdminLegalClausePayload {
    let identifier: String
    let category: String
    let content: [String: String]

    func requestBody() throws -> Data {
        let trimmedIdentifier = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCategory = category.trimmingCharacters(in: .whitespacesAndNewlines)
        var normalizedContent: [String: String] = [:]
        for (key, value) in content {
            let normalizedKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
            let normalizedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !normalizedKey.isEmpty, !normalizedValue.isEmpty {
                normalizedContent[normalizedKey] = normalizedValue
            }
        }

        let body: [String: Any] = [
            "identifier": trimmedIdentifier,
            "category": trimmedCategory,
            "content": normalizedContent,
        ]
        return try JSONSerialization.data(withJSONObject: body, options: [])
    }
}

struct AdminLegalClauseUpdatePayload {
    let identifier: String?
    let category: String?
    let content: [String: String]?

    func requestBody() throws -> Data {
        var body: [String: Any] = [:]

        if let identifier {
            body["identifier"] = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let category {
            body["category"] = category.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let content {
            var normalizedContent: [String: String] = [:]
            for (key, value) in content {
                let normalizedKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
                let normalizedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !normalizedKey.isEmpty, !normalizedValue.isEmpty {
                    normalizedContent[normalizedKey] = normalizedValue
                }
            }
            body["content"] = normalizedContent
        }

        return try JSONSerialization.data(withJSONObject: body, options: [])
    }
}

struct AdminSendNewsletterPayload {
    let template: String
    let subject: String
    let data: [String: String]?
    let userType: String?
    let recipients: [String]?
    let language: String?

    func requestBody() throws -> Data {
        var body: [String: Any] = [
            "template": template.trimmingCharacters(in: .whitespacesAndNewlines),
            "subject": subject.trimmingCharacters(in: .whitespacesAndNewlines),
        ]

        if let data {
            let normalized = data
                .mapValues { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.value.isEmpty }
            if !normalized.isEmpty {
                body["data"] = normalized
            }
        }

        if let userType = userType?.trimmingCharacters(in: .whitespacesAndNewlines), !userType.isEmpty {
            body["user_type"] = userType
        }

        if let recipients {
            let normalizedRecipients = recipients
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
            if !normalizedRecipients.isEmpty {
                body["recipients"] = normalizedRecipients
            }
        }

        if let language = language?.trimmingCharacters(in: .whitespacesAndNewlines), !language.isEmpty {
            body["language"] = language
        }

        return try JSONSerialization.data(withJSONObject: body, options: [])
    }
}

struct AdminNewsletterSubscriber: Identifiable, Equatable {
    let id: String
    let email: String
    let name: String?
    let userType: String
    let company: String?
    let language: String?
    let subscribedAt: Date?
    let unsubscribedAt: Date?

    var isActive: Bool {
        unsubscribedAt == nil
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        email = DashboardJSON.string(json["email"]) ?? "-"
        name = DashboardJSON.string(json["name"])
        userType = DashboardJSON.string(json["user_type"]) ?? "client"
        company = DashboardJSON.string(json["company"])
        language = DashboardJSON.string(json["language"])
        subscribedAt = DashboardJSON.date(json["subscribed_at"])
        unsubscribedAt = DashboardJSON.date(json["unsubscribed_at"])
    }
}

struct AdminNewsletterSubscribersCollection {
    let subscribers: [AdminNewsletterSubscriber]
    let total: Int
    let perPage: Int
    let currentPage: Int
    let lastPage: Int

    init(payload: Any) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let paginationRoot = DashboardJSON.dictionary(root["pagination"])
        let paginationNested = DashboardJSON.dictionary(dataObject?["pagination"])

        let rows: [[String: Any]] = {
            if let directData = root["data"] as? [[String: Any]] {
                return directData
            }
            if let subscribers = root["subscribers"] as? [[String: Any]] {
                return subscribers
            }
            if let nestedSubscribers = dataObject?["subscribers"] as? [[String: Any]] {
                return nestedSubscribers
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map(AdminNewsletterSubscriber.init)
        subscribers = parsed

        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(paginationRoot?["total"]) ??
            DashboardJSON.int(paginationNested?["total"]) ??
            parsed.count

        perPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(paginationRoot?["per_page"]) ??
            DashboardJSON.int(paginationNested?["per_page"]) ??
            parsed.count

        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(paginationRoot?["current_page"]) ??
            DashboardJSON.int(paginationNested?["current_page"]) ??
            1

        lastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(paginationRoot?["last_page"]) ??
            DashboardJSON.int(paginationNested?["last_page"]) ??
            1
    }
}

struct AdminActivityEntry: Identifiable, Equatable {
    let id: String
    let type: String
    let metadata: [String: String]
    let readAt: Date?
    let createdAt: Date?
    let createdAtHuman: String

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        type = DashboardJSON.string(json["type"]) ?? "unknown"
        readAt = DashboardJSON.date(json["read_at"])
        createdAt = DashboardJSON.date(json["created_at"])
        createdAtHuman = DashboardJSON.string(json["created_at_human"]) ?? ""

        let rawMetadata = DashboardJSON.dictionary(json["metadata"]) ?? [:]
        var parsedMetadata: [String: String] = [:]
        for (key, value) in rawMetadata {
            if let direct = DashboardJSON.string(value) {
                parsedMetadata[key] = direct
                continue
            }

            if let number = value as? NSNumber {
                parsedMetadata[key] = number.stringValue
                continue
            }

            if let bool = value as? Bool {
                parsedMetadata[key] = bool ? "true" : "false"
                continue
            }

            if let dictionary = DashboardJSON.dictionary(value),
               let data = try? JSONSerialization.data(withJSONObject: dictionary, options: []),
               let text = String(data: data, encoding: .utf8) {
                parsedMetadata[key] = text
                continue
            }

            if let array = value as? [Any],
               let data = try? JSONSerialization.data(withJSONObject: array, options: []),
               let text = String(data: data, encoding: .utf8) {
                parsedMetadata[key] = text
            }
        }
        metadata = parsedMetadata
    }
}

struct AdminActivitiesCollection {
    let activities: [AdminActivityEntry]
    let total: Int
    let perPage: Int
    let currentPage: Int
    let lastPage: Int

    init(payload: Any) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let directData = root["data"] as? [[String: Any]] {
                return directData
            }
            if let directActivities = root["activities"] as? [[String: Any]] {
                return directActivities
            }
            if let nestedActivities = dataObject?["activities"] as? [[String: Any]] {
                return nestedActivities
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map(AdminActivityEntry.init)
        activities = parsed

        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count

        perPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count

        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1

        lastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"]) ??
            1
    }
}

struct AdminAuditLogEntry: Identifiable, Equatable {
    let id: String
    let actorName: String
    let action: String
    let event: String
    let subjectType: String
    let subjectID: String
    let oldValues: [String: String]
    let newValues: [String: String]
    let ip: String
    let createdAt: Date?

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        actorName = DashboardJSON.string(json["actor_name"]) ?? "-"
        action = DashboardJSON.string(json["action"]) ?? "-"
        event = (DashboardJSON.string(json["event"]) ?? "unknown").lowercased()
        subjectType = DashboardJSON.string(json["subject_type"]) ?? "-"
        subjectID =
            DashboardJSON.string(json["subject_id"]) ??
            DashboardJSON.string(json["subjectId"]) ??
            "-"
        oldValues = Self.parseValueMap(json["old_values"])
        newValues = Self.parseValueMap(json["new_values"])
        ip = DashboardJSON.string(json["ip"]) ?? "-"
        createdAt = DashboardJSON.date(json["created_at"])
    }

    nonisolated private static func parseValueMap(_ value: Any?) -> [String: String] {
        guard let dictionary = DashboardJSON.dictionary(value) else {
            return [:]
        }

        var parsed: [String: String] = [:]
        for (key, rawValue) in dictionary {
            if let text = DashboardJSON.string(rawValue) {
                parsed[key] = text
                continue
            }
            if let number = rawValue as? NSNumber {
                parsed[key] = number.stringValue
                continue
            }
            if let bool = rawValue as? Bool {
                parsed[key] = bool ? "true" : "false"
                continue
            }
            if let nestedDictionary = DashboardJSON.dictionary(rawValue),
               let data = try? JSONSerialization.data(withJSONObject: nestedDictionary, options: []),
               let text = String(data: data, encoding: .utf8) {
                parsed[key] = text
                continue
            }
            if let array = rawValue as? [Any],
               let data = try? JSONSerialization.data(withJSONObject: array, options: []),
               let text = String(data: data, encoding: .utf8) {
                parsed[key] = text
            }
        }

        return parsed
    }
}

struct AdminAuditLogsCollection {
    let logs: [AdminAuditLogEntry]
    let total: Int
    let currentPage: Int
    let lastPage: Int

    init(payload: Any) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let directData = root["data"] as? [[String: Any]] {
                return directData
            }
            if let directLogs = root["logs"] as? [[String: Any]] {
                return directLogs
            }
            if let nestedLogs = dataObject?["logs"] as? [[String: Any]] {
                return nestedLogs
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map(AdminAuditLogEntry.init)
        logs = parsed

        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count

        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1

        lastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"]) ??
            1
    }
}

struct AdminRoleSummary: Identifiable, Equatable {
    let id: String
    let name: String
    let slug: String
    let description: String
    let sortOrder: Int?
    let permissionsCount: Int

    init(
        id: String,
        name: String,
        slug: String,
        description: String,
        sortOrder: Int?,
        permissionsCount: Int
    ) {
        self.id = id
        self.name = name
        self.slug = slug
        self.description = description
        self.sortOrder = sortOrder
        self.permissionsCount = permissionsCount
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name = DashboardJSON.string(json["name"]) ?? "-"
        slug = DashboardJSON.string(json["slug"]) ?? "-"
        description = DashboardJSON.string(json["description"]) ?? ""
        sortOrder = DashboardJSON.int(json["sort_order"]) ?? DashboardJSON.int(json["sortOrder"])

        if let permissions = json["permissions"] as? [[String: Any]] {
            permissionsCount = permissions.count
        } else if let permissionSlugs = json["permission_slugs"] as? [Any] {
            permissionsCount = permissionSlugs.count
        } else if let permissionSlug = json["permission_slug"] as? [Any] {
            permissionsCount = permissionSlug.count
        } else {
            permissionsCount = 0
        }
    }
}

struct AdminRolesCollection {
    let roles: [AdminRoleSummary]
    let total: Int
    let currentPage: Int
    let lastPage: Int
    let pageSize: Int

    init(payload: Any) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map(AdminRoleSummary.init)
            roles = parsed
            total = parsed.count
            currentPage = 1
            lastPage = 1
            pageSize = parsed.count
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])

        let rows: [[String: Any]] = {
            if let results = root["results"] as? [[String: Any]] {
                return results
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let roles = root["roles"] as? [[String: Any]] {
                return roles
            }
            if let nestedRoles = dataObject?["roles"] as? [[String: Any]] {
                return nestedRoles
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map(AdminRoleSummary.init)
        roles = parsed

        total =
            DashboardJSON.int(root["count"]) ??
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            parsed.count

        currentPage =
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            1

        let computedPageSize =
            DashboardJSON.int(root["page_size"]) ??
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            parsed.count
        pageSize = max(1, computedPageSize)

        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(dataObject?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, pageSize)))))
        }
    }
}

struct AdminRoleLite: Identifiable, Equatable {
    let id: String
    let name: String
    let slug: String

    init(id: String, name: String, slug: String) {
        self.id = id
        self.name = name
        self.slug = slug
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name = DashboardJSON.string(json["name"]) ?? "-"
        slug = DashboardJSON.string(json["slug"]) ?? "-"
    }
}

struct AdminPermissionSummary: Identifiable, Equatable {
    let id: String
    let groupID: String?
    let name: String
    let slug: String
    let description: String
    let isActive: Bool

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        groupID = DashboardJSON.string(json["permission_group_id"])
        name = DashboardJSON.string(json["name"]) ?? "-"
        slug = DashboardJSON.string(json["slug"]) ?? "-"
        description = DashboardJSON.string(json["description"]) ?? ""
        isActive = DashboardJSON.bool(json["is_active"]) ?? true
    }
}

struct AdminPermissionGroup: Identifiable, Equatable {
    let id: String
    let name: String
    let slug: String
    let permissions: [AdminPermissionSummary]

    init(
        id: String,
        name: String,
        slug: String,
        permissions: [AdminPermissionSummary]
    ) {
        self.id = id
        self.name = name
        self.slug = slug
        self.permissions = permissions
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name = DashboardJSON.string(json["name"]) ?? "-"
        slug = DashboardJSON.string(json["slug"]) ?? "-"
        let rows = (json["permissions"] as? [[String: Any]]) ?? []
        permissions = rows.map(AdminPermissionSummary.init)
    }
}

struct AdminRoleDetail: Equatable {
    let id: String
    let name: String
    let slug: String
    let description: String
    let sortOrder: Int
    let permissionIDs: [String]

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        name = DashboardJSON.string(json["name"]) ?? ""
        slug = DashboardJSON.string(json["slug"]) ?? ""
        description = DashboardJSON.string(json["description"]) ?? ""
        sortOrder = DashboardJSON.int(json["sort_order"]) ?? DashboardJSON.int(json["sortOrder"]) ?? 0

        if let rows = json["permissions"] as? [[String: Any]] {
            permissionIDs = rows.compactMap { DashboardJSON.string($0["id"]) }
        } else if let ids = json["permissions"] as? [Any] {
            permissionIDs = ids.compactMap { DashboardJSON.string($0) }
        } else {
            permissionIDs = []
        }
    }
}

struct AdminCreateRolePayload {
    var name: String
    var description: String
    var permissionIDs: [String]

    func requestBody() throws -> Data {
        var payload: [String: Any] = [
            "name": name,
            "description": description,
        ]
        if !permissionIDs.isEmpty {
            payload["permissions"] = permissionIDs.compactMap(Int.init)
        }
        return try JSONSerialization.data(withJSONObject: payload, options: [])
    }
}

struct AdminUpdateRolePayload {
    var name: String
    var description: String
    var permissionIDs: [String]

    func requestBody() throws -> Data {
        let payload: [String: Any] = [
            "name": name,
            "description": description,
            "permissions": permissionIDs.compactMap(Int.init),
        ]
        return try JSONSerialization.data(withJSONObject: payload, options: [])
    }
}

struct AdminCallUserSummary: Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String

    var fullName: String {
        let value = "\(firstName) \(lastName)"
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? email : value
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        firstName = DashboardJSON.string(json["firstName"]) ?? DashboardJSON.string(json["first_name"]) ?? ""
        lastName = DashboardJSON.string(json["lastName"]) ?? DashboardJSON.string(json["last_name"]) ?? ""
        email = DashboardJSON.string(json["email"]) ?? ""
    }
}

struct AdminCallServiceSummary: Equatable {
    let id: String
    let title: String
    let categoryName: String

    nonisolated init(json: [String: Any], language: String) {
        func localized(_ value: Any?) -> String? {
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

        let categoryObject = DashboardJSON.dictionary(json["category"])
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        title =
            localized(json["name"]) ??
            localized(json["title"]) ??
            DashboardJSON.string(json["name"]) ??
            DashboardJSON.string(json["title"]) ??
            "-"
        categoryName =
            localized(categoryObject?["name"]) ??
            DashboardJSON.string(categoryObject?["name"]) ??
            DashboardJSON.string(json["category_name"]) ??
            "-"
    }
}

struct AdminCallTestResultSummary: Equatable {
    let id: String
    let skillTestID: String?
    let score: Double
    let passed: Bool?

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        skillTestID =
            DashboardJSON.string(json["skill_test_id"]) ??
            DashboardJSON.string(json["skillTestId"]) ??
            DashboardJSON.string(json["test_id"])
        score =
            DashboardJSON.double(json["score"]) ??
            DashboardJSON.double(json["result"]) ??
            0
        passed = DashboardJSON.bool(json["passed"])
    }
}

struct AdminCallSummary: Identifiable, Equatable {
    let id: String
    let status: String
    let passedValue: Int?
    let dateTime: Date?
    let createdAt: Date?
    let callURL: String?
    let interviewer: AdminCallUserSummary?
    let attendee: AdminCallUserSummary?
    let service: AdminCallServiceSummary?
    let testResult: AdminCallTestResultSummary?
    let resultsCount: Int
    let note: String?

    nonisolated init(json: [String: Any], language: String) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        status = (DashboardJSON.string(json["status"]) ?? "WAITING").uppercased()
        passedValue =
            DashboardJSON.int(json["passed"]) ??
            DashboardJSON.int(json["is_passed"])
        dateTime =
            DashboardJSON.date(json["date_time"]) ??
            DashboardJSON.date(json["scheduled_at"])
        createdAt = DashboardJSON.date(json["created_at"])
        callURL = DashboardJSON.string(json["call_url"]) ?? DashboardJSON.string(json["url"])
        note = DashboardJSON.string(json["note"])

        if let interviewerObject = DashboardJSON.dictionary(json["interviewer"]) {
            interviewer = AdminCallUserSummary(json: interviewerObject)
        } else {
            interviewer = nil
        }

        if let attendeeObject = DashboardJSON.dictionary(json["attendees"]) ?? DashboardJSON.dictionary(json["attendee"]) {
            attendee = AdminCallUserSummary(json: attendeeObject)
        } else {
            attendee = nil
        }

        if let serviceObject = DashboardJSON.dictionary(json["service"]) {
            service = AdminCallServiceSummary(json: serviceObject, language: language)
        } else {
            service = nil
        }

        if let testResultObject = DashboardJSON.dictionary(json["test_result"]) ?? DashboardJSON.dictionary(json["testResult"]) {
            testResult = AdminCallTestResultSummary(json: testResultObject)
        } else {
            testResult = nil
        }

        resultsCount =
            DashboardJSON.int(json["results_count"]) ??
            DashboardJSON.array(json["results"]).count
    }
}

struct AdminCallsCollection {
    let calls: [AdminCallSummary]
    let total: Int
    let currentPage: Int
    let perPage: Int
    let lastPage: Int

    init(payload: Any, language: String) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map { AdminCallSummary(json: $0, language: language) }
            calls = parsed
            total = parsed.count
            currentPage = 1
            perPage = max(1, parsed.count)
            lastPage = 1
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let direct = root["calls"] as? [[String: Any]] {
                return direct
            }
            if let nested = dataObject?["calls"] as? [[String: Any]] {
                return nested
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map { AdminCallSummary(json: $0, language: language) }
        calls = parsed
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count
        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
        perPage = max(1, resolvedPerPage)
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(dataObject?["total_pages"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, perPage)))))
        }
    }
}

struct AdminOrderParticipantSummary: Identifiable, Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String
    let avatarURL: String?

    var fullName: String {
        let text = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? email : text
    }

    var initials: String {
        let first = firstName.first.map { String($0).uppercased() } ?? ""
        let last = lastName.first.map { String($0).uppercased() } ?? ""
        let text = (first + last).trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? "U" : text
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        firstName = DashboardJSON.string(json["firstName"]) ?? DashboardJSON.string(json["first_name"]) ?? ""
        lastName = DashboardJSON.string(json["lastName"]) ?? DashboardJSON.string(json["last_name"]) ?? ""
        email = DashboardJSON.string(json["email"]) ?? ""
        avatarURL = DashboardJSON.string(json["avatar"]) ?? DashboardJSON.string(json["profile_photo_url"])
    }
}

struct AdminOrderServiceSummary: Equatable {
    let id: String
    let title: String
    let categoryName: String

    nonisolated init(json: [String: Any], language: String) {
        let category = DashboardJSON.dictionary(json["category"])
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        title =
            AdminOrderSummary.localized(json["title"], language: language) ??
            AdminOrderSummary.localized(json["name"], language: language) ??
            DashboardJSON.string(json["title"]) ??
            DashboardJSON.string(json["name"]) ??
            "-"
        categoryName =
            AdminOrderSummary.localized(category?["name"], language: language) ??
            DashboardJSON.string(category?["name"]) ??
            DashboardJSON.string(json["category_name"]) ??
            "-"
    }
}

struct AdminOrderSummary: Identifiable, Equatable {
    let id: String
    let orderNumber: String
    let amount: Double
    let currency: String
    let status: String
    let paymentStatus: String
    let createdAt: Date?
    let deliveryDate: Date?
    let requirements: String
    let clientNotes: String
    let providerNotes: String
    let adminNotes: String
    let deliverables: [String]
    let service: AdminOrderServiceSummary?
    let client: AdminOrderParticipantSummary?
    let provider: AdminOrderParticipantSummary?

    nonisolated init(json: [String: Any], language: String) {
        let serviceObject = DashboardJSON.dictionary(json["service"])
        let clientObject = DashboardJSON.dictionary(json["client"]) ??
            DashboardJSON.dictionary(json["client_user"]) ??
            DashboardJSON.dictionary(json["customer"])
        let providerObject = DashboardJSON.dictionary(json["provider"]) ??
            DashboardJSON.dictionary(json["provider_user"]) ??
            DashboardJSON.dictionary(json["seller"])

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        orderNumber =
            DashboardJSON.string(json["orderNumber"]) ??
            DashboardJSON.string(json["order_number"]) ??
            DashboardJSON.string(json["number"]) ??
            id
        amount =
            DashboardJSON.double(json["amount"]) ??
            DashboardJSON.double(json["total"]) ??
            DashboardJSON.double(json["budget"]) ??
            0
        currency = (DashboardJSON.string(json["currency"]) ?? "USD").uppercased()
        status = (DashboardJSON.string(json["status"]) ?? "PENDING").uppercased()
        paymentStatus = (DashboardJSON.string(json["paymentStatus"]) ?? DashboardJSON.string(json["payment_status"]) ?? "PENDING").uppercased()
        createdAt = DashboardJSON.date(json["createdAt"]) ?? DashboardJSON.date(json["created_at"])
        deliveryDate =
            DashboardJSON.date(json["deliveryDate"]) ??
            DashboardJSON.date(json["delivery_date"]) ??
            DashboardJSON.date(json["deadline"])
        requirements = DashboardJSON.string(json["requirements"]) ?? DashboardJSON.string(json["description"]) ?? ""
        clientNotes = DashboardJSON.string(json["clientNotes"]) ?? DashboardJSON.string(json["client_notes"]) ?? ""
        providerNotes = DashboardJSON.string(json["providerNotes"]) ?? DashboardJSON.string(json["provider_notes"]) ?? ""
        adminNotes = DashboardJSON.string(json["adminNotes"]) ?? DashboardJSON.string(json["admin_notes"]) ?? ""

        let deliverableValues = DashboardJSON.array(json["deliverables"])
            .compactMap { item -> String? in
                if let text = DashboardJSON.string(item), !text.isEmpty {
                    return text
                }
                if let object = DashboardJSON.dictionary(item) {
                    return DashboardJSON.string(object["title"]) ??
                        DashboardJSON.string(object["name"]) ??
                        DashboardJSON.string(object["description"])
                }
                return nil
            }
        let projectDeliverables = DashboardJSON.array(json["project_deliverables"])
            .compactMap { item -> String? in
                if let object = DashboardJSON.dictionary(item) {
                    return DashboardJSON.string(object["title"]) ??
                        DashboardJSON.string(object["name"]) ??
                        DashboardJSON.string(object["description"])
                }
                return DashboardJSON.string(item)
            }
        deliverables = (deliverableValues + projectDeliverables).filter { !$0.isEmpty }

        if let serviceObject {
            service = AdminOrderServiceSummary(json: serviceObject, language: language)
        } else {
            service = nil
        }

        if let clientObject {
            client = AdminOrderParticipantSummary(json: clientObject)
        } else {
            client = nil
        }

        if let providerObject {
            provider = AdminOrderParticipantSummary(json: providerObject)
        } else {
            provider = nil
        }
    }

    nonisolated static func localized(_ value: Any?, language: String) -> String? {
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
}

struct AdminOrdersCollection {
    let orders: [AdminOrderSummary]
    let total: Int
    let currentPage: Int
    let perPage: Int
    let lastPage: Int

    init(payload: Any, language: String) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map { AdminOrderSummary(json: $0, language: language) }
            orders = parsed
            total = parsed.count
            currentPage = 1
            perPage = max(1, parsed.count)
            lastPage = 1
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let direct = root["orders"] as? [[String: Any]] {
                return direct
            }
            if let nested = dataObject?["orders"] as? [[String: Any]] {
                return nested
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map { AdminOrderSummary(json: $0, language: language) }
        orders = parsed
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count
        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
        perPage = max(1, resolvedPerPage)
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(dataObject?["total_pages"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, perPage)))))
        }
    }
}

struct AdminTestServiceOption: Identifiable, Equatable {
    let id: String
    let title: String
    let categoryName: String
}

struct AdminTestSummary: Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let serviceID: String
    let serviceTitle: String
    let serviceCategoryName: String
    let level: String
    let status: String
    let totalQuestions: Int
    let timeLimit: Int
    let passingScore: Int
    let resultsCount: Int
    let createdAt: Date?

    nonisolated init(json: [String: Any], language: String) {
        let serviceObject = DashboardJSON.dictionary(json["service"])
        let categoryObject = DashboardJSON.dictionary(serviceObject?["category"])
        let nestedResults = DashboardJSON.array(json["results"])

        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        title =
            AdminTestSummary.localized(json["title"], language: language) ??
            DashboardJSON.string(json["title"]) ??
            DashboardJSON.string(json["name"]) ??
            "Test"
        description =
            AdminTestSummary.localized(json["description"], language: language) ??
            DashboardJSON.string(json["description"]) ??
            ""
        serviceID =
            DashboardJSON.string(json["serviceId"]) ??
            DashboardJSON.string(json["service_id"]) ??
            DashboardJSON.string(serviceObject?["id"]) ??
            ""
        serviceTitle =
            AdminTestSummary.localized(serviceObject?["title"], language: language) ??
            AdminTestSummary.localized(serviceObject?["name"], language: language) ??
            DashboardJSON.string(serviceObject?["title"]) ??
            DashboardJSON.string(serviceObject?["name"]) ??
            "-"
        serviceCategoryName =
            AdminTestSummary.localized(categoryObject?["name"], language: language) ??
            DashboardJSON.string(categoryObject?["name"]) ??
            DashboardJSON.string(json["category_name"]) ??
            "-"
        level = (DashboardJSON.string(json["level"]) ?? "JUNIOR").uppercased()
        status = (DashboardJSON.string(json["status"]) ?? "DRAFT").uppercased()
        totalQuestions =
            DashboardJSON.int(json["totalQuestions"]) ??
            DashboardJSON.int(json["total_questions"]) ??
            DashboardJSON.int(json["questions_count"]) ??
            DashboardJSON.array(json["questions"]).count
        timeLimit =
            DashboardJSON.int(json["timeLimit"]) ??
            DashboardJSON.int(json["time_limit"]) ??
            60
        passingScore =
            DashboardJSON.int(json["passingScore"]) ??
            DashboardJSON.int(json["passing_score"]) ??
            70
        resultsCount =
            DashboardJSON.int(json["resultsCount"]) ??
            DashboardJSON.int(json["results_count"]) ??
            nestedResults.count
        createdAt = DashboardJSON.date(json["created_at"])
    }

    nonisolated static func localized(_ value: Any?, language: String) -> String? {
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
}

struct AdminTestsCollection {
    let tests: [AdminTestSummary]
    let total: Int
    let currentPage: Int
    let perPage: Int
    let lastPage: Int

    init(payload: Any, language: String) {
        if let rows = payload as? [[String: Any]] {
            let parsed = rows.map { AdminTestSummary(json: $0, language: language) }
            tests = parsed
            total = parsed.count
            currentPage = 1
            perPage = max(1, parsed.count)
            lastPage = 1
            return
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let rootMeta = DashboardJSON.dictionary(root["meta"])
        let dataMeta = DashboardJSON.dictionary(dataObject?["meta"])

        let rows: [[String: Any]] = {
            if let direct = root["tests"] as? [[String: Any]] {
                return direct
            }
            if let nested = dataObject?["tests"] as? [[String: Any]] {
                return nested
            }
            if let dataArray = root["data"] as? [[String: Any]] {
                return dataArray
            }
            if let nestedData = dataObject?["data"] as? [[String: Any]] {
                return nestedData
            }
            if root["id"] != nil {
                return [root]
            }
            if let dataObject, dataObject["id"] != nil {
                return [dataObject]
            }
            return []
        }()

        let parsed = rows.map { AdminTestSummary(json: $0, language: language) }
        tests = parsed
        total =
            DashboardJSON.int(root["total"]) ??
            DashboardJSON.int(dataObject?["total"]) ??
            DashboardJSON.int(rootMeta?["total"]) ??
            DashboardJSON.int(dataMeta?["total"]) ??
            parsed.count
        currentPage =
            DashboardJSON.int(root["current_page"]) ??
            DashboardJSON.int(root["page"]) ??
            DashboardJSON.int(dataObject?["current_page"]) ??
            DashboardJSON.int(dataObject?["page"]) ??
            DashboardJSON.int(rootMeta?["current_page"]) ??
            DashboardJSON.int(dataMeta?["current_page"]) ??
            1
        let resolvedPerPage =
            DashboardJSON.int(root["per_page"]) ??
            DashboardJSON.int(root["limit"]) ??
            DashboardJSON.int(dataObject?["per_page"]) ??
            DashboardJSON.int(dataObject?["limit"]) ??
            DashboardJSON.int(rootMeta?["per_page"]) ??
            DashboardJSON.int(dataMeta?["per_page"]) ??
            parsed.count
        perPage = max(1, resolvedPerPage)
        let explicitLastPage =
            DashboardJSON.int(root["last_page"]) ??
            DashboardJSON.int(root["total_pages"]) ??
            DashboardJSON.int(dataObject?["last_page"]) ??
            DashboardJSON.int(dataObject?["total_pages"]) ??
            DashboardJSON.int(rootMeta?["last_page"]) ??
            DashboardJSON.int(dataMeta?["last_page"])
        if let explicitLastPage {
            lastPage = max(1, explicitLastPage)
        } else {
            lastPage = max(1, Int(ceil(Double(max(1, total)) / Double(max(1, perPage)))))
        }
    }
}

struct AdminTestQuestionTestCase: Identifiable, Equatable {
    let id: String
    let input: String
    let expectedOutput: String
    let description: String

    init(input: String, expectedOutput: String, description: String) {
        id = UUID().uuidString
        self.input = input
        self.expectedOutput = expectedOutput
        self.description = description
    }

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        input = DashboardJSON.string(json["input"]) ?? ""
        expectedOutput =
            DashboardJSON.string(json["expectedOutput"]) ??
            DashboardJSON.string(json["expected_output"]) ??
            ""
        description = DashboardJSON.string(json["description"]) ?? ""
    }

    var requestObject: [String: Any] {
        [
            "input": input,
            "expectedOutput": expectedOutput,
            "description": description,
        ]
    }
}

struct AdminTestQuestion: Identifiable, Equatable {
    let id: String
    let type: String
    let question: String
    let points: Int
    let options: [String]
    let correctAnswers: [String]
    let explanation: String
    let codeTemplate: String
    let codeSolution: String
    let expectedOutput: String
    let testCases: [AdminTestQuestionTestCase]
    let order: Int

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        type = AdminTestQuestion.normalizedQuestionType(
            DashboardJSON.string(json["type"]) ?? "SINGLE_CHOICE"
        )
        question = DashboardJSON.string(json["question"]) ?? ""
        points = DashboardJSON.int(json["points"]) ?? 0
        options = AdminTestQuestion.parseStringArray(json["options"])
        correctAnswers = AdminTestQuestion.parseStringArray(
            json["correct_answers"] ?? json["correctAnswers"]
        )
        order = DashboardJSON.int(json["order"]) ?? 0

        let meta = AdminTestQuestion.parseMeta(json["meta"])
        explanation =
            DashboardJSON.string(json["explanation"]) ??
            DashboardJSON.string(meta["explanation"]) ??
            ""
        codeTemplate =
            DashboardJSON.string(json["codeTemplate"]) ??
            DashboardJSON.string(json["code_template"]) ??
            DashboardJSON.string(meta["codeTemplate"]) ??
            DashboardJSON.string(meta["code_template"]) ??
            ""
        codeSolution =
            DashboardJSON.string(json["codeSolution"]) ??
            DashboardJSON.string(json["code_solution"]) ??
            DashboardJSON.string(meta["codeSolution"]) ??
            DashboardJSON.string(meta["code_solution"]) ??
            ""
        expectedOutput =
            DashboardJSON.string(json["expectedOutput"]) ??
            DashboardJSON.string(json["expected_output"]) ??
            DashboardJSON.string(meta["expectedOutput"]) ??
            DashboardJSON.string(meta["expected_output"]) ??
            ""

        let parsedTestCases = AdminTestQuestion.parseTestCases(meta["testCases"] ?? meta["test_cases"])
        testCases = parsedTestCases
    }

    nonisolated static func normalizedQuestionType(_ raw: String) -> String {
        switch raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() {
        case "CODE":
            return "CODE_WRITING"
        case "TRUE_FALSE":
            return "TEXT_INPUT"
        case "CODE_WRITING", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT_INPUT":
            return raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        default:
            return "SINGLE_CHOICE"
        }
    }

    nonisolated private static func parseMeta(_ raw: Any?) -> [String: Any] {
        if let dictionary = DashboardJSON.dictionary(raw) {
            return dictionary
        }

        if let rawString = DashboardJSON.string(raw),
           let data = rawString.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data, options: []),
           let dictionary = object as? [String: Any] {
            return dictionary
        }

        return [:]
    }

    nonisolated static func parseStringArray(_ raw: Any?) -> [String] {
        if let list = raw as? [String] {
            return list.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        }

        if let list = raw as? [Any] {
            return list.compactMap { DashboardJSON.string($0) }
        }

        if let text = DashboardJSON.string(raw), !text.isEmpty {
            if let data = text.data(using: .utf8),
               let object = try? JSONSerialization.jsonObject(with: data, options: []),
               let values = object as? [Any] {
                return values.compactMap { DashboardJSON.string($0) }
            }

            return text
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
        }

        return []
    }

    nonisolated static func parseTestCases(_ raw: Any?) -> [AdminTestQuestionTestCase] {
        if let list = raw as? [[String: Any]] {
            return list.map(AdminTestQuestionTestCase.init(json:))
        }

        if let list = raw as? [Any] {
            return list.compactMap { item in
                guard let dictionary = item as? [String: Any] else {
                    return nil
                }
                return AdminTestQuestionTestCase(json: dictionary)
            }
        }

        if let text = DashboardJSON.string(raw), !text.isEmpty,
           let data = text.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data, options: []),
           let list = object as? [[String: Any]] {
            return list.map(AdminTestQuestionTestCase.init(json:))
        }

        return []
    }
}

struct AdminTestDetail: Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let serviceID: String
    let serviceTitle: String
    let serviceCategoryName: String
    let level: String
    let status: String
    let totalQuestions: Int
    let timeLimit: Int
    let passingScore: Int
    let questions: [AdminTestQuestion]
    let createdAt: Date?

    nonisolated init(json: [String: Any], language: String) {
        let summary = AdminTestSummary(json: json, language: language)
        let parsedQuestions = DashboardJSON.array(json["questions"])
            .compactMap { DashboardJSON.dictionary($0) }
            .map(AdminTestQuestion.init(json:))

        id = summary.id
        title = summary.title
        description = summary.description
        serviceID = summary.serviceID
        serviceTitle = summary.serviceTitle
        serviceCategoryName = summary.serviceCategoryName
        level = summary.level
        status = summary.status
        totalQuestions = summary.totalQuestions == 0 ? parsedQuestions.count : summary.totalQuestions
        timeLimit = summary.timeLimit
        passingScore = summary.passingScore
        questions = parsedQuestions
        createdAt = summary.createdAt
    }
}

struct AdminTestQuestionResult: Identifiable, Equatable {
    let id: String
    let questionID: String
    let answer: [String]
    let pointsEarned: Double
    let isCorrect: Bool

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        questionID =
            DashboardJSON.string(json["skill_test_question_id"]) ??
            DashboardJSON.string(json["question_id"]) ??
            ""
        answer = AdminTestQuestion.parseStringArray(json["answer"])
        pointsEarned =
            DashboardJSON.double(json["points_earned"]) ??
            DashboardJSON.double(json["pointsEarned"]) ??
            0
        isCorrect =
            DashboardJSON.bool(json["is_correct"]) ??
            DashboardJSON.bool(json["isCorrect"]) ??
            false
    }
}

struct AdminTestStatistics: Identifiable, Equatable {
    let id: String
    let title: String
    let level: String
    let serviceTitle: String
    let userFullName: String
    let passed: Bool
    let score: Double
    let timeSpentMinutes: Int
    let questions: [AdminTestQuestion]
    let questionResults: [AdminTestQuestionResult]

    init(payload: Any, language: String) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let base = DashboardJSON.dictionary(root["data"]) ?? root
        let testResultValue = base["test_results"] ?? base["testResult"]

        let testResult: [String: Any] = {
            if let dictionary = DashboardJSON.dictionary(testResultValue) {
                return dictionary
            }
            if let list = testResultValue as? [[String: Any]], let first = list.first {
                return first
            }
            return [:]
        }()

        let userObject = DashboardJSON.dictionary(testResult["user"]) ?? [:]
        let firstName =
            DashboardJSON.string(userObject["firstName"]) ??
            DashboardJSON.string(userObject["first_name"]) ??
            ""
        let lastName =
            DashboardJSON.string(userObject["lastName"]) ??
            DashboardJSON.string(userObject["last_name"]) ??
            ""
        let fullName = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        let serviceObject = DashboardJSON.dictionary(base["service"])

        id = DashboardJSON.string(base["id"]) ?? UUID().uuidString
        title =
            AdminTestSummary.localized(base["title"], language: language) ??
            DashboardJSON.string(base["title"]) ??
            "Test"
        level = (DashboardJSON.string(base["level"]) ?? "JUNIOR").uppercased()
        serviceTitle =
            AdminTestSummary.localized(serviceObject?["title"], language: language) ??
            AdminTestSummary.localized(serviceObject?["name"], language: language) ??
            DashboardJSON.string(serviceObject?["title"]) ??
            DashboardJSON.string(serviceObject?["name"]) ??
            "-"
        userFullName = fullName.isEmpty ? "-" : fullName
        if let passedBool = DashboardJSON.bool(testResult["passed"]) {
            passed = passedBool
        } else if let passedText = DashboardJSON.string(testResult["passed"]) {
            passed = passedText.uppercased() == "YES" || passedText.lowercased() == "true"
        } else {
            passed = false
        }
        score = DashboardJSON.double(testResult["score"]) ?? 0
        timeSpentMinutes =
            DashboardJSON.int(testResult["timeSpent"]) ??
            DashboardJSON.int(testResult["time_spent"]) ??
            0
        questions = DashboardJSON.array(base["questions"])
            .compactMap { DashboardJSON.dictionary($0) }
            .map(AdminTestQuestion.init(json:))
        questionResults = DashboardJSON.array(testResult["question_results"])
            .compactMap { DashboardJSON.dictionary($0) }
            .map(AdminTestQuestionResult.init(json:))
    }
}

struct AdminTestQuestionPayload {
    let id: String?
    let type: String
    let question: String
    let points: Int
    let options: [String]
    let correctAnswers: [String]
    let explanation: String
    let codeTemplate: String
    let codeSolution: String
    let expectedOutput: String
    let testCases: [AdminTestQuestionTestCase]

    private var apiType: String {
        switch type.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() {
        case "CODE_WRITING":
            return "CODE"
        case "TEXT_INPUT":
            return "TRUE_FALSE"
        default:
            return type.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        }
    }

    private func metaJSONString() -> String {
        let payload: [String: Any] = [
            "explanation": explanation,
            "codeTemplate": codeTemplate,
            "codeSolution": codeSolution,
            "expectedOutput": expectedOutput,
            "testCases": testCases.map(\.requestObject),
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
              let text = String(data: data, encoding: .utf8) else {
            return "{}"
        }

        return text
    }

    private func jsonStringArray(_ values: [String]) -> String {
        let normalized = values
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard let data = try? JSONSerialization.data(withJSONObject: normalized, options: []),
              let text = String(data: data, encoding: .utf8) else {
            return "[]"
        }
        return text
    }

    func createDictionary(order: Int) -> [String: Any] {
        let trimmedQuestion = question.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedOptions = options
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let normalizedAnswers = correctAnswers
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        var body: [String: Any] = [
            "type": apiType,
            "question": trimmedQuestion,
            "correct_answers": normalizedAnswers,
            "points": points,
            "order": order,
            "meta": metaJSONString(),
        ]

        if ["SINGLE_CHOICE", "MULTIPLE_CHOICE"].contains(type.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()) {
            body["options"] = normalizedOptions
        } else {
            body["options"] = NSNull()
        }

        if let id, !id.isEmpty {
            body["id"] = id
        }

        return body
    }

    func updateDictionary(order: Int) -> [String: Any] {
        var body = createDictionary(order: order)
        let normalizedOptions = options
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let normalizedAnswers = correctAnswers
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        if ["SINGLE_CHOICE", "MULTIPLE_CHOICE"].contains(type.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()) {
            body["options"] = jsonStringArray(normalizedOptions)
        } else {
            body["options"] = NSNull()
        }

        let answersJSON = jsonStringArray(normalizedAnswers)
        body["correctAnswers"] = answersJSON
        body["correct_answers"] = answersJSON
        return body
    }
}

struct AdminCreateTestPayload {
    let title: String
    let description: String
    let serviceID: String
    let level: String
    let timeLimit: Int
    let passingScore: Int
    let status: String
    let questions: [AdminTestQuestionPayload]

    func requestBody() throws -> Data {
        let mappedQuestions = questions.enumerated().map { index, question in
            question.createDictionary(order: index)
        }

        let body: [String: Any] = [
            "title": title.trimmingCharacters(in: .whitespacesAndNewlines),
            "description": description.trimmingCharacters(in: .whitespacesAndNewlines),
            "service_id": serviceID.trimmingCharacters(in: .whitespacesAndNewlines),
            "level": level.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "time_limit": timeLimit,
            "passing_score": passingScore,
            "status": status.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "questions": mappedQuestions,
        ]

        return try JSONSerialization.data(withJSONObject: body, options: [])
    }
}

struct AdminUpdateTestPayload {
    let title: String
    let description: String
    let serviceID: String
    let level: String
    let timeLimit: Int
    let passingScore: Int
    let status: String
    let questions: [AdminTestQuestionPayload]

    func requestBody() throws -> Data {
        let mappedQuestions = questions.enumerated().map { index, question in
            question.updateDictionary(order: index)
        }

        let normalizedServiceID = serviceID.trimmingCharacters(in: .whitespacesAndNewlines)
        let body: [String: Any] = [
            "title": title.trimmingCharacters(in: .whitespacesAndNewlines),
            "description": description.trimmingCharacters(in: .whitespacesAndNewlines),
            "service_id": normalizedServiceID,
            "serviceId": normalizedServiceID,
            "level": level.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "time_limit": timeLimit,
            "timeLimit": timeLimit,
            "passing_score": passingScore,
            "passingScore": passingScore,
            "status": status.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            "questions": mappedQuestions,
        ]

        return try JSONSerialization.data(withJSONObject: body, options: [])
    }
}

struct AdminEarlyAccessProviderEntry: Identifiable, Equatable {
    let id: String
    let applicationID: String
    let fullName: String
    let email: String
    let country: String?
    let language: String
    let score: Int
    let isEmailVerified: Bool
    let isEmailVerificationExpired: Bool
    let emailVerificationSentAt: Date?
    let emailVerificationExpiresAt: Date?
    let createdAt: Date?

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        applicationID = DashboardJSON.string(json["application_id"]) ?? "-"
        fullName = DashboardJSON.string(json["full_name"]) ?? DashboardJSON.string(json["name"]) ?? "-"
        email = DashboardJSON.string(json["email"]) ?? "-"
        country = DashboardJSON.string(json["country"])
        language = DashboardJSON.string(json["language"]) ?? "-"
        score = DashboardJSON.int(json["score"]) ?? 0
        isEmailVerified = DashboardJSON.bool(json["email_verification"]) ?? false
        isEmailVerificationExpired = DashboardJSON.bool(json["email_verification_expired"]) ?? false
        emailVerificationSentAt = DashboardJSON.date(json["email_verification_sent_at"])
        emailVerificationExpiresAt = DashboardJSON.date(json["email_verification_expires_at"])
        createdAt = DashboardJSON.date(json["created_at"])
    }
}

struct AdminEarlyAccessClientEntry: Identifiable, Equatable {
    let id: String
    let applicationID: String
    let contactName: String
    let companyName: String
    let email: String
    let country: String?
    let language: String
    let score: Int
    let isEmailVerified: Bool
    let isEmailVerificationExpired: Bool
    let emailVerificationSentAt: Date?
    let emailVerificationExpiresAt: Date?
    let createdAt: Date?

    nonisolated init(json: [String: Any]) {
        id = DashboardJSON.string(json["id"]) ?? UUID().uuidString
        applicationID = DashboardJSON.string(json["application_id"]) ?? "-"
        contactName = DashboardJSON.string(json["contact_name"]) ?? DashboardJSON.string(json["name"]) ?? "-"
        companyName = DashboardJSON.string(json["company_name"]) ?? "-"
        email = DashboardJSON.string(json["email"]) ?? "-"
        country = DashboardJSON.string(json["country"])
        language = DashboardJSON.string(json["language"]) ?? "-"
        score = DashboardJSON.int(json["score"]) ?? 0
        isEmailVerified = DashboardJSON.bool(json["email_verification"]) ?? false
        isEmailVerificationExpired = DashboardJSON.bool(json["email_verification_expired"]) ?? false
        emailVerificationSentAt = DashboardJSON.date(json["email_verification_sent_at"])
        emailVerificationExpiresAt = DashboardJSON.date(json["email_verification_expires_at"])
        createdAt = DashboardJSON.date(json["created_at"])
    }
}

struct AdminEarlyAccessPagination: Equatable {
    let currentPage: Int
    let perPage: Int
    let total: Int
    let lastPage: Int

    init?(json: [String: Any]) {
        let currentPage =
            DashboardJSON.int(json["current_page"]) ??
            DashboardJSON.int(json["page"])
        let perPage = DashboardJSON.int(json["per_page"])
        let total = DashboardJSON.int(json["total"])
        let lastPage = DashboardJSON.int(json["last_page"])

        guard let currentPage, let perPage, let total, let lastPage else {
            return nil
        }

        self.currentPage = currentPage
        self.perPage = perPage
        self.total = total
        self.lastPage = lastPage
    }
}

struct AdminEarlyAccessGroupedCollection: Equatable {
    let providers: [AdminEarlyAccessProviderEntry]
    let clients: [AdminEarlyAccessClientEntry]
    let pagination: AdminEarlyAccessPagination?

    init(payload: Any) {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])

        let providersRows: [[String: Any]] =
            root["providers"] as? [[String: Any]] ??
            dataObject?["providers"] as? [[String: Any]] ??
            []

        let clientsRows: [[String: Any]] =
            root["clients"] as? [[String: Any]] ??
            dataObject?["clients"] as? [[String: Any]] ??
            []

        providers = providersRows.map(AdminEarlyAccessProviderEntry.init)
        clients = clientsRows.map(AdminEarlyAccessClientEntry.init)

        let paginationObject =
            DashboardJSON.dictionary(root["pagination"]) ??
            DashboardJSON.dictionary(dataObject?["pagination"]) ??
            DashboardJSON.dictionary(root["meta"]) ??
            DashboardJSON.dictionary(dataObject?["meta"])

        if let paginationObject {
            pagination = AdminEarlyAccessPagination(json: paginationObject)
        } else {
            pagination = nil
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated private static func extractMilestones(from json: [String: Any]) -> [DashboardProjectMilestone] {
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

    nonisolated init(json: [String: Any]) {
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

    nonisolated init(json: [String: Any]) {
        let directURL =
            DashboardJSON.string(json["url"]) ??
            DashboardJSON.string(json["onboarding_url"]) ??
            DashboardJSON.string(json["redirect_url"])
        let nestedData = DashboardJSON.dictionary(json["data"]) ?? [:]
        let nestedURL =
            DashboardJSON.string(nestedData["url"]) ??
            DashboardJSON.string(nestedData["onboarding_url"]) ??
            DashboardJSON.string(nestedData["redirect_url"])

        url = URL(string: directURL ?? nestedURL ?? "")
        walletID =
            DashboardJSON.string(json["wallet_id"]) ??
            DashboardJSON.string(json["walletId"]) ??
            DashboardJSON.string(nestedData["wallet_id"]) ??
            DashboardJSON.string(nestedData["walletId"])
        contactID =
            DashboardJSON.string(json["rapyd_contact_id"]) ??
            DashboardJSON.string(json["contact_id"]) ??
            DashboardJSON.string(json["contactId"]) ??
            DashboardJSON.string(nestedData["rapyd_contact_id"]) ??
            DashboardJSON.string(nestedData["contact_id"]) ??
            DashboardJSON.string(nestedData["contactId"])
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

    nonisolated init(json: [String: Any], fallbackLevel: String? = nil) {
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

enum TrustoraNetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL."
        case .invalidResponse:
            return "Unexpected response format from server."
        case let .httpError(status, payload):
            let trimmedPayload = payload.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmedPayload.isEmpty {
                return "HTTP \(status)"
            }
            return "HTTP \(status): \(trimmedPayload)"
        }
    }
}

private enum DashboardJSON {
    nonisolated(unsafe) private static let iso8601WithFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    nonisolated(unsafe) private static let iso8601Basic: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    nonisolated static func dictionary(_ value: Any?) -> [String: Any]? {
        value as? [String: Any]
    }

    nonisolated static func array(_ value: Any?) -> [Any] {
        value as? [Any] ?? []
    }

    nonisolated static func string(_ value: Any?) -> String? {
        if let string = value as? String {
            let normalized = string.trimmingCharacters(in: .whitespacesAndNewlines)
            return normalized.isEmpty ? nil : normalized
        }

        if let number = value as? NSNumber {
            return number.stringValue
        }

        return nil
    }

    nonisolated static func double(_ value: Any?) -> Double? {
        if let number = value as? NSNumber {
            return number.doubleValue
        }

        if let string = string(value) {
            let normalized = string.replacingOccurrences(of: ",", with: ".")
            return Double(normalized)
        }

        return nil
    }

    nonisolated static func int(_ value: Any?) -> Int? {
        if let number = value as? NSNumber {
            return number.intValue
        }

        if let string = string(value) {
            return Int(string)
        }

        return nil
    }

    nonisolated static func bool(_ value: Any?) -> Bool? {
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

    nonisolated static func date(_ value: Any?) -> Date? {
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
        baseAPIURL: URL = URL(string: "https://previewbe.trustora.ro/api")!,
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

    func getProjectCreationServices(
        page: Int = 1,
        limit: Int = 2,
        search: String? = nil,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> ProjectCreationServicesPage {
        var queryItems = [
            URLQueryItem(name: "page", value: String(max(1, page))),
            URLQueryItem(name: "limit", value: String(max(1, limit))),
        ]
        if let search, !search.trimmed.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search.trimmed))
        }

        let payload = try await requestJSON(
            path: "services/categories/grouped",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return projectCreationServicesPage(
            from: payload,
            language: language,
            fallbackPage: page,
            fallbackLimit: limit
        )
    }

    func recommendProjectCreationServices(
        brief: String,
        language: String,
        bearerToken: String
    ) async throws -> [ProjectCreationServiceRecommendation] {
        let body = try JSONSerialization.data(withJSONObject: ["brief": brief], options: [])
        let payload = try await requestJSON(
            path: "ai/recommend-services",
            method: "POST",
            queryItems: [],
            language: language,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )

        return projectCreationServiceRecommendations(from: payload, language: language)
    }

    func buildProjectCreationBrief(
        locale: String,
        messages: [ProjectCreationAIMessage],
        bearerToken: String
    ) async throws -> ProjectCreationAIBriefResponse {
        let bodyObject: [String: Any] = [
            "locale": locale,
            "messages": messages.map { ["role": $0.role, "content": $0.content] },
        ]
        let body = try JSONSerialization.data(withJSONObject: bodyObject, options: [])
        let payload = try await requestJSON(
            path: "ai/brief-builder",
            method: "POST",
            queryItems: [],
            language: locale,
            currency: nil,
            body: body,
            bearerToken: bearerToken
        )

        guard let response = normalizeProjectCreationAIBriefResponse(from: payload, language: locale) else {
            throw TrustoraNetworkError.invalidResponse
        }
        return response
    }

    func getProjectCreationBriefResult(
        id: String,
        locale: String,
        bearerToken: String
    ) async throws -> ProjectCreationAIBriefResponse {
        let payload = try await requestJSON(
            path: "ai/brief-builder/\(id)",
            method: "GET",
            queryItems: [],
            language: locale,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        guard let response = normalizeProjectCreationAIBriefResponse(from: payload, language: locale) else {
            throw TrustoraNetworkError.invalidResponse
        }
        return response
    }

    func normalizeProjectCreationAIBriefRealtimePayload(
        _ payload: Any,
        language: String
    ) -> ProjectCreationAIBriefResponse? {
        normalizeProjectCreationAIBriefResponse(from: payload, language: language)
    }

    func extractProjectCreationBriefResultID(from payload: Any) -> String? {
        let root = projectCreationDictionary(payload) ?? [:]
        let source = projectCreationDictionary(root["result"])
            ?? projectCreationDictionary(root["data"])
            ?? root
        let sourcePayload = projectCreationDictionary(source["payload"])
        let rootPayload = projectCreationDictionary(root["payload"])
        let dataPayload = projectCreationDictionary(projectCreationDictionary(root["data"])?["payload"])
        let sourceResponsePayload = projectCreationDictionary(source["response_payload"])
        let rootResponsePayload = projectCreationDictionary(root["response_payload"])
        let sourceDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(root["debug"])?["response_payload"]
        )

        let candidates: [String?] = [
            DashboardJSON.string(source["brief_result_id"]),
            DashboardJSON.string(root["brief_result_id"]),
            DashboardJSON.string(source["id"]),
            DashboardJSON.string(root["id"]),
            DashboardJSON.string(sourceResponsePayload?["brief_result_id"]),
            DashboardJSON.string(rootResponsePayload?["brief_result_id"]),
            DashboardJSON.string(sourceDebugResponsePayload?["brief_result_id"]),
            DashboardJSON.string(rootDebugResponsePayload?["brief_result_id"]),
            DashboardJSON.string(sourcePayload?["brief_result_id"]),
            DashboardJSON.string(rootPayload?["brief_result_id"]),
            DashboardJSON.string(dataPayload?["brief_result_id"]),
            DashboardJSON.string(sourcePayload?["id"]),
            DashboardJSON.string(rootPayload?["id"]),
            DashboardJSON.string(dataPayload?["id"]),
        ]

        return candidates.compactMap { $0?.nilIfEmpty }.first
    }

    func extractProjectCreationBriefFailureMessage(from payload: Any) -> String? {
        let root = projectCreationDictionary(payload) ?? [:]
        let source = projectCreationDictionary(root["result"])
            ?? projectCreationDictionary(root["data"])
            ?? root
        let sourcePayload = projectCreationDictionary(source["payload"])
        let rootPayload = projectCreationDictionary(root["payload"])
        let dataPayload = projectCreationDictionary(projectCreationDictionary(root["data"])?["payload"])
        let sourceResponsePayload = projectCreationDictionary(source["response_payload"])
        let rootResponsePayload = projectCreationDictionary(root["response_payload"])
        let sourceDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(root["debug"])?["response_payload"]
        )

        let candidates: [String?] = [
            DashboardJSON.string(source["errorMessage"]),
            DashboardJSON.string(source["error_message"]),
            DashboardJSON.string(source["message"]),
            DashboardJSON.string(source["error"]),
            DashboardJSON.string(source["reason"]),
            DashboardJSON.string(sourceResponsePayload?["errorMessage"]),
            DashboardJSON.string(sourceResponsePayload?["error_message"]),
            DashboardJSON.string(sourceResponsePayload?["message"]),
            DashboardJSON.string(sourceResponsePayload?["error"]),
            DashboardJSON.string(rootResponsePayload?["errorMessage"]),
            DashboardJSON.string(rootResponsePayload?["error_message"]),
            DashboardJSON.string(rootResponsePayload?["message"]),
            DashboardJSON.string(rootResponsePayload?["error"]),
            DashboardJSON.string(sourceDebugResponsePayload?["errorMessage"]),
            DashboardJSON.string(sourceDebugResponsePayload?["error_message"]),
            DashboardJSON.string(sourceDebugResponsePayload?["message"]),
            DashboardJSON.string(sourceDebugResponsePayload?["error"]),
            DashboardJSON.string(rootDebugResponsePayload?["errorMessage"]),
            DashboardJSON.string(rootDebugResponsePayload?["error_message"]),
            DashboardJSON.string(rootDebugResponsePayload?["message"]),
            DashboardJSON.string(rootDebugResponsePayload?["error"]),
            DashboardJSON.string(sourcePayload?["errorMessage"]),
            DashboardJSON.string(sourcePayload?["error_message"]),
            DashboardJSON.string(sourcePayload?["message"]),
            DashboardJSON.string(sourcePayload?["error"]),
            DashboardJSON.string(rootPayload?["errorMessage"]),
            DashboardJSON.string(rootPayload?["error_message"]),
            DashboardJSON.string(rootPayload?["message"]),
            DashboardJSON.string(rootPayload?["error"]),
            DashboardJSON.string(dataPayload?["errorMessage"]),
            DashboardJSON.string(dataPayload?["error_message"]),
            DashboardJSON.string(dataPayload?["message"]),
            DashboardJSON.string(dataPayload?["error"]),
            DashboardJSON.string(root["message"]),
            DashboardJSON.string(root["error"]),
        ]

        return candidates.compactMap { $0?.nilIfEmpty }.first
    }

    func recommendProjectCreationProviders(
        projectTitle: String,
        description: String,
        services: [ProjectCreationProviderServiceInput],
        specificRequirements: [String],
        language: String,
        bearerToken: String
    ) async throws -> [String: [ProjectCreationProviderCandidate]] {
        let servicesPayload: [[String: Any]] = services.map { service in
            var row: [String: Any] = ["name": service.name]
            if let id = service.id, !id.isEmpty {
                row["id"] = id
            }
            return row
        }

        var bodyObject: [String: Any] = [
            "project_title": projectTitle,
            "description": description,
            "services": servicesPayload,
            "top_per_service": 2,
            "candidate_limit": 50,
        ]
        if !specificRequirements.isEmpty {
            bodyObject["specific_requirements"] = specificRequirements
        }

        let payload = try await requestJSON(
            path: "ai/recommend-providers",
            method: "POST",
            queryItems: [],
            language: language,
            currency: nil,
            body: try JSONSerialization.data(withJSONObject: bodyObject, options: []),
            bearerToken: bearerToken
        )

        return projectCreationRecommendedProviders(from: payload)
    }

    func createClientProject(
        payload: ProjectCreationCreatePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> DashboardProjectSummary? {
        let encodedBody = try JSONEncoder().encode(payload)
        let response = try await requestJSON(
            path: "projects",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: encodedBody,
            bearerToken: bearerToken
        )

        if let project = extractProjectDictionary(response) {
            return DashboardProjectSummary(json: project)
        }

        return nil
    }

    func oauthRedirectURL(for provider: ProjectCreationOAuthProvider) -> URL? {
        guard var components = URLComponents(url: baseAPIURL, resolvingAgainstBaseURL: false) else {
            return nil
        }

        if components.path.hasSuffix("/api") {
            components.path = String(components.path.dropLast(4))
        }
        if components.path.hasSuffix("/") {
            components.path.removeLast()
        }

        let providerPath = "/auth/\(provider.rawValue)/redirect"
        components.path += providerPath
        components.query = nil
        components.fragment = nil
        return components.url
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

    func getAdminDashboardStats(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminDashboardStats {
        let jsonObject = try await requestJSON(
            path: "admin/stats",
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

        if let dataDictionary = DashboardJSON.dictionary(dictionary["data"]) {
            return AdminDashboardStats(json: dataDictionary)
        }

        return AdminDashboardStats(json: dictionary)
    }

    func getAdminUsers(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminUsersCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let jsonObject = try await requestJSON(
            path: "admin/users",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminUsersCollection(payload: jsonObject)
    }

    func getAdminCalls(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminCallsCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let jsonObject = try await requestJSON(
            path: "admin/calls",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminCallsCollection(payload: jsonObject, language: language)
    }

    func getAdminOrders(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminOrdersCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let jsonObject = try await requestJSON(
            path: "admin/orders",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminOrdersCollection(payload: jsonObject, language: language)
    }

    func getAdminOrder(
        orderID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminOrderSummary {
        let payload = try await requestJSON(
            path: "orders/\(orderID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let row = extractAdminOrderRows(payload).first else {
            throw TrustoraNetworkError.invalidResponse
        }

        return AdminOrderSummary(json: row, language: language)
    }

    func updateAdminOrder(
        orderID: String,
        status: String,
        adminNotes: String?,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminOrderSummary? {
        var body: [String: Any] = [
            "status": status.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
        ]

        if let adminNotes {
            body["adminNotes"] = adminNotes
            body["admin_notes"] = adminNotes
        } else {
            body["adminNotes"] = NSNull()
            body["admin_notes"] = NSNull()
        }

        let bodyData = try JSONSerialization.data(withJSONObject: body, options: [])
        let payload = try await requestJSON(
            path: "orders/\(orderID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let row = extractAdminOrderRows(payload).first else {
            return nil
        }

        return AdminOrderSummary(json: row, language: language)
    }

    func updateAdminCallStatus(
        callID: String,
        status: String,
        note: String?,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        var body: [String: Any] = [
            "status": status.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
        ]

        if let note {
            body["note"] = note
        } else {
            body["note"] = NSNull()
        }

        let bodyData = try JSONSerialization.data(withJSONObject: body, options: [])

        _ = try await requestJSON(
            path: "admin/calls/\(callID)/status",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )
    }

    func createAdminUser(
        payload: AdminCreateUserPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> TrustoraAuthUser? {
        let bodyData = try JSONEncoder().encode(payload)
        let jsonObject = try await requestJSON(
            path: "admin/users",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let dictionary = DashboardJSON.dictionary(jsonObject) else {
            return nil
        }

        if let user = TrustoraAuthUser.from(jsonObject: dictionary["user"]) {
            return user
        }

        if let dataDictionary = DashboardJSON.dictionary(dictionary["data"]) {
            if let user = TrustoraAuthUser.from(jsonObject: dataDictionary["user"]) {
                return user
            }
            if let user = TrustoraAuthUser.from(jsonObject: dataDictionary) {
                return user
            }
        }

        return TrustoraAuthUser.from(jsonObject: dictionary)
    }

    func updateAdminUserStatus(
        userID: String,
        status: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let bodyData = try JSONSerialization.data(
            withJSONObject: ["status": status],
            options: []
        )

        _ = try await requestJSON(
            path: "admin/users/\(userID)/status",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )
    }

    func deleteAdminUser(
        userID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "admin/users/\(userID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func setAdminUserSuperuser(
        userID: String,
        isSuperuser: Bool,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let endpoint = isSuperuser
            ? "admin/access/users/\(userID)/remove-super"
            : "admin/access/users/\(userID)/make-super"

        _ = try await requestJSON(
            path: endpoint,
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func getAdminRoles(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        search: String? = nil,
        page: Int = 1,
        pageSize: Int = 10
    ) async throws -> AdminRolesCollection {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(max(1, page))),
            URLQueryItem(name: "page_size", value: String(max(1, pageSize))),
        ]
        if let search, !search.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search.trimmingCharacters(in: .whitespacesAndNewlines)))
        }

        let payload = try await requestJSON(
            path: "admin/access",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminRolesCollection(payload: payload)
    }

    func getAdminRolesLite(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [AdminRoleLite] {
        let payload = try await requestJSON(
            path: "admin/access",
            method: "GET",
            queryItems: [URLQueryItem(name: "page_size", value: "1000")],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        let collection = AdminRolesCollection(payload: payload)
        return collection.roles.map { AdminRoleLite(id: $0.id, name: $0.name, slug: $0.slug) }
    }

    func getAdminRole(
        roleID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminRoleDetail {
        let payload = try await requestJSON(
            path: "admin/access/\(roleID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(payload) {
            if let dataDictionary = DashboardJSON.dictionary(dictionary["data"]) {
                return AdminRoleDetail(json: dataDictionary)
            }
            return AdminRoleDetail(json: dictionary)
        }

        throw TrustoraNetworkError.invalidResponse
    }

    func getAdminPermissionGroups(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [AdminPermissionGroup] {
        let payload = try await requestJSON(
            path: "admin/access/permissions",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]] = {
            if let array = payload as? [[String: Any]] {
                return array
            }
            let root = DashboardJSON.dictionary(payload) ?? [:]
            if let direct = root["data"] as? [[String: Any]] {
                return direct
            }
            if let direct = root["permissions"] as? [[String: Any]] {
                return direct
            }
            if root["id"] != nil {
                return [root]
            }
            return []
        }()

        return rows.map(AdminPermissionGroup.init)
    }

    func getAdminRolePermissionSlugs(
        roleSlug: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [String] {
        let payload = try await requestJSON(
            path: "admin/access/slug/\(roleSlug)/permissions",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let array = payload as? [Any] {
            return array.compactMap { DashboardJSON.string($0) }
        }

        let root = DashboardJSON.dictionary(payload) ?? [:]
        if let slugs = root["permission_slugs"] as? [Any] {
            return slugs.compactMap { DashboardJSON.string($0) }
        }
        if let slugs = root["permission_slug"] as? [Any] {
            return slugs.compactMap { DashboardJSON.string($0) }
        }
        if let permissions = root["permissions"] as? [[String: Any]] {
            return permissions.compactMap { DashboardJSON.string($0["slug"]) }
        }
        if let permissions = root["permissions"] as? [Any] {
            return permissions.compactMap { DashboardJSON.string($0) }
        }
        if let data = DashboardJSON.dictionary(root["data"]) {
            if let slugs = data["permission_slugs"] as? [Any] {
                return slugs.compactMap { DashboardJSON.string($0) }
            }
            if let permissions = data["permissions"] as? [[String: Any]] {
                return permissions.compactMap { DashboardJSON.string($0["slug"]) }
            }
        }

        return []
    }

    func createAdminRole(
        payload: AdminCreateRolePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminRoleDetail? {
        let jsonObject = try await requestJSON(
            path: "admin/access",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let dictionary = DashboardJSON.dictionary(jsonObject) else {
            return nil
        }

        if let roleDictionary = DashboardJSON.dictionary(dictionary["role"]) {
            return AdminRoleDetail(json: roleDictionary)
        }
        if let dataDictionary = DashboardJSON.dictionary(dictionary["data"]) {
            return AdminRoleDetail(json: dataDictionary)
        }
        return AdminRoleDetail(json: dictionary)
    }

    func updateAdminRole(
        roleID: String,
        payload: AdminUpdateRolePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminRoleDetail? {
        let jsonObject = try await requestJSON(
            path: "admin/access/\(roleID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let dictionary = DashboardJSON.dictionary(jsonObject) else {
            return nil
        }

        if let roleDictionary = DashboardJSON.dictionary(dictionary["role"]) {
            return AdminRoleDetail(json: roleDictionary)
        }
        if let dataDictionary = DashboardJSON.dictionary(dictionary["data"]) {
            return AdminRoleDetail(json: dataDictionary)
        }
        return AdminRoleDetail(json: dictionary)
    }

    func updateAdminRoleSortOrder(
        roleID: String,
        sortOrder: Int,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let body = try JSONSerialization.data(withJSONObject: ["sortOrder": sortOrder], options: [])

        _ = try await requestJSON(
            path: "admin/access/\(roleID)/sort-order",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: body,
            bearerToken: bearerToken
        )
    }

    func updateAdminRolePermissionsBySlug(
        roleID: String,
        permissionSlugs: [String],
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let normalized = permissionSlugs
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        let body = try JSONSerialization.data(
            withJSONObject: ["permission_slugs": normalized],
            options: []
        )

        _ = try await requestJSON(
            path: "admin/access/\(roleID)/sync-permission",
            method: "PUT",
            queryItems: [],
            language: language,
            currency: currency,
            body: body,
            bearerToken: bearerToken
        )
    }

    func deleteAdminRole(
        roleID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "roles/\(roleID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func getAdminServices(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminServicesCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let jsonObject = try await requestJSON(
            path: "admin/services",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminServicesCollection(payload: jsonObject, language: language)
    }

    func getAdminService(
        serviceID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminServiceDetail {
        let jsonObject = try await requestJSON(
            path: "services/\(serviceID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let serviceRow = extractAdminServiceRows(jsonObject).first else {
            throw TrustoraNetworkError.invalidResponse
        }

        return AdminServiceDetail(json: serviceRow, language: language)
    }

    func createAdminService(
        payload: AdminCreateServicePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminServiceDetail? {
        let bodyData = try JSONEncoder().encode(payload)
        let jsonObject = try await requestJSON(
            path: "admin/services",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let serviceRow = extractAdminServiceRows(jsonObject).first else {
            return nil
        }

        return AdminServiceDetail(json: serviceRow, language: language)
    }

    func updateAdminService(
        serviceID: String,
        payload: AdminUpdateServicePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminServiceDetail? {
        let bodyData = try JSONEncoder().encode(payload)
        let jsonObject = try await requestJSON(
            path: "admin/services/\(serviceID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let serviceRow = extractAdminServiceRows(jsonObject).first else {
            return nil
        }

        return AdminServiceDetail(json: serviceRow, language: language)
    }

    func updateAdminServiceStatus(
        serviceID: String,
        status: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let bodyData = try JSONSerialization.data(
            withJSONObject: ["status": status],
            options: []
        )

        _ = try await requestJSON(
            path: "admin/services/\(serviceID)/status",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )
    }

    func deleteAdminService(
        serviceID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "admin/services/\(serviceID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func getAdminCategories(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminCategoriesCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let jsonObject = try await requestJSON(
            path: "admin/categories",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminCategoriesCollection(payload: jsonObject, language: language)
    }

    func getAdminCategory(
        categoryID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminCategoryDetail {
        let jsonObject = try await requestJSON(
            path: "admin/categories/\(categoryID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let categoryRow = extractAdminCategoryRows(jsonObject).first else {
            throw TrustoraNetworkError.invalidResponse
        }

        return AdminCategoryDetail(json: categoryRow, language: language)
    }

    func createAdminCategory(
        payload: AdminCategoryPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminCategoryDetail? {
        let bodyData = try buildAdminCategoryPayloadData(payload)
        let jsonObject = try await requestJSON(
            path: "admin/categories",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let categoryRow = extractAdminCategoryRows(jsonObject).first else {
            return nil
        }

        return AdminCategoryDetail(json: categoryRow, language: language)
    }

    func updateAdminCategory(
        categoryID: String,
        payload: AdminCategoryPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminCategoryDetail? {
        let bodyData = try buildAdminCategoryPayloadData(payload)
        let jsonObject = try await requestJSON(
            path: "admin/categories/\(categoryID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: bodyData,
            bearerToken: bearerToken
        )

        guard let categoryRow = extractAdminCategoryRows(jsonObject).first else {
            return nil
        }

        return AdminCategoryDetail(json: categoryRow, language: language)
    }

    func deleteAdminCategory(
        categoryID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "admin/categories/\(categoryID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func getAdminCategorySlug(
        categoryID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> String? {
        let jsonObject = try await requestJSON(
            path: "admin/categories/\(categoryID)/slug",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let row = DashboardJSON.dictionary(jsonObject) {
            if let direct = DashboardJSON.string(row["slug"]) {
                return direct
            }
            if let dataSlug = DashboardJSON.string(DashboardJSON.dictionary(row["data"])?["slug"]) {
                return dataSlug
            }
        }

        return nil
    }

    func getAdminLegalClauses(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminLegalClausesCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let payload = try await requestJSON(
            path: "admin/legal/clauses",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminLegalClausesCollection(payload: payload)
    }

    func getAdminLegalClause(
        clauseID: String,
        languageFilter: String?,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminLegalClause {
        let requestedLanguage = languageFilter?.trimmed.nilIfEmpty ?? "ro"
        let payload = try await requestJSON(
            path: "admin/legal/clauses/\(clauseID)",
            method: "GET",
            queryItems: [URLQueryItem(name: "lang", value: requestedLanguage)],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let row = extractAdminLegalClauseRows(payload).first else {
            throw TrustoraNetworkError.invalidResponse
        }

        return AdminLegalClause(json: row)
    }

    func getAdminLegalClauseCategories(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [String] {
        let payload = try await requestJSON(
            path: "admin/legal/clauses/category",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let values = payload as? [String] {
            return values
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
        }

        let rows = DashboardJSON.array(payload)
            .compactMap { DashboardJSON.string($0) }
            .filter { !$0.isEmpty }
        if !rows.isEmpty {
            return rows
        }

        if let dictionary = DashboardJSON.dictionary(payload) {
            if let list = dictionary["categories"] as? [String] {
                return list.map(\.trimmed).filter { !$0.isEmpty }
            }
            if let list = DashboardJSON.dictionary(dictionary["data"])?["categories"] as? [String] {
                return list.map(\.trimmed).filter { !$0.isEmpty }
            }
            if let dataList = dictionary["data"] as? [String] {
                return dataList.map(\.trimmed).filter { !$0.isEmpty }
            }
        }

        return []
    }

    func createAdminLegalClause(
        payload: AdminLegalClausePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminLegalClause? {
        let response = try await requestJSON(
            path: "admin/legal/clauses",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let row = extractAdminLegalClauseRows(response).first else {
            return nil
        }

        return AdminLegalClause(json: row)
    }

    func updateAdminLegalClause(
        clauseID: String,
        payload: AdminLegalClauseUpdatePayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminLegalClause? {
        let response = try await requestJSON(
            path: "admin/legal/clauses/\(clauseID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let row = extractAdminLegalClauseRows(response).first else {
            return nil
        }

        return AdminLegalClause(json: row)
    }

    func deleteAdminLegalClause(
        clauseID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "admin/legal/clauses/\(clauseID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func getAdminNewsletterTemplates(
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> [String] {
        let payload = try await requestJSON(
            path: "newsletter/templates",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(payload) {
            if let templates = dictionary["templates"] as? [String] {
                return templates.map(\.trimmed).filter { !$0.isEmpty }
            }
            if let nestedTemplates = DashboardJSON.dictionary(dictionary["data"])?["templates"] as? [String] {
                return nestedTemplates.map(\.trimmed).filter { !$0.isEmpty }
            }
        }

        let arrayTemplates = DashboardJSON.array(payload)
            .compactMap { DashboardJSON.string($0) }
            .filter { !$0.isEmpty }
        return arrayTemplates
    }

    func getAdminNewsletterTemplateContent(
        template: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> String {
        let payload = try await requestJSON(
            path: "newsletter/templates/\(template)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(payload) {
            if let content = DashboardJSON.string(dictionary["content"]) {
                return content
            }
            if let nestedContent = DashboardJSON.string(DashboardJSON.dictionary(dictionary["data"])?["content"]) {
                return nestedContent
            }
        }

        return ""
    }

    func getAdminNewsletterSubscribers(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        perPage: Int,
        onlyActive: Bool
    ) async throws -> AdminNewsletterSubscribersCollection {
        let queryItems = [
            URLQueryItem(name: "per_page", value: String(max(1, perPage))),
            URLQueryItem(name: "only_active", value: onlyActive ? "true" : "false"),
        ]

        let payload = try await requestJSON(
            path: "newsletter",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminNewsletterSubscribersCollection(payload: payload)
    }

    func sendAdminNewsletter(
        payload: AdminSendNewsletterPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> Int {
        let response = try await requestJSON(
            path: "newsletter/send",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        if let dictionary = DashboardJSON.dictionary(response) {
            if let sent = DashboardJSON.int(dictionary["sent"]) {
                return sent
            }
            if let dataSent = DashboardJSON.int(DashboardJSON.dictionary(dictionary["data"])?["sent"]) {
                return dataSent
            }
        }

        return 0
    }

    func getAdminServiceCategories(
        language: String,
        bearerToken: String
    ) async throws -> [AdminServiceCategoryOption] {
        let jsonObject = try await requestJSON(
            path: "categories",
            method: "GET",
            queryItems: [],
            language: language,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let rows: [[String: Any]] = {
            if let directRows = jsonObject as? [[String: Any]] {
                return directRows
            }

            let root = DashboardJSON.dictionary(jsonObject) ?? [:]
            if let categories = root["categories"] as? [[String: Any]] {
                return categories
            }
            if let nestedCategories = DashboardJSON.dictionary(root["data"])?["categories"] as? [[String: Any]] {
                return nestedCategories
            }
            if let rootDataArray = root["data"] as? [[String: Any]] {
                return rootDataArray
            }
            return []
        }()

        return rows
            .map { AdminServiceCategoryOption(json: $0, language: language) }
            .filter { !$0.id.isEmpty && !$0.name.isEmpty }
    }

    func getAdminServiceCategorySlug(
        categoryID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> String? {
        try await getAdminCategorySlug(
            categoryID: categoryID,
            language: language,
            currency: currency,
            bearerToken: bearerToken
        )
    }

    func getAdminServiceDeliveryProviders(
        language: String,
        currency: AppCurrency,
        bearerToken: String?
    ) async throws -> [AdminDeliveryProviderOption] {
        let jsonObject = try await requestJSON(
            path: "general/delivery-providers",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        if let root = DashboardJSON.dictionary(jsonObject),
           let dataRows = root["data"] as? [[String: Any]] {
            return dataRows.compactMap(AdminDeliveryProviderOption.init)
        }

        return extractDictionaryArray(jsonObject).compactMap(AdminDeliveryProviderOption.init)
    }

    func getAdminTests(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        params: [String: String?] = [:]
    ) async throws -> AdminTestsCollection {
        let queryItems = params
            .sorted { $0.key < $1.key }
            .compactMap { key, value -> URLQueryItem? in
                guard let value else { return nil }
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return nil }
                return URLQueryItem(name: key, value: trimmed)
            }

        let payload = try await requestJSON(
            path: "admin/tests",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminTestsCollection(payload: payload, language: language)
    }

    func getAdminTest(
        testID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminTestDetail {
        let payload = try await requestJSON(
            path: "tests/\(testID)",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        guard let testRow = extractAdminTestRows(payload).first else {
            throw TrustoraNetworkError.invalidResponse
        }

        return AdminTestDetail(json: testRow, language: language)
    }

    func createAdminTest(
        payload: AdminCreateTestPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminTestDetail? {
        let response = try await requestJSON(
            path: "admin/tests",
            method: "POST",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let testRow = extractAdminTestRows(response).first else {
            return nil
        }

        return AdminTestDetail(json: testRow, language: language)
    }

    func updateAdminTest(
        testID: String,
        payload: AdminUpdateTestPayload,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminTestDetail? {
        let response = try await requestJSON(
            path: "tests/\(testID)",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )

        guard let testRow = extractAdminTestRows(response).first else {
            return nil
        }

        return AdminTestDetail(json: testRow, language: language)
    }

    func deleteAdminTest(
        testID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        _ = try await requestJSON(
            path: "tests/\(testID)",
            method: "DELETE",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )
    }

    func updateAdminTestStatus(
        testID: String,
        status: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws {
        let body = try JSONSerialization.data(
            withJSONObject: [
                "status": status.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
            ],
            options: []
        )

        _ = try await requestJSON(
            path: "tests/\(testID)/status",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: currency,
            body: body,
            bearerToken: bearerToken
        )
    }

    func getAdminTestStatistics(
        testID: String,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminTestStatistics {
        let payload = try await requestJSON(
            path: "admin/tests/\(testID)/statistics",
            method: "GET",
            queryItems: [],
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminTestStatistics(payload: payload, language: language)
    }

    func getAdminEarlyAccessGrouped(
        language: String,
        currency: AppCurrency,
        bearerToken: String,
        page: Int? = nil,
        perPage: Int? = nil
    ) async throws -> AdminEarlyAccessGroupedCollection {
        var queryItems: [URLQueryItem] = []
        if let page, page > 0 {
            queryItems.append(URLQueryItem(name: "page", value: String(page)))
        }
        if let perPage, perPage > 0 {
            queryItems.append(URLQueryItem(name: "per_page", value: String(perPage)))
        }

        let jsonObject = try await requestJSON(
            path: "early-access/grouped",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminEarlyAccessGroupedCollection(payload: jsonObject)
    }

    func getAdminActivities(
        page: Int,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminActivitiesCollection {
        let queryItems = [
            URLQueryItem(name: "page", value: String(max(1, page))),
        ]

        let payload = try await requestJSON(
            path: "activities",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminActivitiesCollection(payload: payload)
    }

    func getAdminAuditLogs(
        page: Int,
        event: String?,
        userID: Int?,
        subjectType: String?,
        dateFrom: String?,
        dateTo: String?,
        language: String,
        currency: AppCurrency,
        bearerToken: String
    ) async throws -> AdminAuditLogsCollection {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: String(max(1, page))),
        ]
        if let event, !event.isEmpty {
            queryItems.append(URLQueryItem(name: "event", value: event))
        }
        if let userID {
            queryItems.append(URLQueryItem(name: "user_id", value: String(userID)))
        }
        if let subjectType, !subjectType.isEmpty {
            queryItems.append(URLQueryItem(name: "subject_type", value: subjectType))
        }
        if let dateFrom, !dateFrom.isEmpty {
            queryItems.append(URLQueryItem(name: "date_from", value: dateFrom))
        }
        if let dateTo, !dateTo.isEmpty {
            queryItems.append(URLQueryItem(name: "date_to", value: dateTo))
        }

        let payload = try await requestJSON(
            path: "admin/audit-logs",
            method: "GET",
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: nil,
            bearerToken: bearerToken
        )

        return AdminAuditLogsCollection(payload: payload)
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
        let request = try makeRequest(
            path: "rapyd/onboard",
            method: "POST",
            queryItems: [URLQueryItem(name: "language", value: language)],
            language: nil,
            currency: nil,
            body: nil,
            forceJSONContentType: true,
            bearerToken: bearerToken
        )

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)

        if data.isEmpty {
            return DashboardRapydOnboarding(json: [:])
        }

        let parsed: Any = (try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]))
            ?? (String(data: data, encoding: .utf8) ?? "")

        if let dictionary = DashboardJSON.dictionary(parsed) {
            return DashboardRapydOnboarding(json: dictionary)
        }

        if let array = parsed as? [Any] {
            if let firstDictionary = array.compactMap({ DashboardJSON.dictionary($0) }).first {
                return DashboardRapydOnboarding(json: firstDictionary)
            }

            if let firstString = array.compactMap({ DashboardJSON.string($0) }).first {
                return DashboardRapydOnboarding(json: ["url": firstString])
            }
        }

        if let asURLString = DashboardJSON.string(parsed) {
            return DashboardRapydOnboarding(json: ["url": asURLString])
        }

        throw TrustoraNetworkError.invalidResponse
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

    func getProviderProfile(
        bearerToken: String,
        language: String
    ) async throws -> ProviderProfileData {
        let payload = try await requestJSON(
            path: "users/providers/profile",
            method: "GET",
            queryItems: [],
            language: language,
            currency: nil,
            body: nil,
            bearerToken: bearerToken
        )

        let dictionary = extractProviderProfileDictionary(from: payload)
        return providerProfile(from: dictionary)
    }

    func updateProviderProfile(
        _ payload: ProviderProfileUpdatePayload,
        bearerToken: String,
        language: String
    ) async throws {
        _ = try await requestJSON(
            path: "users/profile",
            method: "PATCH",
            queryItems: [],
            language: language,
            currency: nil,
            body: try payload.requestBody(),
            bearerToken: bearerToken
        )
    }

    func getProviderProfileLanguages(language: String) async throws -> [ProviderProfileLanguageOption] {
        let payload = try await requestJSON(
            path: "languages",
            method: "GET",
            queryItems: [],
            language: language,
            currency: nil,
            body: nil,
            bearerToken: nil
        )

        let rows = extractDictionaryArray(payload)
        return rows.compactMap { row in
            let id = DashboardJSON.string(row["id"]) ?? DashboardJSON.string(row["code"]) ?? UUID().uuidString
            let name = DashboardJSON.string(row["name"]) ?? DashboardJSON.string(row["language"]) ?? ""
            guard !name.isEmpty else {
                return nil
            }

            return ProviderProfileLanguageOption(
                id: id,
                name: name,
                code: DashboardJSON.string(row["code"]) ?? name,
                locale: DashboardJSON.string(row["locale"]),
                flag: DashboardJSON.string(row["flag"]) ?? "",
                timezone: DashboardJSON.string(row["timezone"])
            )
        }
        .uniqued { $0.id }
    }

    func uploadAvatar(
        _ imageData: Data,
        fileName: String,
        mimeType: String = "image/jpeg",
        bearerToken: String,
        language: String? = nil
    ) async throws -> String? {
        guard var components = URLComponents(
            url: baseAPIURL.appendingPathComponent("users/avatar"),
            resolvingAgainstBaseURL: false
        ) else {
            throw TrustoraNetworkError.invalidURL
        }

        if let language, !language.isEmpty {
            components.queryItems = [URLQueryItem(name: "language", value: language)]
        }

        guard let url = components.url else {
            throw TrustoraNetworkError.invalidURL
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()

        func append(_ string: String) {
            body.append(Data(string.utf8))
        }

        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"avatar\"; filename=\"\(fileName)\"\r\n")
        append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(imageData)
        append("\r\n")
        append("--\(boundary)--\r\n")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)

        guard !data.isEmpty else {
            return nil
        }

        let payload = (try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])) ?? [:]
        return extractUploadedAvatarURL(from: payload)
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

    private func extractProviderProfileDictionary(from payload: Any) -> [String: Any] {
        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return [:]
        }

        if dictionary["firstName"] != nil ||
            dictionary["first_name"] != nil ||
            dictionary["profile"] != nil ||
            dictionary["languages"] != nil {
            return dictionary
        }

        if let data = DashboardJSON.dictionary(dictionary["data"]) {
            if data["firstName"] != nil ||
                data["first_name"] != nil ||
                data["profile"] != nil ||
                data["languages"] != nil {
                return data
            }
        }

        if let user = DashboardJSON.dictionary(dictionary["user"]) {
            return user
        }

        if let provider = DashboardJSON.dictionary(dictionary["provider"]) {
            return provider
        }

        return dictionary
    }

    private func providerProfile(from dictionary: [String: Any]) -> ProviderProfileData {
        let profile = DashboardJSON.dictionary(dictionary["profile"]) ?? [:]
        let companyObject = DashboardJSON.dictionary(dictionary["company"])

        var workingHours = ProviderProfileAvailability.empty.workingHours
        for day in ProviderProfileWeekDay.allCases {
            let defaults = ProviderProfileWorkingHour.defaults(for: day)
            let prefix = "working_\(day.rawValue)"
            workingHours[day] = ProviderProfileWorkingHour(
                start: normalizedProviderProfileTime(profile["\(prefix)_from"], fallback: defaults.start),
                end: normalizedProviderProfileTime(profile["\(prefix)_to"], fallback: defaults.end),
                enabled: DashboardJSON.bool(profile["\(prefix)_enabled"]) ?? defaults.enabled
            )
        }

        let availability = ProviderProfileAvailability(
            status: normalizedProviderProfileStatus(
                DashboardJSON.string(profile["availability"]) ??
                DashboardJSON.string(profile["availability_status"])
            ),
            hoursPerWeek: providerProfileString(
                DashboardJSON.int(profile["working_hours_per_week"]) ??
                Int(DashboardJSON.double(profile["working_hours_per_week"]) ?? -1)
            ) ?? "",
            timezone: DashboardJSON.string(profile["timezone"]) ??
                DashboardJSON.string(dictionary["timezone"]) ??
                ProviderProfileAvailability.empty.timezone,
            responseTime: normalizedProviderProfileDigits(
                DashboardJSON.string(profile["answer_hour"]) ??
                providerProfileString(DashboardJSON.int(profile["answer_hour"])) ??
                DashboardJSON.string(profile["avg_response_time_minutes"]) ??
                providerProfileString(DashboardJSON.int(profile["avg_response_time_minutes"])),
                fallback: ProviderProfileAvailability.empty.responseTime
            ),
            workingHours: workingHours
        )

        let languages = extractDictionaryArray(dictionary["languages"] as Any)
            .map { row in
                ProviderProfileLanguageEntry(
                    name: DashboardJSON.string(row["language"]) ?? DashboardJSON.string(row["name"]) ?? "",
                    level: DashboardJSON.string(row["proficiency"]) ?? DashboardJSON.string(row["level"]) ?? "Basic",
                    flag: DashboardJSON.string(row["flag"]) ?? ""
                )
            }
            .filter { !$0.name.isEmpty }

        let certifications = extractDictionaryArray(dictionary["certifications"] as Any)
            .map { row in
                ProviderProfileCertification(
                    name: DashboardJSON.string(row["name"]) ?? "",
                    issuer: DashboardJSON.string(row["issuer_name"]) ?? DashboardJSON.string(row["issuer"]) ?? "",
                    date: DashboardJSON.string(row["issued_at"]) ?? DashboardJSON.string(row["date"]) ?? "",
                    credentialID: DashboardJSON.string(row["credential_id"]) ?? DashboardJSON.string(row["credentialId"]) ?? "",
                    verified: DashboardJSON.bool(row["verified"]) ?? false
                )
            }
            .filter { !$0.name.isEmpty || !$0.issuer.isEmpty }

        let educationRows: [[String: Any]]
        if let rows = dictionary["education"] {
            educationRows = extractDictionaryArray(rows)
        } else {
            educationRows = extractDictionaryArray(dictionary["educations"] as Any)
        }

        let education = educationRows
            .map { row in
                ProviderProfileEducation(
                    degree: DashboardJSON.string(row["degree"]) ?? "",
                    institution: DashboardJSON.string(row["institution"]) ?? "",
                    attendedFrom: DashboardJSON.string(row["attended_from"]) ?? "",
                    attendedTo: DashboardJSON.string(row["attended_to"]) ?? "",
                    studyArea: DashboardJSON.string(row["study_area"]) ?? ""
                )
            }
            .filter { !$0.degree.isEmpty || !$0.institution.isEmpty }

        let workRows: [[String: Any]]
        if let rows = dictionary["work_history"] {
            workRows = extractDictionaryArray(rows)
        } else {
            workRows = extractDictionaryArray(dictionary["workHistory"] as Any)
        }

        let workHistory = workRows
            .map { row in
                ProviderProfileWorkHistory(
                    title: DashboardJSON.string(row["title"]) ?? "",
                    position: DashboardJSON.string(row["position"]) ?? "",
                    company: DashboardJSON.string(row["company"]) ?? "",
                    city: DashboardJSON.string(row["city"]) ?? "",
                    country: DashboardJSON.string(row["country"]) ?? "",
                    startDate: DashboardJSON.string(row["start_date"]) ?? "",
                    endDate: DashboardJSON.string(row["end_date"]) ?? "",
                    description: DashboardJSON.string(row["description"]) ?? "",
                    currentWorking: DashboardJSON.bool(row["current_working"]) ?? false
                )
            }
            .filter { !$0.position.isEmpty || !$0.company.isEmpty || !$0.title.isEmpty }

        let portfolioRows: [[String: Any]]
        if let rows = dictionary["portfolio"] {
            portfolioRows = extractDictionaryArray(rows)
        } else {
            portfolioRows = extractDictionaryArray(dictionary["portfolios"] as Any)
        }

        let portfolio = portfolioRows
            .map { row in
                ProviderProfilePortfolio(
                    title: DashboardJSON.string(row["project_title"]) ?? DashboardJSON.string(row["title"]) ?? "",
                    description: DashboardJSON.string(row["description"]) ?? "",
                    image: DashboardJSON.string(row["image"]) ?? "",
                    role: DashboardJSON.string(row["role"]) ?? "",
                    technologies: DashboardJSON.array(row["technologies_used"] ?? row["technologies"]).compactMap { DashboardJSON.string($0) },
                    url: DashboardJSON.string(row["url"]) ?? ""
                )
            }
            .filter { !$0.title.isEmpty || !$0.description.isEmpty }

        let trustMetrics = ProviderProfileTrustMetrics(
            rating: providerProfileString(DashboardJSON.double(dictionary["rating"])) ?? "-",
            reviewCount: providerProfileString(DashboardJSON.int(dictionary["reviewCount"]) ?? DashboardJSON.int(dictionary["review_count"])) ?? "0",
            jobSuccessScore: providerProfileString(DashboardJSON.double(profile["job_success_score"])) ?? DashboardJSON.string(profile["job_success_score"]) ?? "-",
            totalProjectsCompleted: providerProfileString(DashboardJSON.int(profile["total_projects_completed"])) ?? "0",
            responseRate: providerProfileString(DashboardJSON.double(profile["response_rate"])) ?? DashboardJSON.string(profile["response_rate"]) ?? "-",
            averageResponseTimeMinutes: providerProfileString(DashboardJSON.int(profile["avg_response_time_minutes"])) ?? DashboardJSON.string(profile["avg_response_time_minutes"]) ?? "-",
            kycStatus: DashboardJSON.string(profile["kyc_status"]) ?? "-",
            testVerified: DashboardJSON.bool(dictionary["testVerified"]) ?? DashboardJSON.bool(dictionary["test_verified"]) ?? false,
            callVerified: DashboardJSON.bool(dictionary["callVerified"]) ?? DashboardJSON.bool(dictionary["call_verified"]) ?? false,
            totalEarned: providerProfileMoneyString(fromCents: DashboardJSON.double(profile["total_earned_cents"])),
            badges: DashboardJSON.array(profile["badges"]).compactMap { DashboardJSON.string($0) }
        )

        return ProviderProfileData(
            firstName: DashboardJSON.string(dictionary["firstName"]) ?? DashboardJSON.string(dictionary["first_name"]) ?? "",
            lastName: DashboardJSON.string(dictionary["lastName"]) ?? DashboardJSON.string(dictionary["last_name"]) ?? "",
            email: DashboardJSON.string(dictionary["email"]) ?? "",
            phone: DashboardJSON.string(dictionary["phone"]) ?? "",
            bio: DashboardJSON.string(profile["bio"]) ?? "",
            company: DashboardJSON.string(dictionary["company"]) ??
                DashboardJSON.string(companyObject?["name"]) ??
                DashboardJSON.string(dictionary["company_name"]) ??
                "",
            website: DashboardJSON.string(profile["website"]) ?? DashboardJSON.string(dictionary["website"]) ?? "",
            location: DashboardJSON.string(profile["location"]) ?? "",
            avatar: DashboardJSON.string(dictionary["avatar"]) ?? "",
            companyName: DashboardJSON.string(dictionary["company_name"]) ?? "",
            taxID: DashboardJSON.string(dictionary["tax_id"]) ?? "",
            tradeRegistryNumber: DashboardJSON.string(dictionary["trade_registry_number"]) ?? "",
            billingAddress: DashboardJSON.string(dictionary["billing_address"]) ?? "",
            billingCity: DashboardJSON.string(dictionary["billing_city"]) ?? "",
            billingState: DashboardJSON.string(dictionary["billing_state"]) ?? "",
            billingPostalCode: DashboardJSON.string(dictionary["billing_postal_code"]) ?? "",
            availability: availability,
            languages: languages,
            certifications: certifications,
            education: education,
            workHistory: workHistory,
            portfolio: portfolio,
            trustMetrics: trustMetrics
        )
    }

    private func normalizedProviderProfileStatus(_ value: String?) -> String {
        let normalized = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if ["AVAILABLE", "BUSY", "UNAVAILABLE"].contains(normalized) {
            return normalized
        }
        return "AVAILABLE"
    }

    private func normalizedProviderProfileDigits(_ value: String?, fallback: String) -> String {
        let digits = (value ?? "").filter(\.isNumber)
        return digits.isEmpty ? fallback : digits
    }

    private func normalizedProviderProfileTime(_ value: Any?, fallback: String) -> String {
        let text = DashboardJSON.string(value) ?? ""
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return fallback
        }

        if trimmed.count >= 5 {
            return String(trimmed.prefix(5))
        }

        return fallback
    }

    private func extractUploadedAvatarURL(from payload: Any) -> String? {
        guard let dictionary = payload as? [String: Any] else {
            return nil
        }

        let nestedData = DashboardJSON.dictionary(dictionary["data"])
        let nestedUser = DashboardJSON.dictionary(dictionary["user"])

        return DashboardJSON.string(dictionary["url"]) ??
            DashboardJSON.string(dictionary["avatar"]) ??
            DashboardJSON.string(dictionary["profile_photo_url"]) ??
            DashboardJSON.string(nestedData?["url"]) ??
            DashboardJSON.string(nestedData?["avatar"]) ??
            DashboardJSON.string(nestedData?["profile_photo_url"]) ??
            DashboardJSON.string(nestedUser?["avatar"]) ??
            DashboardJSON.string(nestedUser?["profile_photo_url"])
    }

    private func providerProfileString(_ value: Any?) -> String? {
        if let string = DashboardJSON.string(value), !string.isEmpty {
            return string
        }

        if let number = value as? NSNumber {
            return number.stringValue
        }

        if let double = value as? Double {
            if double.rounded() == double {
                return String(Int(double))
            }
            return String(double)
        }

        if let int = value as? Int {
            return String(int)
        }

        return nil
    }

    private func providerProfileMoneyString(fromCents cents: Double?) -> String? {
        guard let cents else {
            return nil
        }

        let amount = cents / 100
        if amount.rounded() == amount {
            return String(Int(amount))
        }

        return String(format: "%.2f", amount)
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

    private func buildAdminCategoryPayloadData(_ payload: AdminCategoryPayload) throws -> Data {
        let trimmedName = payload.name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedSlug = payload.slug.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedDescription = payload.description.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedIcon = payload.icon.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedParentID = payload.parentID?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasParent = trimmedParentID?.isEmpty == false

        var body: [String: Any] = [
            "name": trimmedName,
            "slug": trimmedSlug,
            "description": trimmedDescription,
            "icon": trimmedIcon,
            "sortOrder": payload.sortOrder,
            "sort_order": payload.sortOrder,
        ]

        if hasParent, let parentID = trimmedParentID {
            body["parentId"] = parentID
            body["parent_id"] = parentID
        } else {
            body["parentId"] = NSNull()
            body["parent_id"] = NSNull()
        }

        return try JSONSerialization.data(withJSONObject: body, options: [])
    }

    private func extractAdminOrderRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let orders = dictionary["orders"] as? [[String: Any]] {
            return orders
        }

        if let order = DashboardJSON.dictionary(dictionary["order"]) {
            return [order]
        }

        if let data = dictionary["data"] as? [[String: Any]] {
            return data
        }

        if let dataObject = DashboardJSON.dictionary(dictionary["data"]) {
            if let dataOrders = dataObject["orders"] as? [[String: Any]] {
                return dataOrders
            }

            if let nestedData = dataObject["data"] as? [[String: Any]] {
                return nestedData
            }

            if let nestedOrder = DashboardJSON.dictionary(dataObject["order"]) {
                return [nestedOrder]
            }

            if dataObject["id"] != nil {
                return [dataObject]
            }
        }

        if dictionary["id"] != nil {
            return [dictionary]
        }

        return []
    }

    private func extractAdminCategoryRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let categories = dictionary["categories"] as? [[String: Any]] {
            return categories
        }

        if let category = DashboardJSON.dictionary(dictionary["category"]) {
            return [category]
        }

        if let data = dictionary["data"] as? [[String: Any]] {
            return data
        }

        if let dataObject = DashboardJSON.dictionary(dictionary["data"]) {
            if let dataCategories = dataObject["categories"] as? [[String: Any]] {
                return dataCategories
            }

            if let nestedData = dataObject["data"] as? [[String: Any]] {
                return nestedData
            }

            if dataObject["id"] != nil {
                return [dataObject]
            }
        }

        if dictionary["id"] != nil {
            return [dictionary]
        }

        return []
    }

    private func extractAdminLegalClauseRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let clauses = dictionary["clauses"] as? [[String: Any]] {
            return clauses
        }

        if let clause = DashboardJSON.dictionary(dictionary["clause"]) {
            return [clause]
        }

        if let data = dictionary["data"] as? [[String: Any]] {
            return data
        }

        if let dataObject = DashboardJSON.dictionary(dictionary["data"]) {
            if let dataClauses = dataObject["clauses"] as? [[String: Any]] {
                return dataClauses
            }

            if let nestedData = dataObject["data"] as? [[String: Any]] {
                return nestedData
            }

            if let nestedClause = DashboardJSON.dictionary(dataObject["clause"]) {
                return [nestedClause]
            }

            if dataObject["id"] != nil {
                return [dataObject]
            }
        }

        if dictionary["id"] != nil {
            return [dictionary]
        }

        return []
    }

    private func extractAdminServiceRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let services = dictionary["services"] as? [[String: Any]] {
            return services
        }

        if let service = DashboardJSON.dictionary(dictionary["service"]) {
            return [service]
        }

        if let data = dictionary["data"] as? [[String: Any]] {
            return data
        }

        if let dataObject = DashboardJSON.dictionary(dictionary["data"]) {
            if let dataServices = dataObject["services"] as? [[String: Any]] {
                return dataServices
            }

            if let nestedData = dataObject["data"] as? [[String: Any]] {
                return nestedData
            }

            if dataObject["id"] != nil {
                return [dataObject]
            }
        }

        if dictionary["id"] != nil {
            return [dictionary]
        }

        return []
    }

    private func extractAdminTestRows(_ payload: Any) -> [[String: Any]] {
        if let list = payload as? [[String: Any]] {
            return list
        }

        guard let dictionary = DashboardJSON.dictionary(payload) else {
            return []
        }

        if let tests = dictionary["tests"] as? [[String: Any]] {
            return tests
        }

        if let test = DashboardJSON.dictionary(dictionary["test"]) {
            return [test]
        }

        if let data = dictionary["data"] as? [[String: Any]] {
            return data
        }

        if let dataObject = DashboardJSON.dictionary(dictionary["data"]) {
            if let dataTests = dataObject["tests"] as? [[String: Any]] {
                return dataTests
            }

            if let nestedData = dataObject["data"] as? [[String: Any]] {
                return nestedData
            }

            if let nestedTest = DashboardJSON.dictionary(dataObject["test"]) {
                return [nestedTest]
            }

            if dataObject["id"] != nil {
                return [dataObject]
            }
        }

        if dictionary["id"] != nil {
            return [dictionary]
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

    private func projectCreationServicesPage(
        from payload: Any,
        language: String,
        fallbackPage: Int,
        fallbackLimit: Int
    ) -> ProjectCreationServicesPage {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let dataObject = DashboardJSON.dictionary(root["data"])
        let pagination = DashboardJSON.dictionary(root["pagination"])
            ?? DashboardJSON.dictionary(dataObject?["pagination"])
            ?? DashboardJSON.dictionary(root["meta"])
            ?? DashboardJSON.dictionary(dataObject?["meta"])

        var rows: [[String: Any]] = []
        if let rawDataObject = DashboardJSON.dictionary(root["data"]) {
            collectProjectCreationServiceRows(
                from: rawDataObject,
                categoryName: nil,
                categoryID: nil,
                subcategoryName: nil,
                into: &rows
            )
        } else {
            collectProjectCreationServiceRows(
                from: payload,
                categoryName: nil,
                categoryID: nil,
                subcategoryName: nil,
                into: &rows
            )
        }

        if rows.isEmpty {
            rows = extractMarketplaceServiceRows(payload)
        }

        var seen = Set<String>()
        var services: [ProjectCreationServiceOption] = []
        services.reserveCapacity(rows.count)

        for row in rows {
            guard let service = projectCreationServiceOption(from: row, language: language) else {
                continue
            }
            if seen.insert(service.id).inserted {
                services.append(service)
            }
        }

        let total = DashboardJSON.int(pagination?["total"])
            ?? DashboardJSON.int(root["total"])
            ?? DashboardJSON.int(dataObject?["total"])
            ?? services.count
        let page = DashboardJSON.int(pagination?["page"])
            ?? DashboardJSON.int(pagination?["current_page"])
            ?? DashboardJSON.int(root["page"])
            ?? DashboardJSON.int(root["current_page"])
            ?? fallbackPage
        let limit = DashboardJSON.int(pagination?["limit"])
            ?? DashboardJSON.int(pagination?["per_page"])
            ?? DashboardJSON.int(root["limit"])
            ?? DashboardJSON.int(root["per_page"])
            ?? fallbackLimit
        let totalPages = DashboardJSON.int(pagination?["total_pages"])
            ?? DashboardJSON.int(pagination?["last_page"])
            ?? DashboardJSON.int(root["total_pages"])
            ?? DashboardJSON.int(root["last_page"])
            ?? max(1, Int(ceil(Double(max(1, total)) / Double(max(1, limit)))))
        let hasMore = DashboardJSON.bool(pagination?["has_more"]) ?? (page < totalPages)

        return ProjectCreationServicesPage(
            services: services,
            page: max(1, page),
            limit: max(1, limit),
            total: max(0, total),
            totalPages: max(1, totalPages),
            hasMore: hasMore
        )
    }

    private func collectProjectCreationServiceRows(
        from payload: Any,
        categoryName: String?,
        categoryID: String?,
        subcategoryName: String?,
        into rows: inout [[String: Any]]
    ) {
        if let array = payload as? [Any] {
            for item in array {
                collectProjectCreationServiceRows(
                    from: item,
                    categoryName: categoryName,
                    categoryID: categoryID,
                    subcategoryName: subcategoryName,
                    into: &rows
                )
            }
            return
        }

        guard let dictionary = DashboardJSON.dictionary(payload), !dictionary.isEmpty else {
            return
        }

        if isProjectCreationServiceDictionary(dictionary) {
            var row = dictionary
            if row["category_name"] == nil, let categoryName, !categoryName.isEmpty {
                row["category_name"] = categoryName
            }
            if row["category_id"] == nil, let categoryID, !categoryID.isEmpty {
                row["category_id"] = categoryID
            }
            if row["subcategory_name"] == nil, let subcategoryName, !subcategoryName.isEmpty {
                row["subcategory_name"] = subcategoryName
            }
            rows.append(row)
            return
        }

        let nextCategoryName =
            DashboardJSON.string(dictionary["category_name"])
            ?? localizedString(from: dictionary["name"], language: Locale.preferredLanguages.first?.prefix(2).description ?? "en")
            ?? categoryName
        let nextCategoryID = DashboardJSON.string(dictionary["category_id"])
            ?? DashboardJSON.string(dictionary["id"])
            ?? categoryID

        for (key, value) in dictionary {
            let lowered = key.lowercased()
            if lowered == "pagination" || lowered == "meta" || lowered == "total" || lowered == "page" {
                continue
            }

            let nextSubcategory: String?
            if lowered == "services" || lowered == "data" || lowered == "categories" {
                nextSubcategory = subcategoryName
            } else if subcategoryName == nil, categoryName != nil {
                nextSubcategory = key
            } else {
                nextSubcategory = subcategoryName
            }

            collectProjectCreationServiceRows(
                from: value,
                categoryName: categoryName ?? nextCategoryName,
                categoryID: nextCategoryID,
                subcategoryName: nextSubcategory,
                into: &rows
            )
        }
    }

    private func isProjectCreationServiceDictionary(_ dictionary: [String: Any]) -> Bool {
        let hasID = DashboardJSON.string(dictionary["id"]) != nil
            || DashboardJSON.string(dictionary["service_id"]) != nil
        let hasName = localizedString(from: dictionary["name"], language: "en") != nil
            || DashboardJSON.string(dictionary["service_name"]) != nil
            || DashboardJSON.string(dictionary["title"]) != nil
        return hasID && hasName
    }

    private func projectCreationServiceOption(
        from row: [String: Any],
        language: String
    ) -> ProjectCreationServiceOption? {
        let nestedService = DashboardJSON.dictionary(row["service"])
        let categoryObject = DashboardJSON.dictionary(row["category"])

        let serviceID = DashboardJSON.string(row["id"])
            ?? DashboardJSON.string(row["service_id"])
            ?? DashboardJSON.string(nestedService?["id"])
        let serviceName = localizedString(from: row["name"], language: language)
            ?? DashboardJSON.string(row["service_name"])
            ?? DashboardJSON.string(row["title"])
            ?? localizedString(from: nestedService?["name"], language: language)
            ?? DashboardJSON.string(nestedService?["service_name"])

        guard let serviceName, !serviceName.isEmpty else {
            return nil
        }

        let normalizedID =
            serviceID
            ?? "\(serviceName.lowercased())::\(projectCreationNormalizedDeliveryProvider(from: row, nestedService: nestedService))"
        let categoryName = localizedString(from: row["category_name"], language: language)
            ?? localizedString(from: categoryObject?["name"], language: language)
            ?? DashboardJSON.string(row["category_name"])
            ?? DashboardJSON.string(row["category"])
            ?? "Other"
        let subcategoryName = localizedString(from: row["subcategory_name"], language: language)
            ?? DashboardJSON.string(row["subcategory_name"])
            ?? DashboardJSON.string(row["subcategory"])

        return ProjectCreationServiceOption(
            id: normalizedID,
            name: serviceName,
            description:
                localizedString(from: row["description"], language: language)
                ?? DashboardJSON.string(row["description"])
                ?? "",
            categoryName: categoryName,
            categoryID:
                DashboardJSON.string(row["category_id"])
                ?? DashboardJSON.string(row["categoryId"])
                ?? DashboardJSON.string(categoryObject?["id"]),
            subcategoryName: subcategoryName,
            deliveryProvider: projectCreationNormalizedDeliveryProvider(from: row, nestedService: nestedService)
        )
    }

    private func projectCreationNormalizedDeliveryProvider(
        from row: [String: Any],
        nestedService: [String: Any]?
    ) -> String {
        let raw = DashboardJSON.string(row["delivery_provider"])
            ?? DashboardJSON.string(row["provider"])
            ?? DashboardJSON.string(nestedService?["delivery_provider"])
            ?? DashboardJSON.string(nestedService?["provider"])
            ?? "manual_upload"

        switch raw.lowercased() {
        case "github":
            return "github"
        case "figma":
            return "figma"
        case "google_drive":
            return "google_drive"
        case "google_analytics":
            return "google_analytics"
        default:
            return "manual_upload"
        }
    }

    private func projectCreationServiceRecommendations(
        from payload: Any,
        language: String
    ) -> [ProjectCreationServiceRecommendation] {
        let root = DashboardJSON.dictionary(payload) ?? [:]
        let source = DashboardJSON.dictionary(root["result"])
            ?? DashboardJSON.dictionary(root["data"])
            ?? root

        let recommendedRaw: [Any] = {
            if let services = source["services"] as? [Any] {
                return services
            }

            for value in source.values {
                if let rows = value as? [Any], !rows.isEmpty {
                    return rows
                }
            }

            if source["service_name"] != nil || source["name"] != nil || source["id"] != nil {
                return [source]
            }

            return []
        }()

        var recommendations = mapProjectCreationRecommendations(
            from: recommendedRaw,
            language: language,
            isAlternative: false,
            fallbackCategoryName: nil
        )

        let alternativeGroups = source["similar_services_by_category"] as? [Any] ?? []
        for groupValue in alternativeGroups {
            guard let group = DashboardJSON.dictionary(groupValue) else { continue }
            let groupServices = group["services"] as? [Any] ?? []
            let groupCategoryName = DashboardJSON.string(group["category_name"])
            recommendations.append(
                contentsOf: mapProjectCreationRecommendations(
                    from: groupServices,
                    language: language,
                    isAlternative: true,
                    fallbackCategoryName: groupCategoryName
                )
            )
        }

        var seen = Set<String>()
        return recommendations.filter { recommendation in
            let key = recommendation.serviceID?.lowercased()
                ?? "\(recommendation.serviceName.lowercased())::\(recommendation.deliveryProvider)::\(recommendation.categoryName?.lowercased() ?? "")"
            return seen.insert(key).inserted
        }
    }

    private func mapProjectCreationRecommendations(
        from rows: [Any],
        language: String,
        isAlternative: Bool,
        fallbackCategoryName: String?
    ) -> [ProjectCreationServiceRecommendation] {
        rows.compactMap { value in
            guard let row = DashboardJSON.dictionary(value) else { return nil }
            let nestedService = DashboardJSON.dictionary(row["service"])
            let serviceID = DashboardJSON.string(row["service_id"])
                ?? DashboardJSON.string(row["id"])
                ?? DashboardJSON.string(nestedService?["id"])
            let serviceName = DashboardJSON.string(row["service_name"])
                ?? localizedString(from: row["name"], language: language)
                ?? DashboardJSON.string(row["title"])
                ?? localizedString(from: nestedService?["name"], language: language)

            guard let serviceName, !serviceName.isEmpty else { return nil }

            let categoryName = DashboardJSON.string(row["category_name"]) ?? fallbackCategoryName
            let description = DashboardJSON.string(row["description"])
                ?? DashboardJSON.string(row["reason"])
                ?? ""
            let deliveryProvider = projectCreationNormalizedDeliveryProvider(from: row, nestedService: nestedService)

            return ProjectCreationServiceRecommendation(
                id:
                    serviceID
                    ?? "\(serviceName.lowercased())::\(deliveryProvider)::\(categoryName?.lowercased() ?? "")",
                serviceID: serviceID,
                serviceName: serviceName,
                deliveryProvider: deliveryProvider,
                description: description,
                categoryName: categoryName,
                isAlternative: isAlternative || (DashboardJSON.bool(row["is_alternative"]) ?? false)
            )
        }
    }

    private func projectCreationDictionary(_ value: Any?) -> [String: Any]? {
        if let dictionary = DashboardJSON.dictionary(value) {
            return dictionary
        }

        if let text = DashboardJSON.string(value),
           let data = text.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data, options: []),
           let dictionary = DashboardJSON.dictionary(object)
        {
            return dictionary
        }

        return nil
    }

    private func projectCreationArray(_ value: Any?) -> [Any] {
        if let array = value as? [Any] {
            return array
        }

        if let text = DashboardJSON.string(value),
           let data = text.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data, options: []),
           let array = object as? [Any]
        {
            return array
        }

        return []
    }

    private func projectCreationRecommendedProviders(
        from payload: Any
    ) -> [String: [ProjectCreationProviderCandidate]] {
        let root = projectCreationDictionary(payload) ?? [:]
        let source = projectCreationDictionary(root["result"])
            ?? projectCreationDictionary(root["data"])
            ?? root
        let sourceResponsePayload = projectCreationDictionary(source["response_payload"])
        let rootResponsePayload = projectCreationDictionary(root["response_payload"])
        let sourceDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(root["debug"])?["response_payload"]
        )
        let providersObject = projectCreationDictionary(source["recommended_providers"])
            ?? projectCreationDictionary(root["recommended_providers"])
            ?? projectCreationDictionary(sourceResponsePayload?["recommended_providers"])
            ?? projectCreationDictionary(rootResponsePayload?["recommended_providers"])
            ?? projectCreationDictionary(sourceDebugResponsePayload?["recommended_providers"])
            ?? projectCreationDictionary(rootDebugResponsePayload?["recommended_providers"])
            ?? [:]

        var result: [String: [ProjectCreationProviderCandidate]] = [:]
        for (serviceName, value) in providersObject {
            let rows = projectCreationArray(value)
                .compactMap { projectCreationDictionary($0) }
                .compactMap { projectCreationProvider(from: $0, serviceName: serviceName) }
            if !rows.isEmpty {
                result[serviceName] = rows
            }
        }
        return result
    }

    private func projectCreationProvider(
        from row: [String: Any],
        serviceName: String?
    ) -> ProjectCreationProviderCandidate? {
        guard let id = DashboardJSON.string(row["id"]), !id.isEmpty else {
            return nil
        }

        let firstName = DashboardJSON.string(row["firstName"])
            ?? DashboardJSON.string(row["first_name"])
            ?? ""
        let lastName = DashboardJSON.string(row["lastName"])
            ?? DashboardJSON.string(row["last_name"])
            ?? ""

        return ProjectCreationProviderCandidate(
            id: id,
            firstName: firstName,
            lastName: lastName,
            avatarURL: DashboardJSON.string(row["avatar"]),
            matchScore: DashboardJSON.double(row["matchScore"]) ?? DashboardJSON.double(row["match_score"]),
            serviceName: serviceName
        )
    }

    private func normalizeProjectCreationAIBriefResponse(
        from payload: Any,
        language: String
    ) -> ProjectCreationAIBriefResponse? {
        let root = projectCreationDictionary(payload) ?? [:]
        let source = projectCreationDictionary(root["result"])
            ?? projectCreationDictionary(root["data"])
            ?? root
        let sourceResponsePayload = projectCreationDictionary(source["response_payload"])
        let rootResponsePayload = projectCreationDictionary(root["response_payload"])
        let sourceDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = projectCreationDictionary(
            projectCreationDictionary(root["debug"])?["response_payload"]
        )

        let statusRaw = (
            DashboardJSON.string(source["status"])
                ?? DashboardJSON.string(root["status"])
                ?? DashboardJSON.string(sourceResponsePayload?["status"])
                ?? DashboardJSON.string(rootResponsePayload?["status"])
                ?? DashboardJSON.string(sourceDebugResponsePayload?["status"])
                ?? DashboardJSON.string(rootDebugResponsePayload?["status"])
                ?? ""
        ).uppercased()
        let status: ProjectCreationAIStatus = {
            switch statusRaw {
            case "FINAL":
                return .final
            case "PROCESSING":
                return .processing
            default:
                return .clarify
            }
        }()

        let questionCandidates: [[Any]] = [
            projectCreationArray(source["questions"]),
            projectCreationArray(root["questions"]),
            projectCreationArray(sourceResponsePayload?["questions"]),
            projectCreationArray(rootResponsePayload?["questions"]),
            projectCreationArray(sourceDebugResponsePayload?["questions"]),
            projectCreationArray(rootDebugResponsePayload?["questions"]),
        ]
        let questionsRaw = questionCandidates.first { !$0.isEmpty } ?? []
        let questions = questionsRaw.compactMap { value -> String? in
            if let string = DashboardJSON.string(value), !string.isEmpty {
                return string
            }
            if let dictionary = projectCreationDictionary(value) {
                return DashboardJSON.string(dictionary["question"])
            }
            return nil
        }

        let briefResultID = DashboardJSON.string(source["brief_result_id"])
            ?? DashboardJSON.string(root["brief_result_id"])
            ?? DashboardJSON.string(source["id"])
            ?? DashboardJSON.string(root["id"])
            ?? DashboardJSON.string(sourceResponsePayload?["brief_result_id"])
            ?? DashboardJSON.string(rootResponsePayload?["brief_result_id"])
            ?? DashboardJSON.string(sourceDebugResponsePayload?["brief_result_id"])
            ?? DashboardJSON.string(rootDebugResponsePayload?["brief_result_id"])

        let finalBriefSourceCandidates: [[String: Any]?] = [
            projectCreationDictionary(source["final_brief_modular"]),
            projectCreationDictionary(source["final_brief"]),
            projectCreationDictionary(root["final_brief_modular"]),
            projectCreationDictionary(root["final_brief"]),
            projectCreationDictionary(sourceResponsePayload?["final_brief_modular"]),
            projectCreationDictionary(sourceResponsePayload?["final_brief"]),
            projectCreationDictionary(rootResponsePayload?["final_brief_modular"]),
            projectCreationDictionary(rootResponsePayload?["final_brief"]),
            projectCreationDictionary(sourceDebugResponsePayload?["final_brief_modular"]),
            projectCreationDictionary(sourceDebugResponsePayload?["final_brief"]),
            projectCreationDictionary(rootDebugResponsePayload?["final_brief_modular"]),
            projectCreationDictionary(rootDebugResponsePayload?["final_brief"]),
            status == .final ? source : nil,
        ]
        let finalBriefSource = finalBriefSourceCandidates.compactMap { $0 }.first
        let finalBrief = finalBriefSource.flatMap { projectCreationBrief(from: $0, language: language) }
        let recommendedProviders = projectCreationRecommendedProviders(from: payload)

        let hasUsefulPayload =
            finalBrief != nil
            || !questions.isEmpty
            || !recommendedProviders.isEmpty
            || status == .processing
            || !statusRaw.isEmpty

        guard hasUsefulPayload else {
            return nil
        }

        return ProjectCreationAIBriefResponse(
            status: status,
            briefResultID: briefResultID,
            questions: questions,
            finalBrief: finalBrief,
            recommendedProviders: recommendedProviders
        )
    }

    private func projectCreationBrief(
        from dictionary: [String: Any],
        language: String
    ) -> ProjectCreationBrief? {
        let title = DashboardJSON.string(dictionary["title"]) ?? "AI Generated Project"
        let description = DashboardJSON.string(dictionary["description"]) ?? ""
        let duration = DashboardJSON.string(dictionary["project_duration"])
            ?? DashboardJSON.string(dictionary["recommended_duration"])
            ?? DashboardJSON.string(dictionary["duration"])
            ?? ""
        let paymentPlan = DashboardJSON.string(dictionary["payment_plan"]) ?? "MILESTONE"
        let currency = DashboardJSON.string(dictionary["currency"]) ?? "USD"
        let technologies = DashboardJSON.array(dictionary["technologies"]).compactMap { DashboardJSON.string($0) }
        let specificRequirements = DashboardJSON.array(dictionary["specific_requirements"]).compactMap { DashboardJSON.string($0) }

        let linesRaw = DashboardJSON.array(dictionary["project_lines"]).compactMap { DashboardJSON.dictionary($0) }
        var lines = linesRaw.compactMap { row -> ProjectCreationBriefLine? in
            let serviceName = DashboardJSON.string(row["service_name"])
                ?? localizedString(from: row["name"], language: language)
                ?? DashboardJSON.string(row["title"])
            guard let serviceName, !serviceName.isEmpty else {
                return nil
            }

            let milestones = DashboardJSON.array(row["milestones"])
                .compactMap { DashboardJSON.dictionary($0) }
                .compactMap { milestoneRow -> ProjectCreationBriefMilestone? in
                    let title = DashboardJSON.string(milestoneRow["title"]) ?? "Milestone"
                    let amount = DashboardJSON.double(milestoneRow["amount"]) ?? 0
                    guard amount > 0 else {
                        return nil
                    }
                    return ProjectCreationBriefMilestone(
                        id: DashboardJSON.string(milestoneRow["id"]) ?? UUID().uuidString,
                        title: title,
                        description: DashboardJSON.string(milestoneRow["description"]) ?? "",
                        percentage: DashboardJSON.double(milestoneRow["percentage"]),
                        amount: amount,
                        assignedProviderID:
                            DashboardJSON.string(milestoneRow["assigned_provider_id"])
                            ?? DashboardJSON.string(milestoneRow["provider_id"])
                    )
                }

            return ProjectCreationBriefLine(
                id: DashboardJSON.string(row["id"]) ?? UUID().uuidString,
                serviceID: DashboardJSON.string(row["service_id"]),
                serviceName: serviceName,
                deliveryProvider: projectCreationNormalizedDeliveryProvider(from: row, nestedService: nil),
                description: DashboardJSON.string(row["description"]) ?? "",
                budgetPercentage: DashboardJSON.double(row["budget_percentage"]) ?? 0,
                milestones: milestones
            )
        }

        if lines.isEmpty {
            lines = technologies.enumerated().map { index, technology in
                ProjectCreationBriefLine(
                    id: "line-\(index + 1)",
                    serviceID: nil,
                    serviceName: technology,
                    deliveryProvider: "manual_upload",
                    description: description,
                    budgetPercentage: 0,
                    milestones: []
                )
            }
        }

        guard !lines.isEmpty else {
            return nil
        }

        return ProjectCreationBrief(
            title: title,
            description: description,
            lines: lines,
            technologies: technologies,
            specificRequirements: specificRequirements,
            duration: duration,
            paymentPlan: paymentPlan,
            currency: currency
        )
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
        forceJSONContentType: Bool = false,
        bearerToken: String?
    ) async throws -> Any {
        let request = try makeRequest(
            path: path,
            method: method,
            queryItems: queryItems,
            language: language,
            currency: currency,
            body: body,
            forceJSONContentType: forceJSONContentType,
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
        forceJSONContentType: Bool = false,
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
        } else if forceJSONContentType {
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

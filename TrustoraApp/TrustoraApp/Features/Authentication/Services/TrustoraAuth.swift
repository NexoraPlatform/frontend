import Foundation
import Security
import Combine

enum TrustoraAuthMode: String, Identifiable {
    case signIn
    case signUp

    var id: String { rawValue }
}

struct TrustoraLoginPayload: Encodable {
    let email: String
    let password: String
    let deviceName: String

    init(email: String, password: String, deviceName: String = "ios-app") {
        self.email = email
        self.password = password
        self.deviceName = deviceName
    }

    enum CodingKeys: String, CodingKey {
        case email
        case password
        case deviceName = "device_name"
    }
}

struct TrustoraRegisterPayload: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let password: String
    let role: String
    let company: String?
    let companyName: String?
    let taxID: String?
    let tradeRegistryNumber: String?
    let billingAddress: String?
    let billingCity: String?
    let billingState: String?
    let billingPostalCode: String?

    enum CodingKeys: String, CodingKey {
        case firstName
        case lastName
        case email
        case phone
        case password
        case role
        case company
        case companyName = "company_name"
        case taxID = "tax_id"
        case tradeRegistryNumber = "trade_registry_number"
        case billingAddress = "billing_address"
        case billingCity = "billing_city"
        case billingState = "billing_state"
        case billingPostalCode = "billing_postal_code"
    }
}

struct TrustoraAuthUser: Codable, Identifiable, Equatable {
    struct Company: Codable, Equatable {
        let id: String?
        let name: String?
        let idType: String?
        let idNumber: String?
        let companyCountry: String?
        let companyCounty: String?
        let companyCity: String?
        let companyZip: String?
        let companyAddress: String?
        let companyBankIBAN: String?
        let companyBankBIC: String?
        let companyBankName: String?
        let bankCurrency: String?
        let createdAt: String?
        let updatedAt: String?

        enum CodingKeys: String, CodingKey {
            case id
            case name
            case idType = "id_type"
            case idNumber = "id_number"
            case companyCountry = "company_country"
            case companyCounty = "company_county"
            case companyCity = "company_city"
            case companyZip = "company_zip"
            case companyAddress = "company_address"
            case companyBankIBAN = "company_bank_iban"
            case companyBankBIC = "company_bank_bic"
            case companyBankName = "company_bank_name"
            case bankCurrency = "bank_currency"
            case createdAt = "created_at"
            case updatedAt = "updated_at"
        }
    }

    struct AccessPermission: Codable, Equatable, Identifiable {
        let id: String
        let slug: String
        let name: String?

        nonisolated init(json: [String: Any]) {
            id = TrustoraAuthUser.stringValue(from: json["id"]) ?? UUID().uuidString
            slug = (TrustoraAuthUser.stringValue(from: json["slug"]) ?? TrustoraAuthUser.stringValue(from: json["name"]) ?? "").lowercased()
            name = TrustoraAuthUser.stringValue(from: json["name"])
        }
    }

    struct AccessRole: Codable, Equatable, Identifiable {
        let id: String
        let slug: String
        let name: String?
        let permissions: [AccessPermission]

        nonisolated init(json: [String: Any]) {
            id = TrustoraAuthUser.stringValue(from: json["id"]) ?? UUID().uuidString
            slug = (TrustoraAuthUser.stringValue(from: json["slug"]) ?? TrustoraAuthUser.stringValue(from: json["name"]) ?? "").lowercased()
            name = TrustoraAuthUser.stringValue(from: json["name"])
            permissions = TrustoraAuthUser.dictionaryArray(from: json["permissions"])
                .map(AccessPermission.init)
                .filter { !$0.slug.isEmpty }
        }
    }

    struct ConnectedAccount: Codable, Equatable, Identifiable {
        let id: String
        let provider: String
        let providerID: String?
        let expiresAt: String?
        let createdAt: String?
        let updatedAt: String?

        enum CodingKeys: String, CodingKey {
            case id
            case provider
            case providerID = "provider_id"
            case expiresAt = "expires_at"
            case createdAt = "created_at"
            case updatedAt = "updated_at"
        }

        nonisolated init(json: [String: Any]) {
            id = TrustoraAuthUser.stringValue(from: json["id"]) ?? UUID().uuidString
            provider = (TrustoraAuthUser.stringValue(from: json["provider"]) ?? "").lowercased()
            providerID = TrustoraAuthUser.stringValue(from: json["provider_id"])
            expiresAt = TrustoraAuthUser.stringValue(from: json["expires_at"])
            createdAt = TrustoraAuthUser.stringValue(from: json["created_at"])
            updatedAt = TrustoraAuthUser.stringValue(from: json["updated_at"])
        }
    }

    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let emailVerifiedAt: String?
    let phone: String?
    let role: String?
    let roleSlugsPayload: [String]?
    let permissionSlugs: [String]?
    let companyID: String?
    let companyName: String?
    let company: Company?
    let avatar: String?
    let countryCode: String?
    let website: String?
    let location: String?
    let language: String?
    let bio: String?
    let rating: String?
    let reviewCount: Int?
    let status: String?
    let lastLoginAt: String?
    let lastActiveAt: String?
    let timezone: String?
    let createdAt: String?
    let updatedAt: String?
    let testVerified: Bool?
    let callVerified: Bool?
    let stripeAccountID: String?
    var rapydWalletID: String?
    var rapydContactID: String?
    let rapydBeneficiaryID: String?
    let rapydSenderID: String?
    let payoutMethodType: String?
    let isOnline: Bool?
    let lastSeen: String?
    let onesignalPlayerID: String?
    let profileURL: String?
    let githubToken: String?
    let githubRefreshToken: String?
    let githubNickname: String?
    let oldestWorkExperience: String?
    let nextAvailableJob: String?
    let roles: [String]?
    let roleDetails: [AccessRole]?
    let permissions: [String]?
    let connectedAccounts: [ConnectedAccount]?
    let userPermissionsPayload: String?
    let isSuperuser: Bool?
    let rawPayload: String?

    var displayName: String {
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? email : name
    }

    var roleSlugs: [String] {
        let normalizedRoles = roles?.map { $0.lowercased() } ?? []
        let fromPayload = roleSlugsPayload?.map { $0.lowercased() } ?? []
        let combined = Array(Set(normalizedRoles + fromPayload))
        if !combined.isEmpty {
            return combined
        }

        if !normalizedRoles.isEmpty {
            return normalizedRoles
        }

        if let role, !role.isEmpty {
            return [role.lowercased()]
        }

        return []
    }

    func hasRole(_ roleSlug: String) -> Bool {
        roleSlugs.contains(roleSlug.lowercased())
    }

    func updatingRapydIdentifiers(walletID: String?, contactID: String?) -> TrustoraAuthUser {
        let normalizedWalletID = walletID?.nilIfEmpty
        let normalizedContactID = contactID?.nilIfEmpty

        var updated = self
        if normalizedWalletID != nil {
            updated.rapydWalletID = normalizedWalletID
        }
        if normalizedContactID != nil {
            updated.rapydContactID = normalizedContactID
        }
        return updated
    }

    nonisolated static func from(jsonObject: Any?) -> TrustoraAuthUser? {
        guard let dictionary = jsonObject as? [String: Any] else {
            return nil
        }

        let rawPayload = jsonString(from: dictionary)
        let fullName = stringValue(from: dictionary["name"]) ?? ""
        let fullNameParts = fullName.split(separator: " ", omittingEmptySubsequences: true)
        let inferredFirstName = fullNameParts.first.map(String.init) ?? ""
        let inferredLastName = fullNameParts.dropFirst().joined(separator: " ")

        let companyObject = dictionary["company"] as? [String: Any]
        let parsedCompany = company(from: dictionary, nested: companyObject)

        let id = stringValue(from: dictionary["id"]) ?? stringValue(from: dictionary["user_id"]) ?? UUID().uuidString
        let email = stringValue(from: dictionary["email"]) ?? ""
        let firstName = stringValue(from: dictionary["firstName"]) ?? stringValue(from: dictionary["first_name"]) ?? inferredFirstName
        let lastName = stringValue(from: dictionary["lastName"]) ?? stringValue(from: dictionary["last_name"]) ?? inferredLastName
        let emailVerifiedAt = stringValue(from: dictionary["email_verified_at"])
        let rapydWalletID =
            stringValue(from: dictionary["rapyd_wallet_id"]) ??
            stringValue(from: dictionary["wallet_id"])
        let rapydContactID =
            stringValue(from: dictionary["rapyd_contact_id"]) ??
            stringValue(from: dictionary["contact_id"])
        let companyID = stringValue(from: dictionary["company_id"]) ?? stringValue(from: companyObject?["id"])
        let countryCode = stringValue(from: dictionary["country_code"])
        let website = stringValue(from: dictionary["website"])
        let location = stringValue(from: dictionary["location"])
        let language = stringValue(from: dictionary["language"])
        let bio = stringValue(from: dictionary["bio"])
        let rating = stringValue(from: dictionary["rating"])
        let reviewCount = intValue(from: dictionary["reviewCount"]) ?? intValue(from: dictionary["review_count"])
        let status = stringValue(from: dictionary["status"])
        let lastLoginAt = stringValue(from: dictionary["last_login_at"])
        let lastActiveAt = stringValue(from: dictionary["last_active_at"])
        let timezone = stringValue(from: dictionary["timezone"])
        let createdAt = stringValue(from: dictionary["created_at"])
        let updatedAt = stringValue(from: dictionary["updated_at"])
        let testVerified = boolValue(from: dictionary["testVerified"]) ?? boolValue(from: dictionary["test_verified"])
        let callVerified = boolValue(from: dictionary["callVerified"]) ?? boolValue(from: dictionary["call_verified"])
        let stripeAccountID = stringValue(from: dictionary["stripe_account_id"])
        let rapydBeneficiaryID = stringValue(from: dictionary["rapyd_beneficiary_id"])
        let rapydSenderID = stringValue(from: dictionary["rapyd_sender_id"])
        let payoutMethodType = stringValue(from: dictionary["payout_method_type"])
        let isOnline = boolValue(from: dictionary["is_online"])
        let lastSeen = stringValue(from: dictionary["last_seen"])
        let onesignalPlayerID = stringValue(from: dictionary["onesignal_player_id"])
        let profileURL = stringValue(from: dictionary["profile_url"])
        let githubToken = stringValue(from: dictionary["github_token"])
        let githubRefreshToken = stringValue(from: dictionary["github_refresh_token"])
        let githubNickname = stringValue(from: dictionary["github_nickname"])
        let oldestWorkExperience = stringValue(from: dictionary["oldest_work_experience"])
        let nextAvailableJob = stringValue(from: dictionary["next_available_job"])
        let roleSlugsFromPayload = stringArray(from: dictionary["role_slugs"])
        let permissionSlugs = stringArray(from: dictionary["permission_slugs"])
        let connectedAccounts = dictionaryArray(from: dictionary["connected_accounts"])
            .map(ConnectedAccount.init)
            .filter { !$0.provider.isEmpty }
        let userPermissionsPayload = jsonString(from: dictionary["user_permissions"])

        var companyName = stringValue(from: dictionary["company_name"])
        if companyName == nil {
            if let companyObject {
                companyName = stringValue(from: companyObject["name"])
            } else {
                companyName = stringValue(from: dictionary["company"])
            }
        }

        let rolesFromObjectArray: [String] = (dictionary["roles"] as? [[String: Any]] ?? [])
            .compactMap { roleObject in
                stringValue(from: roleObject["slug"]) ?? stringValue(from: roleObject["name"])
            }
        let roleDetails = dictionaryArray(from: dictionary["roles"])
            .map(AccessRole.init)
            .filter { !$0.slug.isEmpty }

        let rolesFromStringArray: [String] = (dictionary["roles"] as? [String] ?? [])

        let permissionFromRoleObjects: [String] = (dictionary["roles"] as? [[String: Any]] ?? [])
            .flatMap { roleObject in
                (roleObject["permissions"] as? [[String: Any]] ?? [])
                    .compactMap { permissionObject in
                        stringValue(from: permissionObject["slug"]) ?? stringValue(from: permissionObject["name"])
                    }
            }
        let permissionsFromRootObjectArray: [String] = (dictionary["permissions"] as? [[String: Any]] ?? [])
            .compactMap { permissionObject in
                stringValue(from: permissionObject["slug"]) ?? stringValue(from: permissionObject["name"])
            }
        let permissionsFromStringArray: [String] = stringArray(from: dictionary["permissions"])
        let combinedPermissions = Array(
            Set((permissionFromRoleObjects + permissionsFromRootObjectArray + permissionsFromStringArray + permissionSlugs)
                .map { $0.lowercased() })
        )

        let combinedRoles = Array(
            Set((rolesFromObjectArray + rolesFromStringArray + roleSlugsFromPayload).map { $0.lowercased() })
        )
        let primaryRole = combinedRoles.first
            ?? stringValue(from: dictionary["role"])
            ?? stringValue(from: dictionary["role_slug"])

        return TrustoraAuthUser(
            id: id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            emailVerifiedAt: emailVerifiedAt,
            phone: stringValue(from: dictionary["phone"]),
            role: primaryRole,
            roleSlugsPayload: roleSlugsFromPayload.isEmpty ? nil : roleSlugsFromPayload,
            permissionSlugs: permissionSlugs.isEmpty ? nil : permissionSlugs,
            companyID: companyID,
            companyName: companyName,
            company: parsedCompany,
            avatar: stringValue(from: dictionary["avatar"]) ?? stringValue(from: dictionary["profile_photo_url"]),
            countryCode: countryCode,
            website: website,
            location: location,
            language: language,
            bio: bio,
            rating: rating,
            reviewCount: reviewCount,
            status: status,
            lastLoginAt: lastLoginAt,
            lastActiveAt: lastActiveAt,
            timezone: timezone,
            createdAt: createdAt,
            updatedAt: updatedAt,
            testVerified: testVerified,
            callVerified: callVerified,
            stripeAccountID: stripeAccountID,
            rapydWalletID: rapydWalletID,
            rapydContactID: rapydContactID,
            rapydBeneficiaryID: rapydBeneficiaryID,
            rapydSenderID: rapydSenderID,
            payoutMethodType: payoutMethodType,
            isOnline: isOnline,
            lastSeen: lastSeen,
            onesignalPlayerID: onesignalPlayerID,
            profileURL: profileURL,
            githubToken: githubToken,
            githubRefreshToken: githubRefreshToken,
            githubNickname: githubNickname,
            oldestWorkExperience: oldestWorkExperience,
            nextAvailableJob: nextAvailableJob,
            roles: combinedRoles.isEmpty ? nil : combinedRoles,
            roleDetails: roleDetails.isEmpty ? nil : roleDetails,
            permissions: combinedPermissions.isEmpty ? nil : combinedPermissions,
            connectedAccounts: connectedAccounts.isEmpty ? nil : connectedAccounts,
            userPermissionsPayload: userPermissionsPayload,
            isSuperuser: boolValue(from: dictionary["is_superuser"]),
            rawPayload: rawPayload
        )
    }

    nonisolated private static func company(from dictionary: [String: Any], nested: [String: Any]?) -> Company? {
        let companyID = stringValue(from: nested?["id"]) ?? stringValue(from: dictionary["company_id"])
        let companyName = stringValue(from: nested?["name"]) ?? stringValue(from: dictionary["company_name"])
        let idType = stringValue(from: nested?["id_type"]) ?? stringValue(from: dictionary["id_type"])
        let idNumber = stringValue(from: nested?["id_number"]) ?? stringValue(from: dictionary["id_number"])
        let country = stringValue(from: nested?["company_country"]) ?? stringValue(from: dictionary["company_country"])
        let county = stringValue(from: nested?["company_county"]) ?? stringValue(from: dictionary["company_county"])
        let city = stringValue(from: nested?["company_city"]) ?? stringValue(from: dictionary["company_city"])
        let zip = stringValue(from: nested?["company_zip"]) ?? stringValue(from: dictionary["company_zip"])
        let address = stringValue(from: nested?["company_address"]) ?? stringValue(from: dictionary["company_address"])
        let iban = stringValue(from: nested?["company_bank_iban"]) ?? stringValue(from: dictionary["company_bank_iban"])
        let bic = stringValue(from: nested?["company_bank_bic"]) ?? stringValue(from: dictionary["company_bank_bic"])
        let bankName = stringValue(from: nested?["company_bank_name"]) ?? stringValue(from: dictionary["company_bank_name"])
        let bankCurrency = stringValue(from: nested?["bank_currency"]) ?? stringValue(from: dictionary["bank_currency"])
        let createdAt = stringValue(from: nested?["created_at"])
        let updatedAt = stringValue(from: nested?["updated_at"])

        let hasData = [
            companyID,
            companyName,
            idType,
            idNumber,
            country,
            county,
            city,
            zip,
            address,
            iban,
            bic,
            bankName,
            bankCurrency,
            createdAt,
            updatedAt,
        ].contains { value in
            guard let value else { return false }
            return !value.isEmpty
        }

        guard hasData else {
            return nil
        }

        return Company(
            id: companyID,
            name: companyName,
            idType: idType,
            idNumber: idNumber,
            companyCountry: country,
            companyCounty: county,
            companyCity: city,
            companyZip: zip,
            companyAddress: address,
            companyBankIBAN: iban,
            companyBankBIC: bic,
            companyBankName: bankName,
            bankCurrency: bankCurrency,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    nonisolated private static func stringValue(from value: Any?) -> String? {
        if let string = value as? String {
            return string.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }

    nonisolated private static func boolValue(from value: Any?) -> Bool? {
        if let bool = value as? Bool {
            return bool
        }
        if let number = value as? NSNumber {
            return number.boolValue
        }
        if let string = value as? String {
            switch string.lowercased() {
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

    nonisolated private static func intValue(from value: Any?) -> Int? {
        if let int = value as? Int {
            return int
        }
        if let number = value as? NSNumber {
            return number.intValue
        }
        if let string = value as? String {
            return Int(string.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }

    nonisolated private static func stringArray(from value: Any?) -> [String] {
        guard let array = value as? [Any] else {
            return []
        }

        return array.compactMap { element in
            stringValue(from: element)
        }
    }

    nonisolated private static func dictionaryArray(from value: Any?) -> [[String: Any]] {
        guard let array = value as? [Any] else {
            return []
        }

        return array.compactMap { element in
            element as? [String: Any]
        }
    }

    nonisolated private static func jsonString(from value: Any?) -> String? {
        guard let value else {
            return nil
        }

        guard JSONSerialization.isValidJSONObject(value),
              let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
              let string = String(data: data, encoding: .utf8)
        else {
            return nil
        }

        return string
    }
}

struct TrustoraAuthSession {
    let accessToken: String
    let user: TrustoraAuthUser?
}

enum TrustoraAuthError: LocalizedError {
    case invalidURL
    case invalidResponse
    case missingAccessToken
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL."
        case .invalidResponse:
            return "Invalid server response."
        case .missingAccessToken:
            return "Authentication token was not returned by server."
        case .server(let message):
            return message
        }
    }
}

final class TrustoraAuthService {
    static let shared = TrustoraAuthService()

    private let baseAPIURL: URL
    private let session: URLSession

    init(
        baseAPIURL: URL = URL(string: "http://127.0.0.1:8000/api")!,
        session: URLSession = .shared
    ) {
        self.baseAPIURL = baseAPIURL
        self.session = session
    }

    func login(payload: TrustoraLoginPayload) async throws -> TrustoraAuthSession {
        let bodyData = try JSONEncoder().encode(payload)
        let object = try await requestObject(
            path: "auth/mobile/login",
            method: "POST",
            queryItems: [],
            bodyData: bodyData,
            bearerToken: nil
        )
        return try decodeSession(from: object)
    }

    func register(payload: TrustoraRegisterPayload) async throws {
        let bodyData = try JSONEncoder().encode(payload)
        _ = try await requestObject(
            path: "auth/register",
            method: "POST",
            queryItems: [],
            bodyData: bodyData,
            bearerToken: nil
        )
    }

    func me(bearerToken: String) async throws -> TrustoraAuthSession {
        let object = try await requestObject(
            path: "auth/mobile/me",
            method: "GET",
            queryItems: [URLQueryItem(name: "include", value: "connected_accounts")],
            bodyData: nil,
            bearerToken: bearerToken
        )

        return try decodeSession(from: object, fallbackToken: bearerToken)
    }

    func logout(bearerToken: String) async throws {
        _ = try await requestObject(
            path: "auth/logout",
            method: "POST",
            queryItems: [],
            bodyData: nil,
            bearerToken: bearerToken
        )
    }

    private func decodeSession(from object: Any, fallbackToken: String? = nil) throws -> TrustoraAuthSession {
        guard let dictionary = object as? [String: Any] else {
            throw TrustoraAuthError.invalidResponse
        }

        let accessToken =
            valueAsString(dictionary["token"])
            ?? valueAsString(dictionary["access_token"])
            ?? fallbackToken

        guard let accessToken, !accessToken.isEmpty else {
            throw TrustoraAuthError.missingAccessToken
        }

        let user = TrustoraAuthUser.from(jsonObject: dictionary["user"])
            ?? TrustoraAuthUser.from(jsonObject: dictionary)

        guard let user else {
            throw TrustoraAuthError.invalidResponse
        }

        return TrustoraAuthSession(accessToken: accessToken, user: user)
    }

    private func requestObject(
        path: String,
        method: String,
        queryItems: [URLQueryItem],
        bodyData: Data?,
        bearerToken: String?
    ) async throws -> Any {
        let request = try makeRequest(
            path: path,
            method: method,
            queryItems: queryItems,
            bodyData: bodyData,
            bearerToken: bearerToken
        )

        let (data, response) = try await session.data(for: request)
        return try validateAndDecode(response: response, data: data)
    }

    private func makeRequest(
        path: String,
        method: String,
        queryItems: [URLQueryItem],
        bodyData: Data?,
        bearerToken: String?
    ) throws -> URLRequest {
        guard var components = URLComponents(
            url: baseAPIURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        ) else {
            throw TrustoraAuthError.invalidURL
        }

        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        guard let url = components.url else {
            throw TrustoraAuthError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let bodyData {
            request.httpBody = bodyData
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        if let bearerToken, !bearerToken.isEmpty {
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    private func validateAndDecode(response: URLResponse, data: Data) throws -> Any {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw TrustoraAuthError.invalidResponse
        }

        if (200...299).contains(httpResponse.statusCode) {
            if data.isEmpty { return [:] }
            return (try? JSONSerialization.jsonObject(with: data)) ?? [:]
        }

        let jsonObject = try? JSONSerialization.jsonObject(with: data)
        let parsedMessage = extractMessage(from: jsonObject)
        let fallbackMessage = String(data: data, encoding: .utf8) ?? "Unknown API error"
        throw TrustoraAuthError.server(parsedMessage ?? fallbackMessage)
    }

    private func extractMessage(from jsonObject: Any?) -> String? {
        guard let dictionary = jsonObject as? [String: Any] else {
            return nil
        }

        if let message = valueAsString(dictionary["message"]), !message.isEmpty {
            return message
        }

        if let error = valueAsString(dictionary["error"]), !error.isEmpty {
            return error
        }

        if let errors = dictionary["errors"] as? [String: Any] {
            for (_, value) in errors {
                if let messages = value as? [String], let first = messages.first, !first.isEmpty {
                    return first
                }
                if let singleMessage = value as? String, !singleMessage.isEmpty {
                    return singleMessage
                }
            }
        }

        return nil
    }

    private func valueAsString(_ value: Any?) -> String? {
        if let string = value as? String {
            return string
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }
}

@MainActor
final class AuthSessionStore: ObservableObject {
    @Published private(set) var user: TrustoraAuthUser?
    @Published private(set) var isLoading = false
    @Published private(set) var isBootstrapped = false

    private(set) var accessToken: String?

    var isAuthenticated: Bool {
        accessToken != nil && user != nil
    }

    private let authService: TrustoraAuthService
    private let userDefaults: UserDefaults
    private let cachedUserKey = "trustora.auth.cached_user"

    init(
        authService: TrustoraAuthService? = nil,
        userDefaults: UserDefaults = .standard
    ) {
        self.authService = authService ?? .shared
        self.userDefaults = userDefaults
        self.accessToken = TrustoraKeychainTokenStore.readToken()

        if let userData = userDefaults.data(forKey: cachedUserKey),
           let cachedUser = try? JSONDecoder().decode(TrustoraAuthUser.self, from: userData) {
            self.user = cachedUser
        }
    }

    func bootstrap() async {
        guard !isBootstrapped else { return }
        isBootstrapped = true

        guard let token = accessToken, !token.isEmpty else {
            return
        }

        do {
            let remoteSession = try await authService.me(bearerToken: token)
            setSession(token: remoteSession.accessToken, user: remoteSession.user)
        } catch {
            clearSession()
        }
    }

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        let session = try await authService.login(
            payload: TrustoraLoginPayload(email: email, password: password)
        )

        setSession(token: session.accessToken, user: session.user)
        try await refreshProfile()
    }

    func signUp(payload: TrustoraRegisterPayload) async throws {
        isLoading = true
        defer { isLoading = false }

        try await authService.register(payload: payload)

        let session = try await authService.login(
            payload: TrustoraLoginPayload(email: payload.email, password: payload.password)
        )
        setSession(token: session.accessToken, user: session.user)
        try await refreshProfile()
    }

    func signOut() async {
        isLoading = true
        defer { isLoading = false }

        if let token = accessToken {
            try? await authService.logout(bearerToken: token)
        }

        clearSession()
    }

    func reloadProfile() async {
        guard accessToken != nil else { return }
        do {
            try await refreshProfile()
        } catch {
            clearSession()
        }
    }

    func updateRapydIdentifiers(walletID: String?, contactID: String?) {
        guard let currentUser = user else { return }
        let updatedUser = currentUser.updatingRapydIdentifiers(walletID: walletID, contactID: contactID)
        user = updatedUser

        if let userData = try? JSONEncoder().encode(updatedUser) {
            userDefaults.set(userData, forKey: cachedUserKey)
        }
    }

    private func refreshProfile() async throws {
        guard let token = accessToken else { return }
        let remoteSession = try await authService.me(bearerToken: token)
        setSession(token: remoteSession.accessToken, user: remoteSession.user)
    }

    private func setSession(token: String, user: TrustoraAuthUser?) {
        accessToken = token
        TrustoraKeychainTokenStore.saveToken(token)
        self.user = user

        if let user {
            if let userData = try? JSONEncoder().encode(user) {
                userDefaults.set(userData, forKey: cachedUserKey)
            }
        } else {
            userDefaults.removeObject(forKey: cachedUserKey)
        }
    }

    private func clearSession() {
        accessToken = nil
        user = nil
        TrustoraKeychainTokenStore.deleteToken()
        userDefaults.removeObject(forKey: cachedUserKey)
    }
}

enum TrustoraKeychainTokenStore {
    private static let service = Bundle.main.bundleIdentifier ?? "ro.trustora.mobile"
    private static let account = "auth.bearer.token"

    static func saveToken(_ token: String) {
        guard let tokenData = token.data(using: .utf8) else { return }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]

        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = tokenData

        SecItemAdd(attributes as CFDictionary, nil)
    }

    static func readToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        guard status == errSecSuccess,
              let tokenData = item as? Data,
              let token = String(data: tokenData, encoding: .utf8)
        else {
            return nil
        }

        return token
    }

    static func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]

        SecItemDelete(query as CFDictionary)
    }
}

extension String {
    nonisolated var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }

    nonisolated var nilIfEmpty: String? {
        let value = trimmed
        return value.isEmpty ? nil : value
    }
}

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
        }
    }

    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let phone: String?
    let role: String?
    let companyName: String?
    let company: Company?
    let avatar: String?
    let roles: [String]?
    let permissions: [String]?
    let isSuperuser: Bool?

    var displayName: String {
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? email : name
    }

    var roleSlugs: [String] {
        let normalizedRoles = roles?.map { $0.lowercased() } ?? []
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

    static func from(jsonObject: Any?) -> TrustoraAuthUser? {
        guard let dictionary = jsonObject as? [String: Any] else {
            return nil
        }

        let fullName = stringValue(from: dictionary["name"]) ?? ""
        let fullNameParts = fullName.split(separator: " ", omittingEmptySubsequences: true)
        let inferredFirstName = fullNameParts.first.map(String.init) ?? ""
        let inferredLastName = fullNameParts.dropFirst().joined(separator: " ")

        let id = stringValue(from: dictionary["id"]) ?? stringValue(from: dictionary["user_id"]) ?? UUID().uuidString
        let email = stringValue(from: dictionary["email"]) ?? ""
        let firstName = stringValue(from: dictionary["firstName"]) ?? stringValue(from: dictionary["first_name"]) ?? inferredFirstName
        let lastName = stringValue(from: dictionary["lastName"]) ?? stringValue(from: dictionary["last_name"]) ?? inferredLastName

        let companyObject = dictionary["company"] as? [String: Any]
        let parsedCompany = company(from: dictionary, nested: companyObject)

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
        let permissionsFromStringArray: [String] = (dictionary["permissions"] as? [String] ?? [])
        let combinedPermissions = Array(
            Set((permissionFromRoleObjects + permissionsFromRootObjectArray + permissionsFromStringArray)
                .map { $0.lowercased() })
        )

        let combinedRoles = Array(
            Set((rolesFromObjectArray + rolesFromStringArray).map { $0.lowercased() })
        )
        let primaryRole = combinedRoles.first
            ?? stringValue(from: dictionary["role"])
            ?? stringValue(from: dictionary["role_slug"])

        return TrustoraAuthUser(
            id: id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: stringValue(from: dictionary["phone"]),
            role: primaryRole,
            companyName: companyName,
            company: parsedCompany,
            avatar: stringValue(from: dictionary["avatar"]),
            roles: combinedRoles.isEmpty ? nil : combinedRoles,
            permissions: combinedPermissions.isEmpty ? nil : combinedPermissions,
            isSuperuser: boolValue(from: dictionary["is_superuser"])
        )
    }

    private static func company(from dictionary: [String: Any], nested: [String: Any]?) -> Company? {
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
            bankCurrency: bankCurrency
        )
    }

    private static func stringValue(from value: Any?) -> String? {
        if let string = value as? String {
            return string.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }

    private static func boolValue(from value: Any?) -> Bool? {
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
            queryItems: [],
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
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var nilIfEmpty: String? {
        let value = trimmed
        return value.isEmpty ? nil : value
    }
}

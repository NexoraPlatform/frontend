import Foundation

struct TrustoraLocationCountry: Identifiable, Hashable {
    let isoCode: String
    let name: String
    let flag: String

    var id: String { isoCode }
}

struct TrustoraLocationState: Identifiable, Hashable {
    let isoCode: String
    let name: String
    let countryCode: String

    var id: String { "\(countryCode)-\(isoCode)" }
}

struct TrustoraLocationCity: Identifiable, Hashable {
    let name: String
    let countryCode: String
    let stateCode: String

    var id: String { "\(countryCode)-\(stateCode)-\(name.lowercased())" }
}

enum TrustoraLocationCatalogError: LocalizedError {
    case missingResource(String)
    case invalidFormat(String)

    var errorDescription: String? {
        switch self {
        case let .missingResource(name):
            return "Missing location resource: \(name)"
        case let .invalidFormat(name):
            return "Invalid location resource format: \(name)"
        }
    }
}

enum TrustoraCompanyIdentificationTypes {
    // Matches Next.js COUNTRY_ID_TYPES mapping from company settings dialog.
    static let byCountryISO: [String: String] = [
        "RO": "CUI", "GB": "CRN", "DE": "USt-IdNr", "FR": "SIRET", "IT": "P.IVA",
        "ES": "NIF", "NL": "RSIN", "PL": "NIP", "BG": "UIC", "HU": "Adószám",
        "AT": "UID", "BE": "BCE / KBO", "DK": "CVR", "SE": "Org.nr", "NO": "Org.nr",
        "FI": "Y-tunnus", "PT": "NIPC", "GR": "AFM", "IE": "CRO / VAT", "CZ": "IČO",
        "SK": "IČO", "SI": "MŠ", "HR": "OIB", "EE": "Registrikood", "LV": "Reģ. Nr.",
        "LT": "Įm. k.", "CY": "TIC", "MT": "VAT / C", "LU": "RCS", "CH": "UID / CHE",
        "IS": "Kennitala", "RS": "PIB", "TR": "VKN", "UA": "EDRPOU", "US": "EIN",
        "CA": "BN", "MX": "RFC", "BR": "CNPJ", "AR": "CUIT", "CL": "RUT", "CO": "NIT",
        "PE": "RUC", "CN": "USCI", "JP": "CN", "IN": "GSTIN / PAN", "KR": "BRN",
        "SG": "UEN", "AU": "ABN", "NZ": "NZBN", "HK": "BRN", "TW": "BAN", "ID": "NPWP",
        "MY": "SSM", "TH": "TIN", "VN": "MST", "AE": "TRN", "SA": "VAT / CR",
        "IL": "H.P.", "ZA": "CIPC", "EG": "TRN", "NG": "RC", "MA": "ICE",
    ]
}

final class TrustoraLocationCatalog {
    static let shared = TrustoraLocationCatalog()

    private var hasLoaded = false
    private var countries: [TrustoraLocationCountry] = []
    private var states: [TrustoraLocationState] = []
    private var cities: [TrustoraLocationCity] = []

    private init() {}

    func allCountries() throws -> [TrustoraLocationCountry] {
        try ensureLoaded()
        return countries
    }

    func states(of countryISO: String) throws -> [TrustoraLocationState] {
        try ensureLoaded()
        let normalized = countryISO.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !normalized.isEmpty else { return [] }

        return states
            .filter { $0.countryCode == normalized }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func cities(of countryISO: String, stateISO: String) throws -> [TrustoraLocationCity] {
        try ensureLoaded()
        let normalizedCountry = countryISO.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let normalizedState = stateISO.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !normalizedCountry.isEmpty, !normalizedState.isEmpty else { return [] }

        return cities
            .filter { $0.countryCode == normalizedCountry && $0.stateCode == normalizedState }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func country(matching value: String) throws -> TrustoraLocationCountry? {
        try ensureLoaded()
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return nil }

        if let byISO = countries.first(where: { $0.isoCode.caseInsensitiveCompare(normalized) == .orderedSame }) {
            return byISO
        }

        return countries.first(where: { $0.name.caseInsensitiveCompare(normalized) == .orderedSame })
    }

    func normalizeStateISO(countryISO: String, stateValue: String?) throws -> String {
        let raw = (stateValue ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { return "" }

        let countryStates = try states(of: countryISO)
        if let byISO = countryStates.first(where: { $0.isoCode.caseInsensitiveCompare(raw) == .orderedSame }) {
            return byISO.isoCode
        }

        if let byName = countryStates.first(where: { $0.name.caseInsensitiveCompare(raw) == .orderedSame }) {
            return byName.isoCode
        }

        return raw
    }

    private func ensureLoaded() throws {
        guard !hasLoaded else { return }

        let loadedCountries = try loadCountries()
        let loadedStates = try loadStates()
        let loadedCities = try loadCities()

        countries = loadedCountries
        states = loadedStates
        cities = loadedCities
        hasLoaded = true
    }

    private func loadCountries() throws -> [TrustoraLocationCountry] {
        let data = try dataForResource(named: "country.json")
        guard let json = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            throw TrustoraLocationCatalogError.invalidFormat("country.json")
        }

        return json.compactMap { item in
            guard let iso = (item["isoCode"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
                  let name = (item["name"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !iso.isEmpty,
                  !name.isEmpty
            else {
                return nil
            }

            let flag = (item["flag"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return TrustoraLocationCountry(isoCode: iso.uppercased(), name: name, flag: flag)
        }
        .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    private func loadStates() throws -> [TrustoraLocationState] {
        let data = try dataForResource(named: "state.json")
        guard let json = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            throw TrustoraLocationCatalogError.invalidFormat("state.json")
        }

        return json.compactMap { item in
            guard let iso = (item["isoCode"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
                  let name = (item["name"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
                  let country = (item["countryCode"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !iso.isEmpty,
                  !name.isEmpty,
                  !country.isEmpty
            else {
                return nil
            }

            return TrustoraLocationState(
                isoCode: iso.uppercased(),
                name: name,
                countryCode: country.uppercased()
            )
        }
    }

    private func loadCities() throws -> [TrustoraLocationCity] {
        let data = try dataForResource(named: "city.json")
        guard let json = try JSONSerialization.jsonObject(with: data) as? [[Any]] else {
            throw TrustoraLocationCatalogError.invalidFormat("city.json")
        }

        var seen = Set<String>()
        var parsed: [TrustoraLocationCity] = []
        parsed.reserveCapacity(json.count)

        for item in json {
            guard item.count >= 3,
                  let rawName = item[0] as? String,
                  let rawCountryCode = item[1] as? String,
                  let rawStateCode = item[2] as? String
            else {
                continue
            }

            let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
            let countryCode = rawCountryCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
            let stateCode = rawStateCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

            guard !name.isEmpty, !countryCode.isEmpty, !stateCode.isEmpty else {
                continue
            }

            let uniqueKey = "\(countryCode)|\(stateCode)|\(name.lowercased())"
            guard seen.insert(uniqueKey).inserted else {
                continue
            }

            parsed.append(
                TrustoraLocationCity(
                    name: name,
                    countryCode: countryCode,
                    stateCode: stateCode
                )
            )
        }

        return parsed
    }

    private func dataForResource(named name: String) throws -> Data {
        let baseName = (name as NSString).deletingPathExtension
        let fileExtension = (name as NSString).pathExtension

        if let url = resourceURL(baseName: baseName, extension: fileExtension) {
            return try Data(contentsOf: url)
        }

        throw TrustoraLocationCatalogError.missingResource(name)
    }

    private func resourceURL(baseName: String, extension fileExtension: String) -> URL? {
        if let direct = Bundle.main.url(forResource: baseName, withExtension: fileExtension) {
            return direct
        }

        let candidateSubdirectories: [String?] = [
            "Resources/LocationData",
            "LocationData",
            "Resources",
            nil,
        ]

        for subdirectory in candidateSubdirectories {
            if let url = Bundle.main.url(
                forResource: baseName,
                withExtension: fileExtension,
                subdirectory: subdirectory
            ) {
                return url
            }
        }

        if let all = Bundle.main.urls(forResourcesWithExtension: fileExtension, subdirectory: nil) {
            return all.first { $0.lastPathComponent == "\(baseName).\(fileExtension)" }
        }

        return nil
    }
}

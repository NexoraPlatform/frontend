import Foundation

enum AppCurrency: String, CaseIterable, Identifiable {
    case usd = "USD"
    case eur = "EUR"
    case ron = "RON"

    static let storageKey = "preferred_currency"
    static let defaultCurrency: AppCurrency = .usd

    var id: String { rawValue }

    var localeIdentifier: String {
        switch self {
        case .usd:
            return "en-US"
        case .eur:
            return "en-IE"
        case .ron:
            return "ro-RO"
        }
    }

    var titleKey: String {
        switch self {
        case .usd:
            return "settings.currency.usd"
        case .eur:
            return "settings.currency.eur"
        case .ron:
            return "settings.currency.ron"
        }
    }
}

enum CurrencyConversionTable {
    // Local fallback rates relative to USD. In production, backend amounts are already converted
    // when the currency query param is sent, mirroring the web app behavior.
    private static let usdRates: [AppCurrency: Decimal] = [
        .usd: 1,
        .eur: 0.92,
        .ron: 4.58,
    ]

    static func convertFromUSD(_ amountUSD: Decimal, to currency: AppCurrency) -> Decimal {
        let rate = usdRates[currency] ?? 1
        return amountUSD * rate
    }
}

enum CurrencyFormatting {
    static func format(
        amountUSD: Decimal,
        currency: AppCurrency,
        languageCode: String,
        maximumFractionDigits: Int = 0
    ) -> String {
        let converted = CurrencyConversionTable.convertFromUSD(amountUSD, to: currency)
        let localeIdentifier = languageCode == "ro" ? "ro-RO" : currency.localeIdentifier
        return format(
            amount: converted,
            currency: currency,
            localeIdentifier: localeIdentifier,
            maximumFractionDigits: maximumFractionDigits
        )
    }

    static func format(
        amount: Decimal,
        currency: AppCurrency,
        localeIdentifier: String,
        maximumFractionDigits: Int = 0
    ) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.rawValue
        formatter.maximumFractionDigits = maximumFractionDigits
        formatter.minimumFractionDigits = 0
        formatter.locale = Locale(identifier: localeIdentifier)

        let number = NSDecimalNumber(decimal: amount)
        return formatter.string(from: number) ?? "\(number) \(currency.rawValue)"
    }
}

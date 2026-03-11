import Foundation

enum AdminNewsletterUserTypeFilter: String, CaseIterable, Identifiable {
    case all
    case client
    case provider

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.newsletter.user_type_all"
        case .client:
            return "admin.newsletter.user_type_client"
        case .provider:
            return "admin.newsletter.user_type_provider"
        }
    }
}

enum AdminNewsletterLanguageFilter: String, CaseIterable, Identifiable {
    case ro
    case en

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .ro:
            return "admin.newsletter.language_ro"
        case .en:
            return "admin.newsletter.language_en"
        }
    }
}

struct AdminNewsletterRecipientParser {
    static func parse(_ input: String) -> [String] {
        input
            .split(whereSeparator: { $0 == "," || $0 == "\n" || $0 == ";" })
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
}


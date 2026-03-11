import Foundation

enum AdminLegalClausesSortBy: String, CaseIterable, Identifiable {
    case createdAt = "created_at"
    case updatedAt = "updated_at"
    case identifier
    case category

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .createdAt:
            return "admin.legal_clauses.sort.created_at"
        case .updatedAt:
            return "admin.legal_clauses.sort.updated_at"
        case .identifier:
            return "admin.legal_clauses.sort.identifier"
        case .category:
            return "admin.legal_clauses.sort.category"
        }
    }
}

enum AdminLegalClausesSortDirection: String, CaseIterable, Identifiable {
    case descending = "desc"
    case ascending = "asc"

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .descending:
            return "admin.legal_clauses.sort_direction.desc"
        case .ascending:
            return "admin.legal_clauses.sort_direction.asc"
        }
    }
}

enum AdminLegalClauseEditorMode: Equatable {
    case create
    case edit(clauseID: String)

    var isEdit: Bool {
        if case .edit = self {
            return true
        }
        return false
    }
}

struct AdminLegalClauseLanguageOption: Identifiable, Equatable {
    let code: String
    let titleKey: String

    var id: String { code }

    static let all: [AdminLegalClauseLanguageOption] = [
        AdminLegalClauseLanguageOption(code: "all", titleKey: "admin.legal_clauses.languages.all"),
        AdminLegalClauseLanguageOption(code: "en", titleKey: "admin.legal_clauses.languages.en"),
        AdminLegalClauseLanguageOption(code: "ro", titleKey: "admin.legal_clauses.languages.ro"),
        AdminLegalClauseLanguageOption(code: "de", titleKey: "admin.legal_clauses.languages.de"),
        AdminLegalClauseLanguageOption(code: "it", titleKey: "admin.legal_clauses.languages.it"),
        AdminLegalClauseLanguageOption(code: "fr", titleKey: "admin.legal_clauses.languages.fr"),
        AdminLegalClauseLanguageOption(code: "es", titleKey: "admin.legal_clauses.languages.es"),
        AdminLegalClauseLanguageOption(code: "pl", titleKey: "admin.legal_clauses.languages.pl"),
        AdminLegalClauseLanguageOption(code: "nl", titleKey: "admin.legal_clauses.languages.nl"),
        AdminLegalClauseLanguageOption(code: "ch", titleKey: "admin.legal_clauses.languages.ch"),
        AdminLegalClauseLanguageOption(code: "ie", titleKey: "admin.legal_clauses.languages.ie"),
    ]

    static let editable: [AdminLegalClauseLanguageOption] = Array(all.dropFirst())
}

struct AdminLegalClauseEditorDraft: Equatable {
    var identifier: String = ""
    var category: String = ""
    var content: [String: String] = [:]
    var selectedLanguage: String = "ro"

    var isCreateValid: Bool {
        let hasIdentifier = !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let hasCategory = !category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return hasIdentifier && hasCategory && !trimmedContentPayload().isEmpty
    }

    mutating func apply(_ clause: AdminLegalClause) {
        identifier = clause.identifier
        category = clause.category
        content = clause.content
    }

    func text(for languageCode: String) -> String {
        content[languageCode] ?? ""
    }

    mutating func setText(_ value: String, for languageCode: String) {
        content[languageCode] = value
    }

    func trimmedContentPayload() -> [String: String] {
        var payload: [String: String] = [:]
        for (key, value) in content {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                payload[key] = trimmed
            }
        }
        return payload
    }
}

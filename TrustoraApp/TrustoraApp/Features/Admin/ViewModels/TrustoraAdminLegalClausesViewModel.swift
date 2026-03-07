import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminLegalClausesViewModel: ObservableObject {
    @Published var clauses: [AdminLegalClause] = []
    @Published var categories: [String] = []

    @Published var searchText = ""
    @Published var identifierFilter = ""
    @Published var categoryFilter = ""
    @Published var sortBy: AdminLegalClausesSortBy = .createdAt
    @Published var sortDirection: AdminLegalClausesSortDirection = .descending
    @Published var perPage: Int = 15
    @Published var languageFilter: String = "all"
    @Published var page: Int = 1
    @Published var totalClauses: Int = 0
    @Published var lastPage: Int = 1

    @Published var isLoading = false
    @Published var isSubmitting = false
    @Published var isLoadingCategories = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?

    var filteredClauses: [AdminLegalClause] {
        if languageFilter == "all" {
            return clauses
        }

        return clauses.filter { clause in
            let value = clause.content[languageFilter]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return !value.isEmpty
        }
    }

    var hasPreviousPage: Bool {
        page > 1
    }

    var hasNextPage: Bool {
        page < lastPage
    }

    func load(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        isLoading = true
        errorMessage = nil

        do {
            let collection = try await TrustoraAPIClient.shared.getAdminLegalClauses(
                language: language,
                currency: currency,
                bearerToken: token,
                params: queryParams()
            )

            clauses = collection.clauses
            totalClauses = collection.total
            lastPage = max(1, collection.lastPage)
            page = max(1, collection.currentPage)
            if collection.perPage > 0 {
                perPage = collection.perPage
            }
        } catch {
            clauses = []
            totalClauses = 0
            lastPage = 1
            errorMessage = resolvedMessage(for: error)
        }

        isLoading = false
    }

    func loadCategories(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        if isLoadingCategories {
            return
        }

        isLoadingCategories = true

        do {
            let fetched = try await TrustoraAPIClient.shared.getAdminLegalClauseCategories(
                language: language,
                currency: currency,
                bearerToken: token
            )
            categories = fetched
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
        }

        isLoadingCategories = false
    }

    func loadClauseDetail(
        clauseID: String,
        languageFilter: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminLegalClause? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminLegalClause(
                clauseID: clauseID,
                languageFilter: languageFilter,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func createClause(
        draft: AdminLegalClauseEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminLegalClausePayload(
            identifier: draft.identifier,
            category: draft.category,
            content: draft.trimmedContentPayload()
        )

        do {
            _ = try await TrustoraAPIClient.shared.createAdminLegalClause(
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )
            page = 1
            await load(token: token, language: language, currency: currency)
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func updateClause(
        clauseID: String,
        draft: AdminLegalClauseEditorDraft,
        languageCode: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let text = draft.text(for: languageCode).trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = AdminLegalClauseUpdatePayload(
            identifier: draft.identifier,
            category: draft.category,
            content: [languageCode: text]
        )

        do {
            _ = try await TrustoraAPIClient.shared.updateAdminLegalClause(
                clauseID: clauseID,
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(token: token, language: language, currency: currency)
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func deleteClause(
        _ clause: AdminLegalClause,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminLegalClause(
                clauseID: clause.id,
                language: language,
                currency: currency,
                bearerToken: token
            )

            if clauses.count == 1 && page > 1 {
                page -= 1
            }

            await load(token: token, language: language, currency: currency)
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return false
        }
    }

    func resetFilters() {
        searchText = ""
        identifierFilter = ""
        categoryFilter = ""
        sortBy = .createdAt
        sortDirection = .descending
        perPage = 15
        languageFilter = "all"
        page = 1
    }

    private func queryParams() -> [String: String?] {
        [
            "search": searchText.trimmed.nilIfEmpty,
            "category": categoryFilter.trimmed.nilIfEmpty,
            "identifier": identifierFilter.trimmed.nilIfEmpty,
            "sort_by": sortBy.rawValue,
            "sort_dir": sortDirection.rawValue,
            "per_page": String(perPage),
            "lang": languageFilter == "all" ? nil : languageFilter,
            "page": String(page),
        ]
    }

    private func resolvedMessage(for error: Error) -> String {
        if let networkError = error as? TrustoraNetworkError {
            switch networkError {
            case .invalidURL:
                return "Invalid API URL."
            case .invalidResponse:
                return "Invalid API response."
            case let .httpError(_, payload):
                return extractMessage(from: payload)
            }
        }

        return error.localizedDescription
    }

    private func extractMessage(from payload: String) -> String {
        guard let data = payload.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data, options: []),
              let dictionary = object as? [String: Any] else {
            return payload
        }

        if let errors = dictionary["errors"] as? [String: Any] {
            for (_, value) in errors {
                if let first = (value as? [String])?.first, !first.isEmpty {
                    return first
                }
                if let text = value as? String, !text.isEmpty {
                    return text
                }
            }
        }

        if let message = dictionary["message"] as? String, !message.isEmpty {
            return message
        }

        if let error = dictionary["error"] as? String, !error.isEmpty {
            return error
        }

        return payload
    }
}

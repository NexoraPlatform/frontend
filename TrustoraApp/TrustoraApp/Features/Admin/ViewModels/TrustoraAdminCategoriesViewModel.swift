import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminCategoriesViewModel: ObservableObject {
    @Published var allCategories: [AdminCategorySummary] = []
    @Published var searchText = ""

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalCategories = 0

    private let pageSize = 20
    private var currentPage = 1

    var filteredCategories: [AdminCategorySummary] {
        let normalizedQuery = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        guard !normalizedQuery.isEmpty else {
            return allCategories
        }

        return allCategories.filter { category in
            category.name.lowercased().contains(normalizedQuery) ||
                category.description.lowercased().contains(normalizedQuery) ||
                category.slug.lowercased().contains(normalizedQuery)
        }
    }

    func load(
        token: String,
        language: String,
        currency: AppCurrency,
        reset: Bool = true
    ) async {
        if reset {
            guard !isLoading else { return }
            currentPage = 1
            hasMorePages = true
            isLoading = true
            errorMessage = nil
        } else {
            guard !isLoading, !isLoadingMore, hasMorePages else { return }
            isLoadingMore = true
        }

        do {
            let collection = try await TrustoraAPIClient.shared.getAdminCategories(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.categories
            var appendedCount = fetched.count
            if reset {
                allCategories = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allCategories.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allCategories.append(contentsOf: newRows)
            }

            totalCategories = max(collection.total, allCategories.count)
            currentPage = max(1, collection.currentPage)
            let canAdvance = currentPage < collection.lastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
        } catch {
            if reset {
                allCategories = []
                totalCategories = 0
                hasMorePages = false
                errorMessage = resolvedMessage(for: error)
            } else {
                currentPage = max(1, currentPage - 1)
                actionErrorMessage = resolvedMessage(for: error)
            }
        }

        if reset {
            isLoading = false
        } else {
            isLoadingMore = false
        }
    }

    func loadNextPage(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        guard hasMorePages, !isLoading, !isLoadingMore else {
            return
        }
        currentPage += 1
        await load(
            token: token,
            language: language,
            currency: currency,
            reset: false
        )
    }

    func loadCategoryDetail(
        categoryID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminCategoryDetail? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminCategory(
                categoryID: categoryID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func createCategory(
        draft: AdminCategoryEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminCategoryPayload(
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            slug: draft.slug.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            icon: draft.icon.trimmingCharacters(in: .whitespacesAndNewlines),
            parentID: draft.parentID.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            sortOrder: draft.sortOrder
        )

        do {
            _ = try await TrustoraAPIClient.shared.createAdminCategory(
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

    func updateCategory(
        categoryID: String,
        draft: AdminCategoryEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminCategoryPayload(
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            slug: draft.slug.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            icon: draft.icon.trimmingCharacters(in: .whitespacesAndNewlines),
            parentID: draft.parentID.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            sortOrder: draft.sortOrder
        )

        do {
            _ = try await TrustoraAPIClient.shared.updateAdminCategory(
                categoryID: categoryID,
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

    func deleteCategory(
        _ category: AdminCategorySummary,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminCategory(
                categoryID: category.id,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(token: token, language: language, currency: currency)
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return false
        }
    }

    func loadCategorySlug(
        categoryID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> String? {
        let trimmedID = categoryID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedID.isEmpty else {
            return nil
        }

        do {
            return try await TrustoraAPIClient.shared.getAdminCategorySlug(
                categoryID: trimmedID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            return nil
        }
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

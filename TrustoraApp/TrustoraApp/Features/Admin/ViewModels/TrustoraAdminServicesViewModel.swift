import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminServicesViewModel: ObservableObject {
    @Published var allServices: [AdminServiceSummary] = []
    @Published var searchText = ""
    @Published var statusFilter: AdminServicesStatusFilter = .all
    @Published var categories: [AdminServiceCategoryOption] = []
    @Published var deliveryProviders: [AdminDeliveryProviderOption] = []

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isLoadingFormMetadata = false
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalServices = 0

    private let pageSize = 20
    private var currentPage = 1

    var filteredServices: [AdminServiceSummary] {
        let normalizedQuery = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        return allServices.filter { service in
            let matchesSearch: Bool
            if normalizedQuery.isEmpty {
                matchesSearch = true
            } else {
                matchesSearch =
                    service.name.lowercased().contains(normalizedQuery) ||
                    service.description.lowercased().contains(normalizedQuery)
            }

            let matchesFilter: Bool
            if let expectedStatus = statusFilter.statusValue {
                let normalizedStatus = service.status.uppercased() == "APPROVED"
                    ? "ACTIVE"
                    : service.status.uppercased()
                matchesFilter = normalizedStatus == expectedStatus
            } else {
                matchesFilter = true
            }

            return matchesSearch && matchesFilter
        }
    }

    func load(
        token: String,
        language: String,
        currency: AppCurrency,
        includeMetadata: Bool = true,
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
            let collection = try await TrustoraAPIClient.shared.getAdminServices(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.services
            var appendedCount = fetched.count
            if reset {
                allServices = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allServices.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allServices.append(contentsOf: newRows)
            }

            totalServices = max(collection.total, allServices.count)
            currentPage = max(1, collection.currentPage)
            let canAdvance = currentPage < collection.lastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
        } catch {
            if reset {
                errorMessage = resolvedMessage(for: error)
                allServices = []
                totalServices = 0
                hasMorePages = false
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

        if includeMetadata && reset {
            await loadFormMetadata(
                token: token,
                language: language,
                currency: currency
            )
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
            includeMetadata: false,
            reset: false
        )
    }

    func loadFormMetadata(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        if isLoadingFormMetadata {
            return
        }

        isLoadingFormMetadata = true

        async let categoriesTask = TrustoraAPIClient.shared.getAdminServiceCategories(
            language: language,
            bearerToken: token
        )

        async let providersTask = TrustoraAPIClient.shared.getAdminServiceDeliveryProviders(
            language: language,
            currency: currency,
            bearerToken: token
        )

        do {
            let fetchedCategories = try await categoriesTask
            let fetchedProviders = try await providersTask

            categories = fetchedCategories
            deliveryProviders = fetchedProviders
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
        }

        isLoadingFormMetadata = false
    }

    func loadServiceDetail(
        serviceID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminServiceDetail? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminService(
                serviceID: serviceID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
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
            return try await TrustoraAPIClient.shared.getAdminServiceCategorySlug(
                categoryID: trimmedID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            return nil
        }
    }

    func createService(
        draft: AdminServiceEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminCreateServicePayload(
            title: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            slug: draft.slug.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            requirements: draft.requirements.trimmingCharacters(in: .whitespacesAndNewlines),
            categoryID: draft.categoryID.trimmingCharacters(in: .whitespacesAndNewlines),
            deliveryProvider: draft.deliveryProvider.trimmingCharacters(in: .whitespacesAndNewlines),
            skills: normalizedTextItems(draft.skills),
            tags: normalizedTextItems(draft.tags),
            basePrice: 0,
            pricingType: "CUSTOM"
        )

        do {
            _ = try await TrustoraAPIClient.shared.createAdminService(
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(
                token: token,
                language: language,
                currency: currency,
                includeMetadata: false
            )
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func updateService(
        serviceID: String,
        draft: AdminServiceEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminUpdateServicePayload(
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            slug: draft.slug.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            requirements: draft.requirements.trimmingCharacters(in: .whitespacesAndNewlines),
            categoryID: draft.categoryID.trimmingCharacters(in: .whitespacesAndNewlines),
            deliveryProvider: draft.deliveryProvider.trimmingCharacters(in: .whitespacesAndNewlines),
            skills: normalizedTextItems(draft.skills),
            tags: normalizedTextItems(draft.tags),
            status: draft.status.uppercased()
        )

        do {
            _ = try await TrustoraAPIClient.shared.updateAdminService(
                serviceID: serviceID,
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(
                token: token,
                language: language,
                currency: currency,
                includeMetadata: false
            )
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func performStatusAction(
        _ action: AdminServiceStatusAction,
        service: AdminServiceSummary,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.updateAdminServiceStatus(
                serviceID: service.id,
                status: action.rawValue,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(
                token: token,
                language: language,
                currency: currency,
                includeMetadata: false
            )
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return false
        }
    }

    func deleteService(
        _ service: AdminServiceSummary,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminService(
                serviceID: service.id,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await load(
                token: token,
                language: language,
                currency: currency,
                includeMetadata: false
            )
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return false
        }
    }

    private func normalizedTextItems(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var result: [String] = []

        for value in values {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else {
                continue
            }

            let key = trimmed.lowercased()
            if seen.insert(key).inserted {
                result.append(trimmed)
            }
        }

        return result
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

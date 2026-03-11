import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminTestsViewModel: ObservableObject {
    @Published var allTests: [AdminTestSummary] = []
    @Published var searchText = ""
    @Published var levelFilter: AdminTestsLevelFilter = .all
    @Published var statusFilter: AdminTestsStatusFilter = .all
    @Published var services: [AdminTestServiceOption] = []

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isLoadingMetadata = false
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalTests = 0

    private let pageSize = 20
    private var currentPage = 1

    var filteredTests: [AdminTestSummary] {
        let normalizedQuery = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        return allTests.filter { test in
            let matchesSearch: Bool
            if normalizedQuery.isEmpty {
                matchesSearch = true
            } else {
                matchesSearch =
                    test.title.lowercased().contains(normalizedQuery) ||
                    test.description.lowercased().contains(normalizedQuery) ||
                    test.serviceTitle.lowercased().contains(normalizedQuery)
            }

            let matchesLevel: Bool
            if let expectedLevel = levelFilter.levelValue {
                matchesLevel = test.level.uppercased() == expectedLevel
            } else {
                matchesLevel = true
            }

            let matchesStatus: Bool
            if let expectedStatus = statusFilter.statusValue {
                matchesStatus = test.status.uppercased() == expectedStatus
            } else {
                matchesStatus = true
            }

            return matchesSearch && matchesLevel && matchesStatus
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
            let collection = try await TrustoraAPIClient.shared.getAdminTests(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.tests
            var appendedCount = fetched.count
            if reset {
                allTests = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allTests.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allTests.append(contentsOf: newRows)
            }

            totalTests = max(collection.total, allTests.count)
            currentPage = max(1, collection.currentPage)
            let canAdvance = currentPage < collection.lastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
        } catch {
            if reset {
                allTests = []
                totalTests = 0
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

        if includeMetadata && reset {
            await loadServicesMetadata(
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

    func loadServicesMetadata(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        if isLoadingMetadata {
            return
        }

        isLoadingMetadata = true

        do {
            let servicesCollection = try await TrustoraAPIClient.shared.getAdminServices(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "limit": "300",
                    "page": "1",
                ]
            )

            services = servicesCollection.services
                .map {
                    AdminTestServiceOption(
                        id: $0.id,
                        title: $0.name,
                        categoryName: $0.categoryName
                    )
                }
                .sorted {
                    $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                }
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
        }

        isLoadingMetadata = false
    }

    func loadTestDetail(
        testID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminTestDetail? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminTest(
                testID: testID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func loadTestStatistics(
        testID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminTestStatistics? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminTestStatistics(
                testID: testID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func createTest(
        draft: AdminTestEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        do {
            _ = try await TrustoraAPIClient.shared.createAdminTest(
                payload: draft.createPayload(),
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

    func updateTest(
        testID: String,
        draft: AdminTestEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        do {
            _ = try await TrustoraAPIClient.shared.updateAdminTest(
                testID: testID,
                payload: draft.updatePayload(),
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

    func setStatus(
        test: AdminTestSummary,
        status: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.updateAdminTestStatus(
                testID: test.id,
                status: status,
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

    func deleteTest(
        _ test: AdminTestSummary,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminTest(
                testID: test.id,
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

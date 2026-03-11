import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminCallsViewModel: ObservableObject {
    @Published var allCalls: [AdminCallSummary] = []
    @Published var searchText = ""
    @Published var passedFilter: AdminCallsPassedFilter = .all
    @Published var statusFilter: AdminCallsStatusFilter = .all
    @Published var dateFilter: AdminCallsDateRangeFilter = .all

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalCalls = 0

    private let pageSize = 20
    private var currentPage = 1

    var filteredCalls: [AdminCallSummary] {
        let normalizedQuery = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        return allCalls.filter { call in
            let matchesSearch: Bool
            if normalizedQuery.isEmpty {
                matchesSearch = true
            } else {
                let fields: [String] = [
                    call.attendee?.firstName ?? "",
                    call.attendee?.lastName ?? "",
                    call.attendee?.email ?? "",
                    call.interviewer?.firstName ?? "",
                    call.interviewer?.lastName ?? "",
                    call.interviewer?.email ?? "",
                    call.service?.title ?? "",
                    call.service?.categoryName ?? "",
                    call.status,
                ]
                matchesSearch = fields.joined(separator: " ").lowercased().contains(normalizedQuery)
            }

            let matchesPassed: Bool
            if let expectedPassed = passedFilter.value {
                matchesPassed = call.passedValue == expectedPassed
            } else {
                matchesPassed = true
            }

            let matchesStatus: Bool
            if let expectedStatus = statusFilter.statusValue {
                matchesStatus = call.status == expectedStatus
            } else {
                matchesStatus = true
            }

            let matchesDate: Bool
            if let date = call.dateTime {
                matchesDate = dateFilter.includes(date)
            } else {
                matchesDate = dateFilter == .all
            }

            return matchesSearch && matchesPassed && matchesStatus && matchesDate
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
            let collection = try await TrustoraAPIClient.shared.getAdminCalls(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.calls
            var appendedCount = fetched.count
            if reset {
                allCalls = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allCalls.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allCalls.append(contentsOf: newRows)
            }

            totalCalls = max(collection.total, allCalls.count)
            currentPage = max(1, collection.currentPage)
            let canAdvance = currentPage < collection.lastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
        } catch {
            if reset {
                allCalls = []
                totalCalls = 0
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

    func updateStatus(
        call: AdminCallSummary,
        status: String,
        note: String?,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.updateAdminCallStatus(
                callID: call.id,
                status: status,
                note: note,
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

import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminProjectsViewModel: ObservableObject {
    @Published var allOrders: [AdminOrderSummary] = []
    @Published var searchText = ""
    @Published var statusFilter: AdminProjectsStatusFilter = .all

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalOrders = 0

    private let pageSize = 20
    private var currentPage = 1

    var filteredOrders: [AdminOrderSummary] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        return allOrders.filter { order in
            let matchesSearch: Bool
            if query.isEmpty {
                matchesSearch = true
            } else {
                let fields: [String] = [
                    order.orderNumber,
                    order.service?.title ?? "",
                    order.service?.categoryName ?? "",
                    order.client?.firstName ?? "",
                    order.client?.lastName ?? "",
                    order.client?.email ?? "",
                    order.provider?.firstName ?? "",
                    order.provider?.lastName ?? "",
                    order.provider?.email ?? "",
                    order.status,
                    order.paymentStatus,
                ]
                matchesSearch = fields.joined(separator: " ").lowercased().contains(query)
            }

            let matchesStatus: Bool
            if let expected = statusFilter.statusValue {
                matchesStatus = order.status.uppercased() == expected
            } else {
                matchesStatus = true
            }

            return matchesSearch && matchesStatus
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
            let collection = try await TrustoraAPIClient.shared.getAdminOrders(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.orders
            var appendedCount = fetched.count
            if reset {
                allOrders = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allOrders.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allOrders.append(contentsOf: newRows)
            }

            totalOrders = max(collection.total, allOrders.count)
            currentPage = max(1, collection.currentPage)
            let canAdvance = currentPage < collection.lastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
        } catch {
            if reset {
                allOrders = []
                totalOrders = 0
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

    func loadOrderDetail(
        orderID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminOrderSummary? {
        actionErrorMessage = nil

        do {
            return try await TrustoraAPIClient.shared.getAdminOrder(
                orderID: orderID,
                language: language,
                currency: currency,
                bearerToken: token
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func updateOrder(
        orderID: String,
        status: String,
        adminNotes: String?,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminOrderSummary? {
        isSubmitting = true
        actionErrorMessage = nil

        do {
            let updated = try await TrustoraAPIClient.shared.updateAdminOrder(
                orderID: orderID,
                status: status,
                adminNotes: adminNotes,
                language: language,
                currency: currency,
                bearerToken: token
            )

            await load(token: token, language: language, currency: currency)

            isSubmitting = false
            if let updated {
                return updated
            }
            return allOrders.first(where: { $0.id == orderID })
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
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

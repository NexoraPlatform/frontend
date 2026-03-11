import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminEarlyAccessViewModel: ObservableObject {
    @Published var selectedTab: AdminEarlyAccessTab = .providers
    @Published var providers: [AdminEarlyAccessProviderEntry] = []
    @Published var clients: [AdminEarlyAccessClientEntry] = []
    @Published var pagination: AdminEarlyAccessPagination?

    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var errorMessage: String?

    private let defaultPageSize = 20
    private var currentPage = 1

    func load(
        token: String,
        language: String,
        currency: AppCurrency,
        page: Int? = nil,
        perPage: Int? = nil,
        reset: Bool = true
    ) async {
        if reset {
            guard !isLoading else { return }
            currentPage = max(1, page ?? 1)
            hasMorePages = true
            isLoading = true
            errorMessage = nil
        } else {
            guard !isLoading, !isLoadingMore, hasMorePages else { return }
            isLoadingMore = true
        }

        let requestedPage = max(1, page ?? currentPage)
        let requestedPerPage = max(1, perPage ?? pagination?.perPage ?? defaultPageSize)

        do {
            let grouped = try await TrustoraAPIClient.shared.getAdminEarlyAccessGrouped(
                language: language,
                currency: currency,
                bearerToken: token,
                page: requestedPage,
                perPage: requestedPerPage
            )
            var appendedCount = grouped.providers.count + grouped.clients.count
            if reset {
                providers = grouped.providers
                clients = grouped.clients
            } else {
                let newProviders = grouped.providers.filter { next in
                    !providers.contains(where: { $0.id == next.id })
                }
                let newClients = grouped.clients.filter { next in
                    !clients.contains(where: { $0.id == next.id })
                }
                appendedCount = newProviders.count + newClients.count
                providers.append(contentsOf: newProviders)
                clients.append(contentsOf: newClients)
            }
            pagination = grouped.pagination
            currentPage = grouped.pagination?.currentPage ?? requestedPage
            if let pagination = grouped.pagination {
                let canAdvance = pagination.currentPage < pagination.lastPage
                hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
            } else {
                hasMorePages = !grouped.providers.isEmpty || !grouped.clients.isEmpty
            }
        } catch {
            if reset {
                providers = []
                clients = []
                pagination = nil
                hasMorePages = false
                errorMessage = resolvedMessage(for: error)
            } else {
                currentPage = max(1, currentPage - 1)
                errorMessage = resolvedMessage(for: error)
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
            page: currentPage,
            perPage: pagination?.perPage ?? defaultPageSize,
            reset: false
        )
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

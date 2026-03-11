import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminActivitiesViewModel: ObservableObject {
    @Published var activities: [AdminActivityEntry] = []
    @Published var page: Int = 1
    @Published var lastPage: Int = 1
    @Published var total: Int = 0
    @Published var perPage: Int = 0

    @Published var isLoading = false
    @Published var errorMessage: String?

    var canGoPrevious: Bool {
        page > 1
    }

    var canGoNext: Bool {
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
            let response = try await TrustoraAPIClient.shared.getAdminActivities(
                page: page,
                language: language,
                currency: currency,
                bearerToken: token
            )
            activities = response.activities
            total = response.total
            perPage = response.perPage
            page = max(1, response.currentPage)
            lastPage = max(1, response.lastPage)
        } catch {
            activities = []
            total = 0
            perPage = 0
            lastPage = 1
            errorMessage = resolvedMessage(for: error)
        }

        isLoading = false
    }

    func goToPreviousPage() {
        guard page > 1 else { return }
        page -= 1
    }

    func goToNextPage() {
        guard page < lastPage else { return }
        page += 1
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

        if let message = dictionary["message"] as? String, !message.isEmpty {
            return message
        }
        if let error = dictionary["error"] as? String, !error.isEmpty {
            return error
        }
        return payload
    }
}

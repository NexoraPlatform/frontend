import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminUsersViewModel: ObservableObject {
    @Published var allUsers: [AdminUserListItem] = []
    @Published var searchText = ""
    @Published var roleFilter: AdminUsersRoleFilter = .all
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMorePages = true
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?
    @Published var totalUsers = 0

    private let pageSize = 30
    private var currentPage = 1

    var filteredUsers: [AdminUserListItem] {
        let normalizedQuery = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        return allUsers.filter { user in
            let matchesSearch: Bool
            if normalizedQuery.isEmpty {
                matchesSearch = true
            } else {
                matchesSearch =
                    user.firstName.lowercased().contains(normalizedQuery) ||
                    user.lastName.lowercased().contains(normalizedQuery) ||
                    user.email.lowercased().contains(normalizedQuery)
            }

            let matchesFilter: Bool
            if let roleSlug = roleFilter.roleSlug {
                matchesFilter = user.hasRole(roleSlug)
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
            let collection = try await TrustoraAPIClient.shared.getAdminUsers(
                language: language,
                currency: currency,
                bearerToken: token,
                params: [
                    "page": String(currentPage),
                    "per_page": String(pageSize),
                ]
            )
            let fetched = collection.users
            var appendedCount = fetched.count
            if reset {
                allUsers = fetched
            } else {
                let newRows = fetched.filter { next in
                    !allUsers.contains(where: { $0.id == next.id })
                }
                appendedCount = newRows.count
                allUsers.append(contentsOf: newRows)
            }

            totalUsers = max(collection.total, allUsers.count)
            let resolvedPage = max(1, collection.page ?? currentPage)
            let resolvedPerPage = max(1, collection.perPage ?? pageSize)
            let resolvedLastPage =
                collection.lastPage ??
                max(1, Int(ceil(Double(max(1, totalUsers)) / Double(resolvedPerPage))))
            let canAdvance = resolvedPage < resolvedLastPage && !fetched.isEmpty
            hasMorePages = reset ? canAdvance : (canAdvance && appendedCount > 0)
            currentPage = resolvedPage
        } catch {
            if reset {
                errorMessage = resolvedMessage(for: error)
                allUsers = []
                totalUsers = 0
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

    func createUser(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        role: String,
        phone: String?,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let trimmedPhone = phone?.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = AdminCreateUserPayload(
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: role.uppercased(),
            phone: (trimmedPhone?.isEmpty == false) ? trimmedPhone : nil
        )

        do {
            _ = try await TrustoraAPIClient.shared.createAdminUser(
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

    func performStatusAction(
        _ action: AdminUserStatusAction,
        user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.updateAdminUserStatus(
                userID: user.id,
                status: action.rawValue,
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

    func deleteUser(
        _ user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminUser(
                userID: user.id,
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

    func toggleSuperuser(
        _ user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.setAdminUserSuperuser(
                userID: user.id,
                isSuperuser: user.isSuperuser,
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

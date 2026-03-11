import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminRolesViewModel: ObservableObject {
    @Published var selectedTab: AdminRolesTab = .roles

    @Published var roles: [AdminRoleSummary] = []
    @Published var page: Int = 1
    @Published var pageSize: Int = 10
    @Published var total: Int = 0
    @Published var lastPage: Int = 1
    @Published var searchText = ""
    @Published var appliedSearch = ""

    @Published var permissionGroups: [AdminPermissionGroup] = []
    @Published var matrixRoles: [AdminRoleLite] = []
    @Published var matrixSelections: [String: Set<String>] = [:]
    @Published var matrixFilter = ""
    @Published var matrixSavingRoles: Set<String> = []
    @Published var matrixOpenGroups: Set<String> = []

    @Published var isLoadingRoles = false
    @Published var isLoadingMatrix = false
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var actionErrorMessage: String?

    private var permissionSyncTasks: [String: Task<Void, Never>] = [:]

    var canGoPrevious: Bool {
        page > 1
    }

    var canGoNext: Bool {
        page < lastPage
    }

    var filteredPermissionGroups: [AdminPermissionGroup] {
        let query = matrixFilter.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else {
            return permissionGroups
        }

        return permissionGroups.compactMap { group in
            let filteredPermissions = group.permissions.filter { permission in
                permission.name.lowercased().contains(query) ||
                permission.slug.lowercased().contains(query) ||
                permission.description.lowercased().contains(query)
            }
            guard !filteredPermissions.isEmpty else {
                return nil
            }
            return AdminPermissionGroup(
                id: group.id,
                name: group.name,
                slug: group.slug,
                permissions: filteredPermissions
            )
        }
    }

    deinit {
        permissionSyncTasks.values.forEach { $0.cancel() }
    }

    func loadInitial(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        await loadRoles(
            token: token,
            language: language,
            currency: currency
        )
    }

    func loadRoles(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        isLoadingRoles = true
        errorMessage = nil

        do {
            let collection = try await TrustoraAPIClient.shared.getAdminRoles(
                language: language,
                currency: currency,
                bearerToken: token,
                search: appliedSearch.isEmpty ? nil : appliedSearch,
                page: page,
                pageSize: pageSize
            )
            roles = collection.roles
            total = collection.total
            page = max(1, collection.currentPage)
            lastPage = max(1, collection.lastPage)
        } catch {
            roles = []
            total = 0
            lastPage = 1
            errorMessage = resolvedMessage(for: error)
        }

        isLoadingRoles = false
    }

    func applySearch() {
        appliedSearch = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        page = 1
    }

    func clearSearch() {
        searchText = ""
        appliedSearch = ""
        page = 1
    }

    func setPageSize(_ newValue: Int) {
        let safe = max(1, newValue)
        guard safe != pageSize else { return }
        pageSize = safe
        page = 1
    }

    func goToPreviousPage() {
        guard page > 1 else { return }
        page -= 1
    }

    func goToNextPage() {
        guard page < lastPage else { return }
        page += 1
    }

    func moveRole(
        roleID: String,
        direction: Int,
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        guard let index = roles.firstIndex(where: { $0.id == roleID }) else { return }
        let target = index + direction
        guard target >= 0, target < roles.count else { return }

        var reordered = roles
        reordered.swapAt(index, target)
        roles = reordered.enumerated().map { idx, role in
            AdminRoleSummary(
                id: role.id,
                name: role.name,
                slug: role.slug,
                description: role.description,
                sortOrder: (page - 1) * pageSize + idx + 1,
                permissionsCount: role.permissionsCount
            )
        }

        let updates = roles.map { role in
            (id: role.id, sortOrder: role.sortOrder ?? 0)
        }
        isSubmitting = true
        actionErrorMessage = nil
        do {
            try await withThrowingTaskGroup(of: Void.self) { group in
                for item in updates {
                    group.addTask {
                        try await TrustoraAPIClient.shared.updateAdminRoleSortOrder(
                            roleID: item.id,
                            sortOrder: item.sortOrder,
                            language: language,
                            currency: currency,
                            bearerToken: token
                        )
                    }
                }
                try await group.waitForAll()
            }
            await loadRoles(token: token, language: language, currency: currency)
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            await loadRoles(token: token, language: language, currency: currency)
        }
        isSubmitting = false
    }

    func deleteRole(
        roleID: String,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        do {
            try await TrustoraAPIClient.shared.deleteAdminRole(
                roleID: roleID,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await loadRoles(token: token, language: language, currency: currency)
            if !matrixRoles.isEmpty {
                await loadPermissionMatrix(
                    token: token,
                    language: language,
                    currency: currency
                )
            }
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func loadRoleEditorDraft(
        roleID: String?,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> AdminRoleEditorDraft? {
        actionErrorMessage = nil

        if permissionGroups.isEmpty {
            do {
                permissionGroups = try await TrustoraAPIClient.shared.getAdminPermissionGroups(
                    language: language,
                    currency: currency,
                    bearerToken: token
                )
                if matrixOpenGroups.isEmpty {
                    matrixOpenGroups = Set(permissionGroups.map(\.id))
                }
            } catch {
                actionErrorMessage = resolvedMessage(for: error)
                return nil
            }
        }

        guard let roleID else {
            return AdminRoleEditorDraft()
        }

        do {
            let detail = try await TrustoraAPIClient.shared.getAdminRole(
                roleID: roleID,
                language: language,
                currency: currency,
                bearerToken: token
            )
            return AdminRoleEditorDraft(
                roleID: detail.id,
                name: detail.name,
                description: detail.description,
                sortOrder: detail.sortOrder,
                permissionIDs: Set(detail.permissionIDs)
            )
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            return nil
        }
    }

    func createRole(
        draft: AdminRoleEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminCreateRolePayload(
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            permissionIDs: Array(draft.permissionIDs)
        )

        do {
            _ = try await TrustoraAPIClient.shared.createAdminRole(
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )
            await loadRoles(token: token, language: language, currency: currency)
            if selectedTab == .permissions || !matrixRoles.isEmpty {
                await loadPermissionMatrix(token: token, language: language, currency: currency)
            }
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func updateRole(
        draft: AdminRoleEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency
    ) async -> Bool {
        guard let roleID = draft.roleID else {
            return false
        }

        isSubmitting = true
        actionErrorMessage = nil

        let payload = AdminUpdateRolePayload(
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: draft.description.trimmingCharacters(in: .whitespacesAndNewlines),
            permissionIDs: Array(draft.permissionIDs)
        )

        do {
            _ = try await TrustoraAPIClient.shared.updateAdminRole(
                roleID: roleID,
                payload: payload,
                language: language,
                currency: currency,
                bearerToken: token
            )

            try await TrustoraAPIClient.shared.updateAdminRoleSortOrder(
                roleID: roleID,
                sortOrder: draft.sortOrder,
                language: language,
                currency: currency,
                bearerToken: token
            )

            await loadRoles(token: token, language: language, currency: currency)
            if selectedTab == .permissions || !matrixRoles.isEmpty {
                await loadPermissionMatrix(token: token, language: language, currency: currency)
            }
            isSubmitting = false
            return true
        } catch {
            actionErrorMessage = resolvedMessage(for: error)
            isSubmitting = false
            return false
        }
    }

    func loadPermissionMatrix(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        isLoadingMatrix = true
        errorMessage = nil
        actionErrorMessage = nil

        do {
            async let groupsTask = TrustoraAPIClient.shared.getAdminPermissionGroups(
                language: language,
                currency: currency,
                bearerToken: token
            )

            async let rolesTask = TrustoraAPIClient.shared.getAdminRolesLite(
                language: language,
                currency: currency,
                bearerToken: token
            )

            let groups = try await groupsTask
            let roles = try await rolesTask

            permissionGroups = groups
            matrixRoles = roles
            if matrixOpenGroups.isEmpty {
                matrixOpenGroups = Set(groups.map(\.id))
            }

            var selections: [String: Set<String>] = [:]
            for role in roles {
                let slugs = try await TrustoraAPIClient.shared.getAdminRolePermissionSlugs(
                    roleSlug: role.slug,
                    language: language,
                    currency: currency,
                    bearerToken: token
                )
                selections[role.slug] = Set(slugs)
            }
            matrixSelections = selections
        } catch {
            matrixRoles = []
            matrixSelections = [:]
            errorMessage = resolvedMessage(for: error)
        }

        isLoadingMatrix = false
    }

    func roleColumnState(roleSlug: String) -> (all: Bool, none: Bool, indeterminate: Bool) {
        let visiblePermissions = filteredPermissionGroups.flatMap { $0.permissions.map(\.slug) }
        guard !visiblePermissions.isEmpty else {
            return (all: false, none: true, indeterminate: false)
        }
        let selected = matrixSelections[roleSlug] ?? []
        let count = visiblePermissions.reduce(0) { partial, slug in
            partial + (selected.contains(slug) ? 1 : 0)
        }
        return (
            all: count == visiblePermissions.count,
            none: count == 0,
            indeterminate: count > 0 && count < visiblePermissions.count
        )
    }

    func groupRoleState(group: AdminPermissionGroup, roleSlug: String) -> (all: Bool, none: Bool, indeterminate: Bool) {
        guard !group.permissions.isEmpty else {
            return (all: false, none: true, indeterminate: false)
        }
        let selected = matrixSelections[roleSlug] ?? []
        let slugs = group.permissions.map(\.slug)
        let count = slugs.reduce(0) { partial, slug in
            partial + (selected.contains(slug) ? 1 : 0)
        }
        return (
            all: count == slugs.count,
            none: count == 0,
            indeterminate: count > 0 && count < slugs.count
        )
    }

    func isPermissionEnabled(roleSlug: String, permissionSlug: String) -> Bool {
        matrixSelections[roleSlug]?.contains(permissionSlug) ?? false
    }

    func togglePermission(
        role: AdminRoleLite,
        permissionSlug: String,
        enabled: Bool,
        token: String,
        language: String,
        currency: AppCurrency
    ) {
        var selected = matrixSelections[role.slug] ?? []
        if enabled {
            selected.insert(permissionSlug)
        } else {
            selected.remove(permissionSlug)
        }
        matrixSelections[role.slug] = selected
        queuePermissionSync(
            role: role,
            token: token,
            language: language,
            currency: currency
        )
    }

    func toggleRoleColumn(
        role: AdminRoleLite,
        enabled: Bool,
        token: String,
        language: String,
        currency: AppCurrency
    ) {
        let visible = filteredPermissionGroups.flatMap { $0.permissions.map(\.slug) }
        var selected = matrixSelections[role.slug] ?? []
        if enabled {
            for slug in visible {
                selected.insert(slug)
            }
        } else {
            for slug in visible {
                selected.remove(slug)
            }
        }
        matrixSelections[role.slug] = selected
        queuePermissionSync(
            role: role,
            token: token,
            language: language,
            currency: currency
        )
    }

    func toggleGroupForRole(
        group: AdminPermissionGroup,
        role: AdminRoleLite,
        enabled: Bool,
        token: String,
        language: String,
        currency: AppCurrency
    ) {
        var selected = matrixSelections[role.slug] ?? []
        for permission in group.permissions {
            if enabled {
                selected.insert(permission.slug)
            } else {
                selected.remove(permission.slug)
            }
        }
        matrixSelections[role.slug] = selected
        queuePermissionSync(
            role: role,
            token: token,
            language: language,
            currency: currency
        )
    }

    func toggleGroupExpanded(_ groupID: String) {
        if matrixOpenGroups.contains(groupID) {
            matrixOpenGroups.remove(groupID)
        } else {
            matrixOpenGroups.insert(groupID)
        }
    }

    private func queuePermissionSync(
        role: AdminRoleLite,
        token: String,
        language: String,
        currency: AppCurrency
    ) {
        permissionSyncTasks[role.slug]?.cancel()
        matrixSavingRoles.insert(role.slug)

        let task = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: 350_000_000)
            if Task.isCancelled { return }

            let selected = Array(self.matrixSelections[role.slug] ?? [])

            do {
                try await TrustoraAPIClient.shared.updateAdminRolePermissionsBySlug(
                    roleID: role.id,
                    permissionSlugs: selected,
                    language: language,
                    currency: currency,
                    bearerToken: token
                )
            } catch {
                self.actionErrorMessage = self.resolvedMessage(for: error)
            }

            self.matrixSavingRoles.remove(role.slug)
            self.permissionSyncTasks.removeValue(forKey: role.slug)
        }
        permissionSyncTasks[role.slug] = task
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


import Foundation

enum AdminRolesTab: String, CaseIterable, Identifiable {
    case roles
    case permissions

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .roles:
            return "admin.roles.tabs.roles"
        case .permissions:
            return "admin.roles.tabs.permissions"
        }
    }
}

struct AdminRoleEditorDraft: Equatable {
    var roleID: String?
    var name: String = ""
    var description: String = ""
    var sortOrder: Int = 0
    var permissionIDs: Set<String> = []

    var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

struct AdminPermissionMatrixGroup: Identifiable, Equatable {
    let id: String
    let name: String
    let slug: String
    let permissions: [AdminPermissionSummary]
}

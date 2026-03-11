import Foundation

enum AdminUsersRoleFilter: String, CaseIterable, Identifiable {
    case all
    case client
    case provider
    case admin

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.users.filter_all"
        case .client:
            return "admin.users.filter_clients"
        case .provider:
            return "admin.users.filter_providers"
        case .admin:
            return "admin.users.filter_admins"
        }
    }

    var roleSlug: String? {
        switch self {
        case .all:
            return nil
        case .client:
            return "CLIENT"
        case .provider:
            return "PROVIDER"
        case .admin:
            return "ADMIN"
        }
    }
}

enum AdminUserStatusAction: String {
    case verify
    case suspend
    case activate
}


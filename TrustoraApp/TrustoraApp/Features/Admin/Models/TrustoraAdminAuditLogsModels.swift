import Foundation

enum AdminAuditLogEventFilter: String, CaseIterable, Identifiable {
    case all
    case created
    case updated
    case deleted

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.audit_logs.filters.event.all"
        case .created:
            return "admin.audit_logs.filters.event.created"
        case .updated:
            return "admin.audit_logs.filters.event.updated"
        case .deleted:
            return "admin.audit_logs.filters.event.deleted"
        }
    }

    var value: String? {
        switch self {
        case .all:
            return nil
        case .created:
            return "created"
        case .updated:
            return "updated"
        case .deleted:
            return "deleted"
        }
    }
}

struct AdminAuditLogDiffItem: Identifiable, Equatable {
    let key: String
    let oldValue: String?
    let newValue: String?

    var id: String { key }
}

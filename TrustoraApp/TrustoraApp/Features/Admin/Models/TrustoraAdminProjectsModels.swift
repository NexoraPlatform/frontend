import Foundation

enum AdminProjectsStatusFilter: String, CaseIterable, Identifiable {
    case all
    case pending
    case accepted
    case inProgress
    case delivered
    case completed
    case cancelled
    case disputed

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.orders.statuses.all"
        case .pending:
            return "admin.orders.statuses.pending"
        case .accepted:
            return "admin.orders.statuses.accepted"
        case .inProgress:
            return "admin.orders.statuses.in_progress"
        case .delivered:
            return "admin.orders.statuses.delivered"
        case .completed:
            return "admin.orders.statuses.completed"
        case .cancelled:
            return "admin.orders.statuses.cancelled"
        case .disputed:
            return "admin.orders.statuses.disputed"
        }
    }

    var statusValue: String? {
        switch self {
        case .all:
            return nil
        case .pending:
            return "PENDING"
        case .accepted:
            return "ACCEPTED"
        case .inProgress:
            return "IN_PROGRESS"
        case .delivered:
            return "DELIVERED"
        case .completed:
            return "COMPLETED"
        case .cancelled:
            return "CANCELLED"
        case .disputed:
            return "DISPUTED"
        }
    }
}

enum AdminOrderStatusOption: String, CaseIterable, Identifiable {
    case pending = "PENDING"
    case accepted = "ACCEPTED"
    case inProgress = "IN_PROGRESS"
    case delivered = "DELIVERED"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
    case disputed = "DISPUTED"

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .pending:
            return "admin.orders.statuses.pending"
        case .accepted:
            return "admin.orders.statuses.accepted"
        case .inProgress:
            return "admin.orders.statuses.in_progress"
        case .delivered:
            return "admin.orders.statuses.delivered"
        case .completed:
            return "admin.orders.statuses.completed"
        case .cancelled:
            return "admin.orders.statuses.cancelled"
        case .disputed:
            return "admin.orders.statuses.disputed"
        }
    }
}

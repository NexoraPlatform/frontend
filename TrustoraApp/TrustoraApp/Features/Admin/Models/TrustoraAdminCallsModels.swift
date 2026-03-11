import Foundation

enum AdminCallsPassedFilter: String, CaseIterable, Identifiable {
    case all
    case yes
    case no

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.calls.filters.passed.all"
        case .yes:
            return "admin.calls.filters.passed.yes"
        case .no:
            return "admin.calls.filters.passed.no"
        }
    }

    var value: Int? {
        switch self {
        case .all:
            return nil
        case .yes:
            return 1
        case .no:
            return 0
        }
    }
}

enum AdminCallsStatusFilter: String, CaseIterable, Identifiable {
    case all
    case waiting
    case accepted
    case finished
    case refused
    case noShow

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.calls.filters.status.all"
        case .waiting:
            return "admin.calls.statuses.WAITING"
        case .accepted:
            return "admin.calls.statuses.ACCEPTED"
        case .finished:
            return "admin.calls.statuses.FINISHED"
        case .refused:
            return "admin.calls.statuses.REFUSED"
        case .noShow:
            return "admin.calls.statuses.NO_SHOW"
        }
    }

    var statusValue: String? {
        switch self {
        case .all:
            return nil
        case .waiting:
            return "WAITING"
        case .accepted:
            return "ACCEPTED"
        case .finished:
            return "FINISHED"
        case .refused:
            return "REFUSED"
        case .noShow:
            return "NO_SHOW"
        }
    }
}

enum AdminCallsDateRangeFilter: String, CaseIterable, Identifiable {
    case all
    case today
    case last7Days
    case last30Days

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .all:
            return "admin.calls.filters.date.all"
        case .today:
            return "admin.calls.filters.date.today"
        case .last7Days:
            return "admin.calls.filters.date.last_7_days"
        case .last30Days:
            return "admin.calls.filters.date.last_30_days"
        }
    }

    func includes(_ date: Date, now: Date = Date(), calendar: Calendar = .current) -> Bool {
        switch self {
        case .all:
            return true
        case .today:
            return calendar.isDate(date, inSameDayAs: now)
        case .last7Days:
            guard let threshold = calendar.date(byAdding: .day, value: -7, to: now) else {
                return true
            }
            return date >= threshold
        case .last30Days:
            guard let threshold = calendar.date(byAdding: .day, value: -30, to: now) else {
                return true
            }
            return date >= threshold
        }
    }
}

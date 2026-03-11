import Foundation
import SwiftUI
import Combine

@MainActor
final class TrustoraAdminAuditLogsViewModel: ObservableObject {
    @Published var logs: [AdminAuditLogEntry] = []
    @Published var page: Int = 1
    @Published var lastPage: Int = 1
    @Published var total: Int = 0

    @Published var selectedEvent: AdminAuditLogEventFilter = .all
    @Published var userSearchText = ""
    @Published private(set) var appliedUserID: Int?
    @Published var dateFrom: Date
    @Published var dateTo: Date

    @Published var expandedLogIDs: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    var canGoPrevious: Bool {
        page > 1
    }

    var canGoNext: Bool {
        page < lastPage
    }

    init(now: Date = Date(), calendar: Calendar = .current) {
        dateTo = now
        dateFrom = calendar.date(byAdding: .day, value: -30, to: now) ?? now
    }

    func load(
        token: String,
        language: String,
        currency: AppCurrency
    ) async {
        isLoading = true
        errorMessage = nil

        do {
            let normalizedRange = normalizedDateRange()
            let response = try await TrustoraAPIClient.shared.getAdminAuditLogs(
                page: page,
                event: selectedEvent.value,
                userID: appliedUserID,
                subjectType: nil,
                dateFrom: Self.queryDateFormatter.string(from: normalizedRange.from),
                dateTo: Self.queryDateFormatter.string(from: normalizedRange.to),
                language: language,
                currency: currency,
                bearerToken: token
            )

            logs = response.logs
            total = response.total
            page = max(1, response.currentPage)
            lastPage = max(1, response.lastPage)
            expandedLogIDs = expandedLogIDs.intersection(Set(logs.map(\.id)))
        } catch {
            logs = []
            total = 0
            lastPage = 1
            expandedLogIDs = []
            errorMessage = resolvedMessage(for: error)
        }

        isLoading = false
    }

    func applySearch() {
        let trimmed = userSearchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            appliedUserID = nil
            page = 1
            return
        }
        if let userID = Int(trimmed) {
            appliedUserID = userID
            page = 1
        }
    }

    func clearSearch() {
        userSearchText = ""
        appliedUserID = nil
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

    func toggleExpanded(logID: String) {
        if expandedLogIDs.contains(logID) {
            expandedLogIDs.remove(logID)
        } else {
            expandedLogIDs.insert(logID)
        }
    }

    func isExpanded(logID: String) -> Bool {
        expandedLogIDs.contains(logID)
    }

    func diffItems(for log: AdminAuditLogEntry) -> [AdminAuditLogDiffItem] {
        let allKeys = Set(log.oldValues.keys).union(log.newValues.keys).sorted()
        return allKeys.compactMap { key in
            let oldValue = log.oldValues[key]
            let newValue = log.newValues[key]
            if oldValue == newValue {
                return nil
            }
            return AdminAuditLogDiffItem(key: key, oldValue: oldValue, newValue: newValue)
        }
    }

    private func normalizedDateRange() -> (from: Date, to: Date) {
        if dateFrom <= dateTo {
            return (from: dateFrom, to: dateTo)
        }
        return (from: dateTo, to: dateFrom)
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

    private static let queryDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()
}

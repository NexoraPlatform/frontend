import Foundation

enum AdminEarlyAccessTab: String, CaseIterable, Identifiable {
    case providers
    case clients

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .providers:
            return "admin.early_access.providers.title"
        case .clients:
            return "admin.early_access.clients.title"
        }
    }
}

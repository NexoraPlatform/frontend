import SwiftUI

enum AppLanguage: String, CaseIterable, Identifiable {
    case system
    case en
    case ro

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .system:
            return "settings.language.system"
        case .en:
            return "settings.language.english"
        case .ro:
            return "settings.language.romanian"
        }
    }
}


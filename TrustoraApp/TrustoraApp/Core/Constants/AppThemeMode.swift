import SwiftUI

enum AppThemeMode: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    static let storageKey = "trustora.app.theme"

    var id: String { rawValue }

    var titleKey: String {
        switch self {
        case .system:
            return "settings.theme.system"
        case .light:
            return "settings.theme.light"
        case .dark:
            return "settings.theme.dark"
        }
    }

    var shortTitleKey: String {
        switch self {
        case .system:
            return "settings.theme.system.short"
        case .light:
            return "settings.theme.light.short"
        case .dark:
            return "settings.theme.dark.short"
        }
    }

    var iconName: String {
        switch self {
        case .system:
            return "circle.lefthalf.filled"
        case .light:
            return "sun.max.fill"
        case .dark:
            return "moon.fill"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system:
            return nil
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }
}

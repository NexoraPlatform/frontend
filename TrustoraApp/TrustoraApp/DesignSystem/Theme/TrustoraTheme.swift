import SwiftUI

enum TrustoraTheme {
    static let accent = Color(hex: 0x1BC47D)
    static let primary = Color(hex: 0x0B1C2D)
    static let background = Color(hex: 0xF5F7FA)
    static let surface = Color.white
    static let mutedSurface = Color(hex: 0xF8FAFC)
    static let primaryText = Color(hex: 0x0F172A)
    static let secondaryText = Color(hex: 0x334155)
    static let tertiaryText = Color(hex: 0x64748B)
    static let border = Color(hex: 0xE2E8F0)
    static let accentButtonText = Color(hex: 0x071A12)
}

enum TrustoraTypography {
    static let heroTitle = Font.system(size: 34, weight: .heavy, design: .rounded)
    static let pageTitle = Font.system(size: 28, weight: .black, design: .rounded)
    static let sectionTitle = Font.system(size: 24, weight: .black, design: .rounded)
    static let cardTitle = Font.system(size: 16, weight: .bold)
    static let emphasis = Font.system(size: 14, weight: .bold)
    static let body = Font.system(size: 14, weight: .medium)
    static let paragraph = Font.system(size: 13, weight: .medium)
    static let control = Font.system(size: 12, weight: .semibold)
    static let label = Font.system(size: 11, weight: .bold)
    static let caption = Font.system(size: 10, weight: .bold)

    static func brandTitle(compact: Bool) -> Font {
        .system(size: compact ? 23 : 25, weight: .black)
    }

    static func brandTagline(compact: Bool) -> Font {
        .system(size: compact ? 10 : 11, weight: .medium)
    }
}

enum TrustoraMetrics {
    static let pageHorizontalPadding: CGFloat = 16
    static let pageTopPadding: CGFloat = 14
    static let pageBottomPadding: CGFloat = 28
    static let sectionSpacing: CGFloat = 16
    static let cardPadding: CGFloat = 18
    static let compactCardPadding: CGFloat = 14
    static let cardRadius: CGFloat = 18
    static let compactCardRadius: CGFloat = 14
}


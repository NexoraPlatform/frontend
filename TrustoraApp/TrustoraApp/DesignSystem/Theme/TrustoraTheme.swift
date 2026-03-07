import SwiftUI

enum TrustoraTheme {
    static let accent = adaptive(light: 0x1BC47D, dark: 0x1BC47D)
    static let primary = adaptive(light: 0x0B1C2D, dark: 0xE2E8F0)
    static let background = adaptive(light: 0xF5F7FA, dark: 0x0B1220)
    static let surface = adaptive(light: 0xFFFFFF, dark: 0x111827)
    static let mutedSurface = adaptive(light: 0xF8FAFC, dark: 0x1B2638)
    static let primaryText = adaptive(light: 0x0F172A, dark: 0xF1F5F9)
    static let secondaryText = adaptive(light: 0x334155, dark: 0xCBD5E1)
    static let tertiaryText = adaptive(light: 0x64748B, dark: 0x94A3B8)
    static let border = adaptive(light: 0xE2E8F0, dark: 0x334155)
    static let accentButtonText = adaptive(light: 0x071A12, dark: 0x04120C)

    private static func adaptive(light: UInt, dark: UInt) -> Color {
#if canImport(UIKit)
        return Color(
            uiColor: UIColor { traits in
                let isDark = traits.userInterfaceStyle == .dark
                let hex = isDark ? dark : light
                return UIColor(
                    red: CGFloat((hex >> 16) & 0xFF) / 255,
                    green: CGFloat((hex >> 8) & 0xFF) / 255,
                    blue: CGFloat(hex & 0xFF) / 255,
                    alpha: 1
                )
            }
        )
#else
        return Color(hex: light)
#endif
    }
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

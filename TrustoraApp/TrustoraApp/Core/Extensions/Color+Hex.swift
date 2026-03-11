import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

extension Color {
    init(hex: UInt, opacity: Double = 1) {
#if canImport(UIKit)
        self.init(
            uiColor: UIColor { traits in
                let mappedHex = Self.mappedHexForAppearance(
                    hex: hex,
                    isDarkMode: traits.userInterfaceStyle == .dark
                )
                return UIColor(
                    red: CGFloat((mappedHex >> 16) & 0xFF) / 255,
                    green: CGFloat((mappedHex >> 8) & 0xFF) / 255,
                    blue: CGFloat(mappedHex & 0xFF) / 255,
                    alpha: opacity
                )
            }
        )
#else
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
#endif
    }

    private static func mappedHexForAppearance(hex: UInt, isDarkMode: Bool) -> UInt {
        guard isDarkMode else {
            return hex
        }

        switch hex {
        case 0xFFFFFF:
            return 0x111827
        case 0xF8FAFC:
            return 0x1B2638
        case 0xF5F7FA:
            return 0x0B1220
        case 0xF1F5F9:
            return 0x273548
        case 0xE2E8F0:
            return 0x334155
        case 0xCBD5E1:
            return 0x475569
        case 0x94A3B8:
            return 0xAFC0D3
        case 0x64748B:
            return 0x94A3B8
        case 0x475569:
            return 0xB2C0D0
        case 0x334155:
            return 0xCBD5E1
        case 0x1E293B:
            return 0xD3DEEA
        case 0x0F172A:
            return 0xF1F5F9
        default:
            return hex
        }
    }
}

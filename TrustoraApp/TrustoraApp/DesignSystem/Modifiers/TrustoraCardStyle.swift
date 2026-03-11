import SwiftUI

extension View {
    func trustoraCardStyle(
        cornerRadius: CGFloat = TrustoraMetrics.cardRadius,
        background: Color = TrustoraTheme.surface,
        border: Color = TrustoraTheme.border,
        lineWidth: CGFloat = 1
    ) -> some View {
        self
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(border, lineWidth: lineWidth)
            )
    }
}

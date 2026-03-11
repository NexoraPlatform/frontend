import SwiftUI

struct BrandLockup: View {
    let compact: Bool
    let tagline: String
    var forceSingleLine = false
    var showsLogoIcon = true

    var body: some View {
        HStack(spacing: compact ? 10 : 12) {
            if showsLogoIcon {
                Image("TrustoraLogo")
                    .resizable()
                    .scaledToFill()
                    .frame(width: compact ? 36 : 42, height: compact ? 36 : 42)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            VStack(alignment: .leading, spacing: 1) {
                Text("Trustora")
                    .font(TrustoraTypography.brandTitle(compact: compact))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [TrustoraTheme.accent, TrustoraTheme.primary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .lineLimit(forceSingleLine ? 1 : nil)
                    .minimumScaleFactor(forceSingleLine ? 0.72 : 1)
                    .allowsTightening(forceSingleLine)
                    .truncationMode(.tail)

                Text(tagline)
                    .font(TrustoraTypography.brandTagline(compact: compact))
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .lineLimit(forceSingleLine ? 1 : nil)
                    .minimumScaleFactor(forceSingleLine ? 0.72 : 1)
                    .allowsTightening(forceSingleLine)
                    .truncationMode(.tail)
            }
        }
    }
}

struct MenuLinkRow: View {
    let icon: String
    let title: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.primaryText)
                .frame(width: 22)

            Text(title)
                .font(TrustoraTypography.emphasis)
                .foregroundStyle(TrustoraTheme.primaryText)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }
}

struct FooterSectionTitle: View {
    let text: String

    var body: some View {
        Text(text)
            .font(TrustoraTypography.cardTitle)
            .foregroundStyle(TrustoraTheme.primaryText)
    }
}

struct FooterLinkRow: View {
    let icon: String
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.accent)
            Text(title)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primaryText)
            Spacer()
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }
}

struct FooterIconButton: View {
    let icon: String
    let accessibilityLabel: String

    var body: some View {
        Button(action: {}) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(TrustoraTheme.primaryText)
                .frame(width: 40, height: 40)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
        }
        .accessibilityLabel(accessibilityLabel)
    }
}

struct ContactCard: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.accent)
                .frame(width: 18)

            Text(text)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }
}

struct AuthAvatarView: View {
    let user: TrustoraAuthUser
    let size: CGFloat

    private var initials: String {
        let firstInitial = user.firstName.first.map { String($0) } ?? ""
        let lastInitial = user.lastName.first.map { String($0) } ?? ""
        let combined = (firstInitial + lastInitial).uppercased()
        return combined.isEmpty ? "U" : combined
    }

    var body: some View {
        Group {
            if let avatar = user.avatar,
               let url = URL(string: avatar),
               !avatar.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackAvatar
                    }
                }
            } else {
                fallbackAvatar
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                .stroke(TrustoraTheme.border.opacity(0.75), lineWidth: 1)
        )
    }

    private var fallbackAvatar: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1BC47D), Color(hex: 0x0B1C2D)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(initials)
                .font(.system(size: max(12, size * 0.34), weight: .black))
                .foregroundStyle(Color.white)
        }
    }
}

struct PillarCard: View {
    let icon: String
    let title: String
    let description: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(accent)

            Text(title)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primaryText)

            Text(description)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(TrustoraTheme.border, lineWidth: 1)
        )
    }
}

struct MessagingCard: View {
    let badge: String
    let title: String
    let descriptionText: String
    let benefits: [String]
    let linkLabel: String
    let dark: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(badge)
                .font(TrustoraTypography.caption)
                .foregroundStyle(dark ? Color.white : Color(hex: 0x0F172A))
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background((dark ? Color.white.opacity(0.12) : Color(hex: 0xE2E8F0)))
                .clipShape(RoundedRectangle(cornerRadius: 6))

            Text(title)
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(dark ? .white : Color(hex: 0x0F172A))
                .fixedSize(horizontal: false, vertical: true)

            Text(descriptionText)
                .font(TrustoraTypography.body)
                .foregroundStyle(dark ? Color.white.opacity(0.78) : Color(hex: 0x64748B))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(benefits, id: \.self) { benefit in
                    HStack(alignment: .top, spacing: 8) {
                        Text("✅")
                        Text(benefit)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(dark ? .white : Color(hex: 0x0F172A))
                    }
                }
            }

            Text(linkLabel)
                .font(TrustoraTypography.emphasis)
                .foregroundStyle(dark ? .white : Color(hex: 0x0F172A))
                .padding(.top, 2)
        }
        .padding(18)
        .background(dark ? Color(hex: 0x0B1C2D) : TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(dark ? Color(hex: 0x1E2A3D) : Color(hex: 0xE2E8F0), lineWidth: 1)
        )
    }
}

struct VisualNodeCard: View {
    let emoji: String
    let title: String
    let subtitle: String
    let highlighted: Bool

    var body: some View {
        VStack(spacing: 9) {
            Text(emoji)
                .font(.system(size: 24))

            Text(title.uppercased())
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.primaryText)

            Text(subtitle)
                .font(TrustoraTypography.label)
                .foregroundStyle(highlighted ? Color(hex: 0x0C8F5D) : TrustoraTheme.tertiaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(TrustoraTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(highlighted ? Color(hex: 0x1BC47D) : TrustoraTheme.border, lineWidth: highlighted ? 2 : 1)
        )
        .shadow(color: highlighted ? Color(hex: 0x1BC47D).opacity(0.18) : .clear, radius: 12, x: 0, y: 6)
    }
}

struct BottomNavigationTrackSurface: View {
    var body: some View {
        Capsule()
            .fill(TrustoraTheme.surface)
            .overlay(surfaceStroke)
            .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 4)
    }

    private var surfaceStroke: some View {
        Capsule()
            .stroke(
                LinearGradient(
                    colors: [TrustoraTheme.border.opacity(0.7), TrustoraTheme.border.opacity(0.2)],
                    startPoint: .top,
                    endPoint: .bottom
                ),
                lineWidth: 1
            )
    }
}

struct BottomNavigationSelectionSurface: View {
    let tint: Color
    let segmentShape: BottomNavigationSegmentShape

    var body: some View {
        LinearGradient(
            colors: [
                tint.opacity(0.92),
                tint.opacity(0.76)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .clipShape(segmentShape)
        .overlay(
            segmentShape
                .stroke(
                    LinearGradient(
                        colors: [Color.white.opacity(0.4), Color.white.opacity(0.12)],
                        startPoint: .top,
                        endPoint: .bottom
                    ),
                    lineWidth: 1
                )
        )
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 4)
    }
}

struct BottomNavigationSegmentShape: Shape {
    let roundLeading: Bool
    let roundTrailing: Bool

    func path(in rect: CGRect) -> Path {
        let radius = min(rect.height * 0.5, rect.width * 0.5)
        let topLeading = roundLeading ? radius : 0
        let bottomLeading = roundLeading ? radius : 0
        let topTrailing = roundTrailing ? radius : 0
        let bottomTrailing = roundTrailing ? radius : 0

        var path = Path()

        path.move(to: CGPoint(x: rect.minX + topLeading, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - topTrailing, y: rect.minY))

        if topTrailing > 0 {
            path.addArc(
                center: CGPoint(x: rect.maxX - topTrailing, y: rect.minY + topTrailing),
                radius: topTrailing,
                startAngle: .degrees(-90),
                endAngle: .degrees(0),
                clockwise: false
            )
        }

        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomTrailing))

        if bottomTrailing > 0 {
            path.addArc(
                center: CGPoint(x: rect.maxX - bottomTrailing, y: rect.maxY - bottomTrailing),
                radius: bottomTrailing,
                startAngle: .degrees(0),
                endAngle: .degrees(90),
                clockwise: false
            )
        }

        path.addLine(to: CGPoint(x: rect.minX + bottomLeading, y: rect.maxY))

        if bottomLeading > 0 {
            path.addArc(
                center: CGPoint(x: rect.minX + bottomLeading, y: rect.maxY - bottomLeading),
                radius: bottomLeading,
                startAngle: .degrees(90),
                endAngle: .degrees(180),
                clockwise: false
            )
        }

        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + topLeading))

        if topLeading > 0 {
            path.addArc(
                center: CGPoint(x: rect.minX + topLeading, y: rect.minY + topLeading),
                radius: topLeading,
                startAngle: .degrees(180),
                endAngle: .degrees(270),
                clockwise: false
            )
        }

        path.closeSubpath()
        return path
    }
}

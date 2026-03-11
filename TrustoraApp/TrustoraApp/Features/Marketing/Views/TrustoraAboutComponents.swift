import SwiftUI

struct AboutValueCard: View {
    let value: AboutValue
    let trustoraGreen: Color
    let midnightBlue: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            RoundedRectangle(cornerRadius: 14)
                .fill(trustoraGreen.opacity(0.12))
                .frame(width: 46, height: 46)
                .overlay {
                    Image(systemName: value.iconName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(trustoraGreen)
                }

            Text(value.title)
                .font(TrustoraTypography.emphasis)
                .foregroundStyle(midnightBlue)
                .fixedSize(horizontal: false, vertical: true)

            Text(value.description)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(TrustoraMetrics.compactCardPadding)
        .trustoraCardStyle(cornerRadius: 16, background: TrustoraTheme.mutedSurface)
    }
}

struct AboutTeamCard: View {
    let member: AboutTeamMember
    let trustoraGreen: Color
    let midnightBlue: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 10) {
                TeamAvatar(member: member, trustoraGreen: trustoraGreen, midnightBlue: midnightBlue)

                VStack(alignment: .leading, spacing: 2) {
                    Text(member.name)
                        .font(TrustoraTypography.emphasis)
                        .foregroundStyle(midnightBlue)
                        .lineLimit(2)

                    Text(member.role)
                        .font(TrustoraTypography.label)
                        .foregroundStyle(trustoraGreen)
                        .lineLimit(2)
                }
            }

            Text(member.description)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(TrustoraMetrics.compactCardPadding)
        .trustoraCardStyle(cornerRadius: 16, background: TrustoraTheme.mutedSurface)
    }
}

struct TeamAvatar: View {
    let member: AboutTeamMember
    let trustoraGreen: Color
    let midnightBlue: Color

    private var initials: String {
        member.name
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
    }

    var body: some View {
        AsyncImage(url: URL(string: member.avatarURL)) { phase in
            switch phase {
            case let .success(image):
                image
                    .resizable()
                    .scaledToFill()
            default:
                ZStack {
                    LinearGradient(
                        colors: [
                            trustoraGreen.opacity(0.9),
                            Color(hex: 0x7DD3FC)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )

                    Text(initials)
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(midnightBlue)
                }
            }
        }
        .frame(width: 54, height: 54)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

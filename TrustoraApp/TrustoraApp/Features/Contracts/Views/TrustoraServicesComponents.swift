import SwiftUI

struct ServiceResultCard: View {
    let service: MarketplaceService
    let isWishlisted: Bool
    let wishlistedLabel: String
    let addLabel: String
    let shareLabel: String
    let recommendedLabel: String
    let standardLabel: String
    let noProvidersLabel: String
    let providersAvailableLabel: String
    let providersMoreLabel: (Int) -> String
    let moreTechnologiesLabel: (Int) -> String
    let onToggleWishlist: () -> Void

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                Text(service.categoryName)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(Color(hex: 0xF1F5F9))
                    .clipShape(Capsule())

                Spacer()

                Text(service.isFeatured ? recommendedLabel : standardLabel)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            Text(service.name)
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(midnightBlue)
                .lineLimit(2)

            Text(service.description.isEmpty ? service.name : service.description)
                .font(TrustoraTypography.paragraph)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .lineLimit(3)

            HStack(spacing: 6) {
                ForEach(Array(service.technologies.prefix(3)), id: \.self) { technology in
                    Text(technology)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(trustoraGreen)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(trustoraGreen.opacity(0.12))
                        .clipShape(Capsule())
                }

                if service.technologies.count > 3 {
                    Text(moreTechnologiesLabel(service.technologies.count - 3))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(providersAvailableLabel)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                if service.providers.isEmpty {
                    Text(noProvidersLabel)
                        .font(TrustoraTypography.label)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                } else {
                    HStack(spacing: 8) {
                        HStack(spacing: -8) {
                            ForEach(Array(service.providers.prefix(3))) { provider in
                                ServiceProviderAvatar(provider: provider)
                            }
                        }

                        if service.providers.count > 3 {
                            Text(providersMoreLabel(service.providers.count - 3))
                                .font(TrustoraTypography.label)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                        }
                    }
                }
            }
            .padding(.top, 2)

            HStack(spacing: 8) {
                Button(action: onToggleWishlist) {
                    HStack(spacing: 6) {
                        Image(systemName: isWishlisted ? "heart.fill" : "heart")
                            .font(TrustoraTypography.control)
                        Text(isWishlisted ? wishlistedLabel : addLabel)
                            .font(TrustoraTypography.label)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .foregroundStyle(isWishlisted ? Color(hex: 0x991B1B) : Color(hex: 0x334155))
                    .background(isWishlisted ? Color(hex: 0xFEE2E2) : Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(
                                isWishlisted ? Color(hex: 0xFCA5A5) : Color(hex: 0xE2E8F0),
                                lineWidth: 1
                            )
                    )
                }
                .buttonStyle(.plain)

                ShareLink(
                    item: "\(service.name)\n\(service.description)",
                    preview: SharePreview(service.name)
                ) {
                    HStack(spacing: 6) {
                        Image(systemName: "square.and.arrow.up")
                            .font(TrustoraTypography.control)
                        Text(shareLabel)
                            .font(TrustoraTypography.label)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .foregroundStyle(Color(hex: 0x334155))
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                    )
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }
}

struct ServiceProviderAvatar: View {
    let provider: MarketplaceServiceProvider

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white)
                .frame(width: 32, height: 32)

            if let avatarURL = provider.avatarURL,
               let url = URL(string: avatarURL),
               !avatarURL.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        initialsAvatar
                    }
                }
                .frame(width: 28, height: 28)
                .clipShape(Circle())
            } else {
                initialsAvatar
                    .frame(width: 28, height: 28)
            }
        }
        .overlay(
            Circle()
                .stroke(Color.white, lineWidth: 1.5)
        )
    }

    private var initialsAvatar: some View {
        Circle()
            .fill(Color(hex: 0xDBEAFE))
            .overlay(
                Text(initials)
                    .font(.system(size: 9, weight: .black))
                    .foregroundStyle(Color(hex: 0x1E40AF))
            )
    }

    private var initials: String {
        let first = provider.firstName.first.map { String($0) } ?? ""
        let last = provider.lastName.first.map { String($0) } ?? ""
        let value = (first + last).uppercased()
        return value.isEmpty ? "P" : value
    }
}

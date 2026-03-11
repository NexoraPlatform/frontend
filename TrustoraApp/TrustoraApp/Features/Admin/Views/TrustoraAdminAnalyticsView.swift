import SwiftUI

struct TrustoraAdminAnalyticsView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    private let primary = TrustoraTheme.primary
    private let background = TrustoraTheme.background

    private var canAccessAdmin: Bool {
        guard let user = authSession.user, authSession.accessToken != nil else {
            return false
        }
        return (user.isSuperuser ?? false) || user.hasRole("admin")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                background.ignoresSafeArea()

                if !canAccessAdmin {
                    unavailableState
                } else {
                    ScrollView {
                        VStack(spacing: TrustoraMetrics.sectionSpacing) {
                            headerCard
                            statsCard
                            developmentCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(strings("dashboard.actions.close")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(s("admin.analytics.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
        }
    }

    private var unavailableState: some View {
        VStack(spacing: 12) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(primary)

            Text(s("admin.dashboard.unavailable.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)
                .multilineTextAlignment(.center)

            Text(s("admin.dashboard.unavailable.description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(TrustoraMetrics.cardPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(s("admin.analytics.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.analytics.manage_subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var statsCard: some View {
        sectionCard(
            title: s("admin.analytics.stats_title"),
            subtitle: s("admin.analytics.stats_description"),
            icon: "chart.bar.fill"
        ) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                statTile(
                    title: s("admin.analytics.stats_title"),
                    description: s("admin.analytics.stats_description"),
                    icon: "chart.bar.xaxis",
                    iconColor: Color(hex: 0x0284C7),
                    iconBackground: Color(hex: 0xE0F2FE)
                )

                statTile(
                    title: s("admin.analytics.in_development_title"),
                    description: s("admin.analytics.in_development_description"),
                    icon: "sparkles",
                    iconColor: Color(hex: 0xB45309),
                    iconBackground: Color(hex: 0xFEF3C7)
                )
            }
        }
    }

    private var developmentCard: some View {
        sectionCard(
            title: s("admin.analytics.in_development_title"),
            subtitle: s("admin.analytics.in_development_description"),
            icon: "sparkles"
        ) {
            VStack(spacing: 10) {
                Image(systemName: "chart.bar")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                Text(s("admin.analytics.stats_description"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 22)
            .padding(.horizontal, 12)
            .background(TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: TrustoraMetrics.compactCardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TrustoraMetrics.compactCardRadius, style: .continuous)
                    .stroke(TrustoraTheme.border, style: StrokeStyle(lineWidth: 1, dash: [5, 4]))
            )
        }
    }

    private func statTile(
        title: String,
        description: String,
        icon: String,
        iconColor: Color,
        iconBackground: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(title.uppercased())
                    .font(TrustoraTypography.label)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .lineLimit(1)

                Spacer(minLength: 0)

                Image(systemName: icon)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(iconColor)
                    .frame(width: 26, height: 26)
                    .background(iconBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }

            Text(description)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.mutedSurface
        )
    }

    private func sectionCard<Content: View>(
        title: String,
        subtitle: String?,
        icon: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(primary)
                Text(title)
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

import SwiftUI

struct TrustoraAdminActivitiesView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminActivitiesViewModel()

    private let primary = TrustoraTheme.primary
    private let background = TrustoraTheme.background

    private var appLanguage: AppLanguage {
        AppLanguage(rawValue: appLanguageRaw) ?? .system
    }

    private var appCurrency: AppCurrency {
        AppCurrency(rawValue: appCurrencyRaw) ?? .defaultCurrency
    }

    private var resolvedLanguageCode: String {
        if appLanguage == .system {
            let preferred = Locale.preferredLanguages.first ?? "en"
            let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
            return code == "ro" ? "ro" : "en"
        }
        return appLanguage.rawValue
    }

    private var refreshKey: String {
        [
            authSession.user?.id ?? "guest",
            authSession.accessToken ?? "none",
            resolvedLanguageCode,
            appCurrency.rawValue,
            String(viewModel.page),
        ].joined(separator: "|")
    }

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
                            activitiesCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadActivities()
                    }
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
                    Text(s("admin.activities.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadActivities()
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
            Text(s("admin.activities.history_label").uppercased())
                .font(TrustoraTypography.label)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.activities.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.activities.manage_subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var activitiesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.activities.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(
                sf(
                    "admin.activities.list_description",
                    ["count": "\(viewModel.total)"]
                )
            )
            .font(TrustoraTypography.caption)
            .foregroundStyle(TrustoraTheme.tertiaryText)

            if let errorMessage = viewModel.errorMessage {
                retryCard(message: errorMessage)
            } else if viewModel.isLoading && viewModel.activities.isEmpty {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if viewModel.activities.isEmpty {
                emptyState
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.activities) { activity in
                        activityRow(activity)
                            .onAppear {
                                if activity.id == viewModel.activities.last?.id,
                                   viewModel.canGoNext,
                                   !viewModel.isLoading {
                                    viewModel.goToNextPage()
                                }
                            }
                    }
                }

                if viewModel.isLoading && !viewModel.activities.isEmpty {
                    HStack {
                        Spacer()
                        ProgressView()
                            .tint(TrustoraTheme.accent)
                            .padding(.vertical, 10)
                        Spacer()
                    }
                }

                if viewModel.lastPage > 1 {
                    HStack {
                        Text(
                            sf(
                                "admin.activities.pagination",
                                [
                                    "current": "\(viewModel.page)",
                                    "last": "\(viewModel.lastPage)",
                                    "total": "\(viewModel.total)",
                                ]
                            )
                        )
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                        Spacer()

                        HStack(spacing: 8) {
                            Button(s("admin.activities.pagination_previous")) {
                                viewModel.goToPreviousPage()
                            }
                            .buttonStyle(.plain)
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.canGoPrevious ? primary : TrustoraTheme.tertiaryText)

                            Button(s("admin.activities.pagination_next")) {
                                viewModel.goToNextPage()
                            }
                            .buttonStyle(.plain)
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.canGoNext ? primary : TrustoraTheme.tertiaryText)
                        }
                    }
                    .padding(.top, 2)
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func activityRow(_ activity: AdminActivityEntry) -> some View {
        let iconConfig = iconConfiguration(for: activity.type)
        let activityTitle = message(for: activity)
        let isUnread = activity.readAt == nil

        return HStack(alignment: .top, spacing: 10) {
            Image(systemName: iconConfig.icon)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(iconConfig.iconColor)
                .frame(width: 30, height: 30)
                .background(iconConfig.backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top) {
                    Text(activityTitle)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)
                        .multilineTextAlignment(.leading)

                    Spacer(minLength: 0)

                    Text(displayTime(for: activity))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if isUnread {
                        Text(s("admin.activities.unread_badge"))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(Color(hex: 0x0369A1))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color(hex: 0xE0F2FE))
                            .clipShape(Capsule())
                    }

                    Text(sf("admin.activities.id_prefix", ["id": activity.id]))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func retryCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(TrustoraTypography.body)
                .foregroundStyle(Color(hex: 0xB91C1C))

            Button {
                Task {
                    await reloadActivities()
                }
            } label: {
                Text(s("admin.users.retry"))
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: Color(hex: 0xFEF2F2),
            border: Color(hex: 0xFECACA)
        )
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.activities.empty_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.activities.empty_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func iconConfiguration(for type: String) -> (icon: String, iconColor: Color, backgroundColor: Color) {
        switch type.lowercased() {
        case "project_created":
            return ("person.3.fill", Color(hex: 0x2563EB), Color(hex: 0xDBEAFE))
        case "invoice_paid", "project_paid":
            return ("chart.line.uptrend.xyaxis", Color(hex: 0x16A34A), Color(hex: 0xDCFCE7))
        case "proposal_received":
            return ("doc.text.fill", Color(hex: 0xCA8A04), Color(hex: 0xFEF9C3))
        default:
            return ("bolt.fill", TrustoraTheme.secondaryText, Color(hex: 0xF1F5F9))
        }
    }

    private func message(for activity: AdminActivityEntry) -> String {
        switch activity.type.lowercased() {
        case "project_created":
            return sf(
                "admin.activities.messages.project_created",
                ["project": activity.metadata["project_name"] ?? "-"]
            )
        case "invoice_paid":
            return sf(
                "admin.activities.messages.invoice_paid",
                [
                    "invoice": activity.metadata["invoice_id"] ?? "-",
                    "amount": activity.metadata["amount"] ?? "-",
                ]
            )
        case "proposal_received":
            return sf(
                "admin.activities.messages.proposal_received",
                ["project": activity.metadata["project_name"] ?? "-"]
            )
        case "project_paid":
            return sf(
                "admin.activities.messages.project_paid",
                ["project": activity.metadata["project_name"] ?? "-"]
            )
        default:
            return s("admin.activities.messages.default")
        }
    }

    private func displayTime(for activity: AdminActivityEntry) -> String {
        if !activity.createdAtHuman.isEmpty {
            return activity.createdAtHuman
        }
        if let createdAt = activity.createdAt {
            return DateFormatter.trustoraActivityDateTime.string(from: createdAt)
        }
        return "-"
    }

    private func reloadActivities() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func s(_ key: String) -> String {
        strings(key)
    }

    private func sf(_ key: String, _ placeholders: [String: String]) -> String {
        var text = s(key)
        for (name, value) in placeholders {
            text = text.replacingOccurrences(of: "{\(name)}", with: value)
        }
        return text
    }
}

private extension DateFormatter {
    static let trustoraActivityDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}

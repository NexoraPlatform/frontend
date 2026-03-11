import SwiftUI

struct TrustoraAdminAuditLogsView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminAuditLogsViewModel()

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

    private var canAccessAdmin: Bool {
        guard let user = authSession.user, authSession.accessToken != nil else {
            return false
        }
        return (user.isSuperuser ?? false) || user.hasRole("admin")
    }

    private var refreshKey: String {
        [
            authSession.user?.id ?? "guest",
            authSession.accessToken ?? "none",
            resolvedLanguageCode,
            appCurrency.rawValue,
            String(viewModel.page),
            viewModel.selectedEvent.rawValue,
            viewModel.appliedUserID.map(String.init) ?? "-",
            dayToken(viewModel.dateFrom),
            dayToken(viewModel.dateTo),
        ].joined(separator: "|")
    }

    private var dateFromBinding: Binding<Date> {
        Binding(
            get: { viewModel.dateFrom },
            set: { newValue in
                viewModel.dateFrom = newValue
                viewModel.page = 1
            }
        )
    }

    private var dateToBinding: Binding<Date> {
        Binding(
            get: { viewModel.dateTo },
            set: { newValue in
                viewModel.dateTo = newValue
                viewModel.page = 1
            }
        )
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
                            filtersCard
                            logsCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadAuditLogs()
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
                    Text(s("admin.audit_logs.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadAuditLogs()
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
            Text(s("admin.audit_logs.history_label").uppercased())
                .font(TrustoraTypography.label)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.audit_logs.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.audit_logs.manage_subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var filtersCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(s("admin.audit_logs.filters.title"))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(primary)

            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(s("admin.audit_logs.filters.date_from"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                    DatePicker(
                        "",
                        selection: dateFromBinding,
                        displayedComponents: .date
                    )
                    .labelsHidden()
                    .datePickerStyle(.compact)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(s("admin.audit_logs.filters.date_to"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                    DatePicker(
                        "",
                        selection: dateToBinding,
                        displayedComponents: .date
                    )
                    .labelsHidden()
                    .datePickerStyle(.compact)
                }
            }

            Text(s("admin.audit_logs.filters.event"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminAuditLogEventFilter.allCases) { filter in
                        filterChip(
                            title: s(filter.titleKey),
                            selected: viewModel.selectedEvent == filter
                        ) {
                            guard viewModel.selectedEvent != filter else { return }
                            viewModel.selectedEvent = filter
                            viewModel.page = 1
                        }
                    }
                }
                .padding(.horizontal, 1)
            }

            HStack(spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    TextField(s("admin.audit_logs.filters.user_id_placeholder"), text: $viewModel.userSearchText)
                        .keyboardType(.numberPad)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)
                        .onSubmit {
                            viewModel.applySearch()
                        }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .trustoraCardStyle(
                    cornerRadius: TrustoraMetrics.compactCardRadius,
                    background: TrustoraTheme.mutedSurface
                )

                Button(s("admin.audit_logs.filters.search")) {
                    viewModel.applySearch()
                }
                .buttonStyle(.plain)
                .font(TrustoraTypography.control)
                .foregroundStyle(primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(TrustoraTheme.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: TrustoraMetrics.compactCardRadius, style: .continuous))

                if viewModel.appliedUserID != nil {
                    Button(s("common.clear")) {
                        viewModel.clearSearch()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    @ViewBuilder
    private func filterChip(
        title: String,
        selected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(TrustoraTypography.control)
                .foregroundStyle(selected ? Color(hex: 0x052E16) : TrustoraTheme.secondaryText)
                .lineLimit(1)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(selected ? TrustoraTheme.accent.opacity(0.28) : TrustoraTheme.surface)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(selected ? TrustoraTheme.accent : TrustoraTheme.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private var logsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "clock.badge.exclamationmark.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.audit_logs.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.audit_logs.list_description", ["count": "\(viewModel.total)"]))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            if let errorMessage = viewModel.errorMessage {
                retryCard(message: errorMessage)
            } else if viewModel.isLoading && viewModel.logs.isEmpty {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if viewModel.logs.isEmpty {
                emptyState
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.logs) { log in
                        logRow(log)
                            .onAppear {
                                if log.id == viewModel.logs.last?.id,
                                   viewModel.canGoNext,
                                   !viewModel.isLoading {
                                    viewModel.goToNextPage()
                                }
                            }
                    }
                }

                if viewModel.isLoading && !viewModel.logs.isEmpty {
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
                                "admin.audit_logs.pagination",
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
                            Button(s("admin.audit_logs.pagination_previous")) {
                                viewModel.goToPreviousPage()
                            }
                            .buttonStyle(.plain)
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.canGoPrevious ? primary : TrustoraTheme.tertiaryText)

                            Button(s("admin.audit_logs.pagination_next")) {
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

    private func logRow(_ log: AdminAuditLogEntry) -> some View {
        let expanded = viewModel.isExpanded(logID: log.id)
        let diffItems = viewModel.diffItems(for: log)
        let eventStyle = style(for: log.event)

        return VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.easeInOut(duration: 0.18)) {
                    viewModel.toggleExpanded(logID: log.id)
                }
            } label: {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text(log.event.uppercased())
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(eventStyle.text)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(eventStyle.background)
                            .clipShape(Capsule())

                        Text(displayDate(log.createdAt))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)

                        Spacer(minLength: 0)

                        Image(systemName: expanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                    }

                    Text(log.action)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        detailChip(title: s("admin.audit_logs.table.actor"), value: log.actorName)
                        detailChip(title: s("admin.audit_logs.table.subject"), value: sf(
                            "admin.audit_logs.table.subject_template",
                            ["type": log.subjectType, "id": log.subjectID]
                        ))
                        detailChip(title: s("admin.audit_logs.table.ip"), value: log.ip)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)

            if expanded {
                if diffItems.isEmpty {
                    Text(s("admin.audit_logs.no_changes"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                } else {
                    VStack(spacing: 8) {
                        ForEach(diffItems) { item in
                            HStack(alignment: .top, spacing: 8) {
                                Text(item.key)
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                    .frame(width: 96, alignment: .leading)
                                    .lineLimit(2)

                                Text(jsonDisplay(item.oldValue))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(Color(hex: 0xB91C1C))
                                    .strikethrough()
                                    .frame(maxWidth: .infinity, alignment: .leading)

                                Image(systemName: "arrow.right")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .padding(.top, 2)

                                Text(jsonDisplay(item.newValue))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(Color(hex: 0x166534))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(10)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
        }
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func detailChip(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
            Text(value)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .lineLimit(1)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(TrustoraTheme.mutedSurface)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private func retryCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(TrustoraTypography.body)
                .foregroundStyle(Color(hex: 0xB91C1C))

            Button {
                Task {
                    await reloadAuditLogs()
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
            Image(systemName: "clock.badge.exclamationmark.fill")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.audit_logs.empty_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.audit_logs.empty_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func style(for event: String) -> (text: Color, background: Color) {
        switch event.lowercased() {
        case "created":
            return (Color(hex: 0x166534), Color(hex: 0xDCFCE7))
        case "updated":
            return (Color(hex: 0x1D4ED8), Color(hex: 0xDBEAFE))
        case "deleted":
            return (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2))
        default:
            return (TrustoraTheme.secondaryText, Color(hex: 0xF1F5F9))
        }
    }

    private func displayDate(_ date: Date?) -> String {
        guard let date else {
            return "-"
        }
        return DateFormatter.trustoraAuditLogDateTime.string(from: date)
    }

    private func jsonDisplay(_ value: String?) -> String {
        guard let value, !value.isEmpty else {
            return "null"
        }
        if value == "true" || value == "false" || value == "null" || Double(value) != nil {
            return value
        }
        if value.hasPrefix("{") || value.hasPrefix("[") {
            return value
        }
        return "\"\(value)\""
    }

    private func dayToken(_ date: Date) -> String {
        String(Int(date.timeIntervalSince1970 / 86_400))
    }

    private func reloadAuditLogs() async {
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
    static let trustoraAuditLogDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter
    }()
}

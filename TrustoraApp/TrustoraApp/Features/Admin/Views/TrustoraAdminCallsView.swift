import SwiftUI

struct TrustoraAdminCallsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminCallsViewModel()
    @State private var refuseCall: AdminCallSummary?
    @State private var refuseReason = ""
    @State private var selectedStatistics: AdminTestStatistics?
    @State private var isLoadingStatistics = false

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
        ].joined(separator: "|")
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
                            callsCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadCalls()
                    }
                }

                if isLoadingStatistics {
                    loadingOverlay
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
                    Text(s("admin.calls.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadCalls()
            }
            .sheet(item: $refuseCall) { call in
                TrustoraAdminCallRefuseSheet(
                    call: call,
                    strings: strings,
                    isSubmitting: viewModel.isSubmitting,
                    onCancel: {
                        refuseCall = nil
                        refuseReason = ""
                    },
                    onConfirm: { note in
                        await refuseCallWithReason(call, note: note)
                    }
                )
            }
            .sheet(item: $selectedStatistics) { statistics in
                TrustoraAdminCallStatisticsSheet(
                    statistics: statistics,
                    strings: strings
                )
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

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.16)
                .ignoresSafeArea()

            ProgressView(s("admin.loading"))
                .font(TrustoraTypography.control)
                .padding(16)
                .background(TrustoraTheme.surface.opacity(0.95))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(s("admin.calls.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.calls.manage_subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var filtersCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                TextField(s("admin.calls.search_placeholder"), text: $viewModel.searchText)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(TrustoraTypography.body)
                    .foregroundStyle(primary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .trustoraCardStyle(
                cornerRadius: TrustoraMetrics.compactCardRadius,
                background: TrustoraTheme.mutedSurface
            )

            Text(s("admin.calls.filters.passed.label"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminCallsPassedFilter.allCases) { filter in
                        filterChip(
                            title: s(filter.titleKey),
                            selected: viewModel.passedFilter == filter
                        ) {
                            viewModel.passedFilter = filter
                        }
                    }
                }
                .padding(.horizontal, 1)
            }

            Text(s("admin.calls.filters.status.label"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminCallsStatusFilter.allCases) { filter in
                        filterChip(
                            title: s(filter.titleKey),
                            selected: viewModel.statusFilter == filter
                        ) {
                            viewModel.statusFilter = filter
                        }
                    }
                }
                .padding(.horizontal, 1)
            }

            Text(s("admin.calls.filters.date.label"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminCallsDateRangeFilter.allCases) { filter in
                        filterChip(
                            title: s(filter.titleKey),
                            selected: viewModel.dateFilter == filter
                        ) {
                            viewModel.dateFilter = filter
                        }
                    }
                }
                .padding(.horizontal, 1)
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

    private var callsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "phone.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.calls.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.calls.list_description", ["count": "\(viewModel.filteredCalls.count)"]))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            if let errorMessage = viewModel.errorMessage {
                retryCard(message: errorMessage)
            } else if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if viewModel.filteredCalls.isEmpty {
                emptyState
            } else {
                if let actionError = viewModel.actionErrorMessage,
                   !actionError.isEmpty {
                    Text(actionError)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(Color(hex: 0xB91C1C))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: Color(hex: 0xFEF2F2),
                            border: Color(hex: 0xFECACA)
                        )
                }

                LazyVStack(spacing: 10) {
                    ForEach(viewModel.filteredCalls) { call in
                        callRow(call)
                            .onAppear {
                                if call.id == viewModel.filteredCalls.last?.id {
                                    Task {
                                        await loadMoreCallsIfNeeded()
                                    }
                                }
                            }
                    }
                }

                if viewModel.isLoadingMore {
                    HStack {
                        Spacer()
                        ProgressView()
                            .tint(TrustoraTheme.accent)
                            .padding(.vertical, 10)
                        Spacer()
                    }
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func retryCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(TrustoraTypography.body)
                .foregroundStyle(Color(hex: 0xB91C1C))

            Button {
                Task {
                    await reloadCalls()
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
        VStack(spacing: 8) {
            Image(systemName: "phone")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.calls.no_calls_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.calls.no_calls_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func callRow(_ call: AdminCallSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(call.attendee?.fullName ?? "-")
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                            .lineLimit(2)

                        statusBadge(call.status)
                    }

                    if let interviewer = call.interviewer?.fullName,
                       !interviewer.isEmpty {
                        Text("\(s("admin.calls.interviewer_prefix")) \(interviewer)")
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                    }
                }

                Spacer(minLength: 0)

                callActionsMenu(call)
            }

            HStack(spacing: 6) {
                if let serviceTitle = call.service?.title {
                    Text("\(s("admin.calls.service_prefix")) \(serviceTitle)")
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .lineLimit(1)
                }

                Circle()
                    .fill(TrustoraTheme.border)
                    .frame(width: 4, height: 4)

                Text("\(s("admin.calls.category_prefix")) \(call.service?.categoryName ?? "-")")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                statPill(icon: "calendar", text: scheduledLabel(call.dateTime))

                if let score = call.testResult?.score {
                    statPill(
                        icon: "chart.bar",
                        text: "\(s("admin.calls.passing_score_prefix")) \(Int(score.rounded()))%"
                    )
                }

                if let passed = call.passedValue {
                    statPill(
                        icon: passed == 1 ? "checkmark.circle" : "xmark.circle",
                        text: passed == 1 ? s("admin.calls.filters.passed.yes") : s("admin.calls.filters.passed.no")
                    )
                }

                if call.resultsCount > 0 {
                    statPill(
                        icon: "list.bullet.clipboard",
                        text: sf("admin.calls.results_label", ["count": "\(call.resultsCount)"])
                    )
                }
            }

            if let createdAt = call.createdAt {
                Text("\(s("admin.calls.created_prefix")) \(displayDate(createdAt, includeTime: true))")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func statusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let style: (text: Color, fill: Color, border: Color)
        let key: String

        switch normalized {
        case "ACCEPTED":
            key = "admin.calls.statuses.ACCEPTED"
            style = (Color(hex: 0x075985), Color(hex: 0xE0F2FE), Color(hex: 0xBAE6FD))
        case "FINISHED":
            key = "admin.calls.statuses.FINISHED"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
        case "REFUSED":
            key = "admin.calls.statuses.REFUSED"
            style = (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        case "NO_SHOW":
            key = "admin.calls.statuses.NO_SHOW"
            style = (Color(hex: 0x9F1239), Color(hex: 0xFFE4E6), Color(hex: 0xFECDD3))
        default:
            key = "admin.calls.statuses.WAITING"
            style = (Color(hex: 0x166534), Color(hex: 0xDCFCE7), Color(hex: 0xBBF7D0))
        }

        return Text(s(key))
            .font(TrustoraTypography.caption)
            .foregroundStyle(style.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(style.fill)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(style.border, lineWidth: 1)
            )
    }

    private func statPill(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(TrustoraTheme.secondaryText)
            Text(text)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.secondaryText)
        }
    }

    private func callActionsMenu(_ call: AdminCallSummary) -> some View {
        Menu {
            if let callURL = call.callURL,
               let url = URL(string: callURL) {
                Button {
                    openURL(url)
                } label: {
                    Label(s("admin.calls.dropdown.connect"), systemImage: "video")
                }
            }

            if let testID = call.testResult?.skillTestID,
               !testID.isEmpty {
                Button {
                    Task {
                        await openTestStatistics(testID: testID)
                    }
                } label: {
                    Label(s("admin.calls.link_test_details"), systemImage: "book.closed")
                }
            }

            statusMenuItem(call: call, targetStatus: "WAITING", titleKey: "admin.calls.dropdown.move_waiting", icon: "pause.circle")
            statusMenuItem(call: call, targetStatus: "FINISHED", titleKey: "admin.calls.dropdown.move_finished", icon: "checkmark.seal")
            statusMenuItem(call: call, targetStatus: "ACCEPTED", titleKey: "admin.calls.dropdown.move_accepted", icon: "checkmark.circle")

            if call.status != "REFUSED" {
                Button {
                    refuseReason = ""
                    refuseCall = call
                } label: {
                    Label(s("admin.calls.dropdown.move_refused"), systemImage: "eye.slash")
                }
            }

            statusMenuItem(call: call, targetStatus: "NO_SHOW", titleKey: "admin.calls.dropdown.move_no_show", icon: "xmark.circle")
        } label: {
            Image(systemName: "ellipsis")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(TrustoraTheme.secondaryText)
                .frame(width: 28, height: 28)
                .background(TrustoraTheme.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func statusMenuItem(
        call: AdminCallSummary,
        targetStatus: String,
        titleKey: String,
        icon: String
    ) -> some View {
        if call.status != targetStatus {
            Button {
                Task {
                    await updateCallStatus(call, status: targetStatus, note: nil)
                }
            } label: {
                Label(s(titleKey), systemImage: icon)
            }
        }
    }

    private func scheduledLabel(_ date: Date?) -> String {
        guard let date else {
            return "\(s("admin.calls.scheduled_at_prefix")) -"
        }
        return "\(s("admin.calls.scheduled_at_prefix")) \(displayDate(date, includeTime: true))"
    }

    private func displayDate(_ date: Date, includeTime: Bool) -> String {
        let localeIdentifier = resolvedLanguageCode == "ro" ? "ro-RO" : "en-US"
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: localeIdentifier)
        formatter.dateStyle = .medium
        formatter.timeStyle = includeTime ? .short : .none
        return formatter.string(from: date)
    }

    private func reloadCalls() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreCallsIfNeeded() async {
        guard let token = authSession.accessToken,
              viewModel.hasMorePages
        else {
            return
        }

        await viewModel.loadNextPage(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func updateCallStatus(_ call: AdminCallSummary, status: String, note: String?) async {
        guard let token = authSession.accessToken else {
            return
        }

        _ = await viewModel.updateStatus(
            call: call,
            status: status,
            note: note,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func refuseCallWithReason(_ call: AdminCallSummary, note: String) async {
        await updateCallStatus(call, status: "REFUSED", note: note)
        refuseCall = nil
        refuseReason = ""
    }

    private func openTestStatistics(testID: String) async {
        guard let token = authSession.accessToken else {
            return
        }

        isLoadingStatistics = true
        selectedStatistics = nil

        do {
            let statistics = try await TrustoraAPIClient.shared.getAdminTestStatistics(
                testID: testID,
                language: resolvedLanguageCode,
                currency: appCurrency,
                bearerToken: token
            )
            selectedStatistics = statistics
        } catch {
            viewModel.actionErrorMessage = error.localizedDescription
        }

        isLoadingStatistics = false
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

private struct TrustoraAdminCallRefuseSheet: View {
    @Environment(\.dismiss) private var dismiss

    let call: AdminCallSummary
    let strings: (String) -> String
    let isSubmitting: Bool
    let onCancel: () -> Void
    let onConfirm: (_ note: String) async -> Void

    @State private var note = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(s("admin.calls.dropdown.refuse_reason_label"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)

                    Text("\(call.attendee?.fullName ?? "-")")
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.secondaryText)

                    ZStack(alignment: .topLeading) {
                        if note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text(s("admin.calls.dropdown.refuse_reason_placeholder"))
                                .font(TrustoraTypography.body)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 12)
                        }

                        TextEditor(text: $note)
                            .font(TrustoraTypography.body)
                            .frame(minHeight: 130)
                            .scrollContentBackground(.hidden)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 8)
                            .background(Color.clear)
                    }
                    .background(TrustoraTheme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(TrustoraTheme.border, lineWidth: 1)
                    )

                    HStack(spacing: 10) {
                        Button {
                            onCancel()
                            dismiss()
                        } label: {
                            Text(s("admin.calls.dropdown.cancel"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.primary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(TrustoraTheme.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .stroke(TrustoraTheme.border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)

                        Button {
                            Task {
                                await onConfirm(note)
                                dismiss()
                            }
                        } label: {
                            if isSubmitting {
                                ProgressView()
                                    .tint(TrustoraTheme.accentButtonText)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            } else {
                                Text(s("admin.calls.dropdown.confirm"))
                                    .font(TrustoraTypography.control)
                                    .foregroundStyle(TrustoraTheme.accentButtonText)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            }
                        }
                        .buttonStyle(.plain)
                        .background(TrustoraTheme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                .padding(TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 16)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(s("admin.calls.dropdown.move_refused"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }
            }
        }
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

private struct TrustoraAdminCallStatisticsSheet: View {
    @Environment(\.dismiss) private var dismiss

    let statistics: AdminTestStatistics
    let strings: (String) -> String

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    summaryCard
                    questionResultsCard
                }
                .padding(TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 10)
                .padding(.bottom, 24)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("dashboard.actions.close")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(s("admin.tests.statistics.title_suffix"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }
            }
        }
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(statistics.title)
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(TrustoraTheme.primary)

            Text("\(statistics.userFullName) · \(statistics.serviceTitle)")
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)

            HStack(spacing: 10) {
                summaryBadge(
                    title: s("admin.tests.statistics.passed_label"),
                    value: statistics.passed ? s("admin.tests.statistics.passed_yes") : s("admin.tests.statistics.passed_no"),
                    color: statistics.passed ? Color(hex: 0x166534) : Color(hex: 0xB91C1C),
                    fill: statistics.passed ? Color(hex: 0xDCFCE7) : Color(hex: 0xFEE2E2)
                )

                summaryBadge(
                    title: s("admin.tests.statistics.score_label"),
                    value: "\(Int(statistics.score.rounded()))%",
                    color: Color(hex: 0x1D4ED8),
                    fill: Color(hex: 0xDBEAFE)
                )

                summaryBadge(
                    title: s("admin.tests.statistics.time_spent_label"),
                    value: "\(statistics.timeSpentMinutes) \(s("admin.tests.minute_suffix"))",
                    color: Color(hex: 0x92400E),
                    fill: Color(hex: 0xFEF3C7)
                )
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    @ViewBuilder
    private func summaryBadge(title: String, value: String, color: Color, fill: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
            Text(value)
                .font(TrustoraTypography.control)
                .foregroundStyle(color)
        }
        .padding(8)
        .background(fill)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var questionResultsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(s("admin.tests.statistics.question_stats_title"))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(TrustoraTheme.primary)

            if statistics.questionResults.isEmpty {
                Text(s("admin.tests.statistics.no_results"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(statistics.questionResults.enumerated()), id: \.element.id) { index, result in
                        let question = statistics.questions.first { $0.id == result.questionID }

                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 8) {
                                Text(sf("admin.tests.statistics.question_label", ["number": "\(index + 1)"]))
                                    .font(TrustoraTypography.control)
                                    .foregroundStyle(TrustoraTheme.secondaryText)

                                if let question {
                                    Text(s("admin.tests.question_types.\(question.type)"))
                                        .font(TrustoraTypography.caption)
                                        .foregroundStyle(Color(hex: 0x1D4ED8))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(hex: 0xDBEAFE))
                                        .clipShape(Capsule())
                                }

                                Spacer(minLength: 0)

                                Text("\(Int(result.pointsEarned.rounded()))")
                                    .font(TrustoraTypography.control)
                                    .foregroundStyle(result.isCorrect ? Color(hex: 0x166534) : Color(hex: 0xB91C1C))
                            }

                            if let question {
                                Text(question.question)
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(TrustoraTheme.primary)
                            }

                            if let question, !question.correctAnswers.isEmpty {
                                Text("\(s("admin.tests.statistics.correct_answer")): \(question.correctAnswers.joined(separator: ", "))")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(Color(hex: 0x166534))
                            }

                            Text("\(s("admin.tests.statistics.user_answer")): \(result.answer.joined(separator: ", "))")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(result.isCorrect ? Color(hex: 0x1D4ED8) : Color(hex: 0xB91C1C))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
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

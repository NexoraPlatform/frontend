import SwiftUI

struct TrustoraAdminTestsView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String
    var openCreateOnAppear = false

    @StateObject private var viewModel = TrustoraAdminTestsViewModel()

    @State private var isEditorPresented = false
    @State private var editorMode: AdminTestEditorMode = .create
    @State private var editorDraft = AdminTestEditorDraft()
    @State private var deleteCandidate: AdminTestSummary?
    @State private var selectedDetail: AdminTestDetail?
    @State private var selectedStatistics: AdminTestStatistics?
    @State private var isPreparing = false
    @State private var didHandleInitialCreate = false

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
                            testsCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadTests(includeMetadata: true)
                    }
                }

                if isPreparing {
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
                    Text(s("admin.tests.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                if canAccessAdmin {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            Task {
                                await openCreateEditor()
                            }
                        } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(primary)
                                .frame(width: 30, height: 30)
                                .background(TrustoraTheme.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .stroke(TrustoraTheme.border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(s("admin.tests.add_test"))
                    }
                }
            }
            .task(id: refreshKey) {
                if openCreateOnAppear && !didHandleInitialCreate {
                    didHandleInitialCreate = true
                    await openCreateEditor()
                }

                guard canAccessAdmin else { return }
                await reloadTests(includeMetadata: true)
            }
            .sheet(isPresented: $isEditorPresented) {
                TrustoraAdminTestFormSheet(
                    mode: editorMode,
                    strings: strings,
                    initialDraft: editorDraft,
                    serviceOptions: viewModel.services,
                    isSubmitting: viewModel.isSubmitting,
                    errorMessage: viewModel.actionErrorMessage,
                    onSubmit: { draft, mode in
                        guard let token = authSession.accessToken else {
                            return false
                        }

                        switch mode {
                        case .create:
                            return await viewModel.createTest(
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        case let .edit(testID):
                            return await viewModel.updateTest(
                                testID: testID,
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        }
                    }
                )
            }
            .sheet(item: $selectedDetail) { detail in
                TrustoraAdminTestDetailSheet(
                    detail: detail,
                    strings: strings
                )
            }
            .sheet(item: $selectedStatistics) { statistics in
                TrustoraAdminTestStatisticsSheet(
                    statistics: statistics,
                    strings: strings
                )
            }
            .alert(
                s("admin.tests.confirm_delete"),
                isPresented: Binding(
                    get: { deleteCandidate != nil },
                    set: { isPresented in
                        if !isPresented {
                            deleteCandidate = nil
                        }
                    }
                )
            ) {
                Button(s("common.cancel"), role: .cancel) {
                    deleteCandidate = nil
                }

                Button(s("admin.tests.delete"), role: .destructive) {
                    guard let deleteCandidate, let token = authSession.accessToken else {
                        return
                    }

                    Task {
                        _ = await viewModel.deleteTest(
                            deleteCandidate,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }

                    self.deleteCandidate = nil
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
            Text(s("admin.tests.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.tests.manage_subtitle"))
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

                TextField(s("admin.tests.search_placeholder"), text: $viewModel.searchText)
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

            Text(s("admin.tests.level_filter_title"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminTestsLevelFilter.allCases) { filter in
                        filterChip(
                            title: s(filter.titleKey),
                            selected: viewModel.levelFilter == filter
                        ) {
                            viewModel.levelFilter = filter
                        }
                    }
                }
                .padding(.horizontal, 1)
            }

            Text(s("admin.tests.status_filter_title"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminTestsStatusFilter.allCases) { filter in
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

    private var testsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)

                Text(s("admin.tests.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.tests.list_description", ["count": "\(viewModel.filteredTests.count)"]))
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
            } else if viewModel.filteredTests.isEmpty {
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
                    ForEach(viewModel.filteredTests) { test in
                        testRow(test)
                            .onAppear {
                                if test.id == viewModel.filteredTests.last?.id {
                                    Task {
                                        await loadMoreTestsIfNeeded()
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
                    await reloadTests(includeMetadata: true)
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
            Image(systemName: "book.closed")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.tests.no_tests_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.tests.no_tests_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func testRow(_ test: AdminTestSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(test.title)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                            .lineLimit(2)

                        levelBadge(test.level)
                        statusBadge(test.status)
                    }

                    Text(test.description)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                testActionsMenu(for: test)
            }

            HStack(spacing: 6) {
                Text("\(s("admin.tests.service_prefix"))\(test.serviceTitle)")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineLimit(1)

                Circle()
                    .fill(TrustoraTheme.border)
                    .frame(width: 4, height: 4)

                Text("\(s("admin.tests.category_prefix"))\(test.serviceCategoryName)")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                statPill(
                    icon: "target",
                    text: sf("admin.tests.question_count", ["count": "\(test.totalQuestions)"])
                )
                statPill(
                    icon: "clock",
                    text: "\(test.timeLimit) \(s("admin.tests.minute_suffix"))"
                )
                statPill(
                    icon: "checkmark.seal",
                    text: sf("admin.tests.passing_score", ["count": "\(test.passingScore)"])
                )
                statPill(
                    icon: "chart.bar",
                    text: sf("admin.tests.results_count", ["count": "\(test.resultsCount)"])
                )
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
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

    private func statusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let textKey: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "ACTIVE":
            textKey = "admin.tests.statuses.ACTIVE"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "INACTIVE":
            textKey = "admin.tests.statuses.INACTIVE"
            style = (Color(hex: 0x334155), Color(hex: 0xE2E8F0), Color(hex: 0xCBD5E1))
        default:
            textKey = "admin.tests.statuses.DRAFT"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
        }

        return Text(s(textKey))
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

    private func levelBadge(_ level: String) -> some View {
        let normalized = level.uppercased()
        let textKey: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "MEDIU":
            textKey = "admin.tests.levels.MEDIU"
            style = (Color(hex: 0x1D4ED8), Color(hex: 0xDBEAFE), Color(hex: 0xBFDBFE))
        case "SENIOR":
            textKey = "admin.tests.levels.SENIOR"
            style = (Color(hex: 0x6D28D9), Color(hex: 0xEDE9FE), Color(hex: 0xDDD6FE))
        case "EXPERT":
            textKey = "admin.tests.levels.EXPERT"
            style = (Color(hex: 0xC2410C), Color(hex: 0xFFEDD5), Color(hex: 0xFED7AA))
        default:
            textKey = "admin.tests.levels.JUNIOR"
            style = (Color(hex: 0x166534), Color(hex: 0xDCFCE7), Color(hex: 0xBBF7D0))
        }

        return Text(s(textKey))
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

    private func testActionsMenu(for test: AdminTestSummary) -> some View {
        Menu {
            Button {
                Task {
                    await openDetail(for: test)
                }
            } label: {
                Label(s("admin.tests.view_details"), systemImage: "eye")
            }

            Button {
                Task {
                    await openEditEditor(for: test)
                }
            } label: {
                Label(s("admin.tests.edit"), systemImage: "pencil")
            }

            Button {
                Task {
                    await openStatistics(for: test)
                }
            } label: {
                Label(s("admin.tests.statistics.title_suffix"), systemImage: "chart.bar")
            }

            if test.status.uppercased() == "ACTIVE" {
                Button {
                    Task {
                        await runStatusAction("INACTIVE", for: test)
                    }
                } label: {
                    Label(s("admin.tests.deactivate"), systemImage: "xmark.circle")
                }
            } else {
                Button {
                    Task {
                        await runStatusAction("ACTIVE", for: test)
                    }
                } label: {
                    Label(s("admin.tests.activate"), systemImage: "checkmark.circle")
                }
            }

            Button(role: .destructive) {
                deleteCandidate = test
            } label: {
                Label(s("admin.tests.delete"), systemImage: "trash")
            }
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

    private func runStatusAction(_ status: String, for test: AdminTestSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        _ = await viewModel.setStatus(
            test: test,
            status: status,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func openCreateEditor() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.loadServicesMetadata(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        editorMode = .create
        editorDraft = AdminTestEditorDraft()
        viewModel.actionErrorMessage = nil
        isEditorPresented = true
    }

    private func openEditEditor(for test: AdminTestSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        isPreparing = true

        await viewModel.loadServicesMetadata(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        if let detail = await viewModel.loadTestDetail(
            testID: test.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) {
            var draft = AdminTestEditorDraft()
            draft.apply(detail)
            editorDraft = draft
            editorMode = .edit(testID: test.id)
            isEditorPresented = true
        }

        isPreparing = false
    }

    private func openDetail(for test: AdminTestSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        isPreparing = true

        selectedDetail = await viewModel.loadTestDetail(
            testID: test.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        isPreparing = false
    }

    private func openStatistics(for test: AdminTestSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        isPreparing = true

        selectedStatistics = await viewModel.loadTestStatistics(
            testID: test.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        isPreparing = false
    }

    private func reloadTests(includeMetadata: Bool) async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency,
            includeMetadata: includeMetadata
        )
    }

    private func loadMoreTestsIfNeeded() async {
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

private struct TrustoraAdminTestDetailSheet: View {
    @Environment(\.dismiss) private var dismiss

    let detail: AdminTestDetail
    let strings: (String) -> String

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    infoCard
                    configurationCard
                    questionsCard
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
                    Text(s("admin.tests.detail.test_details"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }
            }
        }
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(detail.title)
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(TrustoraTheme.primary)

            if !detail.description.isEmpty {
                Text(detail.description)
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.secondaryText)
            }

            keyValue(label: s("admin.tests.detail.service_label"), value: detail.serviceTitle)
            keyValue(label: s("admin.tests.detail.category_label"), value: detail.serviceCategoryName)
            keyValue(label: s("admin.tests.detail.level_label"), value: s("admin.tests.levels.\(detail.level)"))
            keyValue(label: s("admin.tests.detail.status_label"), value: s("admin.tests.statuses.\(detail.status)"))
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var configurationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(s("admin.tests.detail.test_config"))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(TrustoraTheme.primary)

            keyValue(label: s("admin.tests.detail.time_limit_label"), value: "\(detail.timeLimit) \(s("admin.tests.minute_suffix"))")
            keyValue(label: s("admin.tests.detail.passing_score_label"), value: "\(detail.passingScore)%")
            keyValue(label: s("admin.tests.detail.questions_label"), value: "\(detail.totalQuestions)")
            keyValue(
                label: s("admin.tests.detail.total_points_label"),
                value: "\(detail.questions.reduce(0) { $0 + $1.points })"
            )
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var questionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(s("admin.tests.questions_title"))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(TrustoraTheme.primary)

            if detail.questions.isEmpty {
                Text(s("admin.tests.questions_empty"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(detail.questions.enumerated()), id: \.element.id) { index, question in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 8) {
                                Text("#\(index + 1)")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                Text(s("admin.tests.question_types.\(question.type)"))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(Color(hex: 0x1D4ED8))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(hex: 0xDBEAFE))
                                    .clipShape(Capsule())
                                Spacer(minLength: 0)
                                Text(sf("admin.tests.points_template", ["count": "\(question.points)"]))
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                            }

                            Text(question.question)
                                .font(TrustoraTypography.body)
                                .foregroundStyle(TrustoraTheme.primary)

                            if !question.options.isEmpty {
                                VStack(alignment: .leading, spacing: 4) {
                                    ForEach(question.options, id: \.self) { option in
                                        Text("• \(option)")
                                            .font(TrustoraTypography.caption)
                                            .foregroundStyle(TrustoraTheme.secondaryText)
                                    }
                                }
                            }

                            if !question.correctAnswers.isEmpty {
                                Text("\(s("admin.tests.statistics.correct_answer")): \(question.correctAnswers.joined(separator: ", "))")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(Color(hex: 0x166534))
                            }

                            if !question.codeTemplate.isEmpty {
                                codeBlock(title: s("admin.tests.detail.code_template"), value: question.codeTemplate)
                            }

                            if !question.expectedOutput.isEmpty {
                                codeBlock(title: s("admin.tests.detail.expected_output"), value: question.expectedOutput)
                            }

                            if !question.explanation.isEmpty {
                                Text("\(s("admin.tests.detail.explanation")): \(question.explanation)")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                            }

                            if !question.testCases.isEmpty {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(s("admin.tests.detail.test_cases"))
                                        .font(TrustoraTypography.control)
                                        .foregroundStyle(TrustoraTheme.secondaryText)

                                    ForEach(Array(question.testCases.enumerated()), id: \.offset) { idx, testCase in
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("\(idx + 1). \(s("admin.tests.detail.input_label")): \(testCase.input)")
                                                .font(TrustoraTypography.caption)
                                                .foregroundStyle(TrustoraTheme.secondaryText)
                                            Text("\(s("admin.tests.detail.expected_output_label")): \(testCase.expectedOutput)")
                                                .font(TrustoraTypography.caption)
                                                .foregroundStyle(TrustoraTheme.secondaryText)
                                        }
                                    }
                                }
                            }
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

    @ViewBuilder
    private func keyValue(label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(label)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
            Spacer(minLength: 0)
            Text(value)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .multilineTextAlignment(.trailing)
        }
    }

    @ViewBuilder
    private func codeBlock(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
            Text(value)
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .foregroundStyle(TrustoraTheme.secondaryText)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
                .background(Color(hex: 0xF8FAFC))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
        }
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

private struct TrustoraAdminTestStatisticsSheet: View {
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

private struct TrustoraAdminTestFormSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: AdminTestEditorMode
    let strings: (String) -> String
    let serviceOptions: [AdminTestServiceOption]
    let isSubmitting: Bool
    let errorMessage: String?
    let onSubmit: (_ draft: AdminTestEditorDraft, _ mode: AdminTestEditorMode) async -> Bool

    @State private var draft: AdminTestEditorDraft
    @State private var localError: String?
    @State private var questionDraft = AdminTestEditorQuestionDraft()
    @State private var editingQuestionIndex: Int?

    init(
        mode: AdminTestEditorMode,
        strings: @escaping (String) -> String,
        initialDraft: AdminTestEditorDraft,
        serviceOptions: [AdminTestServiceOption],
        isSubmitting: Bool,
        errorMessage: String?,
        onSubmit: @escaping (_ draft: AdminTestEditorDraft, _ mode: AdminTestEditorMode) async -> Bool
    ) {
        self.mode = mode
        self.strings = strings
        self.serviceOptions = serviceOptions
        self.isSubmitting = isSubmitting
        self.errorMessage = errorMessage
        self.onSubmit = onSubmit
        _draft = State(initialValue: initialDraft)
    }

    private var canSubmit: Bool {
        draft.isValid && !isSubmitting
    }

    private var orderedServiceOptions: [AdminTestServiceOption] {
        serviceOptions.sorted {
            $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let errorMessage, !errorMessage.isEmpty {
                        errorCard(errorMessage)
                    }

                    if let localError, !localError.isEmpty {
                        errorCard(localError)
                    }

                    infoSection
                    questionsSection
                    questionEditorSection
                }
                .padding(TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 10)
                .padding(.bottom, 24)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("admin.tests.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(mode.isEdit ? s("admin.tests.edit.title") : s("admin.tests.new.title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await submit()
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                                .tint(TrustoraTheme.primary)
                        } else {
                            Text(mode.isEdit ? s("admin.tests.save_changes") : s("admin.tests.create_test"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(canSubmit ? TrustoraTheme.primary : TrustoraTheme.tertiaryText)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private var infoSection: some View {
        fieldSection(
            title: s("admin.tests.info_title"),
            subtitle: s("admin.tests.info_description")
        ) {
            field(label: s("admin.tests.title_label")) {
                TextField(s("admin.tests.title_placeholder"), text: $draft.title)
                    .textInputAutocapitalization(.sentences)
                    .autocorrectionDisabled()
            }

            field(label: s("admin.tests.description_label")) {
                multilineField(
                    placeholder: s("admin.tests.description_placeholder"),
                    text: $draft.description,
                    minHeight: 100
                )
            }

            field(label: s("admin.tests.service_label")) {
                if orderedServiceOptions.isEmpty {
                    Text(s("admin.tests.service_placeholder"))
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    Picker("", selection: $draft.serviceID) {
                        Text(s("admin.tests.service_placeholder")).tag("")
                        ForEach(orderedServiceOptions) { option in
                            Text("\(option.title) • \(option.categoryName)").tag(option.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }

            field(label: s("admin.tests.level_label")) {
                Picker("", selection: $draft.level) {
                    Text(s("admin.tests.levels.JUNIOR")).tag("JUNIOR")
                    Text(s("admin.tests.levels.MEDIU")).tag("MEDIU")
                    Text(s("admin.tests.levels.SENIOR")).tag("SENIOR")
                    Text(s("admin.tests.levels.EXPERT")).tag("EXPERT")
                }
                .pickerStyle(.segmented)
            }

            HStack(spacing: 12) {
                field(label: s("admin.tests.time_limit_label")) {
                    Stepper(value: $draft.timeLimit, in: 1...300) {
                        Text("\(draft.timeLimit) \(s("admin.tests.minute_suffix"))")
                            .font(TrustoraTypography.body)
                    }
                }

                field(label: s("admin.tests.passing_score_label")) {
                    Stepper(value: $draft.passingScore, in: 1...100) {
                        Text("\(draft.passingScore)%")
                            .font(TrustoraTypography.body)
                    }
                }
            }

            if mode.isEdit {
                field(label: s("admin.tests.status_label")) {
                    Picker("", selection: $draft.status) {
                        Text(s("admin.tests.statuses.DRAFT")).tag("DRAFT")
                        Text(s("admin.tests.statuses.ACTIVE")).tag("ACTIVE")
                        Text(s("admin.tests.statuses.INACTIVE")).tag("INACTIVE")
                    }
                    .pickerStyle(.segmented)
                }
            }
        }
    }

    private var questionsSection: some View {
        fieldSection(
            title: s("admin.tests.questions_title"),
            subtitle: sf("admin.tests.questions_subtitle", ["count": "\(draft.questions.count)"])
        ) {
            if draft.questions.isEmpty {
                Text(s("admin.tests.questions_empty"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(draft.questions.enumerated()), id: \.element.id) { index, question in
                        HStack(spacing: 8) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("#\(index + 1) · \(s("admin.tests.question_types.\(question.normalizedType)"))")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)

                                Text(question.question)
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(TrustoraTheme.primary)
                                    .lineLimit(2)
                            }

                            Spacer(minLength: 0)

                            Button {
                                startEditQuestion(index)
                            } label: {
                                Image(systemName: "pencil")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(TrustoraTheme.primary)
                                    .frame(width: 28, height: 28)
                                    .background(TrustoraTheme.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .stroke(TrustoraTheme.border, lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)

                            Button {
                                removeQuestion(index)
                            } label: {
                                Image(systemName: "trash")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color(hex: 0xB91C1C))
                                    .frame(width: 28, height: 28)
                                    .background(Color(hex: 0xFEF2F2))
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .stroke(Color(hex: 0xFECACA), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }
                }
            }
        }
    }

    private var questionEditorSection: some View {
        fieldSection(
            title: editingQuestionIndex == nil ? s("admin.tests.new_question_title") : s("admin.tests.edit_question_title"),
            subtitle: s("admin.tests.new_question_subtitle")
        ) {
            field(label: s("admin.tests.question_type_label")) {
                Picker("", selection: $questionDraft.type) {
                    Text(s("admin.tests.question_types.SINGLE_CHOICE")).tag("SINGLE_CHOICE")
                    Text(s("admin.tests.question_types.MULTIPLE_CHOICE")).tag("MULTIPLE_CHOICE")
                    Text(s("admin.tests.question_types.CODE_WRITING")).tag("CODE_WRITING")
                    Text(s("admin.tests.question_types.TEXT_INPUT")).tag("TEXT_INPUT")
                }
                .pickerStyle(.segmented)
                .onChange(of: questionDraft.type) { _, newValue in
                    applyQuestionType(newValue)
                }
            }

            field(label: s("admin.tests.question_label")) {
                multilineField(
                    placeholder: s("admin.tests.question_placeholder"),
                    text: $questionDraft.question,
                    minHeight: 80
                )
            }

            field(label: s("admin.tests.points_label")) {
                Stepper(value: $questionDraft.points, in: 1...100) {
                    Text("\(questionDraft.points)")
                        .font(TrustoraTypography.body)
                }
            }

            if questionDraft.isChoiceType {
                choiceEditor
            }

            if questionDraft.isTextInputType {
                field(label: s("admin.tests.text_input_answer_label")) {
                    TextField(
                        s("admin.tests.text_input_answer_placeholder"),
                        text: Binding(
                            get: { questionDraft.correctAnswers.first ?? "" },
                            set: { questionDraft.correctAnswers = $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? [] : [$0] }
                        )
                    )
                    .textInputAutocapitalization(.sentences)
                    .autocorrectionDisabled()
                }
            }

            if questionDraft.isCodeType {
                codeEditor
            }

            field(label: s("admin.tests.explanation_label")) {
                multilineField(
                    placeholder: s("admin.tests.explanation_placeholder"),
                    text: $questionDraft.explanation,
                    minHeight: 80
                )
            }

            HStack(spacing: 8) {
                Button {
                    saveQuestionDraft()
                } label: {
                    Text(editingQuestionIndex == nil ? s("admin.tests.add_question") : s("admin.tests.update_question"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.accentButtonText)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(TrustoraTheme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)

                if editingQuestionIndex != nil {
                    Button {
                        resetQuestionDraft()
                    } label: {
                        Text(s("admin.tests.cancel_edit_question"))
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
                }
            }
        }
    }

    private var choiceEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(s("admin.tests.options_label"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            ForEach(Array(questionDraft.options.enumerated()), id: \.offset) { index, option in
                HStack(spacing: 8) {
                    TextField(
                        sf("admin.tests.option_placeholder", ["number": "\(index + 1)"]),
                        text: Binding(
                            get: { questionDraft.options[safe: index] ?? option },
                            set: { newValue in
                                ensureQuestionOptionsCount(index + 1)
                                questionDraft.options[index] = newValue
                            }
                        )
                    )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                    Button {
                        toggleCorrectAnswer(option: questionDraft.options[safe: index] ?? "")
                    } label: {
                        Image(systemName: isCorrectAnswer(option: questionDraft.options[safe: index] ?? "") ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(isCorrectAnswer(option: questionDraft.options[safe: index] ?? "") ? TrustoraTheme.accent : TrustoraTheme.tertiaryText)
                    }
                    .buttonStyle(.plain)
                }
                .padding(8)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
            }
        }
    }

    private var codeEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            field(label: s("admin.tests.code_template_label")) {
                multilineField(
                    placeholder: s("admin.tests.code_template_placeholder"),
                    text: $questionDraft.codeTemplate,
                    minHeight: 90
                )
            }

            field(label: s("admin.tests.code_solution_label")) {
                multilineField(
                    placeholder: s("admin.tests.code_solution_placeholder"),
                    text: $questionDraft.codeSolution,
                    minHeight: 90
                )
            }

            field(label: s("admin.tests.expected_output_label")) {
                multilineField(
                    placeholder: s("admin.tests.expected_output_placeholder"),
                    text: $questionDraft.expectedOutput,
                    minHeight: 70
                )
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(s("admin.tests.test_cases_label"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.secondaryText)

                    Spacer(minLength: 0)

                    Button {
                        questionDraft.testCases.append(
                            AdminTestQuestionTestCase(
                                input: "",
                                expectedOutput: "",
                                description: ""
                            )
                        )
                    } label: {
                        Text(s("admin.tests.add_test_case"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.primary)
                    }
                    .buttonStyle(.plain)
                }

                if questionDraft.testCases.isEmpty {
                    Text(s("admin.tests.no_test_cases"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                } else {
                    ForEach(Array(questionDraft.testCases.enumerated()), id: \.offset) { index, _ in
                        VStack(alignment: .leading, spacing: 6) {
                            Text("\(s("admin.tests.test_case")) #\(index + 1)")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.secondaryText)

                            TextField(
                                s("admin.tests.test_case_input_placeholder"),
                                text: Binding(
                                    get: { questionDraft.testCases[safe: index]?.input ?? "" },
                                    set: { newValue in
                                        updateTestCase(index: index, input: newValue)
                                    }
                                )
                            )
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                            TextField(
                                s("admin.tests.test_case_output_placeholder"),
                                text: Binding(
                                    get: { questionDraft.testCases[safe: index]?.expectedOutput ?? "" },
                                    set: { newValue in
                                        updateTestCase(index: index, expectedOutput: newValue)
                                    }
                                )
                            )
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                            TextField(
                                s("admin.tests.test_case_description_placeholder"),
                                text: Binding(
                                    get: { questionDraft.testCases[safe: index]?.description ?? "" },
                                    set: { newValue in
                                        updateTestCase(index: index, description: newValue)
                                    }
                                )
                            )
                            .textInputAutocapitalization(.sentences)
                            .autocorrectionDisabled()

                            Button(role: .destructive) {
                                questionDraft.testCases.remove(at: index)
                            } label: {
                                Text(s("admin.tests.remove_test_case"))
                                    .font(TrustoraTypography.caption)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }
                }
            }
        }
    }

    private func submit() async {
        localError = nil

        if draft.questions.isEmpty {
            localError = s("admin.tests.validation.questions_required")
            return
        }

        guard canSubmit else {
            localError = s("admin.tests.validation.form_invalid")
            return
        }

        let success = await onSubmit(draft, mode)
        if success {
            dismiss()
        }
    }

    private func saveQuestionDraft() {
        localError = nil

        if questionDraft.question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            localError = s("admin.tests.validation.question_required")
            return
        }

        if questionDraft.isChoiceType {
            let normalizedOptions = questionDraft.options
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
            if normalizedOptions.count < 2 {
                localError = s("admin.tests.validation.options_required")
                return
            }
            if questionDraft.correctAnswers.isEmpty {
                localError = s("admin.tests.validation.correct_answer_required")
                return
            }
        }

        if questionDraft.isTextInputType {
            if questionDraft.correctAnswers.isEmpty ||
                (questionDraft.correctAnswers.first?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) {
                localError = s("admin.tests.validation.text_answer_required")
                return
            }
        }

        if questionDraft.isCodeType {
            let hasExpectedOutput = !questionDraft.expectedOutput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            let hasTestCase = questionDraft.testCases.contains {
                !$0.expectedOutput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                !$0.input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            }

            if !hasExpectedOutput && !hasTestCase {
                localError = s("admin.tests.validation.code_output_required")
                return
            }

            if questionDraft.correctAnswers.isEmpty {
                questionDraft.correctAnswers = ["CODE_SOLUTION"]
            }
        }

        let normalizedQuestion = normalizedQuestionDraft(questionDraft)

        if let editingQuestionIndex {
            draft.questions[editingQuestionIndex] = normalizedQuestion
        } else {
            draft.questions.append(normalizedQuestion)
        }

        resetQuestionDraft()
    }

    private func startEditQuestion(_ index: Int) {
        guard draft.questions.indices.contains(index) else {
            return
        }

        questionDraft = draft.questions[index]
        editingQuestionIndex = index
    }

    private func removeQuestion(_ index: Int) {
        guard draft.questions.indices.contains(index) else {
            return
        }

        draft.questions.remove(at: index)

        if editingQuestionIndex == index {
            resetQuestionDraft()
        }
    }

    private func resetQuestionDraft() {
        questionDraft = AdminTestEditorQuestionDraft()
        editingQuestionIndex = nil
        localError = nil
    }

    private func applyQuestionType(_ type: String) {
        let normalized = AdminTestQuestion.normalizedQuestionType(type)
        questionDraft.type = normalized

        switch normalized {
        case "SINGLE_CHOICE", "MULTIPLE_CHOICE":
            if questionDraft.options.isEmpty {
                questionDraft.options = ["", "", "", ""]
            }
            questionDraft.correctAnswers = []
            questionDraft.codeTemplate = ""
            questionDraft.codeSolution = ""
            questionDraft.expectedOutput = ""
            questionDraft.testCases = []
        case "CODE_WRITING":
            questionDraft.options = []
            questionDraft.correctAnswers = ["CODE_SOLUTION"]
        case "TEXT_INPUT":
            questionDraft.options = []
            questionDraft.correctAnswers = []
            questionDraft.codeTemplate = ""
            questionDraft.codeSolution = ""
            questionDraft.expectedOutput = ""
            questionDraft.testCases = []
        default:
            break
        }
    }

    private func normalizedQuestionDraft(_ value: AdminTestEditorQuestionDraft) -> AdminTestEditorQuestionDraft {
        var result = value
        result.type = value.normalizedType
        result.question = value.question.trimmingCharacters(in: .whitespacesAndNewlines)
        result.options = value.options.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        result.correctAnswers = value.correctAnswers
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        result.explanation = value.explanation.trimmingCharacters(in: .whitespacesAndNewlines)
        result.codeTemplate = value.codeTemplate.trimmingCharacters(in: .whitespacesAndNewlines)
        result.codeSolution = value.codeSolution.trimmingCharacters(in: .whitespacesAndNewlines)
        result.expectedOutput = value.expectedOutput.trimmingCharacters(in: .whitespacesAndNewlines)
        result.testCases = value.testCases.map {
            AdminTestQuestionTestCase(
                input: $0.input.trimmingCharacters(in: .whitespacesAndNewlines),
                expectedOutput: $0.expectedOutput.trimmingCharacters(in: .whitespacesAndNewlines),
                description: $0.description.trimmingCharacters(in: .whitespacesAndNewlines)
            )
        }
        return result
    }

    private func ensureQuestionOptionsCount(_ count: Int) {
        guard count > questionDraft.options.count else {
            return
        }

        questionDraft.options += Array(repeating: "", count: count - questionDraft.options.count)
    }

    private func toggleCorrectAnswer(option: String) {
        let trimmed = option.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return
        }

        if questionDraft.normalizedType == "SINGLE_CHOICE" {
            questionDraft.correctAnswers = [trimmed]
            return
        }

        if let index = questionDraft.correctAnswers.firstIndex(of: trimmed) {
            questionDraft.correctAnswers.remove(at: index)
        } else {
            questionDraft.correctAnswers.append(trimmed)
        }
    }

    private func isCorrectAnswer(option: String) -> Bool {
        let trimmed = option.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return false
        }

        return questionDraft.correctAnswers.contains(trimmed)
    }

    private func updateTestCase(index: Int, input: String? = nil, expectedOutput: String? = nil, description: String? = nil) {
        guard questionDraft.testCases.indices.contains(index) else {
            return
        }

        let current = questionDraft.testCases[index]
        questionDraft.testCases[index] = AdminTestQuestionTestCase(
            input: input ?? current.input,
            expectedOutput: expectedOutput ?? current.expectedOutput,
            description: description ?? current.description
        )
    }

    private func errorCard(_ message: String) -> some View {
        Text(message)
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

    private func fieldSection<Content: View>(
        title: String,
        subtitle: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(TrustoraTheme.primary)

            Text(subtitle)
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func field<Content: View>(
        label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            content()
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primary)
                .padding(.horizontal, 10)
                .padding(.vertical, 10)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func multilineField(
        placeholder: String,
        text: Binding<String>,
        minHeight: CGFloat
    ) -> some View {
        ZStack(alignment: .topLeading) {
            if text.wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(placeholder)
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 6)
            }

            TextEditor(text: text)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primary)
                .scrollContentBackground(.hidden)
                .frame(minHeight: minHeight)
                .padding(.horizontal, 0)
                .padding(.vertical, 0)
                .background(Color.clear)
        }
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

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else {
            return nil
        }
        return self[index]
    }
}

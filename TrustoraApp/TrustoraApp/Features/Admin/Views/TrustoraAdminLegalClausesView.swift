import SwiftUI

struct TrustoraAdminLegalClausesView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminLegalClausesViewModel()
    @State private var isEditorPresented = false
    @State private var editorMode: AdminLegalClauseEditorMode = .create
    @State private var editorDraft = AdminLegalClauseEditorDraft()
    @State private var editorLanguageCode = "ro"
    @State private var deleteCandidate: AdminLegalClause?
    @State private var isPreparingEdit = false

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
        ].joined(separator: "|")
    }

    private var canView: Bool {
        hasAccess(requiredPermissions: ["legal.clauses.read"])
    }

    private var canCreate: Bool {
        hasAccess(requiredPermissions: ["legal.clauses.create"])
    }

    private var canEdit: Bool {
        hasAccess(requiredPermissions: ["legal.clauses.update"])
    }

    private var canDelete: Bool {
        hasAccess(requiredPermissions: ["legal.clauses.delete"])
    }

    var body: some View {
        NavigationStack {
            ZStack {
                background.ignoresSafeArea()

                if !canView {
                    unavailableState
                } else {
                    ScrollView {
                        VStack(spacing: TrustoraMetrics.sectionSpacing) {
                            headerCard
                            filtersCard
                            clausesCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadData()
                    }
                }

                if isPreparingEdit {
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
                    Text(s("admin.legal_clauses.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                if canView && canCreate {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            openCreateEditor()
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
                        .accessibilityLabel(s("admin.legal_clauses.add_clause"))
                    }
                }
            }
            .task(id: refreshKey) {
                guard canView else {
                    return
                }
                await reloadData()
            }
            .sheet(isPresented: $isEditorPresented) {
                TrustoraAdminLegalClauseFormSheet(
                    mode: editorMode,
                    selectedLanguageCode: editorLanguageCode,
                    strings: strings,
                    initialDraft: editorDraft,
                    isSubmitting: viewModel.isSubmitting,
                    errorMessage: viewModel.actionErrorMessage,
                    onSubmit: { draft, mode, selectedLanguage in
                        guard let token = authSession.accessToken else {
                            return false
                        }

                        switch mode {
                        case .create:
                            return await viewModel.createClause(
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        case let .edit(clauseID):
                            return await viewModel.updateClause(
                                clauseID: clauseID,
                                draft: draft,
                                languageCode: selectedLanguage,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        }
                    }
                )
            }
            .alert(
                s("admin.legal_clauses.confirm_delete"),
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

                Button(s("admin.legal_clauses.delete"), role: .destructive) {
                    guard let token = authSession.accessToken, let deleteCandidate else {
                        return
                    }

                    Task {
                        _ = await viewModel.deleteClause(
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
            Text(s("admin.legal_clauses.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.legal_clauses.manage_subtitle"))
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

                TextField(s("admin.legal_clauses.search_placeholder"), text: $viewModel.searchText)
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

            HStack(spacing: 8) {
                TextField(s("admin.legal_clauses.category_filter_placeholder"), text: $viewModel.categoryFilter)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(TrustoraTypography.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .trustoraCardStyle(
                        cornerRadius: TrustoraMetrics.compactCardRadius,
                        background: TrustoraTheme.mutedSurface
                    )

                TextField(s("admin.legal_clauses.identifier_filter_placeholder"), text: $viewModel.identifierFilter)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(TrustoraTypography.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .trustoraCardStyle(
                        cornerRadius: TrustoraMetrics.compactCardRadius,
                        background: TrustoraTheme.mutedSurface
                    )
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    filterMenu(
                        title: s("admin.legal_clauses.language_filter_title"),
                        value: languageLabel(for: viewModel.languageFilter)
                    ) {
                        ForEach(AdminLegalClauseLanguageOption.all) { option in
                            Button {
                                viewModel.languageFilter = option.code
                                viewModel.page = 1
                            } label: {
                                if viewModel.languageFilter == option.code {
                                    Label(s(option.titleKey), systemImage: "checkmark")
                                } else {
                                    Text(s(option.titleKey))
                                }
                            }
                        }
                    }

                    filterMenu(
                        title: s("admin.legal_clauses.sort_by_title"),
                        value: s(viewModel.sortBy.titleKey)
                    ) {
                        ForEach(AdminLegalClausesSortBy.allCases) { option in
                            Button {
                                viewModel.sortBy = option
                                viewModel.page = 1
                            } label: {
                                if viewModel.sortBy == option {
                                    Label(s(option.titleKey), systemImage: "checkmark")
                                } else {
                                    Text(s(option.titleKey))
                                }
                            }
                        }
                    }

                    filterMenu(
                        title: s("admin.legal_clauses.sort_direction_title"),
                        value: s(viewModel.sortDirection.titleKey)
                    ) {
                        ForEach(AdminLegalClausesSortDirection.allCases) { option in
                            Button {
                                viewModel.sortDirection = option
                                viewModel.page = 1
                            } label: {
                                if viewModel.sortDirection == option {
                                    Label(s(option.titleKey), systemImage: "checkmark")
                                } else {
                                    Text(s(option.titleKey))
                                }
                            }
                        }
                    }

                    filterMenu(
                        title: s("admin.legal_clauses.per_page_title"),
                        value: "\(viewModel.perPage)"
                    ) {
                        ForEach([10, 15, 25, 50, 100], id: \.self) { option in
                            Button {
                                viewModel.perPage = option
                                viewModel.page = 1
                            } label: {
                                if viewModel.perPage == option {
                                    Label("\(option)", systemImage: "checkmark")
                                } else {
                                    Text("\(option)")
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 1)
            }

            if !viewModel.categories.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(viewModel.categories, id: \.self) { category in
                            Button {
                                viewModel.categoryFilter = category
                                viewModel.page = 1
                            } label: {
                                let selected = viewModel.categoryFilter == category
                                Text(category)
                                    .font(TrustoraTypography.caption)
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
                    }
                    .padding(.horizontal, 1)
                }
            }

            HStack(spacing: 8) {
                Button {
                    Task {
                        viewModel.page = 1
                        await reloadData()
                    }
                } label: {
                    Text(s("admin.legal_clauses.apply_filters"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(primary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)

                Button {
                    Task {
                        viewModel.resetFilters()
                        await reloadData()
                    }
                } label: {
                    Text(s("admin.legal_clauses.reset_filters"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(primary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func filterMenu<Content: View>(
        title: String,
        value: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        Menu {
            content()
        } label: {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                Text(value)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                    .lineLimit(1)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: TrustoraMetrics.compactCardRadius, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var clausesCard: some View {
        let visibleClauses = viewModel.filteredClauses

        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.legal_clauses.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(
                sf(
                    "admin.legal_clauses.list_description",
                    [
                        "shown": "\(visibleClauses.count)",
                        "total": "\(viewModel.totalClauses)",
                    ]
                )
            )
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
            } else if visibleClauses.isEmpty {
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
                    ForEach(visibleClauses) { clause in
                        clauseRow(clause)
                            .onAppear {
                                if clause.id == visibleClauses.last?.id,
                                   viewModel.hasNextPage,
                                   !viewModel.isLoading {
                                    Task {
                                        viewModel.page += 1
                                        await reloadData()
                                    }
                                }
                            }
                    }
                }

                if viewModel.isLoading && !visibleClauses.isEmpty {
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
                                "admin.legal_clauses.pagination",
                                [
                                    "current": "\(viewModel.page)",
                                    "last": "\(viewModel.lastPage)",
                                ]
                            )
                        )
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                        Spacer()

                        HStack(spacing: 8) {
                            Button(s("admin.legal_clauses.pagination_previous")) {
                                guard viewModel.hasPreviousPage else {
                                    return
                                }
                                Task {
                                    viewModel.page -= 1
                                    await reloadData()
                                }
                            }
                            .buttonStyle(.plain)
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.hasPreviousPage ? primary : TrustoraTheme.tertiaryText)

                            Button(s("admin.legal_clauses.pagination_next")) {
                                guard viewModel.hasNextPage else {
                                    return
                                }
                                Task {
                                    viewModel.page += 1
                                    await reloadData()
                                }
                            }
                            .buttonStyle(.plain)
                            .font(TrustoraTypography.control)
                            .foregroundStyle(viewModel.hasNextPage ? primary : TrustoraTheme.tertiaryText)
                        }
                    }
                    .padding(.top, 2)
                }
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func clauseRow(_ clause: AdminLegalClause) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Text(clause.identifier)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)

                        Text(clause.category)
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                            .lineLimit(1)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color(hex: 0xF8FAFC))
                            .clipShape(Capsule())
                            .overlay(
                                Capsule().stroke(TrustoraTheme.border, lineWidth: 1)
                            )
                    }

                    let preview = clausePreviewText(clause)
                    if !preview.isEmpty {
                        Text(preview)
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                            .lineLimit(3)
                    }

                    HStack(spacing: 6) {
                        if let updatedAt = clause.updatedAt {
                            Text(
                                sf(
                                    "admin.legal_clauses.updated_prefix",
                                    [
                                        "date": DateFormatter.trustoraShortDate.string(from: updatedAt),
                                    ]
                                )
                            )
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                        }

                        Circle()
                            .fill(TrustoraTheme.border)
                            .frame(width: 4, height: 4)

                        Text(
                            sf(
                                "admin.legal_clauses.translations_count",
                                ["count": "\(clause.translationCount)"]
                            )
                        )
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                    }
                }

                Spacer(minLength: 0)

                if canEdit || canDelete {
                    clauseActionsMenu(clause)
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

    private func clauseActionsMenu(_ clause: AdminLegalClause) -> some View {
        Menu {
            if canEdit {
                Button {
                    Task {
                        await openEditEditor(for: clause)
                    }
                } label: {
                    Label(s("admin.legal_clauses.edit"), systemImage: "pencil")
                }
            }

            if canDelete {
                Button(role: .destructive) {
                    deleteCandidate = clause
                } label: {
                    Label(s("admin.legal_clauses.delete"), systemImage: "trash")
                }
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

    private func retryCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(TrustoraTypography.body)
                .foregroundStyle(Color(hex: 0xB91C1C))

            Button {
                Task {
                    await reloadData()
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
            Image(systemName: "doc.text")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.legal_clauses.empty_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.legal_clauses.empty_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)

            if canCreate {
                Button {
                    openCreateEditor()
                } label: {
                    Text(s("admin.legal_clauses.add_clause"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func openCreateEditor() {
        viewModel.actionErrorMessage = nil
        editorMode = .create
        editorLanguageCode = "ro"
        editorDraft = AdminLegalClauseEditorDraft()
        isEditorPresented = true
    }

    private func openEditEditor(for clause: AdminLegalClause) async {
        guard canEdit, let token = authSession.accessToken else {
            return
        }

        isPreparingEdit = true
        viewModel.actionErrorMessage = nil

        let languageCode = viewModel.languageFilter == "all" ? resolvedLanguageCode : viewModel.languageFilter
        if let detail = await viewModel.loadClauseDetail(
            clauseID: clause.id,
            languageFilter: languageCode,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) {
            var draft = AdminLegalClauseEditorDraft()
            draft.apply(detail)
            draft.selectedLanguage = languageCode
            editorDraft = draft
            editorLanguageCode = languageCode
            editorMode = .edit(clauseID: clause.id)
            isEditorPresented = true
        }

        isPreparingEdit = false
    }

    private func reloadData() async {
        guard let token = authSession.accessToken else {
            return
        }

        async let clausesTask: Void = viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
        async let categoriesTask: Void = viewModel.loadCategories(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
        _ = await (clausesTask, categoriesTask)
    }

    private func languageLabel(for code: String) -> String {
        let option = AdminLegalClauseLanguageOption.all.first(where: { $0.code == code })
        return option.map { s($0.titleKey) } ?? code.uppercased()
    }

    private func clausePreviewText(_ clause: AdminLegalClause) -> String {
        let preferredCode = viewModel.languageFilter == "all" ? resolvedLanguageCode : viewModel.languageFilter
        let value =
            clause.content[preferredCode] ??
            clause.content["ro"] ??
            clause.content["en"] ??
            clause.content.values.first ??
            ""

        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return ""
        }
        if trimmed.count > 140 {
            return String(trimmed.prefix(140)) + "…"
        }
        return trimmed
    }

    private func hasAccess(requiredPermissions: [String]) -> Bool {
        guard let user = authSession.user, authSession.accessToken != nil else {
            return false
        }

        if user.isSuperuser == true {
            return true
        }

        let hasRole = user.hasRole("admin") || user.hasRole("legal")
        if !hasRole {
            return false
        }

        if requiredPermissions.isEmpty {
            return true
        }

        let availablePermissions = Set((user.permissions ?? []).map { $0.lowercased() })
        return requiredPermissions.allSatisfy { availablePermissions.contains($0.lowercased()) }
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

private struct TrustoraAdminLegalClauseFormSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: AdminLegalClauseEditorMode
    let selectedLanguageCode: String
    let strings: (String) -> String
    let isSubmitting: Bool
    let errorMessage: String?
    let onSubmit: (_ draft: AdminLegalClauseEditorDraft, _ mode: AdminLegalClauseEditorMode, _ selectedLanguage: String) async -> Bool

    @State private var draft: AdminLegalClauseEditorDraft
    @State private var activeLanguageCode: String

    init(
        mode: AdminLegalClauseEditorMode,
        selectedLanguageCode: String,
        strings: @escaping (String) -> String,
        initialDraft: AdminLegalClauseEditorDraft,
        isSubmitting: Bool,
        errorMessage: String?,
        onSubmit: @escaping (_ draft: AdminLegalClauseEditorDraft, _ mode: AdminLegalClauseEditorMode, _ selectedLanguage: String) async -> Bool
    ) {
        self.mode = mode
        self.selectedLanguageCode = selectedLanguageCode
        self.strings = strings
        self.isSubmitting = isSubmitting
        self.errorMessage = errorMessage
        self.onSubmit = onSubmit
        _draft = State(initialValue: initialDraft)
        _activeLanguageCode = State(initialValue: selectedLanguageCode)
    }

    private var canSubmit: Bool {
        switch mode {
        case .create:
            return draft.isCreateValid && !isSubmitting
        case .edit:
            let hasIdentifier = !draft.identifier.trimmed.isEmpty
            let hasCategory = !draft.category.trimmed.isEmpty
            let hasText = !draft.text(for: activeLanguageCode).trimmed.isEmpty
            return hasIdentifier && hasCategory && hasText && !isSubmitting
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let errorMessage, !errorMessage.isEmpty {
                        Text(errorMessage)
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

                    fieldSection(
                        title: mode.isEdit ? s("admin.legal_clauses.edit_title") : s("admin.legal_clauses.create_title"),
                        subtitle: mode.isEdit ? s("admin.legal_clauses.edit_subtitle") : s("admin.legal_clauses.create_subtitle")
                    ) {
                        field(label: s("admin.legal_clauses.identifier_label")) {
                            TextField(s("admin.legal_clauses.identifier_placeholder"), text: $draft.identifier)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }

                        field(label: s("admin.legal_clauses.category_label")) {
                            TextField(s("admin.legal_clauses.category_placeholder"), text: $draft.category)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                    }

                    switch mode {
                    case .create:
                        fieldSection(
                            title: s("admin.legal_clauses.translations_title"),
                            subtitle: s("admin.legal_clauses.translations_subtitle")
                        ) {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(AdminLegalClauseLanguageOption.editable) { option in
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(s(option.titleKey))
                                            .font(TrustoraTypography.caption)
                                            .foregroundStyle(TrustoraTheme.secondaryText)
                                        TextEditor(
                                            text: Binding(
                                                get: { draft.text(for: option.code) },
                                                set: { value in
                                                    draft.setText(value, for: option.code)
                                                }
                                            )
                                        )
                                        .font(TrustoraTypography.body)
                                        .foregroundStyle(TrustoraTheme.primary)
                                        .frame(minHeight: 120)
                                        .padding(8)
                                        .background(TrustoraTheme.surface)
                                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                                .stroke(TrustoraTheme.border, lineWidth: 1)
                                        )
                                    }
                                }
                            }
                        }
                    case .edit:
                        fieldSection(
                            title: s("admin.legal_clauses.text_title"),
                            subtitle: s("admin.legal_clauses.text_subtitle")
                        ) {
                            field(label: s("admin.legal_clauses.language_filter_title")) {
                                Picker("", selection: $activeLanguageCode) {
                                    ForEach(AdminLegalClauseLanguageOption.editable) { option in
                                        Text(s(option.titleKey)).tag(option.code)
                                    }
                                }
                                .pickerStyle(.menu)
                            }

                            field(label: languageLabel(for: activeLanguageCode)) {
                                TextEditor(
                                    text: Binding(
                                        get: { draft.text(for: activeLanguageCode) },
                                        set: { value in
                                            draft.setText(value, for: activeLanguageCode)
                                        }
                                    )
                                )
                                .font(TrustoraTypography.body)
                                .foregroundStyle(TrustoraTheme.primary)
                                .frame(minHeight: 180)
                                .padding(8)
                                .background(TrustoraTheme.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(TrustoraTheme.border, lineWidth: 1)
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 24)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("common.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                }

                ToolbarItem(placement: .principal) {
                    Text(mode.isEdit ? s("admin.legal_clauses.edit") : s("admin.legal_clauses.add_clause"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            let success = await onSubmit(draft, mode, activeLanguageCode)
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                                .tint(TrustoraTheme.primary)
                        } else {
                            Text(mode.isEdit ? s("admin.legal_clauses.save_changes") : s("admin.legal_clauses.create_clause"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.primary)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!canSubmit)
                    .opacity(canSubmit ? 1 : 0.45)
                }
            }
        }
    }

    @ViewBuilder
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
        .padding(12)
        .trustoraCardStyle()
    }

    @ViewBuilder
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
                .padding(.vertical, 8)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )
        }
    }

    private func languageLabel(for code: String) -> String {
        let option = AdminLegalClauseLanguageOption.all.first(where: { $0.code == code })
        return option.map { s($0.titleKey) } ?? code.uppercased()
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

private extension DateFormatter {
    static let trustoraShortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}

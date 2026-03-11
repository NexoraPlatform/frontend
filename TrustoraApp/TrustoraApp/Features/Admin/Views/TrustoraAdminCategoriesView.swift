import SwiftUI

struct TrustoraAdminCategoriesView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String
    var openCreateOnAppear = false

    @StateObject private var viewModel = TrustoraAdminCategoriesViewModel()

    @State private var isEditorPresented = false
    @State private var editorMode: AdminCategoryEditorMode = .create
    @State private var editorDraft = AdminCategoryEditorDraft()
    @State private var deleteCandidate: AdminCategorySummary?
    @State private var isPreparingEdit = false
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

    private var filteredCategories: [AdminCategorySummary] {
        viewModel.filteredCategories
    }

    private var categoryChildrenMap: [String: [AdminCategorySummary]] {
        var map: [String: [AdminCategorySummary]] = [:]
        for category in filteredCategories {
            let key = parentKey(category.parentID)
            if key.isEmpty {
                continue
            }
            map[key, default: []].append(category)
        }
        return map
    }

    private var rootCategories: [AdminCategorySummary] {
        filteredCategories.filter { parentKey($0.parentID).isEmpty }
    }

    private var parentCategories: [AdminCategorySummary] {
        viewModel.allCategories.filter { parentKey($0.parentID).isEmpty }
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
                            categoriesCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadCategories()
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
                    Text(s("admin.categories.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                if canAccessAdmin {
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
                        .accessibilityLabel(s("admin.categories.add_category"))
                    }
                }
            }
            .task(id: refreshKey) {
                if openCreateOnAppear && !didHandleInitialCreate {
                    didHandleInitialCreate = true
                    openCreateEditor()
                }
                guard canAccessAdmin else { return }
                await reloadCategories()
            }
            .sheet(isPresented: $isEditorPresented) {
                TrustoraAdminCategoryFormSheet(
                    mode: editorMode,
                    strings: strings,
                    initialDraft: editorDraft,
                    parentCategories: parentCategoryOptions(
                        excluding: {
                            if case let .edit(categoryID) = editorMode {
                                return categoryID
                            }
                            return nil
                        }()
                    ),
                    isSubmitting: viewModel.isSubmitting,
                    errorMessage: viewModel.actionErrorMessage,
                    onLoadCategorySlug: { categoryID in
                        guard let token = authSession.accessToken else {
                            return nil
                        }
                        return await viewModel.loadCategorySlug(
                            categoryID: categoryID,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    },
                    onSubmit: { draft, mode in
                        guard let token = authSession.accessToken else {
                            return false
                        }

                        switch mode {
                        case .create:
                            return await viewModel.createCategory(
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        case let .edit(categoryID):
                            return await viewModel.updateCategory(
                                categoryID: categoryID,
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        }
                    }
                )
            }
            .alert(
                s("admin.categories.confirm_delete"),
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

                Button(s("admin.categories.delete"), role: .destructive) {
                    guard let deleteCandidate, let token = authSession.accessToken else {
                        return
                    }

                    Task {
                        _ = await viewModel.deleteCategory(
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
            Text(s("admin.categories.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.categories.manage_subtitle"))
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

                TextField(s("admin.categories.name_placeholder"), text: $viewModel.searchText)
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
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var categoriesCard: some View {
        let parentsCount = rootCategories.count
        let childrenCount = max(0, filteredCategories.count - parentsCount)
        let rows = flattenedRows()

        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "folder.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.categories.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf(
                "admin.categories.total_summary",
                [
                    "count": "\(filteredCategories.count)",
                    "parents": "\(parentsCount)",
                    "children": "\(childrenCount)",
                ]
            ))
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
            } else if filteredCategories.isEmpty {
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
                    ForEach(rows) { item in
                        categoryRow(
                            item.category,
                            depth: item.depth,
                            childCount: item.childCount
                        )
                        .onAppear {
                            if item.id == rows.last?.id {
                                Task {
                                    await loadMoreCategoriesIfNeeded()
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
                    await reloadCategories()
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
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.categories.no_categories_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.categories.no_categories_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)

            Button {
                openCreateEditor()
            } label: {
                Text(s("admin.categories.add_first_category"))
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func flattenedRows() -> [AdminCategoryFlattenedRow] {
        var result: [AdminCategoryFlattenedRow] = []
        let childrenMap = categoryChildrenMap
        var visited = Set<String>()

        func walk(category: AdminCategorySummary, depth: Int) {
            guard visited.insert(category.id).inserted else {
                return
            }

            let childCount = childrenMap[category.id]?.count ?? 0
            result.append(
                AdminCategoryFlattenedRow(
                    category: category,
                    depth: depth,
                    childCount: childCount
                )
            )

            for child in childrenMap[category.id] ?? [] {
                walk(category: child, depth: depth + 1)
            }
        }

        for root in rootCategories {
            walk(category: root, depth: 0)
        }

        if result.count < filteredCategories.count {
            for category in filteredCategories where !visited.contains(category.id) {
                walk(category: category, depth: 0)
            }
        }

        return result
    }

    private func categoryRow(
        _ category: AdminCategorySummary,
        depth: Int,
        childCount: Int
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: depth == 0 ? "folder.fill" : "folder")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(depth == 0 ? Color(hex: 0x0284C7) : TrustoraTheme.secondaryText)
                    .frame(width: 28, height: 28)
                    .background(depth == 0 ? Color(hex: 0xE0F2FE) : Color(hex: 0xF1F5F9))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Text(category.name)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                            .lineLimit(2)

                        Text(category.slug)
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

                        if !category.isActive {
                            Text(s("admin.categories.inactive"))
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(Color(hex: 0x991B1B))
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Color(hex: 0xFEE2E2))
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule().stroke(Color(hex: 0xFECACA), lineWidth: 1)
                                )
                        }
                    }

                    if !category.description.isEmpty {
                        Text(category.description)
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                            .lineLimit(2)
                    }

                    HStack(spacing: 6) {
                        Text("\(s("admin.categories.order_label")): \(category.sortOrder)")
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.secondaryText)

                        if childCount > 0 {
                            Circle()
                                .fill(TrustoraTheme.border)
                                .frame(width: 4, height: 4)

                            Text("\(childCount) \(s("admin.categories.subcategories_label"))")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.secondaryText)
                        }

                        if let icon = category.icon,
                           !icon.isEmpty {
                            Circle()
                                .fill(TrustoraTheme.border)
                                .frame(width: 4, height: 4)

                            Text("\(s("admin.categories.icon_label")): \(icon)")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .lineLimit(1)
                        }
                    }
                }

                Spacer(minLength: 0)

                categoryActionsMenu(for: category)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .padding(.leading, CGFloat(depth) * 18)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func categoryActionsMenu(for category: AdminCategorySummary) -> some View {
        Menu {
            Button {
                Task {
                    await openEditEditor(for: category)
                }
            } label: {
                Label(s("admin.categories.edit"), systemImage: "pencil")
            }

            Button(role: .destructive) {
                deleteCandidate = category
            } label: {
                Label(s("admin.categories.delete"), systemImage: "trash")
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

    private func openCreateEditor() {
        viewModel.actionErrorMessage = nil
        editorMode = .create
        editorDraft = AdminCategoryEditorDraft()
        isEditorPresented = true
    }

    private func openEditEditor(for category: AdminCategorySummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        isPreparingEdit = true

        if let detail = await viewModel.loadCategoryDetail(
            categoryID: category.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) {
            var draft = AdminCategoryEditorDraft()
            draft.apply(detail)
            editorDraft = draft
            editorMode = .edit(categoryID: category.id)
            isEditorPresented = true
        }

        isPreparingEdit = false
    }

    private func reloadCategories() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreCategoriesIfNeeded() async {
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

    private func parentCategoryOptions(excluding categoryID: String?) -> [AdminCategoryParentOption] {
        parentCategories
            .filter { candidate in
                guard let categoryID else {
                    return true
                }
                return candidate.id != categoryID
            }
            .map { category in
                AdminCategoryParentOption(
                    id: category.id,
                    name: category.name,
                    slug: category.slug
                )
            }
    }

    private func parentKey(_ value: String?) -> String {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return (trimmed == "0") ? "" : trimmed
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

private struct TrustoraAdminCategoryFormSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: AdminCategoryEditorMode
    let strings: (String) -> String
    let parentCategories: [AdminCategoryParentOption]
    let isSubmitting: Bool
    let errorMessage: String?
    let onLoadCategorySlug: (_ categoryID: String) async -> String?
    let onSubmit: (_ draft: AdminCategoryEditorDraft, _ mode: AdminCategoryEditorMode) async -> Bool

    @State private var draft: AdminCategoryEditorDraft
    @State private var hasManualSlug = false
    @State private var isApplyingAutoSlug = false
    @State private var parentSlugs: [String: String]

    init(
        mode: AdminCategoryEditorMode,
        strings: @escaping (String) -> String,
        initialDraft: AdminCategoryEditorDraft,
        parentCategories: [AdminCategoryParentOption],
        isSubmitting: Bool,
        errorMessage: String?,
        onLoadCategorySlug: @escaping (_ categoryID: String) async -> String?,
        onSubmit: @escaping (_ draft: AdminCategoryEditorDraft, _ mode: AdminCategoryEditorMode) async -> Bool
    ) {
        self.mode = mode
        self.strings = strings
        self.parentCategories = parentCategories
        self.isSubmitting = isSubmitting
        self.errorMessage = errorMessage
        self.onLoadCategorySlug = onLoadCategorySlug
        self.onSubmit = onSubmit
        _draft = State(initialValue: initialDraft)
        _hasManualSlug = State(initialValue: mode.isEdit || !initialDraft.slug.isEmpty)
        _parentSlugs = State(initialValue: Dictionary(uniqueKeysWithValues: parentCategories.map { ($0.id, $0.slug) }))
    }

    private var canSubmit: Bool {
        draft.isValid && !isSubmitting
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

                    fieldSection(title: s("admin.categories.info_title"), subtitle: s("admin.categories.info_description")) {
                        field(label: s("admin.categories.name_label")) {
                            TextField(s("admin.categories.name_placeholder"), text: $draft.name)
                                .textInputAutocapitalization(.words)
                                .autocorrectionDisabled()
                                .onChange(of: draft.name) { _, _ in
                                    applyAutoSlugIfNeeded()
                                }
                        }

                        field(label: s("admin.categories.slug_label")) {
                            TextField(s("admin.categories.slug_placeholder"), text: $draft.slug)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .onChange(of: draft.slug) { _, _ in
                                    if !isApplyingAutoSlug {
                                        hasManualSlug = true
                                    }
                                }
                        }

                        Text(s("admin.categories.slug_help"))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)

                        field(label: s("admin.categories.description_label")) {
                            multilineField(
                                placeholder: s("admin.categories.description_placeholder"),
                                text: $draft.description,
                                minHeight: 100
                            )
                        }

                        field(label: s("admin.categories.icon_label")) {
                            TextField("material-symbols:folder", text: $draft.icon)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }

                        field(label: s("admin.categories.sort_order_label")) {
                            Stepper(value: $draft.sortOrder, in: 0 ... 9999) {
                                Text("\(draft.sortOrder)")
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(TrustoraTheme.primaryText)
                            }
                        }

                        field(label: s("admin.categories.parent_category_label")) {
                            Picker("", selection: $draft.parentID) {
                                Text(s("admin.categories.no_parent")).tag("")
                                ForEach(parentCategories) { category in
                                    Text(category.name).tag(category.id)
                                }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Text(s("admin.categories.no_parent_help"))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                    }
                }
                .padding(TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 10)
                .padding(.bottom, 24)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("admin.categories.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(mode.isEdit ? s("admin.categories.modify_title") : s("admin.categories.add_new_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            let success = await onSubmit(draft, mode)
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                                .tint(TrustoraTheme.primary)
                        } else {
                            Text(mode.isEdit ? s("admin.categories.modify_button") : s("admin.categories.create_category"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.primary)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!canSubmit)
                }
            }
            .onChange(of: draft.parentID) { _, newParentID in
                let trimmed = newParentID.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else {
                    applyAutoSlugIfNeeded()
                    return
                }

                if parentSlugs[trimmed]?.isEmpty == false {
                    applyAutoSlugIfNeeded()
                    return
                }

                Task {
                    let slug = await onLoadCategorySlug(trimmed)
                    await MainActor.run {
                        if let slug, !slug.isEmpty {
                            parentSlugs[trimmed] = slug
                        }
                        applyAutoSlugIfNeeded()
                    }
                }
            }
        }
    }

    private func fieldSection<Content: View>(
        title: String,
        subtitle: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(TrustoraTheme.primaryText)

            if !subtitle.isEmpty {
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
                .foregroundStyle(TrustoraTheme.primaryText)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .trustoraCardStyle(
                    cornerRadius: TrustoraMetrics.compactCardRadius,
                    background: TrustoraTheme.surface
                )
        }
    }

    private func multilineField(
        placeholder: String,
        text: Binding<String>,
        minHeight: CGFloat
    ) -> some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: text)
                .scrollContentBackground(.hidden)
                .frame(minHeight: minHeight)

            if text.wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(placeholder)
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .padding(.top, 8)
                    .padding(.leading, 5)
                    .allowsHitTesting(false)
            }
        }
    }

    private func applyAutoSlugIfNeeded() {
        guard !hasManualSlug else {
            return
        }

        isApplyingAutoSlug = true
        draft.slug = computedAutoSlug()
        isApplyingAutoSlug = false
    }

    private func computedAutoSlug() -> String {
        let nameSlug = generateSlug(draft.name)
        guard !nameSlug.isEmpty else {
            return ""
        }

        let parentID = draft.parentID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !parentID.isEmpty else {
            return nameSlug
        }

        let parentSlug = parentSlugs[parentID]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !parentSlug.isEmpty else {
            return nameSlug
        }

        return "\(parentSlug)/\(nameSlug)"
    }

    private func generateSlug(_ value: String) -> String {
        let lowercased = value.lowercased()
        let mapped = lowercased.map { character -> Character in
            if character.isLetter || character.isNumber {
                return character
            }
            if character.isWhitespace || character == "-" {
                return "-"
            }
            return "-"
        }

        let rough = String(mapped)
        let compact = rough.replacingOccurrences(of: "-{2,}", with: "-", options: .regularExpression)
        return compact.trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

private struct AdminCategoryParentOption: Identifiable {
    let id: String
    let name: String
    let slug: String
}

private struct AdminCategoryFlattenedRow: Identifiable {
    let category: AdminCategorySummary
    let depth: Int
    let childCount: Int

    var id: String { category.id }
}

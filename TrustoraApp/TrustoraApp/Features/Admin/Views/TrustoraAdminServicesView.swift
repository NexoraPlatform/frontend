import SwiftUI

struct TrustoraAdminServicesView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminServicesViewModel()

    @State private var isEditorPresented = false
    @State private var editorMode: AdminServiceEditorMode = .create
    @State private var editorDraft = AdminServiceEditorDraft()
    @State private var deleteCandidate: AdminServiceSummary?
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

    private var filteredServices: [AdminServiceSummary] {
        viewModel.filteredServices
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
                            servicesCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadServices(includeMetadata: true)
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
                    Text(s("admin.services.manage_title"))
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
                        .accessibilityLabel(s("admin.services.add_service"))
                    }
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadServices(includeMetadata: true)
            }
            .sheet(isPresented: $isEditorPresented) {
                TrustoraAdminServiceFormSheet(
                    mode: editorMode,
                    strings: strings,
                    initialDraft: editorDraft,
                    categories: viewModel.categories,
                    deliveryProviders: viewModel.deliveryProviders,
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
                            return await viewModel.createService(
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        case let .edit(serviceID):
                            return await viewModel.updateService(
                                serviceID: serviceID,
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
                s("admin.services.confirm_delete"),
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

                Button(s("admin.services.delete"), role: .destructive) {
                    guard let deleteCandidate, let token = authSession.accessToken else {
                        return
                    }

                    Task {
                        _ = await viewModel.deleteService(
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
            Text(s("admin.services.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.services.manage_subtitle"))
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

                TextField(s("admin.services.search_placeholder"), text: $viewModel.searchText)
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

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AdminServicesStatusFilter.allCases) { filter in
                        statusFilterChip(filter)
                    }
                }
                .padding(.horizontal, 1)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    @ViewBuilder
    private func statusFilterChip(_ filter: AdminServicesStatusFilter) -> some View {
        let isSelected = viewModel.statusFilter == filter

        Button {
            viewModel.statusFilter = filter
        } label: {
            Text(s(filter.titleKey))
                .font(TrustoraTypography.control)
                .foregroundStyle(isSelected ? Color(hex: 0x052E16) : TrustoraTheme.secondaryText)
                .lineLimit(1)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? TrustoraTheme.accent.opacity(0.28) : TrustoraTheme.surface)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? TrustoraTheme.accent : TrustoraTheme.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private var servicesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "square.grid.2x2.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.services.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.services.list_description", ["count": "\(filteredServices.count)"]))
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
            } else if filteredServices.isEmpty {
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
                    ForEach(filteredServices) { service in
                        serviceRow(service)
                            .onAppear {
                                if service.id == filteredServices.last?.id {
                                    Task {
                                        await loadMoreServicesIfNeeded()
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
                    await reloadServices(includeMetadata: true)
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
            Image(systemName: "square.grid.2x2")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.services.no_services_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.services.no_services_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func serviceRow(_ service: AdminServiceSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(service.name)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                            .lineLimit(2)

                        if service.isFeatured {
                            labelBadge(
                                text: s("admin.services.recommended"),
                                textColor: Color(hex: 0x92400E),
                                fill: Color(hex: 0xFEF3C7),
                                border: Color(hex: 0xFDE68A)
                            )
                        }
                    }

                    Text(service.description)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                serviceActionsMenu(for: service)
            }

            HStack(spacing: 6) {
                Text("\(s("admin.services.slug_prefix"))\(service.slug)")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineLimit(1)

                Circle()
                    .fill(TrustoraTheme.border)
                    .frame(width: 4, height: 4)

                Text("\(s("admin.services.category_prefix"))\(service.categoryName)")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                statusBadge(for: service.status)

                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Color(hex: 0xEAB308))
                    Text(String(format: "%.2f", service.rating))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                }

                Text(sf("admin.services.reviews", ["count": "\(service.reviewCount)"]))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                Text(sf("admin.services.orders", ["count": "\(service.orderCount)"]))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                Text(sf("admin.services.views", ["count": "\(service.viewCount)"]))
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

    private func statusBadge(for status: String) -> some View {
        let normalized = status.uppercased()
        let translatedStatus: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "ACTIVE", "APPROVED":
            translatedStatus = "ACTIVE"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "SUSPENDED":
            translatedStatus = "SUSPENDED"
            style = (Color(hex: 0x991B1B), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        default:
            translatedStatus = "DRAFT"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
        }

        return labelBadge(
            text: s("admin.services.statuses.\(translatedStatus)"),
            textColor: style.text,
            fill: style.fill,
            border: style.border
        )
    }

    private func labelBadge(
        text: String,
        textColor: Color,
        fill: Color,
        border: Color
    ) -> some View {
        Text(text)
            .font(TrustoraTypography.caption)
            .foregroundStyle(textColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(fill)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(border, lineWidth: 1)
            )
    }

    private func serviceActionsMenu(for service: AdminServiceSummary) -> some View {
        Menu {
            Button {
                Task {
                    await runServiceAction(.view, service: service)
                }
            } label: {
                Label(s("admin.services.view_details"), systemImage: "eye")
            }

            Button {
                Task {
                    await openEditEditor(for: service)
                }
            } label: {
                Label(s("admin.services.edit"), systemImage: "pencil")
            }

            Button {
                Task {
                    await runServiceAction(.approve, service: service)
                }
            } label: {
                Label(s("admin.services.approve"), systemImage: "checkmark.seal")
            }

            Button {
                Task {
                    await runServiceAction(.feature, service: service)
                }
            } label: {
                Label(
                    service.isFeatured ? s("admin.services.unfeature") : s("admin.services.feature"),
                    systemImage: "star"
                )
            }

            Button {
                Task {
                    await runServiceAction(.suspend, service: service)
                }
            } label: {
                Label(s("admin.services.suspend"), systemImage: "nosign")
            }

            Button(role: .destructive) {
                deleteCandidate = service
            } label: {
                Label(s("admin.services.delete"), systemImage: "trash")
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

    private func runServiceAction(_ action: AdminServiceStatusAction, service: AdminServiceSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        _ = await viewModel.performStatusAction(
            action,
            service: service,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func openCreateEditor() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.loadFormMetadata(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        viewModel.actionErrorMessage = nil
        editorMode = .create
        editorDraft = AdminServiceEditorDraft()
        isEditorPresented = true
    }

    private func openEditEditor(for service: AdminServiceSummary) async {
        guard let token = authSession.accessToken else {
            return
        }

        isPreparingEdit = true

        await viewModel.loadFormMetadata(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )

        if let detail = await viewModel.loadServiceDetail(
            serviceID: service.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) {
            var draft = AdminServiceEditorDraft()
            draft.apply(detail)
            editorDraft = draft
            editorMode = .edit(serviceID: service.id)
            isEditorPresented = true
        }

        isPreparingEdit = false
    }

    private func reloadServices(includeMetadata: Bool) async {
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

    private func loadMoreServicesIfNeeded() async {
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

private struct TrustoraAdminServiceFormSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: AdminServiceEditorMode
    let strings: (String) -> String
    let categories: [AdminServiceCategoryOption]
    let deliveryProviders: [AdminDeliveryProviderOption]
    let isSubmitting: Bool
    let errorMessage: String?
    let onLoadCategorySlug: (_ categoryID: String) async -> String?
    let onSubmit: (_ draft: AdminServiceEditorDraft, _ mode: AdminServiceEditorMode) async -> Bool

    @State private var draft: AdminServiceEditorDraft
    @State private var newSkill = ""
    @State private var newTag = ""
    @State private var hasManualSlug = false
    @State private var isApplyingAutoSlug = false

    init(
        mode: AdminServiceEditorMode,
        strings: @escaping (String) -> String,
        initialDraft: AdminServiceEditorDraft,
        categories: [AdminServiceCategoryOption],
        deliveryProviders: [AdminDeliveryProviderOption],
        isSubmitting: Bool,
        errorMessage: String?,
        onLoadCategorySlug: @escaping (_ categoryID: String) async -> String?,
        onSubmit: @escaping (_ draft: AdminServiceEditorDraft, _ mode: AdminServiceEditorMode) async -> Bool
    ) {
        self.mode = mode
        self.strings = strings
        self.categories = categories
        self.deliveryProviders = deliveryProviders
        self.isSubmitting = isSubmitting
        self.errorMessage = errorMessage
        self.onLoadCategorySlug = onLoadCategorySlug
        self.onSubmit = onSubmit
        _draft = State(initialValue: initialDraft)
        _hasManualSlug = State(initialValue: mode.isEdit || !initialDraft.slug.isEmpty)
    }

    private var canSubmit: Bool {
        draft.isCreateValid && !isSubmitting
    }

    private var orderedCategoryOptions: [CategoryDisplayOption] {
        let nonEmptyCategories = categories.filter { !$0.id.isEmpty && !$0.name.isEmpty }
        guard !nonEmptyCategories.isEmpty else {
            return []
        }

        let normalizedParents = nonEmptyCategories.reduce(into: [String: [AdminServiceCategoryOption]]()) { partial, category in
            let key = parentKey(category.parentID)
            partial[key, default: []].append(category)
        }

        let allIDs = Set(nonEmptyCategories.map(\.id))
        let rootCandidates = nonEmptyCategories.filter { option in
            let parentID = option.parentID?.trimmingCharacters(in: .whitespacesAndNewlines)
            guard let parentID, !parentID.isEmpty, parentID != "0" else {
                return true
            }
            return !allIDs.contains(parentID)
        }

        var result: [CategoryDisplayOption] = []
        var seen = Set<String>()

        func walk(option: AdminServiceCategoryOption, level: Int) {
            guard seen.insert(option.id).inserted else {
                return
            }

            result.append(
                CategoryDisplayOption(
                    id: option.id,
                    name: option.name,
                    level: max(0, level)
                )
            )

            let children = (normalizedParents[option.id] ?? [])
                .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }

            for child in children {
                walk(option: child, level: level + 1)
            }
        }

        let sortedRoots = rootCandidates.sorted {
            $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
        }

        for root in sortedRoots {
            walk(option: root, level: 0)
        }

        if result.count < nonEmptyCategories.count {
            for category in nonEmptyCategories where !seen.contains(category.id) {
                walk(option: category, level: 0)
            }
        }

        return result
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

                    fieldSection(title: s("admin.services.info_title"), subtitle: s("admin.services.info_description")) {
                        field(label: s("admin.services.title_label")) {
                            TextField(s("admin.services.title_placeholder"), text: $draft.name)
                                .textInputAutocapitalization(.sentences)
                                .autocorrectionDisabled()
                                .onChange(of: draft.name) { _, newValue in
                                    if !hasManualSlug || draft.slug.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                        isApplyingAutoSlug = true
                                        draft.slug = generateSlug(newValue)
                                        isApplyingAutoSlug = false
                                    }
                                }
                        }

                        field(label: s("admin.services.slug_label")) {
                            TextField(s("admin.services.slug_placeholder"), text: $draft.slug)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .onChange(of: draft.slug) { _, _ in
                                    if !isApplyingAutoSlug {
                                        hasManualSlug = true
                                    }
                                }
                        }

                        if let categorySlug = draft.categorySlug,
                           !categorySlug.isEmpty {
                            Text("\(categorySlug)/\(draft.slug)")
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                        }

                        Text(s("admin.services.slug_help"))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)

                        field(label: s("admin.services.description_label")) {
                            multilineField(
                                placeholder: s("admin.services.description_placeholder"),
                                text: $draft.description,
                                minHeight: 110
                            )
                        }

                        field(label: s("admin.services.requirements_label")) {
                            multilineField(
                                placeholder: s("admin.services.requirements_placeholder"),
                                text: $draft.requirements,
                                minHeight: 100
                            )
                        }

                        field(label: s("admin.services.category_label")) {
                            if orderedCategoryOptions.isEmpty {
                                Text(s("admin.services.category_placeholder"))
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                Picker("", selection: $draft.categoryID) {
                                    Text(s("admin.services.category_placeholder")).tag("")
                                    ForEach(orderedCategoryOptions) { option in
                                        Text(option.displayName).tag(option.id)
                                    }
                                }
                                .pickerStyle(.menu)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        field(label: "Delivery Provider") {
                            if deliveryProviders.isEmpty {
                                Text("Select delivery provider")
                                    .font(TrustoraTypography.body)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                Picker("", selection: $draft.deliveryProvider) {
                                    Text("Select delivery provider").tag("")
                                    ForEach(deliveryProviders) { option in
                                        Text(option.label).tag(option.value)
                                    }
                                }
                                .pickerStyle(.menu)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        if mode.isEdit {
                            field(label: s("admin.services.edit_service.status_label")) {
                                Picker("", selection: $draft.status) {
                                    Text(s("admin.services.statuses.DRAFT")).tag("DRAFT")
                                    Text(s("admin.services.statuses.ACTIVE")).tag("ACTIVE")
                                    Text(s("admin.services.statuses.SUSPENDED")).tag("SUSPENDED")
                                }
                                .pickerStyle(.segmented)
                            }
                        }
                    }

                    fieldSection(title: s("admin.services.skills_tags_title"), subtitle: s("admin.services.skills_tags_description")) {
                        tagInputRow(
                            label: s("admin.services.skills_label"),
                            placeholder: s("admin.services.skills_placeholder"),
                            text: $newSkill,
                            values: draft.skills,
                            onAdd: addSkill,
                            onRemove: removeSkill
                        )

                        tagInputRow(
                            label: s("admin.services.tags_label"),
                            placeholder: s("admin.services.tags_placeholder"),
                            text: $newTag,
                            values: draft.tags,
                            onAdd: addTag,
                            onRemove: removeTag
                        )
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(mode.isEdit ? s("admin.services.pricing_note_title_edit") : s("admin.services.pricing_note_title"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.primaryText)

                        Text(mode.isEdit ? s("admin.services.pricing_note_description_edit") : s("admin.services.pricing_note_description"))
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .trustoraCardStyle(
                        cornerRadius: TrustoraMetrics.compactCardRadius,
                        background: Color(hex: 0xF8FAFC)
                    )
                }
                .padding(TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, 10)
                .padding(.bottom, 24)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("admin.services.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(mode.isEdit ? s("admin.services.edit_service.title") : s("admin.services.new_service.title"))
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
                            Text(mode.isEdit ? s("admin.services.save_changes") : s("admin.services.create_service"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.primary)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!canSubmit)
                }
            }
            .onChange(of: draft.categoryID) { _, newValue in
                let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else {
                    draft.categorySlug = nil
                    return
                }

                Task {
                    let slug = await onLoadCategorySlug(trimmed)
                    await MainActor.run {
                        draft.categorySlug = slug
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

    private func tagInputRow(
        label: String,
        placeholder: String,
        text: Binding<String>,
        values: [String],
        onAdd: @escaping () -> Void,
        onRemove: @escaping (String) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            HStack(spacing: 8) {
                TextField(placeholder, text: text)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.primaryText)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .trustoraCardStyle(
                        cornerRadius: TrustoraMetrics.compactCardRadius,
                        background: TrustoraTheme.surface
                    )

                Button {
                    onAdd()
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(TrustoraTheme.primary)
                        .frame(width: 38, height: 38)
                        .background(TrustoraTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(TrustoraTheme.border, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
            }

            if !values.isEmpty {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 8)], spacing: 8) {
                    ForEach(values, id: \.self) { value in
                        HStack(spacing: 6) {
                            Text(value)
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.primaryText)
                                .lineLimit(1)

                            Button {
                                onRemove(value)
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(hex: 0xF1F5F9))
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                        )
                    }
                }
            }
        }
    }

    private func addSkill() {
        let trimmed = newSkill.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return
        }
        if !draft.skills.contains(where: { $0.caseInsensitiveCompare(trimmed) == .orderedSame }) {
            draft.skills.append(trimmed)
        }
        newSkill = ""
    }

    private func removeSkill(_ skill: String) {
        draft.skills.removeAll { $0 == skill }
    }

    private func addTag() {
        let trimmed = newTag.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return
        }
        if !draft.tags.contains(where: { $0.caseInsensitiveCompare(trimmed) == .orderedSame }) {
            draft.tags.append(trimmed)
        }
        newTag = ""
    }

    private func removeTag(_ tag: String) {
        draft.tags.removeAll { $0 == tag }
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

    private func parentKey(_ parentID: String?) -> String {
        guard let parentID = parentID?.trimmingCharacters(in: .whitespacesAndNewlines),
              !parentID.isEmpty,
              parentID != "0" else {
            return ""
        }
        return parentID
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

private struct CategoryDisplayOption: Identifiable {
    let id: String
    let name: String
    let level: Int

    var displayName: String {
        if level <= 0 {
            return name
        }
        return "\(String(repeating: "--", count: level)) \(name)"
    }
}

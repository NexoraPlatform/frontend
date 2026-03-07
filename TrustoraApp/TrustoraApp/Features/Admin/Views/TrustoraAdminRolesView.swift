import SwiftUI

struct TrustoraAdminRolesView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminRolesViewModel()

    @State private var isEditorPresented = false
    @State private var editorDraft = AdminRoleEditorDraft()
    @State private var editorMode: AdminRoleEditorMode = .create
    @State private var deleteCandidate: AdminRoleSummary?
    @State private var isPreparingEditor = false

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
            viewModel.selectedTab.rawValue,
            String(viewModel.page),
            String(viewModel.pageSize),
            viewModel.appliedSearch,
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
                            tabsCard

                            if viewModel.selectedTab == .roles {
                                rolesCard
                            } else {
                                permissionsMatrixCard
                            }
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadCurrentTab(force: true)
                    }
                }

                if isPreparingEditor {
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
                    Text(s("admin.roles.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                if canAccessAdmin && viewModel.selectedTab == .roles {
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
                        .accessibilityLabel(s("admin.roles.add_role"))
                    }
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadCurrentTab(force: false)
            }
            .sheet(isPresented: $isEditorPresented) {
                TrustoraAdminRoleFormSheet(
                    mode: editorMode,
                    strings: strings,
                    draft: editorDraft,
                    permissionGroups: viewModel.permissionGroups,
                    isSubmitting: viewModel.isSubmitting,
                    errorMessage: viewModel.actionErrorMessage,
                    onSubmit: { mode, draft in
                        guard let token = authSession.accessToken else {
                            return false
                        }

                        switch mode {
                        case .create:
                            return await viewModel.createRole(
                                draft: draft,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        case .edit:
                            return await viewModel.updateRole(
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
                s("admin.roles.confirm_delete"),
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

                Button(s("admin.roles.delete"), role: .destructive) {
                    guard let candidate = deleteCandidate,
                          let token = authSession.accessToken else {
                        return
                    }

                    Task {
                        _ = await viewModel.deleteRole(
                            roleID: candidate.id,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
                    deleteCandidate = nil
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
            Text("Trustora Admin")
                .font(TrustoraTypography.label)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(
                viewModel.selectedTab == .roles
                    ? s("admin.roles.manage_title")
                    : s("admin.roles.permission_matrix.title")
            )
            .font(TrustoraTypography.sectionTitle)
            .foregroundStyle(primary)

            Text(
                viewModel.selectedTab == .roles
                    ? s("admin.roles.manage_subtitle")
                    : s("admin.roles.permission_matrix.subtitle")
            )
            .font(TrustoraTypography.body)
            .foregroundStyle(TrustoraTheme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var tabsCard: some View {
        HStack(spacing: 8) {
            ForEach(AdminRolesTab.allCases) { tab in
                let selected = viewModel.selectedTab == tab
                Button {
                    guard viewModel.selectedTab != tab else { return }
                    viewModel.selectedTab = tab
                } label: {
                    Text(s(tab.titleKey))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(selected ? Color(hex: 0x052E16) : TrustoraTheme.secondaryText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .frame(maxWidth: .infinity)
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
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var rolesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "person.crop.rectangle.stack.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.roles.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            let count = viewModel.total
            Text(
                count == 1
                    ? s("admin.roles.list_description_one")
                    : sf("admin.roles.list_description_other", ["count": "\(count)"])
            )
            .font(TrustoraTypography.caption)
            .foregroundStyle(TrustoraTheme.tertiaryText)

            searchRow

            if let errorMessage = viewModel.errorMessage {
                retryCard(message: errorMessage)
            } else if viewModel.isLoadingRoles {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if viewModel.roles.isEmpty {
                emptyRolesState
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
                    ForEach(Array(viewModel.roles.enumerated()), id: \.element.id) { index, role in
                        roleRow(role: role, index: index)
                            .onAppear {
                                if role.id == viewModel.roles.last?.id,
                                   viewModel.canGoNext,
                                   !viewModel.isLoadingRoles {
                                    viewModel.goToNextPage()
                                }
                            }
                    }
                }

                if viewModel.isLoadingRoles && !viewModel.roles.isEmpty {
                    HStack {
                        Spacer()
                        ProgressView()
                            .tint(TrustoraTheme.accent)
                            .padding(.vertical, 10)
                        Spacer()
                    }
                }

                paginationRow
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var searchRow: some View {
        HStack(spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                TextField(s("admin.roles.search_placeholder"), text: $viewModel.searchText)
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

            Button(s("admin.roles.search_button")) {
                viewModel.applySearch()
            }
            .buttonStyle(.plain)
            .font(TrustoraTypography.control)
            .foregroundStyle(primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(TrustoraTheme.mutedSurface)
            .clipShape(RoundedRectangle(cornerRadius: TrustoraMetrics.compactCardRadius, style: .continuous))

            if !viewModel.appliedSearch.isEmpty {
                Button(s("common.clear")) {
                    viewModel.clearSearch()
                }
                .buttonStyle(.plain)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)
            }
        }
    }

    private func roleRow(role: AdminRoleSummary, index: Int) -> some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 5) {
                Text(role.name)
                    .font(TrustoraTypography.body)
                    .foregroundStyle(primary)

                Text("/\(role.slug)")
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                if !role.description.isEmpty {
                    Text(role.description)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                        .lineLimit(2)
                }

                HStack(spacing: 8) {
                    Text(sf("admin.roles.permissions_count", ["count": "\(role.permissionsCount)"]))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    if let sortOrder = role.sortOrder {
                        Text("#\(sortOrder)")
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                    }
                }
            }

            Spacer(minLength: 0)

            VStack(spacing: 8) {
                Button {
                    guard let token = authSession.accessToken else { return }
                    Task {
                        await viewModel.moveRole(
                            roleID: role.id,
                            direction: -1,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 11, weight: .bold))
                }
                .buttonStyle(.plain)
                .foregroundStyle(index == 0 ? TrustoraTheme.tertiaryText : primary)
                .disabled(index == 0 || viewModel.isSubmitting)

                Button {
                    guard let token = authSession.accessToken else { return }
                    Task {
                        await viewModel.moveRole(
                            roleID: role.id,
                            direction: 1,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
                } label: {
                    Image(systemName: "arrow.down")
                        .font(.system(size: 11, weight: .bold))
                }
                .buttonStyle(.plain)
                .foregroundStyle(index == viewModel.roles.count - 1 ? TrustoraTheme.tertiaryText : primary)
                .disabled(index == viewModel.roles.count - 1 || viewModel.isSubmitting)
            }
            .padding(.trailing, 2)

            VStack(spacing: 8) {
                Button {
                    Task {
                        await openEditEditor(role)
                    }
                } label: {
                    Image(systemName: "pencil")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(primary)
                        .frame(width: 30, height: 30)
                        .background(TrustoraTheme.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s("admin.roles.edit"))

                Button {
                    deleteCandidate = role
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(hex: 0xB91C1C))
                        .frame(width: 30, height: 30)
                        .background(Color(hex: 0xFEE2E2))
                        .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s("admin.roles.delete"))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private var paginationRow: some View {
        HStack {
            Text(
                sf(
                    "admin.roles.pagination.page_of",
                    ["page": "\(viewModel.page)", "last": "\(viewModel.lastPage)"]
                )
            )
            .font(TrustoraTypography.caption)
            .foregroundStyle(TrustoraTheme.tertiaryText)

            Spacer()

            Picker("", selection: Binding(
                get: { viewModel.pageSize },
                set: { viewModel.setPageSize($0) }
            )) {
                Text("5").tag(5)
                Text("10").tag(10)
                Text("20").tag(20)
                Text("50").tag(50)
            }
            .labelsHidden()
            .pickerStyle(.menu)
            .font(TrustoraTypography.caption)

            Text(s("admin.roles.pagination.per_page"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Button(s("admin.roles.pagination.previous")) {
                viewModel.goToPreviousPage()
            }
            .buttonStyle(.plain)
            .font(TrustoraTypography.control)
            .foregroundStyle(viewModel.canGoPrevious ? primary : TrustoraTheme.tertiaryText)

            Button(s("admin.roles.pagination.next")) {
                viewModel.goToNextPage()
            }
            .buttonStyle(.plain)
            .font(TrustoraTypography.control)
            .foregroundStyle(viewModel.canGoNext ? primary : TrustoraTheme.tertiaryText)
        }
    }

    private var permissionsMatrixCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.roles.permission_matrix.title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                TextField(s("admin.roles.permission_matrix.search_placeholder"), text: $viewModel.matrixFilter)
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

            if !viewModel.matrixSavingRoles.isEmpty {
                Text(s("admin.roles.permission_matrix.saving_changes"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            } else {
                Text(s("admin.roles.permission_matrix.saved_auto"))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            if let errorMessage = viewModel.errorMessage {
                retryCard(message: errorMessage)
            } else if viewModel.isLoadingMatrix {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if viewModel.filteredPermissionGroups.isEmpty || viewModel.matrixRoles.isEmpty {
                emptyPermissionsState
            } else {
                permissionsMatrixContent
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var permissionsMatrixContent: some View {
        ScrollView(.horizontal, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 10) {
                headerMatrixRow

                ForEach(viewModel.filteredPermissionGroups) { group in
                    groupCard(group)
                }
            }
            .padding(.horizontal, 1)
        }
    }

    private var headerMatrixRow: some View {
        HStack(spacing: 8) {
            Text(s("admin.roles.permission_matrix.permissions"))
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .frame(width: 220, alignment: .leading)

            ForEach(viewModel.matrixRoles) { role in
                let state = viewModel.roleColumnState(roleSlug: role.slug)
                Button {
                    guard let token = authSession.accessToken else { return }
                    viewModel.toggleRoleColumn(
                        role: role,
                        enabled: !state.all,
                        token: token,
                        language: resolvedLanguageCode,
                        currency: appCurrency
                    )
                } label: {
                    VStack(spacing: 4) {
                        Text(role.name)
                            .font(TrustoraTypography.caption)
                            .foregroundStyle(primary)
                            .lineLimit(1)
                        Image(systemName: checkboxSymbol(all: state.all, none: state.none, indeterminate: state.indeterminate))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(state.none ? TrustoraTheme.tertiaryText : primary)
                    }
                    .frame(width: 110)
                    .padding(.vertical, 6)
                    .background(TrustoraTheme.mutedSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func groupCard(_ group: AdminPermissionGroup) -> some View {
        let isExpanded = viewModel.matrixOpenGroups.contains(group.id)

        return VStack(alignment: .leading, spacing: 8) {
            Button {
                viewModel.toggleGroupExpanded(group.id)
            } label: {
                HStack {
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                    Text(group.name)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(primary)
                    Spacer()
                    Text("\(group.permissions.count)")
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
            }
            .buttonStyle(.plain)

            if isExpanded {
                HStack(spacing: 8) {
                    Spacer()
                        .frame(width: 220)
                    ForEach(viewModel.matrixRoles) { role in
                        let state = viewModel.groupRoleState(group: group, roleSlug: role.slug)
                        Button {
                            guard let token = authSession.accessToken else { return }
                            viewModel.toggleGroupForRole(
                                group: group,
                                role: role,
                                enabled: !state.all,
                                token: token,
                                language: resolvedLanguageCode,
                                currency: appCurrency
                            )
                        } label: {
                            Image(systemName: checkboxSymbol(all: state.all, none: state.none, indeterminate: state.indeterminate))
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(state.none ? TrustoraTheme.tertiaryText : primary)
                                .frame(width: 110)
                        }
                        .buttonStyle(.plain)
                    }
                }

                ForEach(group.permissions) { permission in
                    HStack(spacing: 8) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(permission.name)
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(primary)
                            Text(permission.slug)
                                .font(TrustoraTypography.caption)
                                .foregroundStyle(TrustoraTheme.tertiaryText)
                                .lineLimit(1)
                        }
                        .frame(width: 220, alignment: .leading)

                        ForEach(viewModel.matrixRoles) { role in
                            let enabled = viewModel.isPermissionEnabled(
                                roleSlug: role.slug,
                                permissionSlug: permission.slug
                            )
                            Button {
                                guard let token = authSession.accessToken else { return }
                                viewModel.togglePermission(
                                    role: role,
                                    permissionSlug: permission.slug,
                                    enabled: !enabled,
                                    token: token,
                                    language: resolvedLanguageCode,
                                    currency: appCurrency
                                )
                            } label: {
                                Image(systemName: enabled ? "checkmark.square.fill" : "square")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(enabled ? primary : TrustoraTheme.tertiaryText)
                                    .frame(width: 110)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .padding(10)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private var emptyRolesState: some View {
        VStack(spacing: 10) {
            Image(systemName: "person.crop.rectangle.stack.fill")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.roles.no_roles_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.roles.no_roles_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private var emptyPermissionsState: some View {
        VStack(spacing: 10) {
            Image(systemName: "shield")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.roles.permission_matrix.no_permissions"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func retryCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(TrustoraTypography.body)
                .foregroundStyle(Color(hex: 0xB91C1C))

            Button {
                Task {
                    await reloadCurrentTab(force: true)
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

    private func checkboxSymbol(all: Bool, none: Bool, indeterminate: Bool) -> String {
        if all { return "checkmark.square.fill" }
        if indeterminate { return "minus.square" }
        if none { return "square" }
        return "square"
    }

    private func reloadCurrentTab(force: Bool) async {
        guard let token = authSession.accessToken else {
            return
        }

        switch viewModel.selectedTab {
        case .roles:
            await viewModel.loadRoles(
                token: token,
                language: resolvedLanguageCode,
                currency: appCurrency
            )
        case .permissions:
            if force || viewModel.matrixRoles.isEmpty {
                await viewModel.loadPermissionMatrix(
                    token: token,
                    language: resolvedLanguageCode,
                    currency: appCurrency
                )
            }
        }
    }

    private func openCreateEditor() async {
        guard let token = authSession.accessToken else { return }
        isPreparingEditor = true
        defer { isPreparingEditor = false }

        guard let draft = await viewModel.loadRoleEditorDraft(
            roleID: nil,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) else {
            return
        }

        editorDraft = draft
        editorMode = .create
        isEditorPresented = true
    }

    private func openEditEditor(_ role: AdminRoleSummary) async {
        guard let token = authSession.accessToken else { return }
        isPreparingEditor = true
        defer { isPreparingEditor = false }

        guard let draft = await viewModel.loadRoleEditorDraft(
            roleID: role.id,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        ) else {
            return
        }

        editorDraft = draft
        editorMode = .edit
        isEditorPresented = true
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

private enum AdminRoleEditorMode {
    case create
    case edit
}

private struct TrustoraAdminRoleFormSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: AdminRoleEditorMode
    let strings: (String) -> String
    let draft: AdminRoleEditorDraft
    let permissionGroups: [AdminPermissionGroup]
    let isSubmitting: Bool
    let errorMessage: String?
    let onSubmit: (AdminRoleEditorMode, AdminRoleEditorDraft) async -> Bool

    @State private var localDraft: AdminRoleEditorDraft
    @State private var openGroups: Set<String> = []

    init(
        mode: AdminRoleEditorMode,
        strings: @escaping (String) -> String,
        draft: AdminRoleEditorDraft,
        permissionGroups: [AdminPermissionGroup],
        isSubmitting: Bool,
        errorMessage: String?,
        onSubmit: @escaping (AdminRoleEditorMode, AdminRoleEditorDraft) async -> Bool
    ) {
        self.mode = mode
        self.strings = strings
        self.draft = draft
        self.permissionGroups = permissionGroups
        self.isSubmitting = isSubmitting
        self.errorMessage = errorMessage
        self.onSubmit = onSubmit
        _localDraft = State(initialValue: draft)
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

                    VStack(alignment: .leading, spacing: 8) {
                        Text(s(mode == .create ? "admin.roles.new_role.name_label" : "admin.roles.edit_role.name_label"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                        TextField(
                            s(mode == .create ? "admin.roles.new_role.name_placeholder" : "admin.roles.edit_role.name_placeholder"),
                            text: $localDraft.name
                        )
                        .textInputAutocapitalization(.words)
                        .autocorrectionDisabled()
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(s(mode == .create ? "admin.roles.new_role.description_label" : "admin.roles.edit_role.description_label"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.secondaryText)
                        TextField(
                            s(mode == .create ? "admin.roles.new_role.description_placeholder" : "admin.roles.edit_role.description_placeholder"),
                            text: $localDraft.description,
                            axis: .vertical
                        )
                        .textInputAutocapitalization(.sentences)
                        .autocorrectionDisabled()
                        .lineLimit(2...6)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .trustoraCardStyle(
                            cornerRadius: TrustoraMetrics.compactCardRadius,
                            background: TrustoraTheme.mutedSurface
                        )
                    }

                    if mode == .edit {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(s("admin.roles.edit_role.sort_order_label"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.secondaryText)

                            HStack(spacing: 10) {
                                Button {
                                    localDraft.sortOrder -= 1
                                } label: {
                                    Image(systemName: "minus")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(TrustoraTheme.primary)
                                        .frame(width: 28, height: 28)
                                        .background(TrustoraTheme.mutedSurface)
                                        .clipShape(Circle())
                                }
                                .buttonStyle(.plain)

                                TextField(
                                    "0",
                                    text: Binding(
                                        get: { "\(localDraft.sortOrder)" },
                                        set: { newValue in
                                            if let value = Int(newValue) {
                                                localDraft.sortOrder = value
                                            }
                                        }
                                    )
                                )
                                .keyboardType(.numberPad)
                                .font(TrustoraTypography.body)
                                .foregroundStyle(TrustoraTheme.primary)
                                .frame(width: 90)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .trustoraCardStyle(
                                    cornerRadius: TrustoraMetrics.compactCardRadius,
                                    background: TrustoraTheme.mutedSurface
                                )

                                Button {
                                    localDraft.sortOrder += 1
                                } label: {
                                    Image(systemName: "plus")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(TrustoraTheme.primary)
                                        .frame(width: 28, height: 28)
                                        .background(TrustoraTheme.mutedSurface)
                                        .clipShape(Circle())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text(s("admin.roles.new_role.permissions_title"))
                            .font(TrustoraTypography.cardTitle)
                            .foregroundStyle(TrustoraTheme.primary)

                        ForEach(permissionGroups) { group in
                            permissionGroupCard(group)
                        }
                    }
                }
                .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, TrustoraMetrics.pageTopPadding)
                .padding(.bottom, TrustoraMetrics.pageBottomPadding)
            }
            .background(TrustoraTheme.background.ignoresSafeArea())
            .navigationTitle(s(mode == .create ? "admin.roles.new_role.title" : "admin.roles.edit_role.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s(mode == .create ? "admin.roles.new_role.cancel" : "admin.roles.edit_role.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            let success = await onSubmit(mode, localDraft)
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            if isSubmitting {
                                ProgressView()
                                    .tint(TrustoraTheme.primary)
                            }
                            Text(
                                s(
                                    mode == .create
                                        ? (isSubmitting ? "admin.roles.new_role.creating" : "admin.roles.new_role.create_button")
                                        : (isSubmitting ? "admin.roles.edit_role.editing" : "admin.roles.edit_role.edit_button")
                                )
                            )
                        }
                        .font(TrustoraTypography.control)
                        .foregroundStyle(localDraft.isValid ? TrustoraTheme.primary : TrustoraTheme.tertiaryText)
                    }
                    .buttonStyle(.plain)
                    .disabled(!localDraft.isValid || isSubmitting)
                }
            }
            .onAppear {
                openGroups = Set(permissionGroups.map(\.id))
            }
        }
    }

    private func permissionGroupCard(_ group: AdminPermissionGroup) -> some View {
        let isExpanded = openGroups.contains(group.id)

        return VStack(alignment: .leading, spacing: 8) {
            Button {
                if isExpanded {
                    openGroups.remove(group.id)
                } else {
                    openGroups.insert(group.id)
                }
            } label: {
                HStack {
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                    Text(group.name)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.primary)
                    Spacer()
                    Text("\(group.permissions.count)")
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                }
            }
            .buttonStyle(.plain)

            if isExpanded {
                ForEach(group.permissions) { permission in
                    let selected = localDraft.permissionIDs.contains(permission.id)
                    Button {
                        if selected {
                            localDraft.permissionIDs.remove(permission.id)
                        } else {
                            localDraft.permissionIDs.insert(permission.id)
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: selected ? "checkmark.square.fill" : "square")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(selected ? TrustoraTheme.primary : TrustoraTheme.tertiaryText)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(permission.name)
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.primary)
                                Text(permission.slug)
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.tertiaryText)
                                    .lineLimit(1)
                            }

                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.vertical, 2)
                }
            }
        }
        .padding(10)
        .trustoraCardStyle(
            cornerRadius: TrustoraMetrics.compactCardRadius,
            background: TrustoraTheme.surface
        )
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

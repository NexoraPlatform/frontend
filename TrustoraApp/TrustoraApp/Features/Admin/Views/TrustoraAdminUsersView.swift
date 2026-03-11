import SwiftUI

struct TrustoraAdminUsersView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String
    var openCreateOnAppear = false

    @StateObject private var viewModel = TrustoraAdminUsersViewModel()

    @State private var isCreatePresented = false
    @State private var didHandleInitialCreate = false
    @State private var deleteCandidate: AdminUserListItem?
    @State private var featureNotice = false

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

    private var filteredUsers: [AdminUserListItem] {
        viewModel.filteredUsers
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
                            usersCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadUsers()
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
                    Text(s("admin.users.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }

                if canAccessAdmin {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            viewModel.actionErrorMessage = nil
                            isCreatePresented = true
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
                        .accessibilityLabel(s("admin.users.add_user"))
                    }
                }
            }
            .task(id: refreshKey) {
                if openCreateOnAppear && !didHandleInitialCreate {
                    didHandleInitialCreate = true
                    isCreatePresented = true
                }
                guard canAccessAdmin else { return }
                await reloadUsers()
            }
            .sheet(isPresented: $isCreatePresented) {
                TrustoraAdminCreateUserSheet(
                    strings: strings,
                    isSubmitting: viewModel.isSubmitting,
                    errorMessage: viewModel.actionErrorMessage,
                    onSubmit: { firstName, lastName, email, password, role, phone in
                        guard let token = authSession.accessToken else {
                            return false
                        }
                        return await viewModel.createUser(
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            password: password,
                            role: role,
                            phone: phone,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
                )
            }
            .alert(
                s("admin.users.actions.confirm_delete"),
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
                Button(s("admin.users.actions.delete"), role: .destructive) {
                    guard let deleteCandidate, let token = authSession.accessToken else {
                        return
                    }
                    Task {
                        _ = await viewModel.deleteUser(
                            deleteCandidate,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
                    self.deleteCandidate = nil
                }
            }
            .alert(s("admin.dashboard.notice.title"), isPresented: $featureNotice) {
                Button(s("common.ok")) {
                }
            } message: {
                Text(s("admin.dashboard.notice.body"))
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
            Text(s("admin.users.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.users.manage_subtitle"))
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

                TextField(s("admin.users.search_placeholder"), text: $viewModel.searchText)
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
                    ForEach(AdminUsersRoleFilter.allCases) { filter in
                        roleFilterChip(filter)
                    }
                }
                .padding(.horizontal, 1)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    @ViewBuilder
    private func roleFilterChip(_ filter: AdminUsersRoleFilter) -> some View {
        let isSelected = viewModel.roleFilter == filter

        Button {
            viewModel.roleFilter = filter
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

    private var usersCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "person.3.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.users.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.users.list_description", ["count": "\(filteredUsers.count)"]))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            if let errorMessage = viewModel.errorMessage {
                VStack(alignment: .leading, spacing: 8) {
                    Text(errorMessage)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(Color(hex: 0xB91C1C))

                    Button {
                        Task {
                            await reloadUsers()
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
            } else if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(TrustoraTheme.accent)
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else if filteredUsers.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    Text(s("admin.users.no_users_title"))
                        .font(TrustoraTypography.body)
                        .foregroundStyle(primary)

                    Text(s("admin.users.no_users_description"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(filteredUsers) { user in
                        userRow(user)
                            .onAppear {
                                if user.id == filteredUsers.last?.id {
                                    Task {
                                        await loadMoreUsersIfNeeded()
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

    private func userRow(_ user: AdminUserListItem) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                userAvatar(for: user)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(user.displayName)
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)
                        if user.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Color(hex: 0x16A34A))
                        }
                    }

                    Text(user.email)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)

                userActionsMenu(for: user)
            }

            HStack(spacing: 6) {
                roleBadge(for: user)
                statusBadge(for: user)
                if user.isSuperuser {
                    labelBadge(text: s("admin.users.roles.SUPERUSER"), textColor: Color(hex: 0x991B1B), fill: Color(hex: 0xFEE2E2), border: Color(hex: 0xFECACA))
                }
            }

            HStack(spacing: 10) {
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Color(hex: 0xEAB308))
                    Text(String(format: "%.2f", user.rating))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                }

                Text(sf("admin.users.reviews_label", ["count": "\(user.reviewCount)"]))
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)

                if let createdAt = user.createdAt {
                    Text(sf("admin.users.registered_prefix", ["date": formattedDate(createdAt)]))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)
                        .lineLimit(1)
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

    private func userAvatar(for user: AdminUserListItem) -> some View {
        Group {
            if let avatarURL = user.avatarURL,
               let url = URL(string: avatarURL),
               !avatarURL.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case let .success(image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackAvatar(for: user)
                    }
                }
            } else {
                fallbackAvatar(for: user)
            }
        }
        .frame(width: 44, height: 44)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(Color.white.opacity(0.9), lineWidth: 1)
        )
    }

    private func fallbackAvatar(for user: AdminUserListItem) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1BC47D), Color(hex: 0x0B1C2D)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(user.initials)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color.white)
        }
    }

    private func roleBadge(for user: AdminUserListItem) -> some View {
        let normalizedRole = user.role.uppercased()
        let key = "admin.users.roles.\(normalizedRole)"
        let style = roleStyle(for: normalizedRole)

        return labelBadge(
            text: s(key),
            textColor: style.text,
            fill: style.fill,
            border: style.border
        )
    }

    private func statusBadge(for user: AdminUserListItem) -> some View {
        let normalizedStatus = user.status.uppercased()
        let key = "admin.users.statuses.\(normalizedStatus)"
        let style = statusStyle(for: normalizedStatus)

        return labelBadge(
            text: s(key),
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

    private func userActionsMenu(for user: AdminUserListItem) -> some View {
        Menu {
            if user.id != "1", authSession.user?.isSuperuser == true {
                Button {
                    Task {
                        await toggleSuperuser(user)
                    }
                } label: {
                    Label(
                        user.isSuperuser
                        ? s("admin.users.actions.remove_superuser")
                        : s("admin.users.actions.set_superuser"),
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                }
            }

            Button {
                featureNotice = true
            } label: {
                Label(s("admin.users.actions.modify_profile"), systemImage: "pencil")
            }

            if user.hasRole("PROVIDER") && (user.profileURL?.isEmpty == false) {
                Button {
                    featureNotice = true
                } label: {
                    Label(s("admin.users.actions.view_profile"), systemImage: "eye")
                }
            }

            Button {
                Task {
                    await runStatusAction(.verify, user: user)
                }
            } label: {
                Label(s("admin.users.actions.verify"), systemImage: "checkmark.seal")
            }

            if user.status == "ACTIVE" {
                Button {
                    Task {
                        await runStatusAction(.suspend, user: user)
                    }
                } label: {
                    Label(s("admin.users.actions.suspend"), systemImage: "nosign")
                }
            } else {
                Button {
                    Task {
                        await runStatusAction(.activate, user: user)
                    }
                } label: {
                    Label(s("admin.users.actions.activate"), systemImage: "checkmark")
                }
            }

            Button(role: .destructive) {
                deleteCandidate = user
            } label: {
                Label(s("admin.users.actions.delete"), systemImage: "trash")
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

    private func runStatusAction(_ action: AdminUserStatusAction, user: AdminUserListItem) async {
        guard let token = authSession.accessToken else {
            return
        }
        _ = await viewModel.performStatusAction(
            action,
            user: user,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func toggleSuperuser(_ user: AdminUserListItem) async {
        guard let token = authSession.accessToken else {
            return
        }
        _ = await viewModel.toggleSuperuser(
            user,
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func reloadUsers() async {
        guard let token = authSession.accessToken else {
            return
        }
        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreUsersIfNeeded() async {
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

    private func roleStyle(for role: String) -> (text: Color, fill: Color, border: Color) {
        switch role {
        case "ADMIN":
            return (Color(hex: 0x6B21A8), Color(hex: 0xF3E8FF), Color(hex: 0xE9D5FF))
        case "PROVIDER":
            return (Color(hex: 0x1D4ED8), Color(hex: 0xDBEAFE), Color(hex: 0xBFDBFE))
        default:
            return (Color(hex: 0x334155), Color(hex: 0xF1F5F9), Color(hex: 0xE2E8F0))
        }
    }

    private func statusStyle(for status: String) -> (text: Color, fill: Color, border: Color) {
        switch status {
        case "ACTIVE":
            return (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "SUSPENDED":
            return (Color(hex: 0x991B1B), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        default:
            return (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
        }
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: resolvedLanguageCode == "ro" ? "ro-RO" : "en-US")
        formatter.dateStyle = .medium
        return formatter.string(from: date)
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

private struct TrustoraAdminCreateUserSheet: View {
    @Environment(\.dismiss) private var dismiss

    let strings: (String) -> String
    let isSubmitting: Bool
    let errorMessage: String?
    let onSubmit: (_ firstName: String, _ lastName: String, _ email: String, _ password: String, _ role: String, _ phone: String?) async -> Bool

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var role = "CLIENT"
    @State private var phone = ""

    private var canSubmit: Bool {
        !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.isEmpty &&
        password.count >= 6
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

                    twoColumnFields(
                        leftLabel: s("admin.users.new.first_name_label"),
                        leftText: $firstName,
                        leftKeyboard: .default,
                        rightLabel: s("admin.users.new.last_name_label"),
                        rightText: $lastName,
                        rightKeyboard: .default
                    )

                    singleField(
                        label: s("admin.users.new.email_label"),
                        text: $email,
                        keyboard: .emailAddress
                    )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                    singleField(
                        label: s("admin.users.new.password_label"),
                        text: $password,
                        keyboard: .default,
                        isSecure: true
                    )

                    Text(s("admin.users.new.password_hint"))
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.tertiaryText)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(s("admin.users.new.role_label"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.secondaryText)

                        Picker("", selection: $role) {
                            Text(s("admin.users.new.roles.CLIENT")).tag("CLIENT")
                            Text(s("admin.users.new.roles.PROVIDER")).tag("PROVIDER")
                            Text(s("admin.users.new.roles.ADMIN")).tag("ADMIN")
                        }
                        .pickerStyle(.segmented)
                    }

                    singleField(
                        label: s("admin.users.new.phone_label"),
                        text: $phone,
                        keyboard: .phonePad
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
                    Button(s("admin.users.new.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text(s("admin.users.new.title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            let success = await onSubmit(
                                firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                                lastName.trimmingCharacters(in: .whitespacesAndNewlines),
                                email.trimmingCharacters(in: .whitespacesAndNewlines),
                                password,
                                role,
                                phone.trimmingCharacters(in: .whitespacesAndNewlines)
                            )
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                                .tint(TrustoraTheme.primary)
                        } else {
                            Text(s("admin.users.new.create_user"))
                                .font(TrustoraTypography.control)
                                .foregroundStyle(TrustoraTheme.primary)
                        }
                    }
                    .buttonStyle(.plain)
                    .disabled(!canSubmit || isSubmitting)
                }
            }
        }
    }

    private func twoColumnFields(
        leftLabel: String,
        leftText: Binding<String>,
        leftKeyboard: UIKeyboardType,
        rightLabel: String,
        rightText: Binding<String>,
        rightKeyboard: UIKeyboardType
    ) -> some View {
        HStack(spacing: 10) {
            singleField(label: leftLabel, text: leftText, keyboard: leftKeyboard)
            singleField(label: rightLabel, text: rightText, keyboard: rightKeyboard)
        }
    }

    private func singleField(
        label: String,
        text: Binding<String>,
        keyboard: UIKeyboardType,
        isSecure: Bool = false
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)

            Group {
                if isSecure {
                    SecureField("", text: text)
                        .textContentType(.password)
                } else {
                    TextField("", text: text)
                        .textContentType(.none)
                }
            }
            .keyboardType(keyboard)
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

    private func s(_ key: String) -> String {
        strings(key)
    }
}

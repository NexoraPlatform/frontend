import SwiftUI

struct TrustoraAdminProjectsView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var authSession: AuthSessionStore
    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String
    let strings: (String) -> String

    @StateObject private var viewModel = TrustoraAdminProjectsViewModel()
    @State private var selectedOrder: AdminOrderSummary?

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
                            ordersCard
                        }
                        .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                        .padding(.top, TrustoraMetrics.pageTopPadding)
                        .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                    }
                    .scrollIndicators(.hidden)
                    .refreshable {
                        await reloadOrders()
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
                    Text(s("admin.orders.manage_title"))
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(primary)
                }
            }
            .task(id: refreshKey) {
                guard canAccessAdmin else { return }
                await reloadOrders()
            }
            .sheet(item: $selectedOrder) { order in
                TrustoraAdminOrderDetailSheet(
                    initialOrder: order,
                    strings: strings,
                    languageCode: resolvedLanguageCode,
                    defaultCurrency: appCurrency,
                    loadOrder: { orderID in
                        guard let token = authSession.accessToken else {
                            return nil
                        }
                        return await viewModel.loadOrderDetail(
                            orderID: orderID,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    },
                    saveOrder: { orderID, status, notes in
                        guard let token = authSession.accessToken else {
                            return nil
                        }
                        return await viewModel.updateOrder(
                            orderID: orderID,
                            status: status,
                            adminNotes: notes,
                            token: token,
                            language: resolvedLanguageCode,
                            currency: appCurrency
                        )
                    }
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

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(s("admin.orders.manage_title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(primary)

            Text(s("admin.orders.manage_subtitle"))
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

                TextField(s("admin.orders.search_placeholder"), text: $viewModel.searchText)
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
                    ForEach(AdminProjectsStatusFilter.allCases) { filter in
                        filterChip(filter)
                    }
                }
                .padding(.horizontal, 1)
            }
        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    @ViewBuilder
    private func filterChip(_ filter: AdminProjectsStatusFilter) -> some View {
        let selected = viewModel.statusFilter == filter

        Button {
            viewModel.statusFilter = filter
        } label: {
            Text(s(filter.titleKey))
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

    private var ordersCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
                Text(s("admin.orders.list_title"))
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(primary)
            }

            Text(sf("admin.orders.list_description", ["count": "\(viewModel.filteredOrders.count)"]))
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
            } else if viewModel.filteredOrders.isEmpty {
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
                    ForEach(viewModel.filteredOrders) { order in
                        orderRow(order)
                            .onAppear {
                                if order.id == viewModel.filteredOrders.last?.id {
                                    Task {
                                        await loadMoreOrdersIfNeeded()
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
                    await reloadOrders()
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
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(TrustoraTheme.tertiaryText)

            Text(s("admin.orders.no_orders_title"))
                .font(TrustoraTypography.body)
                .foregroundStyle(primary)

            Text(s("admin.orders.no_orders_description"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    private func orderRow(_ order: AdminOrderSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text("#\(order.orderNumber)")
                            .font(TrustoraTypography.body)
                            .foregroundStyle(primary)

                        statusBadge(order.status)
                        paymentStatusBadge(order.paymentStatus)
                    }

                    Text(order.service?.title ?? "-")
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(Color(hex: 0x0369A1))
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                Menu {
                    Button {
                        selectedOrder = order
                    } label: {
                        Label(s("admin.orders.view_details"), systemImage: "eye")
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

            HStack(spacing: 12) {
                participantMiniCard(
                    title: s("admin.orders.client_label"),
                    participant: order.client
                )

                participantMiniCard(
                    title: s("admin.orders.provider_label"),
                    participant: order.provider
                )
            }

            HStack(spacing: 8) {
                statPill(icon: "dollarsign.circle", text: priceText(amount: order.amount, currency: order.currency))

                if let createdAt = order.createdAt {
                    statPill(icon: "calendar", text: displayDate(createdAt))
                }

                if let dueDate = order.deliveryDate {
                    statPill(icon: "calendar.badge.clock", text: "\(s("admin.orders.due_prefix")) \(displayDate(dueDate))")
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

    private func participantMiniCard(title: String, participant: AdminOrderParticipantSummary?) -> some View {
        HStack(spacing: 8) {
            participantAvatar(participant)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                Text(participant?.fullName ?? "-")
                    .font(TrustoraTypography.control)
                    .foregroundStyle(primary)
                    .lineLimit(1)
            }
        }
    }

    private func participantAvatar(_ participant: AdminOrderParticipantSummary?) -> some View {
        Group {
            if let avatarURL = participant?.avatarURL,
               let url = URL(string: avatarURL),
               !avatarURL.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case let .success(image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackParticipantAvatar(participant)
                    }
                }
            } else {
                fallbackParticipantAvatar(participant)
            }
        }
        .frame(width: 34, height: 34)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(Color.white.opacity(0.9), lineWidth: 1)
        )
    }

    private func fallbackParticipantAvatar(_ participant: AdminOrderParticipantSummary?) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1BC47D), Color(hex: 0x0B1C2D)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(participant?.initials ?? "U")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Color.white)
        }
    }

    private func statusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let key: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "COMPLETED", "DELIVERED":
            key = normalized == "DELIVERED" ? "admin.orders.statuses.delivered" : "admin.orders.statuses.completed"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "IN_PROGRESS", "ACCEPTED":
            key = normalized == "ACCEPTED" ? "admin.orders.statuses.accepted" : "admin.orders.statuses.in_progress"
            style = (Color(hex: 0x075985), Color(hex: 0xE0F2FE), Color(hex: 0xBAE6FD))
        case "CANCELLED":
            key = "admin.orders.statuses.cancelled"
            style = (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        case "DISPUTED":
            key = "admin.orders.statuses.disputed"
            style = (Color(hex: 0x6D28D9), Color(hex: 0xEDE9FE), Color(hex: 0xDDD6FE))
        default:
            key = "admin.orders.statuses.pending"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
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

    private func paymentStatusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let key: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "PAID":
            key = "admin.orders.payment_statuses.paid"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "FAILED":
            key = "admin.orders.payment_statuses.failed"
            style = (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        case "REFUNDED":
            key = "admin.orders.payment_statuses.refunded"
            style = (Color(hex: 0x334155), Color(hex: 0xE2E8F0), Color(hex: 0xCBD5E1))
        default:
            key = "admin.orders.payment_statuses.pending"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
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
                .lineLimit(1)
        }
    }

    private func priceText(amount: Double, currency: String) -> String {
        let localeIdentifier = resolvedLanguageCode == "ro" ? "ro-RO" : "en-US"
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: localeIdentifier)
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased().isEmpty ? defaultCurrencyCode : currency.uppercased()
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2

        return formatter.string(from: NSNumber(value: amount)) ?? "\(Int(amount)) \(currency)"
    }

    private var defaultCurrencyCode: String {
        if appCurrency == .defaultCurrency {
            return "USD"
        }
        return appCurrency.rawValue
    }

    private func displayDate(_ date: Date) -> String {
        let localeIdentifier = resolvedLanguageCode == "ro" ? "ro-RO" : "en-US"
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: localeIdentifier)
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }

    private func reloadOrders() async {
        guard let token = authSession.accessToken else {
            return
        }

        await viewModel.load(
            token: token,
            language: resolvedLanguageCode,
            currency: appCurrency
        )
    }

    private func loadMoreOrdersIfNeeded() async {
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

private struct TrustoraAdminOrderDetailSheet: View {
    @Environment(\.dismiss) private var dismiss

    let strings: (String) -> String
    let languageCode: String
    let defaultCurrency: AppCurrency
    let loadOrder: (String) async -> AdminOrderSummary?
    let saveOrder: (String, String, String?) async -> AdminOrderSummary?

    @State private var order: AdminOrderSummary
    @State private var selectedStatus: String
    @State private var adminNotes: String
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        initialOrder: AdminOrderSummary,
        strings: @escaping (String) -> String,
        languageCode: String,
        defaultCurrency: AppCurrency,
        loadOrder: @escaping (String) async -> AdminOrderSummary?,
        saveOrder: @escaping (String, String, String?) async -> AdminOrderSummary?
    ) {
        self.strings = strings
        self.languageCode = languageCode
        self.defaultCurrency = defaultCurrency
        self.loadOrder = loadOrder
        self.saveOrder = saveOrder
        _order = State(initialValue: initialOrder)
        _selectedStatus = State(initialValue: initialOrder.status)
        _adminNotes = State(initialValue: initialOrder.adminNotes)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                TrustoraTheme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: TrustoraMetrics.sectionSpacing) {
                        headerCard

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

                        detailsCard
                        participantsCard
                        financialCard
                        timelineCard
                        adminActionsCard
                    }
                    .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                    .padding(.top, 16)
                    .padding(.bottom, TrustoraMetrics.pageBottomPadding)
                }
                .scrollIndicators(.hidden)

                if isLoading || isSaving {
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
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(s("common.cancel")) {
                        dismiss()
                    }
                    .buttonStyle(.plain)
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.primary)
                }

                ToolbarItem(placement: .principal) {
                    Text("\(s("admin.orders.order_label")) #\(order.orderNumber)")
                        .font(TrustoraTypography.cardTitle)
                        .foregroundStyle(TrustoraTheme.primary)
                        .lineLimit(1)
                }
            }
            .task(id: order.id) {
                await refreshOrder()
            }
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(TrustoraTheme.primary)

                Text("\(s("admin.orders.order_label")) #\(order.orderNumber)")
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(TrustoraTheme.primary)
                    .lineLimit(1)
            }

            Text(s("admin.orders.detail_subtitle"))
                .font(TrustoraTypography.caption)
                .foregroundStyle(TrustoraTheme.tertiaryText)

            HStack(spacing: 6) {
                statusBadge(order.status)
                paymentStatusBadge(order.paymentStatus)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var detailsCard: some View {
        sectionCard(title: s("admin.orders.details_title"), icon: "doc.text") {
            VStack(alignment: .leading, spacing: 8) {
                if let service = order.service {
                    Text(service.title)
                        .font(TrustoraTypography.body)
                        .foregroundStyle(Color(hex: 0x0369A1))

                    Text("\(s("admin.orders.category_label")) \(service.categoryName)")
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                }

                if !order.requirements.isEmpty {
                    detailTextBlock(title: s("admin.orders.requirements_title"), value: order.requirements)
                }
                if !order.clientNotes.isEmpty {
                    detailTextBlock(title: s("admin.orders.client_notes_title"), value: order.clientNotes)
                }
                if !order.providerNotes.isEmpty {
                    detailTextBlock(title: s("admin.orders.provider_notes_title"), value: order.providerNotes)
                }

                if !order.deliverables.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(s("admin.orders.deliverables_title"))
                            .font(TrustoraTypography.control)
                            .foregroundStyle(TrustoraTheme.secondaryText)

                        ForEach(Array(order.deliverables.enumerated()), id: \.offset) { index, item in
                            HStack(alignment: .top, spacing: 6) {
                                Text("\(index + 1).")
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                Text(item)
                                    .font(TrustoraTypography.caption)
                                    .foregroundStyle(TrustoraTheme.secondaryText)
                                    .multilineTextAlignment(.leading)
                            }
                        }
                    }
                }
            }
        }
    }

    private var participantsCard: some View {
        sectionCard(title: s("admin.orders.participants_title"), icon: "person.2") {
            VStack(spacing: 10) {
                participantDetailCard(title: s("admin.orders.client_label"), participant: order.client)
                participantDetailCard(title: s("admin.orders.provider_label"), participant: order.provider)
            }
        }
    }

    private var financialCard: some View {
        let platformFee = order.amount * 0.05
        let providerReceives = max(0, order.amount - platformFee)

        return sectionCard(title: s("admin.orders.financial_title"), icon: "dollarsign.circle") {
            VStack(spacing: 8) {
                financialRow(label: s("admin.orders.order_value_label"), value: priceText(amount: order.amount, currency: order.currency), valueColor: Color(hex: 0x0369A1))
                financialRow(label: s("admin.orders.platform_fee_label"), value: priceText(amount: platformFee, currency: order.currency), valueColor: TrustoraTheme.secondaryText)
                financialRow(label: s("admin.orders.provider_receives_label"), value: priceText(amount: providerReceives, currency: order.currency), valueColor: Color(hex: 0x065F46))

                HStack(spacing: 8) {
                    Text(s("admin.orders.payment_status_label"))
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                    Spacer(minLength: 0)
                    paymentStatusBadge(order.paymentStatus)
                }
            }
        }
    }

    private var timelineCard: some View {
        sectionCard(title: s("admin.orders.timeline_title"), icon: "calendar") {
            VStack(spacing: 8) {
                if let createdAt = order.createdAt {
                    timelineRow(label: s("admin.orders.order_placed_label"), value: displayDate(createdAt, includeTime: true))
                }

                if let due = order.deliveryDate {
                    timelineRow(label: s("admin.orders.delivery_due_label"), value: displayDate(due, includeTime: true))
                }

                HStack(spacing: 8) {
                    Text(s("admin.orders.current_status_label"))
                        .font(TrustoraTypography.body)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                    Spacer(minLength: 0)
                    statusBadge(order.status)
                }
            }
        }
    }

    private var adminActionsCard: some View {
        sectionCard(title: s("admin.orders.admin_actions_title"), icon: "pencil.and.scribble") {
            VStack(alignment: .leading, spacing: 10) {
                Text(s("admin.orders.update_status_label"))
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)

                Picker("", selection: $selectedStatus) {
                    ForEach(AdminOrderStatusOption.allCases) { option in
                        Text(s(option.titleKey))
                            .tag(option.rawValue)
                    }
                }
                .pickerStyle(.menu)
                .tint(TrustoraTheme.primary)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(TrustoraTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(TrustoraTheme.border, lineWidth: 1)
                )

                Text(s("admin.orders.admin_notes_label"))
                    .font(TrustoraTypography.control)
                    .foregroundStyle(TrustoraTheme.secondaryText)

                ZStack(alignment: .topLeading) {
                    if adminNotes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text(s("admin.orders.admin_notes_placeholder"))
                            .font(TrustoraTypography.body)
                            .foregroundStyle(TrustoraTheme.tertiaryText)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 12)
                    }

                    TextEditor(text: $adminNotes)
                        .font(TrustoraTypography.body)
                        .frame(minHeight: 110)
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

                Button {
                    Task {
                        await saveChanges()
                    }
                } label: {
                    Text(s("admin.orders.save_changes"))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(TrustoraTheme.accentButtonText)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                }
                .buttonStyle(.plain)
                .background(TrustoraTheme.accent)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .disabled(isSaving)
                .opacity(isSaving ? 0.6 : 1)
            }
        }
    }

    private func sectionCard<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(TrustoraTheme.primary)
                Text(title)
                    .font(TrustoraTypography.cardTitle)
                    .foregroundStyle(TrustoraTheme.primary)
            }

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private func detailTextBlock(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TrustoraTypography.control)
                .foregroundStyle(TrustoraTheme.secondaryText)
            Text(value)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TrustoraTheme.mutedSurface)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func participantDetailCard(title: String, participant: AdminOrderParticipantSummary?) -> some View {
        HStack(spacing: 10) {
            participantAvatar(participant)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(TrustoraTypography.caption)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                Text(participant?.fullName ?? "-")
                    .font(TrustoraTypography.body)
                    .foregroundStyle(TrustoraTheme.primary)
                if let email = participant?.email, !email.isEmpty {
                    Text(email)
                        .font(TrustoraTypography.caption)
                        .foregroundStyle(TrustoraTheme.secondaryText)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(10)
        .trustoraCardStyle(cornerRadius: TrustoraMetrics.compactCardRadius, background: TrustoraTheme.surface)
    }

    private func participantAvatar(_ participant: AdminOrderParticipantSummary?) -> some View {
        Group {
            if let avatarURL = participant?.avatarURL,
               let url = URL(string: avatarURL),
               !avatarURL.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case let .success(image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        fallbackAvatar(participant)
                    }
                }
            } else {
                fallbackAvatar(participant)
            }
        }
        .frame(width: 42, height: 42)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(Color.white.opacity(0.9), lineWidth: 1)
        )
    }

    private func fallbackAvatar(_ participant: AdminOrderParticipantSummary?) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1BC47D), Color(hex: 0x0B1C2D)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Text(participant?.initials ?? "U")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.white)
        }
    }

    private func financialRow(label: String, value: String, valueColor: Color) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
            Spacer(minLength: 0)
            Text(value)
                .font(TrustoraTypography.body)
                .foregroundStyle(valueColor)
        }
    }

    private func timelineRow(label: String, value: String) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
            Spacer(minLength: 0)
            Text(value)
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.primary)
        }
    }

    private func statusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let key: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "COMPLETED", "DELIVERED":
            key = normalized == "DELIVERED" ? "admin.orders.statuses.delivered" : "admin.orders.statuses.completed"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "IN_PROGRESS", "ACCEPTED":
            key = normalized == "ACCEPTED" ? "admin.orders.statuses.accepted" : "admin.orders.statuses.in_progress"
            style = (Color(hex: 0x075985), Color(hex: 0xE0F2FE), Color(hex: 0xBAE6FD))
        case "CANCELLED":
            key = "admin.orders.statuses.cancelled"
            style = (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        case "DISPUTED":
            key = "admin.orders.statuses.disputed"
            style = (Color(hex: 0x6D28D9), Color(hex: 0xEDE9FE), Color(hex: 0xDDD6FE))
        default:
            key = "admin.orders.statuses.pending"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
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

    private func paymentStatusBadge(_ status: String) -> some View {
        let normalized = status.uppercased()
        let key: String
        let style: (text: Color, fill: Color, border: Color)

        switch normalized {
        case "PAID":
            key = "admin.orders.payment_statuses.paid"
            style = (Color(hex: 0x065F46), Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0))
        case "FAILED":
            key = "admin.orders.payment_statuses.failed"
            style = (Color(hex: 0xB91C1C), Color(hex: 0xFEE2E2), Color(hex: 0xFECACA))
        case "REFUNDED":
            key = "admin.orders.payment_statuses.refunded"
            style = (Color(hex: 0x334155), Color(hex: 0xE2E8F0), Color(hex: 0xCBD5E1))
        default:
            key = "admin.orders.payment_statuses.pending"
            style = (Color(hex: 0x92400E), Color(hex: 0xFEF3C7), Color(hex: 0xFDE68A))
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

    private func refreshOrder() async {
        isLoading = true
        errorMessage = nil

        if let loaded = await loadOrder(order.id) {
            order = loaded
            selectedStatus = loaded.status
            if adminNotes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                adminNotes = loaded.adminNotes
            }
        }

        isLoading = false
    }

    private func saveChanges() async {
        isSaving = true
        errorMessage = nil

        let trimmedNotes = adminNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        let notesPayload = trimmedNotes.isEmpty ? nil : trimmedNotes

        if let updated = await saveOrder(order.id, selectedStatus, notesPayload) {
            order = updated
            selectedStatus = updated.status
            adminNotes = updated.adminNotes
        } else {
            errorMessage = s("admin.orders.update_error")
        }

        isSaving = false
    }

    private func priceText(amount: Double, currency: String) -> String {
        let localeIdentifier = languageCode == "ro" ? "ro-RO" : "en-US"
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: localeIdentifier)
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased().isEmpty ? fallbackCurrencyCode : currency.uppercased()
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2

        return formatter.string(from: NSNumber(value: amount)) ?? "\(Int(amount)) \(currency)"
    }

    private var fallbackCurrencyCode: String {
        if defaultCurrency == .defaultCurrency {
            return "USD"
        }
        return defaultCurrency.rawValue
    }

    private func displayDate(_ date: Date, includeTime: Bool) -> String {
        let localeIdentifier = languageCode == "ro" ? "ro-RO" : "en-US"
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: localeIdentifier)
        formatter.dateStyle = .medium
        formatter.timeStyle = includeTime ? .short : .none
        return formatter.string(from: date)
    }

    private func s(_ key: String) -> String {
        strings(key)
    }
}

//
//  ContentView.swift
//  TrustoraApp
//
//  Created by Arsene Claudiu Ion on 27.02.2026.
//

import SwiftUI

struct ContentView: View {
    private enum RootPage {
        case home
        case services
        case about
    }

    @State private var isHeaderMenuOpen = false
    @State private var isGuestBottomMenuOpen = false
    @State private var isAuthenticatedBottomMenuOpen = false
    @State private var isDashboardPresented = false
    @State private var activeAuthMode: TrustoraAuthMode?
    @State private var newsletterEmail = ""
    @State private var currentPage: RootPage = .home
    @State private var isHeaderCompact = false
    @State private var pendingScrollTarget: String?
    @StateObject private var authSession = AuthSessionStore()
    @AppStorage("trustora.app.language") private var appLanguageRaw = AppLanguage.system.rawValue
    @AppStorage(AppCurrency.storageKey) private var appCurrencyRaw = AppCurrency.defaultCurrency.rawValue

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary
    private let lightBackground = TrustoraTheme.background
    private let bottomNavigationMenuButtonWidth: CGFloat = 62

    private let navigationItems: [(key: String, icon: String)] = [
        ("navigation.home", "house.fill"),
        ("navigation.services", "square.grid.2x2.fill"),
        ("navigation.about", "info.circle.fill"),
        ("navigation.help", "questionmark.circle.fill"),
        ("navigation.contact", "phone.fill")
    ]

    private let primaryBottomItems: [(key: String, icon: String, anchor: String?)] = [
        ("navigation.home", "house.fill", "section-home"),
        ("navigation.services", "square.grid.2x2.fill", nil),
        ("navigation.about", "info.circle.fill", nil)
    ]

    private let popularServiceKeys = [
        "common.popular_service_web",
        "common.popular_service_mobile",
        "common.popular_service_design",
        "common.popular_service_marketing"
    ]

    private var currentYear: Int {
        Calendar.current.component(.year, from: Date())
    }

    private var appLanguage: AppLanguage {
        get { AppLanguage(rawValue: appLanguageRaw) ?? .system }
        set { appLanguageRaw = newValue.rawValue }
    }

    private var appCurrency: AppCurrency {
        get { AppCurrency(rawValue: appCurrencyRaw) ?? .defaultCurrency }
        set { appCurrencyRaw = newValue.rawValue }
    }

    private var resolvedLanguageCode: String {
        if appLanguage == .system {
            let preferred = Locale.preferredLanguages.first ?? "en"
            let code = Locale(identifier: preferred).language.languageCode?.identifier ?? "en"
            return code == "ro" ? "ro" : "en"
        }
        return appLanguage.rawValue
    }

    private var localizedBundle: Bundle {
        guard
            let path = Bundle.main.path(forResource: resolvedLanguageCode, ofType: "lproj"),
            let bundle = Bundle(path: path)
        else {
            return .main
        }
        return bundle
    }

    private func s(_ key: String) -> String {
        NSLocalizedString(key, tableName: "Localizable", bundle: localizedBundle, value: key, comment: "")
    }

    private func openAuth(_ mode: TrustoraAuthMode) {
        if isGuestBottomMenuOpen {
            isGuestBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                activeAuthMode = mode
            }
            return
        }

        if isHeaderMenuOpen {
            isHeaderMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                activeAuthMode = mode
            }
            return
        }

        activeAuthMode = mode
    }

    private func openDashboard() {
        if isAuthenticatedBottomMenuOpen {
            isAuthenticatedBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isDashboardPresented = true
            }
            return
        }

        isDashboardPresented = true
    }

    private func openServices() {
        if isGuestBottomMenuOpen {
            isGuestBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .services
            }
            return
        }

        if isAuthenticatedBottomMenuOpen {
            isAuthenticatedBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .services
            }
            return
        }

        if isHeaderMenuOpen {
            isHeaderMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .services
            }
            return
        }

        isHeaderCompact = false
        currentPage = .services
    }

    private func openAbout() {
        if isGuestBottomMenuOpen {
            isGuestBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .about
            }
            return
        }

        if isAuthenticatedBottomMenuOpen {
            isAuthenticatedBottomMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .about
            }
            return
        }

        if isHeaderMenuOpen {
            isHeaderMenuOpen = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                isHeaderCompact = false
                currentPage = .about
            }
            return
        }

        isHeaderCompact = false
        currentPage = .about
    }

    private func navigateHome(to anchor: String? = nil) {
        let shouldDelayTarget = currentPage != .home
        currentPage = .home

        guard let anchor else {
            return
        }

        if shouldDelayTarget {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                pendingScrollTarget = anchor
            }
        } else {
            pendingScrollTarget = anchor
        }
    }

    private func handlePrimaryNavigationSelection(key: String, anchor: String?) {
        if key == "navigation.services" {
            openServices()
            return
        }

        if key == "navigation.about" {
            openAbout()
            return
        }

        let shouldDelay = isHeaderMenuOpen || isGuestBottomMenuOpen || isAuthenticatedBottomMenuOpen
        isHeaderMenuOpen = false
        isGuestBottomMenuOpen = false
        isAuthenticatedBottomMenuOpen = false

        let performScrollSelection = {
            switch key {
            case "navigation.help", "navigation.contact":
                navigateHome(to: anchor ?? "section-about")
            default:
                navigateHome(to: anchor ?? "section-home")
            }
        }

        if shouldDelay {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                performScrollSelection()
            }
        } else {
            performScrollSelection()
        }
    }

    private func menuAnchor(for key: String) -> String? {
        switch key {
        case "navigation.home":
            return "section-home"
        case "navigation.help", "navigation.contact":
            return "section-about"
        default:
            return nil
        }
    }

    private func moneyFromUSD(_ amount: Decimal, maximumFractionDigits: Int = 0) -> String {
        CurrencyFormatting.format(
            amountUSD: amount,
            currency: appCurrency,
            languageCode: resolvedLanguageCode,
            maximumFractionDigits: maximumFractionDigits
        )
    }

    var body: some View {
            ZStack(alignment: .bottom) {
                lightBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    stickyHeaderSection

                    activePageContent
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                        .safeAreaInset(edge: .bottom) {
                            Color.clear.frame(height: 100)
                        }
                }
                .ignoresSafeArea(edges: .bottom)

                bottomNavigation
            }
            .sheet(isPresented: $isHeaderMenuOpen) {
                mobileMenuSheet
            }
            .sheet(isPresented: $isGuestBottomMenuOpen) {
                guestBottomAuthSheet
            }
            .sheet(isPresented: $isAuthenticatedBottomMenuOpen) {
                authenticatedBottomMenuSheet
            }
            .fullScreenCover(item: $activeAuthMode) { mode in
                TrustoraAuthFlowView(
                    initialMode: mode,
                    authSession: authSession,
                    strings: { key in
                        s(key)
                    }
                )
            }
            .fullScreenCover(isPresented: $isDashboardPresented) {
                TrustoraDashboardView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: { key in
                        s(key)
                    }
                )
            }
            .task {
                await authSession.bootstrap()
            }
        }

    @ViewBuilder
    private var activePageContent: some View {
        switch currentPage {
        case .home:
            homePageContent
        case .services:
            servicesPageContent
        case .about:
            aboutPageContent
        }
    }

    private var homePageContent: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    scrollOffsetReader
                    heroSection
                        .id("section-home")
                    pillarsSection
                        .id("section-services")
                    messagingSection
                    visualSection
                    finalCTASection
                    footerSection
                        .id("section-about")
                }
                .padding(.bottom, 20)
            }
            .coordinateSpace(name: "mainScroll")
            .onPreferenceChange(ScrollOffsetPreferenceKey.self) { offset in
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHeaderCompact = offset < -8
                }
            }
            .onChange(of: pendingScrollTarget) {
                guard let target = pendingScrollTarget else {
                    return
                }

                withAnimation(.spring(response: 0.36, dampingFraction: 0.84)) {
                    proxy.scrollTo(target, anchor: .top)
                }

                pendingScrollTarget = nil
            }
        }
    }

    private var servicesPageContent: some View {
        ScrollView {
            VStack(spacing: 0) {
                TrustoraServicesView(
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: { key in
                        s(key)
                    },
                    useSharedChrome: true
                )
                footerSection
            }
            .padding(.bottom, 20)
        }
    }

    private var aboutPageContent: some View {
        ScrollView {
            VStack(spacing: 0) {
                TrustoraAboutView(
                    authSession: authSession,
                    appLanguageRaw: $appLanguageRaw,
                    appCurrencyRaw: $appCurrencyRaw,
                    strings: { key in
                        s(key)
                    },
                    useSharedChrome: true,
                    onOpenServices: {
                        openServices()
                    },
                    onOpenDashboard: {
                        openDashboard()
                    },
                    onOpenAuth: { mode in
                        openAuth(mode)
                    }
                )
                footerSection
            }
            .padding(.bottom, 20)
        }
    }

    private var stickyHeaderSection: some View {
        VStack(spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                if currentPage == .home && isHeaderCompact {
                    Image("TrustoraLogo")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 9))
                        .transition(.opacity.combined(with: .scale))
                } else {
                    BrandLockup(compact: true, tagline: s("common.trustora_tagline"), forceSingleLine: true)
                        .transition(.opacity.combined(with: .move(edge: .leading)))
                }
                Spacer()

                currencyMenuButton
                languageMenuButton
                headerMenuButton
            }
            .padding(.horizontal, 20)
            .padding(.top, 10)
            .padding(.bottom, 8)
        }
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Divider()
                .overlay(Color(hex: 0xE2E8F0))
        }
    }

    private var scrollOffsetReader: some View {
        GeometryReader { geometry in
            Color.clear
                .preference(
                    key: ScrollOffsetPreferenceKey.self,
                    value: geometry.frame(in: .named("mainScroll")).minY
                )
        }
        .frame(height: 0)
    }

    private var languageMenuButton: some View {
        Menu {
            Picker(selection: $appLanguageRaw, label: EmptyView()) {
                ForEach(AppLanguage.allCases) { language in
                    Text(s(language.titleKey)).tag(language.rawValue)
                }
            }
        } label: {
            HStack(spacing: 6) {
                Text(selectedLanguageIcon)
                    .font(.system(size: 13, weight: .semibold))
                Text(appLanguageShortLabel)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(midnightBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.65))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
            )
        }
        .accessibilityLabel(s("settings.language"))
    }

    private var currencyMenuButton: some View {
        Menu {
            Picker(selection: $appCurrencyRaw, label: EmptyView()) {
                ForEach(AppCurrency.allCases) { currency in
                    Text(s(currency.titleKey)).tag(currency.rawValue)
                }
            }
        } label: {
            HStack(spacing: 6) {
                Text(selectedCurrencyIcon)
                    .font(.system(size: 13, weight: .semibold))
                Text(appCurrency.rawValue)
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(midnightBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.65))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
            )
        }
        .accessibilityLabel(s("settings.currency"))
    }

    private var headerMenuButton: some View {
        Button {
            isHeaderMenuOpen = true
        } label: {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(midnightBlue)
                .frame(width: 32, height: 32)
                .background(Color.white.opacity(0.65))
                .clipShape(RoundedRectangle(cornerRadius: 11))
                .overlay(
                    RoundedRectangle(cornerRadius: 11)
                        .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
                )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(s("navigation.open_main_user_menu"))
    }

    private var appLanguageShortLabel: String {
        switch appLanguage {
        case .system:
            return s("settings.language.system.short")
        case .en:
            return "EN"
        case .ro:
            return "RO"
        }
    }

    private var selectedLanguageIcon: String {
        let code = appLanguage == .system ? resolvedLanguageCode : appLanguage.rawValue
        switch code {
        case "ro":
            return "🇷🇴"
        case "en":
            return "🇺🇸"
        default:
            return "🌐"
        }
    }

    private var selectedCurrencyIcon: String {
        switch appCurrency {
        case .usd:
            return "🇺🇸"
        case .eur:
            return "🇪🇺"
        case .ron:
            return "🇷🇴"
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack(spacing: 10) {
                Image("TrustoraLogo")
                    .resizable()
                    .scaledToFill()
                    .frame(width: 30, height: 30)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Circle()
                    .fill(trustoraGreen)
                    .frame(width: 8, height: 8)

                Text(s("trustora.hero.badge"))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color(hex: 0x166043))
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Capsule().fill(trustoraGreen.opacity(0.12)))
            .overlay(
                Capsule()
                    .stroke(trustoraGreen.opacity(0.4), lineWidth: 1)
            )

            VStack(alignment: .leading, spacing: 0) {
                Text(s("trustora.hero.title"))
                    .foregroundStyle(midnightBlue)
                Text(s("trustora.hero.title_highlight"))
                    .foregroundStyle(trustoraGreen)
            }
            .font(TrustoraTypography.heroTitle)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)

            Text(s("trustora.hero.subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.secondaryText)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 12) {
                Button {
                    openAuth(.signUp)
                } label: {
                    Text(s("trustora.hero.primary_cta"))
                        .font(TrustoraTypography.emphasis)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(trustoraGreen)
                        .foregroundStyle(TrustoraTheme.accentButtonText)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                Button(action: {}) {
                    Text(s("trustora.hero.secondary_cta"))
                        .font(TrustoraTypography.emphasis)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .foregroundStyle(midnightBlue)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(midnightBlue.opacity(0.3), lineWidth: 1.2)
                        )
                }
            }

            HStack(spacing: 10) {
                HStack(spacing: -8) {
                    Circle().fill(Color(hex: 0x94A3B8)).frame(width: 28, height: 28)
                    Circle().fill(Color(hex: 0x64748B)).frame(width: 28, height: 28)
                    Circle().fill(Color(hex: 0x475569)).frame(width: 28, height: 28)
                }
                .overlay(
                    HStack(spacing: -8) {
                        Circle().stroke(Color.white, lineWidth: 1.5).frame(width: 28, height: 28)
                        Circle().stroke(Color.white, lineWidth: 1.5).frame(width: 28, height: 28)
                        Circle().stroke(Color.white, lineWidth: 1.5).frame(width: 28, height: 28)
                    }
                )

                Text(s("trustora.hero.trusted_label"))
                    .font(TrustoraTypography.paragraph)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
            }

            dashboardCard
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
        .padding(.bottom, 36)
        .background(
            LinearGradient(
                colors: [lightBackground, Color.white],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    private var dashboardCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(s("trustora.hero.dashboard_label").uppercased())
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color(hex: 0x475569))
                Spacer()
                Text(s("trustora.hero.secured_label"))
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(trustoraGreen)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(trustoraGreen.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(s("trustora.hero.contract_name"))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x0F172A))
                    Spacer()
                    Text(moneyFromUSD(4200))
                        .font(.system(size: 14, weight: .black, design: .monospaced))
                        .foregroundStyle(Color(hex: 0x0F172A))
                }

                ProgressView(value: 0.75)
                    .tint(trustoraGreen)
                    .scaleEffect(x: 1, y: 1.5, anchor: .center)

                HStack {
                    Text(s("trustora.hero.milestone_progress"))
                    Spacer()
                    Text(s("trustora.hero.milestone_eta"))
                }
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(Color(hex: 0x64748B))
            }
            .padding(14)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
            )

            HStack(spacing: 10) {
                Text(s("trustora.hero.next_milestone"))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
                            .foregroundStyle(Color(hex: 0xCBD5E1))
                    )

                VStack(spacing: 4) {
                    Text(s("trustora.hero.payout_label"))
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.white.opacity(0.7))
                    Text(s("trustora.hero.payout_value"))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                }
                .frame(width: 92)
                .padding(.vertical, 10)
                .background(midnightBlue)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(midnightBlue.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: trustoraGreen.opacity(0.15), radius: 18, x: 0, y: 8)
    }

    private var pillarsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                PillarCard(
                    icon: "checkmark.shield.fill",
                    title: s("trustora.pillars.verified_title"),
                    description: s("trustora.pillars.verified_description"),
                    accent: trustoraGreen
                )

                PillarCard(
                    icon: "lock.shield.fill",
                    title: s("trustora.pillars.protected_title"),
                    description: s("trustora.pillars.protected_description"),
                    accent: trustoraGreen
                )

                PillarCard(
                    icon: "chart.bar.fill",
                    title: s("trustora.pillars.delivery_title"),
                    description: s("trustora.pillars.delivery_description"),
                    accent: trustoraGreen
                )

                PillarCard(
                    icon: "doc.text.fill",
                    title: s("trustora.pillars.legal_title"),
                    description: s("trustora.pillars.legal_description"),
                    accent: trustoraGreen
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 28)
        .background(lightBackground)
    }

    private var messagingSection: some View {
        VStack(spacing: 16) {
            MessagingCard(
                badge: s("trustora.messaging.clients_badge"),
                title: s("trustora.messaging.clients_title"),
                descriptionText: s("trustora.messaging.clients_body"),
                benefits: [
                    s("trustora.messaging.clients_benefit_one"),
                    s("trustora.messaging.clients_benefit_two")
                ],
                linkLabel: s("trustora.messaging.clients_link"),
                dark: false
            )

            MessagingCard(
                badge: s("trustora.messaging.pros_badge"),
                title: s("trustora.messaging.pros_title"),
                descriptionText: s("trustora.messaging.pros_body"),
                benefits: [
                    s("trustora.messaging.pros_benefit_one"),
                    s("trustora.messaging.pros_benefit_two")
                ],
                linkLabel: s("trustora.messaging.pros_link"),
                dark: true
            )
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 30)
        .background(Color.white)
    }

    private var visualSection: some View {
        VStack(spacing: 18) {
            Text(s("trustora.visual.title"))
                .font(TrustoraTypography.sectionTitle)
                .foregroundStyle(midnightBlue)
                .multilineTextAlignment(.center)

            VisualNodeCard(
                emoji: "💰",
                title: s("trustora.visual.money_label"),
                subtitle: s("trustora.visual.money_subtitle"),
                highlighted: false
            )

            RoundedRectangle(cornerRadius: 1)
                .fill(Color(hex: 0xCBD5E1))
                .frame(width: 1, height: 18)

            VisualNodeCard(
                emoji: "📑",
                title: s("trustora.visual.contracts_label"),
                subtitle: s("trustora.visual.contracts_subtitle"),
                highlighted: true
            )

            RoundedRectangle(cornerRadius: 1)
                .fill(Color(hex: 0xCBD5E1))
                .frame(width: 1, height: 18)

            VisualNodeCard(
                emoji: "👤",
                title: s("trustora.visual.verification_label"),
                subtitle: s("trustora.visual.verification_subtitle"),
                highlighted: false
            )
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
        .padding(.vertical, 34)
        .background(Color.white)
    }

    private var finalCTASection: some View {
        VStack(spacing: 24) {
            Text(s("trustora.final_cta.title"))
                .font(TrustoraTypography.heroTitle)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            Text(s("trustora.final_cta.subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(Color.white.opacity(0.74))
                .multilineTextAlignment(.center)

            Button {
                openAuth(.signUp)
            } label: {
                Text(s("trustora.final_cta.cta_label"))
                    .font(TrustoraTypography.emphasis)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(trustoraGreen)
                    .foregroundStyle(TrustoraTheme.accentButtonText)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }

            VStack(spacing: 10) {
                Text(s("trustora.final_cta.escrow_label").uppercased())
                Text(s("trustora.final_cta.verified_label").uppercased())
                Text(s("trustora.final_cta.legal_label").uppercased())
            }
            .font(.system(size: 12, weight: .bold, design: .monospaced))
            .foregroundStyle(Color.white.opacity(0.5))
            .padding(.top, 6)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 40)
        .background(midnightBlue)
    }

    private var footerSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            BrandLockup(compact: false, tagline: s("common.trustora_tagline"))

            Text(s("common.footer_platform_description"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .lineSpacing(3)

            HStack(spacing: 10) {
                FooterIconButton(icon: "f.square.fill", accessibilityLabel: "\(s("common.follow_us_on")) Facebook")
                FooterIconButton(icon: "x.square.fill", accessibilityLabel: "\(s("common.follow_us_on")) X")
                FooterIconButton(icon: "inset.filled.rectangle.and.person.filled", accessibilityLabel: "\(s("common.follow_us_on")) LinkedIn")
                FooterIconButton(icon: "camera.fill", accessibilityLabel: "\(s("common.follow_us_on")) Instagram")
            }

            FooterSectionTitle(text: s("common.quick_links"))

            VStack(alignment: .leading, spacing: 10) {
                ForEach(navigationItems, id: \.key) { item in
                    FooterLinkRow(icon: item.icon, title: s(item.key))
                }
            }

            FooterSectionTitle(text: s("common.popular_services"))

            VStack(alignment: .leading, spacing: 8) {
                ForEach(popularServiceKeys, id: \.self) { key in
                    Text(s(key))
                        .font(TrustoraTypography.control)
                        .foregroundStyle(midnightBlue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color(hex: 0xECFDF5))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }

            FooterSectionTitle(text: s("common.contact_title"))

            VStack(spacing: 10) {
                ContactCard(icon: "envelope.fill", text: "contact@trustora.ro")
                ContactCard(icon: "phone.fill", text: "+40 123 456 789")
                ContactCard(icon: "mappin.and.ellipse", text: s("common.location_label"))
            }

            FooterSectionTitle(text: s("common.newsletter_title"))

            VStack(spacing: 10) {
                TextField(s("common.your_email"), text: $newsletterEmail)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .padding(.horizontal, 12)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: 0xCBD5E1), lineWidth: 1)
                    )

                Button(action: {}) {
                    Text(s("common.subscribe"))
                        .font(TrustoraTypography.emphasis)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(trustoraGreen)
                        .foregroundStyle(TrustoraTheme.accentButtonText)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            FooterSectionTitle(text: s("common.legal_documents"))

            HStack(spacing: 10) {
                Text(s("common.privacy_policy"))
                Text("|")
                Text(s("common.terms_conditions"))
                Text("|")
                Text(s("common.cookie_policy"))
            }
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(midnightBlue)

            Divider()

            VStack(spacing: 8) {
                Text("© \(currentYear) Trustora. \(s("common.all_rights_reserved")).")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color(hex: 0x64748B))
            }
            .frame(maxWidth: .infinity)
            .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 30)
        .background(Color(hex: 0xF8FAFC))
        .overlay(alignment: .top) {
            Divider()
                .overlay(Color(hex: 0xE2E8F0))
        }
    }

    private var bottomNavigation: some View {
        ZStack(alignment: .leading) {
            BottomNavigationTrackSurface()
                .padding(1)
                .allowsHitTesting(false)

            GeometryReader { proxy in
                let segmentCount = max(primaryBottomItems.count, 1)
                let menuButtonWidth = min(bottomNavigationMenuButtonWidth, proxy.size.width)
                let tabAreaWidth = max(proxy.size.width - menuButtonWidth, 0)
                let segmentWidth = tabAreaWidth / CGFloat(segmentCount)
                let activeIndex = bottomNavigationActiveIndex

                BottomNavigationSelectionSurface(
                    tint: trustoraGreen,
                    segmentShape: BottomNavigationSegmentShape(
                        roundLeading: activeIndex == 0,
                        roundTrailing: false
                    )
                )
                .frame(width: segmentWidth, height: proxy.size.height)
                .offset(x: segmentWidth * CGFloat(activeIndex))
                .padding(1)
                .allowsHitTesting(false)
            }

            HStack(spacing: 0) {
                HStack(spacing: 0) {
                    ForEach(Array(primaryBottomItems.enumerated()), id: \.element.key) { index, item in
                        bottomNavigationButton(
                            key: item.key,
                            icon: item.icon,
                            anchor: item.anchor
                        )

                        if index < (primaryBottomItems.count - 1) {
                            bottomNavigationDivider(
                                hidden: bottomNavigationActiveIndex == index || bottomNavigationActiveIndex == (index + 1)
                            )
                        }
                    }
                }
                .frame(maxWidth: .infinity)

                bottomNavigationDivider(
                    hidden: bottomNavigationActiveIndex == (primaryBottomItems.count - 1)
                )

                bottomMenuButton
                    .frame(width: bottomNavigationMenuButtonWidth)
                    .frame(maxHeight: .infinity)
            }
        }
        .frame(height: 62)
        .padding(.horizontal, 14)
        .padding(.bottom, 4)
        .transaction { transaction in
            transaction.animation = nil
        }
    }

    private func handleBottomNavigationTap(key: String, anchor: String?) {
        if key == "navigation.services" {
            openServices()
        } else if key == "navigation.about" {
            openAbout()
        } else {
            navigateHome(to: anchor)
        }
    }

    private func bottomNavigationButton(
        key: String,
        icon: String,
        anchor: String?
    ) -> some View {
        let isActive = isBottomNavigationItemActive(key)

        return Button {
            handleBottomNavigationTap(key: key, anchor: anchor)
        } label: {
            VStack(spacing: 3) {
                Image(systemName: icon)
                    .symbolVariant(isActive ? .fill : .none)
                    .font(.system(size: 15, weight: .semibold))

                Text(s(key))
                    .font(.system(size: 10, weight: isActive ? .bold : .semibold))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .foregroundStyle(bottomNavigationForegroundColor(isActive: isActive))
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentShape(Rectangle())
        .transaction { transaction in
            transaction.animation = nil
        }
    }

    private func isBottomNavigationItemActive(_ key: String) -> Bool {
        switch currentPage {
        case .home:
            return key == "navigation.home"
        case .services:
            return key == "navigation.services"
        case .about:
            return key == "navigation.about"
        }
    }

    private var bottomMenuButton: some View {
        Button {
            if authSession.user != nil {
                isAuthenticatedBottomMenuOpen = true
            } else {
                isGuestBottomMenuOpen = true
            }
        } label: {
            ZStack(alignment: .bottomTrailing) {
                if let user = authSession.user {
                    AuthAvatarView(user: user, size: 36)
                } else {
                    ZStack {
                        Circle()
                            .fill(Color(hex: 0xF8FAFC))

                        Circle()
                            .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)

                        Image(systemName: "line.3.horizontal")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(midnightBlue)
                    }
                    .frame(width: 38, height: 38)
                }

                if authSession.user != nil {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 8, weight: .black))
                        .foregroundStyle(Color(hex: 0x071A12))
                        .frame(width: 15, height: 15)
                        .background(trustoraGreen, in: Circle())
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.75), lineWidth: 1)
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
        .accessibilityLabel(s("navigation.open_main_user_menu"))
    }

    private func bottomNavigationForegroundColor(isActive: Bool) -> Color {
        return isActive ? Color(hex: 0x071A12) : Color(hex: 0x334155)
    }

    private func bottomNavigationDivider(hidden: Bool = false) -> some View {
        Rectangle()
            .fill(Color(hex: 0xE2E8F0))
            .frame(width: 1, height: 34)
            .padding(.vertical, 14)
            .opacity(hidden ? 0 : 1)
            .allowsHitTesting(false)
    }

    private var bottomNavigationActiveIndex: Int {
        primaryBottomItems.firstIndex { isBottomNavigationItemActive($0.key) } ?? 0
    }

    private var mobileMenuSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    BrandLockup(compact: false, tagline: s("common.trustora_tagline"))

                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(Color(hex: 0x64748B))
                        Text(s("common.search_bar.placeholder"))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color(hex: 0x64748B))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 11)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                    )

                    VStack(spacing: 10) {
                        ForEach(navigationItems, id: \.key) { item in
                            Button {
                                handlePrimaryNavigationSelection(
                                    key: item.key,
                                    anchor: menuAnchor(for: item.key)
                                )
                            } label: {
                                MenuLinkRow(icon: item.icon, title: s(item.key))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if authSession.user == nil {
                        VStack(spacing: 10) {
                            Button {
                                openAuth(.signIn)
                            } label: {
                                Text(s("navigation.login"))
                                    .font(.system(size: 16, weight: .bold))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .foregroundStyle(midnightBlue)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(midnightBlue.opacity(0.3), lineWidth: 1.2)
                                    )
                            }

                            Button {
                                openAuth(.signUp)
                            } label: {
                                Text(s("navigation.register"))
                                    .font(.system(size: 16, weight: .bold))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .background(trustoraGreen)
                                    .foregroundStyle(Color(hex: 0x071A12))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text(s("common.contact_title"))
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(Color(hex: 0x0F172A))

                        ContactCard(icon: "envelope.fill", text: "contact@trustora.ro")
                        ContactCard(icon: "phone.fill", text: "+40 123 456 789")
                    }
                }
                .padding(20)
            }
            .navigationTitle(s("navigation.main_navigation"))
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.fraction(0.92), .large])
        .presentationDragIndicator(.visible)
    }

    private var guestBottomAuthSheet: some View {
        NavigationStack {
            VStack(spacing: 18) {
                BrandLockup(compact: false, tagline: s("common.trustora_tagline"))
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text(s("auth.signin.subtitle"))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color(hex: 0x64748B))
                    .frame(maxWidth: .infinity, alignment: .leading)

                Button {
                    openAuth(.signIn)
                } label: {
                    Text(s("navigation.login"))
                        .font(.system(size: 16, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .foregroundStyle(midnightBlue)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(midnightBlue.opacity(0.3), lineWidth: 1.2)
                        )
                }

                Button {
                    openAuth(.signUp)
                } label: {
                    Text(s("navigation.register"))
                        .font(.system(size: 16, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(trustoraGreen)
                        .foregroundStyle(Color(hex: 0x071A12))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Spacer(minLength: 0)
            }
            .padding(20)
            .navigationTitle(s("navigation.open_main_user_menu"))
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.fraction(0.45), .medium])
        .presentationDragIndicator(.visible)
    }

    private var authenticatedBottomMenuSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if let user = authSession.user {
                        HStack(alignment: .top, spacing: 12) {
                            AuthAvatarView(user: user, size: 52)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.displayName)
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundStyle(Color(hex: 0x0F172A))
                                    .lineLimit(1)
                                Text(user.email)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(Color(hex: 0x64748B))
                                    .lineLimit(1)
                                if let role = user.role, !role.isEmpty {
                                    Text(role.uppercased())
                                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                                        .foregroundStyle(Color(hex: 0x0C8F5D))
                                        .padding(.top, 2)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(Color(hex: 0xECFDF5))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: 0x86EFAC), lineWidth: 1)
                        )

                        VStack(spacing: 10) {
                            Button {
                                openDashboard()
                            } label: {
                                MenuLinkRow(icon: "rectangle.grid.2x2.fill", title: s("navigation.dashboard"))
                            }
                            .buttonStyle(.plain)

                            MenuLinkRow(icon: "person.crop.circle.fill", title: s("navigation.profile"))

                            if user.hasRole("provider") {
                                MenuLinkRow(icon: "person.crop.circle.badge.checkmark", title: s("navigation.edit_profile"))
                            }

                            if (user.isSuperuser ?? false) || user.hasRole("admin") {
                                MenuLinkRow(icon: "lock.shield.fill", title: s("navigation.admin_panel"))
                            }
                        }

                        Button {
                            Task {
                                await authSession.signOut()
                                isAuthenticatedBottomMenuOpen = false
                            }
                        } label: {
                            Text(s("navigation.logout"))
                                .font(.system(size: 15, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .foregroundStyle(Color(hex: 0x7F1D1D))
                                .background(Color(hex: 0xFEE2E2))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color(hex: 0xFCA5A5), lineWidth: 1)
                                )
                        }
                        .disabled(authSession.isLoading)
                    }
                }
                .padding(20)
            }
            .navigationTitle(s("navigation.open_main_user_menu"))
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.fraction(0.62), .large])
        .presentationDragIndicator(.visible)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ContentView()
                .environment(\.locale, .init(identifier: "ro"))
            ContentView()
                .environment(\.locale, .init(identifier: "en"))
        }
    }
}

private struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

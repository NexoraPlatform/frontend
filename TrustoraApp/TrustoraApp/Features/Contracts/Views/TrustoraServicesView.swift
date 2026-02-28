import Combine
import SwiftUI

struct TrustoraServicesView: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var appLanguageRaw: String
    @Binding var appCurrencyRaw: String

    let strings: (String) -> String
    let useSharedChrome: Bool
    let onBack: (() -> Void)?

    @StateObject private var viewModel = TrustoraServicesViewModel()

    private let trustoraGreen = TrustoraTheme.accent
    private let midnightBlue = TrustoraTheme.primary
    private let lightBackground = TrustoraTheme.background

    init(
        appLanguageRaw: Binding<String>,
        appCurrencyRaw: Binding<String>,
        strings: @escaping (String) -> String,
        useSharedChrome: Bool = false,
        onBack: (() -> Void)? = nil
    ) {
        self._appLanguageRaw = appLanguageRaw
        self._appCurrencyRaw = appCurrencyRaw
        self.strings = strings
        self.useSharedChrome = useSharedChrome
        self.onBack = onBack
    }

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
        "\(resolvedLanguageCode)|\(appCurrency.rawValue)"
    }

    private var categoryOptions: [MarketplaceCategory] {
        [MarketplaceCategory(id: "all", name: s("services.filters.all"))] + viewModel.categories
    }

    var body: some View {
        Group {
            if useSharedChrome {
                embeddedContent
            } else {
                NavigationStack {
                    VStack(spacing: 0) {
                        header

                        standaloneContent
                    }
                    .background(lightBackground.ignoresSafeArea())
                    .navigationBarHidden(true)
                }
            }
        }
        .task(id: refreshKey) {
            await viewModel.loadInitial(language: resolvedLanguageCode, currency: appCurrency)
        }
    }

    @ViewBuilder
    private var standaloneContent: some View {
        if viewModel.isInitializing {
            loadingState
        } else {
            ScrollView {
                servicesSections
                    .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                    .padding(.top, TrustoraMetrics.pageTopPadding)
                    .padding(.bottom, TrustoraMetrics.pageBottomPadding)
            }
            .refreshable {
                await viewModel.refresh(language: resolvedLanguageCode, currency: appCurrency)
            }
        }
    }

    @ViewBuilder
    private var embeddedContent: some View {
        if viewModel.isInitializing {
            loadingState
                .padding(.top, 18)
                .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                .padding(.bottom, TrustoraMetrics.pageBottomPadding)
        } else {
            servicesSections
                .padding(.horizontal, TrustoraMetrics.pageHorizontalPadding)
                .padding(.top, TrustoraMetrics.pageTopPadding)
                .padding(.bottom, TrustoraMetrics.pageBottomPadding)
        }
    }

    private var servicesSections: some View {
        VStack(alignment: .leading, spacing: TrustoraMetrics.sectionSpacing) {
            titleSection
            filtersCard
            resultsSection
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    if let onBack {
                        onBack()
                    } else {
                        dismiss()
                    }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(midnightBlue)
                        .frame(width: 32, height: 32)
                        .background(Color.white.opacity(0.72))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.white.opacity(0.82), lineWidth: 0.8)
                        )
                }
                .buttonStyle(.plain)

                BrandLockup(compact: true, tagline: s("common.trustora_tagline"), forceSingleLine: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                languageMenuButton
                currencyMenuButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
        }
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Divider().overlay(Color(hex: 0xE2E8F0))
        }
    }

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(s("services.page.title"))
                .font(TrustoraTypography.pageTitle)
                .foregroundStyle(midnightBlue)

            Text(s("services.page.subtitle"))
                .font(TrustoraTypography.body)
                .foregroundStyle(TrustoraTheme.tertiaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var filtersCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(s("services.filters.title"))
                .font(TrustoraTypography.cardTitle)
                .foregroundStyle(midnightBlue)

            VStack(alignment: .leading, spacing: 8) {
                Text(s("services.filters.service_type"))
                    .font(TrustoraTypography.label)
                    .foregroundStyle(TrustoraTheme.secondaryText)

                Menu {
                    ForEach(categoryOptions) { category in
                        Button {
                            Task {
                                await viewModel.selectCategory(
                                    category.id,
                                    language: resolvedLanguageCode,
                                    currency: appCurrency
                                )
                            }
                        } label: {
                            HStack {
                                Text(category.name)
                                if viewModel.selectedCategoryID == category.id {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                } label: {
                    HStack {
                        Text(categoryLabel(for: viewModel.selectedCategoryID))
                            .font(TrustoraTypography.control)
                            .lineLimit(1)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(midnightBlue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 11)
                    .background(Color(hex: 0xF8FAFC))
                    .clipShape(RoundedRectangle(cornerRadius: 11))
                    .overlay(
                        RoundedRectangle(cornerRadius: 11)
                            .stroke(Color(hex: 0xE2E8F0), lineWidth: 1)
                    )
                }
            }

        }
        .padding(TrustoraMetrics.cardPadding)
        .trustoraCardStyle()
    }

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let errorMessage = viewModel.errorMessage, !errorMessage.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(hex: 0xB91C1C))
                    Text(errorMessage)
                        .font(TrustoraTypography.control)
                        .foregroundStyle(Color(hex: 0x7F1D1D))
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .background(Color(hex: 0xFEE2E2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            if viewModel.isLoadingPage && viewModel.services.isEmpty {
                loadingState
            } else if viewModel.services.isEmpty {
                Text(s("services.results.no_services"))
                    .font(TrustoraTypography.paragraph)
                    .foregroundStyle(TrustoraTheme.tertiaryText)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 26)
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.services) { service in
                        ServiceResultCard(
                            service: service,
                            isWishlisted: viewModel.wishlist.contains(service.id),
                            wishlistedLabel: s("services.actions.wishlisted"),
                            addLabel: s("services.actions.add"),
                            shareLabel: s("services.actions.share"),
                            recommendedLabel: s("services.results.recommended"),
                            standardLabel: s("services.results.standard"),
                            noProvidersLabel: s("services.results.no_providers"),
                            providersAvailableLabel: sf(
                                "services.results.providers_available",
                                ["count": String(service.providers.count)]
                            ),
                            providersMoreLabel: { count in
                                sf("services.results.providers_more_label", ["count": String(count)])
                            },
                            moreTechnologiesLabel: { count in
                                sf("services.results.more_label", ["count": String(count)])
                            },
                            onToggleWishlist: {
                                viewModel.toggleWishlist(service.id)
                            }
                        )
                        .onAppear {
                            guard viewModel.shouldLoadNextPage(after: service.id) else {
                                return
                            }

                            Task {
                                await viewModel.loadNextPageIfNeeded(
                                    language: resolvedLanguageCode,
                                    currency: appCurrency
                                )
                            }
                        }
                    }

                    if viewModel.isLoadingMore {
                        HStack {
                            Spacer()
                            ProgressView().tint(trustoraGreen)
                            Spacer()
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
        }
    }

    private var loadingState: some View {
        HStack {
            Spacer()
            ProgressView().tint(trustoraGreen)
            Spacer()
        }
        .padding(.vertical, 30)
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
                Text(languageShortLabel)
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
    }

    private func categoryLabel(for id: String) -> String {
        categoryOptions.first(where: { $0.id == id })?.name ?? s("services.filters.all")
    }

    private var languageShortLabel: String {
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
        switch appLanguage == .system ? resolvedLanguageCode : appLanguage.rawValue {
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

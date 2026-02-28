import Combine
import SwiftUI

@MainActor
final class TrustoraServicesViewModel: ObservableObject {
    @Published var services: [MarketplaceService] = []
    @Published var categories: [MarketplaceCategory] = []
    @Published var selectedCategoryID = "all"
    @Published var wishlist = Set<String>()
    @Published var isInitializing = true
    @Published var isLoadingPage = false
    @Published var isLoadingMore = false
    @Published var hasMore = true
    @Published var errorMessage: String?

    private let pageSize = 12
    private var currentPage = 1
    private var lastContextKey = ""

    func loadInitial(language: String, currency: AppCurrency) async {
        let nextContextKey = "\(language)|\(currency.rawValue)"
        if lastContextKey == nextContextKey && !categories.isEmpty {
            return
        }

        lastContextKey = nextContextKey
        isInitializing = true
        errorMessage = nil

        do {
            async let fetchedCategories = TrustoraAPIClient.shared.getMarketplaceCategories(language: language)
            async let firstPage = TrustoraAPIClient.shared.getMarketplaceServices(
                page: 1,
                limit: pageSize,
                language: language,
                currency: currency
            )

            categories = try await fetchedCategories
            let response = try await firstPage
            services = response.services
            currentPage = 1
            hasMore = response.page < response.totalPages
        } catch {
            services = []
            categories = []
            hasMore = false
            errorMessage = error.localizedDescription
        }

        isInitializing = false
    }

    func refresh(language: String, currency: AppCurrency) async {
        currentPage = 1
        hasMore = true
        errorMessage = nil
        await loadServices(reset: true, language: language, currency: currency)
    }

    func selectCategory(_ categoryID: String, language: String, currency: AppCurrency) async {
        guard selectedCategoryID != categoryID else { return }

        selectedCategoryID = categoryID
        currentPage = 1
        hasMore = true
        errorMessage = nil

        await loadServices(reset: true, language: language, currency: currency)
    }

    func loadNextPageIfNeeded(language: String, currency: AppCurrency) async {
        guard hasMore, !isLoadingPage, !isLoadingMore, !services.isEmpty else {
            return
        }

        currentPage += 1
        await loadServices(reset: false, language: language, currency: currency)
    }

    func shouldLoadNextPage(after serviceID: String, threshold: Int = 4) -> Bool {
        guard hasMore, !isLoadingPage, !isLoadingMore, !services.isEmpty else {
            return false
        }

        guard let index = services.firstIndex(where: { $0.id == serviceID }) else {
            return false
        }

        let triggerIndex = max(services.count - max(1, threshold), 0)
        return index >= triggerIndex
    }

    func toggleWishlist(_ serviceID: String) {
        if wishlist.contains(serviceID) {
            wishlist.remove(serviceID)
        } else {
            wishlist.insert(serviceID)
        }
    }

    private func loadServices(reset: Bool, language: String, currency: AppCurrency) async {
        if reset {
            isLoadingPage = true
        } else {
            isLoadingMore = true
        }
        defer {
            isLoadingPage = false
            isLoadingMore = false
        }

        do {
            let response = try await TrustoraAPIClient.shared.getMarketplaceServices(
                categoryID: selectedCategoryID == "all" ? nil : selectedCategoryID,
                page: currentPage,
                limit: pageSize,
                language: language,
                currency: currency
            )

            if reset {
                services = response.services
            } else {
                let newRows = response.services.filter { next in
                    !services.contains(where: { $0.id == next.id })
                }
                services.append(contentsOf: newRows)
            }

            hasMore = response.page < response.totalPages && !response.services.isEmpty
        } catch {
            if !reset {
                currentPage = max(1, currentPage - 1)
            }
            if reset {
                services = []
            }
            hasMore = false
            errorMessage = error.localizedDescription
        }
    }
}

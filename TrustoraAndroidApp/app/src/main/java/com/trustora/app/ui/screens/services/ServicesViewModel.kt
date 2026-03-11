package com.trustora.app.ui.screens.services

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.MarketplaceCategory
import com.trustora.app.core.models.MarketplaceService
import com.trustora.app.core.repository.AppContainer
import kotlinx.coroutines.launch

data class ServicesUiState(
    val categories: List<MarketplaceCategory> = emptyList(),
    val selectedCategoryId: String = "all",
    val services: List<MarketplaceService> = emptyList(),
    val wishlist: Set<String> = emptySet(),
    val isInitializing: Boolean = true,
    val isLoadingPage: Boolean = false,
    val isLoadingMore: Boolean = false,
    val hasMore: Boolean = true,
    val errorMessage: String? = null,
)

class ServicesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var state = ServicesUiState()
        private set

    private val pageSize = 12
    private var currentPage = 1
    private var lastContextKey = ""

    fun loadInitial(language: String, currency: AppCurrency) {
        val contextKey = "$language|${currency.raw}"
        if (lastContextKey == contextKey && state.categories.isNotEmpty()) {
            return
        }

        lastContextKey = contextKey
        state = state.copy(isInitializing = true, errorMessage = null)

        viewModelScope.launch {
            runCatching {
                val categories = appContainer.marketplaceRepository.getCategories(language)
                val firstPage = appContainer.marketplaceRepository.getServices(
                    categoryId = null,
                    skills = emptyList(),
                    page = 1,
                    limit = pageSize,
                    language = language,
                    currency = currency,
                )
                categories to firstPage
            }.onSuccess { (categories, firstPage) ->
                state = state.copy(
                    categories = categories,
                    services = firstPage.services,
                    selectedCategoryId = "all",
                    isInitializing = false,
                    hasMore = firstPage.page < firstPage.totalPages,
                    errorMessage = null,
                )
                currentPage = 1
            }.onFailure { error ->
                state = state.copy(
                    categories = emptyList(),
                    services = emptyList(),
                    isInitializing = false,
                    hasMore = false,
                    errorMessage = error.message ?: "Unable to load services",
                )
            }
        }
    }

    fun refresh(language: String, currency: AppCurrency) {
        currentPage = 1
        state = state.copy(hasMore = true, errorMessage = null)
        loadServices(reset = true, language = language, currency = currency)
    }

    fun selectCategory(categoryId: String, language: String, currency: AppCurrency) {
        if (state.selectedCategoryId == categoryId) return

        currentPage = 1
        state = state.copy(
            selectedCategoryId = categoryId,
            hasMore = true,
            errorMessage = null,
        )
        loadServices(reset = true, language = language, currency = currency)
    }

    fun loadNextPageIfNeeded(language: String, currency: AppCurrency) {
        if (!state.hasMore || state.isLoadingPage || state.isLoadingMore || state.services.isEmpty()) {
            return
        }

        currentPage += 1
        loadServices(reset = false, language = language, currency = currency)
    }

    fun toggleWishlist(serviceId: String) {
        val next = state.wishlist.toMutableSet().apply {
            if (!add(serviceId)) remove(serviceId)
        }
        state = state.copy(wishlist = next)
    }

    private fun loadServices(reset: Boolean, language: String, currency: AppCurrency) {
        state = if (reset) {
            state.copy(isLoadingPage = true)
        } else {
            state.copy(isLoadingMore = true)
        }

        viewModelScope.launch {
            runCatching {
                appContainer.marketplaceRepository.getServices(
                    categoryId = state.selectedCategoryId.takeUnless { it == "all" },
                    skills = emptyList(),
                    page = currentPage,
                    limit = pageSize,
                    language = language,
                    currency = currency,
                )
            }.onSuccess { response ->
                state = if (reset) {
                    state.copy(
                        services = response.services,
                        isLoadingPage = false,
                        isLoadingMore = false,
                        hasMore = response.page < response.totalPages && response.services.isNotEmpty(),
                        errorMessage = null,
                    )
                } else {
                    val merged = state.services.toMutableList()
                    response.services.forEach { candidate ->
                        if (merged.none { it.id == candidate.id }) {
                            merged.add(candidate)
                        }
                    }
                    state.copy(
                        services = merged,
                        isLoadingPage = false,
                        isLoadingMore = false,
                        hasMore = response.page < response.totalPages && response.services.isNotEmpty(),
                    )
                }
            }.onFailure { error ->
                if (!reset) {
                    currentPage = (currentPage - 1).coerceAtLeast(1)
                }
                state = state.copy(
                    services = if (reset) emptyList() else state.services,
                    isLoadingPage = false,
                    isLoadingMore = false,
                    hasMore = false,
                    errorMessage = error.message ?: "Unable to load services",
                )
            }
        }
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ServicesViewModel(appContainer) as T
        }
    }
}

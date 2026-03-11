package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminEarlyAccessClientEntry
import com.trustora.app.core.models.AdminEarlyAccessPagination
import com.trustora.app.core.models.AdminEarlyAccessProviderEntry
import com.trustora.app.core.models.AdminEarlyAccessTab
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminEarlyAccessViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var selectedTab by mutableStateOf(AdminEarlyAccessTab.PROVIDERS)
    var providers by mutableStateOf<List<AdminEarlyAccessProviderEntry>>(emptyList())
        private set
    var clients by mutableStateOf<List<AdminEarlyAccessClientEntry>>(emptyList())
        private set
    var pagination by mutableStateOf<AdminEarlyAccessPagination?>(null)
        private set

    var isLoading by mutableStateOf(false)
        private set
    var isLoadingMore by mutableStateOf(false)
        private set
    var hasMorePages by mutableStateOf(true)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    private val defaultPageSize = 20
    private var currentPage = 1

    fun load(
        token: String,
        language: String,
        currency: AppCurrency,
        page: Int? = null,
        perPage: Int? = null,
        reset: Boolean = true,
    ) {
        if (reset) {
            if (isLoading) return
            currentPage = maxOf(1, page ?: 1)
            hasMorePages = true
            isLoading = true
            errorMessage = null
        } else {
            if (isLoading || isLoadingMore || !hasMorePages) return
            isLoadingMore = true
        }

        val requestedPage = maxOf(1, page ?: currentPage)
        val requestedPerPage = maxOf(1, perPage ?: pagination?.perPage ?: defaultPageSize)

        viewModelScope.launch {
            runCatching {
                val grouped = appContainer.dashboardRepository.getAdminEarlyAccessGrouped(
                    language = language,
                    currency = currency,
                    token = token,
                    page = requestedPage,
                    perPage = requestedPerPage,
                )

                var appendedCount = grouped.providers.size + grouped.clients.size
                if (reset) {
                    providers = grouped.providers
                    clients = grouped.clients
                } else {
                    val newProviders = grouped.providers.filter { next ->
                        providers.none { it.id == next.id }
                    }
                    val newClients = grouped.clients.filter { next ->
                        clients.none { it.id == next.id }
                    }
                    appendedCount = newProviders.size + newClients.size
                    providers = providers + newProviders
                    clients = clients + newClients
                }

                pagination = grouped.pagination
                currentPage = grouped.pagination?.currentPage ?: requestedPage
                hasMorePages = grouped.pagination?.let {
                    val canAdvance = it.currentPage < it.lastPage
                    if (reset) canAdvance else canAdvance && appendedCount > 0
                } ?: (grouped.providers.isNotEmpty() || grouped.clients.isNotEmpty())
            }.onFailure { error ->
                if (reset) {
                    providers = emptyList()
                    clients = emptyList()
                    pagination = null
                    hasMorePages = false
                } else {
                    currentPage = maxOf(1, currentPage - 1)
                }
                errorMessage = resolvedMessage(error)
            }

            if (reset) {
                isLoading = false
            } else {
                isLoadingMore = false
            }
        }
    }

    fun loadNextPage(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (!hasMorePages || isLoading || isLoadingMore) return
        currentPage += 1
        load(
            token = token,
            language = language,
            currency = currency,
            page = currentPage,
            perPage = pagination?.perPage ?: defaultPageSize,
            reset = false,
        )
    }

    private fun resolvedMessage(error: Throwable): String {
        if (error is HttpException) {
            val errorBody = runCatching { error.response()?.errorBody()?.string() }.getOrNull()
            if (!errorBody.isNullOrBlank()) {
                extractMessage(errorBody)?.let { return it }
            }
            return "HTTP ${error.code()}"
        }
        return error.message ?: "Unknown error"
    }

    private fun extractMessage(payload: String): String? {
        val root = runCatching { JsonParser.parseString(payload).asJsonObject }.getOrNull() ?: return payload
        val errors = root.objectOrNull("errors")
        if (errors != null) {
            errors.entrySet().forEach { (_, value) ->
                if (value.isJsonArray) {
                    value.asJsonArray.firstOrNull()?.asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
                }
                value.asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
            }
        }

        root.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        root.objectOrNull("data")?.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }

        return payload
    }

    private fun com.google.gson.JsonArray.firstOrNull(): com.google.gson.JsonElement? {
        return if (size() > 0) get(0) else null
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminEarlyAccessViewModel(appContainer) as T
        }
    }
}

package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminOrderSummary
import com.trustora.app.core.models.AdminProjectsStatusFilter
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminProjectsViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var allOrders by mutableStateOf<List<AdminOrderSummary>>(emptyList())
        private set
    var searchText by mutableStateOf("")
    var statusFilter by mutableStateOf(AdminProjectsStatusFilter.ALL)

    var isLoading by mutableStateOf(false)
        private set
    var isLoadingMore by mutableStateOf(false)
        private set
    var hasMorePages by mutableStateOf(true)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)
    var totalOrders by mutableStateOf(0)
        private set

    private val pageSize = 20
    private var currentPage = 1

    val filteredOrders: List<AdminOrderSummary>
        get() {
            val normalizedQuery = searchText.trim().lowercase()
            return allOrders.filter { order ->
                val matchesSearch = if (normalizedQuery.isEmpty()) {
                    true
                } else {
                    val fields = listOf(
                        order.orderNumber,
                        order.service?.title.orEmpty(),
                        order.service?.categoryName.orEmpty(),
                        order.client?.firstName.orEmpty(),
                        order.client?.lastName.orEmpty(),
                        order.client?.email.orEmpty(),
                        order.provider?.firstName.orEmpty(),
                        order.provider?.lastName.orEmpty(),
                        order.provider?.email.orEmpty(),
                        order.status,
                        order.paymentStatus,
                    )
                    fields.joinToString(" ").lowercase().contains(normalizedQuery)
                }

                val matchesStatus = statusFilter.statusValue?.let { expected ->
                    order.status.trim().uppercase() == expected
                } ?: true

                matchesSearch && matchesStatus
            }
        }

    fun load(
        token: String,
        language: String,
        currency: AppCurrency,
        reset: Boolean = true,
    ) {
        if (reset) {
            if (isLoading) return
            currentPage = 1
            hasMorePages = true
            isLoading = true
            errorMessage = null
        } else {
            if (isLoading || isLoadingMore || !hasMorePages) return
            isLoadingMore = true
        }

        viewModelScope.launch {
            runCatching {
                val collection = appContainer.dashboardRepository.getAdminOrders(
                    language = language,
                    currency = currency,
                    token = token,
                    page = currentPage,
                    perPage = pageSize,
                )

                val fetched = collection.orders
                var appendedCount = fetched.size
                if (reset) {
                    allOrders = fetched
                } else {
                    val newRows = fetched.filter { next ->
                        allOrders.none { it.id == next.id }
                    }
                    appendedCount = newRows.size
                    allOrders = allOrders + newRows
                }

                totalOrders = maxOf(collection.total, allOrders.size)
                currentPage = maxOf(1, collection.currentPage)
                val canAdvance = currentPage < collection.lastPage && fetched.isNotEmpty()
                hasMorePages = if (reset) canAdvance else (canAdvance && appendedCount > 0)
            }.onFailure { error ->
                if (reset) {
                    errorMessage = resolvedMessage(error)
                    allOrders = emptyList()
                    totalOrders = 0
                    hasMorePages = false
                } else {
                    currentPage = maxOf(1, currentPage - 1)
                    actionErrorMessage = resolvedMessage(error)
                }
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
            reset = false,
        )
    }

    fun loadOrderDetail(
        orderId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminOrderSummary?) -> Unit,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val order = runCatching {
                appContainer.dashboardRepository.getAdminOrderDetail(
                    orderId = orderId,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }
            onResult(order)
        }
    }

    fun updateOrder(
        orderId: String,
        status: String,
        adminNotes: String?,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (AdminOrderSummary?) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null
        viewModelScope.launch {
            val updated = runCatching {
                appContainer.dashboardRepository.updateAdminOrder(
                    orderId = orderId,
                    status = status,
                    adminNotes = adminNotes,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }

            if (updated != null) {
                load(
                    token = token,
                    language = language,
                    currency = currency,
                    reset = true,
                )
            }

            isSubmitting = false
            onCompleted(updated)
        }
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
            return AdminProjectsViewModel(appContainer) as T
        }
    }
}

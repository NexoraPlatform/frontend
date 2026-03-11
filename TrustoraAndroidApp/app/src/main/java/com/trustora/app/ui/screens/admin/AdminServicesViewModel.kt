package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminServiceDetail
import com.trustora.app.core.models.AdminServiceEditorDraft
import com.trustora.app.core.models.AdminServiceStatusAction
import com.trustora.app.core.models.AdminServiceSummary
import com.trustora.app.core.models.AdminServicesStatusFilter
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AdminServiceCategoryOption
import com.trustora.app.core.models.AdminDeliveryProviderOption
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminServicesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var allServices by mutableStateOf<List<AdminServiceSummary>>(emptyList())
        private set
    var searchText by mutableStateOf("")
    var statusFilter by mutableStateOf(AdminServicesStatusFilter.ALL)
    var categories by mutableStateOf<List<AdminServiceCategoryOption>>(emptyList())
        private set
    var deliveryProviders by mutableStateOf<List<AdminDeliveryProviderOption>>(emptyList())
        private set

    var isLoading by mutableStateOf(false)
        private set
    var isLoadingMore by mutableStateOf(false)
        private set
    var hasMorePages by mutableStateOf(true)
        private set
    var isLoadingFormMetadata by mutableStateOf(false)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)
    var totalServices by mutableStateOf(0)
        private set

    private val pageSize = 20
    private var currentPage = 1

    val filteredServices: List<AdminServiceSummary>
        get() {
            val normalizedQuery = searchText.trim().lowercase()
            return allServices.filter { service ->
                val matchesSearch = if (normalizedQuery.isEmpty()) {
                    true
                } else {
                    service.name.lowercase().contains(normalizedQuery) ||
                        service.description.lowercase().contains(normalizedQuery)
                }

                val matchesFilter = statusFilter.statusValue?.let { expected ->
                    val normalizedStatus = if (service.status.trim().uppercase() == "APPROVED") {
                        "ACTIVE"
                    } else {
                        service.status.trim().uppercase()
                    }
                    normalizedStatus == expected
                } ?: true

                matchesSearch && matchesFilter
            }
        }

    fun load(
        token: String,
        language: String,
        currency: AppCurrency,
        includeMetadata: Boolean = true,
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
                val collection = appContainer.dashboardRepository.getAdminServices(
                    language = language,
                    currency = currency,
                    token = token,
                    page = currentPage,
                    perPage = pageSize,
                )
                val fetched = collection.services
                var appendedCount = fetched.size
                if (reset) {
                    allServices = fetched
                } else {
                    val newRows = fetched.filter { next ->
                        allServices.none { it.id == next.id }
                    }
                    appendedCount = newRows.size
                    allServices = allServices + newRows
                }

                totalServices = maxOf(collection.total, allServices.size)
                currentPage = maxOf(1, collection.currentPage)
                val canAdvance = currentPage < collection.lastPage && fetched.isNotEmpty()
                hasMorePages = if (reset) canAdvance else (canAdvance && appendedCount > 0)
            }.onFailure { error ->
                if (reset) {
                    errorMessage = resolvedMessage(error)
                    allServices = emptyList()
                    totalServices = 0
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

            if (includeMetadata && reset) {
                loadFormMetadataInternal(
                    token = token,
                    language = language,
                    currency = currency,
                )
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
            includeMetadata = false,
            reset = false,
        )
    }

    fun loadFormMetadata(
        token: String,
        language: String,
        currency: AppCurrency,
        onFinished: (() -> Unit)? = null,
    ) {
        viewModelScope.launch {
            loadFormMetadataInternal(
                token = token,
                language = language,
                currency = currency,
            )
            onFinished?.invoke()
        }
    }

    fun loadServiceDetail(
        serviceId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminServiceDetail?) -> Unit,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val detail = runCatching {
                appContainer.dashboardRepository.getAdminServiceDetail(
                    serviceId = serviceId,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }
            onResult(detail)
        }
    }

    fun loadCategorySlug(
        categoryId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (String?) -> Unit,
    ) {
        val trimmed = categoryId.trim()
        if (trimmed.isEmpty()) {
            onResult(null)
            return
        }

        viewModelScope.launch {
            val slug = runCatching {
                appContainer.dashboardRepository.getAdminServiceCategorySlug(
                    categoryId = trimmed,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrNull()
            onResult(slug)
        }
    }

    fun createService(
        draft: AdminServiceEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.createAdminService(
                    draft = draft,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                load(
                    token = token,
                    language = language,
                    currency = currency,
                    includeMetadata = false,
                    reset = true,
                )
            }
            isSubmitting = false
            onCompleted(success)
        }
    }

    fun updateService(
        serviceId: String,
        draft: AdminServiceEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.updateAdminService(
                    serviceId = serviceId,
                    draft = draft,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                load(
                    token = token,
                    language = language,
                    currency = currency,
                    includeMetadata = false,
                    reset = true,
                )
            }
            isSubmitting = false
            onCompleted(success)
        }
    }

    fun performStatusAction(
        action: AdminServiceStatusAction,
        service: AdminServiceSummary,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.updateAdminServiceStatus(
                    serviceId = service.id,
                    action = action,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                load(
                    token = token,
                    language = language,
                    currency = currency,
                    includeMetadata = false,
                    reset = true,
                )
            }
        }
    }

    fun deleteService(
        service: AdminServiceSummary,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.deleteAdminService(
                    serviceId = service.id,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                load(
                    token = token,
                    language = language,
                    currency = currency,
                    includeMetadata = false,
                    reset = true,
                )
            }
        }
    }

    private suspend fun loadFormMetadataInternal(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoadingFormMetadata) {
            return
        }
        isLoadingFormMetadata = true

        runCatching {
            coroutineScope {
                val categoriesTask = async {
                    appContainer.dashboardRepository.getAdminServiceCategories(
                        language = language,
                        token = token,
                    )
                }
                val providersTask = async {
                    appContainer.dashboardRepository.getAdminServiceDeliveryProviders(
                        language = language,
                        currency = currency,
                        token = token,
                    )
                }

                categories = categoriesTask.await()
                deliveryProviders = providersTask.await()
            }
        }.onFailure { error ->
            actionErrorMessage = resolvedMessage(error)
        }

        isLoadingFormMetadata = false
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
            return AdminServicesViewModel(appContainer) as T
        }
    }
}

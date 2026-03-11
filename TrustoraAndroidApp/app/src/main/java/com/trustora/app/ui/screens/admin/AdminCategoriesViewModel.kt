package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminCategoryDetail
import com.trustora.app.core.models.AdminCategoryEditorDraft
import com.trustora.app.core.models.AdminCategorySummary
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminCategoriesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var allCategories by mutableStateOf<List<AdminCategorySummary>>(emptyList())
        private set
    var searchText by mutableStateOf("")

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
    var totalCategories by mutableStateOf(0)
        private set

    private val pageSize = 20
    private var currentPage = 1

    val filteredCategories: List<AdminCategorySummary>
        get() {
            val normalizedQuery = searchText.trim().lowercase()
            if (normalizedQuery.isEmpty()) {
                return allCategories
            }
            return allCategories.filter { category ->
                category.name.lowercase().contains(normalizedQuery) ||
                    category.description.lowercase().contains(normalizedQuery) ||
                    category.slug.lowercase().contains(normalizedQuery)
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
                val collection = appContainer.dashboardRepository.getAdminCategories(
                    language = language,
                    currency = currency,
                    token = token,
                    page = currentPage,
                    perPage = pageSize,
                )
                val fetched = collection.categories
                var appendedCount = fetched.size
                if (reset) {
                    allCategories = fetched
                } else {
                    val newRows = fetched.filter { next ->
                        allCategories.none { it.id == next.id }
                    }
                    appendedCount = newRows.size
                    allCategories = allCategories + newRows
                }

                totalCategories = maxOf(collection.total, allCategories.size)
                currentPage = maxOf(1, collection.currentPage)
                val canAdvance = currentPage < collection.lastPage && fetched.isNotEmpty()
                hasMorePages = if (reset) canAdvance else (canAdvance && appendedCount > 0)
            }.onFailure { error ->
                if (reset) {
                    errorMessage = resolvedMessage(error)
                    allCategories = emptyList()
                    totalCategories = 0
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

    fun loadCategoryDetail(
        categoryId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminCategoryDetail?) -> Unit,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val detail = runCatching {
                appContainer.dashboardRepository.getAdminCategoryDetail(
                    categoryId = categoryId,
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
                appContainer.dashboardRepository.getAdminCategorySlug(
                    categoryId = trimmed,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrNull()
            onResult(slug)
        }
    }

    fun createCategory(
        draft: AdminCategoryEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.createAdminCategory(
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
                    reset = true,
                )
            }
            isSubmitting = false
            onCompleted(success)
        }
    }

    fun updateCategory(
        categoryId: String,
        draft: AdminCategoryEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.updateAdminCategory(
                    categoryId = categoryId,
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
                    reset = true,
                )
            }
            isSubmitting = false
            onCompleted(success)
        }
    }

    fun deleteCategory(
        category: AdminCategorySummary,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.deleteAdminCategory(
                    categoryId = category.id,
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
                    reset = true,
                )
            }
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
            return AdminCategoriesViewModel(appContainer) as T
        }
    }
}

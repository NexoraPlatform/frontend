package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminLegalClause
import com.trustora.app.core.models.AdminLegalClauseEditorDraft
import com.trustora.app.core.models.AdminLegalClausePayload
import com.trustora.app.core.models.AdminLegalClauseUpdatePayload
import com.trustora.app.core.models.AdminLegalClausesSortBy
import com.trustora.app.core.models.AdminLegalClausesSortDirection
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminLegalClausesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var clauses by mutableStateOf<List<AdminLegalClause>>(emptyList())
        private set
    var categories by mutableStateOf<List<String>>(emptyList())
        private set

    var searchText by mutableStateOf("")
    var identifierFilter by mutableStateOf("")
    var categoryFilter by mutableStateOf("")
    var sortBy by mutableStateOf(AdminLegalClausesSortBy.CREATED_AT)
    var sortDirection by mutableStateOf(AdminLegalClausesSortDirection.DESCENDING)
    var perPage by mutableStateOf(15)
    var languageFilter by mutableStateOf("all")
    var page by mutableStateOf(1)
    var totalClauses by mutableStateOf(0)
        private set
    var lastPage by mutableStateOf(1)
        private set

    var isLoading by mutableStateOf(false)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var isLoadingCategories by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)

    val filteredClauses: List<AdminLegalClause>
        get() {
            if (languageFilter == "all") return clauses
            return clauses.filter { clause ->
                clause.content[languageFilter]?.trim()?.isNotEmpty() == true
            }
        }

    val hasPreviousPage: Boolean
        get() = page > 1

    val hasNextPage: Boolean
        get() = page < lastPage

    fun load(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoading) return

        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            runCatching {
                val collection = appContainer.dashboardRepository.getAdminLegalClauses(
                    language = language,
                    currency = currency,
                    token = token,
                    params = queryParams(),
                )
                clauses = collection.clauses
                totalClauses = collection.total
                lastPage = maxOf(1, collection.lastPage)
                page = maxOf(1, collection.currentPage)
                if (collection.perPage > 0) {
                    perPage = collection.perPage
                }
            }.onFailure { error ->
                clauses = emptyList()
                totalClauses = 0
                lastPage = 1
                errorMessage = resolvedMessage(error)
            }

            isLoading = false
        }
    }

    fun loadCategories(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoadingCategories) return
        isLoadingCategories = true

        viewModelScope.launch {
            runCatching {
                appContainer.dashboardRepository.getAdminLegalClauseCategories(
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.onSuccess { fetched ->
                categories = fetched
            }.onFailure { error ->
                actionErrorMessage = resolvedMessage(error)
            }

            isLoadingCategories = false
        }
    }

    fun loadClauseDetail(
        clauseId: String,
        languageFilter: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminLegalClause?) -> Unit,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val clause = runCatching {
                appContainer.dashboardRepository.getAdminLegalClause(
                    clauseId = clauseId,
                    languageFilter = languageFilter,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }
            onResult(clause)
        }
    }

    fun createClause(
        draft: AdminLegalClauseEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val payload = AdminLegalClausePayload(
                identifier = draft.identifier,
                category = draft.category,
                content = draft.trimmedContentPayload(),
            )

            val success = runCatching {
                appContainer.dashboardRepository.createAdminLegalClause(
                    payloadData = payload,
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
                page = 1
                load(
                    token = token,
                    language = language,
                    currency = currency,
                )
            }

            isSubmitting = false
            onCompleted(success)
        }
    }

    fun updateClause(
        clauseId: String,
        draft: AdminLegalClauseEditorDraft,
        languageCode: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val text = draft.textFor(languageCode).trim()
            val payload = AdminLegalClauseUpdatePayload(
                identifier = draft.identifier,
                category = draft.category,
                content = mapOf(languageCode to text),
            )

            val success = runCatching {
                appContainer.dashboardRepository.updateAdminLegalClause(
                    clauseId = clauseId,
                    payloadData = payload,
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
                )
            }

            isSubmitting = false
            onCompleted(success)
        }
    }

    fun deleteClause(
        clause: AdminLegalClause,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        actionErrorMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.deleteAdminLegalClause(
                    clauseId = clause.id,
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
                if (clauses.size == 1 && page > 1) {
                    page -= 1
                }
                load(
                    token = token,
                    language = language,
                    currency = currency,
                )
            }

            onCompleted(success)
        }
    }

    fun resetFilters() {
        searchText = ""
        identifierFilter = ""
        categoryFilter = ""
        sortBy = AdminLegalClausesSortBy.CREATED_AT
        sortDirection = AdminLegalClausesSortDirection.DESCENDING
        perPage = 15
        languageFilter = "all"
        page = 1
    }

    private fun queryParams(): Map<String, String?> {
        return mapOf(
            "search" to searchText.trim().ifEmpty { null },
            "category" to categoryFilter.trim().ifEmpty { null },
            "identifier" to identifierFilter.trim().ifEmpty { null },
            "sort_by" to sortBy.rawValue,
            "sort_dir" to sortDirection.rawValue,
            "per_page" to perPage.toString(),
            "lang" to if (languageFilter == "all") null else languageFilter,
            "page" to page.toString(),
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
                if (value.isJsonArray && value.asJsonArray.size() > 0) {
                    value.asJsonArray[0].asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
                }
                value.asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
            }
        }

        root.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        root.objectOrNull("data")?.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }

        return payload
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminLegalClausesViewModel(appContainer) as T
        }
    }
}

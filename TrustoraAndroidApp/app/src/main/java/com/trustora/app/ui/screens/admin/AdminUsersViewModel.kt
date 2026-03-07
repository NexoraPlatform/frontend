package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminCreateUserPayload
import com.trustora.app.core.models.AdminUserListItem
import com.trustora.app.core.models.AdminUsersRoleFilter
import com.trustora.app.core.models.AdminUserStatusAction
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.arrayOrNull
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminUsersViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var allUsers by mutableStateOf<List<AdminUserListItem>>(emptyList())
        private set
    var searchText by mutableStateOf("")
    var roleFilter by mutableStateOf(AdminUsersRoleFilter.ALL)
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
    var totalUsers by mutableStateOf(0)
        private set

    private val pageSize = 30
    private var currentPage = 1

    val filteredUsers: List<AdminUserListItem>
        get() {
            val normalizedQuery = searchText.trim().lowercase()
            return allUsers.filter { user ->
                val matchesSearch = if (normalizedQuery.isEmpty()) {
                    true
                } else {
                    user.firstName.lowercase().contains(normalizedQuery) ||
                        user.lastName.lowercase().contains(normalizedQuery) ||
                        user.email.lowercase().contains(normalizedQuery)
                }

                val matchesFilter = roleFilter.roleSlug?.let(user::hasRole) ?: true
                matchesSearch && matchesFilter
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
                val collection = appContainer.dashboardRepository.getAdminUsers(
                    language = language,
                    currency = currency,
                    token = token,
                    page = currentPage,
                    perPage = pageSize,
                )

                val fetched = collection.users
                var appendedCount = fetched.size
                if (reset) {
                    allUsers = fetched
                } else {
                    val newRows = fetched.filter { next ->
                        allUsers.none { it.id == next.id }
                    }
                    appendedCount = newRows.size
                    allUsers = allUsers + newRows
                }

                totalUsers = maxOf(collection.total, allUsers.size)
                val resolvedPage = maxOf(1, collection.page ?: currentPage)
                val resolvedPerPage = maxOf(1, collection.perPage ?: pageSize)
                val resolvedLastPage = collection.lastPage
                    ?: ((maxOf(1, totalUsers) + resolvedPerPage - 1) / resolvedPerPage)
                val canAdvance = resolvedPage < resolvedLastPage && fetched.isNotEmpty()
                hasMorePages = if (reset) canAdvance else canAdvance && appendedCount > 0
                currentPage = resolvedPage
            }.onFailure { error ->
                if (reset) {
                    errorMessage = resolvedMessage(error)
                    allUsers = emptyList()
                    totalUsers = 0
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

    fun createUser(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        role: String,
        phone: String?,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        val payload = AdminCreateUserPayload(
            firstName = firstName,
            lastName = lastName,
            email = email,
            password = password,
            role = role.uppercase(),
            phone = phone?.trim()?.takeIf { it.isNotEmpty() },
        )

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.createAdminUser(
                    payload = payload,
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

    fun performStatusAction(
        action: AdminUserStatusAction,
        user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.updateAdminUserStatus(
                    userId = user.id,
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
                load(token = token, language = language, currency = currency, reset = true)
            }
        }
    }

    fun deleteUser(
        user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.deleteAdminUser(
                    userId = user.id,
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
                load(token = token, language = language, currency = currency, reset = true)
            }
        }
    }

    fun toggleSuperuser(
        user: AdminUserListItem,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.setAdminUserSuperuser(
                    userId = user.id,
                    isSuperuser = user.isSuperuser,
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
                load(token = token, language = language, currency = currency, reset = true)
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
            return AdminUsersViewModel(appContainer) as T
        }
    }
}

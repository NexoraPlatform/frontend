package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminActivityEntry
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminActivitiesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var activities by mutableStateOf<List<AdminActivityEntry>>(emptyList())
        private set
    var page by mutableStateOf(1)
    var lastPage by mutableStateOf(1)
        private set
    var total by mutableStateOf(0)
        private set
    var perPage by mutableStateOf(0)
        private set

    var isLoading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    val canGoPrevious: Boolean
        get() = page > 1

    val canGoNext: Boolean
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
                val response = appContainer.dashboardRepository.getAdminActivities(
                    page = page,
                    language = language,
                    currency = currency,
                    token = token,
                )
                activities = response.activities
                total = response.total
                perPage = response.perPage
                page = maxOf(1, response.currentPage)
                lastPage = maxOf(1, response.lastPage)
            }.onFailure { error ->
                activities = emptyList()
                total = 0
                perPage = 0
                lastPage = 1
                errorMessage = resolvedMessage(error)
            }

            isLoading = false
        }
    }

    fun goToPreviousPage() {
        if (page > 1) {
            page -= 1
        }
    }

    fun goToNextPage() {
        if (page < lastPage) {
            page += 1
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
        root.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        root.objectOrNull("data")?.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        return payload
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminActivitiesViewModel(appContainer) as T
        }
    }
}

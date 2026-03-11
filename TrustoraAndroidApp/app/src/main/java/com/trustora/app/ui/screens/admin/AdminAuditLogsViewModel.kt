package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminAuditLogDiffItem
import com.trustora.app.core.models.AdminAuditLogEntry
import com.trustora.app.core.models.AdminAuditLogEventFilter
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminAuditLogsViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var logs by mutableStateOf<List<AdminAuditLogEntry>>(emptyList())
        private set
    var page by mutableStateOf(1)
    var lastPage by mutableStateOf(1)
        private set
    var total by mutableStateOf(0)
        private set

    var selectedEvent by mutableStateOf(AdminAuditLogEventFilter.ALL)
    var userSearchText by mutableStateOf("")
    var appliedUserId by mutableStateOf<Int?>(null)
        private set
    var dateFrom by mutableStateOf(LocalDate.now(ZoneOffset.UTC).minusDays(30))
    var dateTo by mutableStateOf(LocalDate.now(ZoneOffset.UTC))

    var expandedLogIds by mutableStateOf<Set<String>>(emptySet())
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
                val normalizedRange = normalizedDateRange()
                val response = appContainer.dashboardRepository.getAdminAuditLogs(
                    page = page,
                    event = selectedEvent.value,
                    userId = appliedUserId,
                    subjectType = null,
                    dateFrom = normalizedRange.first.format(queryDateFormatter),
                    dateTo = normalizedRange.second.format(queryDateFormatter),
                    language = language,
                    currency = currency,
                    token = token,
                )

                logs = response.logs
                total = response.total
                page = maxOf(1, response.currentPage)
                lastPage = maxOf(1, response.lastPage)
                val visibleIds = logs.map { it.id }.toSet()
                expandedLogIds = expandedLogIds.intersect(visibleIds)
            }.onFailure { error ->
                logs = emptyList()
                total = 0
                lastPage = 1
                expandedLogIds = emptySet()
                errorMessage = resolvedMessage(error)
            }

            isLoading = false
        }
    }

    fun applySearch() {
        val trimmed = userSearchText.trim()
        if (trimmed.isEmpty()) {
            appliedUserId = null
            page = 1
            return
        }
        trimmed.toIntOrNull()?.let { userId ->
            appliedUserId = userId
            page = 1
        }
    }

    fun clearSearch() {
        userSearchText = ""
        appliedUserId = null
        page = 1
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

    fun toggleExpanded(logId: String) {
        expandedLogIds = if (expandedLogIds.contains(logId)) {
            expandedLogIds - logId
        } else {
            expandedLogIds + logId
        }
    }

    fun isExpanded(logId: String): Boolean = expandedLogIds.contains(logId)

    fun diffItems(log: AdminAuditLogEntry): List<AdminAuditLogDiffItem> {
        val keys = (log.oldValues.keys + log.newValues.keys).toSortedSet()
        return keys.mapNotNull { key ->
            val oldValue = log.oldValues[key]
            val newValue = log.newValues[key]
            if (oldValue == newValue) {
                null
            } else {
                AdminAuditLogDiffItem(
                    key = key,
                    oldValue = oldValue,
                    newValue = newValue,
                )
            }
        }
    }

    private fun normalizedDateRange(): Pair<LocalDate, LocalDate> {
        return if (dateFrom <= dateTo) {
            dateFrom to dateTo
        } else {
            dateTo to dateFrom
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
            return AdminAuditLogsViewModel(appContainer) as T
        }
    }

    companion object {
        private val queryDateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    }
}

package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminCallSummary
import com.trustora.app.core.models.AdminCallsDateRangeFilter
import com.trustora.app.core.models.AdminCallsPassedFilter
import com.trustora.app.core.models.AdminCallsStatusFilter
import com.trustora.app.core.models.AdminTestStatistics
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminCallsViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var allCalls by mutableStateOf<List<AdminCallSummary>>(emptyList())
        private set
    var searchText by mutableStateOf("")
    var passedFilter by mutableStateOf(AdminCallsPassedFilter.ALL)
    var statusFilter by mutableStateOf(AdminCallsStatusFilter.ALL)
    var dateFilter by mutableStateOf(AdminCallsDateRangeFilter.ALL)

    var isLoading by mutableStateOf(false)
        private set
    var isLoadingMore by mutableStateOf(false)
        private set
    var hasMorePages by mutableStateOf(true)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var isLoadingStatistics by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)
    var totalCalls by mutableStateOf(0)
        private set

    private val pageSize = 20
    private var currentPage = 1

    val filteredCalls: List<AdminCallSummary>
        get() {
            val normalizedQuery = searchText.trim().lowercase()
            val now = Instant.now()

            return allCalls.filter { call ->
                val matchesSearch = if (normalizedQuery.isEmpty()) {
                    true
                } else {
                    val fields = listOf(
                        call.attendee?.firstName.orEmpty(),
                        call.attendee?.lastName.orEmpty(),
                        call.attendee?.email.orEmpty(),
                        call.interviewer?.firstName.orEmpty(),
                        call.interviewer?.lastName.orEmpty(),
                        call.interviewer?.email.orEmpty(),
                        call.service?.title.orEmpty(),
                        call.service?.categoryName.orEmpty(),
                        call.status,
                    )
                    fields.joinToString(" ").lowercase().contains(normalizedQuery)
                }

                val matchesPassed = passedFilter.value?.let { expected ->
                    call.passedValue == expected
                } ?: true

                val matchesStatus = statusFilter.statusValue?.let { expected ->
                    call.status.trim().uppercase() == expected
                } ?: true

                val matchesDate = when (dateFilter) {
                    AdminCallsDateRangeFilter.ALL -> true
                    AdminCallsDateRangeFilter.TODAY -> {
                        parseInstant(call.dateTimeIso)?.let { instant ->
                            instant.atZone(ZoneId.systemDefault()).toLocalDate() ==
                                now.atZone(ZoneId.systemDefault()).toLocalDate()
                        } ?: false
                    }

                    AdminCallsDateRangeFilter.LAST_7_DAYS -> {
                        parseInstant(call.dateTimeIso)?.let { instant ->
                            !instant.isBefore(now.minus(7, ChronoUnit.DAYS))
                        } ?: false
                    }

                    AdminCallsDateRangeFilter.LAST_30_DAYS -> {
                        parseInstant(call.dateTimeIso)?.let { instant ->
                            !instant.isBefore(now.minus(30, ChronoUnit.DAYS))
                        } ?: false
                    }
                }

                matchesSearch && matchesPassed && matchesStatus && matchesDate
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
                val collection = appContainer.dashboardRepository.getAdminCalls(
                    language = language,
                    currency = currency,
                    token = token,
                    page = currentPage,
                    perPage = pageSize,
                )

                val fetched = collection.calls
                var appendedCount = fetched.size
                if (reset) {
                    allCalls = fetched
                } else {
                    val newRows = fetched.filter { next ->
                        allCalls.none { it.id == next.id }
                    }
                    appendedCount = newRows.size
                    allCalls = allCalls + newRows
                }

                totalCalls = maxOf(collection.total, allCalls.size)
                currentPage = maxOf(1, collection.currentPage)
                val canAdvance = currentPage < collection.lastPage && fetched.isNotEmpty()
                hasMorePages = if (reset) canAdvance else (canAdvance && appendedCount > 0)
            }.onFailure { error ->
                if (reset) {
                    errorMessage = resolvedMessage(error)
                    allCalls = emptyList()
                    totalCalls = 0
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

    fun updateStatus(
        call: AdminCallSummary,
        status: String,
        note: String?,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null
        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.updateAdminCallStatus(
                    callId = call.id,
                    status = status,
                    note = note,
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

    fun loadTestStatistics(
        testId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminTestStatistics?) -> Unit,
    ) {
        val trimmed = testId.trim()
        if (trimmed.isEmpty()) {
            onResult(null)
            return
        }

        isLoadingStatistics = true
        actionErrorMessage = null
        viewModelScope.launch {
            val statistics = runCatching {
                appContainer.dashboardRepository.getAdminTestStatistics(
                    testId = trimmed,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }
            isLoadingStatistics = false
            onResult(statistics)
        }
    }

    private fun parseInstant(raw: String?): Instant? {
        val value = raw?.trim().orEmpty()
        if (value.isEmpty()) return null
        return runCatching { Instant.parse(value) }.getOrNull()
            ?: runCatching { OffsetDateTime.parse(value).toInstant() }.getOrNull()
            ?: runCatching { LocalDateTime.parse(value).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
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
            return AdminCallsViewModel(appContainer) as T
        }
    }
}

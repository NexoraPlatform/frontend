@file:OptIn(
    androidx.compose.material3.ExperimentalMaterial3Api::class,
    androidx.compose.foundation.layout.ExperimentalLayoutApi::class,
)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ViewList
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.NoAccounts
import androidx.compose.material.icons.filled.PersonOff
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminCallSummary
import com.trustora.app.core.models.AdminCallsDateRangeFilter
import com.trustora.app.core.models.AdminCallsPassedFilter
import com.trustora.app.core.models.AdminCallsStatusFilter
import com.trustora.app.core.models.AdminTestQuestionResult
import com.trustora.app.core.models.AdminTestStatistics
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun AdminCallsScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminCallsViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")
    val uriHandler = LocalUriHandler.current

    var refuseCall by remember { mutableStateOf<AdminCallSummary?>(null) }
    var refuseReason by remember { mutableStateOf("") }
    var selectedStatistics by remember { mutableStateOf<AdminTestStatistics?>(null) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        if (canAccessAdmin) {
            viewModel.load(
                token = token,
                language = languageCode,
                currency = currency,
                reset = true,
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
        ) {
            AdminCallsTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminCallsUnavailableState(languageCode = languageCode)
            } else {
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = viewModel.isLoading,
                    onRefresh = {
                        viewModel.load(
                            token = token,
                            language = languageCode,
                            currency = currency,
                            reset = true,
                        )
                    },
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        AdminCallsHeaderCard(languageCode = languageCode)
                        AdminCallsFiltersCard(
                            languageCode = languageCode,
                            searchText = viewModel.searchText,
                            onSearchTextChanged = { viewModel.searchText = it },
                            passedFilter = viewModel.passedFilter,
                            onPassedFilterChanged = { viewModel.passedFilter = it },
                            statusFilter = viewModel.statusFilter,
                            onStatusFilterChanged = { viewModel.statusFilter = it },
                            dateFilter = viewModel.dateFilter,
                            onDateFilterChanged = { viewModel.dateFilter = it },
                        )
                        AdminCallsListCard(
                            languageCode = languageCode,
                            calls = viewModel.filteredCalls,
                            isLoading = viewModel.isLoading,
                            isLoadingMore = viewModel.isLoadingMore,
                            hasMorePages = viewModel.hasMorePages,
                            errorMessage = viewModel.errorMessage,
                            actionErrorMessage = viewModel.actionErrorMessage,
                            onRetry = {
                                viewModel.load(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                    reset = true,
                                )
                            },
                            onLoadMore = {
                                viewModel.loadNextPage(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onOpenCallUrl = { callUrl ->
                                runCatching {
                                    uriHandler.openUri(callUrl)
                                }.onFailure {
                                    viewModel.actionErrorMessage = callsString("admin.calls.open_url_failed", languageCode)
                                }
                            },
                            onOpenTestStatistics = { testId ->
                                viewModel.loadTestStatistics(
                                    testId = testId,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                ) { statistics ->
                                    if (statistics != null) {
                                        selectedStatistics = statistics
                                    }
                                }
                            },
                            onMoveStatus = { call, status ->
                                viewModel.updateStatus(
                                    call = call,
                                    status = status,
                                    note = null,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                    onCompleted = {},
                                )
                            },
                            onRefuse = { call ->
                                refuseReason = ""
                                refuseCall = call
                            },
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        if (viewModel.isLoadingStatistics) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(TrustoraSurface)
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.4.dp, color = TrustoraPrimary)
                    Text(
                        text = callsString("admin.loading", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    refuseCall?.let { target ->
        AdminCallRefuseSheet(
            languageCode = languageCode,
            call = target,
            reason = refuseReason,
            onReasonChanged = { refuseReason = it },
            isSubmitting = viewModel.isSubmitting,
            onDismiss = {
                refuseCall = null
                refuseReason = ""
            },
            onConfirm = {
                viewModel.updateStatus(
                    call = target,
                    status = "REFUSED",
                    note = refuseReason,
                    token = token,
                    language = languageCode,
                    currency = currency,
                ) { success ->
                    if (success) {
                        refuseCall = null
                        refuseReason = ""
                    }
                }
            },
        )
    }

    selectedStatistics?.let { statistics ->
        AdminCallStatisticsSheet(
            languageCode = languageCode,
            statistics = statistics,
            onDismiss = { selectedStatistics = null },
        )
    }
}

@Composable
private fun AdminCallsTopBar(
    languageCode: String,
    onBack: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .clickable(onClick = onBack)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = TrustoraPrimary)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = callsString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = callsString("admin.calls.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(32.dp))
    }
}

@Composable
private fun AdminCallsUnavailableState(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = Icons.Filled.LockPerson,
            contentDescription = null,
            tint = TrustoraPrimary,
            modifier = Modifier.size(36.dp),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = callsString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = callsString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminCallsHeaderCard(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = callsString("admin.calls.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = callsString("admin.calls.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminCallsFiltersCard(
    languageCode: String,
    searchText: String,
    onSearchTextChanged: (String) -> Unit,
    passedFilter: AdminCallsPassedFilter,
    onPassedFilterChanged: (AdminCallsPassedFilter) -> Unit,
    statusFilter: AdminCallsStatusFilter,
    onStatusFilterChanged: (AdminCallsStatusFilter) -> Unit,
    dateFilter: AdminCallsDateRangeFilter,
    onDateFilterChanged: (AdminCallsDateRangeFilter) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        OutlinedTextField(
            value = searchText,
            onValueChange = onSearchTextChanged,
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            leadingIcon = {
                Icon(Icons.Filled.Search, contentDescription = null, tint = TrustoraTertiaryText)
            },
            placeholder = {
                Text(callsString("admin.calls.search_placeholder", languageCode))
            },
            singleLine = true,
        )

        Text(
            text = callsString("admin.calls.filters.passed.label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminCallsPassedFilter.entries.forEach { filter ->
                FilterChip(
                    text = callsString(filter.titleKey, languageCode),
                    selected = filter == passedFilter,
                    onTap = { onPassedFilterChanged(filter) },
                )
            }
        }

        Text(
            text = callsString("admin.calls.filters.status.label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminCallsStatusFilter.entries.forEach { filter ->
                FilterChip(
                    text = callsString(filter.titleKey, languageCode),
                    selected = filter == statusFilter,
                    onTap = { onStatusFilterChanged(filter) },
                )
            }
        }

        Text(
            text = callsString("admin.calls.filters.date.label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminCallsDateRangeFilter.entries.forEach { filter ->
                FilterChip(
                    text = callsString(filter.titleKey, languageCode),
                    selected = filter == dateFilter,
                    onTap = { onDateFilterChanged(filter) },
                )
            }
        }
    }
}

@Composable
private fun FilterChip(
    text: String,
    selected: Boolean,
    onTap: () -> Unit,
) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = if (selected) Color(0xFF052E16) else TrustoraSecondaryText,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selected) TrustoraAccent.copy(alpha = 0.28f) else TrustoraSurface)
            .border(
                width = 1.dp,
                color = if (selected) TrustoraAccent else TrustoraBorder,
                shape = CircleShape,
            )
            .clickable(onClick = onTap)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun AdminCallsListCard(
    languageCode: String,
    calls: List<AdminCallSummary>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    hasMorePages: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    onOpenCallUrl: (String) -> Unit,
    onOpenTestStatistics: (String) -> Unit,
    onMoveStatus: (AdminCallSummary, String) -> Unit,
    onRefuse: (AdminCallSummary) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Filled.Phone, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = callsString("admin.calls.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = callsTemplate(
                callsString("admin.calls.list_description", languageCode),
                mapOf("count" to calls.size.toString()),
            ),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        if (!actionErrorMessage.isNullOrBlank()) {
            Text(
                text = actionErrorMessage,
                color = Color(0xFFB91C1C),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFFEF2F2))
                    .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                    .padding(10.dp),
            )
        }

        when {
            !errorMessage.isNullOrBlank() -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFB91C1C),
                    )
                    Button(
                        onClick = onRetry,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TrustoraMutedSurface,
                            contentColor = TrustoraPrimary,
                        ),
                    ) {
                        Text(callsString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            calls.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.NoAccounts, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = callsString("admin.calls.no_calls_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = callsString("admin.calls.no_calls_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    calls.forEachIndexed { index, call ->
                        AdminCallRow(
                            languageCode = languageCode,
                            call = call,
                            onOpenCallUrl = onOpenCallUrl,
                            onOpenTestStatistics = onOpenTestStatistics,
                            onMoveStatus = onMoveStatus,
                            onRefuse = onRefuse,
                        )

                        if (index == calls.lastIndex) {
                            LaunchedEffect(call.id, hasMorePages, isLoadingMore) {
                                if (hasMorePages && !isLoadingMore) {
                                    onLoadMore()
                                }
                            }
                        }
                    }
                }

                if (isLoadingMore) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.1.dp)
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminCallRow(
    languageCode: String,
    call: AdminCallSummary,
    onOpenCallUrl: (String) -> Unit,
    onOpenTestStatistics: (String) -> Unit,
    onMoveStatus: (AdminCallSummary, String) -> Unit,
    onRefuse: (AdminCallSummary) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = call.attendee?.fullName ?: "-",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    AdminCallStatusBadge(status = call.status, languageCode = languageCode)
                }

                val interviewer = call.interviewer?.fullName.orEmpty()
                if (interviewer.isNotEmpty()) {
                    Text(
                        text = "${callsString("admin.calls.interviewer_prefix", languageCode)} $interviewer",
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }

            AdminCallActionsMenu(
                languageCode = languageCode,
                call = call,
                onOpenCallUrl = onOpenCallUrl,
                onOpenTestStatistics = onOpenTestStatistics,
                onMoveStatus = onMoveStatus,
                onRefuse = onRefuse,
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = "${callsString("admin.calls.service_prefix", languageCode)} ${call.service?.title ?: "-"}",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(TrustoraBorder),
            )
            Text(
                text = "${callsString("admin.calls.category_prefix", languageCode)} ${call.service?.categoryName ?: "-"}",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
        }

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminCallPill(
                icon = { Icon(Icons.Filled.Event, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                text = scheduledLabel(call.dateTimeIso, languageCode),
            )

            call.testResult?.let { testResult ->
                AdminCallPill(
                    icon = { Icon(Icons.Filled.BarChart, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                    text = "${callsString("admin.calls.passing_score_prefix", languageCode)} ${testResult.score.toInt()}%",
                )
            }

            call.passedValue?.let { passed ->
                val passedText = if (passed == 1) {
                    callsString("admin.calls.filters.passed.yes", languageCode)
                } else {
                    callsString("admin.calls.filters.passed.no", languageCode)
                }
                AdminCallPill(
                    icon = {
                        Icon(
                            if (passed == 1) Icons.Filled.CheckCircle else Icons.Filled.Cancel,
                            contentDescription = null,
                            tint = TrustoraSecondaryText,
                            modifier = Modifier.size(12.dp),
                        )
                    },
                    text = passedText,
                )
            }

            if (call.resultsCount > 0) {
                AdminCallPill(
                    icon = { Icon(Icons.AutoMirrored.Filled.ViewList, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                    text = callsTemplate(
                        callsString("admin.calls.results_label", languageCode),
                        mapOf("count" to call.resultsCount.toString()),
                    ),
                )
            }
        }

        val created = formatDate(call.createdAtIso, languageCode, includeTime = true)
        if (!created.isNullOrBlank()) {
            Text(
                text = "${callsString("admin.calls.created_prefix", languageCode)} $created",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
    }
}

@Composable
private fun AdminCallActionsMenu(
    languageCode: String,
    call: AdminCallSummary,
    onOpenCallUrl: (String) -> Unit,
    onOpenTestStatistics: (String) -> Unit,
    onMoveStatus: (AdminCallSummary, String) -> Unit,
    onRefuse: (AdminCallSummary) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        IconButton(
            onClick = { expanded = true },
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(TrustoraMutedSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp)),
        ) {
            Icon(Icons.Filled.MoreHoriz, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(16.dp))
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            val callUrl = call.callUrl?.trim()
            if (!callUrl.isNullOrEmpty()) {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.connect", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Phone, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onOpenCallUrl(callUrl)
                    },
                )
            }

            val testId = call.testResult?.skillTestId?.trim()
            if (!testId.isNullOrEmpty()) {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.link_test_details", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Book, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onOpenTestStatistics(testId)
                    },
                )
            }

            if (call.status != "WAITING") {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.move_waiting", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Schedule, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onMoveStatus(call, "WAITING")
                    },
                )
            }

            if (call.status != "FINISHED") {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.move_finished", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.CheckCircle, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onMoveStatus(call, "FINISHED")
                    },
                )
            }

            if (call.status != "ACCEPTED") {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.move_accepted", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.CheckCircle, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onMoveStatus(call, "ACCEPTED")
                    },
                )
            }

            if (call.status != "REFUSED") {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.move_refused", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Cancel, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onRefuse(call)
                    },
                )
            }

            if (call.status != "NO_SHOW") {
                DropdownMenuItem(
                    text = { Text(callsString("admin.calls.dropdown.move_no_show", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.PersonOff, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onMoveStatus(call, "NO_SHOW")
                    },
                )
            }
        }
    }
}

@Composable
private fun AdminCallStatusBadge(
    status: String,
    languageCode: String,
) {
    val normalized = status.trim().uppercase()
    val style = when (normalized) {
        "ACCEPTED" -> Triple(Color(0xFF075985), Color(0xFFE0F2FE), Color(0xFFBAE6FD))
        "FINISHED" -> Triple(Color(0xFF92400E), Color(0xFFFEF3C7), Color(0xFFFDE68A))
        "REFUSED" -> Triple(Color(0xFFB91C1C), Color(0xFFFEE2E2), Color(0xFFFECACA))
        "NO_SHOW" -> Triple(Color(0xFF9F1239), Color(0xFFFFE4E6), Color(0xFFFECDD3))
        else -> Triple(Color(0xFF166534), Color(0xFFDCFCE7), Color(0xFFBBF7D0))
    }

    Text(
        text = callsString("admin.calls.statuses.$normalized", languageCode),
        style = MaterialTheme.typography.labelSmall,
        color = style.first,
        modifier = Modifier
            .clip(CircleShape)
            .background(style.second)
            .border(1.dp, style.third, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun AdminCallPill(
    icon: @Composable () -> Unit,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(999.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    ) {
        icon()
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminCallRefuseSheet(
    languageCode: String,
    call: AdminCallSummary,
    reason: String,
    onReasonChanged: (String) -> Unit,
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = callsString("admin.calls.dropdown.move_refused", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )

            Text(
                text = callsString("admin.calls.dropdown.refuse_reason_label", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimaryText,
            )
            Text(
                text = call.attendee?.fullName ?: "-",
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraSecondaryText,
            )

            OutlinedTextField(
                value = reason,
                onValueChange = onReasonChanged,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                placeholder = { Text(callsString("admin.calls.dropdown.refuse_reason_placeholder", languageCode)) },
                maxLines = 8,
                textStyle = MaterialTheme.typography.bodyMedium,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraMutedSurface,
                        contentColor = TrustoraPrimaryText,
                    ),
                ) {
                    Text(callsString("admin.calls.dropdown.cancel", languageCode))
                }

                Button(
                    onClick = onConfirm,
                    modifier = Modifier.weight(1f),
                    enabled = !isSubmitting,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                    ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = TrustoraAccentButtonText)
                    } else {
                        Text(callsString("admin.calls.dropdown.confirm", languageCode))
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

@Composable
private fun AdminCallStatisticsSheet(
    languageCode: String,
    statistics: AdminTestStatistics,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.BarChart, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(16.dp))
                Text(
                    text = callsString("admin.tests.statistics.title_suffix", languageCode),
                    style = MaterialTheme.typography.titleMedium,
                    color = TrustoraPrimaryText,
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(TrustoraSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = statistics.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = TrustoraPrimaryText,
                )
                Text(
                    text = "${statistics.userFullName} \u00B7 ${statistics.serviceTitle}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraSecondaryText,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatisticsBadge(
                        title = callsString("admin.tests.statistics.passed_label", languageCode),
                        value = if (statistics.passed) {
                            callsString("admin.tests.statistics.passed_yes", languageCode)
                        } else {
                            callsString("admin.tests.statistics.passed_no", languageCode)
                        },
                        textColor = if (statistics.passed) Color(0xFF166534) else Color(0xFFB91C1C),
                        fill = if (statistics.passed) Color(0xFFDCFCE7) else Color(0xFFFEE2E2),
                    )
                    StatisticsBadge(
                        title = callsString("admin.tests.statistics.score_label", languageCode),
                        value = "${statistics.score.toInt()}%",
                        textColor = Color(0xFF1D4ED8),
                        fill = Color(0xFFDBEAFE),
                    )
                    StatisticsBadge(
                        title = callsString("admin.tests.statistics.time_spent_label", languageCode),
                        value = "${statistics.timeSpentMinutes} ${callsString("admin.tests.minute_suffix", languageCode)}",
                        textColor = Color(0xFF92400E),
                        fill = Color(0xFFFEF3C7),
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(TrustoraSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    text = callsString("admin.tests.statistics.question_stats_title", languageCode),
                    style = MaterialTheme.typography.titleSmall,
                    color = TrustoraPrimaryText,
                )

                if (statistics.questionResults.isEmpty()) {
                    Text(
                        text = callsString("admin.tests.statistics.no_results", languageCode),
                        style = MaterialTheme.typography.bodySmall,
                        color = TrustoraTertiaryText,
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        statistics.questionResults.forEachIndexed { index, result ->
                            val question = statistics.questions.firstOrNull { it.id == result.questionId }
                            StatisticsQuestionRow(
                                languageCode = languageCode,
                                index = index,
                                result = result,
                                questionText = question?.question.orEmpty(),
                                questionType = question?.type,
                                correctAnswers = question?.correctAnswers.orEmpty(),
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

@Composable
private fun StatisticsBadge(
    title: String,
    value: String,
    textColor: Color,
    fill: Color,
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(fill)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelLarge,
            color = textColor,
        )
    }
}

@Composable
private fun StatisticsQuestionRow(
    languageCode: String,
    index: Int,
    result: AdminTestQuestionResult,
    questionText: String,
    questionType: String?,
    correctAnswers: List<String>,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = callsTemplate(
                    callsString("admin.tests.statistics.question_label", languageCode),
                    mapOf("number" to (index + 1).toString()),
                ),
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraSecondaryText,
            )

            if (!questionType.isNullOrBlank()) {
                Text(
                    text = callsString("admin.tests.question_types.${questionType.trim().uppercase()}", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF1D4ED8),
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0xFFDBEAFE))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = result.pointsEarned.toInt().toString(),
                style = MaterialTheme.typography.labelLarge,
                color = if (result.isCorrect) Color(0xFF166534) else Color(0xFFB91C1C),
            )
        }

        if (questionText.isNotBlank()) {
            Text(
                text = questionText,
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimaryText,
            )
        }

        if (correctAnswers.isNotEmpty()) {
            Text(
                text = "${callsString("admin.tests.statistics.correct_answer", languageCode)}: ${correctAnswers.joinToString(", ")}",
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF166534),
            )
        }

        Text(
            text = "${callsString("admin.tests.statistics.user_answer", languageCode)}: ${result.answer.joinToString(", ")}",
            style = MaterialTheme.typography.bodySmall,
            color = if (result.isCorrect) Color(0xFF1D4ED8) else Color(0xFFB91C1C),
        )
    }
}

private fun scheduledLabel(isoDate: String?, languageCode: String): String {
    val formatted = formatDate(isoDate, languageCode, includeTime = true) ?: "-"
    return "${callsString("admin.calls.scheduled_at_prefix", languageCode)} $formatted"
}

private fun formatDate(rawIso: String?, languageCode: String, includeTime: Boolean): String? {
    val raw = rawIso?.trim().orEmpty()
    if (raw.isEmpty()) return null

    val instant = parseIsoInstant(raw) ?: return raw
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val zoned = instant.atZone(ZoneId.systemDefault())
    val formatter = if (includeTime) {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT).withLocale(locale)
    } else {
        DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)
    }
    return formatter.format(zoned)
}

private fun parseIsoInstant(raw: String): Instant? {
    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun callsTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun callsString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"

        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.calls.manage_title" -> if (ro) "Gestionare Apeluri de verificare" else "Manage Verification Calls"
        "admin.calls.manage_subtitle" -> if (ro) "Administrează apelurile de verificare pentru servicii" else "Administer verification calls for services"
        "admin.calls.search_placeholder" -> if (ro) "Caută apeluri după participant, data..." else "Search calls by participant, date..."
        "admin.calls.filters.passed.label" -> if (ro) "Filtru rezultat" else "Result filter"
        "admin.calls.filters.passed.all" -> if (ro) "Toate rezultatele" else "All results"
        "admin.calls.filters.passed.yes" -> if (ro) "Da" else "Yes"
        "admin.calls.filters.passed.no" -> if (ro) "Nu" else "No"
        "admin.calls.filters.status.label" -> if (ro) "Filtru status" else "Status filter"
        "admin.calls.filters.status.all" -> if (ro) "Toate statusurile" else "All statuses"
        "admin.calls.filters.date.label" -> if (ro) "Filtru perioadă" else "Date filter"
        "admin.calls.filters.date.all" -> if (ro) "Oricând" else "All time"
        "admin.calls.filters.date.today" -> if (ro) "Astăzi" else "Today"
        "admin.calls.filters.date.last_7_days" -> if (ro) "Ultimele 7 zile" else "Last 7 days"
        "admin.calls.filters.date.last_30_days" -> if (ro) "Ultimele 30 zile" else "Last 30 days"
        "admin.calls.statuses.WAITING" -> if (ro) "În așteptare" else "Waiting"
        "admin.calls.statuses.ACCEPTED" -> if (ro) "Acceptat" else "Accepted"
        "admin.calls.statuses.FINISHED" -> if (ro) "Finalizat" else "Finished"
        "admin.calls.statuses.REFUSED" -> if (ro) "Refuzat" else "Refused"
        "admin.calls.statuses.NO_SHOW" -> if (ro) "Nu s-a prezentat" else "No show"
        "admin.calls.list_title" -> if (ro) "Lista Apeluri" else "Calls List"
        "admin.calls.list_description" -> if (ro) "{count} apeluri găsite" else "{count} calls found"
        "admin.calls.link_test_details" -> if (ro) "Vezi detalii test" else "View test details"
        "admin.calls.scheduled_at_prefix" -> if (ro) "Programat la" else "Scheduled on"
        "admin.calls.passing_score_prefix" -> if (ro) "Nota de trecere:" else "Passing score:"
        "admin.calls.service_prefix" -> if (ro) "Serviciu:" else "Service:"
        "admin.calls.category_prefix" -> if (ro) "Categorie:" else "Category:"
        "admin.calls.interviewer_prefix" -> if (ro) "Intervievator:" else "Interviewer:"
        "admin.calls.created_prefix" -> if (ro) "Creat:" else "Created:"
        "admin.calls.results_label" -> if (ro) "{count} rezultate" else "{count} results"
        "admin.calls.dropdown.connect" -> if (ro) "Conectează-te la interviu" else "Join interview"
        "admin.calls.dropdown.move_waiting" -> if (ro) "Mută în Așteptare" else "Move to Waiting"
        "admin.calls.dropdown.move_finished" -> if (ro) "Mută în Finalizat" else "Move to Finished"
        "admin.calls.dropdown.move_accepted" -> if (ro) "Mută în Acceptat" else "Move to Accepted"
        "admin.calls.dropdown.move_refused" -> if (ro) "Mută în Refuzat" else "Move to Refused"
        "admin.calls.dropdown.move_no_show" -> if (ro) "Mută în Nu s-a prezentat" else "Move to No show"
        "admin.calls.dropdown.refuse_reason_label" -> if (ro) "Motiv refuz" else "Refusal reason"
        "admin.calls.dropdown.refuse_reason_placeholder" -> if (ro) "Scrie un motiv..." else "Write a reason..."
        "admin.calls.dropdown.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.calls.dropdown.confirm" -> if (ro) "Confirmă" else "Confirm"
        "admin.calls.no_calls_title" -> if (ro) "Nu s-au găsit apeluri" else "No calls found"
        "admin.calls.no_calls_description" -> if (ro) "Încearcă să modifici filtrele sau termenii de căutare" else "Try adjusting filters or search terms"
        "admin.calls.open_url_failed" -> if (ro) "Nu am putut deschide linkul call-ului." else "Could not open the call link."

        "admin.tests.minute_suffix" -> "min"
        "admin.tests.question_types.SINGLE_CHOICE" -> if (ro) "Alegere Unică" else "Single Choice"
        "admin.tests.question_types.MULTIPLE_CHOICE" -> if (ro) "Alegere Multiplă" else "Multiple Choice"
        "admin.tests.question_types.CODE_WRITING" -> if (ro) "Scriere Cod" else "Code Writing"
        "admin.tests.question_types.TEXT_INPUT" -> if (ro) "Răspuns Text" else "Text Input"
        "admin.tests.statistics.title_suffix" -> if (ro) "Statistici" else "Statistics"
        "admin.tests.statistics.passed_label" -> if (ro) "Promovat" else "Passed"
        "admin.tests.statistics.passed_yes" -> if (ro) "Da" else "Yes"
        "admin.tests.statistics.passed_no" -> if (ro) "Nu" else "No"
        "admin.tests.statistics.score_label" -> if (ro) "Scor" else "Score"
        "admin.tests.statistics.time_spent_label" -> if (ro) "Timp" else "Time spent"
        "admin.tests.statistics.question_stats_title" -> if (ro) "Rezultate pe Întrebări" else "Question Results"
        "admin.tests.statistics.no_results" -> if (ro) "Nu există statistici disponibile pentru acest test." else "No statistics available for this test."
        "admin.tests.statistics.question_label" -> if (ro) "Întrebarea {number}" else "Question {number}"
        "admin.tests.statistics.correct_answer" -> if (ro) "Răspuns corect" else "Correct answer"
        "admin.tests.statistics.user_answer" -> if (ro) "Răspuns utilizator" else "User answer"

        else -> key
    }
}

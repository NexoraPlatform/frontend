@file:OptIn(
    androidx.compose.material3.ExperimentalMaterial3Api::class,
    androidx.compose.foundation.layout.ExperimentalLayoutApi::class,
)

package com.trustora.app.ui.screens.admin

import android.app.DatePickerDialog
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminAuditLogDiffItem
import com.trustora.app.core.models.AdminAuditLogEntry
import com.trustora.app.core.models.AdminAuditLogEventFilter
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun AdminAuditLogsScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminAuditLogsViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

    LaunchedEffect(
        user.id,
        token,
        languageCode,
        currency.raw,
        viewModel.page,
        viewModel.selectedEvent,
        viewModel.appliedUserId,
        viewModel.dateFrom,
        viewModel.dateTo,
        canAccessAdmin,
    ) {
        if (canAccessAdmin) {
            viewModel.load(
                token = token,
                language = languageCode,
                currency = currency,
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
            AdminAuditLogsTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminAuditLogsUnavailableState(languageCode = languageCode)
            } else {
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = viewModel.isLoading,
                    onRefresh = {
                        viewModel.load(
                            token = token,
                            language = languageCode,
                            currency = currency,
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
                        AdminAuditLogsHeaderCard(languageCode = languageCode)
                        AdminAuditLogsFiltersCard(
                            languageCode = languageCode,
                            viewModel = viewModel,
                        )
                        AdminAuditLogsListCard(
                            languageCode = languageCode,
                            viewModel = viewModel,
                            onRetry = {
                                viewModel.load(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminAuditLogsTopBar(
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
                text = auditLogsString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = auditLogsString("admin.audit_logs.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(32.dp))
    }
}

@Composable
private fun AdminAuditLogsUnavailableState(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = Icons.Filled.Warning,
            contentDescription = null,
            tint = TrustoraPrimary,
            modifier = Modifier.size(36.dp),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = auditLogsString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = auditLogsString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminAuditLogsHeaderCard(languageCode: String) {
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
            text = auditLogsString("admin.audit_logs.history_label", languageCode).uppercase(),
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraTertiaryText,
        )

        Text(
            text = auditLogsString("admin.audit_logs.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )

        Text(
            text = auditLogsString("admin.audit_logs.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminAuditLogsFiltersCard(
    languageCode: String,
    viewModel: AdminAuditLogsViewModel,
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
        Text(
            text = auditLogsString("admin.audit_logs.filters.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AuditDatePickerField(
                label = auditLogsString("admin.audit_logs.filters.date_from", languageCode),
                date = viewModel.dateFrom,
                onDateSelected = {
                    viewModel.dateFrom = it
                    viewModel.page = 1
                },
                modifier = Modifier.weight(1f),
            )
            AuditDatePickerField(
                label = auditLogsString("admin.audit_logs.filters.date_to", languageCode),
                date = viewModel.dateTo,
                onDateSelected = {
                    viewModel.dateTo = it
                    viewModel.page = 1
                },
                modifier = Modifier.weight(1f),
            )
        }

        Text(
            text = auditLogsString("admin.audit_logs.filters.event", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminAuditLogEventFilter.entries.forEach { filter ->
                AuditFilterChip(
                    text = auditLogsString(filter.titleKey, languageCode),
                    selected = viewModel.selectedEvent == filter,
                    onTap = {
                        if (viewModel.selectedEvent != filter) {
                            viewModel.selectedEvent = filter
                            viewModel.page = 1
                        }
                    },
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = viewModel.userSearchText,
                onValueChange = { viewModel.userSearchText = it },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.bodyMedium,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = TrustoraTertiaryText) },
                placeholder = { Text(auditLogsString("admin.audit_logs.filters.user_id_placeholder", languageCode)) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )

            Button(
                onClick = { viewModel.applySearch() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraMutedSurface,
                    contentColor = TrustoraPrimary,
                ),
            ) {
                Text(auditLogsString("admin.audit_logs.filters.search", languageCode))
            }

            if (viewModel.appliedUserId != null) {
                TextButton(onClick = { viewModel.clearSearch() }) {
                    Text(auditLogsString("common.clear", languageCode))
                }
            }
        }
    }
}

@Composable
private fun AuditDatePickerField(
    label: String,
    date: LocalDate,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val formatter = remember { DateTimeFormatter.ofPattern("yyyy-MM-dd") }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(TrustoraMutedSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                .clickable {
                    DatePickerDialog(
                        context,
                        { _, year, month, dayOfMonth ->
                            onDateSelected(LocalDate.of(year, month + 1, dayOfMonth))
                        },
                        date.year,
                        date.monthValue - 1,
                        date.dayOfMonth,
                    ).show()
                }
                .padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(14.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = date.format(formatter),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimaryText,
            )
        }
    }
}

@Composable
private fun AuditFilterChip(
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
            .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
            .clickable(onClick = onTap)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun AdminAuditLogsListCard(
    languageCode: String,
    viewModel: AdminAuditLogsViewModel,
    onRetry: () -> Unit,
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
            Icon(Icons.Filled.Warning, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = auditLogsString("admin.audit_logs.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = auditLogsTemplate(
                auditLogsString("admin.audit_logs.list_description", languageCode),
                mapOf("count" to viewModel.total.toString()),
            ),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        when {
            !viewModel.errorMessage.isNullOrBlank() -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = viewModel.errorMessage.orEmpty(),
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
                        Text(auditLogsString("admin.users.retry", languageCode))
                    }
                }
            }

            viewModel.isLoading && viewModel.logs.isEmpty() -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            viewModel.logs.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.Warning, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = auditLogsString("admin.audit_logs.empty_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = auditLogsString("admin.audit_logs.empty_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    viewModel.logs.forEachIndexed { index, log ->
                        AdminAuditLogRow(
                            languageCode = languageCode,
                            log = log,
                            expanded = viewModel.isExpanded(log.id),
                            diffItems = viewModel.diffItems(log),
                            onToggleExpanded = { viewModel.toggleExpanded(log.id) },
                        )

                        if (index == viewModel.logs.lastIndex) {
                            LaunchedEffect(log.id, viewModel.canGoNext, viewModel.isLoading, viewModel.page) {
                                if (viewModel.canGoNext && !viewModel.isLoading) {
                                    viewModel.goToNextPage()
                                }
                            }
                        }
                    }
                }

                if (viewModel.isLoading && viewModel.logs.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.1.dp)
                    }
                }

                if (viewModel.lastPage > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = auditLogsTemplate(
                                auditLogsString("admin.audit_logs.pagination", languageCode),
                                mapOf(
                                    "current" to viewModel.page.toString(),
                                    "last" to viewModel.lastPage.toString(),
                                    "total" to viewModel.total.toString(),
                                ),
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(
                                onClick = { viewModel.goToPreviousPage() },
                                enabled = viewModel.canGoPrevious,
                            ) {
                                Text(auditLogsString("admin.audit_logs.pagination_previous", languageCode))
                            }

                            TextButton(
                                onClick = { viewModel.goToNextPage() },
                                enabled = viewModel.canGoNext,
                            ) {
                                Text(auditLogsString("admin.audit_logs.pagination_next", languageCode))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminAuditLogRow(
    languageCode: String,
    log: AdminAuditLogEntry,
    expanded: Boolean,
    diffItems: List<AdminAuditLogDiffItem>,
    onToggleExpanded: () -> Unit,
) {
    val eventStyle = auditEventStyle(log.event)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .clickable(onClick = onToggleExpanded)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = log.event.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = eventStyle.text,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(eventStyle.background)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            )

            Text(
                text = auditDisplayDate(log.createdAtIso),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )

            Spacer(modifier = Modifier.weight(1f))
            Icon(
                imageVector = if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                contentDescription = null,
                tint = TrustoraTertiaryText,
            )
        }

        Text(
            text = log.action,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraPrimaryText,
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AuditDetailChip(
                title = auditLogsString("admin.audit_logs.table.actor", languageCode),
                value = log.actorName,
            )
            AuditDetailChip(
                title = auditLogsString("admin.audit_logs.table.subject", languageCode),
                value = auditLogsTemplate(
                    auditLogsString("admin.audit_logs.table.subject_template", languageCode),
                    mapOf(
                        "type" to log.subjectType,
                        "id" to log.subjectId,
                    ),
                ),
            )
            AuditDetailChip(
                title = auditLogsString("admin.audit_logs.table.ip", languageCode),
                value = log.ip,
            )
        }

        if (expanded) {
            if (diffItems.isEmpty()) {
                Text(
                    text = auditLogsString("admin.audit_logs.no_changes", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(TrustoraMutedSurface)
                        .padding(10.dp),
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(TrustoraMutedSurface)
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    diffItems.forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text(
                                text = item.key,
                                style = MaterialTheme.typography.labelSmall,
                                color = TrustoraSecondaryText,
                                modifier = Modifier.width(96.dp),
                            )

                            Text(
                                text = auditJsonDisplay(item.oldValue),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFB91C1C),
                                modifier = Modifier.weight(1f),
                            )

                            Text(
                                text = "→",
                                style = MaterialTheme.typography.labelSmall,
                                color = TrustoraTertiaryText,
                            )

                            Text(
                                text = auditJsonDisplay(item.newValue),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF166534),
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuditDetailChip(
    title: String,
    value: String,
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(TrustoraMutedSurface)
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
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )
    }
}

private data class EventStyle(
    val text: Color,
    val background: Color,
)

private fun auditEventStyle(event: String): EventStyle {
    return when (event.lowercase()) {
        "created" -> EventStyle(
            text = Color(0xFF166534),
            background = Color(0xFFDCFCE7),
        )

        "updated" -> EventStyle(
            text = Color(0xFF1D4ED8),
            background = Color(0xFFDBEAFE),
        )

        "deleted" -> EventStyle(
            text = Color(0xFFB91C1C),
            background = Color(0xFFFEE2E2),
        )

        else -> EventStyle(
            text = TrustoraSecondaryText,
            background = Color(0xFFF1F5F9),
        )
    }
}

private fun auditDisplayDate(rawIso: String?): String {
    val raw = rawIso?.trim().orEmpty()
    if (raw.isEmpty()) return "-"

    val instant = parseAuditInstant(raw) ?: return raw
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.US)
    return formatter.format(instant.atZone(ZoneId.systemDefault()))
}

private fun parseAuditInstant(raw: String): Instant? {
    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun auditJsonDisplay(value: String?): String {
    if (value.isNullOrBlank()) return "null"
    if (value == "true" || value == "false" || value == "null") return value
    if (value.toDoubleOrNull() != null) return value
    if (value.startsWith("{") || value.startsWith("[")) return value
    return "\"$value\""
}

private fun auditLogsTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun auditLogsString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        "common.clear" -> if (ro) "Resetează" else "Clear"

        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.audit_logs.history_label" -> if (ro) "Istoric" else "History"
        "admin.audit_logs.manage_title" -> if (ro) "Jurnale Audit" else "Audit Logs"
        "admin.audit_logs.manage_subtitle" -> if (ro) "Vizualizează și analizează modificările făcute în sistem." else "View and analyze changes made within the system."
        "admin.audit_logs.filters.title" -> if (ro) "Filtre" else "Filters"
        "admin.audit_logs.filters.date_from" -> if (ro) "Data de la" else "Date from"
        "admin.audit_logs.filters.date_to" -> if (ro) "Data până la" else "Date to"
        "admin.audit_logs.filters.event" -> if (ro) "Tip Eveniment" else "Event Type"
        "admin.audit_logs.filters.event.all" -> if (ro) "Toate Evenimentele" else "All Events"
        "admin.audit_logs.filters.event.created" -> if (ro) "Creat" else "Created"
        "admin.audit_logs.filters.event.updated" -> if (ro) "Actualizat" else "Updated"
        "admin.audit_logs.filters.event.deleted" -> if (ro) "Șters" else "Deleted"
        "admin.audit_logs.filters.user_id_placeholder" -> if (ro) "Caută ID Utilizator..." else "Search User ID..."
        "admin.audit_logs.filters.search" -> if (ro) "Caută" else "Search"
        "admin.audit_logs.list_title" -> if (ro) "Jurnale Audit" else "Audit Logs"
        "admin.audit_logs.list_description" -> if (ro) "{count} jurnale în total" else "{count} total logs"
        "admin.audit_logs.table.actor" -> "Actor"
        "admin.audit_logs.table.subject" -> if (ro) "Subiect" else "Subject"
        "admin.audit_logs.table.subject_template" -> "{type}:{id}"
        "admin.audit_logs.table.ip" -> "IP"
        "admin.audit_logs.no_changes" -> if (ro) "Nu sunt modificări înregistrate" else "No changes recorded"
        "admin.audit_logs.pagination" -> if (ro) "Pagina {current} din {last} ({total} total)" else "Page {current} of {last} ({total} total)"
        "admin.audit_logs.pagination_previous" -> if (ro) "Anterior" else "Previous"
        "admin.audit_logs.pagination_next" -> if (ro) "Următor" else "Next"
        "admin.audit_logs.empty_title" -> if (ro) "Nu există jurnale audit" else "No audit logs found"
        "admin.audit_logs.empty_description" -> if (ro) "Încearcă să modifici filtrele sau intervalul de date." else "Try changing the filters or date range."
        else -> key
    }
}

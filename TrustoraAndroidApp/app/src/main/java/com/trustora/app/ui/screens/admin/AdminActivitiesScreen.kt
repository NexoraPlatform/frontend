@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.QueryBuilder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminActivityEntry
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
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun AdminActivitiesScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminActivitiesViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

    LaunchedEffect(user.id, token, languageCode, currency.raw, viewModel.page) {
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
            AdminActivitiesTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminActivitiesUnavailableState(languageCode = languageCode)
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
                        AdminActivitiesHeaderCard(languageCode = languageCode)
                        AdminActivitiesListCard(
                            languageCode = languageCode,
                            activities = viewModel.activities,
                            total = viewModel.total,
                            page = viewModel.page,
                            lastPage = viewModel.lastPage,
                            canGoPrevious = viewModel.canGoPrevious,
                            canGoNext = viewModel.canGoNext,
                            isLoading = viewModel.isLoading,
                            errorMessage = viewModel.errorMessage,
                            onRetry = {
                                viewModel.load(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onLoadNext = { viewModel.goToNextPage() },
                            onPrevious = { viewModel.goToPreviousPage() },
                            onNext = { viewModel.goToNextPage() },
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminActivitiesTopBar(
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
                text = activitiesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = activitiesString("admin.activities.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(32.dp))
    }
}

@Composable
private fun AdminActivitiesUnavailableState(languageCode: String) {
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
            text = activitiesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = activitiesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminActivitiesHeaderCard(languageCode: String) {
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
            text = activitiesString("admin.activities.history_label", languageCode).uppercase(),
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraTertiaryText,
        )
        Text(
            text = activitiesString("admin.activities.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = activitiesString("admin.activities.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminActivitiesListCard(
    languageCode: String,
    activities: List<AdminActivityEntry>,
    total: Int,
    page: Int,
    lastPage: Int,
    canGoPrevious: Boolean,
    canGoNext: Boolean,
    isLoading: Boolean,
    errorMessage: String?,
    onRetry: () -> Unit,
    onLoadNext: () -> Unit,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
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
            Icon(Icons.Filled.QueryBuilder, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = activitiesString("admin.activities.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = activitiesTemplate(
                activitiesString("admin.activities.list_description", languageCode),
                mapOf("count" to total.toString()),
            ),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

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
                        Text(activitiesString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading && activities.isEmpty() -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            activities.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.QueryBuilder, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = activitiesString("admin.activities.empty_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = activitiesString("admin.activities.empty_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    activities.forEachIndexed { index, activity ->
                        AdminActivityRow(
                            languageCode = languageCode,
                            activity = activity,
                        )

                        if (index == activities.lastIndex) {
                            LaunchedEffect(activity.id, canGoNext, isLoading, page) {
                                if (canGoNext && !isLoading) {
                                    onLoadNext()
                                }
                            }
                        }
                    }
                }

                if (isLoading && activities.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.1.dp)
                    }
                }

                if (lastPage > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = activitiesTemplate(
                                activitiesString("admin.activities.pagination", languageCode),
                                mapOf(
                                    "current" to page.toString(),
                                    "last" to lastPage.toString(),
                                    "total" to total.toString(),
                                ),
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = onPrevious, enabled = canGoPrevious) {
                                Text(activitiesString("admin.activities.pagination_previous", languageCode))
                            }
                            TextButton(onClick = onNext, enabled = canGoNext) {
                                Text(activitiesString("admin.activities.pagination_next", languageCode))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminActivityRow(
    languageCode: String,
    activity: AdminActivityEntry,
) {
    val iconConfig = activityIconConfiguration(activity.type)
    val isUnread = activity.readAtIso.isNullOrBlank()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(
            imageVector = iconConfig.icon,
            contentDescription = null,
            tint = iconConfig.iconColor,
            modifier = Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(9.dp))
                .background(iconConfig.backgroundColor)
                .padding(7.dp),
        )

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    text = activityMessage(activity, languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                    modifier = Modifier.weight(1f),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = activityDisplayTime(activity, languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (isUnread) {
                    Text(
                        text = activitiesString("admin.activities.unread_badge", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF0369A1),
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFE0F2FE))
                            .padding(horizontal = 8.dp, vertical = 3.dp),
                    )
                }
                Text(
                    text = activitiesTemplate(
                        activitiesString("admin.activities.id_prefix", languageCode),
                        mapOf("id" to activity.id),
                    ),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }
        }
    }
}

private data class ActivityIconConfig(
    val icon: ImageVector,
    val iconColor: Color,
    val backgroundColor: Color,
)

private fun activityIconConfiguration(type: String): ActivityIconConfig {
    return when (type.lowercase()) {
        "project_created" -> ActivityIconConfig(
            icon = Icons.Filled.Groups,
            iconColor = Color(0xFF2563EB),
            backgroundColor = Color(0xFFDBEAFE),
        )

        "invoice_paid", "project_paid" -> ActivityIconConfig(
            icon = Icons.Filled.Payments,
            iconColor = Color(0xFF16A34A),
            backgroundColor = Color(0xFFDCFCE7),
        )

        "proposal_received" -> ActivityIconConfig(
            icon = Icons.Filled.Description,
            iconColor = Color(0xFFCA8A04),
            backgroundColor = Color(0xFFFEF9C3),
        )

        else -> ActivityIconConfig(
            icon = Icons.Filled.Bolt,
            iconColor = TrustoraSecondaryText,
            backgroundColor = Color(0xFFF1F5F9),
        )
    }
}

private fun activityMessage(activity: AdminActivityEntry, languageCode: String): String {
    return when (activity.type.lowercase()) {
        "project_created" -> {
            activitiesTemplate(
                activitiesString("admin.activities.messages.project_created", languageCode),
                mapOf("project" to (activity.metadata["project_name"] ?: "-")),
            )
        }

        "invoice_paid" -> {
            activitiesTemplate(
                activitiesString("admin.activities.messages.invoice_paid", languageCode),
                mapOf(
                    "invoice" to (activity.metadata["invoice_id"] ?: "-"),
                    "amount" to (activity.metadata["amount"] ?: "-"),
                ),
            )
        }

        "proposal_received" -> {
            activitiesTemplate(
                activitiesString("admin.activities.messages.proposal_received", languageCode),
                mapOf("project" to (activity.metadata["project_name"] ?: "-")),
            )
        }

        "project_paid" -> {
            activitiesTemplate(
                activitiesString("admin.activities.messages.project_paid", languageCode),
                mapOf("project" to (activity.metadata["project_name"] ?: "-")),
            )
        }

        else -> activitiesString("admin.activities.messages.default", languageCode)
    }
}

private fun activityDisplayTime(activity: AdminActivityEntry, languageCode: String): String {
    if (activity.createdAtHuman.isNotBlank()) {
        return activity.createdAtHuman
    }
    val raw = activity.createdAtIso?.trim().orEmpty()
    if (raw.isEmpty()) return "-"
    val instant = parseActivityInstant(raw) ?: return raw
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT).withLocale(locale)
    return formatter.format(instant.atZone(ZoneId.systemDefault()))
}

private fun parseActivityInstant(raw: String): Instant? {
    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun activitiesTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun activitiesString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.activities.history_label" -> if (ro) "Istoric" else "History"
        "admin.activities.manage_title" -> if (ro) "Activități Sistem" else "System Activities"
        "admin.activities.manage_subtitle" -> if (ro) {
            "Urmărește toate evenimentele automate și interacțiunile utilizatorilor din sistem."
        } else {
            "Track all automated events and user interactions in the system."
        }

        "admin.activities.list_title" -> if (ro) "Activități" else "Activities"
        "admin.activities.list_description" -> if (ro) "{count} activități în total" else "{count} total activities"
        "admin.activities.unread_badge" -> if (ro) "Nou" else "New"
        "admin.activities.id_prefix" -> "ID: #{id}"
        "admin.activities.pagination" -> if (ro) "Pagina {current} din {last} ({total} total)" else "Page {current} of {last} ({total} total)"
        "admin.activities.pagination_previous" -> if (ro) "Anterior" else "Previous"
        "admin.activities.pagination_next" -> if (ro) "Următor" else "Next"
        "admin.activities.empty_title" -> if (ro) "Nu există activități" else "No activities found"
        "admin.activities.empty_description" -> if (ro) "Nu există încă evenimente disponibile." else "No events are available yet."
        "admin.activities.messages.project_created" -> if (ro) "Proiectul \"{project}\" a fost creat" else "Project \"{project}\" was created"
        "admin.activities.messages.invoice_paid" -> if (ro) "Factura {invoice} a fost plătită cu {amount}" else "Paid invoice {invoice} of {amount}"
        "admin.activities.messages.proposal_received" -> if (ro) {
            "A fost primită o ofertă nouă pentru proiectul \"{project}\""
        } else {
            "New proposal received for project \"{project}\""
        }

        "admin.activities.messages.project_paid" -> if (ro) "Proiectul \"{project}\" a fost plătit" else "Project \"{project}\" was paid"
        "admin.activities.messages.default" -> if (ro) "Activitate înregistrată în sistem" else "Activity recorded in the system"
        else -> key
    }
}

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
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CreateNewFolder
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Pending
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.ViewModule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardRecentActivity
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun AdminDashboardScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminDashboardViewModel,
    onBack: () -> Unit,
    onOpenFeature: (String) -> Boolean,
) {
    val isRomanian = languageCode.startsWith("ro", ignoreCase = true)
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")
    var featureNotice by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
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
            AdminTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminUnavailableState(languageCode = languageCode)
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    AdminHeaderCard(languageCode = languageCode)
                    AdminStatsGrid(
                        languageCode = languageCode,
                        appCurrency = currency,
                        cards = viewModel.statsCards(),
                        onTap = { featureNotice = true },
                    )
                    AdminQuickActionsCard(
                        languageCode = languageCode,
                        actions = viewModel.quickActions(),
                        onTap = { actionKey ->
                            if (!onOpenFeature(actionKey)) featureNotice = true
                        },
                    )
                    AdminSectionsCard(
                        languageCode = languageCode,
                        sections = viewModel.sections().filter { viewModel.canAccess(it, user) },
                        onTap = { sectionKey ->
                            if (!onOpenFeature(sectionKey)) featureNotice = true
                        },
                    )
                    AdminRecentActivityCard(
                        languageCode = languageCode,
                        recentActivities = viewModel.recentActivities,
                        errorMessage = viewModel.errorMessage,
                        onOpenAll = {
                            if (!onOpenFeature("activities")) featureNotice = true
                        },
                    )
                    AdminSystemStatusCard(languageCode = languageCode, statuses = viewModel.systemStatus())
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        if (viewModel.isLoading && canAccessAdmin) {
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
                        text = if (isRomanian) "Se încarcă..." else "Loading...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    if (featureNotice) {
        AlertDialog(
            onDismissRequest = { featureNotice = false },
            confirmButton = {
                TextButton(onClick = { featureNotice = false }) {
                    Text(adminString("common.ok", languageCode))
                }
            },
            title = {
                Text(adminString("admin.dashboard.notice.title", languageCode))
            },
            text = {
                Text(adminString("admin.dashboard.notice.body", languageCode))
            },
        )
    }
}

@Composable
private fun AdminTopBar(
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
                text = adminString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = adminString("navigation.admin_panel", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(74.dp))
    }
}

@Composable
private fun AdminUnavailableState(languageCode: String) {
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
            text = adminString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = adminString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminHeaderCard(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(TrustoraSurface, Color(0xFFF0FDF4)),
                ),
            )
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "Trustora Admin",
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraTertiaryText,
        )
        Text(
            text = adminString("admin.dashboard.title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = adminString("admin.dashboard.subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminStatsGrid(
    languageCode: String,
    appCurrency: AppCurrency,
    cards: List<AdminDashboardStatCard>,
    onTap: () -> Unit,
) {
    TwoColumnGrid(items = cards) { card ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(TrustoraSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
                .clickable(onClick = onTap)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    text = adminString(card.titleKey, languageCode),
                    style = MaterialTheme.typography.labelLarge,
                    color = TrustoraTertiaryText,
                    modifier = Modifier.weight(1f),
                )
                Icon(
                    imageVector = adminIcon(card.iconKey),
                    contentDescription = null,
                    tint = colorFromHex(card.colorHex),
                    modifier = Modifier.size(18.dp),
                )
            }

            Text(
                text = displayValue(card.value, card.isCurrency, appCurrency, languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "(${displayValue(card.current, card.isCurrency, appCurrency, languageCode)})",
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
                Icon(
                    imageVector = if (card.current <= 0) Icons.Filled.Speed else Icons.Filled.Insights,
                    contentDescription = null,
                    tint = if (card.current <= 0) Color(0xFFDC2626) else Color(0xFF16A34A),
                    modifier = Modifier.size(12.dp),
                )
            }

            if (card.change != 0.0) {
                Text(
                    text = adminString("admin.dashboard.stats.change_template", languageCode)
                        .replace("{percent}", signedPercent(card.change)),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (card.change < 0) Color(0xFFDC2626) else Color(0xFF16A34A),
                )
            }
        }
    }
}

@Composable
private fun AdminQuickActionsCard(
    languageCode: String,
    actions: List<AdminDashboardQuickAction>,
    onTap: (String) -> Unit,
) {
    AdminSectionCard(
        title = adminString("admin.dashboard.quick_actions.title", languageCode),
        subtitle = adminString("admin.dashboard.quick_actions.description", languageCode),
        icon = Icons.Filled.Pending,
    ) {
        TwoColumnGrid(items = actions) { action ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .clickable { onTap(action.actionKey) }
                    .padding(10.dp),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(9.dp))
                        .background(Color(0xFF1BC47D)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = adminIcon(action.iconKey),
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp),
                    )
                }

                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = adminString(action.titleKey, languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = adminString(action.descriptionKey, languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminSectionsCard(
    languageCode: String,
    sections: List<AdminDashboardSection>,
    onTap: (String) -> Unit,
) {
    AdminSectionCard(
        title = adminString("admin.dashboard.sections.title", languageCode),
        subtitle = adminString("admin.dashboard.sections.description", languageCode),
        icon = Icons.Filled.ViewModule,
    ) {
        TwoColumnGrid(items = sections) { section ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .clickable { onTap(section.titleKey) }
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top,
                ) {
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(RoundedCornerShape(9.dp))
                            .background(Color(0xFFE0F2FE)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = adminIcon(section.iconKey),
                            contentDescription = null,
                            tint = Color(0xFF0284C7),
                            modifier = Modifier.size(16.dp),
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f))
                    if (section.pendingCount > 0) {
                        Text(
                            text = adminString("admin.dashboard.pending_template", languageCode)
                                .replace("{count}", section.pendingCount.toString()),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF991B1B),
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color(0xFFFEE2E2))
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                        )
                    }
                }

                Text(
                    text = adminString(section.titleKey, languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                )
                Text(
                    text = adminString(section.descriptionKey, languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )

                sectionStatsText(section = section, languageCode = languageCode)?.let { statsText ->
                    Text(
                        text = statsText,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminRecentActivityCard(
    languageCode: String,
    recentActivities: List<DashboardRecentActivity>,
    errorMessage: String?,
    onOpenAll: () -> Unit,
) {
    AdminSectionCard(
        title = adminString("admin.dashboard.activity.title", languageCode),
        subtitle = null,
        icon = Icons.Filled.Speed,
    ) {
        when {
            !errorMessage.isNullOrBlank() -> {
                Text(
                    text = errorMessage,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFB91C1C),
                )
            }

            recentActivities.isEmpty() -> {
                Text(
                    text = adminString("admin.dashboard.activity.empty", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    recentActivities.forEach { activity ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F9)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = activityIcon(activity),
                                    contentDescription = null,
                                    tint = Color(0xFF64748B),
                                    modifier = Modifier.size(14.dp),
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = activity.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TrustoraPrimaryText,
                                )
                                activity.timeAgo?.takeIf { it.isNotBlank() }?.let {
                                    Text(
                                        text = it,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TrustoraTertiaryText,
                                    )
                                }
                            }
                        }
                    }
                    TextButton(onClick = onOpenAll, modifier = Modifier.fillMaxWidth()) {
                        Text(adminString("admin.dashboard.activity.view_all", languageCode))
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminSystemStatusCard(
    languageCode: String,
    statuses: List<Pair<String, String>>,
) {
    AdminSectionCard(
        title = adminString("admin.dashboard.system_status.title", languageCode),
        subtitle = null,
        icon = Icons.Filled.HealthAndSafety,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            statuses.forEach { status ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = adminString(status.first, languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraSecondaryText,
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = adminString(status.second, languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF065F46),
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFD1FAE5))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminSectionCard(
    title: String,
    subtitle: String?,
    icon: ImageVector,
    content: @Composable () -> Unit,
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
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(icon, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(15.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }
        if (!subtitle.isNullOrBlank()) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
        content()
    }
}

@Composable
private fun <T> TwoColumnGrid(
    items: List<T>,
    content: @Composable (T) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items.chunked(2).forEach { rowItems ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                rowItems.forEach { item ->
                    Box(modifier = Modifier.weight(1f)) {
                        content(item)
                    }
                }
                if (rowItems.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

private fun sectionStatsText(section: AdminDashboardSection, languageCode: String): String? {
    val key = section.statsKey?.trim().orEmpty()
    if (key.isEmpty()) return null
    return if (section.statsCount != null) {
        adminString(key, languageCode).replace("{count}", section.statsCount.toString())
    } else {
        adminString(key, languageCode)
    }
}

private fun displayValue(
    value: Double,
    isCurrency: Boolean,
    appCurrency: AppCurrency,
    languageCode: String,
): String {
    if (!isCurrency) {
        return if (value % 1.0 == 0.0) value.toInt().toString() else String.format(Locale.US, "%.2f", value)
    }

    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val formatter = NumberFormat.getCurrencyInstance(locale)
    formatter.currency = java.util.Currency.getInstance(appCurrency.raw)
    formatter.maximumFractionDigits = 0
    formatter.minimumFractionDigits = 0
    return runCatching { formatter.format(value) }.getOrElse { "${value.roundToInt()} ${appCurrency.raw}" }
}

private fun signedPercent(value: Double): String {
    val rounded = value.roundToInt()
    return if (rounded > 0) "+$rounded" else rounded.toString()
}

private fun activityIcon(activity: DashboardRecentActivity): ImageVector {
    val action = (activity.action ?: activity.type ?: "").lowercase()
    val title = activity.title.lowercase()
    return when {
        action == "project.created" || title.contains("project created") || title.contains("proiect creat") -> Icons.Filled.Description
        action.contains("payment") || title.contains("paid") || title.contains("platit") || title.contains("plătit") -> Icons.Filled.BarChart
        action.contains("proposal") || title.contains("proposal") || title.contains("propunere") -> Icons.AutoMirrored.Filled.Assignment
        else -> Icons.Filled.Speed
    }
}

private fun adminIcon(iconKey: String): ImageVector {
    return when (iconKey) {
        "users" -> Icons.Filled.Groups
        "services" -> Icons.Filled.ViewModule
        "revenue" -> Icons.Filled.Insights
        "projects" -> Icons.Filled.BarChart
        "add_user" -> Icons.Filled.PersonAdd
        "add_category" -> Icons.Filled.CreateNewFolder
        "add_test" -> Icons.Filled.Book
        "view_reports" -> Icons.Filled.Analytics
        "early_access" -> Icons.Filled.Pending
        "categories" -> Icons.Filled.Folder
        "tests" -> Icons.Filled.Book
        "calls" -> Icons.Filled.Phone
        "disputes" -> Icons.Filled.ReportProblem
        "legal_clauses" -> Icons.Filled.Description
        "newsletter" -> Icons.Filled.Campaign
        "activities" -> Icons.Filled.Speed
        "audit_logs" -> Icons.Filled.Security
        "roles" -> Icons.Filled.LockPerson
        "analytics" -> Icons.Filled.Analytics
        else -> Icons.Filled.Notifications
    }
}

private fun colorFromHex(hex: Long): Color {
    return Color((0xFF000000L or hex).toInt())
}

private fun adminString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "navigation.admin_panel" -> if (ro) "Panou Admin" else "Admin panel"
        "common.ok" -> if (ro) "OK" else "OK"

        "admin.dashboard.title" -> if (ro) "Panou de Administrare" else "Admin Dashboard"
        "admin.dashboard.subtitle" -> if (ro) "Gestionează platforma Trustora cu tarife flexibile și teste de competență" else "Manage the Trustora platform with flexible provider rates and competency tests"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."
        "admin.dashboard.notice.title" -> if (ro) "Secțiune Admin" else "Admin Section"
        "admin.dashboard.notice.body" -> if (ro) "Această secțiune se va deschide după implementarea paginii mobile corespunzătoare." else "This section will open after the corresponding mobile screen is implemented."

        "admin.dashboard.stats.users" -> if (ro) "Utilizatori Înregistrați" else "Registered Users"
        "admin.dashboard.stats.services" -> if (ro) "Servicii Active" else "Active Services"
        "admin.dashboard.stats.revenue" -> if (ro) "Venituri Totale" else "Total Revenue"
        "admin.dashboard.stats.projects" -> if (ro) "Proiecte Procesate" else "Processed Projects"
        "admin.dashboard.stats.change_template" -> if (ro) "{percent}% această lună" else "{percent}% this month"

        "admin.dashboard.quick_actions.title" -> if (ro) "Acțiuni Rapide" else "Quick Actions"
        "admin.dashboard.quick_actions.description" -> if (ro) "Acțiuni frecvente pentru administrarea platformei" else "Frequent actions for managing the platform"
        "admin.dashboard.quick_actions.add_user.title" -> if (ro) "Adaugă Utilizator" else "Add User"
        "admin.dashboard.quick_actions.add_user.description" -> if (ro) "Creează un cont nou pentru un utilizator" else "Create a new account for a user"
        "admin.dashboard.quick_actions.add_category.title" -> if (ro) "Adaugă Categorie" else "Add Category"
        "admin.dashboard.quick_actions.add_category.description" -> if (ro) "Creează o categorie nouă pentru servicii" else "Create a new category for services"
        "admin.dashboard.quick_actions.add_test.title" -> if (ro) "Adaugă Test" else "Add Test"
        "admin.dashboard.quick_actions.add_test.description" -> if (ro) "Creează un test de competență nou" else "Create a new competency test"
        "admin.dashboard.quick_actions.view_reports.title" -> if (ro) "Vezi Rapoarte" else "View Reports"
        "admin.dashboard.quick_actions.view_reports.description" -> if (ro) "Analizează performanța platformei" else "Analyze platform performance"

        "admin.dashboard.sections.title" -> if (ro) "Secțiuni Administrare" else "Admin Sections"
        "admin.dashboard.sections.description" -> if (ro) "Accesează toate secțiunile de administrare" else "Access all administration sections"
        "admin.dashboard.sections.users.title" -> if (ro) "Gestionare Utilizatori" else "User Management"
        "admin.dashboard.sections.users.description" -> if (ro) "Administrează utilizatorii platformei" else "Manage platform users"
        "admin.dashboard.sections.users.stats_template" -> if (ro) "{count} utilizatori" else "{count} users"
        "admin.dashboard.sections.early_access.title" -> if (ro) "Înscrieri Early Access" else "Early Access Signups"
        "admin.dashboard.sections.early_access.description" -> if (ro) "Vezi toți aplicanții din pre-early stage" else "View all applicants from pre-early stage"
        "admin.dashboard.sections.early_access.stats" -> if (ro) "Aplicații grupate pe tip" else "Applications grouped by type"
        "admin.dashboard.sections.services.title" -> if (ro) "Gestionare Servicii" else "Service Management"
        "admin.dashboard.sections.services.description" -> if (ro) "Administrează serviciile cu tarife personalizate" else "Manage services with custom pricing"
        "admin.dashboard.sections.services.stats_template" -> if (ro) "{count} servicii active" else "{count} active services"
        "admin.dashboard.sections.categories.title" -> if (ro) "Gestionare Categorii" else "Category Management"
        "admin.dashboard.sections.categories.description" -> if (ro) "Organizează categoriile de servicii" else "Organize service categories"
        "admin.dashboard.sections.categories.stats" -> if (ro) "Categorii și subcategorii" else "Categories and subcategories"
        "admin.dashboard.sections.tests.title" -> if (ro) "Gestionare Teste" else "Test Management"
        "admin.dashboard.sections.tests.description" -> if (ro) "Administrează testele de competență" else "Manage competency tests"
        "admin.dashboard.sections.tests.stats" -> if (ro) "Teste pentru toate nivelurile" else "Tests for all levels"
        "admin.dashboard.sections.calls.title" -> if (ro) "Gestionare Call-uri" else "Call Management"
        "admin.dashboard.sections.calls.description" -> if (ro) "Administrează call-urile de verificare" else "Manage verification calls"
        "admin.dashboard.sections.calls.stats_template" -> if (ro) "{count} call-uri programate" else "{count} scheduled calls"
        "admin.dashboard.sections.projects.title" -> if (ro) "Gestionare Proiecte" else "Project Management"
        "admin.dashboard.sections.projects.description" -> if (ro) "Monitorizează proiectele și plățile" else "Monitor projects and payments"
        "admin.dashboard.sections.projects.stats_template" -> if (ro) "{count} proiecte procesate" else "{count} processed projects"
        "admin.dashboard.sections.disputes.title" -> if (ro) "Gestionare Dispute" else "Dispute Management"
        "admin.dashboard.sections.disputes.description" -> if (ro) "Rezolvă disputele între utilizatori" else "Resolve disputes between users"
        "admin.dashboard.sections.disputes.stats" -> if (ro) "Dispute și reclamații" else "Disputes and claims"
        "admin.dashboard.sections.legal_clauses.title" -> if (ro) "Clauze Legale" else "Legal Clauses"
        "admin.dashboard.sections.legal_clauses.description" -> if (ro) "Gestionează clauzele contractuale și traducerile" else "Manage contract clauses and translations"
        "admin.dashboard.sections.legal_clauses.stats" -> if (ro) "Biblioteca de clauze" else "Clause library"
        "admin.dashboard.sections.newsletter.title" -> if (ro) "Newsletter" else "Newsletter"
        "admin.dashboard.sections.newsletter.description" -> if (ro) "Trimite actualizări către abonați" else "Send updates to subscribers"
        "admin.dashboard.sections.newsletter.stats" -> if (ro) "Campanii email" else "Email campaigns"
        "admin.dashboard.sections.activities.title" -> if (ro) "Activități" else "Activities"
        "admin.dashboard.sections.activities.description" -> if (ro) "Istoric evenimente din sistem" else "System event history"
        "admin.dashboard.sections.audit_logs.title" -> if (ro) "Jurnale Audit" else "Audit Logs"
        "admin.dashboard.sections.audit_logs.description" -> if (ro) "Vezi modificările din sistem" else "View system changes"
        "admin.dashboard.sections.roles.title" -> if (ro) "Gestionare Roluri" else "Role Management"
        "admin.dashboard.sections.roles.description" -> if (ro) "Creează sau editează roluri" else "Create or edit roles"
        "admin.dashboard.sections.roles.stats" -> if (ro) "Roluri și permisiuni" else "Roles and permissions"
        "admin.dashboard.sections.analytics.title" -> if (ro) "Analytics & Rapoarte" else "Analytics & Reports"
        "admin.dashboard.sections.analytics.description" -> if (ro) "Analizează performanța platformei" else "Analyze platform performance"
        "admin.dashboard.sections.analytics.stats" -> if (ro) "Statistici detaliate" else "Detailed statistics"
        "admin.dashboard.pending_template" -> if (ro) "{count} în așteptare" else "{count} pending"

        "admin.dashboard.activity.title" -> if (ro) "Activitate Recentă" else "Recent Activity"
        "admin.dashboard.activity.empty" -> if (ro) "Nu există activitate recentă." else "No recent activity."
        "admin.dashboard.activity.view_all" -> if (ro) "Vezi Toată Activitatea" else "View All Activity"

        "admin.dashboard.system_status.title" -> if (ro) "Status Sistem" else "System Status"
        "admin.dashboard.system_status.server_status" -> if (ro) "Status Server" else "Server Status"
        "admin.dashboard.system_status.database" -> if (ro) "Bază de date" else "Database"
        "admin.dashboard.system_status.api_response" -> if (ro) "Răspuns API" else "API Response"
        "admin.dashboard.system_status.provider_rates" -> if (ro) "Tarife Prestatori" else "Provider Rates"
        "admin.dashboard.system_status.competency_tests" -> if (ro) "Teste Competență" else "Competency Tests"
        "admin.dashboard.system_status.online" -> if (ro) "Online" else "Online"
        "admin.dashboard.system_status.healthy" -> if (ro) "Funcțională" else "Healthy"
        "admin.dashboard.system_status.fast" -> if (ro) "Rapid" else "Fast"
        "admin.dashboard.system_status.flexible" -> if (ro) "Flexibile" else "Flexible"
        "admin.dashboard.system_status.active" -> if (ro) "Active" else "Active"

        else -> key
    }
}

@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.PersonAddAlt1
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminEarlyAccessClientEntry
import com.trustora.app.core.models.AdminEarlyAccessProviderEntry
import com.trustora.app.core.models.AdminEarlyAccessTab
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun AdminEarlyAccessScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminEarlyAccessViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        AdminEarlyAccessTopBar(
            languageCode = languageCode,
            onBack = onBack,
        )

        if (!canAccessAdmin) {
            AdminEarlyAccessUnavailableState(languageCode = languageCode)
            return@Column
        }

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
                AdminEarlyAccessHeaderCard(
                    languageCode = languageCode,
                    pagination = viewModel.pagination,
                )
                AdminEarlyAccessTabsCard(
                    languageCode = languageCode,
                    selectedTab = viewModel.selectedTab,
                    onSelectedTabChange = { viewModel.selectedTab = it },
                )
                AdminEarlyAccessListCard(
                    languageCode = languageCode,
                    selectedTab = viewModel.selectedTab,
                    providers = viewModel.providers,
                    clients = viewModel.clients,
                    isLoading = viewModel.isLoading,
                    isLoadingMore = viewModel.isLoadingMore,
                    hasMorePages = viewModel.hasMorePages,
                    errorMessage = viewModel.errorMessage,
                    onLoadMore = {
                        viewModel.loadNextPage(
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

@Composable
private fun AdminEarlyAccessTopBar(
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
                text = earlyAccessString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = earlyAccessString("admin.early_access.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(74.dp))
    }
}

@Composable
private fun AdminEarlyAccessUnavailableState(languageCode: String) {
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
            text = earlyAccessString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = earlyAccessString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminEarlyAccessHeaderCard(
    languageCode: String,
    pagination: com.trustora.app.core.models.AdminEarlyAccessPagination?,
) {
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
            text = earlyAccessString("admin.early_access.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = earlyAccessString("admin.early_access.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )

        if (pagination != null) {
            val text = earlyAccessString("admin.early_access.pagination", languageCode)
                .replace("{current}", pagination.currentPage.toString())
                .replace("{last}", pagination.lastPage.toString())
                .replace("{total}", pagination.total.toString())
                .replace("{per_page}", pagination.perPage.toString())
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
    }
}

@Composable
private fun AdminEarlyAccessTabsCard(
    languageCode: String,
    selectedTab: AdminEarlyAccessTab,
    onSelectedTabChange: (AdminEarlyAccessTab) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(12.dp),
    ) {
        TabRow(
            selectedTabIndex = if (selectedTab == AdminEarlyAccessTab.PROVIDERS) 0 else 1,
            containerColor = Color.Transparent,
            contentColor = TrustoraPrimary,
        ) {
            Tab(
                selected = selectedTab == AdminEarlyAccessTab.PROVIDERS,
                onClick = { onSelectedTabChange(AdminEarlyAccessTab.PROVIDERS) },
                text = {
                    Text(earlyAccessString(AdminEarlyAccessTab.PROVIDERS.titleKey, languageCode))
                },
            )
            Tab(
                selected = selectedTab == AdminEarlyAccessTab.CLIENTS,
                onClick = { onSelectedTabChange(AdminEarlyAccessTab.CLIENTS) },
                text = {
                    Text(earlyAccessString(AdminEarlyAccessTab.CLIENTS.titleKey, languageCode))
                },
            )
        }
    }
}

@Composable
private fun AdminEarlyAccessListCard(
    languageCode: String,
    selectedTab: AdminEarlyAccessTab,
    providers: List<AdminEarlyAccessProviderEntry>,
    clients: List<AdminEarlyAccessClientEntry>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    hasMorePages: Boolean,
    errorMessage: String?,
    onLoadMore: () -> Unit,
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
            Icon(
                imageVector = Icons.Filled.PersonAddAlt1,
                contentDescription = null,
                tint = TrustoraPrimary,
                modifier = Modifier.size(14.dp),
            )
            Text(
                text = earlyAccessString(selectedTab.titleKey, languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        val countText = when (selectedTab) {
            AdminEarlyAccessTab.PROVIDERS -> earlyAccessString("admin.early_access.providers.description", languageCode)
                .replace("{count}", providers.size.toString())

            AdminEarlyAccessTab.CLIENTS -> earlyAccessString("admin.early_access.clients.description", languageCode)
                .replace("{count}", clients.size.toString())
        }
        Text(
            text = countText,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        when {
            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            !errorMessage.isNullOrBlank() -> {
                Text(
                    text = earlyAccessString("admin.early_access.error", languageCode) + " " + errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFB91C1C),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFEF2F2))
                        .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                        .padding(10.dp),
                )
            }

            selectedTab == AdminEarlyAccessTab.PROVIDERS && providers.isEmpty() -> {
                Text(
                    text = earlyAccessString("admin.early_access.providers.empty", languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraTertiaryText,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            selectedTab == AdminEarlyAccessTab.CLIENTS && clients.isEmpty() -> {
                Text(
                    text = earlyAccessString("admin.early_access.clients.empty", languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraTertiaryText,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            selectedTab == AdminEarlyAccessTab.PROVIDERS -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    providers.forEachIndexed { index, provider ->
                        AdminEarlyAccessProviderRow(
                            provider = provider,
                            languageCode = languageCode,
                        )
                        if (index == providers.lastIndex) {
                            LaunchedEffect(provider.id, hasMorePages, isLoadingMore) {
                                if (hasMorePages && !isLoadingMore) {
                                    onLoadMore()
                                }
                            }
                        }
                    }
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    clients.forEachIndexed { index, client ->
                        AdminEarlyAccessClientRow(
                            client = client,
                            languageCode = languageCode,
                        )
                        if (index == clients.lastIndex) {
                            LaunchedEffect(client.id, hasMorePages, isLoadingMore) {
                                if (hasMorePages && !isLoadingMore) {
                                    onLoadMore()
                                }
                            }
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

@Composable
private fun AdminEarlyAccessProviderRow(
    provider: AdminEarlyAccessProviderEntry,
    languageCode: String,
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
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = provider.fullName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                )
                Text(
                    text = provider.email,
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }
            AdminEarlyAccessScoreBadge(score = provider.score)
        }

        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.application_id", languageCode),
            value = provider.applicationId,
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.country", languageCode),
            value = provider.country ?: "-",
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.language", languageCode),
            value = provider.language.uppercase(),
        )

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = earlyAccessString("admin.early_access.columns.verification", languageCode),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
            AdminEarlyAccessVerificationBadge(
                languageCode = languageCode,
                isVerified = provider.isEmailVerified,
                isExpired = provider.isEmailVerificationExpired,
            )
        }

        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.verification_sent", languageCode),
            value = formatDateTime(provider.emailVerificationSentAtIso, languageCode),
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.verification_expires", languageCode),
            value = formatDateTime(provider.emailVerificationExpiresAtIso, languageCode),
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.created_at", languageCode),
            value = formatDate(provider.createdAtIso, languageCode),
        )
    }
}

@Composable
private fun AdminEarlyAccessClientRow(
    client: AdminEarlyAccessClientEntry,
    languageCode: String,
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
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = client.contactName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                )
                Text(
                    text = client.email,
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }
            AdminEarlyAccessScoreBadge(score = client.score)
        }

        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.company_name", languageCode),
            value = client.companyName,
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.application_id", languageCode),
            value = client.applicationId,
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.country", languageCode),
            value = client.country ?: "-",
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.language", languageCode),
            value = client.language.uppercase(),
        )

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = earlyAccessString("admin.early_access.columns.verification", languageCode),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
            AdminEarlyAccessVerificationBadge(
                languageCode = languageCode,
                isVerified = client.isEmailVerified,
                isExpired = client.isEmailVerificationExpired,
            )
        }

        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.verification_sent", languageCode),
            value = formatDateTime(client.emailVerificationSentAtIso, languageCode),
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.verification_expires", languageCode),
            value = formatDateTime(client.emailVerificationExpiresAtIso, languageCode),
        )
        AdminEarlyAccessKeyValue(
            label = earlyAccessString("admin.early_access.columns.created_at", languageCode),
            value = formatDate(client.createdAtIso, languageCode),
        )
    }
}

@Composable
private fun AdminEarlyAccessScoreBadge(score: Int) {
    Text(
        text = score.toString(),
        style = MaterialTheme.typography.labelSmall,
        color = Color(0xFF065F46),
        modifier = Modifier
            .clip(CircleShape)
            .background(Color(0xFFD1FAE5))
            .border(1.dp, Color(0xFFA7F3D0), CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun AdminEarlyAccessVerificationBadge(
    languageCode: String,
    isVerified: Boolean,
    isExpired: Boolean,
) {
    val style = when {
        isVerified -> {
            VerificationBadgeStyle(
                text = earlyAccessString("admin.early_access.status.verified", languageCode),
                textColor = Color(0xFF065F46),
                fill = Color(0xFFD1FAE5),
                border = Color(0xFFA7F3D0),
            )
        }

        isExpired -> {
            VerificationBadgeStyle(
                text = earlyAccessString("admin.early_access.status.expired", languageCode),
                textColor = Color(0xFF991B1B),
                fill = Color(0xFFFEE2E2),
                border = Color(0xFFFECACA),
            )
        }

        else -> {
            VerificationBadgeStyle(
                text = earlyAccessString("admin.early_access.status.unverified", languageCode),
                textColor = Color(0xFF92400E),
                fill = Color(0xFFFEF3C7),
                border = Color(0xFFFDE68A),
            )
        }
    }

    Text(
        text = style.text,
        style = MaterialTheme.typography.labelSmall,
        color = style.textColor,
        modifier = Modifier
            .clip(CircleShape)
            .background(style.fill)
            .border(1.dp, style.border, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun AdminEarlyAccessKeyValue(
    label: String,
    value: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.End,
        )
    }
}

private fun formatDate(raw: String?, languageCode: String): String {
    val value = raw?.trim().orEmpty()
    if (value.isEmpty()) return "-"

    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) {
        Locale.forLanguageTag("ro-RO")
    } else {
        Locale.US
    }

    val formatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)
    val instant = runCatching { Instant.parse(value) }.getOrNull()
    if (instant != null) {
        return formatter.format(instant.atZone(ZoneId.systemDefault()).toLocalDate())
    }

    val offsetDateTime = runCatching { OffsetDateTime.parse(value) }.getOrNull()
    if (offsetDateTime != null) {
        return formatter.format(offsetDateTime.toLocalDate())
    }

    return value.take(10)
}

private fun formatDateTime(raw: String?, languageCode: String): String {
    val value = raw?.trim().orEmpty()
    if (value.isEmpty()) return "-"

    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) {
        Locale.forLanguageTag("ro-RO")
    } else {
        Locale.US
    }

    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT).withLocale(locale)
    val instant = runCatching { Instant.parse(value) }.getOrNull()
    if (instant != null) {
        return formatter.format(instant.atZone(ZoneId.systemDefault()))
    }

    val offsetDateTime = runCatching { OffsetDateTime.parse(value) }.getOrNull()
    if (offsetDateTime != null) {
        return formatter.format(offsetDateTime)
    }

    return value
}

private data class VerificationBadgeStyle(
    val text: String,
    val textColor: Color,
    val fill: Color,
    val border: Color,
)

private fun earlyAccessString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.early_access.manage_title" -> if (ro) "Înscrieri Early Access" else "Early Access Applications"
        "admin.early_access.manage_subtitle" -> if (ro) "Vizualizează toate aplicațiile din pre-early stage" else "View all pre-early stage applications"
        "admin.early_access.providers.title" -> if (ro) "Prestatori înscriși" else "Signed-up Providers"
        "admin.early_access.providers.description" -> if (ro) "{count} prestatori înregistrați" else "{count} providers registered"
        "admin.early_access.providers.empty" -> if (ro) "Nu există prestatori înscriși momentan." else "There are no providers registered yet."
        "admin.early_access.clients.title" -> if (ro) "Clienți înscriși" else "Signed-up Clients"
        "admin.early_access.clients.description" -> if (ro) "{count} clienți înregistrați" else "{count} clients registered"
        "admin.early_access.clients.empty" -> if (ro) "Nu există clienți înscriși momentan." else "There are no clients registered yet."
        "admin.early_access.columns.company_name" -> if (ro) "Companie" else "Company"
        "admin.early_access.columns.application_id" -> if (ro) "ID aplicație" else "Application ID"
        "admin.early_access.columns.country" -> if (ro) "Țară" else "Country"
        "admin.early_access.columns.language" -> if (ro) "Limbă" else "Language"
        "admin.early_access.columns.verification" -> if (ro) "Verificare email" else "Email verification"
        "admin.early_access.columns.verification_sent" -> if (ro) "Email trimis" else "Email sent"
        "admin.early_access.columns.verification_expires" -> if (ro) "Expiră" else "Expires"
        "admin.early_access.columns.created_at" -> if (ro) "Înscris la" else "Signed up on"
        "admin.early_access.status.verified" -> if (ro) "Verificat" else "Verified"
        "admin.early_access.status.unverified" -> if (ro) "Neconfirmat" else "Unverified"
        "admin.early_access.status.expired" -> if (ro) "Expirat" else "Expired"
        "admin.early_access.pagination" -> if (ro) "Pagina {current} din {last} • {total} total • {per_page} / pagină" else "Page {current} of {last} • {total} total • {per_page} / page"
        "admin.early_access.error" -> if (ro) "Nu am putut încărca înscrierile." else "We couldn't load the applications."

        else -> key
    }
}

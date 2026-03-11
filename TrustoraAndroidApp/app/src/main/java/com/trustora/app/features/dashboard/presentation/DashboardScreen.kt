package com.trustora.app.features.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.BubbleChart
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AppLanguage
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.utils.formatMoney
import com.trustora.app.designsystem.components.AuthAvatar
import com.trustora.app.designsystem.components.BrandLockup
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

private fun tr(languageCode: String, en: String, ro: String): String {
    return if (languageCode.startsWith("ro", ignoreCase = true)) ro else en
}

private fun languageBadgeIcon(appLanguage: AppLanguage, languageCode: String): String {
    return when (appLanguage) {
        AppLanguage.SYSTEM -> "\uD83C\uDF10"
        AppLanguage.EN -> "\uD83C\uDDFA\uD83C\uDDF8"
        AppLanguage.RO -> "\uD83C\uDDF7\uD83C\uDDF4"
    }.ifBlank {
        if (languageCode.startsWith("ro", ignoreCase = true)) "\uD83C\uDDF7\uD83C\uDDF4" else "\uD83C\uDDFA\uD83C\uDDF8"
    }
}

private fun languageBadgeLabel(appLanguage: AppLanguage, languageCode: String): String {
    return when (appLanguage) {
        AppLanguage.SYSTEM -> tr(languageCode, "System", "Sistem")
        AppLanguage.EN -> "EN"
        AppLanguage.RO -> "RO"
    }
}

private fun currencyBadgeIcon(currency: AppCurrency): String {
    return when (currency) {
        AppCurrency.USD -> "\uD83C\uDDFA\uD83C\uDDF8"
        AppCurrency.EUR -> "\uD83C\uDDEA\uD83C\uDDFA"
        AppCurrency.RON -> "\uD83C\uDDF7\uD83C\uDDF4"
    }
}

private fun transferConfirmationAmountText(
    amountText: String,
    selectedWalletCurrency: String?,
    languageCode: String,
): String {
    val normalized = amountText.replace(",", ".")
    val value = normalized.toDoubleOrNull()
    return formatAmountByCurrencyCode(
        amount = value,
        currencyCode = selectedWalletCurrency,
        languageCode = languageCode,
        maximumFractionDigits = 2,
    )
}

private fun chatTimestampLabel(timestampIso: String?): String? {
    if (timestampIso.isNullOrBlank()) return null
    val value = timestampIso.trim()
    if (value.length >= 16 && value[10] == 'T') {
        return value.substring(11, 16)
    }
    return value.takeLast(5).takeIf { it.any(Char::isDigit) }
}

@Composable
fun DashboardScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    appLanguage: AppLanguage,
    currency: AppCurrency,
    onSetLanguage: (AppLanguage) -> Unit,
    onSetCurrency: (AppCurrency) -> Unit,
    viewModel: DashboardViewModel,
    onBack: () -> Unit,
    onOpenCreateProject: () -> Unit,
    onSignOut: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current
    var rapydOnboardingUrl by rememberSaveable { mutableStateOf<String?>(null) }
    var rapydMenuError by rememberSaveable { mutableStateOf<String?>(null) }
    var showTransferConfirmation by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        viewModel.attachRealtime(
            user = user,
            token = token,
            language = languageCode,
            currency = currency,
        )
        viewModel.reloadAll(
            user = user,
            token = token,
            language = languageCode,
            currency = currency,
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.detachRealtime()
        }
    }

    LaunchedEffect(viewModel.activeTab, user.id, token, languageCode, currency.raw) {
        viewModel.loadDataForActiveTab(
            user = user,
            token = token,
            language = languageCode,
            currency = currency,
        )
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
            DashboardHeader(
                user = user,
                languageCode = languageCode,
                appLanguage = appLanguage,
                currency = currency,
                onSetLanguage = onSetLanguage,
                onSetCurrency = onSetCurrency,
                onBack = onBack,
                isProvider = viewModel.isProvider,
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                val activeError = when (viewModel.activeTab) {
                    DashboardTab.OVERVIEW -> viewModel.overviewError
                    DashboardTab.PROJECTS -> viewModel.projectsError
                    DashboardTab.SERVICES -> viewModel.servicesError
                    DashboardTab.MESSAGES -> viewModel.messagesError
                    DashboardTab.FINANCE -> viewModel.financeError
                    DashboardTab.SETTINGS -> viewModel.settingsError
                        ?: viewModel.companySettingsError
                        ?: viewModel.companyManagersError
                        ?: viewModel.companySearchError
                        ?: viewModel.currencySearchError
                        ?: viewModel.locationOptionsError
                }
                if (!activeError.isNullOrBlank()) {
                    ErrorBanner(text = activeError)
                }
                if (!rapydMenuError.isNullOrBlank()) {
                    ErrorBanner(text = rapydMenuError ?: "")
                }

                when (viewModel.activeTab) {
                    DashboardTab.OVERVIEW -> OverviewSection(
                        languageCode = languageCode,
                        currency = currency,
                        viewModel = viewModel,
                    )

                    DashboardTab.PROJECTS -> ProjectsSection(
                        languageCode = languageCode,
                        user = user,
                        currency = currency,
                        viewModel = viewModel,
                        onOpenCreateProject = onOpenCreateProject,
                        onRespond = { projectId, response ->
                            scope.launch {
                                viewModel.respondToProject(
                                    projectId = projectId,
                                    response = response,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            }
                        },
                        onAdvanceMilestone = { projectId, milestone ->
                            scope.launch {
                                viewModel.advanceMilestone(
                                    projectId = projectId,
                                    milestone = milestone,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            }
                        },
                    )

                    DashboardTab.SERVICES -> ServicesSection(
                        languageCode = languageCode,
                        viewModel = viewModel,
                    )

                    DashboardTab.MESSAGES -> MessagesSection(
                        languageCode = languageCode,
                        user = user,
                        viewModel = viewModel,
                        onSelectGroup = { groupId ->
                            scope.launch { viewModel.selectChatGroup(groupId, token) }
                        },
                        onSendMessage = {
                            scope.launch { viewModel.sendCurrentChatMessage(token, languageCode) }
                        },
                        onMarkRead = {
                            scope.launch { viewModel.markSelectedGroupAsRead(token) }
                        },
                    )

                    DashboardTab.FINANCE -> FinanceSection(
                        languageCode = languageCode,
                        user = user,
                        isProvider = viewModel.isProvider,
                        currency = currency,
                        viewModel = viewModel,
                        rapydOnboardingUrl = rapydOnboardingUrl,
                        onConnectRapyd = {
                            scope.launch {
                                rapydMenuError = null
                                val onboarding = viewModel.connectRapyd(
                                    token = token,
                                    language = languageCode,
                                )
                                if (onboarding?.walletId.isNullOrBlank()) {
                                    rapydMenuError = tr(languageCode, "Invalid Rapyd onboarding response.", "Răspuns Rapyd invalid.")
                                    return@launch
                                }
                                rapydOnboardingUrl = onboarding?.url
                                viewModel.loadFinance(token = token, language = languageCode)
                                if (viewModel.wallets.isEmpty()) {
                                    delay(900)
                                    viewModel.loadFinance(token = token, language = languageCode)
                                }
                            }
                        },
                        onTransferRequested = { showTransferConfirmation = true },
                        onOpenRapydUrl = { url ->
                            runCatching {
                                uriHandler.openUri(url)
                            }.onFailure {
                                rapydMenuError = tr(languageCode, "Unable to open Rapyd URL.", "Nu pot deschide URL-ul Rapyd.")
                            }
                        },
                    )

                    DashboardTab.SETTINGS -> SettingsSection(
                        languageCode = languageCode,
                        user = user,
                        token = token,
                        viewModel = viewModel,
                        onReloadSettings = {
                            scope.launch { viewModel.loadSettings(user = user, token = token, language = languageCode) }
                        },
                        onSaveCompanyInfo = {
                            scope.launch {
                                viewModel.saveCompanyInformation(
                                    user = user,
                                    token = token,
                                    language = languageCode,
                                )
                            }
                        },
                        onSignOut = onSignOut,
                    )
                }

                Spacer(modifier = Modifier.height(92.dp))
            }
        }

        DashboardBottomNavigation(
            languageCode = languageCode,
            activeTab = viewModel.activeTab,
            availableTabs = viewModel.availableTabs,
            onSelect = viewModel::selectTab,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 14.dp, vertical = 8.dp),
        )
    }

    if (showTransferConfirmation) {
        AlertDialog(
            onDismissRequest = { showTransferConfirmation = false },
            title = {
                Text(
                    tr(languageCode, "Confirm transfer", "Confirmă transferul"),
                    color = TrustoraPrimary,
                    fontWeight = FontWeight.Bold,
                )
            },
            text = {
                Text(
                    tr(languageCode, "Transfer amount:", "Suma transferului:") +
                        " " +
                        transferConfirmationAmountText(
                            amountText = viewModel.transferAmount,
                            selectedWalletCurrency = viewModel.selectedWallet?.currency,
                            languageCode = languageCode,
                        ),
                    color = TrustoraSecondaryText,
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showTransferConfirmation = false
                        scope.launch {
                            viewModel.transfer(
                                token = token,
                                language = languageCode,
                                currency = currency,
                                invalidAmountText = tr(languageCode, "Invalid amount.", "Suma este invalidă."),
                                insufficientBalanceText = tr(languageCode, "Insufficient balance.", "Fonduri insuficiente."),
                            )
                        }
                    },
                ) {
                    Text(tr(languageCode, "Transfer", "Transferă"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showTransferConfirmation = false }) {
                    Text(tr(languageCode, "Cancel", "Anulează"))
                }
            },
        )
    }
}

@Composable
private fun DashboardHeader(
    user: AuthUser,
    languageCode: String,
    appLanguage: AppLanguage,
    currency: AppCurrency,
    onSetLanguage: (AppLanguage) -> Unit,
    onSetCurrency: (AppCurrency) -> Unit,
    onBack: () -> Unit,
    isProvider: Boolean,
) {
    var languageMenuOpen by remember { mutableStateOf(false) }
    var currencyMenuOpen by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.84f))
            .border(width = 0.8.dp, color = TrustoraBorder.copy(alpha = 0.92f), shape = RoundedCornerShape(bottomStart = 0.dp, bottomEnd = 0.dp))
            .padding(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(Color.White.copy(alpha = 0.78f), RoundedCornerShape(10.dp))
                    .border(0.8.dp, TrustoraBorder.copy(alpha = 0.92f), RoundedCornerShape(10.dp))
                    .clickable(onClick = onBack),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = tr(languageCode, "Close", "Închide"),
                    tint = TrustoraPrimary,
                    modifier = Modifier.size(16.dp),
                )
            }

            BrandLockup(
                compact = true,
                tagline = tr(languageCode, "Trustworthy digital collaboration", "Colaborare digitală de încredere"),
                modifier = Modifier.weight(1f),
            )

            Box {
                HeaderControlButton(
                    icon = languageBadgeIcon(appLanguage, languageCode),
                    label = languageBadgeLabel(appLanguage, languageCode),
                    onClick = { languageMenuOpen = true },
                )
                DropdownMenu(
                    expanded = languageMenuOpen,
                    onDismissRequest = { languageMenuOpen = false },
                ) {
                    DropdownMenuItem(
                        text = { Text(tr(languageCode, "System", "Sistem")) },
                        onClick = {
                            languageMenuOpen = false
                            onSetLanguage(AppLanguage.SYSTEM)
                        },
                    )
                    DropdownMenuItem(
                        text = { Text(tr(languageCode, "English", "Engleză")) },
                        onClick = {
                            languageMenuOpen = false
                            onSetLanguage(AppLanguage.EN)
                        },
                    )
                    DropdownMenuItem(
                        text = { Text(tr(languageCode, "Romanian", "Română")) },
                        onClick = {
                            languageMenuOpen = false
                            onSetLanguage(AppLanguage.RO)
                        },
                    )
                }
            }

            Box {
                HeaderControlButton(
                    icon = currencyBadgeIcon(currency),
                    label = currency.raw,
                    onClick = { currencyMenuOpen = true },
                )
                DropdownMenu(
                    expanded = currencyMenuOpen,
                    onDismissRequest = { currencyMenuOpen = false },
                ) {
                    AppCurrency.entries.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option.raw) },
                            onClick = {
                                currencyMenuOpen = false
                                onSetCurrency(option)
                            },
                        )
                    }
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = tr(languageCode, "Welcome, ${user.displayName}", "Bine ai venit, ${user.displayName}"),
                style = MaterialTheme.typography.titleMedium.copy(fontSize = 18.sp),
                color = TrustoraPrimary,
                fontWeight = FontWeight.Black,
                maxLines = 1,
            )
            Text(
                text = if (isProvider) {
                    tr(languageCode, "Manage your active projects and delivery.", "Gestionează proiectele active și livrările.")
                } else {
                    tr(languageCode, "Track requests, services and conversations.", "Urmărește cereri, servicii și conversații.")
                },
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                color = TrustoraTertiaryText,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun HeaderControlButton(
    icon: String,
    label: String,
    onClick: () -> Unit,
) {
    TextButton(
        onClick = onClick,
        shape = RoundedCornerShape(11.dp),
        colors = ButtonDefaults.textButtonColors(contentColor = TrustoraPrimary),
        modifier = Modifier
            .background(Color.White.copy(alpha = 0.78f), RoundedCornerShape(11.dp))
            .border(0.8.dp, TrustoraBorder.copy(alpha = 0.92f), RoundedCornerShape(11.dp)),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = icon,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                maxLines = 1,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun DashboardBottomNavigation(
    languageCode: String,
    activeTab: DashboardTab,
    availableTabs: List<DashboardTab>,
    onSelect: (DashboardTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val primaryTabs = listOf(
        DashboardTab.OVERVIEW,
        DashboardTab.PROJECTS,
        DashboardTab.SERVICES,
        DashboardTab.MESSAGES,
    ).filter(availableTabs::contains)
    val secondaryTabs = availableTabs.filterNot(primaryTabs::contains)
    val hasSecondaryActive = secondaryTabs.contains(activeTab)
    var secondaryMenuOpen by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .shadow(elevation = 14.dp, shape = RoundedCornerShape(100.dp), clip = false)
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.95f), RoundedCornerShape(100.dp))
            .border(1.dp, Color.White.copy(alpha = 0.64f), RoundedCornerShape(100.dp))
            .padding(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .weight(1f)
                .height(54.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            primaryTabs.forEach { tab ->
                val selected = tab == activeTab
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            color = if (selected) TrustoraAccent.copy(alpha = 0.9f) else Color.Transparent,
                            shape = RoundedCornerShape(18.dp),
                        )
                        .clickable { onSelect(tab) }
                        .padding(vertical = 6.dp, horizontal = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Icon(
                        imageVector = dashboardTabIcon(tab),
                        contentDescription = null,
                        tint = if (selected) TrustoraAccentButtonText else TrustoraSecondaryText,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        text = dashboardTabLabel(languageCode, tab),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                            fontSize = 10.sp,
                        ),
                        color = if (selected) TrustoraAccentButtonText else TrustoraSecondaryText,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }

        if (secondaryTabs.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .height(54.dp)
                    .width(56.dp)
                    .background(
                        color = if (hasSecondaryActive) TrustoraAccent.copy(alpha = 0.9f) else Color.Transparent,
                        RoundedCornerShape(18.dp),
                    )
                    .clickable { secondaryMenuOpen = true },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.MoreHoriz,
                    contentDescription = tr(languageCode, "More tabs", "Mai multe tab-uri"),
                    tint = if (hasSecondaryActive) TrustoraAccentButtonText else TrustoraSecondaryText,
                )
                DropdownMenu(
                    expanded = secondaryMenuOpen,
                    onDismissRequest = { secondaryMenuOpen = false },
                ) {
                    secondaryTabs.forEach { tab ->
                        DropdownMenuItem(
                            text = { Text(dashboardTabLabel(languageCode, tab)) },
                            onClick = {
                                secondaryMenuOpen = false
                                onSelect(tab)
                            },
                            leadingIcon = { Icon(dashboardTabIcon(tab), contentDescription = null) },
                        )
                    }
                }
            }
        }
    }
}

private fun dashboardTabIcon(tab: DashboardTab) = when (tab) {
    DashboardTab.OVERVIEW -> Icons.Default.GridView
    DashboardTab.PROJECTS -> Icons.Default.BusinessCenter
    DashboardTab.SERVICES -> Icons.Default.TrackChanges
    DashboardTab.MESSAGES -> Icons.Default.BubbleChart
    DashboardTab.FINANCE -> Icons.Default.AttachMoney
    DashboardTab.SETTINGS -> Icons.Default.Settings
}

private fun dashboardTabLabel(languageCode: String, tab: DashboardTab): String {
    return when (tab) {
        DashboardTab.OVERVIEW -> tr(languageCode, "Overview", "Overview")
        DashboardTab.PROJECTS -> tr(languageCode, "Projects", "Proiecte")
        DashboardTab.SERVICES -> tr(languageCode, "Services", "Servicii")
        DashboardTab.MESSAGES -> tr(languageCode, "Messages", "Mesaje")
        DashboardTab.FINANCE -> tr(languageCode, "Finance", "Finanțe")
        DashboardTab.SETTINGS -> tr(languageCode, "Settings", "Setări")
    }
}

@Composable
private fun OverviewSection(
    languageCode: String,
    currency: AppCurrency,
    viewModel: DashboardViewModel,
) {
    if (viewModel.isLoadingOverview) {
        SimplePlaceholder(text = tr(languageCode, "Loading overview...", "Se încarcă overview..."))
    }

    val statsCards = dashboardOverviewCards(
        languageCode = languageCode,
        isProvider = viewModel.isProvider,
        values = viewModel.stats?.values.orEmpty(),
        currencyCode = currency.raw,
    )
    if (statsCards.isEmpty()) {
        SimplePlaceholder(text = tr(languageCode, "No stats available.", "Nu există statistici."))
    } else {
        statsCards.chunked(2).forEach { rowCards ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                rowCards.forEach { card ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
                            .padding(14.dp),
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .background(card.color.copy(alpha = 0.15f), RoundedCornerShape(100.dp)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = card.icon,
                                    contentDescription = null,
                                    tint = card.color,
                                    modifier = Modifier.size(14.dp),
                                )
                            }
                            Text(
                                text = card.title,
                                style = MaterialTheme.typography.labelMedium,
                                color = TrustoraTertiaryText,
                                maxLines = 2,
                            )
                            Text(
                                text = card.value,
                                style = MaterialTheme.typography.titleLarge.copy(fontSize = 20.sp),
                                color = TrustoraPrimary,
                                fontWeight = FontWeight.Black,
                                maxLines = 1,
                            )
                            Text(
                                text = card.change,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                color = TrustoraSecondaryText,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
                if (rowCards.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }

    DashboardSectionCard(
        title = if (viewModel.isProvider) {
            tr(languageCode, "Active requests", "Cereri active")
        } else {
            tr(languageCode, "Your projects", "Proiectele tale")
        },
        subtitle = tr(languageCode, "Projects", "Proiecte"),
    ) {
        if (viewModel.overviewProjects.isEmpty()) {
            Text(
                text = tr(languageCode, "No projects yet.", "Nu există proiecte."),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraTertiaryText,
            )
        } else {
            viewModel.overviewProjects.forEach { project ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 9.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Text(
                            text = project.title,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TrustoraPrimary,
                            fontWeight = FontWeight.Bold,
                            maxLines = 2,
                        )
                        Text(
                            text = project.status,
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                            maxLines = 1,
                        )
                    }
                    Text(
                        text = formatMoney(
                            amount = project.budget.amount ?: 0.0,
                            currency = AppCurrency.fromRaw(project.budget.currency),
                            locale = if (languageCode == "ro") Locale.forLanguageTag("ro-RO") else Locale.getDefault(),
                            maximumFractionDigits = 0,
                        ),
                        style = MaterialTheme.typography.labelLarge,
                        color = TrustoraPrimary,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
            }
        }
    }

    DashboardSectionCard(
        title = tr(languageCode, "Recent activities", "Activități recente"),
        subtitle = tr(languageCode, "Messages", "Mesaje"),
    ) {
        if (viewModel.recentActivities.isEmpty()) {
            Text(
                text = tr(languageCode, "No recent activities.", "Nu există activități recente."),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraTertiaryText,
            )
        } else {
            viewModel.recentActivities.take(3).forEach { activity ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 9.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Text(
                        text = activity.title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimary,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = listOfNotNull(activity.timeAgo, activity.actorName)
                            .joinToString(separator = " • ")
                            .ifBlank { activity.action ?: "-" },
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }
        }
    }
}

private data class DashboardStatCard(
    val title: String,
    val value: String,
    val change: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val color: Color,
)

private fun dashboardOverviewCards(
    languageCode: String,
    isProvider: Boolean,
    values: Map<String, Double>,
    currencyCode: String,
): List<DashboardStatCard> {
    fun numericText(value: Double?): String {
        val number = value ?: return "-"
        return if (number % 1.0 == 0.0) number.toInt().toString() else String.format(Locale.ROOT, "%.1f", number)
    }

    fun signedChangeText(value: Double?): String {
        val number = value ?: return tr(languageCode, "No change", "Fără schimbare")
        val sign = if (number > 0) "+" else ""
        return if (number % 1.0 == 0.0) "$sign${number.toInt()}" else "$sign${String.format(Locale.ROOT, "%.1f", number)}"
    }

    fun percentageText(value: Double?): String {
        val number = value ?: return tr(languageCode, "No change", "Fără schimbare")
        val sign = if (number > 0) "+" else ""
        return "$sign${String.format(Locale.ROOT, "%.1f", number)}%"
    }

    fun moneyText(value: Double?): String {
        return formatAmountByCurrencyCode(
            amount = value,
            currencyCode = currencyCode,
            languageCode = languageCode,
            maximumFractionDigits = 0,
        )
    }

    fun valueFor(vararg keys: String): Double? {
        keys.forEach { key ->
            val direct = values[key]
            if (direct != null) return direct
            val snake = key.replace(" ", "_").lowercase(Locale.ROOT)
            val snakeValue = values[snake]
            if (snakeValue != null) return snakeValue
        }
        return null
    }

    return if (isProvider) {
        listOf(
            DashboardStatCard(
                title = tr(languageCode, "Active projects", "Proiecte active"),
                value = numericText(valueFor("active_projects", "activeProjects")),
                change = signedChangeText(valueFor("active_projects_change", "activeProjects_change")),
                icon = Icons.Default.BusinessCenter,
                color = Color(0xFF2563EB),
            ),
            DashboardStatCard(
                title = tr(languageCode, "Monthly revenue", "Venit lunar"),
                value = moneyText(valueFor("monthly_revenue", "monthlyRevenue")),
                change = percentageText(valueFor("monthly_revenue_change_percentage", "monthlyRevenue_change_percentage")),
                icon = Icons.Default.AttachMoney,
                color = Color(0xFF059669),
            ),
            DashboardStatCard(
                title = tr(languageCode, "Average rating", "Rating mediu"),
                value = numericText(valueFor("average_rating", "averageRating")),
                change = signedChangeText(valueFor("average_rating_change", "averageRating_change")),
                icon = Icons.Default.TrackChanges,
                color = Color(0xFFF59E0B),
            ),
            DashboardStatCard(
                title = tr(languageCode, "New requests", "Cereri noi"),
                value = numericText(valueFor("new_requests", "newRequests")),
                change = signedChangeText(valueFor("new_requests_change", "newRequests_change")),
                icon = Icons.Default.GridView,
                color = Color(0xFF7C3AED),
            ),
        )
    } else {
        listOf(
            DashboardStatCard(
                title = tr(languageCode, "Projects posted", "Proiecte publicate"),
                value = numericText(valueFor("projects_posted", "projectsPosted")),
                change = signedChangeText(valueFor("projects_posted_change", "projectsPosted_change")),
                icon = Icons.Default.BusinessCenter,
                color = Color(0xFF2563EB),
            ),
            DashboardStatCard(
                title = tr(languageCode, "Budget spent", "Buget cheltuit"),
                value = moneyText(valueFor("budget_spent", "budgetSpent")),
                change = percentageText(valueFor("budget_spent_change_percentage", "budgetSpent_change_percentage")),
                icon = Icons.Default.AttachMoney,
                color = Color(0xFF059669),
            ),
            DashboardStatCard(
                title = tr(languageCode, "Projects completed", "Proiecte finalizate"),
                value = numericText(valueFor("projects_completed", "projectsCompleted")),
                change = signedChangeText(valueFor("projects_completed_change", "projectsCompleted_change")),
                icon = Icons.Default.TrackChanges,
                color = Color(0xFF0C8F5D),
            ),
            DashboardStatCard(
                title = tr(languageCode, "Active providers", "Provideri activi"),
                value = numericText(valueFor("active_providers", "activeProviders")),
                change = signedChangeText(valueFor("active_providers_change", "activeProviders_change")),
                icon = Icons.Default.BubbleChart,
                color = Color(0xFF7C3AED),
            ),
        )
    }
}

private fun dashboardStatusLabel(rawStatus: String, languageCode: String): String {
    return when (rawStatus.lowercase(Locale.ROOT)) {
        "all" -> tr(languageCode, "All", "Toate")
        "pending_responses" -> tr(languageCode, "Pending responses", "Răspunsuri în așteptare")
        "work_in_progress", "in_progress" -> tr(languageCode, "In progress", "În progres")
        "awaiting_budget_approval", "new_propose", "budget_proposed", "proposed" -> tr(languageCode, "Budget proposed", "Buget propus")
        "completed" -> tr(languageCode, "Completed", "Finalizat")
        "finished" -> tr(languageCode, "Finished", "Terminat")
        "paid", "released" -> tr(languageCode, "Paid", "Plătit")
        "cancelled" -> tr(languageCode, "Cancelled", "Anulat")
        "pending" -> tr(languageCode, "Pending", "În așteptare")
        "accepted" -> tr(languageCode, "Accepted", "Acceptat")
        "rejected" -> tr(languageCode, "Rejected", "Respins")
        "escrow", "blocked" -> tr(languageCode, "Escrow", "Escrow")
        else -> rawStatus.replace("_", " ").replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
    }
}

private fun dashboardSortLabel(sort: DashboardProjectSort, languageCode: String): String {
    return when (sort) {
        DashboardProjectSort.NEWEST -> tr(languageCode, "Newest", "Cele mai noi")
        DashboardProjectSort.OLDEST -> tr(languageCode, "Oldest", "Cele mai vechi")
        DashboardProjectSort.BUDGET -> tr(languageCode, "Budget", "Buget")
        DashboardProjectSort.TITLE -> tr(languageCode, "Title", "Titlu")
    }
}

@Composable
private fun DashboardFilterCapsule(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .height(38.dp)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(11.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(11.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = TrustoraPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        Icon(
            imageVector = Icons.Default.ArrowDropDown,
            contentDescription = null,
            tint = TrustoraSecondaryText,
            modifier = Modifier.size(15.dp),
        )
    }
}

@Composable
private fun ProjectsSection(
    languageCode: String,
    user: AuthUser,
    currency: AppCurrency,
    viewModel: DashboardViewModel,
    onOpenCreateProject: () -> Unit,
    onRespond: suspend (projectId: String, response: String) -> Unit,
    onAdvanceMilestone: suspend (projectId: String, milestone: com.trustora.app.core.models.DashboardProjectMilestone) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var statusMenuOpen by remember { mutableStateOf(false) }
    var sortMenuOpen by remember { mutableStateOf(false) }
    val statusOptions = if (viewModel.isProvider) {
        listOf("all", "PENDING", "ACCEPTED", "REJECTED", "BUDGET_PROPOSED")
    } else {
        listOf("all", "PENDING_RESPONSES", "IN_PROGRESS", "COMPLETED", "CANCELLED")
    }
    val hasActiveFilters =
        viewModel.searchTerm.isNotBlank() ||
            !viewModel.statusFilter.equals("all", ignoreCase = true) ||
            viewModel.sortBy != DashboardProjectSort.NEWEST ||
            viewModel.sortOrder != DashboardSortOrder.DESC

    if (!viewModel.isProvider) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
        ) {
            Button(
                onClick = onOpenCreateProject,
                shape = RoundedCornerShape(11.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                Text(
                    text = tr(languageCode, "Create Project", "Creează proiect"),
                    fontWeight = FontWeight.Black,
                )
            }
        }
    }

    DashboardSectionCard(
        title = tr(languageCode, "Project filters", "Filtre proiecte"),
        subtitle = tr(languageCode, "Search, sort and status selection", "Căutare, sortare și selecție status"),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                .padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = null,
                tint = TrustoraTertiaryText,
                modifier = Modifier.size(14.dp),
            )
            TextField(
                value = viewModel.searchTerm,
                onValueChange = viewModel::updateSearchTerm,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                singleLine = true,
                placeholder = { Text(tr(languageCode, "Search projects", "Caută proiecte")) },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    disabledIndicatorColor = Color.Transparent,
                ),
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(modifier = Modifier.weight(1f)) {
                DashboardFilterCapsule(
                    title = dashboardStatusLabel(viewModel.statusFilter, languageCode),
                    onClick = { statusMenuOpen = true },
                    modifier = Modifier.fillMaxWidth(),
                )
                DropdownMenu(expanded = statusMenuOpen, onDismissRequest = { statusMenuOpen = false }) {
                    statusOptions.forEach { option ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = if (option.equals(viewModel.statusFilter, ignoreCase = true)) {
                                        "✓ ${dashboardStatusLabel(option, languageCode)}"
                                    } else {
                                        dashboardStatusLabel(option, languageCode)
                                    },
                                )
                            },
                            onClick = {
                                statusMenuOpen = false
                                viewModel.updateStatusFilter(option)
                            },
                        )
                    }
                }
            }

            Box(modifier = Modifier.weight(1f)) {
                DashboardFilterCapsule(
                    title = dashboardSortLabel(viewModel.sortBy, languageCode),
                    onClick = { sortMenuOpen = true },
                    modifier = Modifier.fillMaxWidth(),
                )
                DropdownMenu(expanded = sortMenuOpen, onDismissRequest = { sortMenuOpen = false }) {
                    DashboardProjectSort.entries.forEach { option ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = if (option == viewModel.sortBy) {
                                        "✓ ${dashboardSortLabel(option, languageCode)}"
                                    } else {
                                        dashboardSortLabel(option, languageCode)
                                    },
                                )
                            },
                            onClick = {
                                sortMenuOpen = false
                                viewModel.updateSortBy(option)
                            },
                        )
                    }
                }
            }
            Box(
                modifier = Modifier
                    .height(38.dp)
                    .width(38.dp)
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(11.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(11.dp))
                    .clickable { viewModel.toggleSortOrder() },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = if (viewModel.sortOrder == DashboardSortOrder.ASC) "↑" else "↓",
                    color = TrustoraPrimary,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                )
            }
        }

        if (hasActiveFilters) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = tr(languageCode, "Active filters", "Filtre active"),
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = TrustoraTertiaryText,
                )
                Spacer(modifier = Modifier.weight(1f))
                TextButton(onClick = viewModel::resetFilters) {
                    Text(
                        text = tr(languageCode, "Reset all", "Resetează tot"),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF0C8F5D),
                    )
                }
            }
        }
    }

    if (viewModel.isLoadingProjects) {
        SimplePlaceholder(text = tr(languageCode, "Loading projects...", "Se încarcă proiectele..."))
    }

    if (viewModel.paginatedProjects.isEmpty()) {
        SimplePlaceholder(text = tr(languageCode, "No projects available.", "Nu există proiecte disponibile."))
    } else {
        Text(
            text = tr(languageCode, "Found", "Găsite") + ": ${viewModel.filteredProjects.size}",
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
            color = TrustoraTertiaryText,
        )
        viewModel.paginatedProjects.forEach { project ->
            ProjectCard(
                languageCode = languageCode,
                user = user,
                project = project,
                currency = currency,
                viewModel = viewModel,
                onRespond = onRespond,
                onAdvanceMilestone = onAdvanceMilestone,
                scope = scope,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            TextButton(onClick = viewModel::goToPreviousPage, enabled = viewModel.currentPage > 1) {
                Text(
                    text = tr(languageCode, "Previous", "Anterior"),
                    color = if (viewModel.currentPage > 1) TrustoraPrimary else Color(0xFF94A3B8),
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                )
            }
            Text(
                "${viewModel.currentPage} / ${viewModel.totalPages}",
                color = TrustoraTertiaryText,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
            )
            TextButton(onClick = viewModel::goToNextPage, enabled = viewModel.currentPage < viewModel.totalPages) {
                Text(
                    text = tr(languageCode, "Next", "Următor"),
                    color = if (viewModel.currentPage < viewModel.totalPages) TrustoraPrimary else Color(0xFF94A3B8),
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                )
            }
        }
    }
}

@Composable
private fun ProjectCard(
    languageCode: String,
    user: AuthUser,
    project: DashboardProjectSummary,
    currency: AppCurrency,
    viewModel: DashboardViewModel,
    onRespond: suspend (projectId: String, response: String) -> Unit,
    onAdvanceMilestone: suspend (projectId: String, milestone: com.trustora.app.core.models.DashboardProjectMilestone) -> Unit,
    scope: kotlinx.coroutines.CoroutineScope,
) {
    val displayStatus = viewModel.projectDisplayStatus(project, user.id)
    val milestones = viewModel.projectMilestones(project, user.id)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = project.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = TrustoraPrimary,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                )
                if (project.description.isNotBlank()) {
                    Text(
                        text = project.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = TrustoraTertiaryText,
                        maxLines = 3,
                    )
                }
            }
            ProjectStatusBadge(
                status = displayStatus,
                languageCode = languageCode,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = formatMoney(
                    amount = project.budget.amount ?: 0.0,
                    currency = currency,
                    locale = if (languageCode == "ro") Locale.forLanguageTag("ro-RO") else Locale.getDefault(),
                    maximumFractionDigits = 0,
                ),
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraPrimary,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = project.createdAtIso?.take(10) ?: "-",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = tr(languageCode, "Milestones", "Milestone") + ": ${if (milestones.isEmpty()) project.milestoneCount else milestones.size}",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }

        if (viewModel.canProviderRespond(project)) {
            val isResponding = viewModel.respondingProjectIds.contains(project.id)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { scope.launch { onRespond(project.id, "ACCEPTED") } },
                    enabled = !isResponding,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                    ),
                ) {
                    Text(tr(languageCode, "Accept", "Acceptă"))
                }
                OutlinedButton(
                    onClick = { scope.launch { onRespond(project.id, "REJECTED") } },
                    enabled = !isResponding,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFFFEE2E2),
                        contentColor = Color(0xFF7F1D1D),
                    ),
                ) {
                    Text(tr(languageCode, "Reject", "Respinge"))
                }
            }
        }

        if (milestones.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                milestones.forEach { milestone ->
                    val action = viewModel.nextMilestoneAction(milestone)
                    val updateKey = "${project.id}|${milestone.id}"
                    val isUpdating = viewModel.updatingMilestoneIds.contains(updateKey)

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(10.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(2.dp),
                            ) {
                                Text(milestone.title, color = TrustoraPrimaryText, fontWeight = FontWeight.SemiBold, maxLines = 2)
                                if (!milestone.serviceName.isNullOrBlank()) {
                                    Text(milestone.serviceName, style = MaterialTheme.typography.labelSmall, color = TrustoraTertiaryText)
                                }
                            }
                            Text(
                                text = formatMoney(
                                    amount = milestone.amount ?: 0.0,
                                    currency = currency,
                                    locale = if (languageCode == "ro") Locale.forLanguageTag("ro-RO") else Locale.getDefault(),
                                    maximumFractionDigits = 0,
                                ),
                                style = MaterialTheme.typography.labelLarge,
                                color = TrustoraPrimary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        milestone.proposedAmount?.takeIf { it > 0.0 }?.let { proposedAmount ->
                            Text(
                                text = "→ " + formatMoney(
                                    amount = proposedAmount,
                                    currency = currency,
                                    locale = if (languageCode == "ro") Locale.forLanguageTag("ro-RO") else Locale.getDefault(),
                                    maximumFractionDigits = 0,
                                ),
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF1D4ED8),
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            MilestoneStatusBadge(
                                status = milestone.status,
                                languageCode = languageCode,
                            )
                            val paymentStatus = milestone.paymentStatus
                            if (!paymentStatus.isNullOrBlank() &&
                                !paymentStatus.equals(milestone.status, ignoreCase = true)
                            ) {
                                MilestonePaymentStatusBadge(
                                    status = paymentStatus,
                                    languageCode = languageCode,
                                )
                            }
                            if (milestone.budgetStatus.equals("PROPOSED", ignoreCase = true)) {
                                BudgetStatusBadge(languageCode = languageCode)
                            }
                        }
                        if (action != null) {
                            Button(
                                onClick = { scope.launch { onAdvanceMilestone(project.id, milestone) } },
                                enabled = !isUpdating,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = TrustoraAccent,
                                    contentColor = TrustoraAccentButtonText,
                                ),
                            ) {
                                Text(
                                    if (isUpdating) {
                                        tr(languageCode, "Saving...", "Se salvează...")
                                    } else {
                                        if (action.status == "work_in_progress") {
                                            tr(languageCode, "Start work", "Începe lucrul")
                                        } else {
                                            tr(languageCode, "Mark finished", "Marchează finalizat")
                                        }
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProjectStatusBadge(status: String, languageCode: String) {
    val normalized = status.uppercase(Locale.ROOT)
    val label = dashboardStatusLabel(status, languageCode)
    val (background, textColor) = when (normalized) {
        "PENDING" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        "WORK_IN_PROGRESS", "IN_PROGRESS" -> Color(0xFFDBEAFE) to Color(0xFF1E40AF)
        "ESCROW", "BLOCKED" -> Color(0xFFDCFCE7) to Color(0xFF166534)
        "ACCEPTED", "COMPLETED", "FINISHED" -> Color(0xFFD1FAE5) to Color(0xFF065F46)
        "REJECTED", "CANCELLED" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
        "NEW_PROPOSE", "BUDGET_PROPOSED", "AWAITING_BUDGET_APPROVAL" -> Color(0xFFE0E7FF) to Color(0xFF3730A3)
        else -> Color(0xFFE2E8F0) to Color(0xFF334155)
    }
    Text(
        text = label,
        style = MaterialTheme.typography.labelSmall,
        color = textColor,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(background, RoundedCornerShape(100.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun MilestoneStatusBadge(status: String, languageCode: String) {
    val normalized = status.uppercase(Locale.ROOT)
    val (background, textColor) = when (normalized) {
        "PENDING" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        "WORK_IN_PROGRESS", "IN_PROGRESS" -> Color(0xFFDBEAFE) to Color(0xFF1E40AF)
        "ESCROW", "BLOCKED" -> Color(0xFFDCFCE7) to Color(0xFF166534)
        "FINISHED", "COMPLETED", "PAID" -> Color(0xFFD1FAE5) to Color(0xFF065F46)
        "REJECTED" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
        else -> Color(0xFFE2E8F0) to Color(0xFF334155)
    }
    Text(
        text = dashboardStatusLabel(status, languageCode),
        style = MaterialTheme.typography.labelSmall,
        color = textColor,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(background, RoundedCornerShape(100.dp))
            .padding(horizontal = 7.dp, vertical = 3.dp),
    )
}

@Composable
private fun MilestonePaymentStatusBadge(status: String, languageCode: String) {
    val normalized = status.uppercase(Locale.ROOT)
    val (background, textColor) = when (normalized) {
        "PENDING" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        "ESCROW", "BLOCKED" -> Color(0xFFDCFCE7) to Color(0xFF166534)
        "PAID", "RELEASED" -> Color(0xFFBBF7D0) to Color(0xFF14532D)
        "REJECTED" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
        else -> Color(0xFFE2E8F0) to Color(0xFF334155)
    }
    Text(
        text = dashboardStatusLabel(status, languageCode),
        style = MaterialTheme.typography.labelSmall,
        color = textColor,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(background, RoundedCornerShape(100.dp))
            .padding(horizontal = 7.dp, vertical = 3.dp),
    )
}

@Composable
private fun BudgetStatusBadge(languageCode: String) {
    Text(
        text = tr(languageCode, "Budget proposed", "Buget propus"),
        style = MaterialTheme.typography.labelSmall,
        color = Color(0xFF1D4ED8),
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(Color(0xFFDBEAFE), RoundedCornerShape(100.dp))
            .padding(horizontal = 7.dp, vertical = 3.dp),
    )
}

@Composable
private fun ServicesSection(
    languageCode: String,
    viewModel: DashboardViewModel,
) {
    if (viewModel.isLoadingServices) {
        SimplePlaceholder(text = tr(languageCode, "Loading services...", "Se încarcă serviciile..."))
    }

    if (viewModel.services.isEmpty()) {
        SimplePlaceholder(text = tr(languageCode, "No services available.", "Nu există servicii disponibile."))
        return
    }

    DashboardSectionCard(
        title = tr(languageCode, "Services", "Servicii"),
        subtitle = tr(languageCode, "Popular and assigned services", "Servicii populare și atribuite"),
    ) {
        viewModel.services.forEach { service ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Text(
                            text = service.title,
                            style = MaterialTheme.typography.bodyLarge,
                            color = TrustoraPrimaryText,
                            fontWeight = FontWeight.Bold,
                            maxLines = 2,
                        )
                        Text(
                            text = service.category ?: "-",
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                    }
                    Text(
                        text = formatMoney(
                            amount = service.priceAmount ?: 0.0,
                            currency = AppCurrency.fromRaw(service.currency),
                            locale = if (languageCode == "ro") Locale.forLanguageTag("ro-RO") else Locale.getDefault(),
                            maximumFractionDigits = 0,
                        ),
                        style = MaterialTheme.typography.labelLarge,
                        color = TrustoraPrimary,
                        fontWeight = FontWeight.Bold,
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    service.rating?.let {
                        Text("★ ${String.format("%.1f", it)}", style = MaterialTheme.typography.labelSmall, color = TrustoraSecondaryText)
                    }
                    service.reviewCount?.let {
                        Text("${it} ${tr(languageCode, "reviews", "review-uri")}", style = MaterialTheme.typography.labelSmall, color = TrustoraSecondaryText)
                    }
                    service.orderCount?.let {
                        Text("${it} ${tr(languageCode, "orders", "comenzi")}", style = MaterialTheme.typography.labelSmall, color = TrustoraSecondaryText)
                    }
                    if (!service.level.isNullOrBlank()) {
                        Text(service.level, style = MaterialTheme.typography.labelSmall, color = TrustoraSecondaryText)
                    }
                }
            }
        }
    }
}

@Composable
private fun MessagesSection(
    languageCode: String,
    user: AuthUser,
    viewModel: DashboardViewModel,
    onSelectGroup: (String) -> Unit,
    onSendMessage: () -> Unit,
    onMarkRead: () -> Unit,
) {
    DashboardSectionCard(
        title = tr(languageCode, "Conversations", "Conversații"),
        subtitle = tr(languageCode, "Groups and direct messages", "Grupuri și mesaje directe"),
    ) {
        if (viewModel.isLoadingChatGroups && viewModel.chatGroups.isEmpty()) {
            SimplePlaceholder(text = tr(languageCode, "Loading conversations...", "Se încarcă conversațiile..."))
            return@DashboardSectionCard
        }
        if (!viewModel.messagesError.isNullOrBlank() && viewModel.chatGroups.isEmpty()) {
            ErrorBanner(text = viewModel.messagesError ?: "")
            return@DashboardSectionCard
        }
        if (viewModel.chatGroups.isEmpty()) {
            DashboardMutedInfoBlock(
                title = tr(languageCode, "No conversations available.", "Nu există conversații disponibile."),
                description = tr(languageCode, "Start a project to open messaging threads.", "Pornește un proiect pentru a deschide conversații."),
            )
            return@DashboardSectionCard
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            viewModel.chatGroups.forEach { group ->
                val selected = group.id == viewModel.selectedChatGroupId
                Column(
                    modifier = Modifier
                        .width(180.dp)
                        .background(
                            if (selected) TrustoraAccent.copy(alpha = 0.9f) else TrustoraMutedSurface,
                            RoundedCornerShape(11.dp),
                        )
                        .border(
                            1.dp,
                            if (selected) TrustoraAccent.copy(alpha = 0.75f) else TrustoraBorder,
                            RoundedCornerShape(11.dp),
                        )
                        .clickable { onSelectGroup(group.id) }
                        .padding(horizontal = 10.dp, vertical = 9.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = group.name,
                            style = MaterialTheme.typography.labelLarge,
                            color = if (selected) TrustoraAccentButtonText else TrustoraPrimary,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                        )
                        if (group.unreadCount > 0) {
                            Box(
                                modifier = Modifier
                                    .background(
                                        if (selected) TrustoraAccentButtonText.copy(alpha = 0.16f) else Color(0xFF071A12),
                                        RoundedCornerShape(100.dp),
                                    )
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = group.unreadCount.toString(),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (selected) TrustoraAccentButtonText else Color.White,
                                    fontWeight = FontWeight.Black,
                                )
                            }
                        }
                    }
                    Text(
                        text = group.lastMessage ?: group.type,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) TrustoraAccentButtonText.copy(alpha = 0.92f) else TrustoraTertiaryText,
                        maxLines = 1,
                    )
                }
            }
        }

        if (viewModel.isLoadingChatMessages) {
            SimplePlaceholder(text = tr(languageCode, "Loading messages...", "Se încarcă mesajele..."))
        } else if (!viewModel.messagesError.isNullOrBlank() && viewModel.chatMessages.isEmpty()) {
            ErrorBanner(text = viewModel.messagesError ?: "")
        } else if (viewModel.chatMessages.isEmpty()) {
            DashboardMutedInfoBlock(
                title = tr(languageCode, "No messages in this conversation.", "Nu există mesaje în această conversație."),
                description = tr(languageCode, "Type a message below to start the conversation.", "Scrie un mesaj mai jos pentru a începe conversația."),
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                viewModel.chatMessages.takeLast(30).forEach { message ->
                    val isCurrentUser = message.senderId == user.id
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isCurrentUser) Alignment.CenterEnd else Alignment.CenterStart,
                    ) {
                        Column(
                            modifier = Modifier
                                .width(280.dp)
                                .background(
                                    if (isCurrentUser) TrustoraAccent.copy(alpha = 0.22f) else MaterialTheme.colorScheme.surface,
                                    RoundedCornerShape(10.dp),
                                )
                                .border(
                                    1.dp,
                                    if (isCurrentUser) TrustoraAccent.copy(alpha = 0.55f) else TrustoraBorder,
                                    RoundedCornerShape(10.dp),
                                )
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            if (!isCurrentUser) {
                                Text(
                                    text = message.senderName,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TrustoraTertiaryText,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                            Text(
                                text = message.content,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TrustoraPrimaryText,
                            )
                            chatTimestampLabel(message.timestampIso)?.let { timestamp ->
                                Text(
                                    text = timestamp,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = TrustoraTertiaryText,
                                )
                            }
                        }
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TextField(
                value = viewModel.chatDraft,
                onValueChange = { viewModel.chatDraft = it },
                modifier = Modifier.weight(1f),
                singleLine = false,
                placeholder = { Text(tr(languageCode, "Message", "Mesaj")) },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    disabledContainerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = TrustoraBorder,
                    unfocusedIndicatorColor = TrustoraBorder,
                    disabledIndicatorColor = TrustoraBorder,
                ),
            )
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(TrustoraAccent, RoundedCornerShape(11.dp))
                    .clickable(
                        enabled = !viewModel.isSendingChatMessage &&
                            viewModel.selectedChatGroupId != null &&
                            viewModel.chatDraft.trim().isNotEmpty(),
                        onClick = onSendMessage,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                if (viewModel.isSendingChatMessage) {
                    CircularProgressIndicator(
                        strokeWidth = 2.dp,
                        color = TrustoraAccentButtonText,
                        modifier = Modifier.size(18.dp),
                    )
                } else {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = null,
                        tint = TrustoraAccentButtonText,
                    )
                }
            }
        }

        TextButton(onClick = onMarkRead, modifier = Modifier.align(Alignment.End)) {
            Text(tr(languageCode, "Mark as read", "Marchează ca citit"))
        }
    }
}

@Composable
private fun FinanceSection(
    languageCode: String,
    user: AuthUser,
    isProvider: Boolean,
    currency: AppCurrency,
    viewModel: DashboardViewModel,
    rapydOnboardingUrl: String?,
    onConnectRapyd: () -> Unit,
    onTransferRequested: () -> Unit,
    onOpenRapydUrl: (String) -> Unit,
) {
    var walletMenuOpen by remember { mutableStateOf(false) }
    if (!isProvider) {
        SimplePlaceholder(
            text = tr(languageCode, "Finance is available for provider accounts only.", "Finanțele sunt disponibile doar pentru conturile provider."),
        )
        return
    }

    val hasRapydConnected = !user.rapydWalletId.isNullOrBlank() || viewModel.wallets.isNotEmpty()
    val hasPhoneForRapyd = !user.phone.isNullOrBlank()
    val hasCompanyForRapyd = user.company?.let {
        !it.id.isNullOrBlank() || !it.name.isNullOrBlank()
    } ?: false
    val canConnectRapyd = hasPhoneForRapyd && hasCompanyForRapyd
    val rapydRequirementsMessage = when {
        hasPhoneForRapyd && hasCompanyForRapyd -> null
        !hasPhoneForRapyd && !hasCompanyForRapyd -> tr(
            languageCode,
            "Add phone number and company details before connecting Rapyd.",
            "Adaugă numărul de telefon și datele companiei înainte de conectarea Rapyd.",
        )

        !hasPhoneForRapyd -> tr(
            languageCode,
            "Add a phone number to connect Rapyd.",
            "Adaugă un număr de telefon pentru conectarea Rapyd.",
        )

        else -> tr(
            languageCode,
            "Complete company details to connect Rapyd.",
            "Completează datele companiei pentru conectarea Rapyd.",
        )
    }

    DashboardSectionCard(
        title = tr(languageCode, "Rapyd wallet", "Portofel Rapyd"),
        subtitle = if (!hasRapydConnected) {
            tr(languageCode, "Connect Rapyd wallet", "Conectează portofelul Rapyd")
        } else {
            viewModel.selectedWallet?.let {
                tr(languageCode, "Balance", "Balanță") + ": " + formatAmountByCurrencyCode(
                    amount = it.balance,
                    currencyCode = it.currency,
                    languageCode = languageCode,
                    maximumFractionDigits = 2,
                )
            } ?: tr(languageCode, "Connection and balances", "Conectare și balanțe")
        },
    ) {

        if (!hasRapydConnected) {
            DashboardMutedInfoBlock(
                title = tr(languageCode, "Wallet connection required.", "Conectarea portofelului este necesară."),
                description = tr(languageCode, "Connect Rapyd to view balances and request payouts.", "Conectează Rapyd pentru a vedea balanțele și a solicita payout."),
            )
            if (!rapydRequirementsMessage.isNullOrBlank()) {
                Text(
                    text = rapydRequirementsMessage,
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                    color = Color(0xFFB45309),
                )
            }
            if (!viewModel.financeError.isNullOrBlank()) {
                ErrorBanner(text = viewModel.financeError ?: "")
            }
            Button(
                onClick = onConnectRapyd,
                enabled = !viewModel.isRapydConnecting && canConnectRapyd,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                Text(
                    if (viewModel.isRapydConnecting) tr(languageCode, "Connecting...", "Se conectează...")
                    else tr(languageCode, "Connect Rapyd", "Conectează Rapyd"),
                )
            }
            if (!rapydOnboardingUrl.isNullOrBlank()) {
                OutlinedButton(
                    onClick = { onOpenRapydUrl(rapydOnboardingUrl) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(tr(languageCode, "Open onboarding", "Deschide onboarding"))
                }
            }
        } else if (viewModel.isLoadingFinance) {
            SimplePlaceholder(text = tr(languageCode, "Loading wallets...", "Se încarcă portofelele..."))
        } else if (!viewModel.financeError.isNullOrBlank()) {
            ErrorBanner(text = viewModel.financeError ?: "")
        } else if (viewModel.wallets.isEmpty()) {
            DashboardMutedInfoBlock(
                title = tr(languageCode, "No wallets available yet.", "Nu există încă portofele disponibile."),
                description = tr(languageCode, "Complete Rapyd onboarding and refresh this section.", "Finalizează onboarding-ul Rapyd și reîncarcă această secțiune."),
            )
        } else {
            if (viewModel.wallets.size > 1) {
                Box {
                    DashboardFilterCapsule(
                        title = viewModel.selectedWallet?.let {
                            "${it.currency} • ${
                                formatAmountByCurrencyCode(
                                    amount = it.balance,
                                    currencyCode = it.currency,
                                    languageCode = languageCode,
                                    maximumFractionDigits = 2,
                                )
                            }"
                        } ?: tr(languageCode, "Select wallet", "Selectează portofel"),
                        onClick = { walletMenuOpen = true },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    DropdownMenu(
                        expanded = walletMenuOpen,
                        onDismissRequest = { walletMenuOpen = false },
                    ) {
                        viewModel.wallets.forEach { wallet ->
                            val selected = viewModel.selectedWallet?.id == wallet.id
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        text = (if (selected) "✓ " else "") + "${wallet.currency} • ${
                                            formatAmountByCurrencyCode(
                                                amount = wallet.balance,
                                                currencyCode = wallet.currency,
                                                languageCode = languageCode,
                                                maximumFractionDigits = 2,
                                            )
                                        }",
                                    )
                                },
                                onClick = {
                                    walletMenuOpen = false
                                    viewModel.applyWalletSelection(wallet.id)
                                },
                            )
                        }
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                FinanceBalanceRow(
                    label = tr(languageCode, "Available", "Disponibil"),
                    value = formatAmountByCurrencyCode(
                        amount = viewModel.selectedWallet?.balance,
                        currencyCode = viewModel.selectedWallet?.currency,
                        languageCode = languageCode,
                        maximumFractionDigits = 2,
                    ),
                )
                FinanceBalanceRow(
                    label = tr(languageCode, "On hold", "Blocat"),
                    value = formatAmountByCurrencyCode(
                        amount = viewModel.selectedWallet?.onHoldBalance,
                        currencyCode = viewModel.selectedWallet?.currency,
                        languageCode = languageCode,
                        maximumFractionDigits = 2,
                    ),
                )
                FinanceBalanceRow(
                    label = tr(languageCode, "Received", "Primit"),
                    value = formatAmountByCurrencyCode(
                        amount = viewModel.selectedWallet?.receivedBalance,
                        currencyCode = viewModel.selectedWallet?.currency,
                        languageCode = languageCode,
                        maximumFractionDigits = 2,
                    ),
                )
            }
        }
    }

    DashboardSectionCard(
        title = tr(languageCode, "Payout transfer", "Transfer payout"),
        subtitle = tr(languageCode, "Withdraw from selected wallet", "Retrage din portofelul selectat"),
    ) {
        Text(
            text = tr(languageCode, "Transfer amount", "Suma transfer"),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = TrustoraSecondaryText,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TextField(
                value = viewModel.transferAmount,
                onValueChange = { viewModel.transferAmount = it },
                modifier = Modifier.weight(1f),
                singleLine = true,
                placeholder = { Text("0.00") },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    disabledContainerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = TrustoraBorder,
                    unfocusedIndicatorColor = TrustoraBorder,
                    disabledIndicatorColor = TrustoraBorder,
                ),
            )
            Box(
                modifier = Modifier
                    .width(56.dp)
                    .height(42.dp)
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(11.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(11.dp))
                    .clickable(
                        enabled = viewModel.selectedWallet != null,
                        onClick = viewModel::fillTransferMax,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = tr(languageCode, "Max", "Maxim"),
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = TrustoraPrimary,
                )
            }
        }
        if (!viewModel.transferError.isNullOrBlank()) {
            Text(
                text = viewModel.transferError ?: "",
                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                color = Color(0xFFB91C1C),
            )
        }
        Button(
            onClick = onTransferRequested,
            modifier = Modifier.fillMaxWidth(),
            enabled = !viewModel.isLoadingTransfer &&
                viewModel.selectedWallet != null &&
                viewModel.transferAmount.trim().isNotEmpty(),
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            Text(
                if (viewModel.isLoadingTransfer) tr(languageCode, "Transferring...", "Se transferă...")
                else tr(languageCode, "Transfer", "Transferă"),
            )
        }
        if (!rapydOnboardingUrl.isNullOrBlank()) {
            OutlinedButton(
                onClick = { onOpenRapydUrl(rapydOnboardingUrl) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(tr(languageCode, "Open Rapyd link", "Deschide link Rapyd"))
            }
        }
    }
}

private fun formatAmountByCurrencyCode(
    amount: Double?,
    currencyCode: String?,
    languageCode: String,
    maximumFractionDigits: Int,
): String {
    if (amount == null) return "--"
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.getDefault()
    return runCatching {
        val formatter = java.text.NumberFormat.getCurrencyInstance(locale).apply {
            this.maximumFractionDigits = maximumFractionDigits
            this.minimumFractionDigits = 0
            if (!currencyCode.isNullOrBlank()) {
                currency = java.util.Currency.getInstance(currencyCode.uppercase(Locale.ROOT))
            }
        }
        formatter.format(amount)
    }.getOrElse {
        val suffix = currencyCode?.uppercase(Locale.ROOT).orEmpty()
        if (suffix.isBlank()) {
            String.format(locale, "%,.2f", amount)
        } else {
            String.format(locale, "%,.2f %s", amount, suffix)
        }
    }
}

@Composable
private fun FinanceBalanceRow(
    label: String,
    value: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
            color = TrustoraTertiaryText,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
            color = TrustoraPrimary,
        )
    }
}

@Composable
private fun DashboardMutedInfoBlock(
    title: String,
    description: String,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
            color = TrustoraPrimary,
        )
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
            color = TrustoraTertiaryText,
        )
    }
}

@Composable
private fun SettingsSection(
    languageCode: String,
    user: AuthUser,
    token: String,
    viewModel: DashboardViewModel,
    onReloadSettings: () -> Unit,
    onSaveCompanyInfo: () -> Unit,
    onSignOut: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var memberSearchTerm by rememberSaveable { mutableStateOf("") }
    var countryMenuOpen by remember { mutableStateOf(false) }
    var countyMenuOpen by remember { mutableStateOf(false) }
    var cityMenuOpen by remember { mutableStateOf(false) }
    var showCompanyInformationSheet by rememberSaveable { mutableStateOf(false) }
    var showCompanyManagersSheet by rememberSaveable { mutableStateOf(false) }

    val form = viewModel.companyForm

    if (viewModel.isLoadingSettings) {
        SimplePlaceholder(text = tr(languageCode, "Loading settings...", "Se încarcă setările..."))
    }

    DashboardSectionCard(
        title = tr(languageCode, "Settings", "Setări"),
        subtitle = tr(languageCode, "Profile", "Profil"),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AuthAvatar(user = user)
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Text(
                    text = user.displayName,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = TrustoraPrimary,
                    maxLines = 1,
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Medium),
                    color = TrustoraTertiaryText,
                    maxLines = 1,
                )
            }
        }
        Button(
            onClick = onSignOut,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFFEE2E2),
                contentColor = Color(0xFF7F1D1D),
            ),
        ) {
            Text(tr(languageCode, "Sign out", "Deconectare"))
        }
    }

    if (viewModel.isProvider) {
        DashboardSectionCard(
            title = tr(languageCode, "Company settings", "Setări companie"),
            subtitle = tr(languageCode, "Information and managers", "Informații și manageri"),
        ) {
            DashboardSettingsActionButton(
                icon = Icons.Default.BusinessCenter,
                title = tr(languageCode, "Company information", "Informații companie"),
                subtitle = tr(languageCode, "Legal and banking details", "Date legale și bancare"),
                enabled = true,
                onClick = {
                    viewModel.resetCompanyForm(user)
                    showCompanyInformationSheet = true
                    onReloadSettings()
                },
            )

            DashboardSettingsActionButton(
                icon = Icons.Default.TrackChanges,
                title = tr(languageCode, "Company managers", "Manageri companie"),
                subtitle = tr(languageCode, "Editors and ownership transfer", "Editori și transfer ownership"),
                enabled = viewModel.canManageCompanySettings(user),
                onClick = {
                    viewModel.resetCompanyForm(user)
                    showCompanyManagersSheet = true
                    onReloadSettings()
                },
            )

            if (!viewModel.canManageCompanySettings(user)) {
                Text(
                    text = tr(languageCode, "Company access unavailable.", "Accesul companiei nu este disponibil."),
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                    color = TrustoraTertiaryText,
                )
            }
        }
    }

    if (showCompanyInformationSheet) {
        DashboardSettingsModalSheet(
            title = tr(languageCode, "Company information", "Informații companie"),
            subtitle = tr(languageCode, "Legal and banking details", "Date legale și bancare"),
            onClose = { showCompanyInformationSheet = false },
        ) {

        DashboardSettingsTextField(
            title = tr(languageCode, "Company name", "Nume companie"),
            value = form.name,
            onValueChange = { value ->
                viewModel.updateCompanyForm { it.copy(name = value) }
                viewModel.companySearchTerm = value
                viewModel.scheduleCompanySearch()
            },
            placeholder = tr(languageCode, "Company legal name", "Denumire legală companie"),
        )

        if (viewModel.isSearchingCompanies) {
            Text(
                text = tr(languageCode, "Searching companies...", "Se caută companii..."),
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraTertiaryText,
            )
        } else if (viewModel.companySearchResults.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                viewModel.companySearchResults.take(5).forEach { company ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TrustoraMutedSurface, RoundedCornerShape(8.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp))
                            .clickable { viewModel.applyCompanySearchResult(company) }
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Text(company.name, color = TrustoraPrimary, fontWeight = FontWeight.SemiBold)
                        Text(
                            listOf(
                                company.taxId ?: company.tradeRegistryNumber,
                                company.companyCity,
                                company.companyCountry,
                            ).filterNotNull().joinToString(" • "),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                    }
                }
            }
        }

        DashboardSettingsTextField(
            title = tr(languageCode, "Represented by", "Reprezentat de"),
            value = form.representedBy,
            onValueChange = { value -> viewModel.updateCompanyForm { it.copy(representedBy = value) } },
            placeholder = tr(languageCode, "Full name", "Nume complet"),
        )
        DashboardSettingsTextField(
            title = tr(languageCode, "Contact email", "Email contact"),
            value = form.email,
            onValueChange = { value -> viewModel.updateCompanyForm { it.copy(email = value) } },
            placeholder = "name@company.com",
        )
        DashboardSettingsTextField(
            title = tr(languageCode, "Address", "Adresă"),
            value = form.companyAddress,
            onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyAddress = value) } },
            placeholder = tr(languageCode, "Street and number", "Stradă și număr"),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DashboardSettingsTextField(
                title = tr(languageCode, "City", "Oraș"),
                value = form.companyCity,
                onValueChange = { value -> viewModel.selectCompanyCity(value) },
                placeholder = tr(languageCode, "City", "Oraș"),
                modifier = Modifier.weight(1f),
                enabled = viewModel.locationCities.isEmpty(),
            )
            DashboardSettingsTextField(
                title = tr(languageCode, "County", "Județ"),
                value = form.companyCounty,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyCounty = value) } },
                placeholder = tr(languageCode, "County", "Județ"),
                modifier = Modifier.weight(1f),
                enabled = viewModel.locationStates.isEmpty(),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DashboardSettingsTextField(
                title = tr(languageCode, "Postal code", "Cod poștal"),
                value = form.companyZip,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyZip = value) } },
                placeholder = "010101",
                modifier = Modifier.weight(1f),
            )
            Box(modifier = Modifier.weight(1f)) {
                DashboardSettingsSelectableField(
                    title = tr(languageCode, "Country", "Țară"),
                    value = viewModel.selectedCountryDisplayName,
                    placeholder = tr(languageCode, "Country", "Țară"),
                    onClick = { countryMenuOpen = true },
                )
                DropdownMenu(
                    expanded = countryMenuOpen,
                    onDismissRequest = { countryMenuOpen = false },
                ) {
                    viewModel.locationCountries.take(180).forEach { country ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = if (country.flag.isBlank()) {
                                        "${country.name} (${country.isoCode})"
                                    } else {
                                        "${country.flag} ${country.name} (${country.isoCode})"
                                    },
                                    maxLines = 1,
                                )
                            },
                            onClick = {
                                countryMenuOpen = false
                                scope.launch { viewModel.selectCompanyCountry(country.isoCode) }
                            },
                        )
                    }
                }
            }
        }

        if (viewModel.locationStates.isNotEmpty()) {
            Box {
                DashboardSettingsSelectableField(
                    title = tr(languageCode, "County", "Județ"),
                    value = viewModel.selectedCountyDisplayName,
                    placeholder = tr(languageCode, "County", "Județ"),
                    onClick = { countyMenuOpen = true },
                )
                DropdownMenu(
                    expanded = countyMenuOpen,
                    onDismissRequest = { countyMenuOpen = false },
                ) {
                    viewModel.locationStates.take(220).forEach { county ->
                        DropdownMenuItem(
                            text = { Text("${county.name} (${county.isoCode})", maxLines = 1) },
                            onClick = {
                                countyMenuOpen = false
                                scope.launch { viewModel.selectCompanyCounty(county.isoCode) }
                            },
                        )
                    }
                }
            }
        }

        if (viewModel.locationCities.isNotEmpty()) {
            Box {
                DashboardSettingsSelectableField(
                    title = tr(languageCode, "City", "Oraș"),
                    value = form.companyCity,
                    placeholder = tr(languageCode, "City", "Oraș"),
                    onClick = { cityMenuOpen = true },
                )
                DropdownMenu(
                    expanded = cityMenuOpen,
                    onDismissRequest = { cityMenuOpen = false },
                ) {
                    viewModel.locationCities.take(260).forEach { city ->
                        DropdownMenuItem(
                            text = { Text(city.name, maxLines = 1) },
                            onClick = {
                                cityMenuOpen = false
                                viewModel.selectCompanyCity(city.name)
                            },
                        )
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DashboardSettingsTextField(
                title = tr(languageCode, "ID type", "Tip identificare"),
                value = form.idType,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(idType = value) } },
                placeholder = tr(languageCode, "Type", "Tip"),
                modifier = Modifier.weight(1f),
            )
            DashboardSettingsTextField(
                title = tr(languageCode, "ID number", "Număr identificare"),
                value = form.idNumber,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(idNumber = value) } },
                placeholder = tr(languageCode, "Number", "Număr"),
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DashboardSettingsTextField(
                title = "IBAN",
                value = form.companyBankIban,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyBankIban = value) } },
                placeholder = "RO49AAAA1B31007593840000",
                modifier = Modifier.weight(1f),
            )
            DashboardSettingsTextField(
                title = "BIC",
                value = form.companyBankBic,
                onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyBankBic = value) } },
                placeholder = "AAAAROBU",
                modifier = Modifier.weight(1f),
            )
        }
        DashboardSettingsTextField(
            title = tr(languageCode, "Bank name", "Nume bancă"),
            value = form.companyBankName,
            onValueChange = { value -> viewModel.updateCompanyForm { it.copy(companyBankName = value) } },
            placeholder = tr(languageCode, "Bank name", "Nume bancă"),
        )

        DashboardSettingsTextField(
            title = tr(languageCode, "Bank currency", "Monedă bancă"),
            value = viewModel.currencySearchTerm,
            onValueChange = { value ->
                viewModel.updateCompanyForm { it.copy(bankCurrency = value) }
                viewModel.currencySearchTerm = value
                viewModel.scheduleCurrencySearch(token = token)
            },
            placeholder = "USD",
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = { viewModel.scheduleCurrencySearch(token = token) },
                modifier = Modifier.weight(1f),
            ) {
                Text(tr(languageCode, "Search currency", "Caută monedă"))
            }
            OutlinedButton(
                onClick = onReloadSettings,
                modifier = Modifier.weight(1f),
            ) {
                Text(tr(languageCode, "Reload", "Reîncarcă"))
            }
        }

        if (viewModel.currencyOptions.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                viewModel.currencyOptions.take(12).forEach { option ->
                    val active = option.code.equals(form.bankCurrency, ignoreCase = true)
                    Box(
                        modifier = Modifier
                            .background(
                                if (active) TrustoraAccent.copy(alpha = 0.88f) else TrustoraMutedSurface,
                                RoundedCornerShape(9.dp),
                            )
                            .border(
                                1.dp,
                                if (active) TrustoraAccent.copy(alpha = 0.72f) else TrustoraBorder,
                                RoundedCornerShape(9.dp),
                            )
                            .clickable { viewModel.applyCurrency(option) }
                            .padding(horizontal = 10.dp, vertical = 7.dp),
                    ) {
                        Text(
                            text = "${option.code} • ${option.name}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = if (active) TrustoraAccentButtonText else TrustoraSecondaryText,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }

        if (viewModel.settingsSuccess) {
            Text(
                text = tr(languageCode, "Company information saved.", "Informațiile companiei au fost salvate."),
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF0C8F5D),
            )
        }

        Button(
            onClick = onSaveCompanyInfo,
            modifier = Modifier.fillMaxWidth(),
            enabled = viewModel.isProvider && !viewModel.isSavingCompanyInfo,
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            Text(
                if (viewModel.isSavingCompanyInfo) tr(languageCode, "Saving...", "Se salvează...")
                else tr(languageCode, "Save company information", "Salvează informațiile companiei"),
            )
        }
    }
    }

    if (showCompanyManagersSheet) {
        DashboardSettingsModalSheet(
            title = tr(languageCode, "Company managers", "Manageri companie"),
            subtitle = tr(languageCode, "Editors and ownership transfer", "Editori și transfer ownership"),
            onClose = { showCompanyManagersSheet = false },
        ) {
            if (viewModel.canManageCompanySettings(user)) {
                DashboardSectionCard(
                    title = tr(languageCode, "Company managers", "Manageri companie"),
                    subtitle = tr(languageCode, "Editors and access management", "Editorii și managementul accesului"),
                ) {

            if (viewModel.isLoadingCompanyManagers) {
                Text(tr(languageCode, "Loading company users...", "Se încarcă utilizatorii companiei..."), color = TrustoraTertiaryText)
            } else if (viewModel.companyManagers.isEmpty()) {
                Text(tr(languageCode, "No company managers.", "Nu există manageri companie."), color = TrustoraTertiaryText)
            } else {
                viewModel.companyManagers.forEach { manager ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(manager.displayName, color = TrustoraSecondaryText, fontWeight = FontWeight.SemiBold, maxLines = 1)
                            if (!manager.email.isNullOrBlank()) {
                                Text(manager.email, color = TrustoraTertiaryText, style = MaterialTheme.typography.labelSmall, maxLines = 1)
                            }
                        }
                        DashboardInlinePillButton(
                            text = tr(languageCode, "Remove", "Șterge"),
                            containerColor = Color(0xFFFEE2E2),
                            contentColor = Color(0xFF7F1D1D),
                            enabled = !viewModel.isSavingCompanyManagers,
                            onClick = {
                                scope.launch {
                                    viewModel.removeCompanyManager(
                                        manager = manager,
                                        user = user,
                                        token = token,
                                        language = languageCode,
                                    )
                                }
                            },
                        )
                    }
                }
            }

            DashboardSettingsTextField(
                title = tr(languageCode, "Add manager", "Adaugă manager"),
                value = viewModel.companyManagerSearchTerm,
                onValueChange = { value ->
                    viewModel.companyManagerSearchTerm = value
                    viewModel.scheduleCompanyManagerSearch(token = token)
                },
                placeholder = tr(languageCode, "Search by email or name", "Caută după email sau nume"),
            )

            if (viewModel.isSearchingCompanyUsers) {
                Text(tr(languageCode, "Searching users...", "Se caută utilizatori..."), color = TrustoraTertiaryText)
            } else {
                viewModel.companyManagerSearchResults.take(6).forEach { candidate ->
                    val alreadyAdded = viewModel.isExistingCompanyManager(candidate)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TrustoraMutedSurface, RoundedCornerShape(8.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(candidate.displayName, color = TrustoraPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1)
                            if (!candidate.email.isNullOrBlank()) {
                                Text(candidate.email, color = TrustoraTertiaryText, style = MaterialTheme.typography.labelSmall, maxLines = 1)
                            }
                        }
                        DashboardInlinePillButton(
                            text = if (alreadyAdded) tr(languageCode, "Added", "Adăugat") else tr(languageCode, "Add", "Adaugă"),
                            containerColor = if (alreadyAdded) Color(0xFFE2E8F0) else TrustoraAccent,
                            contentColor = if (alreadyAdded) TrustoraSecondaryText else TrustoraAccentButtonText,
                            enabled = !alreadyAdded && !viewModel.isSavingCompanyManagers,
                            onClick = {
                                scope.launch {
                                    viewModel.addCompanyManager(
                                        candidate = candidate,
                                        user = user,
                                        token = token,
                                        language = languageCode,
                                    )
                                }
                            },
                        )
                    }
                }
            }
        }

                DashboardSectionCard(
                    title = tr(languageCode, "Company members", "Membri companie"),
                    subtitle = tr(languageCode, "Search and ownership transfer", "Căutare și transfer ownership"),
                ) {

            DashboardSettingsTextField(
                title = tr(languageCode, "Search members", "Caută membri"),
                value = memberSearchTerm,
                onValueChange = { memberSearchTerm = it },
                placeholder = tr(languageCode, "Search company members", "Caută membri companie"),
            )

            val filteredMembers = viewModel.companyMembers.filter { member ->
                val query = memberSearchTerm.trim().lowercase()
                if (query.isBlank()) return@filter true
                member.displayName.lowercase().contains(query) ||
                    member.normalizedEmail.orEmpty().contains(query)
            }

            if (filteredMembers.isEmpty()) {
                Text(tr(languageCode, "No members available.", "Nu există membri disponibili."), color = TrustoraTertiaryText)
            } else {
                filteredMembers.take(16).forEach { member ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TrustoraMutedSurface, RoundedCornerShape(8.dp))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(member.displayName, color = TrustoraPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1)
                            if (!member.email.isNullOrBlank()) {
                                Text(member.email, color = TrustoraTertiaryText, style = MaterialTheme.typography.labelSmall, maxLines = 1)
                            }
                        }
                        if (member.userId != user.id) {
                            DashboardInlinePillButton(
                                text = tr(languageCode, "Transfer ownership", "Transferă ownership"),
                                containerColor = TrustoraAccent.copy(alpha = 0.88f),
                                contentColor = TrustoraAccentButtonText,
                                enabled = viewModel.transferringOwnershipEmail == null,
                                onClick = {
                                    scope.launch {
                                        viewModel.transferCompanyOwnership(
                                            member = member,
                                            user = user,
                                            token = token,
                                            language = languageCode,
                                        )
                                    }
                                },
                            )
                        }
                    }
                }
            }
                }
            } else {
                Text(
                    text = tr(languageCode, "Company access unavailable.", "Accesul companiei nu este disponibil."),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = TrustoraTertiaryText,
                )
            }
        }
    }
}

@Composable
private fun DashboardSettingsActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 11.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(Color(0xFFF8FAFC), RoundedCornerShape(11.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (enabled) TrustoraAccent else Color(0xFF94A3B8),
                modifier = Modifier.size(16.dp),
            )
        }
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                color = if (enabled) TrustoraPrimary else Color(0xFF94A3B8),
                maxLines = 1,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                color = TrustoraTertiaryText,
                maxLines = 2,
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = Color(0xFF94A3B8),
            modifier = Modifier.size(18.dp),
        )
    }
}

@Composable
private fun DashboardSettingsModalSheet(
    title: String,
    subtitle: String,
    onClose: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnClickOutside = true,
        ),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium.copy(fontSize = 20.sp),
                            color = TrustoraPrimary,
                            fontWeight = FontWeight.Black,
                        )
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                            color = TrustoraTertiaryText,
                        )
                    }
                    OutlinedButton(onClick = onClose) {
                        Text("×")
                    }
                }

                DashboardSectionCard(
                    title = title,
                    subtitle = subtitle,
                    content = content,
                )

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun DashboardSettingsTextField(
    title: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = TrustoraSecondaryText,
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = enabled,
            placeholder = {
                Text(
                    text = placeholder,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium),
                    color = Color(0xFF94A3B8),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            },
            shape = RoundedCornerShape(10.dp),
            textStyle = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = TrustoraMutedSurface,
                unfocusedContainerColor = TrustoraMutedSurface,
                disabledContainerColor = TrustoraMutedSurface.copy(alpha = 0.62f),
                focusedBorderColor = TrustoraBorder,
                unfocusedBorderColor = TrustoraBorder,
                disabledBorderColor = TrustoraBorder,
                focusedTextColor = TrustoraPrimary,
                unfocusedTextColor = TrustoraPrimary,
                disabledTextColor = TrustoraTertiaryText,
            ),
        )
    }
}

@Composable
private fun DashboardSettingsSelectableField(
    title: String,
    value: String,
    placeholder: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                .clickable(enabled = enabled, onClick = onClick)
                .padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = if (value.isBlank()) placeholder else value,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium),
                color = if (value.isBlank()) Color(0xFF94A3B8) else TrustoraPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            Icon(
                imageVector = Icons.Default.ArrowDropDown,
                contentDescription = null,
                tint = TrustoraTertiaryText,
            )
        }
    }
}

@Composable
private fun DashboardInlinePillButton(
    text: String,
    containerColor: Color,
    contentColor: Color,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .background(
                if (enabled) containerColor else containerColor.copy(alpha = 0.56f),
                RoundedCornerShape(100.dp),
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 5.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = if (enabled) contentColor else contentColor.copy(alpha = 0.75f),
            maxLines = 1,
        )
    }
}

@Composable
private fun ErrorBanner(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFFEE2E2), RoundedCornerShape(12.dp))
            .border(1.dp, Color(0xFFFCA5A5), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            text = "!",
            color = Color(0xFFB91C1C),
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black),
        )
        Text(
            text = text,
            color = Color(0xFF7F1D1D),
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
        )
    }
}

@Composable
private fun DashboardSectionCard(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(fontSize = 18.sp),
                color = TrustoraPrimary,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                color = TrustoraTertiaryText,
            )
            content()
        },
    )
}

@Composable
private fun SimplePlaceholder(text: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraTertiaryText,
        )
    }
}

@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminNewsletterLanguageFilter
import com.trustora.app.core.models.AdminNewsletterSubscriber
import com.trustora.app.core.models.AdminNewsletterUserTypeFilter
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
fun AdminNewsletterScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminNewsletterViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

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
            AdminNewsletterTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminNewsletterUnavailableState(languageCode = languageCode)
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
                        AdminNewsletterHeaderCard(languageCode = languageCode)
                        AdminNewsletterComposerCard(
                            languageCode = languageCode,
                            viewModel = viewModel,
                            token = token,
                            currency = currency,
                        )
                        AdminNewsletterSubscribersCard(
                            languageCode = languageCode,
                            viewModel = viewModel,
                            token = token,
                            currency = currency,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminNewsletterTopBar(
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
                text = newsletterString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = newsletterString("admin.dashboard.sections.newsletter.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(32.dp))
    }
}

@Composable
private fun AdminNewsletterUnavailableState(languageCode: String) {
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
            text = newsletterString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = newsletterString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminNewsletterHeaderCard(languageCode: String) {
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
            text = newsletterString("admin.dashboard.sections.newsletter.title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = newsletterString("admin.dashboard.sections.newsletter.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminNewsletterComposerCard(
    languageCode: String,
    viewModel: AdminNewsletterViewModel,
    token: String,
    currency: AppCurrency,
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
            text = newsletterString("admin.newsletter.compose_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )

        if (!viewModel.actionErrorMessage.isNullOrBlank()) {
            Text(
                text = viewModel.actionErrorMessage.orEmpty(),
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

        if (!viewModel.successMessage.isNullOrBlank()) {
            Text(
                text = viewModel.successMessage.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF166534),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFDCFCE7))
                    .border(1.dp, Color(0xFFBBF7D0), RoundedCornerShape(12.dp))
                    .padding(10.dp),
            )
        }

        NewsletterTemplateMenu(
            languageCode = languageCode,
            templates = viewModel.templates,
            selectedTemplate = viewModel.selectedTemplate,
            onSelect = { template ->
                viewModel.loadTemplateContent(
                    template = template,
                    token = token,
                    language = languageCode,
                    currency = currency,
                )
            },
            onReload = {
                viewModel.load(
                    token = token,
                    language = languageCode,
                    currency = currency,
                )
            },
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(TrustoraMutedSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.Mail, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
                Text(
                    text = newsletterString("admin.newsletter.template_preview", languageCode),
                    style = MaterialTheme.typography.labelLarge,
                    color = TrustoraPrimaryText,
                )
            }

            if (viewModel.isLoadingTemplateContent) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                }
            } else {
                Text(
                    text = viewModel.templateContent.ifBlank {
                        newsletterString("admin.newsletter.template_empty", languageCode)
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraSecondaryText,
                )
            }
        }

        OutlinedTextField(
            value = viewModel.subject,
            onValueChange = { viewModel.subject = it },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            placeholder = { Text(newsletterString("admin.newsletter.subject_placeholder", languageCode)) },
            singleLine = true,
        )

        Text(
            text = newsletterString("admin.newsletter.user_type_label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminNewsletterUserTypeFilter.entries.forEach { filter ->
                NewsletterFilterChip(
                    text = newsletterString(filter.titleKey, languageCode),
                    selected = filter == viewModel.userTypeFilter,
                    onTap = { viewModel.userTypeFilter = filter },
                )
            }
        }

        Text(
            text = newsletterString("admin.newsletter.language_label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminNewsletterLanguageFilter.entries.forEach { filter ->
                NewsletterFilterChip(
                    text = newsletterString(filter.titleKey, languageCode),
                    selected = filter == viewModel.languageFilter,
                    onTap = { viewModel.languageFilter = filter },
                )
            }
        }

        OutlinedTextField(
            value = viewModel.recipientsInput,
            onValueChange = { viewModel.recipientsInput = it },
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            placeholder = { Text(newsletterString("admin.newsletter.recipients_placeholder", languageCode)) },
            maxLines = 8,
        )

        OutlinedTextField(
            value = viewModel.dataInput,
            onValueChange = { viewModel.dataInput = it },
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            placeholder = { Text(newsletterString("admin.newsletter.data_placeholder", languageCode)) },
            maxLines = 8,
        )

        Button(
            onClick = {
                viewModel.sendNewsletter(
                    token = token,
                    language = languageCode,
                    currency = currency,
                    onCompleted = {},
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !viewModel.isSubmitting,
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            if (viewModel.isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = TrustoraAccentButtonText,
                )
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Text(newsletterString("admin.newsletter.send_action", languageCode))
                }
            }
        }
    }
}

@Composable
private fun NewsletterTemplateMenu(
    languageCode: String,
    templates: List<String>,
    selectedTemplate: String,
    onSelect: (String) -> Unit,
    onReload: () -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = newsletterString("admin.newsletter.template_label", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .clickable { expanded = true }
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = selectedTemplate.ifBlank {
                        newsletterString("admin.newsletter.template_empty", languageCode)
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                )
                Spacer(modifier = Modifier.weight(1f))
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = TrustoraSecondaryText)
            }

            IconButton(
                onClick = onReload,
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp)),
            ) {
                Icon(Icons.Filled.Refresh, contentDescription = null, tint = TrustoraPrimary)
            }
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            templates.forEach { template ->
                DropdownMenuItem(
                    text = { Text(template) },
                    onClick = {
                        expanded = false
                        onSelect(template)
                    },
                )
            }
        }
    }
}

@Composable
private fun NewsletterFilterChip(
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
private fun AdminNewsletterSubscribersCard(
    languageCode: String,
    viewModel: AdminNewsletterViewModel,
    token: String,
    currency: AppCurrency,
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
            Icon(Icons.Filled.Campaign, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = newsletterString("admin.newsletter.subscribers_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = newsletterTemplate(
                newsletterString("admin.newsletter.subscribers_description", languageCode),
                mapOf(
                    "count" to viewModel.subscribers.size.toString(),
                    "total" to viewModel.totalSubscribers.toString(),
                ),
            ),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            NewsletterFilterChip(
                text = newsletterString("admin.newsletter.only_active", languageCode),
                selected = viewModel.onlyActiveSubscribers,
                onTap = {
                    viewModel.onlyActiveSubscribers = !viewModel.onlyActiveSubscribers
                    viewModel.loadSubscribers(
                        token = token,
                        language = languageCode,
                        currency = currency,
                    )
                },
            )

            var perPageExpanded by remember { mutableStateOf(false) }
            Box {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(TrustoraMutedSurface)
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(999.dp))
                        .clickable { perPageExpanded = true }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        text = newsletterTemplate(
                            newsletterString("admin.newsletter.per_page", languageCode),
                            mapOf("count" to viewModel.perPage.toString()),
                        ),
                        style = MaterialTheme.typography.labelLarge,
                        color = TrustoraSecondaryText,
                    )
                    Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(14.dp))
                }

                DropdownMenu(
                    expanded = perPageExpanded,
                    onDismissRequest = { perPageExpanded = false },
                ) {
                    listOf(10, 25, 50, 100).forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option.toString()) },
                            onClick = {
                                perPageExpanded = false
                                viewModel.perPage = option
                                viewModel.loadSubscribers(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                        )
                    }
                }
            }
        }

        if (!viewModel.errorMessage.isNullOrBlank()) {
            Text(
                text = viewModel.errorMessage.orEmpty(),
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFFB91C1C),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFFEF2F2))
                    .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                    .padding(10.dp),
            )
        } else if (viewModel.isLoading && viewModel.subscribers.isEmpty()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            }
        } else if (viewModel.subscribers.isEmpty()) {
            Text(
                text = newsletterString("admin.newsletter.subscribers_empty", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraSecondaryText,
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.subscribers.forEach { subscriber ->
                    NewsletterSubscriberRow(
                        languageCode = languageCode,
                        subscriber = subscriber,
                    )
                }
            }
        }
    }
}

@Composable
private fun NewsletterSubscriberRow(
    languageCode: String,
    subscriber: AdminNewsletterSubscriber,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = subscriber.email,
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimaryText,
            )
            Text(
                text = if (subscriber.isActive) {
                    newsletterString("admin.newsletter.active", languageCode)
                } else {
                    newsletterString("admin.newsletter.inactive", languageCode)
                },
                style = MaterialTheme.typography.labelSmall,
                color = if (subscriber.isActive) Color(0xFF166534) else Color(0xFFB91C1C),
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (subscriber.isActive) Color(0xFFDCFCE7) else Color(0xFFFEE2E2))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            )
        }

        val details = listOfNotNull(
            subscriber.name?.takeIf { it.isNotBlank() },
            subscriber.company?.takeIf { it.isNotBlank() },
            subscriber.userType.takeIf { it.isNotBlank() }?.uppercase(),
            subscriber.language?.takeIf { it.isNotBlank() }?.uppercase(),
        )
        if (details.isNotEmpty()) {
            Text(
                text = details.joinToString(" • "),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
        }

        val subscribedAt = formatNewsletterDate(subscriber.subscribedAtIso, languageCode)
        if (!subscribedAt.isNullOrBlank()) {
            Text(
                text = newsletterTemplate(
                    newsletterString("admin.newsletter.subscribed_at", languageCode),
                    mapOf("date" to subscribedAt),
                ),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }

        if (!subscriber.unsubscribedAtIso.isNullOrBlank()) {
            val unsubscribedAt = formatNewsletterDate(subscriber.unsubscribedAtIso, languageCode)
            if (!unsubscribedAt.isNullOrBlank()) {
                Text(
                    text = newsletterTemplate(
                        newsletterString("admin.newsletter.unsubscribed_at", languageCode),
                        mapOf("date" to unsubscribedAt),
                    ),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFB91C1C),
                )
            }
        }
    }
}

private fun formatNewsletterDate(rawIso: String?, languageCode: String): String? {
    val raw = rawIso?.trim().orEmpty()
    if (raw.isEmpty()) return null

    val instant = parseNewsletterInstant(raw) ?: return raw
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT).withLocale(locale)
    return formatter.format(instant.atZone(ZoneId.systemDefault()))
}

private fun parseNewsletterInstant(raw: String): Instant? {
    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun newsletterTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun newsletterString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.dashboard.sections.newsletter.title" -> "Newsletter"
        "admin.dashboard.sections.newsletter.description" -> if (ro) "Trimite actualizări către abonați" else "Send updates to subscribers"

        "admin.newsletter.compose_title" -> if (ro) "Compune Newsletter" else "Compose Newsletter"
        "admin.newsletter.template_label" -> if (ro) "Template" else "Template"
        "admin.newsletter.template_preview" -> if (ro) "Previzualizare conținut" else "Content preview"
        "admin.newsletter.template_empty" -> if (ro) "Niciun template selectat." else "No template selected."
        "admin.newsletter.subject_placeholder" -> if (ro) "Subiect email" else "Email subject"
        "admin.newsletter.user_type_label" -> if (ro) "Tip utilizatori" else "User type"
        "admin.newsletter.language_label" -> if (ro) "Limba newsletterului" else "Newsletter language"
        "admin.newsletter.recipients_placeholder" -> if (ro) "Destinatari separați prin virgulă, newline sau ; (opțional)" else "Recipients separated by comma, newline, or ; (optional)"
        "admin.newsletter.data_placeholder" -> if (ro) "Date template, câte o linie: key:value" else "Template data, one per line: key:value"
        "admin.newsletter.send_action" -> if (ro) "Trimite Newsletter" else "Send Newsletter"

        "admin.newsletter.user_type_all" -> if (ro) "Toți" else "All"
        "admin.newsletter.user_type_client" -> if (ro) "Clienți" else "Clients"
        "admin.newsletter.user_type_provider" -> if (ro) "Prestatori" else "Providers"
        "admin.newsletter.language_ro" -> "RO"
        "admin.newsletter.language_en" -> "EN"

        "admin.newsletter.subscribers_title" -> if (ro) "Abonați Newsletter" else "Newsletter Subscribers"
        "admin.newsletter.subscribers_description" -> if (ro) "{count} afișați din {total}" else "{count} shown out of {total}"
        "admin.newsletter.only_active" -> if (ro) "Doar activi" else "Only active"
        "admin.newsletter.per_page" -> if (ro) "{count}/pagină" else "{count}/page"
        "admin.newsletter.subscribers_empty" -> if (ro) "Nu există abonați pentru filtrele curente." else "No subscribers found for current filters."
        "admin.newsletter.active" -> if (ro) "Activ" else "Active"
        "admin.newsletter.inactive" -> if (ro) "Inactiv" else "Inactive"
        "admin.newsletter.subscribed_at" -> if (ro) "Abonat la {date}" else "Subscribed on {date}"
        "admin.newsletter.unsubscribed_at" -> if (ro) "Dezabonat la {date}" else "Unsubscribed on {date}"

        else -> key
    }
}

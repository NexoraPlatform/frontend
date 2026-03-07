package com.trustora.app.ui.screens.provider

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.ProviderProfileWeekDay
import com.trustora.app.core.models.ProviderProfileWorkingHour
import com.trustora.app.di.NetworkModule
import com.trustora.app.designsystem.components.TrustoraCard
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

internal fun providerTr(languageCode: String, en: String, ro: String): String {
    return if (languageCode.startsWith("ro", ignoreCase = true)) ro else en
}

internal fun providerAvailabilityLabel(languageCode: String, status: String): String {
    return when (status.trim().uppercase()) {
        "BUSY" -> providerTr(languageCode, "Busy", "Ocupat")
        "UNAVAILABLE" -> providerTr(languageCode, "Unavailable", "Indisponibil")
        else -> providerTr(languageCode, "Available", "Disponibil")
    }
}

internal fun providerResponseTimeLabel(languageCode: String, hours: String): String {
    val normalized = hours.trim().ifEmpty { "2" }
    return providerTr(languageCode, "$normalized hours", "$normalized ore")
}

internal fun providerDayLabel(languageCode: String, day: ProviderProfileWeekDay): String {
    return when (day) {
        ProviderProfileWeekDay.MONDAY -> providerTr(languageCode, "Monday", "Luni")
        ProviderProfileWeekDay.TUESDAY -> providerTr(languageCode, "Tuesday", "Marti")
        ProviderProfileWeekDay.WEDNESDAY -> providerTr(languageCode, "Wednesday", "Miercuri")
        ProviderProfileWeekDay.THURSDAY -> providerTr(languageCode, "Thursday", "Joi")
        ProviderProfileWeekDay.FRIDAY -> providerTr(languageCode, "Friday", "Vineri")
        ProviderProfileWeekDay.SATURDAY -> providerTr(languageCode, "Saturday", "Sambata")
        ProviderProfileWeekDay.SUNDAY -> providerTr(languageCode, "Sunday", "Duminica")
    }
}

internal fun providerScheduleLabel(
    languageCode: String,
    hour: ProviderProfileWorkingHour,
): String {
    if (!hour.enabled) {
        return providerTr(languageCode, "Unavailable", "Indisponibil")
    }
    val start = hour.start.trim().ifEmpty { "09:00" }
    val end = hour.end.trim().ifEmpty { "18:00" }
    return "$start - $end"
}

internal fun normalizeProviderAvatarUrl(raw: String?): String? {
    val value = raw?.trim().orEmpty()
    if (value.isEmpty()) return null

    val baseApi = NetworkModule.baseApiUrl()
    val origin = baseApi.newBuilder()
        .encodedPath("/")
        .query(null)
        .fragment(null)
        .build()
        .toString()
        .trimEnd('/')

    val normalized = when {
        value.startsWith("/") -> "$origin$value"
        value.startsWith("http://", ignoreCase = true) || value.startsWith("https://", ignoreCase = true) -> value
        else -> "$origin/$value"
    }

    return normalized
        .replace("://localhost", "://10.0.2.2", ignoreCase = true)
        .replace("://127.0.0.1", "://10.0.2.2", ignoreCase = true)
}

@Composable
internal fun ProviderSectionCard(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    TrustoraCard(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            if (!subtitle.isNullOrBlank()) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraTertiaryText,
                    modifier = Modifier.padding(top = 3.dp, bottom = 12.dp),
                )
            } else {
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 8.dp))
            }
            content()
        }
    }
}

@Composable
internal fun ProviderInfoRow(label: String, value: String) {
    androidx.compose.foundation.layout.Row(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

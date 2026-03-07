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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.QueryStats
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AuthUser
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

@Composable
fun AdminAnalyticsScreen(
    user: AuthUser,
    languageCode: String,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        AdminAnalyticsTopBar(
            languageCode = languageCode,
            onBack = onBack,
        )

        if (!canAccessAdmin) {
            AdminAnalyticsUnavailableState(languageCode = languageCode)
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AdminAnalyticsHeaderCard(languageCode = languageCode)
            AdminAnalyticsStatsCard(languageCode = languageCode)
            AdminAnalyticsDevelopmentCard(languageCode = languageCode)
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun AdminAnalyticsTopBar(
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
                text = analyticsString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = analyticsString("admin.analytics.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.size(32.dp))
    }
}

@Composable
private fun AdminAnalyticsUnavailableState(languageCode: String) {
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
            text = analyticsString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = analyticsString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminAnalyticsHeaderCard(languageCode: String) {
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
            text = analyticsString("admin.analytics.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = analyticsString("admin.analytics.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminAnalyticsStatsCard(languageCode: String) {
    AdminAnalyticsSectionCard(
        title = analyticsString("admin.analytics.stats_title", languageCode),
        subtitle = analyticsString("admin.analytics.stats_description", languageCode),
        icon = Icons.Filled.Insights,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(modifier = Modifier.weight(1f)) {
                    AdminAnalyticsStatTile(
                        title = analyticsString("admin.analytics.stats_title", languageCode),
                        description = analyticsString("admin.analytics.stats_description", languageCode),
                        icon = Icons.Filled.QueryStats,
                        iconColor = Color(0xFF0284C7),
                        iconBackground = Color(0xFFE0F2FE),
                    )
                }
                Box(modifier = Modifier.weight(1f)) {
                    AdminAnalyticsStatTile(
                        title = analyticsString("admin.analytics.in_development_title", languageCode),
                        description = analyticsString("admin.analytics.in_development_description", languageCode),
                        icon = Icons.Filled.Insights,
                        iconColor = Color(0xFFB45309),
                        iconBackground = Color(0xFFFEF3C7),
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminAnalyticsDevelopmentCard(languageCode: String) {
    AdminAnalyticsSectionCard(
        title = analyticsString("admin.analytics.in_development_title", languageCode),
        subtitle = analyticsString("admin.analytics.in_development_description", languageCode),
        icon = Icons.Filled.Insights,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(TrustoraMutedSurface)
                .drawBehind {
                    drawRoundRect(
                        color = TrustoraBorder,
                        size = size,
                        cornerRadius = CornerRadius(14.dp.toPx(), 14.dp.toPx()),
                        style = Stroke(
                            width = 1.dp.toPx(),
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f),
                        ),
                    )
                }
                .padding(horizontal = 12.dp, vertical = 22.dp),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.BarChart,
                    contentDescription = null,
                    tint = TrustoraTertiaryText,
                    modifier = Modifier.size(26.dp),
                )
                Text(
                    text = analyticsString("admin.analytics.stats_description", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun AdminAnalyticsSectionCard(
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
private fun AdminAnalyticsStatTile(
    title: String,
    description: String,
    icon: ImageVector,
    iconColor: Color,
    iconBackground: Color,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
                maxLines = 1,
                modifier = Modifier.weight(1f),
            )
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier
                    .size(26.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(iconBackground)
                    .padding(6.dp),
            )
        }

        Text(
            text = description,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )
    }
}

private fun analyticsString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin panel unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.analytics.manage_title" -> if (ro) "Analytics & Rapoarte" else "Analytics & Reports"
        "admin.analytics.manage_subtitle" -> if (ro) "Analizează performanța platformei" else "Analyze platform performance"
        "admin.analytics.stats_title" -> if (ro) "Statistici Detaliate" else "Detailed Statistics"
        "admin.analytics.stats_description" -> if (ro) "Rapoarte și analize pentru platforma Trustora" else "Reports and analytics for the Trustora platform"
        "admin.analytics.in_development_title" -> if (ro) "Analytics în dezvoltare" else "Analytics in development"
        "admin.analytics.in_development_description" -> if (ro) "Rapoartele detaliate vor fi disponibile în curând" else "Detailed reports will be available soon"

        else -> key
    }
}

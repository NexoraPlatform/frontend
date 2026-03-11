package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.GppGood
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.Shield
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
fun AdminDisputesScreen(
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
        AdminDisputesTopBar(
            languageCode = languageCode,
            onBack = onBack,
        )

        if (!canAccessAdmin) {
            AdminDisputesUnavailableState(languageCode = languageCode)
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AdminDisputesHeaderCard(languageCode = languageCode)
            AdminDisputesCard(languageCode = languageCode)
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun AdminDisputesTopBar(
    languageCode: String,
    onBack: () -> Unit,
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .clickable(onClick = onBack)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = TrustoraPrimary)
            Spacer(modifier = Modifier.size(6.dp))
            Text(
                text = disputesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = disputesString("admin.disputes.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.size(32.dp))
    }
}

@Composable
private fun AdminDisputesUnavailableState(languageCode: String) {
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
            text = disputesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = disputesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminDisputesHeaderCard(languageCode: String) {
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
            text = disputesString("admin.disputes.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = disputesString("admin.disputes.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminDisputesCard(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        androidx.compose.foundation.layout.Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.GppGood,
                contentDescription = null,
                tint = TrustoraPrimary,
                modifier = Modifier.size(14.dp),
            )
            Text(
                text = disputesString("admin.disputes.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = disputesString("admin.disputes.list_description", languageCode),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

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
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Shield,
                    contentDescription = null,
                    tint = TrustoraTertiaryText,
                    modifier = Modifier.size(26.dp),
                )
                Text(
                    text = disputesString("admin.disputes.empty_title", languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimaryText,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = disputesString("admin.disputes.empty_description", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

private fun disputesString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."
        "admin.disputes.manage_title" -> if (ro) "Gestionare Dispute" else "Manage Disputes"
        "admin.disputes.manage_subtitle" -> if (ro) "Rezolvă disputele între utilizatori" else "Resolve user disputes"
        "admin.disputes.list_title" -> if (ro) "Lista Dispute" else "Disputes List"
        "admin.disputes.list_description" -> if (ro) "Toate disputele și reclamațiile platformei" else "All platform disputes and claims"
        "admin.disputes.empty_title" -> if (ro) "Nu există dispute active" else "No active disputes"
        "admin.disputes.empty_description" -> if (ro) "Toate disputele au fost rezolvate cu succes" else "All disputes have been successfully resolved"
        else -> key
    }
}

package com.trustora.app.ui.screens.about

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.datastore.SessionState
import com.trustora.app.designsystem.components.TrustoraCard
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

@Composable
fun AboutScreen(
    sessionState: SessionState,
    onOpenServices: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenAuth: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        HeroSection()
        StatsSection()
        MissionSection()
        ValuesSection()
        TimelineSection()
        TeamSection()
        CtaSection(
            isAuthenticated = sessionState.isAuthenticated,
            onOpenServices = onOpenServices,
            onOpenDashboard = onOpenDashboard,
            onOpenAuth = onOpenAuth,
        )
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun HeroSection() {
    TrustoraCard {
        Text("About Trustora", style = MaterialTheme.typography.labelMedium, color = TrustoraPrimary)
        Text("Digital collaboration with secure execution.", style = MaterialTheme.typography.headlineMedium, color = TrustoraPrimary)
        Text(
            "Trustora helps clients and providers work safely with escrow and transparent milestones.",
            style = MaterialTheme.typography.bodyLarge,
            color = TrustoraTertiaryText,
        )
    }
}

@Composable
private fun StatsSection() {
    val stats = listOf(
        "500+" to "Experts",
        "2,000+" to "Projects",
        "98%" to "Satisfaction",
        "50+" to "Cities",
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        stats.chunked(2).forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { (value, label) ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.White, RoundedCornerShape(14.dp))
                            .padding(vertical = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(value, style = MaterialTheme.typography.headlineMedium, color = TrustoraPrimaryText)
                            Text(label, style = MaterialTheme.typography.labelLarge, color = TrustoraTertiaryText)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MissionSection() {
    TrustoraCard {
        Text("Mission", style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText, fontWeight = FontWeight.Bold)
        Text("Accessibility", style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
        Text("High-quality talent should be accessible for every business.", style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
        Text("Transparency", style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
        Text("Milestones and payments stay visible for both sides.", style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
        Text("Excellence", style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
        Text("We optimize for quality delivery, not just matching.", style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
    }
}

@Composable
private fun ValuesSection() {
    val values = listOf(
        "Trust" to "Every collaboration starts with verified identities.",
        "Quality" to "Only validated profiles gain higher visibility.",
        "Speed" to "Project kickoff and approvals are streamlined.",
        "Support" to "Dispute and legal support are integrated.",
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        values.chunked(2).forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { (title, description) ->
                    TrustoraCard(modifier = Modifier.weight(1f)) {
                        Text(title, style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)
                        Text(description, style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
                    }
                }
            }
        }
    }
}

@Composable
private fun TimelineSection() {
    val timeline = listOf(
        "2020" to "Concept and trust protocol design.",
        "2021" to "Private beta for agencies and freelancers.",
        "2022" to "Milestone escrow and legal clauses launch.",
        "2023" to "Expansion to enterprise projects.",
        "2024" to "AI-assisted briefing and provider matching.",
    )

    TrustoraCard {
        Text("Timeline", style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)
        timeline.forEach { (year, description) ->
            Text("$year - $description", style = MaterialTheme.typography.bodyMedium, color = TrustoraSecondaryText)
        }
    }
}

@Composable
private fun TeamSection() {
    val team = listOf(
        "Alexandru Popescu" to "Product",
        "Maria Ionescu" to "Operations",
        "Andrei Georgescu" to "Engineering",
        "Diana Marinescu" to "Customer Success",
    )

    TrustoraCard {
        Text("Core team", style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)
        team.forEach { (name, role) ->
            Text("$name - $role", style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
        }
    }
}

@Composable
private fun CtaSection(
    isAuthenticated: Boolean,
    onOpenServices: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenAuth: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraPrimary, RoundedCornerShape(18.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Ready to build with trust?",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White,
            textAlign = TextAlign.Center,
        )

        Button(
            onClick = if (isAuthenticated) onOpenDashboard else onOpenAuth,
            colors = ButtonDefaults.buttonColors(containerColor = TrustoraAccent, contentColor = TrustoraAccentButtonText),
        ) {
            Text(if (isAuthenticated) "Open dashboard" else "Create account")
        }

        Button(onClick = onOpenServices) {
            Text("Browse services")
        }
    }
}

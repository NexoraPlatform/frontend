package com.trustora.app.ui.screens.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.ViewList
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.R
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.utils.formatMoneyFromUsd
import com.trustora.app.ui.app.HomeScrollTarget
import com.trustora.app.designsystem.components.BrandLockup
import com.trustora.app.designsystem.components.FooterContactRow
import com.trustora.app.designsystem.components.TrustoraCard
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.util.Calendar
import java.util.Locale

private const val HOME_SECTION_TOP_INDEX = 0
private const val HOME_SECTION_FOOTER_INDEX = 5

private fun localized(languageCode: String, en: String, ro: String): String {
    return if (languageCode.startsWith("ro", ignoreCase = true)) ro else en
}

@Composable
fun HomeScreen(
    languageCode: String,
    currency: AppCurrency,
    onOpenAuthSignUp: () -> Unit,
    onOpenHome: () -> Unit,
    onOpenServices: () -> Unit,
    onOpenAbout: () -> Unit,
    onOpenHelp: () -> Unit,
    onOpenContact: () -> Unit,
    scrollTarget: HomeScrollTarget?,
    onScrollTargetConsumed: () -> Unit,
) {
    val listState = rememberLazyListState()
    val isRomanian = remember(languageCode) { languageCode.startsWith("ro", ignoreCase = true) }
    var newsletterEmail by rememberSaveable { mutableStateOf("") }
    val currentYear = remember { Calendar.getInstance().get(Calendar.YEAR) }

    LaunchedEffect(scrollTarget) {
        when (scrollTarget) {
            HomeScrollTarget.TOP -> listState.animateScrollToItem(HOME_SECTION_TOP_INDEX)
            HomeScrollTarget.FOOTER -> listState.animateScrollToItem(HOME_SECTION_FOOTER_INDEX)
            null -> Unit
        }
        if (scrollTarget != null) {
            onScrollTargetConsumed()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        state = listState,
    ) {
        item {
            HeroSection(
                languageCode = languageCode,
                currency = currency,
                isRomanian = isRomanian,
                onOpenAuthSignUp = onOpenAuthSignUp,
            )
        }

        item { PillarsSection(isRomanian = isRomanian) }
        item { MessagingSection(isRomanian = isRomanian) }
        item { VisualSection(isRomanian = isRomanian) }
        item { FinalCtaSection(isRomanian = isRomanian, onOpenAuthSignUp = onOpenAuthSignUp) }

        item {
            FooterSection(
                languageCode = languageCode,
                currentYear = currentYear,
                newsletterEmail = newsletterEmail,
                onNewsletterEmailChange = { newsletterEmail = it },
                onOpenHome = onOpenHome,
                onOpenServices = onOpenServices,
                onOpenAbout = onOpenAbout,
                onOpenHelp = onOpenHelp,
                onOpenContact = onOpenContact,
            )
        }

        item { Spacer(modifier = Modifier.height(18.dp)) }
    }
}

@Composable
private fun HeroSection(
    languageCode: String,
    currency: AppCurrency,
    isRomanian: Boolean,
    onOpenAuthSignUp: () -> Unit,
) {
    val badge = if (isRomanian) "PLATFORMĂ LIVE ÎN ROMÂNIA" else "LIVE PLATFORM IN ROMANIA"
    val title = if (isRomanian) "Unde munca întâlnește" else "Where work meets"
    val titleHighlight = if (isRomanian) "încrederea." else "trust."
    val subtitle = if (isRomanian) {
        "Prima infrastructură digitală din România care securizează plățile și garantează livrarea serviciilor IT prin sistem Escrow nativ și verificare video."
    } else {
        "Romania's first digital infrastructure that secures payments and guarantees IT service delivery through native escrow and video verification."
    }
    val primaryCta = if (isRomanian) "Începe acum — Gratuit" else "Start now — Free"
    val secondaryCta = if (isRomanian) "Vezi cum funcționează" else "See how it works"
    val trustedLabel = if (isRomanian) "Peste 500+ specialiști IT verificați video" else "500+ video-verified IT specialists"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(MaterialTheme.colorScheme.background, MaterialTheme.colorScheme.surface),
                ),
            )
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(TrustoraAccent.copy(alpha = 0.12f))
                .border(1.dp, TrustoraAccent.copy(alpha = 0.4f), CircleShape)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Image(
                painter = painterResource(id = R.drawable.trustora_logo),
                contentDescription = "Trustora",
                modifier = Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(7.dp)),
                contentScale = ContentScale.Crop,
            )
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .background(TrustoraAccent, CircleShape),
            )
            Text(
                text = badge,
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF166043),
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineLarge,
                color = TrustoraPrimary,
            )
            Text(
                text = titleHighlight,
                style = MaterialTheme.typography.headlineLarge,
                color = TrustoraAccent,
            )
        }

        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = TrustoraSecondaryText,
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(
                onClick = onOpenAuthSignUp,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                Text(primaryCta, style = MaterialTheme.typography.titleMedium)
            }

            Button(
                onClick = { },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    contentColor = TrustoraPrimary,
                ),
                border = androidx.compose.foundation.BorderStroke(1.2.dp, TrustoraPrimary.copy(alpha = 0.3f)),
            ) {
                Text(secondaryCta, style = MaterialTheme.typography.titleMedium)
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy((-8).dp)) {
                listOf(Color(0xFF94A3B8), Color(0xFF64748B), Color(0xFF475569)).forEach { color ->
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(color, CircleShape)
                            .border(1.5.dp, Color.White, CircleShape),
                    )
                }
            }
            Text(
                text = trustedLabel,
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraTertiaryText,
            )
        }

        DashboardCard(
            dashboardLabel = "Active Escrow Dashboard",
            securedLabel = "SECURED",
            contractName = localized(languageCode, "AI Module Development", "Dezvoltare Modul AI"),
            amountText = formatMoneyFromUsd(4200.0, currency, languageCode),
            milestoneProgress = "MILESTONE 3/4",
            milestoneEta = if (isRomanian) "LIVRATĂ ÎN 2 ZILE" else "DELIVERED IN 2 DAYS",
            nextMilestone = if (isRomanian) "Next Milestone" else "Next milestone",
            payoutLabel = "Payout",
            payoutValue = "Instant",
        )
    }
}

@Composable
private fun DashboardCard(
    dashboardLabel: String,
    securedLabel: String,
    contractName: String,
    amountText: String,
    milestoneProgress: String,
    milestoneEta: String,
    nextMilestone: String,
    payoutLabel: String,
    payoutValue: String,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, TrustoraPrimary.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = dashboardLabel.uppercase(Locale.ROOT),
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF475569),
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = securedLabel,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                color = TrustoraAccent,
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(TrustoraAccent.copy(alpha = 0.12f))
                    .padding(horizontal = 8.dp, vertical = 5.dp),
            )
        }

        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(contractName, style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    amountText,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    color = TrustoraPrimaryText,
                )
            }

            LinearProgressIndicator(
                progress = { 0.75f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(100.dp)),
                color = TrustoraAccent,
                trackColor = TrustoraBorder,
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(milestoneProgress, style = MaterialTheme.typography.labelSmall, color = TrustoraTertiaryText)
                Spacer(modifier = Modifier.weight(1f))
                Text(milestoneEta, style = MaterialTheme.typography.labelSmall, color = TrustoraTertiaryText)
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                text = nextMilestone,
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraTertiaryText,
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(TrustoraMutedSurface)
                    .border(
                        1.dp,
                        Color(0xFFCBD5E1),
                        RoundedCornerShape(12.dp),
                    )
                    .padding(horizontal = 12.dp, vertical = 13.dp),
            )
            Column(
                modifier = Modifier
                    .width(96.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(TrustoraPrimary)
                    .padding(vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(payoutLabel, style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.75f))
                Text(payoutValue, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color.White)
            }
        }
    }
}

@Composable
private fun PillarsSection(isRomanian: Boolean) {
    val cards = listOf(
        Triple(
            Icons.Default.Shield,
            if (isRomanian) "Oameni verificați" else "Verified People",
            if (isRomanian) "Nimeni nu lucrează fără test tehnic și verificare video obligatorie." else "No one works without a technical test and mandatory video verification.",
        ),
        Triple(
            Icons.Default.Lock,
            if (isRomanian) "Bani protejați" else "Protected Money",
            if (isRomanian) "Fiecare euro este ținut în escrow până la confirmarea livrării." else "Every euro is held in escrow until delivery is confirmed.",
        ),
        Triple(
            Icons.Default.BarChart,
            if (isRomanian) "Livrare garantată" else "Enforced Delivery",
            if (isRomanian) "Plata se eliberează doar pe baza milestone-urilor acceptate." else "Payment is released only on accepted milestones.",
        ),
        Triple(
            Icons.Default.Description,
            if (isRomanian) "Contracte cu valoare legală" else "Legal-grade contracts",
            if (isRomanian) "Fiecare job este un contract digital cu valoare legală deplină." else "Every job is a digital contract with full legal value.",
        ),
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        cards.chunked(2).forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                rowItems.forEach { (icon, title, description) ->
                    TrustoraCard(modifier = Modifier.weight(1f)) {
                        Icon(imageVector = icon, contentDescription = null, tint = TrustoraAccent)
                        Text(title, style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)
                        Text(description, style = MaterialTheme.typography.bodyMedium, color = TrustoraTertiaryText)
                    }
                }
            }
        }
    }
}

@Composable
private fun MessagingSection(isRomanian: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 20.dp, vertical = 30.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        MessagingCard(
            badge = if (isRomanian) "PENTRU CLIENȚI" else "FOR CLIENTS",
            title = if (isRomanian) "„Plătesc doar când primesc livrarea.”" else "“I pay only when I receive the delivery.”",
            description = if (isRomanian) {
                "Banii tăi sunt protejați prin escrow. Nicio plată nu părăsește platforma fără confirmarea ta explicită a calității muncii."
            } else {
                "Your money is protected through escrow. No payment leaves the platform without your explicit confirmation of the work quality."
            },
            benefits = listOf(
                if (isRomanian) "Zero risc de pierdere financiară" else "Zero financial loss risk",
                if (isRomanian) "Profesioniști pre-verificați video" else "Video pre-verified professionals",
            ),
            linkLabel = if (isRomanian) "Începe să angajezi în siguranță →" else "Start hiring safely →",
            dark = false,
        )

        MessagingCard(
            badge = if (isRomanian) "PENTRU PROFESIONIȘTI" else "FOR PROFESSIONALS",
            title = if (isRomanian) "„Banii sunt blocați înainte să încep.”" else "“Funds are locked before I start.”",
            description = if (isRomanian) {
                "Nu mai lucrezi pe promisiuni. Plata pentru fiecare milestone este deja blocată în sistem înainte ca tu să scrii prima linie de cod."
            } else {
                "No more working on promises. Payment for each milestone is already locked in the system before you write the first line of code."
            },
            benefits = listOf(
                if (isRomanian) "Garanția plății 100%" else "100% payment guarantee",
                if (isRomanian) "Dispute rezolvate prin arbitraj tehnic" else "Disputes resolved through technical arbitration",
            ),
            linkLabel = if (isRomanian) "Intră în infrastructură →" else "Join the infrastructure →",
            dark = true,
        )
    }
}

@Composable
private fun MessagingCard(
    badge: String,
    title: String,
    description: String,
    benefits: List<String>,
    linkLabel: String,
    dark: Boolean,
) {
    val background = if (dark) TrustoraPrimary else MaterialTheme.colorScheme.surface
    val textPrimary = if (dark) Color.White else TrustoraPrimaryText
    val textSecondary = if (dark) Color.White.copy(alpha = 0.78f) else TrustoraTertiaryText
    val borderColor = if (dark) Color(0xFF1E2A3D) else TrustoraBorder
    val badgeBackground = if (dark) Color.White.copy(alpha = 0.12f) else Color(0xFFE2E8F0)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(background)
            .border(1.dp, borderColor, RoundedCornerShape(18.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = badge,
            style = MaterialTheme.typography.labelSmall,
            color = textPrimary,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(badgeBackground)
                .padding(horizontal = 8.dp, vertical = 5.dp),
        )

        Text(text = title, style = MaterialTheme.typography.titleLarge, color = textPrimary)
        Text(text = description, style = MaterialTheme.typography.bodyLarge, color = textSecondary)

        benefits.forEach { benefit ->
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("✅")
                Text(text = benefit, style = MaterialTheme.typography.bodyLarge, color = textPrimary)
            }
        }

        Text(text = linkLabel, style = MaterialTheme.typography.titleMedium, color = textPrimary)
    }
}

@Composable
private fun VisualSection(isRomanian: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 20.dp, vertical = 34.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = if (isRomanian) "Rapyd + Notar + Marketplace" else "Rapyd + Notary + Marketplace",
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimary,
            textAlign = TextAlign.Center,
        )

        VisualNodeCard(
            emoji = "\uD83D\uDCB0",
            title = if (isRomanian) "Bani" else "Money",
            subtitle = if (isRomanian) "Strat escrow" else "Escrow layer",
            highlighted = false,
        )
        Box(modifier = Modifier.width(1.dp).height(18.dp).background(Color(0xFFCBD5E1)))
        VisualNodeCard(
            emoji = "\uD83D\uDCD1",
            title = if (isRomanian) "Contracte" else "Contracts",
            subtitle = if (isRomanian) "Execuție digitală" else "Digital execution",
            highlighted = true,
        )
        Box(modifier = Modifier.width(1.dp).height(18.dp).background(Color(0xFFCBD5E1)))
        VisualNodeCard(
            emoji = "\uD83D\uDC64",
            title = if (isRomanian) "Verificare" else "Verification",
            subtitle = if (isRomanian) "Strat de identitate" else "Identity layer",
            highlighted = false,
        )
    }
}

@Composable
private fun VisualNodeCard(
    emoji: String,
    title: String,
    subtitle: String,
    highlighted: Boolean,
) {
    val borderColor = if (highlighted) TrustoraAccent else TrustoraBorder
    val titleColor = if (highlighted) Color(0xFF0C8F5D) else TrustoraPrimaryText

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.4.dp, borderColor, RoundedCornerShape(16.dp))
            .padding(vertical = 20.dp, horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(emoji)
        Text(title, style = MaterialTheme.typography.labelLarge, color = titleColor)
        Text(subtitle, style = MaterialTheme.typography.labelMedium, color = TrustoraTertiaryText)
    }
}

@Composable
private fun FinalCtaSection(
    isRomanian: Boolean,
    onOpenAuthSignUp: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraPrimary)
            .padding(horizontal = 20.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = if (isRomanian) "Fără încredere. Fără deal." else "No trust. No deal.",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White,
            textAlign = TextAlign.Center,
        )

        Text(
            text = if (isRomanian) {
                "Lucrează fără risc pe cea mai sigură platformă pentru servicii online."
            } else {
                "Work without risk on the safest platform for online services."
            },
            style = MaterialTheme.typography.bodyLarge,
            color = Color.White.copy(alpha = 0.74f),
            textAlign = TextAlign.Center,
        )

        Button(
            onClick = onOpenAuthSignUp,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            Text(
                if (isRomanian) "Pornește un proiect protejat" else "Start a protected project",
                style = MaterialTheme.typography.titleMedium,
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                (if (isRomanian) "Escrow securizat" else "Escrow Secured").uppercase(Locale.ROOT),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.5f),
            )
            Text(
                (if (isRomanian) "Verificat video" else "Video Verified").uppercase(Locale.ROOT),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.5f),
            )
            Text(
                (if (isRomanian) "Valoare legală" else "Legal Grade").uppercase(Locale.ROOT),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.5f),
            )
        }
    }
}

@Composable
private fun FooterSection(
    languageCode: String,
    currentYear: Int,
    newsletterEmail: String,
    onNewsletterEmailChange: (String) -> Unit,
    onOpenHome: () -> Unit,
    onOpenServices: () -> Unit,
    onOpenAbout: () -> Unit,
    onOpenHelp: () -> Unit,
    onOpenContact: () -> Unit,
) {
    val quickLinks = localized(languageCode, "Quick Links", "Link-uri Rapide")
    val popularServices = localized(languageCode, "Popular Services", "Servicii Populare")
    val contact = localized(languageCode, "Contact", "Contact")
    val newsletter = localized(languageCode, "Newsletter", "Newsletter")
    val legalDocuments = localized(languageCode, "Legal documents", "Documente legale")
    val yourEmail = localized(languageCode, "Your Email", "Email-ul tău")
    val subscribe = localized(languageCode, "Subscribe", "Abonează-te")
    val privacyPolicy = localized(languageCode, "Privacy Policy", "Politica de confidențialitate")
    val termsConditions = localized(languageCode, "Terms and Conditions", "Termeni și condiții")
    val cookiePolicy = localized(languageCode, "Cookie Policy", "Politica de cookie-uri")
    val allRightsReserved = localized(languageCode, "All rights reserved", "Toate drepturile rezervate")
    val footerDescription = localized(
        languageCode,
        "The Romanian platform for professional IT services. We connect clients with the right experts for their projects.",
        "Platforma românească pentru servicii IT profesionale. Conectăm clienții cu experții potriviți pentru proiectele lor.",
    )
    val location = localized(languageCode, "Bucharest, Romania", "Mamaia Sat, Navodari, România, 905700")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface)
            .padding(horizontal = 20.dp, vertical = 30.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp),
    ) {
        BrandLockup(compact = false, tagline = "Where work meets trust.")

        Text(
            text = footerDescription,
            style = MaterialTheme.typography.bodyLarge,
            color = TrustoraTertiaryText,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SocialIconButton(icon = Icons.Default.Language)
            SocialIconButton(icon = Icons.Default.AlternateEmail)
            SocialIconButton(icon = Icons.Default.Work)
            SocialIconButton(icon = Icons.Default.CameraAlt)
        }

        FooterSectionTitle(text = quickLinks)
        FooterLinkRow(icon = Icons.Default.Home, title = localized(languageCode, "Home", "Acasă"), onClick = onOpenHome)
        FooterLinkRow(icon = Icons.AutoMirrored.Filled.ViewList, title = localized(languageCode, "Services", "Servicii"), onClick = onOpenServices)
        FooterLinkRow(icon = Icons.Default.Info, title = localized(languageCode, "About", "Despre"), onClick = onOpenAbout)
        FooterLinkRow(icon = Icons.AutoMirrored.Filled.Help, title = localized(languageCode, "Help", "Ajutor"), onClick = onOpenHelp)
        FooterLinkRow(icon = Icons.Default.ContactPhone, title = localized(languageCode, "Contact", "Contact"), onClick = onOpenContact)

        FooterSectionTitle(text = popularServices)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            PopularServiceChip(localized(languageCode, "Web Development", "Dezvoltare Web"))
            PopularServiceChip(localized(languageCode, "Mobile Apps", "Aplicații Mobile"))
            PopularServiceChip(localized(languageCode, "UI/UX Design", "Design UI/UX"))
            PopularServiceChip(localized(languageCode, "Digital Marketing", "Marketing Digital"))
        }

        FooterSectionTitle(text = contact)
        FooterContactRow("contact@trustora.ro")
        FooterContactRow("+40 123 456 789")
        FooterContactRow(location)

        FooterSectionTitle(text = newsletter)
        OutlinedTextField(
            value = newsletterEmail,
            onValueChange = onNewsletterEmailChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            label = { Text(yourEmail) },
            leadingIcon = {
                Icon(imageVector = Icons.Default.Email, contentDescription = null)
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        )
        Button(
            onClick = { },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            Text(subscribe, style = MaterialTheme.typography.titleMedium)
        }

        FooterSectionTitle(text = legalDocuments)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(privacyPolicy, style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
            Text("|", style = MaterialTheme.typography.labelLarge, color = TrustoraTertiaryText)
            Text(termsConditions, style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
            Text("|", style = MaterialTheme.typography.labelLarge, color = TrustoraTertiaryText)
            Text(cookiePolicy, style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
        }

        HorizontalDivider(color = TrustoraBorder)
        Text(
            text = "© $currentYear Trustora. $allRightsReserved.",
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraTertiaryText,
            modifier = Modifier.align(Alignment.CenterHorizontally),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun FooterSectionTitle(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        color = TrustoraPrimaryText,
    )
}

@Composable
private fun SocialIconButton(icon: androidx.compose.ui.graphics.vector.ImageVector) {
    IconButton(
        onClick = { },
        modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp)),
    ) {
        Icon(icon, contentDescription = null, tint = TrustoraPrimaryText)
    }
}

@Composable
private fun FooterLinkRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = TrustoraAccent, modifier = Modifier.size(15.dp))
        Text(text = title, style = MaterialTheme.typography.bodyLarge, color = TrustoraPrimaryText)
        Spacer(modifier = Modifier.weight(1f))
        Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = TrustoraTertiaryText)
    }
}

@Composable
private fun PopularServiceChip(label: String) {
    Text(
        text = label,
        style = MaterialTheme.typography.labelLarge,
        color = TrustoraPrimary,
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFECFDF5))
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

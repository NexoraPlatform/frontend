package com.trustora.app.designsystem.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.trustora.app.R
import com.trustora.app.core.models.AuthUser
import com.trustora.app.di.NetworkModule
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

@Composable
fun BrandLockup(
    compact: Boolean,
    tagline: String,
    modifier: Modifier = Modifier,
    showsLogoIcon: Boolean = true,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(if (compact) 10.dp else 12.dp),
    ) {
        if (showsLogoIcon) {
            Image(
                painter = painterResource(id = R.drawable.trustora_logo),
                contentDescription = "Trustora",
                modifier = Modifier
                    .size(if (compact) 36.dp else 42.dp)
                    .clip(RoundedCornerShape(10.dp)),
                contentScale = ContentScale.Crop,
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                text = "Trustora",
                style = if (compact) MaterialTheme.typography.titleLarge else MaterialTheme.typography.headlineMedium,
                color = TrustoraPrimary,
            )
            Text(
                text = tagline,
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraTertiaryText,
            )
        }
    }
}

@Composable
fun TrustoraCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, TrustoraBorder),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content,
        )
    }
}

@Composable
fun MenuLinkRow(
    icon: @Composable () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        icon()
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = TrustoraTertiaryText,
        )
    }
}

@Composable
fun AuthAvatar(user: AuthUser, modifier: Modifier = Modifier) {
    val resolvedAvatar = remember(user.avatar) { normalizeAvatarUrl(user.avatar) }

    Box(
        modifier = modifier
            .size(38.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = user.initials,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Black),
            color = TrustoraSecondaryText,
        )

        if (!resolvedAvatar.isNullOrBlank()) {
            AsyncImage(
                model = resolvedAvatar,
                contentDescription = user.displayName,
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp)),
                contentScale = ContentScale.Crop,
            )
        }
    }
}

private fun normalizeAvatarUrl(raw: String?): String? {
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
fun FooterContactRow(label: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(TrustoraAccent),
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(text = label, style = MaterialTheme.typography.bodyLarge, color = TrustoraSecondaryText)
    }
}

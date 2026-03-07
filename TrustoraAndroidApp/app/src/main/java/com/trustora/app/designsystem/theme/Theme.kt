package com.trustora.app.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import com.trustora.app.core.models.AppThemeMode

private val TrustoraLightColorScheme = lightColorScheme(
    primary = TrustoraAccent,
    onPrimary = TrustoraAccentButtonText,
    secondary = TrustoraPrimary,
    background = TrustoraBackground,
    onBackground = TrustoraPrimaryText,
    surface = TrustoraSurface,
    onSurface = TrustoraPrimaryText,
    outline = TrustoraBorder,
)

private val TrustoraDarkColorScheme = darkColorScheme(
    primary = TrustoraAccent,
    onPrimary = TrustoraAccentButtonText,
    secondary = TrustoraDarkPrimaryText,
    background = TrustoraDarkBackground,
    onBackground = TrustoraDarkPrimaryText,
    surface = TrustoraDarkSurface,
    onSurface = TrustoraDarkPrimaryText,
    outline = TrustoraDarkBorder,
)

@Composable
fun TrustoraAndroidAppTheme(
    themeMode: AppThemeMode,
    content: @Composable () -> Unit,
) {
    val systemDark = isSystemInDarkTheme()
    val darkTheme = when (themeMode) {
        AppThemeMode.SYSTEM -> systemDark
        AppThemeMode.DARK -> true
        AppThemeMode.LIGHT -> false
    }

    MaterialTheme(
        colorScheme = if (darkTheme) TrustoraDarkColorScheme else TrustoraLightColorScheme,
        typography = Typography,
        content = content,
    )
}

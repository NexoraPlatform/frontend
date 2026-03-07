package com.trustora.app.core.models

enum class AppLanguage(val raw: String) {
    SYSTEM("system"),
    EN("en"),
    RO("ro");

    companion object {
        fun fromRaw(raw: String?): AppLanguage = entries.firstOrNull { it.raw == raw } ?: SYSTEM
    }
}

enum class AppCurrency(val raw: String) {
    USD("USD"),
    EUR("EUR"),
    RON("RON");

    companion object {
        fun fromRaw(raw: String?): AppCurrency = entries.firstOrNull { it.raw == raw } ?: USD
    }
}

enum class AppThemeMode(val raw: String) {
    SYSTEM("system"),
    LIGHT("light"),
    DARK("dark");

    companion object {
        fun fromRaw(raw: String?): AppThemeMode = entries.firstOrNull { it.raw == raw } ?: SYSTEM
    }
}

data class AppPreferences(
    val language: AppLanguage = AppLanguage.SYSTEM,
    val currency: AppCurrency = AppCurrency.USD,
    val themeMode: AppThemeMode = AppThemeMode.SYSTEM,
) {
    fun resolvedLanguageTag(deviceLanguageTag: String): String {
        if (language != AppLanguage.SYSTEM) {
            return language.raw
        }
        return if (deviceLanguageTag.startsWith("ro", ignoreCase = true)) "ro" else "en"
    }
}

package com.trustora.app.core.datastore

import android.content.Context
import android.content.SharedPreferences
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AppLanguage
import com.trustora.app.core.models.AppPreferences
import com.trustora.app.core.models.AppThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SettingsRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)

    private val _state = MutableStateFlow(loadPreferences())
    val state: StateFlow<AppPreferences> = _state.asStateFlow()

    fun setLanguage(language: AppLanguage) {
        prefs.edit().putString(KEY_LANGUAGE, language.raw).apply()
        _state.value = _state.value.copy(language = language)
    }

    fun setCurrency(currency: AppCurrency) {
        prefs.edit().putString(KEY_CURRENCY, currency.raw).apply()
        _state.value = _state.value.copy(currency = currency)
    }

    fun setTheme(themeMode: AppThemeMode) {
        prefs.edit().putString(KEY_THEME, themeMode.raw).apply()
        _state.value = _state.value.copy(themeMode = themeMode)
    }

    private fun loadPreferences(): AppPreferences {
        return AppPreferences(
            language = AppLanguage.fromRaw(prefs.getString(KEY_LANGUAGE, AppLanguage.SYSTEM.raw)),
            currency = AppCurrency.fromRaw(prefs.getString(KEY_CURRENCY, AppCurrency.USD.raw)),
            themeMode = AppThemeMode.fromRaw(prefs.getString(KEY_THEME, AppThemeMode.SYSTEM.raw)),
        )
    }

    companion object {
        private const val PREFS_FILE = "trustora.app.preferences"
        private const val KEY_LANGUAGE = "trustora.app.language"
        private const val KEY_CURRENCY = "preferred_currency"
        private const val KEY_THEME = "trustora.app.theme"
    }
}

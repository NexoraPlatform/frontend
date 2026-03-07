package com.trustora.app.core.datastore

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.trustora.app.core.models.AuthUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SessionState(
    val accessToken: String? = null,
    val user: AuthUser? = null,
) {
    val isAuthenticated: Boolean
        get() = !accessToken.isNullOrBlank() && user != null
}

class SessionStore(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _state = MutableStateFlow(loadSession())
    val state: StateFlow<SessionState> = _state.asStateFlow()

    fun setSession(accessToken: String, user: AuthUser) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_CACHED_USER, gson.toJson(user))
            .apply()
        _state.value = SessionState(accessToken = accessToken, user = user)
    }

    fun updateUser(user: AuthUser?) {
        if (user == null) {
            clear()
            return
        }
        prefs.edit().putString(KEY_CACHED_USER, gson.toJson(user)).apply()
        _state.value = _state.value.copy(user = user)
    }

    fun clear() {
        prefs.edit().remove(KEY_ACCESS_TOKEN).remove(KEY_CACHED_USER).apply()
        _state.value = SessionState()
    }

    private fun loadSession(): SessionState {
        val token = prefs.getString(KEY_ACCESS_TOKEN, null)
        val userJson = prefs.getString(KEY_CACHED_USER, null)
        val user = runCatching { userJson?.let { gson.fromJson(it, AuthUser::class.java) } }.getOrNull()
        return SessionState(accessToken = token, user = user)
    }

    companion object {
        private const val PREFS_FILE = "trustora.auth"
        private const val KEY_ACCESS_TOKEN = "trustora.auth.access_token"
        private const val KEY_CACHED_USER = "trustora.auth.cached_user"
    }
}

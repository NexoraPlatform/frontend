package com.trustora.app.ui.app

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AppLanguage
import com.trustora.app.core.models.AppThemeMode
import com.trustora.app.core.network.RegisterPayload
import com.trustora.app.core.repository.AppContainer
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

enum class RootPage {
    HOME,
    SERVICES,
    ABOUT,
}

enum class AuthMode {
    SIGN_IN,
    SIGN_UP,
}

enum class HomeScrollTarget {
    TOP,
    FOOTER,
}

class MainViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    val settings: StateFlow<com.trustora.app.core.models.AppPreferences> =
        appContainer.settingsRepository.state

    val session = appContainer.authRepository.session

    var currentPage by mutableStateOf(RootPage.HOME)
        private set

    var pendingAuthMode by mutableStateOf<AuthMode?>(null)
        private set

    var isAuthLoading by mutableStateOf(false)
        private set

    var authErrorMessage by mutableStateOf<String?>(null)
        private set

    var homeScrollTarget by mutableStateOf<HomeScrollTarget?>(null)
        private set

    init {
        viewModelScope.launch {
            appContainer.authRepository.bootstrap()
        }
    }

    fun openPage(page: RootPage) {
        currentPage = page
        if (page != RootPage.HOME) {
            homeScrollTarget = null
        }
    }

    fun openHome(target: HomeScrollTarget = HomeScrollTarget.TOP) {
        currentPage = RootPage.HOME
        homeScrollTarget = target
    }

    fun consumeHomeScrollTarget() {
        homeScrollTarget = null
    }

    fun openAuth(mode: AuthMode) {
        authErrorMessage = null
        pendingAuthMode = mode
    }

    fun closeAuth() {
        pendingAuthMode = null
    }

    fun setLanguage(language: AppLanguage) {
        appContainer.settingsRepository.setLanguage(language)
    }

    fun setCurrency(currency: AppCurrency) {
        appContainer.settingsRepository.setCurrency(currency)
    }

    fun setTheme(themeMode: AppThemeMode) {
        appContainer.settingsRepository.setTheme(themeMode)
    }

    fun signIn(email: String, password: String, onSuccess: () -> Unit) {
        if (isAuthLoading) return
        isAuthLoading = true
        authErrorMessage = null

        viewModelScope.launch {
            runCatching {
                appContainer.authRepository.signIn(email = email, password = password)
            }.onSuccess {
                pendingAuthMode = null
                onSuccess()
            }.onFailure { error ->
                authErrorMessage = error.message ?: "Authentication failed"
            }
            isAuthLoading = false
        }
    }

    fun signUp(
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        password: String,
        role: String,
        company: String,
        companyName: String,
        taxId: String,
        tradeRegistryNumber: String,
        billingAddress: String,
        billingCity: String,
        billingState: String,
        billingPostalCode: String,
        onSuccess: () -> Unit,
    ) {
        if (isAuthLoading) return
        isAuthLoading = true
        authErrorMessage = null

        val payload = RegisterPayload(
            firstName = firstName,
            lastName = lastName,
            email = email,
            phone = phone.trim().ifEmpty { null },
            password = password,
            role = role,
            company = company.trim().ifEmpty { null },
            companyName = companyName.trim().ifEmpty { null },
            taxId = taxId.trim().ifEmpty { null },
            tradeRegistryNumber = tradeRegistryNumber.trim().ifEmpty { null },
            billingAddress = billingAddress.trim().ifEmpty { null },
            billingCity = billingCity.trim().ifEmpty { null },
            billingState = billingState.trim().ifEmpty { null },
            billingPostalCode = billingPostalCode.trim().ifEmpty { null },
        )

        viewModelScope.launch {
            runCatching {
                appContainer.authRepository.signUp(payload)
            }.onSuccess {
                pendingAuthMode = null
                onSuccess()
            }.onFailure { error ->
                authErrorMessage = error.message ?: "Registration failed"
            }

            isAuthLoading = false
        }
    }

    fun signOut() {
        viewModelScope.launch {
            appContainer.authRepository.signOut()
            openHome(HomeScrollTarget.TOP)
        }
    }

    fun refreshProfile() {
        viewModelScope.launch {
            runCatching {
                appContainer.authRepository.refreshProfile()
            }
        }
    }

    fun syncRealtimeSession(userId: String?, accessToken: String?) {
        viewModelScope.launch {
            val normalizedUserId = userId?.trim()
            val normalizedToken = accessToken?.trim()
            if (normalizedUserId.isNullOrBlank() || normalizedToken.isNullOrBlank()) {
                appContainer.realtimeService.stop()
            } else {
                appContainer.realtimeService.start(
                    userId = normalizedUserId,
                    bearerToken = normalizedToken,
                )
            }
        }
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return MainViewModel(appContainer) as T
        }
    }
}

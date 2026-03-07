package com.trustora.app.core.repository

import android.content.Context
import com.trustora.app.di.NetworkModule
import com.trustora.app.core.datastore.SessionStore
import com.trustora.app.core.datastore.SettingsRepository
import com.trustora.app.core.realtime.TrustoraRealtimeService
import com.trustora.app.features.auth.data.AuthRepository
import com.trustora.app.features.briefing.data.ProjectCreationRepository
import com.trustora.app.features.dashboard.data.DashboardRepository

class AppContainer(context: Context) {
    private val applicationContext = context.applicationContext

    val settingsRepository = SettingsRepository(applicationContext)
    val sessionStore = SessionStore(applicationContext)

    private val httpClient = NetworkModule.createHttpClient()
    private val api = NetworkModule.createTrustoraApi(client = httpClient)

    val realtimeService = TrustoraRealtimeService(
        apiBaseUrl = NetworkModule.baseApiUrl(),
        okHttpClient = httpClient,
    )

    val authRepository = AuthRepository(api, sessionStore)
    val marketplaceRepository = MarketplaceRepository(api)
    val providerProfileRepository = ProviderProfileRepository(api)
    val dashboardRepository = DashboardRepository(
        api = api,
        context = applicationContext,
    )
    val projectCreationRepository = ProjectCreationRepository(api)
}

package com.trustora.app

import android.app.Application
import com.trustora.app.core.repository.AppContainer

class TrustoraApplication : Application() {
    val appContainer: AppContainer by lazy { AppContainer(this) }
}

package com.trustora.app

import android.os.Bundle
import androidx.activity.viewModels
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.ui.app.MainViewModel
import com.trustora.app.ui.app.TrustoraAppRoot
import com.trustora.app.ui.screens.admin.AdminCallsViewModel
import com.trustora.app.ui.screens.admin.AdminActivitiesViewModel
import com.trustora.app.ui.screens.admin.AdminAuditLogsViewModel
import com.trustora.app.ui.screens.admin.AdminCategoriesViewModel
import com.trustora.app.ui.screens.admin.AdminDashboardViewModel
import com.trustora.app.ui.screens.admin.AdminEarlyAccessViewModel
import com.trustora.app.ui.screens.admin.AdminLegalClausesViewModel
import com.trustora.app.ui.screens.admin.AdminNewsletterViewModel
import com.trustora.app.ui.screens.admin.AdminProjectsViewModel
import com.trustora.app.ui.screens.admin.AdminRolesViewModel
import com.trustora.app.ui.screens.admin.AdminServicesViewModel
import com.trustora.app.ui.screens.admin.AdminUsersViewModel
import com.trustora.app.features.dashboard.presentation.DashboardViewModel
import com.trustora.app.features.briefing.presentation.CreateProjectViewModel
import com.trustora.app.ui.screens.services.ServicesViewModel
import com.trustora.app.designsystem.theme.TrustoraAndroidAppTheme

class MainActivity : ComponentActivity() {
    private val appContainer: AppContainer by lazy {
        (application as TrustoraApplication).appContainer
    }
    private val mainViewModel: MainViewModel by viewModels {
        MainViewModel.Factory(appContainer)
    }
    private val servicesViewModel: ServicesViewModel by viewModels {
        ServicesViewModel.Factory(appContainer)
    }
    private val dashboardViewModel: DashboardViewModel by viewModels {
        DashboardViewModel.Factory(appContainer)
    }
    private val adminDashboardViewModel: AdminDashboardViewModel by viewModels {
        AdminDashboardViewModel.Factory(appContainer)
    }
    private val adminEarlyAccessViewModel: AdminEarlyAccessViewModel by viewModels {
        AdminEarlyAccessViewModel.Factory(appContainer)
    }
    private val adminCategoriesViewModel: AdminCategoriesViewModel by viewModels {
        AdminCategoriesViewModel.Factory(appContainer)
    }
    private val adminServicesViewModel: AdminServicesViewModel by viewModels {
        AdminServicesViewModel.Factory(appContainer)
    }
    private val adminUsersViewModel: AdminUsersViewModel by viewModels {
        AdminUsersViewModel.Factory(appContainer)
    }
    private val adminCallsViewModel: AdminCallsViewModel by viewModels {
        AdminCallsViewModel.Factory(appContainer)
    }
    private val adminActivitiesViewModel: AdminActivitiesViewModel by viewModels {
        AdminActivitiesViewModel.Factory(appContainer)
    }
    private val adminAuditLogsViewModel: AdminAuditLogsViewModel by viewModels {
        AdminAuditLogsViewModel.Factory(appContainer)
    }
    private val adminProjectsViewModel: AdminProjectsViewModel by viewModels {
        AdminProjectsViewModel.Factory(appContainer)
    }
    private val adminRolesViewModel: AdminRolesViewModel by viewModels {
        AdminRolesViewModel.Factory(appContainer)
    }
    private val adminLegalClausesViewModel: AdminLegalClausesViewModel by viewModels {
        AdminLegalClausesViewModel.Factory(appContainer)
    }
    private val adminNewsletterViewModel: AdminNewsletterViewModel by viewModels {
        AdminNewsletterViewModel.Factory(appContainer)
    }
    private val createProjectViewModel: CreateProjectViewModel by viewModels {
        CreateProjectViewModel.Factory(appContainer)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val settings by mainViewModel.settings.collectAsState()

            TrustoraAndroidAppTheme(themeMode = settings.themeMode) {
                TrustoraAppRoot(
                    mainViewModel = mainViewModel,
                    servicesViewModel = servicesViewModel,
                    dashboardViewModel = dashboardViewModel,
                    adminDashboardViewModel = adminDashboardViewModel,
                    adminEarlyAccessViewModel = adminEarlyAccessViewModel,
                    adminCategoriesViewModel = adminCategoriesViewModel,
                    adminServicesViewModel = adminServicesViewModel,
                    adminUsersViewModel = adminUsersViewModel,
                    adminCallsViewModel = adminCallsViewModel,
                    adminActivitiesViewModel = adminActivitiesViewModel,
                    adminAuditLogsViewModel = adminAuditLogsViewModel,
                    adminProjectsViewModel = adminProjectsViewModel,
                    adminRolesViewModel = adminRolesViewModel,
                    adminLegalClausesViewModel = adminLegalClausesViewModel,
                    adminNewsletterViewModel = adminNewsletterViewModel,
                    createProjectViewModel = createProjectViewModel,
                )
            }
        }
    }
}

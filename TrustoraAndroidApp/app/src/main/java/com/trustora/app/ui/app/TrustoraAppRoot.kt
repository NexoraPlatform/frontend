@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.trustora.app.ui.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.ViewList
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AppLanguage
import com.trustora.app.core.models.AppPreferences
import com.trustora.app.core.models.AppThemeMode
import com.trustora.app.core.datastore.SessionState
import com.trustora.app.designsystem.components.AuthAvatar
import com.trustora.app.designsystem.components.BrandLockup
import com.trustora.app.designsystem.components.MenuLinkRow
import com.trustora.app.ui.screens.about.AboutScreen
import com.trustora.app.ui.screens.admin.AdminCallsScreen
import com.trustora.app.ui.screens.admin.AdminCallsViewModel
import com.trustora.app.ui.screens.admin.AdminActivitiesScreen
import com.trustora.app.ui.screens.admin.AdminActivitiesViewModel
import com.trustora.app.ui.screens.admin.AdminAnalyticsScreen
import com.trustora.app.ui.screens.admin.AdminAuditLogsScreen
import com.trustora.app.ui.screens.admin.AdminAuditLogsViewModel
import com.trustora.app.ui.screens.admin.AdminCategoriesScreen
import com.trustora.app.ui.screens.admin.AdminCategoriesViewModel
import com.trustora.app.ui.screens.admin.AdminDashboardScreen
import com.trustora.app.ui.screens.admin.AdminDashboardViewModel
import com.trustora.app.ui.screens.admin.AdminDisputesScreen
import com.trustora.app.ui.screens.admin.AdminEarlyAccessScreen
import com.trustora.app.ui.screens.admin.AdminEarlyAccessViewModel
import com.trustora.app.ui.screens.admin.AdminLegalClausesScreen
import com.trustora.app.ui.screens.admin.AdminLegalClausesViewModel
import com.trustora.app.ui.screens.admin.AdminNewsletterScreen
import com.trustora.app.ui.screens.admin.AdminNewsletterViewModel
import com.trustora.app.ui.screens.admin.AdminProjectsScreen
import com.trustora.app.ui.screens.admin.AdminProjectsViewModel
import com.trustora.app.ui.screens.admin.AdminRolesScreen
import com.trustora.app.ui.screens.admin.AdminRolesViewModel
import com.trustora.app.ui.screens.admin.AdminServicesScreen
import com.trustora.app.ui.screens.admin.AdminServicesViewModel
import com.trustora.app.ui.screens.admin.AdminUsersScreen
import com.trustora.app.ui.screens.admin.AdminUsersViewModel
import com.trustora.app.features.auth.presentation.AuthScreen
import com.trustora.app.features.dashboard.presentation.DashboardScreen
import com.trustora.app.features.dashboard.presentation.DashboardViewModel
import com.trustora.app.features.briefing.presentation.CreateProjectScreen
import com.trustora.app.features.briefing.presentation.CreateProjectViewModel
import com.trustora.app.ui.screens.home.HomeScreen
import com.trustora.app.ui.screens.services.ServicesScreen
import com.trustora.app.ui.screens.services.ServicesViewModel
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import kotlinx.coroutines.launch
import java.util.Locale

private const val ROUTE_ROOT = "root"
private const val ROUTE_DASHBOARD = "dashboard"
private const val ROUTE_ADMIN_DASHBOARD = "admin-dashboard"
private const val ROUTE_ADMIN_EARLY_ACCESS = "admin-early-access"
private const val ROUTE_ADMIN_CATEGORIES = "admin-categories"
private const val ROUTE_ADMIN_CATEGORIES_CREATE = "admin-categories-create"
private const val ROUTE_ADMIN_SERVICES = "admin-services"
private const val ROUTE_ADMIN_USERS = "admin-users"
private const val ROUTE_ADMIN_USERS_CREATE = "admin-users-create"
private const val ROUTE_ADMIN_CALLS = "admin-calls"
private const val ROUTE_ADMIN_PROJECTS = "admin-projects"
private const val ROUTE_ADMIN_DISPUTES = "admin-disputes"
private const val ROUTE_ADMIN_LEGAL_CLAUSES = "admin-legal-clauses"
private const val ROUTE_ADMIN_NEWSLETTER = "admin-newsletter"
private const val ROUTE_ADMIN_ACTIVITIES = "admin-activities"
private const val ROUTE_ADMIN_AUDIT_LOGS = "admin-audit-logs"
private const val ROUTE_ADMIN_ANALYTICS = "admin-analytics"
private const val ROUTE_ADMIN_ROLES = "admin-roles"
private const val ROUTE_CREATE_PROJECT = "create-project"

@Composable
fun TrustoraAppRoot(
    mainViewModel: MainViewModel,
    servicesViewModel: ServicesViewModel,
    dashboardViewModel: DashboardViewModel,
    adminDashboardViewModel: AdminDashboardViewModel,
    adminEarlyAccessViewModel: AdminEarlyAccessViewModel,
    adminCategoriesViewModel: AdminCategoriesViewModel,
    adminServicesViewModel: AdminServicesViewModel,
    adminUsersViewModel: AdminUsersViewModel,
    adminCallsViewModel: AdminCallsViewModel,
    adminActivitiesViewModel: AdminActivitiesViewModel,
    adminAuditLogsViewModel: AdminAuditLogsViewModel,
    adminProjectsViewModel: AdminProjectsViewModel,
    adminRolesViewModel: AdminRolesViewModel,
    adminLegalClausesViewModel: AdminLegalClausesViewModel,
    adminNewsletterViewModel: AdminNewsletterViewModel,
    createProjectViewModel: CreateProjectViewModel,
    navController: NavHostController = rememberNavController(),
) {
    val settings by mainViewModel.settings.collectAsState()
    val sessionState by mainViewModel.session.collectAsState()

    val languageCode = settings.resolvedLanguageTag(Locale.getDefault().toLanguageTag())

    LaunchedEffect(sessionState.user?.id, sessionState.accessToken) {
        mainViewModel.syncRealtimeSession(
            userId = sessionState.user?.id,
            accessToken = sessionState.accessToken,
        )
    }

    NavHost(navController = navController, startDestination = ROUTE_ROOT) {
        composable(ROUTE_ROOT) {
            RootScaffold(
                mainViewModel = mainViewModel,
                sessionState = sessionState,
                languageCode = languageCode,
                servicesViewModel = servicesViewModel,
                onOpenDashboard = {
                    navController.navigate(ROUTE_DASHBOARD)
                },
                onOpenAdmin = {
                    navController.navigate(ROUTE_ADMIN_DASHBOARD)
                },
            )
        }

        composable(ROUTE_DASHBOARD) {
            val user = sessionState.user
            val token = sessionState.accessToken
            if (user == null || token.isNullOrBlank()) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                DashboardScreen(
                    user = user,
                    token = token,
                    languageCode = languageCode,
                    appLanguage = settings.language,
                    currency = settings.currency,
                    onSetLanguage = mainViewModel::setLanguage,
                    onSetCurrency = mainViewModel::setCurrency,
                    viewModel = dashboardViewModel,
                    onBack = { navController.popBackStack() },
                    onOpenCreateProject = {
                        navController.navigate(ROUTE_CREATE_PROJECT)
                    },
                    onSignOut = {
                        mainViewModel.signOut()
                        navController.popBackStack(ROUTE_ROOT, inclusive = false)
                    },
                )
            }
        }

        composable(ROUTE_ADMIN_DASHBOARD) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminDashboardScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminDashboardViewModel,
                    onBack = { navController.popBackStack() },
                    onOpenFeature = { key ->
                        when (key) {
                            "add_user" -> {
                                navController.navigate(ROUTE_ADMIN_USERS_CREATE)
                                true
                            }

                            "add_category" -> {
                                navController.navigate(ROUTE_ADMIN_CATEGORIES_CREATE)
                                true
                            }

                            "view_reports" -> {
                                navController.navigate(ROUTE_ADMIN_ANALYTICS)
                                true
                            }

                            "admin.dashboard.sections.users.title" -> {
                                navController.navigate(ROUTE_ADMIN_USERS)
                                true
                            }

                            "admin.dashboard.sections.early_access.title" -> {
                                navController.navigate(ROUTE_ADMIN_EARLY_ACCESS)
                                true
                            }

                            "admin.dashboard.sections.services.title" -> {
                                navController.navigate(ROUTE_ADMIN_SERVICES)
                                true
                            }

                            "admin.dashboard.sections.categories.title" -> {
                                navController.navigate(ROUTE_ADMIN_CATEGORIES)
                                true
                            }

                            "admin.dashboard.sections.calls.title" -> {
                                navController.navigate(ROUTE_ADMIN_CALLS)
                                true
                            }

                            "admin.dashboard.sections.projects.title" -> {
                                navController.navigate(ROUTE_ADMIN_PROJECTS)
                                true
                            }

                            "admin.dashboard.sections.disputes.title" -> {
                                navController.navigate(ROUTE_ADMIN_DISPUTES)
                                true
                            }

                            "admin.dashboard.sections.legal_clauses.title" -> {
                                navController.navigate(ROUTE_ADMIN_LEGAL_CLAUSES)
                                true
                            }

                            "admin.dashboard.sections.newsletter.title" -> {
                                navController.navigate(ROUTE_ADMIN_NEWSLETTER)
                                true
                            }

                            "admin.dashboard.sections.activities.title" -> {
                                navController.navigate(ROUTE_ADMIN_ACTIVITIES)
                                true
                            }

                            "admin.dashboard.sections.audit_logs.title" -> {
                                navController.navigate(ROUTE_ADMIN_AUDIT_LOGS)
                                true
                            }

                            "admin.dashboard.sections.roles.title" -> {
                                navController.navigate(ROUTE_ADMIN_ROLES)
                                true
                            }

                            "admin.dashboard.sections.analytics.title" -> {
                                navController.navigate(ROUTE_ADMIN_ANALYTICS)
                                true
                            }

                            else -> false
                        }
                    },
                )
            }
        }

        composable(ROUTE_ADMIN_EARLY_ACCESS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminEarlyAccessScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminEarlyAccessViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_CATEGORIES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminCategoriesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminCategoriesViewModel,
                    onBack = { navController.popBackStack() },
                    openCreateOnAppear = false,
                )
            }
        }

        composable(ROUTE_ADMIN_CATEGORIES_CREATE) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminCategoriesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminCategoriesViewModel,
                    onBack = { navController.popBackStack() },
                    openCreateOnAppear = true,
                )
            }
        }

        composable(ROUTE_ADMIN_SERVICES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminServicesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminServicesViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_USERS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminUsersScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminUsersViewModel,
                    onBack = { navController.popBackStack() },
                    openCreateOnAppear = false,
                )
            }
        }

        composable(ROUTE_ADMIN_USERS_CREATE) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminUsersScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminUsersViewModel,
                    onBack = { navController.popBackStack() },
                    openCreateOnAppear = true,
                )
            }
        }

        composable(ROUTE_ADMIN_CALLS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminCallsScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminCallsViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_PROJECTS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminProjectsScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminProjectsViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_DISPUTES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                AdminDisputesScreen(
                    user = currentUser,
                    languageCode = languageCode,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_LEGAL_CLAUSES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null &&
                !token.isNullOrBlank() &&
                (user.isSuperuser || user.hasRole("admin") || user.hasRole("legal"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminLegalClausesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminLegalClausesViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_NEWSLETTER) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminNewsletterScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminNewsletterViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_ACTIVITIES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminActivitiesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminActivitiesViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_AUDIT_LOGS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminAuditLogsScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminAuditLogsViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_ROLES) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                val currentToken = token ?: return@composable
                AdminRolesScreen(
                    user = currentUser,
                    token = currentToken,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = adminRolesViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_ADMIN_ANALYTICS) {
            val user = sessionState.user
            val token = sessionState.accessToken
            val canOpen = user != null && !token.isNullOrBlank() && (user.isSuperuser || user.hasRole("admin"))
            if (!canOpen) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                val currentUser = user ?: return@composable
                AdminAnalyticsScreen(
                    user = currentUser,
                    languageCode = languageCode,
                    onBack = { navController.popBackStack() },
                )
            }
        }

        composable(ROUTE_CREATE_PROJECT) {
            val user = sessionState.user
            val token = sessionState.accessToken
            if (user == null || token.isNullOrBlank()) {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            } else {
                CreateProjectScreen(
                    user = user,
                    token = token,
                    languageCode = languageCode,
                    currency = settings.currency,
                    viewModel = createProjectViewModel,
                    onBack = { navController.popBackStack() },
                    onCreated = { _ ->
                        dashboardViewModel.reloadAll(
                            user = user,
                            token = token,
                            language = languageCode,
                            currency = settings.currency,
                            force = true,
                        )
                        navController.popBackStack()
                    },
                    onRefreshProfile = mainViewModel::refreshProfile,
                )
            }
        }
    }
}

@Composable
private fun RootScaffold(
    mainViewModel: MainViewModel,
    sessionState: SessionState,
    languageCode: String,
    servicesViewModel: ServicesViewModel,
    onOpenDashboard: () -> Unit,
    onOpenAdmin: () -> Unit,
) {
    val settings by mainViewModel.settings.collectAsState()

    var isHeaderMenuOpen by remember { mutableStateOf(false) }
    var isUserMenuOpen by remember { mutableStateOf(false) }
    val headerSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val userSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            RootHeader(onOpenMenu = { isHeaderMenuOpen = true })

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
            ) {
                when (mainViewModel.currentPage) {
                    RootPage.HOME -> HomeScreen(
                        languageCode = languageCode,
                        currency = settings.currency,
                        onOpenAuthSignUp = { mainViewModel.openAuth(AuthMode.SIGN_UP) },
                        onOpenHome = { mainViewModel.openHome(HomeScrollTarget.TOP) },
                        onOpenServices = { mainViewModel.openPage(RootPage.SERVICES) },
                        onOpenAbout = { mainViewModel.openPage(RootPage.ABOUT) },
                        onOpenHelp = { mainViewModel.openHome(HomeScrollTarget.FOOTER) },
                        onOpenContact = { mainViewModel.openHome(HomeScrollTarget.FOOTER) },
                        scrollTarget = mainViewModel.homeScrollTarget,
                        onScrollTargetConsumed = mainViewModel::consumeHomeScrollTarget,
                    )

                    RootPage.SERVICES -> ServicesScreen(
                        languageCode = languageCode,
                        currency = settings.currency,
                        viewModel = servicesViewModel,
                    )

                    RootPage.ABOUT -> AboutScreen(
                        sessionState = sessionState,
                        onOpenServices = { mainViewModel.openPage(RootPage.SERVICES) },
                        onOpenDashboard = onOpenDashboard,
                        onOpenAuth = { mainViewModel.openAuth(AuthMode.SIGN_UP) },
                    )
                }
            }

            RootBottomNavigation(
                sessionState = sessionState,
                currentPage = mainViewModel.currentPage,
                onSelectPage = { page ->
                    if (page == RootPage.HOME) {
                        mainViewModel.openHome(HomeScrollTarget.TOP)
                    } else {
                        mainViewModel.openPage(page)
                    }
                },
                onOpenUserMenu = { isUserMenuOpen = true },
            )
        }

        val authMode = mainViewModel.pendingAuthMode
        if (authMode != null) {
            AuthScreen(
                mode = authMode,
                languageCode = languageCode,
                isLoading = mainViewModel.isAuthLoading,
                errorMessage = mainViewModel.authErrorMessage,
                onDismiss = { mainViewModel.closeAuth() },
                onSignIn = { email, password ->
                    mainViewModel.signIn(email, password) {
                        onOpenDashboard()
                    }
                },
                onSignUp = { firstName, lastName, email, phone, password, role, company, companyName, taxId, tradeRegistryNumber, billingAddress, billingCity, billingState, billingPostalCode ->
                    mainViewModel.signUp(
                        firstName = firstName,
                        lastName = lastName,
                        email = email,
                        phone = phone,
                        password = password,
                        role = role,
                        company = company,
                        companyName = companyName,
                        taxId = taxId,
                        tradeRegistryNumber = tradeRegistryNumber,
                        billingAddress = billingAddress,
                        billingCity = billingCity,
                        billingState = billingState,
                        billingPostalCode = billingPostalCode,
                    ) {
                        onOpenDashboard()
                    }
                },
                onSwitchMode = mainViewModel::openAuth,
            )
        }
    }

    if (isHeaderMenuOpen) {
        ModalBottomSheet(
            onDismissRequest = { isHeaderMenuOpen = false },
            sheetState = headerSheetState,
        ) {
            HeaderMainMenuSheet(
                languageCode = languageCode,
                settings = settings,
                sessionState = sessionState,
                onSetLanguage = mainViewModel::setLanguage,
                onSetCurrency = mainViewModel::setCurrency,
                onSetTheme = mainViewModel::setTheme,
                onOpenHome = {
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion {
                        isHeaderMenuOpen = false
                        mainViewModel.openHome(HomeScrollTarget.TOP)
                    }
                },
                onOpenServices = {
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion {
                        isHeaderMenuOpen = false
                        mainViewModel.openPage(RootPage.SERVICES)
                    }
                },
                onOpenAbout = {
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion {
                        isHeaderMenuOpen = false
                        mainViewModel.openPage(RootPage.ABOUT)
                    }
                },
                onOpenHelp = {
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion {
                        isHeaderMenuOpen = false
                        mainViewModel.openHome(HomeScrollTarget.FOOTER)
                    }
                },
                onOpenContact = {
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion {
                        isHeaderMenuOpen = false
                        mainViewModel.openHome(HomeScrollTarget.FOOTER)
                    }
                },
                onOpenSignIn = {
                    mainViewModel.openAuth(AuthMode.SIGN_IN)
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion { isHeaderMenuOpen = false }
                },
                onOpenSignUp = {
                    mainViewModel.openAuth(AuthMode.SIGN_UP)
                    scope.launch { headerSheetState.hide() }.invokeOnCompletion { isHeaderMenuOpen = false }
                },
            )
        }
    }

    if (isUserMenuOpen) {
        ModalBottomSheet(
            onDismissRequest = { isUserMenuOpen = false },
            sheetState = userSheetState,
        ) {
            UserMenuSheet(
                sessionState = sessionState,
                languageCode = languageCode,
                onOpenDashboard = {
                    scope.launch { userSheetState.hide() }.invokeOnCompletion {
                        isUserMenuOpen = false
                        onOpenDashboard()
                    }
                },
                onOpenAdmin = {
                    scope.launch { userSheetState.hide() }.invokeOnCompletion {
                        isUserMenuOpen = false
                        onOpenAdmin()
                    }
                },
                onOpenSignIn = {
                    mainViewModel.openAuth(AuthMode.SIGN_IN)
                    scope.launch { userSheetState.hide() }.invokeOnCompletion { isUserMenuOpen = false }
                },
                onOpenSignUp = {
                    mainViewModel.openAuth(AuthMode.SIGN_UP)
                    scope.launch { userSheetState.hide() }.invokeOnCompletion { isUserMenuOpen = false }
                },
                onSignOut = {
                    mainViewModel.signOut()
                    scope.launch { userSheetState.hide() }.invokeOnCompletion { isUserMenuOpen = false }
                },
            )
        }
    }
}

@Composable
private fun RootHeader(onOpenMenu: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.95f))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandLockup(compact = true, tagline = "Trustworthy digital collaboration", modifier = Modifier.weight(1f))
        Button(
            onClick = onOpenMenu,
            shape = RoundedCornerShape(11.dp),
            colors = ButtonDefaults.buttonColors(containerColor = TrustoraMutedSurface, contentColor = TrustoraPrimary),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 8.dp),
        ) {
            Icon(Icons.Default.Menu, contentDescription = "Menu")
        }
    }
}

@Composable
private fun RootBottomNavigation(
    sessionState: SessionState,
    currentPage: RootPage,
    onSelectPage: (RootPage) -> Unit,
    onOpenUserMenu: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 8.dp)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(100.dp))
            .padding(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        BottomItem(
            active = currentPage == RootPage.HOME,
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            label = "Home",
            onClick = { onSelectPage(RootPage.HOME) },
            modifier = Modifier.weight(1f),
        )
        BottomItem(
            active = currentPage == RootPage.SERVICES,
            icon = { Icon(Icons.AutoMirrored.Filled.ViewList, contentDescription = null) },
            label = "Services",
            onClick = { onSelectPage(RootPage.SERVICES) },
            modifier = Modifier.weight(1f),
        )
        BottomItem(
            active = currentPage == RootPage.ABOUT,
            icon = { Icon(Icons.Default.Info, contentDescription = null) },
            label = "About",
            onClick = { onSelectPage(RootPage.ABOUT) },
            modifier = Modifier.weight(1f),
        )

        Box(
            modifier = Modifier
                .size(48.dp)
                .background(TrustoraMutedSurface, CircleShape)
                .clickable(onClick = onOpenUserMenu),
            contentAlignment = Alignment.Center,
        ) {
            val user = sessionState.user
            if (user != null) {
                AuthAvatar(user = user)
            } else {
                Icon(Icons.Default.PersonOutline, contentDescription = "User menu", tint = TrustoraPrimary)
            }
        }
    }
}

@Composable
private fun BottomItem(
    active: Boolean,
    icon: @Composable () -> Unit,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val background = if (active) TrustoraAccent else Color.Transparent
    val foreground = if (active) TrustoraAccentButtonText else TrustoraSecondaryText

    Column(
        modifier = modifier
            .background(background, RoundedCornerShape(100.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        androidx.compose.runtime.CompositionLocalProvider(
            androidx.compose.material3.LocalContentColor provides foreground,
        ) {
            icon()
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = foreground,
        )
    }
}

@Composable
private fun UserMenuSheet(
    sessionState: SessionState,
    languageCode: String,
    onOpenDashboard: () -> Unit,
    onOpenAdmin: () -> Unit,
    onOpenSignIn: () -> Unit,
    onOpenSignUp: () -> Unit,
    onSignOut: () -> Unit,
) {
    val isRomanian = languageCode.startsWith("ro", ignoreCase = true)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        BrandLockup(compact = false, tagline = "Trustworthy digital collaboration")

        if (sessionState.user == null) {
            Text(
                text = if (isRomanian) {
                    "Autentifică-te pentru a accesa dashboard-ul Trustora."
                } else {
                    "Sign in to access your Trustora dashboard."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraSecondaryText,
            )

            OutlinedButton(onClick = onOpenSignIn, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (isRomanian) "Conectează-te" else "Sign in")
            }

            Button(
                onClick = onOpenSignUp,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = TrustoraAccent, contentColor = TrustoraAccentButtonText),
            ) {
                Icon(Icons.Default.Person, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (isRomanian) "Creează cont" else "Create account")
            }
        } else {
            val user = sessionState.user

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFECFDF5), RoundedCornerShape(12.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    AuthAvatar(user = user)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user.displayName,
                            style = MaterialTheme.typography.titleMedium,
                            color = TrustoraPrimary,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                        )
                        Text(
                            text = user.email,
                            style = MaterialTheme.typography.bodySmall,
                            color = TrustoraSecondaryText,
                            maxLines = 1,
                        )
                        val role = user.role?.trim().orEmpty()
                        if (role.isNotEmpty()) {
                            Text(
                                text = role.uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF0C8F5D),
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }
            }

            Button(onClick = onOpenDashboard, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Dashboard, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (isRomanian) "Deschide dashboard" else "Open dashboard")
            }

            if (user.hasRole("provider")) {
                MenuLinkRow(
                    icon = { Icon(Icons.Filled.PersonOutline, contentDescription = null, tint = TrustoraPrimary) },
                    title = if (isRomanian) "Profil" else "Profile",
                    modifier = Modifier.clickable(onClick = onOpenDashboard),
                )

                MenuLinkRow(
                    icon = { Icon(Icons.Filled.Person, contentDescription = null, tint = TrustoraPrimary) },
                    title = if (isRomanian) "Editează profilul" else "Edit profile",
                    modifier = Modifier.clickable(onClick = onOpenDashboard),
                )
            } else {
                MenuLinkRow(
                    icon = { Icon(Icons.Filled.PersonOutline, contentDescription = null, tint = TrustoraPrimary) },
                    title = if (isRomanian) "Profil" else "Profile",
                )
            }

            if (user.isSuperuser || user.hasRole("admin")) {
                MenuLinkRow(
                    icon = { Icon(Icons.Filled.Lock, contentDescription = null, tint = TrustoraPrimary) },
                    title = if (isRomanian) "Panou Admin" else "Admin panel",
                    modifier = Modifier.clickable(onClick = onOpenAdmin),
                )
            }

            OutlinedButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (isRomanian) "Deconectare" else "Sign out")
            }
        }

        Spacer(modifier = Modifier.height(14.dp))
    }
}

@Composable
private fun HeaderMainMenuSheet(
    languageCode: String,
    settings: AppPreferences,
    sessionState: SessionState,
    onSetLanguage: (AppLanguage) -> Unit,
    onSetCurrency: (AppCurrency) -> Unit,
    onSetTheme: (AppThemeMode) -> Unit,
    onOpenHome: () -> Unit,
    onOpenServices: () -> Unit,
    onOpenAbout: () -> Unit,
    onOpenHelp: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenSignIn: () -> Unit,
    onOpenSignUp: () -> Unit,
) {
    val ro = languageCode.startsWith("ro", ignoreCase = true)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        BrandLockup(
            compact = false,
            tagline = if (ro) "Colaborare digitală de încredere" else "Trustworthy digital collaboration",
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                .padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(Icons.Default.Menu, contentDescription = null, tint = TrustoraSecondaryText)
            Text(
                text = if (ro) "Caută..." else "Search...",
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraTertiaryText,
            )
        }

        HeaderSettingsRow(
            languageCode = languageCode,
            settings = settings,
            onSetLanguage = onSetLanguage,
            onSetCurrency = onSetCurrency,
            onSetTheme = onSetTheme,
        )

        MenuLinkRow(
            icon = { Icon(Icons.Filled.Home, contentDescription = null, tint = TrustoraPrimary) },
            title = if (ro) "Acasă" else "Home",
            modifier = Modifier.clickable(onClick = onOpenHome),
        )
        MenuLinkRow(
            icon = { Icon(Icons.AutoMirrored.Filled.ViewList, contentDescription = null, tint = TrustoraPrimary) },
            title = if (ro) "Servicii" else "Services",
            modifier = Modifier.clickable(onClick = onOpenServices),
        )
        MenuLinkRow(
            icon = { Icon(Icons.Filled.Info, contentDescription = null, tint = TrustoraPrimary) },
            title = if (ro) "Despre" else "About",
            modifier = Modifier.clickable(onClick = onOpenAbout),
        )
        MenuLinkRow(
            icon = { Icon(Icons.AutoMirrored.Filled.Help, contentDescription = null, tint = TrustoraPrimary) },
            title = if (ro) "Ajutor" else "Help",
            modifier = Modifier.clickable(onClick = onOpenHelp),
        )
        MenuLinkRow(
            icon = { Icon(Icons.Filled.Phone, contentDescription = null, tint = TrustoraPrimary) },
            title = if (ro) "Contact" else "Contact",
            modifier = Modifier.clickable(onClick = onOpenContact),
        )

        if (sessionState.user == null) {
            OutlinedButton(onClick = onOpenSignIn, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (ro) "Conectează-te" else "Sign in")
            }

            Button(
                onClick = onOpenSignUp,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = TrustoraAccent, contentColor = TrustoraAccentButtonText),
            ) {
                Icon(Icons.Default.Person, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text(if (ro) "Creează cont" else "Create account")
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = if (ro) "Contact" else "Contact",
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraPrimary,
            )
            Text(
                text = "contact@trustora.ro",
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraSecondaryText,
            )
            Text(
                text = "+40 123 456 789",
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraSecondaryText,
            )
        }

        Spacer(modifier = Modifier.height(14.dp))
    }
}

@Composable
private fun HeaderSettingsRow(
    languageCode: String,
    settings: AppPreferences,
    onSetLanguage: (AppLanguage) -> Unit,
    onSetCurrency: (AppCurrency) -> Unit,
    onSetTheme: (AppThemeMode) -> Unit,
) {
    var languageExpanded by remember { mutableStateOf(false) }
    var currencyExpanded by remember { mutableStateOf(false) }
    var themeExpanded by remember { mutableStateOf(false) }
    val ro = languageCode.startsWith("ro", ignoreCase = true)

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(modifier = Modifier.weight(1f)) {
            HeaderPillButton(
                label = if (settings.language == AppLanguage.SYSTEM) {
                    if (ro) "Limbă: Auto" else "Lang: Auto"
                } else {
                    if (ro) "Limbă: ${settings.language.raw.uppercase()}" else "Lang: ${settings.language.raw.uppercase()}"
                },
                onClick = { languageExpanded = true },
            )
            DropdownMenu(
                expanded = languageExpanded,
                onDismissRequest = { languageExpanded = false },
            ) {
                AppLanguage.entries.forEach { language ->
                    DropdownMenuItem(
                        text = {
                            val label = when (language) {
                                AppLanguage.SYSTEM -> if (ro) "Sistem" else "System"
                                AppLanguage.EN -> "English"
                                AppLanguage.RO -> "Română"
                            }
                            Text(label)
                        },
                        onClick = {
                            languageExpanded = false
                            onSetLanguage(language)
                        },
                    )
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            HeaderPillButton(
                label = "Currency: ${settings.currency.raw}",
                onClick = { currencyExpanded = true },
            )
            DropdownMenu(
                expanded = currencyExpanded,
                onDismissRequest = { currencyExpanded = false },
            ) {
                AppCurrency.entries.forEach { currency ->
                    DropdownMenuItem(
                        text = { Text(currency.raw) },
                        onClick = {
                            currencyExpanded = false
                            onSetCurrency(currency)
                        },
                    )
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            HeaderPillButton(
                label = when (settings.themeMode) {
                    AppThemeMode.SYSTEM -> if (ro) "Temă: Auto" else "Theme: Auto"
                    AppThemeMode.LIGHT -> if (ro) "Temă: Light" else "Theme: Light"
                    AppThemeMode.DARK -> if (ro) "Temă: Dark" else "Theme: Dark"
                },
                onClick = { themeExpanded = true },
            )
            DropdownMenu(
                expanded = themeExpanded,
                onDismissRequest = { themeExpanded = false },
            ) {
                AppThemeMode.entries.forEach { theme ->
                    DropdownMenuItem(
                        text = {
                            val label = when (theme) {
                                AppThemeMode.SYSTEM -> if (ro) "Sistem" else "System"
                                AppThemeMode.LIGHT -> if (ro) "Light" else "Light"
                                AppThemeMode.DARK -> if (ro) "Dark" else "Dark"
                            }
                            Text(label)
                        },
                        onClick = {
                            themeExpanded = false
                            onSetTheme(theme)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun HeaderPillButton(
    label: String,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(11.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = TrustoraMutedSurface,
            contentColor = TrustoraPrimary,
        ),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 8.dp),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
    ) {
        Text(
            text = label,
            maxLines = 1,
            style = MaterialTheme.typography.labelSmall,
        )
    }
}

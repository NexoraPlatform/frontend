package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.trustora.app.core.models.AdminDashboardStats
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardRecentActivity
import com.trustora.app.core.repository.AppContainer
import kotlinx.coroutines.launch

private const val ACTION_ADD_USER = "add_user"
private const val ACTION_ADD_CATEGORY = "add_category"
private const val ACTION_ADD_TEST = "add_test"
private const val ACTION_VIEW_REPORTS = "view_reports"

data class AdminDashboardStatCard(
    val titleKey: String,
    val value: Double,
    val current: Double,
    val change: Double,
    val isCurrency: Boolean,
    val iconKey: String,
    val colorHex: Long,
)

data class AdminDashboardQuickAction(
    val titleKey: String,
    val descriptionKey: String,
    val iconKey: String,
    val actionKey: String,
)

data class AdminDashboardSection(
    val titleKey: String,
    val descriptionKey: String,
    val statsKey: String? = null,
    val statsCount: Int? = null,
    val iconKey: String,
    val pendingCount: Int = 0,
    val access: AdminSectionAccess,
)

sealed interface AdminSectionAccess {
    data object Admin : AdminSectionAccess
    data object Superuser : AdminSectionAccess
    data class Roles(val roles: List<String>, val permissions: List<String> = emptyList()) : AdminSectionAccess
}

class AdminDashboardViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var stats by mutableStateOf<AdminDashboardStats?>(null)
        private set
    var recentActivities by mutableStateOf<List<DashboardRecentActivity>>(emptyList())
        private set
    var isLoading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    private var lastContextKey: String = ""

    fun load(token: String, language: String, currency: AppCurrency, force: Boolean = false) {
        val contextKey = listOf(token, language, currency.raw).joinToString("|")
        if (!force && lastContextKey == contextKey && (stats != null || isLoading)) {
            return
        }
        lastContextKey = contextKey

        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            runCatching {
                val fetchedStats = appContainer.dashboardRepository.getAdminDashboardStats(
                    language = language,
                    currency = currency,
                    token = token,
                )
                val fetchedActivities = appContainer.dashboardRepository.getRecentActivities(
                    language = language,
                    token = token,
                )
                stats = fetchedStats
                recentActivities = fetchedActivities.take(5)
            }.onFailure { error ->
                errorMessage = error.message ?: "Failed to load admin dashboard."
            }
            isLoading = false
        }
    }

    fun statsCards(): List<AdminDashboardStatCard> {
        val value = stats ?: return emptyList()
        return listOf(
            AdminDashboardStatCard(
                titleKey = "admin.dashboard.stats.users",
                value = value.totalUsers.toDouble(),
                current = value.currentMonthUsers.toDouble(),
                change = value.currentMonthVsLastMonthUsers,
                isCurrency = false,
                iconKey = "users",
                colorHex = 0x2563EB,
            ),
            AdminDashboardStatCard(
                titleKey = "admin.dashboard.stats.services",
                value = value.activeServices.toDouble(),
                current = value.currentMonthServices.toDouble(),
                change = value.currentMonthVsLastMonthServices,
                isCurrency = false,
                iconKey = "services",
                colorHex = 0x16A34A,
            ),
            AdminDashboardStatCard(
                titleKey = "admin.dashboard.stats.revenue",
                value = value.totalRevenue,
                current = value.currentMonthRevenue,
                change = value.currentMonthVsLastMonthRevenue,
                isCurrency = true,
                iconKey = "revenue",
                colorHex = 0xCA8A04,
            ),
            AdminDashboardStatCard(
                titleKey = "admin.dashboard.stats.projects",
                value = value.totalProjects.toDouble(),
                current = value.currentMonthProjects.toDouble(),
                change = value.currentMonthVsLastMonthProjects,
                isCurrency = false,
                iconKey = "projects",
                colorHex = 0x9333EA,
            ),
        )
    }

    fun quickActions(): List<AdminDashboardQuickAction> {
        return listOf(
            AdminDashboardQuickAction(
                titleKey = "admin.dashboard.quick_actions.add_user.title",
                descriptionKey = "admin.dashboard.quick_actions.add_user.description",
                iconKey = "add_user",
                actionKey = ACTION_ADD_USER,
            ),
            AdminDashboardQuickAction(
                titleKey = "admin.dashboard.quick_actions.add_category.title",
                descriptionKey = "admin.dashboard.quick_actions.add_category.description",
                iconKey = "add_category",
                actionKey = ACTION_ADD_CATEGORY,
            ),
            AdminDashboardQuickAction(
                titleKey = "admin.dashboard.quick_actions.add_test.title",
                descriptionKey = "admin.dashboard.quick_actions.add_test.description",
                iconKey = "add_test",
                actionKey = ACTION_ADD_TEST,
            ),
            AdminDashboardQuickAction(
                titleKey = "admin.dashboard.quick_actions.view_reports.title",
                descriptionKey = "admin.dashboard.quick_actions.view_reports.description",
                iconKey = "view_reports",
                actionKey = ACTION_VIEW_REPORTS,
            ),
        )
    }

    fun sections(): List<AdminDashboardSection> {
        val value = stats
        return listOf(
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.users.title",
                descriptionKey = "admin.dashboard.sections.users.description",
                statsKey = "admin.dashboard.sections.users.stats_template",
                statsCount = value?.totalUsers ?: 0,
                iconKey = "users",
                pendingCount = value?.pendingUsers ?: 0,
                access = AdminSectionAccess.Roles(
                    roles = listOf("admin"),
                    permissions = listOf("users.read"),
                ),
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.early_access.title",
                descriptionKey = "admin.dashboard.sections.early_access.description",
                statsKey = "admin.dashboard.sections.early_access.stats",
                iconKey = "early_access",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.services.title",
                descriptionKey = "admin.dashboard.sections.services.description",
                statsKey = "admin.dashboard.sections.services.stats_template",
                statsCount = value?.activeServices ?: 0,
                iconKey = "services",
                pendingCount = value?.pendingServices ?: 0,
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.categories.title",
                descriptionKey = "admin.dashboard.sections.categories.description",
                statsKey = "admin.dashboard.sections.categories.stats",
                iconKey = "categories",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.tests.title",
                descriptionKey = "admin.dashboard.sections.tests.description",
                statsKey = "admin.dashboard.sections.tests.stats",
                iconKey = "tests",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.calls.title",
                descriptionKey = "admin.dashboard.sections.calls.description",
                statsKey = "admin.dashboard.sections.calls.stats_template",
                statsCount = value?.totalScheduleCalls ?: 0,
                iconKey = "calls",
                pendingCount = value?.pendingCalls ?: 0,
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.projects.title",
                descriptionKey = "admin.dashboard.sections.projects.description",
                statsKey = "admin.dashboard.sections.projects.stats_template",
                statsCount = value?.totalProjects ?: 0,
                iconKey = "projects",
                pendingCount = value?.totalPendingProjects ?: 0,
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.disputes.title",
                descriptionKey = "admin.dashboard.sections.disputes.description",
                statsKey = "admin.dashboard.sections.disputes.stats",
                iconKey = "disputes",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.legal_clauses.title",
                descriptionKey = "admin.dashboard.sections.legal_clauses.description",
                statsKey = "admin.dashboard.sections.legal_clauses.stats",
                iconKey = "legal_clauses",
                access = AdminSectionAccess.Roles(
                    roles = listOf("admin", "legal"),
                    permissions = listOf("legal.clauses.read"),
                ),
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.newsletter.title",
                descriptionKey = "admin.dashboard.sections.newsletter.description",
                statsKey = "admin.dashboard.sections.newsletter.stats",
                iconKey = "newsletter",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.activities.title",
                descriptionKey = "admin.dashboard.sections.activities.description",
                iconKey = "activities",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.audit_logs.title",
                descriptionKey = "admin.dashboard.sections.audit_logs.description",
                iconKey = "audit_logs",
                access = AdminSectionAccess.Admin,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.roles.title",
                descriptionKey = "admin.dashboard.sections.roles.description",
                statsKey = "admin.dashboard.sections.roles.stats",
                iconKey = "roles",
                access = AdminSectionAccess.Superuser,
            ),
            AdminDashboardSection(
                titleKey = "admin.dashboard.sections.analytics.title",
                descriptionKey = "admin.dashboard.sections.analytics.description",
                statsKey = "admin.dashboard.sections.analytics.stats",
                iconKey = "analytics",
                access = AdminSectionAccess.Admin,
            ),
        )
    }

    fun systemStatus(): List<Pair<String, String>> {
        return listOf(
            "admin.dashboard.system_status.server_status" to "admin.dashboard.system_status.online",
            "admin.dashboard.system_status.database" to "admin.dashboard.system_status.healthy",
            "admin.dashboard.system_status.api_response" to "admin.dashboard.system_status.fast",
            "admin.dashboard.system_status.provider_rates" to "admin.dashboard.system_status.flexible",
            "admin.dashboard.system_status.competency_tests" to "admin.dashboard.system_status.active",
        )
    }

    fun canAccess(section: AdminDashboardSection, user: AuthUser?): Boolean {
        user ?: return false

        if (user.isSuperuser) {
            return true
        }

        return when (val access = section.access) {
            AdminSectionAccess.Admin -> user.hasRole("admin")
            AdminSectionAccess.Superuser -> user.isSuperuser
            is AdminSectionAccess.Roles -> {
                val hasRole = access.roles.any(user::hasRole)
                if (!hasRole) return false
                if (access.permissions.isEmpty()) return true

                val normalizedPermissions = user.permissions
                    .map { it.trim().lowercase() }
                    .filter { it.isNotEmpty() }
                    .toSet()
                access.permissions.all { required ->
                    normalizedPermissions.contains(required.trim().lowercase())
                }
            }
        }
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminDashboardViewModel(appContainer) as T
        }
    }
}

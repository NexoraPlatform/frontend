package com.trustora.app.features.dashboard.presentation

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardChatGroup
import com.trustora.app.core.models.DashboardChatMessage
import com.trustora.app.core.models.DashboardCompanyDetailsPayload
import com.trustora.app.core.models.DashboardCompanySearchResult
import com.trustora.app.core.models.DashboardCompanyUser
import com.trustora.app.core.models.DashboardCurrencyOption
import com.trustora.app.core.models.DashboardLocationCity
import com.trustora.app.core.models.DashboardLocationCountry
import com.trustora.app.core.models.DashboardLocationState
import com.trustora.app.core.models.DashboardProjectMilestone
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.models.DashboardRapydOnboarding
import com.trustora.app.core.models.DashboardRecentActivity
import com.trustora.app.core.models.DashboardServiceItem
import com.trustora.app.core.models.DashboardStats
import com.trustora.app.core.models.DashboardWalletBalance
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.TrustoraCompanyIdentificationTypes
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import com.trustora.app.core.realtime.TrustoraRealtimeEvent
import com.trustora.app.core.realtime.TrustoraRealtimeEventNames
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlin.math.ceil
import retrofit2.HttpException

enum class DashboardTab {
    OVERVIEW,
    PROJECTS,
    SERVICES,
    MESSAGES,
    FINANCE,
    SETTINGS,
}

enum class DashboardProjectSort {
    NEWEST,
    OLDEST,
    BUDGET,
    TITLE,
}

enum class DashboardSortOrder {
    ASC,
    DESC,
}

data class DashboardCompanyFormState(
    val companyId: String? = null,
    val name: String = "",
    val representedBy: String = "",
    val email: String = "",
    val idType: String = "",
    val idNumber: String = "",
    val bankCurrency: String = "",
    val companyCountry: String = "",
    val companyCounty: String = "",
    val companyCity: String = "",
    val companyZip: String = "",
    val companyAddress: String = "",
    val companyBankIban: String = "",
    val companyBankName: String = "",
    val companyBankBic: String = "",
) {
    fun toPayload(): DashboardCompanyDetailsPayload {
        return DashboardCompanyDetailsPayload(
            companyId = companyId?.trim()?.takeIf { it.isNotEmpty() },
            name = name.trim(),
            representedBy = representedBy.trim(),
            email = email.trim(),
            companyAddress = companyAddress.trim(),
            companyCity = companyCity.trim(),
            companyCounty = companyCounty.trim(),
            companyZip = companyZip.trim(),
            companyCountry = companyCountry.trim().uppercase(),
            companyBankIban = companyBankIban.trim(),
            companyBankName = companyBankName.trim(),
            companyBankBic = companyBankBic.trim(),
            idType = idType.trim(),
            idNumber = idNumber.trim(),
            bankCurrency = bankCurrency.trim().uppercase(),
        )
    }

    companion object {
        fun fromUser(user: AuthUser?): DashboardCompanyFormState {
            val company = user?.company
            return DashboardCompanyFormState(
                companyId = company?.id?.trim()?.takeIf { it.isNotEmpty() },
                name = company?.name ?: user?.companyName.orEmpty(),
                representedBy = user?.displayName.orEmpty(),
                email = user?.email.orEmpty(),
                idType = company?.idType.orEmpty(),
                idNumber = company?.idNumber.orEmpty(),
                bankCurrency = company?.bankCurrency.orEmpty(),
                companyCountry = company?.companyCountry.orEmpty(),
                companyCounty = company?.companyCounty.orEmpty(),
                companyCity = company?.companyCity.orEmpty(),
                companyZip = company?.companyZip.orEmpty(),
                companyAddress = company?.companyAddress.orEmpty(),
                companyBankIban = company?.companyBankIban.orEmpty(),
                companyBankName = company?.companyBankName.orEmpty(),
                companyBankBic = company?.companyBankBic.orEmpty(),
            )
        }
    }
}

class DashboardViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var activeTab by mutableStateOf(DashboardTab.OVERVIEW)
        private set

    var roleSlugs by mutableStateOf<List<String>>(emptyList())
        private set

    var stats by mutableStateOf<DashboardStats?>(null)
        private set
    var allProjects by mutableStateOf<List<DashboardProjectSummary>>(emptyList())
        private set
    var overviewProjects by mutableStateOf<List<DashboardProjectSummary>>(emptyList())
        private set
    var recentActivities by mutableStateOf<List<DashboardRecentActivity>>(emptyList())
        private set
    var services by mutableStateOf<List<DashboardServiceItem>>(emptyList())
        private set

    var chatGroups by mutableStateOf<List<DashboardChatGroup>>(emptyList())
        private set
    var chatMessages by mutableStateOf<List<DashboardChatMessage>>(emptyList())
        private set
    var selectedChatGroupId by mutableStateOf<String?>(null)
        private set
    var chatDraft by mutableStateOf("")

    var wallets by mutableStateOf<List<DashboardWalletBalance>>(emptyList())
        private set
    var selectedWalletId by mutableStateOf<String?>(null)
        private set

    var searchTerm by mutableStateOf("")
    var statusFilter by mutableStateOf("all")
    var sortBy by mutableStateOf(DashboardProjectSort.NEWEST)
    var sortOrder by mutableStateOf(DashboardSortOrder.DESC)
    var currentPage by mutableStateOf(1)
        private set

    var transferAmount by mutableStateOf("")
    var transferError by mutableStateOf<String?>(null)
        private set

    var isLoadingOverview by mutableStateOf(false)
        private set
    var isLoadingProjects by mutableStateOf(false)
        private set
    var isLoadingServices by mutableStateOf(false)
        private set
    var isLoadingChatGroups by mutableStateOf(false)
        private set
    var isLoadingChatMessages by mutableStateOf(false)
        private set
    var isSendingChatMessage by mutableStateOf(false)
        private set
    var respondingProjectIds by mutableStateOf<Set<String>>(emptySet())
        private set
    var updatingMilestoneIds by mutableStateOf<Set<String>>(emptySet())
        private set
    var isLoadingFinance by mutableStateOf(false)
        private set
    var isLoadingTransfer by mutableStateOf(false)
        private set
    var isRapydConnecting by mutableStateOf(false)
        private set
    var isLoadingSettings by mutableStateOf(false)
        private set
    var isSavingCompanyInfo by mutableStateOf(false)
        private set
    var isLoadingCompanyManagers by mutableStateOf(false)
        private set
    var isSavingCompanyManagers by mutableStateOf(false)
        private set
    var isSearchingCompanies by mutableStateOf(false)
        private set
    var isSearchingCompanyUsers by mutableStateOf(false)
        private set
    var isLoadingCurrencies by mutableStateOf(false)
        private set
    var isLoadingLocations by mutableStateOf(false)
        private set

    var overviewError by mutableStateOf<String?>(null)
        private set
    var projectsError by mutableStateOf<String?>(null)
        private set
    var servicesError by mutableStateOf<String?>(null)
        private set
    var messagesError by mutableStateOf<String?>(null)
        private set
    var financeError by mutableStateOf<String?>(null)
        private set
    var settingsError by mutableStateOf<String?>(null)
        private set
    var settingsSuccess by mutableStateOf(false)
        private set
    var companySettingsError by mutableStateOf<String?>(null)
        private set
    var companySettingsSuccess by mutableStateOf(false)
        private set
    var companyManagersError by mutableStateOf<String?>(null)
        private set
    var companySearchError by mutableStateOf<String?>(null)
        private set
    var currencySearchError by mutableStateOf<String?>(null)
        private set
    var locationOptionsError by mutableStateOf<String?>(null)
        private set

    var companyForm by mutableStateOf(DashboardCompanyFormState())
        private set
    var companySearchTerm by mutableStateOf("")
    var companySearchResults by mutableStateOf<List<DashboardCompanySearchResult>>(emptyList())
        private set
    var currencySearchTerm by mutableStateOf("")
    var currencyOptions by mutableStateOf<List<DashboardCurrencyOption>>(emptyList())
        private set
    var locationCountries by mutableStateOf<List<DashboardLocationCountry>>(emptyList())
        private set
    var locationStates by mutableStateOf<List<DashboardLocationState>>(emptyList())
        private set
    var locationCities by mutableStateOf<List<DashboardLocationCity>>(emptyList())
        private set

    var companyManagers by mutableStateOf<List<DashboardCompanyUser>>(emptyList())
        private set
    var companyMembers by mutableStateOf<List<DashboardCompanyUser>>(emptyList())
        private set
    var companyManagerSearchTerm by mutableStateOf("")
    var companyManagerSearchResults by mutableStateOf<List<DashboardCompanyUser>>(emptyList())
        private set
    var transferringOwnershipEmail by mutableStateOf<String?>(null)
        private set

    private val projectsPerPage = 6
    private var lastContextKey: String = ""

    private var companySearchJob: Job? = null
    private var currencySearchJob: Job? = null
    private var managerSearchJob: Job? = null
    private var realtimeEventsJob: Job? = null
    private var subscribedRealtimeChatGroupId: String? = null
    private var realtimeContext: RealtimeContext? = null

    private data class RealtimeContext(
        val userId: String,
        val token: String,
        val language: String,
        val currency: AppCurrency,
    )

    val isProvider: Boolean
        get() = roleSlugs.contains("provider")

    val isClient: Boolean
        get() = roleSlugs.contains("client")

    val hasRoleInfo: Boolean
        get() = roleSlugs.isNotEmpty()

    val availableTabs: List<DashboardTab>
        get() = if (hasRoleInfo && !isProvider) {
            listOf(
                DashboardTab.OVERVIEW,
                DashboardTab.PROJECTS,
                DashboardTab.SERVICES,
                DashboardTab.MESSAGES,
                DashboardTab.SETTINGS,
            )
        } else {
            listOf(
                DashboardTab.OVERVIEW,
                DashboardTab.PROJECTS,
                DashboardTab.SERVICES,
                DashboardTab.MESSAGES,
                DashboardTab.FINANCE,
                DashboardTab.SETTINGS,
            )
        }

    val selectedWallet: DashboardWalletBalance?
        get() = selectedWalletId?.let { id -> wallets.firstOrNull { it.id == id } } ?: wallets.firstOrNull()

    val selectedChatGroup: DashboardChatGroup?
        get() = selectedChatGroupId?.let { id -> chatGroups.firstOrNull { it.id == id } }

    val selectedCountry: DashboardLocationCountry?
        get() {
            val selectedIso = companyForm.companyCountry.trim().uppercase()
            if (selectedIso.isEmpty()) return null
            return locationCountries.firstOrNull { it.isoCode == selectedIso }
        }

    val selectedCountryDisplayName: String
        get() {
            val country = selectedCountry ?: return companyForm.companyCountry.trim()
            return if (country.flag.isBlank()) country.name else "${country.flag} ${country.name}"
        }

    val selectedCountyDisplayName: String
        get() {
            val selectedCounty = companyForm.companyCounty.trim()
            if (selectedCounty.isEmpty()) return ""
            return locationStates.firstOrNull {
                it.isoCode.equals(selectedCounty, ignoreCase = true)
            }?.name ?: selectedCounty
        }

    val filteredProjects: List<DashboardProjectSummary>
        get() {
            var result = allProjects

            val normalizedSearch = searchTerm.trim().lowercase()
            if (normalizedSearch.isNotEmpty()) {
                result = result.filter { project ->
                    project.title.lowercase().contains(normalizedSearch) ||
                        project.description.lowercase().contains(normalizedSearch)
                }
            }

            if (statusFilter != "all") {
                result = result.filter { it.status.equals(statusFilter, ignoreCase = true) }
            }

            result = when (sortBy) {
                DashboardProjectSort.TITLE -> {
                    if (sortOrder == DashboardSortOrder.ASC) {
                        result.sortedBy { it.title.lowercase() }
                    } else {
                        result.sortedByDescending { it.title.lowercase() }
                    }
                }

                DashboardProjectSort.BUDGET -> {
                    if (sortOrder == DashboardSortOrder.ASC) {
                        result.sortedBy { it.budget.amount ?: 0.0 }
                    } else {
                        result.sortedByDescending { it.budget.amount ?: 0.0 }
                    }
                }

                DashboardProjectSort.OLDEST -> {
                    if (sortOrder == DashboardSortOrder.ASC) {
                        result.sortedBy { it.createdAtIso.orEmpty() }
                    } else {
                        result.sortedByDescending { it.createdAtIso.orEmpty() }
                    }
                }

                DashboardProjectSort.NEWEST -> {
                    if (sortOrder == DashboardSortOrder.ASC) {
                        result.sortedBy { it.createdAtIso.orEmpty() }
                    } else {
                        result.sortedByDescending { it.createdAtIso.orEmpty() }
                    }
                }
            }

            return result
        }

    val totalPages: Int
        get() = maxOf(1, ceil(filteredProjects.size.toDouble() / projectsPerPage.toDouble()).toInt())

    val paginatedProjects: List<DashboardProjectSummary>
        get() {
            val safePage = currentPage.coerceIn(1, totalPages)
            val startIndex = (safePage - 1) * projectsPerPage
            val endIndex = minOf(startIndex + projectsPerPage, filteredProjects.size)
            if (startIndex >= endIndex) return emptyList()
            return filteredProjects.subList(startIndex, endIndex)
        }

    fun canManageCompanySettings(user: AuthUser?): Boolean {
        if (!isProvider) return false
        return !user?.company?.id.isNullOrBlank()
    }

    fun selectTab(tab: DashboardTab) {
        if (!availableTabs.contains(tab)) return
        activeTab = tab
        syncRealtimeChatPresenceSubscription()
    }

    fun updateSearchTerm(value: String) {
        searchTerm = value
        currentPage = 1
    }

    fun updateStatusFilter(value: String) {
        statusFilter = value
        currentPage = 1
    }

    fun updateSortBy(value: DashboardProjectSort) {
        sortBy = value
        currentPage = 1
    }

    fun toggleSortOrder() {
        sortOrder = if (sortOrder == DashboardSortOrder.ASC) DashboardSortOrder.DESC else DashboardSortOrder.ASC
        currentPage = 1
    }

    fun goToPreviousPage() {
        currentPage = maxOf(1, currentPage - 1)
    }

    fun goToNextPage() {
        currentPage = minOf(totalPages, currentPage + 1)
    }

    fun configureRole(user: AuthUser?) {
        val roleSet = linkedSetOf<String>()
        user?.roleSlugs?.forEach { role ->
            role.trim().lowercase().takeIf { it.isNotEmpty() }?.let(roleSet::add)
        }
        user?.role?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }?.let(roleSet::add)

        roleSlugs = roleSet.toList()
        if (!availableTabs.contains(activeTab)) {
            activeTab = availableTabs.firstOrNull() ?: DashboardTab.OVERVIEW
        }
        syncRealtimeChatPresenceSubscription()
    }

    fun reloadAll(
        user: AuthUser?,
        token: String?,
        language: String,
        currency: AppCurrency,
        force: Boolean = false,
    ) {
        val contextKey = listOf(
            user?.id.orEmpty(),
            token.orEmpty(),
            language,
            currency.raw,
        ).joinToString("|")

        if (!force && contextKey == lastContextKey && allProjects.isNotEmpty()) {
            return
        }
        lastContextKey = contextKey

        configureRole(user)
        resetCompanyForm(user)

        if (user == null || token.isNullOrBlank()) {
            clearAllData()
            return
        }

        viewModelScope.launch {
            loadProjects(token = token, language = language, currency = currency)
            loadOverview(token = token, language = language, currency = currency)
            loadServices(token = token, language = language, currency = currency, providerId = if (isProvider) user.id else null)
            loadChatGroups(token = token)

            if (isProvider && hasRapydConnection(user)) {
                loadFinance(token = token, language = language)
            } else {
                clearFinanceState()
            }

            if (activeTab == DashboardTab.SETTINGS) {
                loadSettings(user = user, token = token, language = language)
            }
        }
    }

    fun loadDataForActiveTab(
        user: AuthUser?,
        token: String?,
        language: String,
        currency: AppCurrency,
    ) {
        if (token.isNullOrBlank()) return

        viewModelScope.launch {
            when (activeTab) {
                DashboardTab.OVERVIEW -> loadOverview(token = token, language = language, currency = currency)
                DashboardTab.PROJECTS -> loadProjects(token = token, language = language, currency = currency)
                DashboardTab.SERVICES -> loadServices(
                    token = token,
                    language = language,
                    currency = currency,
                    providerId = if (isProvider) user?.id else null,
                )

                DashboardTab.MESSAGES -> loadChatGroups(token = token)
                DashboardTab.FINANCE -> if (isProvider && hasRapydConnection(user)) {
                    loadFinance(token = token, language = language)
                } else {
                    clearFinanceState()
                }
                DashboardTab.SETTINGS -> loadSettings(user = user, token = token, language = language)
            }
        }
    }

    fun attachRealtime(
        user: AuthUser,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val normalizedUserId = user.id.trim()
        val normalizedToken = token.trim()
        if (normalizedUserId.isEmpty() || normalizedToken.isEmpty()) {
            detachRealtime()
            return
        }

        realtimeContext = RealtimeContext(
            userId = normalizedUserId,
            token = normalizedToken,
            language = language,
            currency = currency,
        )

        if (realtimeEventsJob == null) {
            realtimeEventsJob = viewModelScope.launch {
                appContainer.realtimeService.events.collect { event ->
                    handleRealtimeEvent(event)
                }
            }
        }

        syncRealtimeChatPresenceSubscription()
    }

    fun detachRealtime() {
        realtimeContext = null
        realtimeEventsJob?.cancel()
        realtimeEventsJob = null

        val previousGroupId = subscribedRealtimeChatGroupId
        subscribedRealtimeChatGroupId = null
        if (!previousGroupId.isNullOrBlank()) {
            viewModelScope.launch {
                appContainer.realtimeService.unsubscribeChatGroupPresence(previousGroupId)
            }
        }
    }

    private fun syncRealtimeChatPresenceSubscription() {
        val nextGroupId = if (activeTab == DashboardTab.MESSAGES) {
            selectedChatGroupId?.trim()?.takeIf { it.isNotEmpty() }
        } else {
            null
        }

        if (nextGroupId == subscribedRealtimeChatGroupId) {
            return
        }

        val previousGroupId = subscribedRealtimeChatGroupId
        subscribedRealtimeChatGroupId = nextGroupId

        viewModelScope.launch {
            if (!previousGroupId.isNullOrBlank()) {
                appContainer.realtimeService.unsubscribeChatGroupPresence(previousGroupId)
            }
            if (!nextGroupId.isNullOrBlank()) {
                appContainer.realtimeService.subscribeChatGroupPresence(nextGroupId)
            }
        }
    }

    private suspend fun handleRealtimeEvent(event: TrustoraRealtimeEvent) {
        val context = realtimeContext ?: return
        if (context.userId.isBlank() || context.token.isBlank()) return

        when (event.name) {
            TrustoraRealtimeEventNames.USER_NOTIFICATION -> {
                handleRealtimeUserNotification(event.payload, context)
            }

            TrustoraRealtimeEventNames.CHAT_MESSAGE_SENT,
            TrustoraRealtimeEventNames.CHAT_MESSAGE_UPDATED,
            TrustoraRealtimeEventNames.CHAT_GROUP_CREATED,
            -> {
                handleRealtimeChatNotification(event.payload, context)
            }

            TrustoraRealtimeEventNames.CHAT_USER_JOINED,
            TrustoraRealtimeEventNames.CHAT_USER_LEFT,
            TrustoraRealtimeEventNames.PRESENCE_HERE,
            TrustoraRealtimeEventNames.PRESENCE_JOINING,
            TrustoraRealtimeEventNames.PRESENCE_LEAVING,
            -> {
                handleRealtimePresenceNotification(context)
            }

            else -> Unit
        }
    }

    private suspend fun handleRealtimeUserNotification(
        payloadElement: JsonElement,
        context: RealtimeContext,
    ) {
        val payload = payloadElement.asJsonObjectOrNull() ?: JsonObject()
        val data = payload.objectOrNull("data") ?: JsonObject()
        val dataPayload = data.objectOrNull("payload") ?: JsonObject()
        val payloadPayload = payload.objectOrNull("payload") ?: JsonObject()

        val rawType = payload.stringOrNull("type")?.lowercase().orEmpty()
        val declaredType = data.stringOrNull("type")?.lowercase().orEmpty()
        val projectId = firstNonEmptyString(
            data["projectId"],
            data["project_id"],
            payload["projectId"],
            payload["project_id"],
            dataPayload["projectId"],
            dataPayload["project_id"],
            payloadPayload["projectId"],
            payloadPayload["project_id"],
        )
        val payloadStatus = firstNonEmptyString(
            dataPayload["status"],
            payloadPayload["status"],
        ).orEmpty().uppercase()

        val isBudgetAcceptedByProvider =
            declaredType == "budget.accepted.by_provider" ||
                rawType.contains("provideracceptedclientbudget")
        val isProjectEvent =
            declaredType.startsWith("project.") ||
                declaredType.startsWith("budget.")
        val isProjectStatusUpdatedEvent =
            declaredType == "project.status.updated" ||
                rawType.contains("projectstatusupdated")
        val isProviderFinishedNotification =
            isProjectStatusUpdatedEvent && payloadStatus == "FINISHED"
        val isRapydEvent = declaredType.startsWith("rapyd.")
        val isFallbackProjectEvent = declaredType.isEmpty() && !projectId.isNullOrBlank()

        val shouldRefetchProjects =
            isProjectEvent ||
                isProjectStatusUpdatedEvent ||
                isProviderFinishedNotification ||
                isBudgetAcceptedByProvider ||
                isFallbackProjectEvent ||
                (isRapydEvent && !projectId.isNullOrBlank())

        val shouldRefreshOverview =
            activeTab == DashboardTab.OVERVIEW &&
                (isProjectEvent || isBudgetAcceptedByProvider || isRapydEvent)

        if (isRapydEvent && isProvider) {
            loadFinance(token = context.token, language = context.language)
        }

        if (shouldRefetchProjects) {
            loadProjects(
                token = context.token,
                language = context.language,
                currency = context.currency,
            )
        }

        if (shouldRefreshOverview) {
            loadOverview(
                token = context.token,
                language = context.language,
                currency = context.currency,
            )
        }
    }

    private suspend fun handleRealtimeChatNotification(
        payloadElement: JsonElement,
        context: RealtimeContext,
    ) {
        val payload = payloadElement.asJsonObjectOrNull() ?: JsonObject()
        val message = payload.objectOrNull("message") ?: payload
        val targetGroupId = firstNonEmptyString(
            message["groupId"],
            message["group_id"],
            payload["groupId"],
            payload["group_id"],
        )

        loadChatGroups(token = context.token)
        if (!targetGroupId.isNullOrBlank() &&
            activeTab == DashboardTab.MESSAGES &&
            selectedChatGroupId == targetGroupId
        ) {
            markSelectedGroupAsRead(token = context.token)
        }
    }

    private suspend fun handleRealtimePresenceNotification(context: RealtimeContext) {
        if (activeTab != DashboardTab.MESSAGES) return
        loadChatGroups(token = context.token)
    }

    suspend fun loadOverview(token: String, language: String, currency: AppCurrency) {
        isLoadingOverview = true
        overviewError = null
        runCatching {
            val fetchedStats = appContainer.dashboardRepository.getStats(language = language, currency = currency, token = token)
            val fetchedActivities = appContainer.dashboardRepository.getRecentActivities(language = language, token = token)
            stats = fetchedStats
            recentActivities = fetchedActivities.take(3)
            overviewProjects = allProjects
                .sortedByDescending { it.createdAtIso.orEmpty() }
                .take(2)
        }.onFailure { error ->
            overviewError = error.message ?: "Failed to load overview."
        }
        isLoadingOverview = false
    }

    suspend fun loadProjects(token: String, language: String, currency: AppCurrency) {
        isLoadingProjects = true
        projectsError = null
        runCatching {
            val projects = appContainer.dashboardRepository.getProjects(
                isProvider = isProvider,
                language = language,
                currency = currency,
                token = token,
            )
            allProjects = projects
            overviewProjects = projects.sortedByDescending { it.createdAtIso.orEmpty() }.take(2)
            currentPage = currentPage.coerceIn(1, totalPages)
        }.onFailure { error ->
            projectsError = error.message ?: "Failed to load projects."
            allProjects = emptyList()
            overviewProjects = emptyList()
        }
        isLoadingProjects = false
    }

    suspend fun loadServices(token: String, language: String, currency: AppCurrency, providerId: String?) {
        isLoadingServices = true
        servicesError = null
        runCatching {
            services = appContainer.dashboardRepository.getServices(
                providerId = providerId,
                language = language,
                currency = currency,
                token = token,
            )
        }.onFailure { error ->
            servicesError = error.message ?: "Failed to load services."
            services = emptyList()
        }
        isLoadingServices = false
    }

    suspend fun loadChatGroups(token: String) {
        isLoadingChatGroups = true
        messagesError = null
        runCatching {
            val groups = appContainer.dashboardRepository.getChatGroups(token = token)
            chatGroups = groups

            val currentSelected = selectedChatGroupId
            if (!currentSelected.isNullOrBlank() && groups.any { it.id == currentSelected }) {
                loadChatMessages(token = token, groupId = currentSelected)
            } else {
                selectedChatGroupId = groups.firstOrNull()?.id
                chatMessages = emptyList()
                selectedChatGroupId?.let { firstId ->
                    loadChatMessages(token = token, groupId = firstId)
                }
            }
            syncRealtimeChatPresenceSubscription()
        }.onFailure { error ->
            messagesError = resolvedMessage(error, "Failed to load conversations.")
            chatGroups = emptyList()
            chatMessages = emptyList()
            selectedChatGroupId = null
            syncRealtimeChatPresenceSubscription()
        }
        isLoadingChatGroups = false
    }

    suspend fun selectChatGroup(groupId: String, token: String) {
        selectedChatGroupId = groupId
        syncRealtimeChatPresenceSubscription()
        loadChatMessages(token = token, groupId = groupId)
        markSelectedGroupAsRead(token = token)
    }

    suspend fun loadChatMessages(token: String, groupId: String? = null) {
        val targetGroupId = groupId ?: selectedChatGroupId ?: run {
            chatMessages = emptyList()
            return
        }
        isLoadingChatMessages = true
        messagesError = null
        runCatching {
            chatMessages = appContainer.dashboardRepository.getChatMessages(
                groupId = targetGroupId,
                page = 1,
                limit = 60,
                token = token,
            )
        }.onFailure { error ->
            messagesError = resolvedMessage(error, "Failed to load chat messages.")
            chatMessages = emptyList()
        }
        isLoadingChatMessages = false
    }

    suspend fun sendCurrentChatMessage(token: String, language: String) {
        val targetGroupId = selectedChatGroupId ?: return
        val trimmed = chatDraft.trim()
        if (trimmed.isEmpty()) return

        isSendingChatMessage = true
        messagesError = null
        runCatching {
            val sent = appContainer.dashboardRepository.sendChatMessage(
                groupId = targetGroupId,
                content = trimmed,
                language = language,
                token = token,
            )
            chatDraft = ""

            if (sent != null) {
                chatMessages = chatMessages + sent
            } else {
                loadChatMessages(token = token, groupId = targetGroupId)
            }

            chatGroups = chatGroups.map { group ->
                if (group.id == targetGroupId) {
                    group.copy(
                        unreadCount = 0,
                        lastMessage = trimmed,
                        updatedAtIso = sent?.timestampIso ?: group.updatedAtIso,
                    )
                } else {
                    group
                }
            }.sortedWith(
                compareByDescending<DashboardChatGroup> { it.unreadCount }
                    .thenByDescending { it.updatedAtIso.orEmpty() },
            )
        }.onFailure { error ->
            messagesError = resolvedMessage(error, "Failed to send message.")
        }
        isSendingChatMessage = false
    }

    suspend fun markSelectedGroupAsRead(token: String) {
        val targetGroupId = selectedChatGroupId ?: return
        runCatching {
            appContainer.dashboardRepository.markChatGroupRead(groupId = targetGroupId, token = token)
            chatGroups = chatGroups.map { group ->
                if (group.id == targetGroupId) group.copy(unreadCount = 0) else group
            }
        }.onFailure { error ->
            if (error is HttpException && error.code() == 403) {
                return@onFailure
            }
            messagesError = resolvedMessage(error, "Failed to mark conversation as read.")
        }
    }

    suspend fun loadFinance(token: String, language: String) {
        if (!isProvider) return
        isLoadingFinance = true
        financeError = null
        runCatching {
            val fetchedWallets = appContainer.dashboardRepository.getRapydWalletBalances(language = language, token = token)
            wallets = fetchedWallets
            if (selectedWalletId == null) {
                selectedWalletId = fetchedWallets.firstOrNull()?.id
            }
            if (!selectedWalletId.isNullOrBlank() && fetchedWallets.none { it.id == selectedWalletId }) {
                selectedWalletId = fetchedWallets.firstOrNull()?.id
            }
        }.onFailure { error ->
            financeError = resolvedMessage(error, "Failed to load finance.")
            wallets = emptyList()
            selectedWalletId = null
        }
        isLoadingFinance = false
    }

    suspend fun connectRapyd(token: String, language: String): DashboardRapydOnboarding? {
        if (!isProvider) return null
        isRapydConnecting = true
        financeError = null
        val result = runCatching {
            appContainer.dashboardRepository.rapydOnboarding(language = language, token = token)
        }.onFailure { error ->
            financeError = resolvedMessage(error, "Failed to initialize Rapyd onboarding.")
        }.getOrNull()
        isRapydConnecting = false
        return result
    }

    fun clearFinanceState() {
        wallets = emptyList()
        selectedWalletId = null
        transferAmount = ""
        transferError = null
        financeError = null
    }

    fun applyWalletSelection(walletId: String) {
        selectedWalletId = walletId
        transferAmount = ""
        transferError = null
    }

    fun fillTransferMax() {
        selectedWallet?.balance?.let { balance ->
            transferAmount = String.format("%.2f", balance)
            transferError = null
        }
    }

    suspend fun transfer(
        token: String,
        language: String,
        currency: AppCurrency,
        invalidAmountText: String,
        insufficientBalanceText: String,
    ): Boolean {
        transferError = null
        val wallet = selectedWallet ?: run {
            transferError = invalidAmountText
            return false
        }
        val walletBalance = wallet.balance ?: run {
            transferError = invalidAmountText
            return false
        }

        val normalized = transferAmount.replace(",", ".")
        val amount = normalized.toDoubleOrNull()
        if (amount == null || amount <= 0.0) {
            transferError = invalidAmountText
            return false
        }
        if (amount > walletBalance) {
            transferError = insufficientBalanceText
            return false
        }

        isLoadingTransfer = true
        val success = runCatching {
            appContainer.dashboardRepository.createRapydPayoutBank(
                amount = amount,
                sourceCurrency = wallet.currency,
                language = language,
                appCurrency = currency,
                token = token,
            )
            transferAmount = ""
            transferError = null
            true
        }.onFailure { error ->
            transferError = resolvedMessage(error, "Transfer failed.")
        }.getOrDefault(false)
        isLoadingTransfer = false

        if (success) {
            loadFinance(token = token, language = language)
        }
        return success
    }

    suspend fun respondToProject(
        projectId: String,
        response: String,
        token: String,
        language: String,
        currency: AppCurrency,
    ): Boolean {
        respondingProjectIds = respondingProjectIds + projectId
        val success = runCatching {
            var refusalScope: String? = null
            var reason: String? = null
            var suggestionsLimit: Int? = null

            if (response.uppercase() == "REJECTED") {
                refusalScope = "project"
                reason = "Provider rejected project participation"
                suggestionsLimit = 5
            }

            appContainer.dashboardRepository.respondToProjectRequest(
                projectId = projectId,
                response = response,
                language = language,
                token = token,
                proposedBudget = null,
                reason = reason,
                refusalScope = refusalScope,
                milestoneIds = null,
                suggestionsLimit = suggestionsLimit,
            )
            loadProjects(token = token, language = language, currency = currency)
            loadOverview(token = token, language = language, currency = currency)
            true
        }.onFailure { error ->
            projectsError = error.message ?: "Failed to respond to project."
        }.getOrDefault(false)

        respondingProjectIds = respondingProjectIds - projectId
        return success
    }

    suspend fun advanceMilestone(
        projectId: String,
        milestone: DashboardProjectMilestone,
        token: String,
        language: String,
        currency: AppCurrency,
    ): Boolean {
        val action = nextMilestoneAction(milestone) ?: return false
        val key = "$projectId|${milestone.id}"
        updatingMilestoneIds = updatingMilestoneIds + key

        val success = runCatching {
            appContainer.dashboardRepository.markProjectMilestone(
                projectId = projectId,
                milestoneId = milestone.id,
                status = action.status,
                token = token,
            )
            loadProjects(token = token, language = language, currency = currency)
            loadOverview(token = token, language = language, currency = currency)
            true
        }.onFailure { error ->
            projectsError = error.message ?: "Failed to update milestone."
        }.getOrDefault(false)

        updatingMilestoneIds = updatingMilestoneIds - key
        return success
    }

    private fun hasRapydConnection(user: AuthUser?): Boolean {
        return !user?.rapydWalletId.isNullOrBlank()
    }

    private fun resolvedMessage(error: Throwable, fallback: String): String {
        if (error is HttpException) {
            val payload = error.response()?.errorBody()?.string().orEmpty()
            if (payload.isNotBlank()) {
                val root = runCatching { JsonParser.parseString(payload).asJsonObject }.getOrNull()
                if (root != null) {
                    root.objectOrNull("errors")?.let { errors ->
                        errors.entrySet().forEach { (_, value) ->
                            when {
                                value.isJsonArray -> {
                                    for (index in 0 until value.asJsonArray.size()) {
                                        val message = value.asJsonArray[index].asStringOrNull()?.trim()
                                        if (!message.isNullOrEmpty()) {
                                            return message
                                        }
                                    }
                                }

                                value.isJsonPrimitive -> {
                                    val message = value.asStringOrNull()?.trim()
                                    if (!message.isNullOrEmpty()) {
                                        return message
                                    }
                                }
                            }
                        }
                    }

                    root.stringOrNull("message", "error")?.let { message ->
                        return message
                    }
                }
            }
        }

        return error.message?.trim()?.takeIf { it.isNotEmpty() } ?: fallback
    }

    fun resetCompanyForm(user: AuthUser?) {
        companyForm = DashboardCompanyFormState.fromUser(user)
        companySearchTerm = ""
        companySearchResults = emptyList()
        companySearchError = null
        currencySearchTerm = companyForm.bankCurrency
        currencySearchError = null
        locationOptionsError = null
        companyManagerSearchTerm = ""
        companyManagerSearchResults = emptyList()
        settingsError = null
        settingsSuccess = false
        companySettingsError = null
        companySettingsSuccess = false
    }

    suspend fun loadLocationOptionsIfNeeded() {
        if (isLoadingLocations) return

        if (locationCountries.isEmpty()) {
            isLoadingLocations = true
            runCatching {
                locationCountries = appContainer.dashboardRepository.getLocationCountries()
                locationOptionsError = null
            }.onFailure { error ->
                locationCountries = emptyList()
                locationStates = emptyList()
                locationCities = emptyList()
                locationOptionsError = error.message ?: "Failed to load locations."
                isLoadingLocations = false
                return
            }
            isLoadingLocations = false
        }

        syncLocationSelectionsFromCurrentForm()
    }

    suspend fun selectCompanyCountry(isoCode: String) {
        loadLocationOptionsIfNeeded()
        val normalizedIso = isoCode.trim().uppercase()
        if (normalizedIso.isEmpty()) return

        companyForm = companyForm.copy(companyCountry = normalizedIso)

        TrustoraCompanyIdentificationTypes.byCountryIso[normalizedIso]?.let { suggestedType ->
            companyForm = companyForm.copy(idType = suggestedType)
        }

        runCatching {
            locationStates = appContainer.dashboardRepository.getLocationStates(countryIso = normalizedIso)
            if (locationStates.isNotEmpty()) {
                val firstState = locationStates.first().isoCode
                companyForm = companyForm.copy(companyCounty = firstState)
                locationCities = appContainer.dashboardRepository.getLocationCities(
                    countryIso = normalizedIso,
                    stateIso = firstState,
                )
                companyForm = companyForm.copy(companyCity = locationCities.firstOrNull()?.name.orEmpty())
            } else {
                companyForm = companyForm.copy(companyCounty = "", companyCity = "")
                locationCities = emptyList()
            }
            locationOptionsError = null
        }.onFailure { error ->
            locationStates = emptyList()
            locationCities = emptyList()
            locationOptionsError = error.message ?: "Failed to load country options."
        }
    }

    suspend fun selectCompanyCounty(isoCode: String) {
        val countryIso = companyForm.companyCountry.trim().uppercase()
        val normalizedCounty = isoCode.trim().uppercase()
        if (countryIso.isEmpty() || normalizedCounty.isEmpty()) return

        companyForm = companyForm.copy(companyCounty = normalizedCounty)
        runCatching {
            locationCities = appContainer.dashboardRepository.getLocationCities(
                countryIso = countryIso,
                stateIso = normalizedCounty,
            )
            companyForm = companyForm.copy(companyCity = locationCities.firstOrNull()?.name.orEmpty())
            locationOptionsError = null
        }.onFailure { error ->
            locationCities = emptyList()
            locationOptionsError = error.message ?: "Failed to load county options."
        }
    }

    fun selectCompanyCity(cityName: String) {
        companyForm = companyForm.copy(companyCity = cityName.trim())
    }

    private suspend fun syncLocationSelectionsFromCurrentForm() {
        val rawCountry = companyForm.companyCountry.trim()
        if (rawCountry.isEmpty()) {
            locationStates = emptyList()
            locationCities = emptyList()
            return
        }

        runCatching {
            val normalizedCountry = appContainer.dashboardRepository.findLocationCountry(rawCountry)
                ?: run {
                    locationStates = emptyList()
                    locationCities = emptyList()
                    return
                }

            companyForm = companyForm.copy(companyCountry = normalizedCountry.isoCode)
            locationStates = appContainer.dashboardRepository.getLocationStates(normalizedCountry.isoCode)

            if (locationStates.isEmpty()) {
                locationCities = emptyList()
                return
            }

            val normalizedState = appContainer.dashboardRepository.normalizeLocationStateIso(
                countryIso = normalizedCountry.isoCode,
                stateValue = companyForm.companyCounty,
            )

            val hasState = locationStates.any { it.isoCode.equals(normalizedState, ignoreCase = true) }
            val resolvedState = if (hasState) normalizedState else locationStates.first().isoCode
            companyForm = companyForm.copy(companyCounty = resolvedState)

            locationCities = appContainer.dashboardRepository.getLocationCities(
                countryIso = normalizedCountry.isoCode,
                stateIso = resolvedState,
            )

            if (locationCities.isEmpty()) return

            val currentCity = companyForm.companyCity.trim()
            val hasCity = locationCities.any { it.name.equals(currentCity, ignoreCase = true) }
            if (!hasCity) {
                companyForm = companyForm.copy(companyCity = locationCities.first().name)
            }
        }.onFailure { error ->
            locationStates = emptyList()
            locationCities = emptyList()
            locationOptionsError = error.message ?: "Failed to sync location options."
        }
    }

    suspend fun loadSettings(user: AuthUser?, token: String, language: String = "en") {
        isLoadingSettings = true
        companySettingsError = null
        companySettingsSuccess = false
        settingsError = null
        settingsSuccess = false
        resetCompanyForm(user)
        loadLocationOptionsIfNeeded()

        val companyId = user?.company?.id?.trim().orEmpty()
        if (companyId.isBlank()) {
            companyManagers = emptyList()
            companyMembers = emptyList()
            companyManagersError = null
            isLoadingCompanyManagers = false
            loadCurrenciesIfNeeded(token = token)
            isLoadingSettings = false
            return
        }

        isLoadingCompanyManagers = true
        companyManagersError = null
        runCatching {
            val managers = appContainer.dashboardRepository.getCompanyManagers(companyId = companyId, token = token)
            val members = appContainer.dashboardRepository.getCompanyMembers(companyId = companyId, token = token)
            companyManagers = managers
            companyMembers = members
        }.onFailure { error ->
            companyManagers = emptyList()
            companyMembers = emptyList()
            companyManagersError = error.message ?: "Failed to load company users."
            settingsError = companyManagersError
        }
        isLoadingCompanyManagers = false

        loadCurrenciesIfNeeded(token = token)
        isLoadingSettings = false
    }

    fun scheduleCompanySearch() {
        companySearchJob?.cancel()
        companySearchError = null

        val query = companySearchTerm.trim()
        if (query.length < 2) {
            companySearchResults = emptyList()
            isSearchingCompanies = false
            return
        }

        companySearchJob = viewModelScope.launch {
            delay(300)
            isSearchingCompanies = true
            runCatching {
                val results = appContainer.dashboardRepository.searchCompanies(query = query)
                companySearchResults = results
            }.onFailure { error ->
                companySearchResults = emptyList()
                companySearchError = error.message ?: "Failed to search companies."
            }
            isSearchingCompanies = false
        }
    }

    fun applyCompanySearchResult(company: DashboardCompanySearchResult) {
        companyForm = companyForm.copy(
            name = company.name,
            idNumber = company.taxId ?: company.tradeRegistryNumber ?: companyForm.idNumber,
            companyCountry = company.companyCountry ?: companyForm.companyCountry,
            companyCity = company.companyCity ?: companyForm.companyCity,
            companyZip = company.companyZip ?: companyForm.companyZip,
            companyAddress = company.companyAddress ?: companyForm.companyAddress,
        )

        company.companyCountry?.trim()?.uppercase()?.let { countryIso ->
            TrustoraCompanyIdentificationTypes.byCountryIso[countryIso]?.let { suggestedType ->
                companyForm = companyForm.copy(idType = suggestedType)
            }
        }

        companySearchTerm = company.name
        companySearchResults = emptyList()

        viewModelScope.launch {
            syncLocationSelectionsFromCurrentForm()
        }
    }

    fun scheduleCurrencySearch(token: String) {
        currencySearchJob?.cancel()
        currencySearchError = null

        val query = currencySearchTerm.trim()
        currencySearchJob = viewModelScope.launch {
            delay(240)
            isLoadingCurrencies = true
            runCatching {
                val results = appContainer.dashboardRepository.getCurrencies(
                    search = query.ifEmpty { null },
                    token = token,
                )
                currencyOptions = results
            }.onFailure { error ->
                currencyOptions = emptyList()
                currencySearchError = error.message ?: "Failed to load currencies."
                settingsError = currencySearchError
            }
            isLoadingCurrencies = false
        }
    }

    suspend fun loadCurrenciesIfNeeded(token: String) {
        if (currencyOptions.isNotEmpty()) return

        isLoadingCurrencies = true
        runCatching {
            currencyOptions = appContainer.dashboardRepository.getCurrencies(search = null, token = token)
        }.onFailure { error ->
            currencyOptions = emptyList()
            currencySearchError = error.message ?: "Failed to load currencies."
            settingsError = currencySearchError
        }
        isLoadingCurrencies = false
    }

    suspend fun searchCurrencies(query: String, token: String) {
        currencySearchTerm = query
        runCatching {
            currencyOptions = appContainer.dashboardRepository.getCurrencies(
                search = query.trim().ifEmpty { null },
                token = token,
            )
            currencySearchError = null
        }.onFailure { error ->
            currencySearchError = error.message ?: "Failed to load currencies."
            settingsError = currencySearchError
        }
    }

    fun applyCurrency(option: DashboardCurrencyOption) {
        val normalized = option.code.uppercase()
        companyForm = companyForm.copy(bankCurrency = normalized)
        currencySearchTerm = normalized
        currencySearchError = null
    }

    fun applyCurrencyOption(option: DashboardCurrencyOption) {
        applyCurrency(option)
    }

    fun updateCompanyForm(update: (DashboardCompanyFormState) -> DashboardCompanyFormState) {
        companyForm = update(companyForm)
    }

    suspend fun saveCompanyInformation(user: AuthUser?, token: String, language: String): Boolean {
        if (!isProvider) return false
        isSavingCompanyInfo = true
        companySettingsError = null
        companySettingsSuccess = false
        settingsError = null
        settingsSuccess = false

        if (companyForm.companyId == null) {
            companyForm = companyForm.copy(companyId = user?.company?.id?.trim()?.takeIf { it.isNotEmpty() })
        }

        val payload = companyForm.toPayload()
        val success = runCatching {
            appContainer.dashboardRepository.updateUserCompanyDetails(payload = payload, token = token)
            companySettingsSuccess = true
            settingsSuccess = true
            true
        }.onFailure { error ->
            companySettingsError = error.message ?: "Failed to save company information."
            settingsError = companySettingsError
        }.getOrDefault(false)

        isSavingCompanyInfo = false
        if (success) {
            loadSettings(user = user, token = token, language = language)
        }
        return success
    }

    fun scheduleCompanyManagerSearch(token: String) {
        managerSearchJob?.cancel()

        val query = companyManagerSearchTerm.trim()
        if (query.length < 2) {
            companyManagerSearchResults = emptyList()
            isSearchingCompanyUsers = false
            return
        }

        managerSearchJob = viewModelScope.launch {
            delay(320)
            isSearchingCompanyUsers = true
            runCatching {
                val users = appContainer.dashboardRepository.searchUsersForCompany(
                    search = query,
                    token = token,
                )
                companyManagerSearchResults = users
            }.onFailure { error ->
                companyManagerSearchResults = emptyList()
                companyManagersError = error.message ?: "Failed to search company users."
                settingsError = companyManagersError
            }
            isSearchingCompanyUsers = false
        }
    }

    fun isExistingCompanyManager(candidate: DashboardCompanyUser): Boolean {
        return companyManagers.any { manager ->
            val leftEmail = manager.normalizedEmail
            val rightEmail = candidate.normalizedEmail
            if (!leftEmail.isNullOrBlank() && !rightEmail.isNullOrBlank() && leftEmail == rightEmail) {
                return@any true
            }

            val leftUserId = manager.userId?.trim()
            val rightUserId = candidate.userId?.trim()
            if (!leftUserId.isNullOrBlank() && !rightUserId.isNullOrBlank() && leftUserId == rightUserId) {
                return@any true
            }

            manager.id == candidate.id
        }
    }

    suspend fun addCompanyManager(
        candidate: DashboardCompanyUser,
        user: AuthUser?,
        token: String,
        language: String,
    ) {
        if (isExistingCompanyManager(candidate)) return

        companyManagers = companyManagers + candidate
        companyManagerSearchTerm = ""
        companyManagerSearchResults = emptyList()
        persistCompanyManagers(user = user, token = token, language = language)
    }

    suspend fun removeCompanyManager(
        manager: DashboardCompanyUser,
        user: AuthUser?,
        token: String,
        language: String,
    ) {
        companyManagers = companyManagers.filterNot { it.id == manager.id }
        persistCompanyManagers(user = user, token = token, language = language)
    }

    suspend fun transferCompanyOwnership(
        member: DashboardCompanyUser,
        user: AuthUser?,
        token: String,
        language: String,
    ): Boolean {
        val companyId = user?.company?.id?.trim().orEmpty()
        val transferEmail = member.normalizedEmail.orEmpty()
        if (!canManageCompanySettings(user) || companyId.isBlank() || transferEmail.isBlank()) {
            return false
        }

        transferringOwnershipEmail = transferEmail
        val success = runCatching {
            appContainer.dashboardRepository.updateCompanyEditorsOrOwnership(
                companyId = companyId,
                editorEmails = null,
                transferOwnerEmail = transferEmail,
                token = token,
            )
            companyManagersError = null
            true
        }.onFailure { error ->
            companyManagersError = error.message ?: "Failed to transfer ownership."
            settingsError = companyManagersError
        }.getOrDefault(false)

        transferringOwnershipEmail = null
        if (success) {
            loadSettings(user = user, token = token, language = language)
        }
        return success
    }

    private suspend fun persistCompanyManagers(
        user: AuthUser?,
        token: String,
        language: String,
    ): Boolean {
        val companyId = user?.company?.id?.trim().orEmpty()
        if (!canManageCompanySettings(user) || companyId.isBlank()) {
            return false
        }

        isSavingCompanyManagers = true
        val editorEmails = companyManagers.mapNotNull { it.normalizedEmail }

        val success = runCatching {
            appContainer.dashboardRepository.updateCompanyEditorsOrOwnership(
                companyId = companyId,
                editorEmails = editorEmails,
                transferOwnerEmail = null,
                token = token,
            )
            companyManagersError = null
            true
        }.onFailure { error ->
            companyManagersError = error.message ?: "Failed to save company managers."
            settingsError = companyManagersError
            loadSettings(user = user, token = token, language = language)
        }.getOrDefault(false)

        isSavingCompanyManagers = false
        return success
    }

    fun projectMilestones(project: DashboardProjectSummary, currentUserId: String?): List<DashboardProjectMilestone> {
        if (!isProvider) return project.milestones
        val normalizedCurrentUserId = currentUserId?.trim().orEmpty()
        if (normalizedCurrentUserId.isEmpty()) return emptyList()
        val assigned = project.milestones.filter {
            it.assignedProviderId?.trim() == normalizedCurrentUserId
        }
        return if (assigned.isNotEmpty()) assigned else emptyList()
    }

    fun projectDisplayStatus(project: DashboardProjectSummary, currentUserId: String?): String {
        if (!isProvider) return project.status
        val owned = projectMilestones(project, currentUserId)
        val hasWorkInProgress = owned.any {
            val normalized = normalizeStatus(it.status)
            normalized == "WORK_IN_PROGRESS" || normalized == "IN_PROGRESS"
        }
        return if (hasWorkInProgress) "WORK_IN_PROGRESS" else project.status
    }

    fun canProviderRespond(project: DashboardProjectSummary): Boolean {
        return isProvider && project.status.equals("PENDING", ignoreCase = true)
    }

    fun canProviderAdvanceMilestone(milestone: DashboardProjectMilestone): Boolean {
        val normalized = normalizeStatus(milestone.status)
        if (normalized in setOf("FINISHED", "COMPLETED", "PAID", "REJECTED")) {
            return false
        }
        if (normalized in setOf("PENDING", "ESCROW", "BLOCKED")) {
            return normalized != "PENDING" || isMilestonePaymentSecured(milestone)
        }
        return normalized == "WORK_IN_PROGRESS" || normalized == "IN_PROGRESS"
    }

    data class MilestoneAction(val status: String)

    fun nextMilestoneAction(milestone: DashboardProjectMilestone): MilestoneAction? {
        if (!canProviderAdvanceMilestone(milestone)) return null
        val normalized = normalizeStatus(milestone.status)
        return if (normalized in setOf("PENDING", "ESCROW", "BLOCKED")) {
            MilestoneAction(status = "work_in_progress")
        } else {
            MilestoneAction(status = "finished")
        }
    }

    fun resetFilters() {
        searchTerm = ""
        statusFilter = "all"
        sortBy = DashboardProjectSort.NEWEST
        sortOrder = DashboardSortOrder.DESC
        currentPage = 1
    }

    private fun clearAllData() {
        stats = null
        allProjects = emptyList()
        overviewProjects = emptyList()
        recentActivities = emptyList()
        services = emptyList()
        chatGroups = emptyList()
        chatMessages = emptyList()
        selectedChatGroupId = null
        chatDraft = ""
        syncRealtimeChatPresenceSubscription()
        clearFinanceState()
        companyManagers = emptyList()
        companyMembers = emptyList()
        companyManagerSearchResults = emptyList()
        companySearchResults = emptyList()
        currencyOptions = emptyList()
        locationCountries = emptyList()
        locationStates = emptyList()
        locationCities = emptyList()
        companyManagersError = null
        companySettingsError = null
        companySettingsSuccess = false
        settingsError = null
        settingsSuccess = false
        companySearchError = null
        currencySearchError = null
        locationOptionsError = null
        companySearchJob?.cancel()
        currencySearchJob?.cancel()
        managerSearchJob?.cancel()
    }

    private fun normalizeStatus(value: String?): String {
        return value?.trim()?.uppercase().orEmpty()
    }

    private fun isMilestonePaymentSecured(milestone: DashboardProjectMilestone): Boolean {
        val payment = normalizeStatus(milestone.paymentStatus)
        val state = normalizeStatus(milestone.status)
        if (payment in setOf("ESCROW", "BLOCKED", "PAID", "RELEASED")) return true
        if (payment.contains("ESCROW") || payment.contains("BLOCK") || payment.contains("PAID") || payment.contains("RELEASE")) {
            return true
        }
        return state == "ESCROW" || state == "BLOCKED"
    }

    private fun JsonElement?.asJsonObjectOrNull(): JsonObject? {
        if (this == null || !isJsonObject) return null
        return asJsonObject
    }

    private fun normalizedString(value: JsonElement?): String? {
        if (value == null || value.isJsonNull) return null
        return when {
            value.isJsonPrimitive && value.asJsonPrimitive.isString -> value.asString.trim().takeIf { it.isNotEmpty() }
            value.isJsonPrimitive && value.asJsonPrimitive.isNumber -> value.asNumber.toString()
            else -> null
        }
    }

    private fun firstNonEmptyString(vararg values: JsonElement?): String? {
        values.forEach { value ->
            normalizedString(value)?.let { return it }
        }
        return null
    }

    override fun onCleared() {
        detachRealtime()
        super.onCleared()
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DashboardViewModel(appContainer) as T
        }
    }
}

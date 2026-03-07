package com.trustora.app.features.briefing.presentation

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.models.ProjectCreationAIBriefResponse
import com.trustora.app.core.models.ProjectCreationAIMessage
import com.trustora.app.core.models.ProjectCreationAIStatus
import com.trustora.app.core.models.ProjectCreationBrief
import com.trustora.app.core.models.ProjectCreationBriefLine
import com.trustora.app.core.models.ProjectCreationBriefMilestone
import com.trustora.app.core.models.ProjectCreationLineDraft
import com.trustora.app.core.models.ProjectCreationMilestoneDraft
import com.trustora.app.core.models.ProjectCreationMode
import com.trustora.app.core.models.ProjectCreationOAuthProvider
import com.trustora.app.core.models.ProjectCreationProviderCandidate
import com.trustora.app.core.models.ProjectCreationProviderServiceInput
import com.trustora.app.core.models.ProjectCreationServiceOption
import com.trustora.app.core.models.ProjectCreationServiceRecommendation
import com.trustora.app.core.models.ProjectCreationWizardStep
import com.trustora.app.core.realtime.TrustoraRealtimeEventNames
import com.trustora.app.core.repository.AppContainer
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.roundToInt

data class ProjectCreationFlowEvent(
    val name: String,
    val payload: Map<String, String> = emptyMap(),
)

object ProjectCreationFlowEventNames {
    const val PROJECT_CREATION_STARTED = "trustora.project.creation.started"
    const val PROJECT_CREATED = "trustora.project.created"
    const val PROJECT_OAUTH_CONNECT_REQUESTED = "trustora.project.oauth.connect.requested"
}

class CreateProjectViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var mode by mutableStateOf(ProjectCreationMode.AI)
        private set
    var step by mutableStateOf(ProjectCreationWizardStep.INTENT)
        private set

    var intent by mutableStateOf("")

    var manualTitle by mutableStateOf("")
    var manualSpecificRequirements by mutableStateOf("")
    var manualDuration by mutableStateOf("")
    var manualPaymentPlan by mutableStateOf("MILESTONE")
    var manualCurrency by mutableStateOf("USD")

    var serviceSearch by mutableStateOf("")
    var groupedServices by mutableStateOf<List<ProjectCreationServiceOption>>(emptyList())
        private set
    var groupedServicesPage by mutableStateOf(1)
        private set
    var groupedServicesHasMore by mutableStateOf(true)
        private set
    var isLoadingServices by mutableStateOf(false)
        private set
    var isLoadingMoreServices by mutableStateOf(false)
        private set

    var selectedManualServiceIds by mutableStateOf<List<String>>(emptyList())
        private set
    var selectedManualServicesMap by mutableStateOf<Map<String, ProjectCreationServiceOption>>(emptyMap())
        private set
    var manualLines by mutableStateOf<List<ProjectCreationLineDraft>>(emptyList())
        private set

    var recommendations by mutableStateOf<List<ProjectCreationServiceRecommendation>>(emptyList())
        private set
    var selectedRecommendationIds by mutableStateOf<Set<String>>(emptySet())
        private set
    var isLoadingRecommendation by mutableStateOf(false)
        private set

    var aiMessages by mutableStateOf<List<ProjectCreationAIMessage>>(emptyList())
        private set
    var aiStatus by mutableStateOf(ProjectCreationAIStatus.CLARIFY)
        private set
    var aiQuestions by mutableStateOf<List<String>>(emptyList())
        private set
    var aiClarificationAnswer by mutableStateOf("")
    var isLoadingBrief by mutableStateOf(false)
        private set

    var brief by mutableStateOf<ProjectCreationBrief?>(null)
        private set

    var totalBudget by mutableStateOf("")
    var editableDuration by mutableStateOf("")
    var editablePaymentPlan by mutableStateOf("")
    var recommendedProviders by mutableStateOf<Map<String, List<ProjectCreationProviderCandidate>>>(emptyMap())
        private set
    var selectedProvidersByService by mutableStateOf<Map<String, Set<String>>>(emptyMap())
        private set
    var selectedMilestoneProviderByKey by mutableStateOf<Map<String, String>>(emptyMap())
        private set
    var isLoadingProviders by mutableStateOf(false)
        private set

    var isCreatingProject by mutableStateOf(false)
        private set
    var createdProject by mutableStateOf<DashboardProjectSummary?>(null)
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set
    var successMessage by mutableStateOf<String?>(null)
        private set

    private data class RealtimeContext(
        val token: String,
        val language: String,
    )

    private var realtimeContext: RealtimeContext? = null
    private var realtimeJob: Job? = null
    private var serviceLineCounter = 1
    private var milestoneCounter = 1
    private val _flowEvents = MutableSharedFlow<ProjectCreationFlowEvent>(extraBufferCapacity = 32)
    val flowEvents: SharedFlow<ProjectCreationFlowEvent> = _flowEvents.asSharedFlow()

    val wizardSteps: List<ProjectCreationWizardStep>
        get() = when (mode) {
            ProjectCreationMode.AI ->
                listOf(
                    ProjectCreationWizardStep.INTENT,
                    ProjectCreationWizardStep.RECOMMENDATION,
                    ProjectCreationWizardStep.BRIEFING,
                    ProjectCreationWizardStep.PROVIDERS,
                    ProjectCreationWizardStep.CONNECTIONS,
                    ProjectCreationWizardStep.REVIEW,
                )

            ProjectCreationMode.MANUAL ->
                listOf(
                    ProjectCreationWizardStep.INTENT,
                    ProjectCreationWizardStep.PROVIDERS,
                    ProjectCreationWizardStep.CONNECTIONS,
                    ProjectCreationWizardStep.REVIEW,
                )
        }

    val selectedManualServices: List<ProjectCreationServiceOption>
        get() = selectedManualServiceIds.mapNotNull { selectedManualServicesMap[it] }

    val selectedRecommendationServices: List<ProjectCreationServiceRecommendation>
        get() = recommendations.filter { selectedRecommendationIds.contains(it.id) }

    val selectedServicesForProviderRecommendations: List<ProjectCreationProviderServiceInput>
        get() = when (mode) {
            ProjectCreationMode.AI -> selectedRecommendationServices.map { recommendation ->
                ProjectCreationProviderServiceInput(
                    id = recommendation.serviceId,
                    name = recommendation.serviceName,
                )
            }

            ProjectCreationMode.MANUAL -> selectedManualServices.map { service ->
                ProjectCreationProviderServiceInput(
                    id = service.id,
                    name = service.name,
                )
            }
        }

    val currentStepIndex: Int
        get() = wizardSteps.indexOf(step).coerceAtLeast(0)

    val parsedTotalBudget: Double
        get() = parseNumber(totalBudget) ?: 0.0

    val reviewLines: List<ProjectCreationBriefLine>
        get() {
            val currentBrief = brief ?: return emptyList()
            return reviewLines(
                brief = currentBrief,
                budget = parsedTotalBudget,
            )
        }

    fun resetSession(defaultCurrency: AppCurrency) {
        mode = ProjectCreationMode.AI
        step = ProjectCreationWizardStep.INTENT
        intent = ""

        manualTitle = ""
        manualSpecificRequirements = ""
        manualDuration = ""
        manualPaymentPlan = "MILESTONE"
        manualCurrency = defaultCurrency.raw

        serviceSearch = ""
        groupedServices = emptyList()
        groupedServicesPage = 1
        groupedServicesHasMore = true
        isLoadingServices = false
        isLoadingMoreServices = false
        selectedManualServiceIds = emptyList()
        selectedManualServicesMap = emptyMap()
        manualLines = emptyList()

        recommendations = emptyList()
        selectedRecommendationIds = emptySet()
        isLoadingRecommendation = false

        aiMessages = emptyList()
        aiStatus = ProjectCreationAIStatus.CLARIFY
        aiQuestions = emptyList()
        aiClarificationAnswer = ""
        isLoadingBrief = false

        brief = null
        totalBudget = ""
        editableDuration = ""
        editablePaymentPlan = ""

        recommendedProviders = emptyMap()
        selectedProvidersByService = emptyMap()
        selectedMilestoneProviderByKey = emptyMap()
        isLoadingProviders = false

        isCreatingProject = false
        createdProject = null
        errorMessage = null
        successMessage = null

        serviceLineCounter = 1
        milestoneCounter = 1
    }

    fun attachRealtime(
        token: String,
        language: String,
    ) {
        realtimeContext = RealtimeContext(
            token = token.trim(),
            language = language.trim(),
        )
        if (realtimeJob == null) {
            realtimeJob = viewModelScope.launch {
                appContainer.realtimeService.events.collect { event ->
                    if (mode != ProjectCreationMode.AI || step != ProjectCreationWizardStep.BRIEFING) {
                        return@collect
                    }
                    when (event.name) {
                        TrustoraRealtimeEventNames.AI_BRIEF_GENERATED -> consumeRealtimeBriefGenerated(event.payload)
                        TrustoraRealtimeEventNames.AI_BRIEF_FAILED -> consumeRealtimeBriefFailed(event.payload)
                    }
                }
            }
        }
    }

    fun detachRealtime() {
        realtimeContext = null
        realtimeJob?.cancel()
        realtimeJob = null
    }

    fun applyMode(nextMode: ProjectCreationMode) {
        if (mode == nextMode) return

        mode = nextMode
        step = ProjectCreationWizardStep.INTENT
        errorMessage = null
        successMessage = null

        recommendations = emptyList()
        selectedRecommendationIds = emptySet()
        isLoadingRecommendation = false

        aiMessages = emptyList()
        aiStatus = ProjectCreationAIStatus.CLARIFY
        aiQuestions = emptyList()
        aiClarificationAnswer = ""
        isLoadingBrief = false

        if (nextMode == ProjectCreationMode.AI) {
            brief = null
            recommendedProviders = emptyMap()
            selectedProvidersByService = emptyMap()
            selectedMilestoneProviderByKey = emptyMap()
        }
    }

    fun goToPreviousStep() {
        val index = wizardSteps.indexOf(step)
        if (index > 0) {
            step = wizardSteps[index - 1]
        }
    }

    suspend fun loadGroupedServices(
        reset: Boolean,
        currency: AppCurrency,
    ) {
        if (reset) {
            groupedServicesPage = 1
            groupedServicesHasMore = true
            groupedServices = emptyList()
        }

        if (isLoadingServices || isLoadingMoreServices) return
        if (!reset && !groupedServicesHasMore) return

        if (reset) {
            isLoadingServices = true
        } else {
            isLoadingMoreServices = true
        }
        errorMessage = null

        runCatching {
            appContainer.projectCreationRepository.getProjectCreationServices(
                page = groupedServicesPage,
                limit = 3,
                search = serviceSearch.trim().ifEmpty { null },
                language = activeLanguageCode(),
                currency = currency,
                token = activeToken(),
            )
        }.onSuccess { response ->
            groupedServices = if (reset) {
                response.services
            } else {
                val existingIds = groupedServices.map { it.id }.toSet()
                groupedServices + response.services.filter { !existingIds.contains(it.id) }
            }

            groupedServicesHasMore = response.hasMore
            if (response.hasMore) {
                groupedServicesPage = response.page + 1
            }
            syncSelectedServicesFromLoadedPage()
        }.onFailure { error ->
            errorMessage = error.message ?: "Failed to load services."
            groupedServicesHasMore = false
        }

        isLoadingServices = false
        isLoadingMoreServices = false
    }

    fun shouldLoadNextServicesPage(
        afterServiceId: String,
        threshold: Int = 3,
    ): Boolean {
        if (!groupedServicesHasMore) return false
        val index = groupedServices.indexOfFirst { it.id == afterServiceId }
        if (index < 0) return false
        val trigger = maxOf(groupedServices.size - maxOf(1, threshold), 0)
        return index >= trigger
    }

    fun toggleManualService(
        service: ProjectCreationServiceOption,
        selected: Boolean,
    ) {
        if (selected) {
            if (!selectedManualServiceIds.contains(service.id)) {
                selectedManualServiceIds = selectedManualServiceIds + service.id
            }
            selectedManualServicesMap = selectedManualServicesMap.toMutableMap().apply {
                put(service.id, service)
            }
        } else {
            selectedManualServiceIds = selectedManualServiceIds.filterNot { it == service.id }
            selectedManualServicesMap = selectedManualServicesMap.toMutableMap().apply {
                remove(service.id)
            }
        }
        syncManualLinesWithSelectedServices()
    }

    fun updateManualLine(
        lineId: String,
        description: String? = null,
        budgetPercentage: String? = null,
    ) {
        manualLines = manualLines.map { line ->
            if (line.id != lineId) {
                line
            } else {
                line.copy(
                    description = description ?: line.description,
                    budgetPercentage = budgetPercentage ?: line.budgetPercentage,
                )
            }
        }
    }

    fun addManualMilestone(lineId: String) {
        val milestoneId = "manual-milestone-$milestoneCounter"
        milestoneCounter += 1

        manualLines = manualLines.map { line ->
            if (line.id != lineId) {
                line
            } else {
                line.copy(
                    milestones = line.milestones + ProjectCreationMilestoneDraft(
                        id = milestoneId,
                        title = "",
                        description = "",
                        percentage = "",
                        amount = "",
                    ),
                )
            }
        }
    }

    fun removeManualMilestone(
        lineId: String,
        milestoneId: String,
    ) {
        manualLines = manualLines.map { line ->
            if (line.id != lineId) {
                line
            } else {
                line.copy(
                    milestones = line.milestones.filterNot { it.id == milestoneId },
                )
            }
        }
    }

    fun updateManualMilestone(
        lineId: String,
        milestoneId: String,
        title: String? = null,
        description: String? = null,
        percentage: String? = null,
        amount: String? = null,
    ) {
        manualLines = manualLines.map { line ->
            if (line.id != lineId) {
                line
            } else {
                line.copy(
                    milestones = line.milestones.map { milestone ->
                        if (milestone.id != milestoneId) {
                            milestone
                        } else {
                            milestone.copy(
                                title = title ?: milestone.title,
                                description = description ?: milestone.description,
                                percentage = percentage ?: milestone.percentage,
                                amount = amount ?: milestone.amount,
                            )
                        }
                    },
                )
            }
        }
    }

    suspend fun continueFlow(user: AuthUser?) {
        when (step) {
            ProjectCreationWizardStep.INTENT -> {
                if (mode == ProjectCreationMode.AI) {
                    requestRecommendations()
                } else {
                    continueManualFlowToProviders()
                }
            }

            ProjectCreationWizardStep.RECOMMENDATION -> {
                confirmRecommendationAndStartBrief()
            }

            ProjectCreationWizardStep.BRIEFING -> {
                when (aiStatus) {
                    ProjectCreationAIStatus.FINAL -> continueFromBriefToProviders()
                    ProjectCreationAIStatus.CLARIFY -> sendClarification()
                    ProjectCreationAIStatus.PROCESSING -> Unit
                }
            }

            ProjectCreationWizardStep.PROVIDERS -> {
                step = ProjectCreationWizardStep.CONNECTIONS
            }

            ProjectCreationWizardStep.CONNECTIONS -> {
                if (canContinueFromConnections(user)) {
                    step = ProjectCreationWizardStep.REVIEW
                } else {
                    errorMessage = "Connect required provider accounts first."
                }
            }

            ProjectCreationWizardStep.REVIEW -> Unit
        }
    }

    suspend fun requestRecommendations() {
        val normalizedIntent = intent.trim()
        if (normalizedIntent.isEmpty()) {
            errorMessage = "Intent is required."
            return
        }

        isLoadingRecommendation = true
        errorMessage = null
        runCatching {
            appContainer.projectCreationRepository.recommendProjectCreationServices(
                brief = normalizedIntent,
                language = activeLanguageCode(),
                token = activeToken(),
            )
        }.onSuccess { result ->
            recommendations = result
            selectedRecommendationIds = result
                .filter { !it.isAlternative }
                .map { it.id }
                .toSet()
                .ifEmpty { result.map { it.id }.toSet() }
            step = ProjectCreationWizardStep.RECOMMENDATION
        }.onFailure { error ->
            errorMessage = error.message ?: "Failed to load recommendations."
        }
        isLoadingRecommendation = false
    }

    fun toggleRecommendation(recommendationId: String) {
        selectedRecommendationIds = selectedRecommendationIds.toMutableSet().apply {
            if (!add(recommendationId)) remove(recommendationId)
        }
    }

    suspend fun confirmRecommendationAndStartBrief() {
        val selectedServices = selectedRecommendationServices
        if (selectedServices.isEmpty()) {
            errorMessage = "Select at least one service."
            return
        }

        val lines = selectedServices.mapIndexed { index, service ->
            "${index + 1}. ${service.serviceName} (${providerLabel(service.deliveryProvider)})"
        }
        val content = buildString {
            append("Client intent: ${intent.trim()}")
            append("\n\n")
            append("Recommended services:\n")
            append(lines.joinToString("\n"))
            append("\n\n")
            append("Generate a modular project brief grouped by project lines with milestone amounts and budget percentages.")
        }

        val messages = listOf(
            ProjectCreationAIMessage(role = "user", content = content),
        )
        aiMessages = messages
        aiQuestions = emptyList()
        aiClarificationAnswer = ""
        brief = null
        recommendedProviders = emptyMap()
        selectedProvidersByService = emptyMap()
        selectedMilestoneProviderByKey = emptyMap()
        editableDuration = ""
        editablePaymentPlan = ""
        step = ProjectCreationWizardStep.BRIEFING

        requestBrief(messages = messages)
    }

    suspend fun sendClarification() {
        val normalizedAnswer = aiClarificationAnswer.trim()
        if (normalizedAnswer.isEmpty()) {
            errorMessage = "Answer is required."
            return
        }
        val messages = aiMessages + ProjectCreationAIMessage(role = "user", content = normalizedAnswer)
        aiMessages = messages
        aiClarificationAnswer = ""
        requestBrief(messages = messages)
    }

    suspend fun continueManualFlowToProviders() {
        val generatedBrief = buildBriefFromManualInput() ?: return
        brief = generatedBrief
        aiStatus = ProjectCreationAIStatus.FINAL
        aiQuestions = emptyList()
        editableDuration = generatedBrief.duration
        editablePaymentPlan = generatedBrief.paymentPlan

        if (totalBudget.trim().isEmpty()) {
            val inferredBudget = generatedBrief.lines
                .flatMap { it.milestones }
                .sumOf { it.amount }
            if (inferredBudget > 0.0) {
                totalBudget = inferredBudget.roundToInt().toString()
            }
        }

        loadProviderRecommendations()
        step = ProjectCreationWizardStep.PROVIDERS
    }

    suspend fun continueFromBriefToProviders() {
        if (brief == null) {
            errorMessage = "Brief is missing."
            return
        }
        loadProviderRecommendations()
        step = ProjectCreationWizardStep.PROVIDERS
    }

    fun providerOptions(serviceName: String): List<ProjectCreationProviderCandidate> {
        return recommendedProviders[serviceName].orEmpty()
    }

    fun isProviderSelected(serviceName: String, providerId: String): Boolean {
        return selectedProvidersByService[serviceKey(serviceName)].orEmpty().contains(providerId)
    }

    fun toggleProvider(serviceName: String, providerId: String) {
        val key = serviceKey(serviceName)
        val selected = selectedProvidersByService[key].orEmpty().toMutableSet()
        if (!selected.add(providerId)) {
            selected.remove(providerId)
        }

        selectedProvidersByService = selectedProvidersByService.toMutableMap().apply {
            put(key, selected)
        }

        selectedMilestoneProviderByKey = selectedMilestoneProviderByKey
            .filter { (assignmentKey, selectedProviderId) ->
                if (!assignmentKey.startsWith("$key::")) {
                    true
                } else {
                    selected.contains(selectedProviderId)
                }
            }
    }

    fun assignMilestone(
        serviceName: String,
        lineId: String,
        milestoneId: String,
        providerId: String,
    ) {
        val key = serviceKey(serviceName)
        val selected = selectedProvidersByService[key].orEmpty()
        if (!selected.contains(providerId)) return

        val assignmentKey = milestoneAssignmentKey(
            serviceName = serviceName,
            lineId = lineId,
            milestoneId = milestoneId,
        )
        selectedMilestoneProviderByKey = selectedMilestoneProviderByKey.toMutableMap().apply {
            put(assignmentKey, providerId)
        }
    }

    fun removeMilestoneAssignment(
        serviceName: String,
        lineId: String,
        milestoneId: String,
    ) {
        val assignmentKey = milestoneAssignmentKey(
            serviceName = serviceName,
            lineId = lineId,
            milestoneId = milestoneId,
        )
        selectedMilestoneProviderByKey = selectedMilestoneProviderByKey.toMutableMap().apply {
            remove(assignmentKey)
        }
    }

    fun selectedProviderIdForMilestone(
        serviceName: String,
        lineId: String,
        milestoneId: String,
    ): String? {
        return selectedMilestoneProviderByKey[
            milestoneAssignmentKey(
                serviceName = serviceName,
                lineId = lineId,
                milestoneId = milestoneId,
            ),
        ]
    }

    fun providerById(serviceName: String, providerId: String): ProjectCreationProviderCandidate? {
        return providerOptions(serviceName).firstOrNull { it.id == providerId }
    }

    fun requiredOAuthProviders(): List<ProjectCreationOAuthProvider> {
        val required = linkedSetOf<ProjectCreationOAuthProvider>()
        reviewLines.forEach { line ->
            oauthProvider(line.deliveryProvider)?.let(required::add)
        }
        return required.toList()
    }

    fun requiredServices(provider: ProjectCreationOAuthProvider): List<String> {
        val services = linkedSetOf<String>()
        reviewLines.forEach { line ->
            if (oauthProvider(line.deliveryProvider) == provider) {
                services.add(line.serviceName)
            }
        }
        return services.toList()
    }

    fun connectedOAuthProviders(user: AuthUser?): Set<ProjectCreationOAuthProvider> {
        if (user == null) return emptySet()
        val connected = linkedSetOf<ProjectCreationOAuthProvider>()
        user.connectedAccounts.forEach { account ->
            when (account.provider.lowercase(Locale.ROOT)) {
                "github" -> connected.add(ProjectCreationOAuthProvider.GITHUB)
                "figma" -> connected.add(ProjectCreationOAuthProvider.FIGMA)
                "google" -> connected.add(ProjectCreationOAuthProvider.GOOGLE)
            }
        }
        if (!user.githubToken.isNullOrBlank()) {
            connected.add(ProjectCreationOAuthProvider.GITHUB)
        }
        return connected
    }

    fun missingOAuthProviders(user: AuthUser?): List<ProjectCreationOAuthProvider> {
        val required = requiredOAuthProviders()
        val connected = connectedOAuthProviders(user)
        return required.filter { !connected.contains(it) }
    }

    fun canContinueFromConnections(user: AuthUser?): Boolean {
        if (brief == null) return false
        return missingOAuthProviders(user).isEmpty()
    }

    fun oauthRedirectUrl(provider: ProjectCreationOAuthProvider): String? {
        return appContainer.projectCreationRepository.oauthRedirectUrl(provider)
    }

    fun requestOAuthConnection(provider: ProjectCreationOAuthProvider): String? {
        val url = oauthRedirectUrl(provider) ?: return null
        emitFlowEvent(
            name = ProjectCreationFlowEventNames.PROJECT_OAUTH_CONNECT_REQUESTED,
            payload = mapOf("provider" to provider.name.lowercase(Locale.ROOT)),
        )
        return url
    }

    fun showRuntimeError(message: String?) {
        errorMessage = message
    }

    suspend fun createProject(
        userId: String,
        appCurrency: AppCurrency,
    ): Boolean {
        val finalBrief = brief
        if (finalBrief == null) {
            errorMessage = "Brief is missing."
            return false
        }

        val budget = parseNumber(totalBudget)
        if (budget == null || budget <= 0.0) {
            errorMessage = "Budget is invalid."
            return false
        }

        val duration = effectiveDuration(finalBrief).trim()
        if (duration.isEmpty()) {
            errorMessage = "Duration is required."
            return false
        }

        val paymentPlan = effectivePaymentPlan(finalBrief).trim().uppercase(Locale.ROOT)
        if (paymentPlan.isEmpty()) {
            errorMessage = "Payment plan is required."
            return false
        }

        val currencyCode = effectiveCurrency(finalBrief)

        isCreatingProject = true
        errorMessage = null
        successMessage = null
        emitFlowEvent(ProjectCreationFlowEventNames.PROJECT_CREATION_STARTED)

        val payload = makeCreatePayload(
            brief = finalBrief,
            budget = budget,
            userId = userId,
            paymentPlan = paymentPlan,
            duration = duration,
            currencyCode = currencyCode,
        )

        val created = runCatching {
            appContainer.projectCreationRepository.createClientProject(
                payload = payload,
                language = activeLanguageCode(),
                currency = appCurrency,
                token = activeToken(),
            )
        }.onFailure { error ->
            errorMessage = error.message ?: "Failed to create project."
        }.getOrNull()

        isCreatingProject = false

        if (created != null) {
            createdProject = created
            successMessage = "Project created successfully."
            emitFlowEvent(
                name = ProjectCreationFlowEventNames.PROJECT_CREATED,
                payload = mapOf(
                    "project_id" to created.id,
                    "project_slug" to created.slug.orEmpty(),
                ),
            )
            return true
        }

        return false
    }

    private suspend fun requestBrief(messages: List<ProjectCreationAIMessage>) {
        isLoadingBrief = true
        aiStatus = ProjectCreationAIStatus.PROCESSING
        aiQuestions = emptyList()
        errorMessage = null

        runCatching {
            appContainer.projectCreationRepository.buildProjectCreationBrief(
                locale = activeLanguageCode(),
                messages = messages,
                token = activeToken(),
            )
        }.onSuccess { response ->
            applyRealtimeAwareBriefResponse(response)
            if (response.status == ProjectCreationAIStatus.PROCESSING && !response.briefResultId.isNullOrBlank()) {
                runCatching {
                    appContainer.projectCreationRepository.getProjectCreationBriefResult(
                        id = response.briefResultId,
                        locale = activeLanguageCode(),
                        token = activeToken(),
                    )
                }.onSuccess { nextResponse ->
                    applyRealtimeAwareBriefResponse(nextResponse)
                }
            }
        }.onFailure { error ->
            aiStatus = ProjectCreationAIStatus.CLARIFY
            errorMessage = error.message ?: "Failed to generate brief."
        }

        isLoadingBrief = false
    }

    private suspend fun consumeRealtimeBriefGenerated(payload: JsonElement) {
        val token = activeTokenOrNull() ?: return
        val language = activeLanguageCodeOrNull() ?: return
        val resultId = appContainer.projectCreationRepository.extractProjectCreationBriefResultId(payload)

        if (!resultId.isNullOrBlank()) {
            isLoadingBrief = false
            errorMessage = null
            aiStatus = ProjectCreationAIStatus.PROCESSING
            runCatching {
                appContainer.projectCreationRepository.getProjectCreationBriefResult(
                    id = resultId,
                    locale = language,
                    token = token,
                )
            }.onSuccess { response ->
                applyRealtimeAwareBriefResponse(response)
            }.onFailure { error ->
                aiStatus = ProjectCreationAIStatus.CLARIFY
                errorMessage = error.message ?: "Failed to refresh brief result."
            }
            return
        }

        val response = appContainer.projectCreationRepository.normalizeProjectCreationAIBriefPayload(
            payload = payload,
            language = language,
        )
        if (response != null) {
            isLoadingBrief = false
            errorMessage = null
            applyRealtimeAwareBriefResponse(response)
        }
    }

    private fun consumeRealtimeBriefFailed(payload: JsonElement) {
        isLoadingBrief = false
        aiStatus = ProjectCreationAIStatus.CLARIFY
        errorMessage = appContainer.projectCreationRepository.extractProjectCreationBriefFailureMessage(payload)
            ?: "Brief generation failed."
    }

    private fun applyRealtimeAwareBriefResponse(response: ProjectCreationAIBriefResponse) {
        if (aiStatus == ProjectCreationAIStatus.FINAL && response.status != ProjectCreationAIStatus.FINAL) {
            return
        }
        if (response.status == ProjectCreationAIStatus.PROCESSING && aiStatus == ProjectCreationAIStatus.CLARIFY) {
            return
        }
        applyBriefResponse(response)
    }

    private fun applyBriefResponse(response: ProjectCreationAIBriefResponse) {
        aiStatus = response.status
        aiQuestions = response.questions

        response.finalBrief?.let { finalBrief ->
            brief = finalBrief
            if (editableDuration.trim().isEmpty()) {
                editableDuration = finalBrief.duration
            }
            if (editablePaymentPlan.trim().isEmpty()) {
                editablePaymentPlan = finalBrief.paymentPlan
            }
        }

        if (response.recommendedProviders.isNotEmpty()) {
            recommendedProviders = response.recommendedProviders
            autoSelectRecommendedProviders()
        }
    }

    private suspend fun loadProviderRecommendations() {
        val services = selectedServicesForProviderRecommendations
        if (services.isEmpty()) {
            recommendedProviders = emptyMap()
            selectedProvidersByService = emptyMap()
            selectedMilestoneProviderByKey = emptyMap()
            return
        }

        isLoadingProviders = true
        errorMessage = null
        runCatching {
            appContainer.projectCreationRepository.recommendProjectCreationProviders(
                projectTitle = generatedProjectTitle(),
                description = generatedProjectDescription(),
                services = services,
                specificRequirements = normalizedSpecificRequirements(),
                language = activeLanguageCode(),
                token = activeToken(),
            )
        }.onSuccess { providers ->
            recommendedProviders = providers
            autoSelectRecommendedProviders()
        }.onFailure { error ->
            recommendedProviders = emptyMap()
            selectedProvidersByService = emptyMap()
            selectedMilestoneProviderByKey = emptyMap()
            errorMessage = error.message ?: "Failed to load provider recommendations."
        }
        isLoadingProviders = false
    }

    private fun generatedProjectTitle(): String {
        return when (mode) {
            ProjectCreationMode.MANUAL ->
                manualTitle.trim().ifEmpty { fallbackProjectTitle(intent) }

            ProjectCreationMode.AI ->
                brief?.title?.trim()?.ifEmpty { fallbackProjectTitle(intent) } ?: fallbackProjectTitle(intent)
        }
    }

    private fun generatedProjectDescription(): String {
        return when (mode) {
            ProjectCreationMode.MANUAL -> intent.trim()
            ProjectCreationMode.AI -> brief?.description?.trim().takeUnless { it.isNullOrEmpty() } ?: intent.trim()
        }
    }

    private fun normalizedSpecificRequirements(): List<String> {
        val fromManual = manualSpecificRequirements
            .split("\n")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
        if (fromManual.isNotEmpty()) {
            return fromManual
        }
        return brief?.specificRequirements.orEmpty()
    }

    private fun autoSelectRecommendedProviders() {
        val selected = mutableMapOf<String, Set<String>>()
        recommendedProviders.forEach { (serviceName, providers) ->
            selected[serviceKey(serviceName)] = providers.map { it.id }.toSet()
        }
        selectedProvidersByService = selected

        val currentBrief = brief ?: return
        val assignments = mutableMapOf<String, String>()
        currentBrief.lines.forEach { line ->
            val key = serviceKey(line.serviceName)
            val firstProviderId = selected[key]?.firstOrNull() ?: return@forEach
            line.milestones.forEach { milestone ->
                assignments[milestoneAssignmentKey(line.serviceName, line.id, milestone.id)] = firstProviderId
            }
        }
        selectedMilestoneProviderByKey = assignments
    }

    private fun effectiveDuration(brief: ProjectCreationBrief): String {
        return editableDuration.trim().ifEmpty {
            brief.duration.takeIf { it.isNotBlank() } ?: manualDuration.trim()
        }
    }

    private fun effectivePaymentPlan(brief: ProjectCreationBrief): String {
        return editablePaymentPlan.trim().ifEmpty {
            brief.paymentPlan.takeIf { it.isNotBlank() } ?: manualPaymentPlan.trim()
        }
    }

    private fun effectiveCurrency(brief: ProjectCreationBrief): String {
        return brief.currency.trim()
            .ifEmpty { manualCurrency.trim().ifEmpty { "USD" } }
            .uppercase(Locale.ROOT)
    }

    private fun makeCreatePayload(
        brief: ProjectCreationBrief,
        budget: Double,
        userId: String,
        paymentPlan: String,
        duration: String,
        currencyCode: String,
    ): JsonObject {
        val linesForReview = reviewLines(
            brief = brief,
            budget = budget,
        )

        val linePayloads = JsonArray()
        val briefLinePayloads = JsonArray()

        linesForReview.forEachIndexed { index, line ->
            val budgetAllocation = (budget * line.budgetPercentage) / 100.0
            val milestones = JsonArray().apply {
                line.milestones.forEach { milestone ->
                    val selectedProviderId = selectedMilestoneProviderByKey[
                        milestoneAssignmentKey(
                            serviceName = line.serviceName,
                            lineId = line.id,
                            milestoneId = milestone.id,
                        ),
                    ]?.toIntOrNull()
                    add(
                        JsonObject().apply {
                            addProperty("title", milestone.title)
                            milestone.description.trim().takeIf { it.isNotEmpty() }?.let {
                                addProperty("description", it)
                            }
                            milestone.percentage?.let { addProperty("percentage", it) }
                            addProperty("amount", milestone.amount)
                            if (selectedProviderId != null && selectedProviderId > 0) {
                                addProperty("assigned_provider_id", selectedProviderId)
                            }
                        },
                    )
                }
            }

            val linePayload = JsonObject().apply {
                addProperty("id", line.id.ifBlank { "line-${index + 1}" })
                line.serviceId?.takeIf { it.isNotBlank() }?.let { addProperty("service_id", it) }
                addProperty("service_name", line.serviceName)
                addProperty("delivery_provider", line.deliveryProvider)
                addProperty("status", "pending")
                addProperty("price", budgetAllocation)
                addProperty("budget_allocation", line.budgetPercentage)
                addProperty("budget_percentage", line.budgetPercentage)
                add("milestones", milestones)
                addProperty("description", line.description)
            }
            linePayloads.add(linePayload)

            val briefLinePayload = JsonObject().apply {
                line.serviceId?.takeIf { it.isNotBlank() }?.let { addProperty("service_id", it) }
                addProperty("service_name", line.serviceName)
                addProperty("delivery_provider", line.deliveryProvider)
                addProperty("description", line.description)
                addProperty("budget_percentage", line.budgetPercentage)
                add("milestones", milestones.deepCopy())
            }
            briefLinePayloads.add(briefLinePayload)
        }

        val briefPayload = JsonObject().apply {
            addProperty("title", brief.title)
            add("project_lines", briefLinePayloads)
            addProperty("duration", duration)
            addProperty("recommended_duration", duration)
            addProperty("project_duration", duration)
            addProperty("payment_plan", paymentPlan)
            add("selected_providers", selectedProvidersPayload())
        }

        return JsonObject().apply {
            addProperty("clientId", userId)
            addProperty("title", fallbackProjectTitle(brief.title))
            addProperty("description", brief.description.takeIf { it.isNotBlank() } ?: intent.trim())
            addProperty("budget", budget)
            addProperty("currency", currencyCode)
            addProperty("paymentPlan", paymentPlan)
            addProperty("duration", duration)
            add("brief", briefPayload)
            add("project_lines", linePayloads)
        }
    }

    private fun selectedProvidersPayload(): JsonArray {
        val seen = mutableSetOf<String>()
        return JsonArray().apply {
            recommendedProviders.forEach { (serviceName, providers) ->
                val selected = selectedProvidersByService[serviceKey(serviceName)].orEmpty()
                providers.forEach { provider ->
                    if (!selected.contains(provider.id)) return@forEach
                    if (!seen.add(provider.id)) return@forEach
                    val providerId = provider.id.toIntOrNull() ?: return@forEach

                    add(
                        JsonObject().apply {
                            addProperty("id", providerId)
                            provider.firstName.trim().takeIf { it.isNotEmpty() }?.let { addProperty("firstName", it) }
                            provider.lastName.trim().takeIf { it.isNotEmpty() }?.let { addProperty("lastName", it) }
                            provider.avatarUrl?.trim()?.takeIf { it.isNotEmpty() }?.let { addProperty("avatar", it) }
                            provider.matchScore?.let { addProperty("matchScore", it) }
                            addProperty("service_name", provider.serviceName ?: serviceName)
                        },
                    )
                }
            }
        }
    }

    private fun reviewLines(
        brief: ProjectCreationBrief,
        budget: Double,
    ): List<ProjectCreationBriefLine> {
        if (budget <= 0.0) return brief.lines
        return brief.lines.map { line ->
            val allocated = (budget * line.budgetPercentage) / 100.0
            val updatedMilestones = line.milestones.map { milestone ->
                if (milestone.amount > 0.0) {
                    milestone
                } else {
                    val fallbackAmount = milestone.percentage?.let { allocated * it / 100.0 } ?: 0.0
                    milestone.copy(amount = fallbackAmount)
                }
            }
            line.copy(milestones = updatedMilestones)
        }
    }

    private fun buildBriefFromManualInput(): ProjectCreationBrief? {
        val title = manualTitle.trim().ifEmpty { fallbackProjectTitle(intent) }
        if (title.isBlank()) {
            errorMessage = "Title is required."
            return null
        }

        if (selectedManualServices.isEmpty()) {
            errorMessage = "Select at least one service."
            return null
        }

        val lines = manualLines.mapNotNull { line ->
            val percentage = parseNumber(line.budgetPercentage)
            if (percentage == null || percentage <= 0.0) {
                return@mapNotNull null
            }

            val milestones = line.milestones.mapNotNull { milestone ->
                val amount = parseNumber(milestone.amount)
                if (amount == null || amount <= 0.0) {
                    return@mapNotNull null
                }

                ProjectCreationBriefMilestone(
                    id = milestone.id,
                    title = milestone.title.trim().ifEmpty { "Milestone" },
                    description = milestone.description.trim(),
                    percentage = parseNumber(milestone.percentage),
                    amount = amount,
                    assignedProviderId = null,
                )
            }

            ProjectCreationBriefLine(
                id = line.id,
                serviceId = line.serviceId,
                serviceName = line.serviceName,
                deliveryProvider = line.deliveryProvider,
                description = line.description.trim(),
                budgetPercentage = percentage,
                milestones = milestones,
            )
        }

        if (lines.isEmpty()) {
            errorMessage = "Invalid project lines."
            return null
        }

        val totalPercentage = lines.sumOf { it.budgetPercentage }
        if (totalPercentage > 100.0001) {
            errorMessage = "Total line budget percentage cannot exceed 100%."
            return null
        }

        return ProjectCreationBrief(
            title = title,
            description = intent.trim(),
            lines = lines,
            technologies = selectedManualServices.map { it.name },
            specificRequirements = normalizedSpecificRequirements(),
            duration = manualDuration.trim(),
            paymentPlan = manualPaymentPlan.trim().uppercase(Locale.ROOT),
            currency = manualCurrency.trim().uppercase(Locale.ROOT).ifEmpty { "USD" },
        )
    }

    private fun emitFlowEvent(
        name: String,
        payload: Map<String, String> = emptyMap(),
    ) {
        _flowEvents.tryEmit(
            ProjectCreationFlowEvent(
                name = name,
                payload = payload,
            ),
        )
    }

    private fun syncSelectedServicesFromLoadedPage() {
        val updated = selectedManualServicesMap.toMutableMap()
        groupedServices.forEach { service ->
            if (selectedManualServiceIds.contains(service.id)) {
                updated[service.id] = service
            }
        }
        selectedManualServicesMap = updated
    }

    private fun syncManualLinesWithSelectedServices() {
        val selectedServices = selectedManualServices
        val existingByServiceId = manualLines.associateBy { it.serviceId }

        manualLines = selectedServices.map { service ->
            val existing = existingByServiceId[service.id]
            if (existing != null) {
                existing.copy(
                    serviceId = service.id,
                    serviceName = service.name,
                    deliveryProvider = service.deliveryProvider,
                )
            } else {
                val lineId = "manual-line-$serviceLineCounter"
                serviceLineCounter += 1
                ProjectCreationLineDraft(
                    id = lineId,
                    serviceId = service.id,
                    serviceName = service.name,
                    deliveryProvider = service.deliveryProvider,
                    description = "",
                    budgetPercentage = "",
                    milestones = emptyList(),
                )
            }
        }
    }

    private fun parseNumber(value: String): Double? {
        val normalized = value.replace(",", ".").trim()
        if (normalized.isEmpty()) return null
        return normalized.toDoubleOrNull()
    }

    private fun providerLabel(deliveryProvider: String): String {
        return when (deliveryProvider.lowercase(Locale.ROOT)) {
            "github" -> "GitHub"
            "figma" -> "Figma"
            "google_drive" -> "Google Drive"
            "google_analytics" -> "Google Analytics"
            else -> "Manual Upload"
        }
    }

    private fun fallbackProjectTitle(source: String): String {
        val value = source.trim()
        if (value.isEmpty()) return "Modular Project"
        if (value.length <= 80) return value
        return "${value.take(77)}..."
    }

    private fun oauthProvider(deliveryProvider: String): ProjectCreationOAuthProvider? {
        return when (deliveryProvider.lowercase(Locale.ROOT)) {
            "github" -> ProjectCreationOAuthProvider.GITHUB
            "figma" -> ProjectCreationOAuthProvider.FIGMA
            "google_drive", "google_analytics" -> ProjectCreationOAuthProvider.GOOGLE
            else -> null
        }
    }

    private fun serviceKey(value: String): String = value.trim().lowercase(Locale.ROOT)

    private fun milestoneAssignmentKey(
        serviceName: String,
        lineId: String,
        milestoneId: String,
    ): String {
        return "${serviceKey(serviceName)}::$lineId::$milestoneId"
    }

    private fun activeToken(): String {
        return activeTokenOrNull() ?: throw IllegalStateException("Missing access token.")
    }

    private fun activeTokenOrNull(): String? {
        return realtimeContext?.token?.takeIf { it.isNotBlank() }
    }

    private fun activeLanguageCode(): String {
        return activeLanguageCodeOrNull() ?: "en"
    }

    private fun activeLanguageCodeOrNull(): String? {
        return realtimeContext?.language?.takeIf { it.isNotBlank() }
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
            return CreateProjectViewModel(appContainer) as T
        }
    }
}

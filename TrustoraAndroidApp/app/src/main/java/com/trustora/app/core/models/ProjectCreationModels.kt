package com.trustora.app.core.models

enum class ProjectCreationMode {
    AI,
    MANUAL,
}

enum class ProjectCreationWizardStep {
    INTENT,
    RECOMMENDATION,
    BRIEFING,
    PROVIDERS,
    CONNECTIONS,
    REVIEW,
}

enum class ProjectCreationOAuthProvider {
    GITHUB,
    FIGMA,
    GOOGLE,
}

enum class ProjectCreationAIStatus {
    PROCESSING,
    CLARIFY,
    FINAL,
}

data class ProjectCreationServiceOption(
    val id: String,
    val name: String,
    val description: String,
    val categoryName: String,
    val categoryId: String? = null,
    val subcategoryName: String? = null,
    val deliveryProvider: String = "manual_upload",
)

data class ProjectCreationServicesPage(
    val services: List<ProjectCreationServiceOption>,
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int,
    val hasMore: Boolean,
)

data class ProjectCreationServiceRecommendation(
    val id: String,
    val serviceId: String? = null,
    val serviceName: String,
    val deliveryProvider: String,
    val description: String = "",
    val categoryName: String? = null,
    val isAlternative: Boolean = false,
)

data class ProjectCreationProviderCandidate(
    val id: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String? = null,
    val matchScore: Double? = null,
    val serviceName: String? = null,
) {
    val displayName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { "Provider" }
}

data class ProjectCreationProviderServiceInput(
    val id: String? = null,
    val name: String,
)

data class ProjectCreationMilestoneDraft(
    val id: String,
    val title: String,
    val description: String,
    val percentage: String,
    val amount: String,
)

data class ProjectCreationLineDraft(
    val id: String,
    val serviceId: String,
    val serviceName: String,
    val deliveryProvider: String,
    val description: String,
    val budgetPercentage: String,
    val milestones: List<ProjectCreationMilestoneDraft>,
)

data class ProjectCreationAIMessage(
    val role: String,
    val content: String,
)

data class ProjectCreationBriefMilestone(
    val id: String,
    val title: String,
    val description: String,
    val percentage: Double? = null,
    val amount: Double,
    val assignedProviderId: String? = null,
)

data class ProjectCreationBriefLine(
    val id: String,
    val serviceId: String? = null,
    val serviceName: String,
    val deliveryProvider: String,
    val description: String,
    val budgetPercentage: Double,
    val milestones: List<ProjectCreationBriefMilestone>,
)

data class ProjectCreationBrief(
    val title: String,
    val description: String,
    val lines: List<ProjectCreationBriefLine>,
    val technologies: List<String>,
    val specificRequirements: List<String>,
    val duration: String,
    val paymentPlan: String,
    val currency: String,
)

data class ProjectCreationAIBriefResponse(
    val status: ProjectCreationAIStatus,
    val briefResultId: String? = null,
    val questions: List<String> = emptyList(),
    val finalBrief: ProjectCreationBrief? = null,
    val recommendedProviders: Map<String, List<ProjectCreationProviderCandidate>> = emptyMap(),
)

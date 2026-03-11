package com.trustora.app.core.models

data class AuthCompany(
    val id: String? = null,
    val name: String? = null,
    val idType: String? = null,
    val idNumber: String? = null,
    val companyCountry: String? = null,
    val companyCounty: String? = null,
    val companyCity: String? = null,
    val companyZip: String? = null,
    val companyAddress: String? = null,
    val companyBankIban: String? = null,
    val companyBankBic: String? = null,
    val companyBankName: String? = null,
    val bankCurrency: String? = null,
)

data class AuthConnectedAccount(
    val id: String,
    val provider: String,
    val providerId: String? = null,
    val expiresAt: String? = null,
)

data class AuthUser(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String? = null,
    val roles: List<String> = emptyList(),
    val permissions: List<String> = emptyList(),
    val isSuperuser: Boolean = false,
    val phone: String? = null,
    val avatar: String? = null,
    val companyName: String? = null,
    val company: AuthCompany? = null,
    val githubToken: String? = null,
    val connectedAccounts: List<AuthConnectedAccount> = emptyList(),
    val rapydWalletId: String? = null,
    val rapydContactId: String? = null,
) {
    val displayName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { email }

    val roleSlugs: List<String>
        get() = buildSet {
            role?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }?.let(::add)
            roles.map { it.trim().lowercase() }.filter { it.isNotEmpty() }.forEach(::add)
        }.toList()

    fun hasRole(roleSlug: String): Boolean {
        val normalized = roleSlug.trim().lowercase()
        if (normalized.isEmpty()) return false
        return roleSlugs.any { it == normalized }
    }

    val initials: String
        get() {
            val first = firstName.firstOrNull()?.uppercase() ?: ""
            val last = lastName.firstOrNull()?.uppercase() ?: ""
            return (first + last).ifEmpty { "U" }
        }
}

data class AuthSession(
    val accessToken: String,
    val user: AuthUser,
)

data class MarketplaceCategory(
    val id: String,
    val name: String,
)

data class MarketplaceServiceProvider(
    val id: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String? = null,
    val rating: Double? = null,
) {
    val displayName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { "Provider" }

    val initials: String
        get() {
            val first = firstName.firstOrNull()?.uppercase() ?: ""
            val last = lastName.firstOrNull()?.uppercase() ?: ""
            return (first + last).ifEmpty { "P" }
        }
}

data class MarketplaceService(
    val id: String,
    val name: String,
    val description: String,
    val categoryName: String,
    val isFeatured: Boolean,
    val technologies: List<String>,
    val providers: List<MarketplaceServiceProvider>,
)

data class MarketplaceServicesPage(
    val services: List<MarketplaceService>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int,
)

data class DashboardStats(
    val role: String,
    val values: Map<String, Double> = emptyMap(),
)

data class AdminDashboardStats(
    val totalUsers: Int = 0,
    val currentMonthUsers: Int = 0,
    val currentMonthVsLastMonthUsers: Double = 0.0,
    val activeServices: Int = 0,
    val currentMonthServices: Int = 0,
    val currentMonthVsLastMonthServices: Double = 0.0,
    val totalProjects: Int = 0,
    val currentMonthProjects: Int = 0,
    val totalPendingProjects: Int = 0,
    val currentMonthVsLastMonthProjects: Double = 0.0,
    val totalRevenue: Double = 0.0,
    val currentMonthRevenue: Double = 0.0,
    val currentMonthVsLastMonthRevenue: Double = 0.0,
    val pendingUsers: Int = 0,
    val pendingServices: Int = 0,
    val pendingCalls: Int = 0,
    val totalScheduleCalls: Int = 0,
)

data class DashboardBudget(
    val amount: Double? = null,
    val currency: String = "USD",
    val originalUsd: Double? = null,
)

data class DashboardProjectMilestone(
    val id: String,
    val title: String,
    val amount: Double? = null,
    val proposedAmount: Double? = null,
    val percentage: Double? = null,
    val status: String,
    val budgetStatus: String = "PENDING",
    val paymentStatus: String? = null,
    val assignedProviderId: String? = null,
    val serviceName: String? = null,
    val projectLineId: String? = null,
    val sortOrder: Int? = null,
)

data class DashboardProjectSummary(
    val id: String,
    val slug: String? = null,
    val title: String,
    val description: String,
    val status: String,
    val budget: DashboardBudget,
    val createdAtIso: String? = null,
    val category: String? = null,
    val deadline: String? = null,
    val offersCount: Int = 0,
    val milestoneCount: Int = 0,
    val providersCount: Int = 0,
    val milestones: List<DashboardProjectMilestone> = emptyList(),
)

data class DashboardRecentActivity(
    val id: String,
    val title: String,
    val timeAgo: String? = null,
    val action: String? = null,
    val type: String? = null,
    val actorName: String? = null,
    val actorRole: String? = null,
    val createdAtIso: String? = null,
)

data class DashboardServiceItem(
    val id: String,
    val title: String,
    val category: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null,
    val orderCount: Int? = null,
    val level: String? = null,
    val priceAmount: Double? = null,
    val currency: String? = null,
) {
    val name: String
        get() = title

    val categoryName: String
        get() = category ?: "General"
}

data class DashboardChatGroup(
    val id: String,
    val name: String,
    val type: String,
    val unreadCount: Int,
    val lastMessage: String? = null,
    val updatedAtIso: String? = null,
)

data class DashboardChatMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val timestampIso: String? = null,
    val isRead: Boolean = false,
)

data class DashboardWalletBalance(
    val id: String,
    val currency: String,
    val balance: Double? = null,
    val receivedBalance: Double? = null,
    val onHoldBalance: Double? = null,
)

data class DashboardRapydOnboarding(
    val url: String? = null,
    val walletId: String? = null,
    val contactId: String? = null,
)

data class DashboardCompanySearchResult(
    val id: String,
    val name: String,
    val taxId: String? = null,
    val tradeRegistryNumber: String? = null,
    val companyCountry: String? = null,
    val companyCity: String? = null,
    val companyZip: String? = null,
    val companyAddress: String? = null,
)

data class DashboardCurrencyOption(
    val code: String,
    val name: String,
    val countryCode: String? = null,
) {
    val id: String
        get() = code.uppercase()
}

data class DashboardCompanyUser(
    val id: String,
    val userId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val avatar: String? = null,
) {
    val displayName: String
        get() {
            val fullName = listOf(firstName.orEmpty(), lastName.orEmpty())
                .joinToString(" ")
                .trim()
            if (fullName.isNotEmpty()) return fullName
            if (!email.isNullOrBlank()) return email
            if (!userId.isNullOrBlank()) return "User $userId"
            return "User"
        }

    val normalizedEmail: String?
        get() = email?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
}

data class DashboardCompanyDetailsPayload(
    val companyId: String? = null,
    val name: String,
    val representedBy: String,
    val email: String,
    val companyAddress: String,
    val companyCity: String,
    val companyCounty: String,
    val companyZip: String,
    val companyCountry: String,
    val companyBankIban: String,
    val companyBankName: String,
    val companyBankBic: String,
    val idType: String,
    val idNumber: String,
    val bankCurrency: String,
)

data class DashboardLocationCountry(
    val isoCode: String,
    val name: String,
    val flag: String = "",
) {
    val id: String
        get() = isoCode
}

data class DashboardLocationState(
    val isoCode: String,
    val name: String,
    val countryCode: String,
) {
    val id: String
        get() = "$countryCode-$isoCode"
}

data class DashboardLocationCity(
    val name: String,
    val countryCode: String,
    val stateCode: String,
) {
    val id: String
        get() = "$countryCode-$stateCode-${name.lowercase()}"
}

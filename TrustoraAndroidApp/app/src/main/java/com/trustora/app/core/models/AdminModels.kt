package com.trustora.app.core.models

data class AdminUserListItem(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String? = null,
    val avatarUrl: String? = null,
    val role: String = "CLIENT",
    val roles: List<String> = emptyList(),
    val status: String = "ACTIVE",
    val isSuperuser: Boolean = false,
    val isVerified: Boolean = false,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val createdAtIso: String? = null,
    val profileUrl: String? = null,
) {
    val displayName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { email }

    val initials: String
        get() {
            val first = firstName.firstOrNull()?.uppercase() ?: ""
            val last = lastName.firstOrNull()?.uppercase() ?: ""
            return (first + last).ifEmpty { "U" }
        }

    fun hasRole(roleSlug: String): Boolean {
        val normalized = roleSlug.trim().uppercase()
        if (normalized.isEmpty()) return false
        return role == normalized || roles.any { it.trim().uppercase() == normalized }
    }
}

data class AdminUsersCollection(
    val users: List<AdminUserListItem> = emptyList(),
    val total: Int = 0,
    val page: Int? = null,
    val perPage: Int? = null,
    val lastPage: Int? = null,
)

enum class AdminRolesTab(
    val titleKey: String,
) {
    ROLES("admin.roles.tabs.roles"),
    PERMISSIONS("admin.roles.tabs.permissions"),
}

data class AdminRoleSummary(
    val id: String,
    val name: String,
    val slug: String,
    val description: String,
    val sortOrder: Int? = null,
    val permissionsCount: Int = 0,
)

data class AdminRolesCollection(
    val roles: List<AdminRoleSummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val lastPage: Int = 1,
    val pageSize: Int = 10,
)

data class AdminRoleLite(
    val id: String,
    val name: String,
    val slug: String,
)

data class AdminPermissionSummary(
    val id: String,
    val groupId: String? = null,
    val name: String,
    val slug: String,
    val description: String = "",
    val isActive: Boolean = true,
)

data class AdminPermissionGroup(
    val id: String,
    val name: String,
    val slug: String,
    val permissions: List<AdminPermissionSummary> = emptyList(),
)

data class AdminRoleDetail(
    val id: String,
    val name: String,
    val slug: String,
    val description: String,
    val sortOrder: Int = 0,
    val permissionIds: List<String> = emptyList(),
)

data class AdminCreateRolePayload(
    val name: String,
    val description: String,
    val permissionIds: List<String> = emptyList(),
)

data class AdminUpdateRolePayload(
    val name: String,
    val description: String,
    val permissionIds: List<String> = emptyList(),
)

data class AdminRoleEditorDraft(
    val roleId: String? = null,
    val name: String = "",
    val description: String = "",
    val sortOrder: Int = 0,
    val permissionIds: Set<String> = emptySet(),
) {
    val isValid: Boolean
        get() = name.trim().isNotEmpty() && description.trim().isNotEmpty()
}

data class AdminEarlyAccessProviderEntry(
    val id: String,
    val applicationId: String = "-",
    val fullName: String = "-",
    val email: String = "-",
    val country: String? = null,
    val language: String = "-",
    val score: Int = 0,
    val isEmailVerified: Boolean = false,
    val isEmailVerificationExpired: Boolean = false,
    val emailVerificationSentAtIso: String? = null,
    val emailVerificationExpiresAtIso: String? = null,
    val createdAtIso: String? = null,
)

data class AdminEarlyAccessClientEntry(
    val id: String,
    val applicationId: String = "-",
    val contactName: String = "-",
    val companyName: String = "-",
    val email: String = "-",
    val country: String? = null,
    val language: String = "-",
    val score: Int = 0,
    val isEmailVerified: Boolean = false,
    val isEmailVerificationExpired: Boolean = false,
    val emailVerificationSentAtIso: String? = null,
    val emailVerificationExpiresAtIso: String? = null,
    val createdAtIso: String? = null,
)

data class AdminEarlyAccessPagination(
    val currentPage: Int,
    val perPage: Int,
    val total: Int,
    val lastPage: Int,
)

data class AdminEarlyAccessGroupedCollection(
    val providers: List<AdminEarlyAccessProviderEntry> = emptyList(),
    val clients: List<AdminEarlyAccessClientEntry> = emptyList(),
    val pagination: AdminEarlyAccessPagination? = null,
)

enum class AdminEarlyAccessTab(val titleKey: String) {
    PROVIDERS("admin.early_access.providers.title"),
    CLIENTS("admin.early_access.clients.title"),
}

data class AdminServiceSummary(
    val id: String,
    val name: String,
    val description: String,
    val status: String,
    val isFeatured: Boolean,
    val slug: String,
    val categoryId: String? = null,
    val categoryName: String = "-",
    val categorySlug: String? = null,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val orderCount: Int = 0,
    val viewCount: Int = 0,
)

data class AdminServicesCollection(
    val services: List<AdminServiceSummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val perPage: Int = 20,
    val lastPage: Int = 1,
)

data class AdminServiceDetail(
    val id: String,
    val name: String,
    val slug: String,
    val description: String,
    val requirements: String,
    val categoryId: String,
    val categorySlug: String? = null,
    val deliveryProvider: String,
    val skills: List<String> = emptyList(),
    val tags: List<String> = emptyList(),
    val status: String = "DRAFT",
)

data class AdminServiceCategoryOption(
    val id: String,
    val name: String,
    val parentId: String? = null,
    val slug: String? = null,
)

data class AdminCategorySummary(
    val id: String,
    val name: String,
    val description: String,
    val slug: String,
    val parentId: String? = null,
    val sortOrder: Int = 0,
    val icon: String? = null,
    val isActive: Boolean = true,
)

data class AdminCategoriesCollection(
    val categories: List<AdminCategorySummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val perPage: Int = 20,
    val lastPage: Int = 1,
)

data class AdminCategoryDetail(
    val id: String,
    val name: String,
    val slug: String,
    val description: String,
    val icon: String,
    val parentId: String? = null,
    val sortOrder: Int = 0,
    val isActive: Boolean = true,
)

enum class AdminCategoryEditorMode {
    CREATE,
    EDIT,
}

data class AdminCategoryEditorDraft(
    val name: String = "",
    val slug: String = "",
    val description: String = "",
    val icon: String = "",
    val parentId: String = "",
    val sortOrder: Int = 0,
) {
    val isValid: Boolean
        get() = name.trim().isNotEmpty() && slug.trim().isNotEmpty()

    fun apply(detail: AdminCategoryDetail): AdminCategoryEditorDraft {
        return copy(
            name = detail.name,
            slug = detail.slug,
            description = detail.description,
            icon = detail.icon,
            parentId = detail.parentId.orEmpty(),
            sortOrder = detail.sortOrder,
        )
    }
}

enum class AdminLegalClausesSortBy(
    val rawValue: String,
    val titleKey: String,
) {
    CREATED_AT(
        rawValue = "created_at",
        titleKey = "admin.legal_clauses.sort.created_at",
    ),
    UPDATED_AT(
        rawValue = "updated_at",
        titleKey = "admin.legal_clauses.sort.updated_at",
    ),
    IDENTIFIER(
        rawValue = "identifier",
        titleKey = "admin.legal_clauses.sort.identifier",
    ),
    CATEGORY(
        rawValue = "category",
        titleKey = "admin.legal_clauses.sort.category",
    ),
}

enum class AdminLegalClausesSortDirection(
    val rawValue: String,
    val titleKey: String,
) {
    DESCENDING(
        rawValue = "desc",
        titleKey = "admin.legal_clauses.sort_direction.desc",
    ),
    ASCENDING(
        rawValue = "asc",
        titleKey = "admin.legal_clauses.sort_direction.asc",
    ),
}

sealed interface AdminLegalClauseEditorMode {
    data object CREATE : AdminLegalClauseEditorMode

    data class EDIT(val clauseId: String) : AdminLegalClauseEditorMode

    val isEdit: Boolean
        get() = this is EDIT
}

data class AdminLegalClauseLanguageOption(
    val code: String,
    val titleKey: String,
) {
    companion object {
        val all: List<AdminLegalClauseLanguageOption> = listOf(
            AdminLegalClauseLanguageOption(
                code = "all",
                titleKey = "admin.legal_clauses.languages.all",
            ),
            AdminLegalClauseLanguageOption(
                code = "en",
                titleKey = "admin.legal_clauses.languages.en",
            ),
            AdminLegalClauseLanguageOption(
                code = "ro",
                titleKey = "admin.legal_clauses.languages.ro",
            ),
            AdminLegalClauseLanguageOption(
                code = "de",
                titleKey = "admin.legal_clauses.languages.de",
            ),
            AdminLegalClauseLanguageOption(
                code = "it",
                titleKey = "admin.legal_clauses.languages.it",
            ),
            AdminLegalClauseLanguageOption(
                code = "fr",
                titleKey = "admin.legal_clauses.languages.fr",
            ),
            AdminLegalClauseLanguageOption(
                code = "es",
                titleKey = "admin.legal_clauses.languages.es",
            ),
            AdminLegalClauseLanguageOption(
                code = "pl",
                titleKey = "admin.legal_clauses.languages.pl",
            ),
            AdminLegalClauseLanguageOption(
                code = "nl",
                titleKey = "admin.legal_clauses.languages.nl",
            ),
            AdminLegalClauseLanguageOption(
                code = "ch",
                titleKey = "admin.legal_clauses.languages.ch",
            ),
            AdminLegalClauseLanguageOption(
                code = "ie",
                titleKey = "admin.legal_clauses.languages.ie",
            ),
        )

        val editable: List<AdminLegalClauseLanguageOption>
            get() = all.drop(1)
    }
}

data class AdminLegalClause(
    val id: String,
    val identifier: String,
    val category: String,
    val content: Map<String, String> = emptyMap(),
    val createdAtIso: String? = null,
    val updatedAtIso: String? = null,
) {
    val translationCount: Int
        get() = content.values.count { it.trim().isNotEmpty() }
}

data class AdminLegalClausesCollection(
    val clauses: List<AdminLegalClause> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val lastPage: Int = 1,
    val perPage: Int = 15,
)

data class AdminLegalClausePayload(
    val identifier: String,
    val category: String,
    val content: Map<String, String>,
)

data class AdminLegalClauseUpdatePayload(
    val identifier: String? = null,
    val category: String? = null,
    val content: Map<String, String>? = null,
)

data class AdminLegalClauseEditorDraft(
    val identifier: String = "",
    val category: String = "",
    val content: Map<String, String> = emptyMap(),
    val selectedLanguage: String = "ro",
) {
    val isCreateValid: Boolean
        get() {
            val hasIdentifier = identifier.trim().isNotEmpty()
            val hasCategory = category.trim().isNotEmpty()
            return hasIdentifier && hasCategory && trimmedContentPayload().isNotEmpty()
        }

    fun apply(clause: AdminLegalClause): AdminLegalClauseEditorDraft {
        return copy(
            identifier = clause.identifier,
            category = clause.category,
            content = clause.content,
        )
    }

    fun textFor(languageCode: String): String = content[languageCode].orEmpty()

    fun withText(languageCode: String, value: String): AdminLegalClauseEditorDraft {
        return copy(content = content + (languageCode to value))
    }

    fun trimmedContentPayload(): Map<String, String> {
        val normalized = linkedMapOf<String, String>()
        content.forEach { (key, value) ->
            val trimmedKey = key.trim()
            val trimmedValue = value.trim()
            if (trimmedKey.isNotEmpty() && trimmedValue.isNotEmpty()) {
                normalized[trimmedKey] = trimmedValue
            }
        }
        return normalized
    }
}

enum class AdminNewsletterUserTypeFilter(
    val rawValue: String?,
    val titleKey: String,
) {
    ALL(
        rawValue = null,
        titleKey = "admin.newsletter.user_type_all",
    ),
    CLIENT(
        rawValue = "client",
        titleKey = "admin.newsletter.user_type_client",
    ),
    PROVIDER(
        rawValue = "provider",
        titleKey = "admin.newsletter.user_type_provider",
    ),
}

enum class AdminNewsletterLanguageFilter(
    val rawValue: String,
    val titleKey: String,
) {
    RO(
        rawValue = "ro",
        titleKey = "admin.newsletter.language_ro",
    ),
    EN(
        rawValue = "en",
        titleKey = "admin.newsletter.language_en",
    ),
}

object AdminNewsletterRecipientParser {
    fun parse(input: String): List<String> {
        return input
            .split(',', '\n', ';')
            .map { it.trim() }
            .filter { it.isNotEmpty() }
    }
}

data class AdminSendNewsletterPayload(
    val template: String,
    val subject: String,
    val data: Map<String, String>? = null,
    val userType: String? = null,
    val recipients: List<String>? = null,
    val language: String? = null,
)

data class AdminNewsletterSubscriber(
    val id: String,
    val email: String,
    val name: String? = null,
    val userType: String = "client",
    val company: String? = null,
    val language: String? = null,
    val subscribedAtIso: String? = null,
    val unsubscribedAtIso: String? = null,
) {
    val isActive: Boolean
        get() = unsubscribedAtIso.isNullOrBlank()
}

data class AdminNewsletterSubscribersCollection(
    val subscribers: List<AdminNewsletterSubscriber> = emptyList(),
    val total: Int = 0,
    val perPage: Int = 20,
    val currentPage: Int = 1,
    val lastPage: Int = 1,
)

data class AdminActivityEntry(
    val id: String,
    val type: String = "unknown",
    val metadata: Map<String, String> = emptyMap(),
    val readAtIso: String? = null,
    val createdAtIso: String? = null,
    val createdAtHuman: String = "",
)

data class AdminActivitiesCollection(
    val activities: List<AdminActivityEntry> = emptyList(),
    val total: Int = 0,
    val perPage: Int = 0,
    val currentPage: Int = 1,
    val lastPage: Int = 1,
)

enum class AdminAuditLogEventFilter(
    val titleKey: String,
    val value: String?,
) {
    ALL(
        titleKey = "admin.audit_logs.filters.event.all",
        value = null,
    ),
    CREATED(
        titleKey = "admin.audit_logs.filters.event.created",
        value = "created",
    ),
    UPDATED(
        titleKey = "admin.audit_logs.filters.event.updated",
        value = "updated",
    ),
    DELETED(
        titleKey = "admin.audit_logs.filters.event.deleted",
        value = "deleted",
    ),
}

data class AdminAuditLogDiffItem(
    val key: String,
    val oldValue: String?,
    val newValue: String?,
)

data class AdminAuditLogEntry(
    val id: String,
    val actorName: String = "-",
    val action: String = "-",
    val event: String = "unknown",
    val subjectType: String = "-",
    val subjectId: String = "-",
    val oldValues: Map<String, String> = emptyMap(),
    val newValues: Map<String, String> = emptyMap(),
    val ip: String = "-",
    val createdAtIso: String? = null,
)

data class AdminAuditLogsCollection(
    val logs: List<AdminAuditLogEntry> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val lastPage: Int = 1,
)

enum class AdminCallsPassedFilter(
    val titleKey: String,
    val value: Int?,
) {
    ALL("admin.calls.filters.passed.all", null),
    YES("admin.calls.filters.passed.yes", 1),
    NO("admin.calls.filters.passed.no", 0),
}

enum class AdminCallsStatusFilter(
    val titleKey: String,
    val statusValue: String?,
) {
    ALL("admin.calls.filters.status.all", null),
    WAITING("admin.calls.statuses.WAITING", "WAITING"),
    ACCEPTED("admin.calls.statuses.ACCEPTED", "ACCEPTED"),
    FINISHED("admin.calls.statuses.FINISHED", "FINISHED"),
    REFUSED("admin.calls.statuses.REFUSED", "REFUSED"),
    NO_SHOW("admin.calls.statuses.NO_SHOW", "NO_SHOW"),
}

enum class AdminCallsDateRangeFilter(val titleKey: String) {
    ALL("admin.calls.filters.date.all"),
    TODAY("admin.calls.filters.date.today"),
    LAST_7_DAYS("admin.calls.filters.date.last_7_days"),
    LAST_30_DAYS("admin.calls.filters.date.last_30_days"),
}

data class AdminCallUserSummary(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
) {
    val fullName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { email }
}

data class AdminCallServiceSummary(
    val id: String,
    val title: String,
    val categoryName: String,
)

data class AdminCallTestResultSummary(
    val id: String,
    val skillTestId: String? = null,
    val score: Double = 0.0,
    val passed: Boolean? = null,
)

data class AdminCallSummary(
    val id: String,
    val status: String,
    val passedValue: Int? = null,
    val dateTimeIso: String? = null,
    val createdAtIso: String? = null,
    val callUrl: String? = null,
    val interviewer: AdminCallUserSummary? = null,
    val attendee: AdminCallUserSummary? = null,
    val service: AdminCallServiceSummary? = null,
    val testResult: AdminCallTestResultSummary? = null,
    val resultsCount: Int = 0,
    val note: String? = null,
)

data class AdminCallsCollection(
    val calls: List<AdminCallSummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val perPage: Int = 20,
    val lastPage: Int = 1,
)

enum class AdminProjectsStatusFilter(
    val titleKey: String,
    val statusValue: String?,
) {
    ALL("admin.orders.statuses.all", null),
    PENDING("admin.orders.statuses.pending", "PENDING"),
    ACCEPTED("admin.orders.statuses.accepted", "ACCEPTED"),
    IN_PROGRESS("admin.orders.statuses.in_progress", "IN_PROGRESS"),
    DELIVERED("admin.orders.statuses.delivered", "DELIVERED"),
    COMPLETED("admin.orders.statuses.completed", "COMPLETED"),
    CANCELLED("admin.orders.statuses.cancelled", "CANCELLED"),
    DISPUTED("admin.orders.statuses.disputed", "DISPUTED"),
}

enum class AdminOrderStatusOption(
    val rawValue: String,
    val titleKey: String,
) {
    PENDING("PENDING", "admin.orders.statuses.pending"),
    ACCEPTED("ACCEPTED", "admin.orders.statuses.accepted"),
    IN_PROGRESS("IN_PROGRESS", "admin.orders.statuses.in_progress"),
    DELIVERED("DELIVERED", "admin.orders.statuses.delivered"),
    COMPLETED("COMPLETED", "admin.orders.statuses.completed"),
    CANCELLED("CANCELLED", "admin.orders.statuses.cancelled"),
    DISPUTED("DISPUTED", "admin.orders.statuses.disputed"),
}

data class AdminOrderParticipantSummary(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val avatarUrl: String? = null,
) {
    val fullName: String
        get() = listOf(firstName, lastName).joinToString(" ").trim().ifEmpty { email }

    val initials: String
        get() {
            val first = firstName.firstOrNull()?.uppercase() ?: ""
            val last = lastName.firstOrNull()?.uppercase() ?: ""
            return (first + last).ifEmpty { "U" }
        }
}

data class AdminOrderServiceSummary(
    val id: String,
    val title: String,
    val categoryName: String,
)

data class AdminOrderSummary(
    val id: String,
    val orderNumber: String,
    val amount: Double,
    val currency: String,
    val status: String,
    val paymentStatus: String,
    val createdAtIso: String? = null,
    val deliveryDateIso: String? = null,
    val requirements: String = "",
    val clientNotes: String = "",
    val providerNotes: String = "",
    val adminNotes: String = "",
    val deliverables: List<String> = emptyList(),
    val service: AdminOrderServiceSummary? = null,
    val client: AdminOrderParticipantSummary? = null,
    val provider: AdminOrderParticipantSummary? = null,
)

data class AdminOrdersCollection(
    val orders: List<AdminOrderSummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val perPage: Int = 20,
    val lastPage: Int = 1,
)

enum class AdminTestsLevelFilter(
    val titleKey: String,
    val levelValue: String?,
) {
    ALL("admin.tests.levels.all", null),
    JUNIOR("admin.tests.levels.JUNIOR", "JUNIOR"),
    MEDIU("admin.tests.levels.MEDIU", "MEDIU"),
    SENIOR("admin.tests.levels.SENIOR", "SENIOR"),
    EXPERT("admin.tests.levels.EXPERT", "EXPERT"),
}

enum class AdminTestsStatusFilter(
    val titleKey: String,
    val statusValue: String?,
) {
    ALL("admin.tests.statuses.all", null),
    ACTIVE("admin.tests.statuses.ACTIVE", "ACTIVE"),
    INACTIVE("admin.tests.statuses.INACTIVE", "INACTIVE"),
    DRAFT("admin.tests.statuses.DRAFT", "DRAFT"),
}

data class AdminTestServiceOption(
    val id: String,
    val title: String,
    val categoryName: String,
)

data class AdminTestSummary(
    val id: String,
    val title: String,
    val description: String,
    val serviceId: String,
    val serviceTitle: String,
    val serviceCategoryName: String,
    val level: String,
    val status: String,
    val totalQuestions: Int,
    val timeLimit: Int,
    val passingScore: Int,
    val resultsCount: Int,
    val createdAtIso: String? = null,
)

data class AdminTestsCollection(
    val tests: List<AdminTestSummary> = emptyList(),
    val total: Int = 0,
    val currentPage: Int = 1,
    val perPage: Int = 20,
    val lastPage: Int = 1,
)

data class AdminTestQuestionTestCase(
    val id: String,
    val input: String,
    val expectedOutput: String,
    val description: String,
)

data class AdminTestQuestion(
    val id: String,
    val type: String,
    val question: String,
    val points: Int,
    val options: List<String> = emptyList(),
    val correctAnswers: List<String> = emptyList(),
    val explanation: String = "",
    val codeTemplate: String = "",
    val codeSolution: String = "",
    val expectedOutput: String = "",
    val testCases: List<AdminTestQuestionTestCase> = emptyList(),
    val order: Int = 0,
) {
    companion object {
        fun normalizedQuestionType(raw: String): String {
            return when (raw.trim().uppercase()) {
                "CODE" -> "CODE_WRITING"
                "TRUE_FALSE" -> "TEXT_INPUT"
                "CODE_WRITING", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT_INPUT" -> raw.trim().uppercase()
                else -> "SINGLE_CHOICE"
            }
        }
    }
}

data class AdminTestDetail(
    val id: String,
    val title: String,
    val description: String,
    val serviceId: String,
    val serviceTitle: String,
    val serviceCategoryName: String,
    val level: String,
    val status: String,
    val totalQuestions: Int,
    val timeLimit: Int,
    val passingScore: Int,
    val questions: List<AdminTestQuestion> = emptyList(),
    val createdAtIso: String? = null,
)

data class AdminTestQuestionResult(
    val id: String,
    val questionId: String,
    val answer: List<String> = emptyList(),
    val pointsEarned: Double = 0.0,
    val isCorrect: Boolean = false,
)

data class AdminTestStatistics(
    val id: String,
    val title: String,
    val level: String,
    val serviceTitle: String,
    val userFullName: String,
    val passed: Boolean,
    val score: Double,
    val timeSpentMinutes: Int,
    val questions: List<AdminTestQuestion> = emptyList(),
    val questionResults: List<AdminTestQuestionResult> = emptyList(),
)

data class AdminTestQuestionPayload(
    val id: String? = null,
    val type: String,
    val question: String,
    val points: Int,
    val options: List<String> = emptyList(),
    val correctAnswers: List<String> = emptyList(),
    val explanation: String = "",
    val codeTemplate: String = "",
    val codeSolution: String = "",
    val expectedOutput: String = "",
    val testCases: List<AdminTestQuestionTestCase> = emptyList(),
)

data class AdminCreateTestPayload(
    val title: String,
    val description: String,
    val serviceId: String,
    val level: String,
    val timeLimit: Int,
    val passingScore: Int,
    val status: String,
    val questions: List<AdminTestQuestionPayload> = emptyList(),
)

data class AdminUpdateTestPayload(
    val title: String,
    val description: String,
    val serviceId: String,
    val level: String,
    val timeLimit: Int,
    val passingScore: Int,
    val status: String,
    val questions: List<AdminTestQuestionPayload> = emptyList(),
)

enum class AdminTestEditorMode {
    CREATE,
    EDIT,
}

data class AdminTestEditorQuestionDraft(
    val id: String = java.util.UUID.randomUUID().toString(),
    val type: String = "SINGLE_CHOICE",
    val question: String = "",
    val points: Int = 10,
    val options: List<String> = listOf("", "", "", ""),
    val correctAnswers: List<String> = emptyList(),
    val explanation: String = "",
    val codeTemplate: String = "",
    val codeSolution: String = "",
    val expectedOutput: String = "",
    val testCases: List<AdminTestQuestionTestCase> = emptyList(),
) {
    val normalizedType: String
        get() = AdminTestQuestion.normalizedQuestionType(type)

    val isChoiceType: Boolean
        get() = normalizedType == "SINGLE_CHOICE" || normalizedType == "MULTIPLE_CHOICE"

    val isCodeType: Boolean
        get() = normalizedType == "CODE_WRITING"

    val isTextInputType: Boolean
        get() = normalizedType == "TEXT_INPUT"

    fun asPayloadQuestion(): AdminTestQuestionPayload {
        return AdminTestQuestionPayload(
            id = id,
            type = normalizedType,
            question = question,
            points = points,
            options = options,
            correctAnswers = correctAnswers,
            explanation = explanation,
            codeTemplate = codeTemplate,
            codeSolution = codeSolution,
            expectedOutput = expectedOutput,
            testCases = testCases,
        )
    }

    companion object {
        fun from(question: AdminTestQuestion): AdminTestEditorQuestionDraft {
            val normalizedOptions = if (question.options.isEmpty()) listOf("", "", "", "") else question.options
            return AdminTestEditorQuestionDraft(
                id = question.id,
                type = question.type,
                question = question.question,
                points = question.points,
                options = normalizedOptions,
                correctAnswers = question.correctAnswers,
                explanation = question.explanation,
                codeTemplate = question.codeTemplate,
                codeSolution = question.codeSolution,
                expectedOutput = question.expectedOutput,
                testCases = question.testCases,
            )
        }
    }
}

data class AdminTestEditorDraft(
    val title: String = "",
    val description: String = "",
    val serviceId: String = "",
    val level: String = "JUNIOR",
    val timeLimit: Int = 60,
    val passingScore: Int = 70,
    val status: String = "DRAFT",
    val questions: List<AdminTestEditorQuestionDraft> = emptyList(),
) {
    val isValid: Boolean
        get() = title.trim().isNotEmpty() &&
            description.trim().isNotEmpty() &&
            serviceId.trim().isNotEmpty() &&
            questions.isNotEmpty()

    fun apply(detail: AdminTestDetail): AdminTestEditorDraft {
        return copy(
            title = detail.title,
            description = detail.description,
            serviceId = detail.serviceId,
            level = detail.level,
            timeLimit = detail.timeLimit,
            passingScore = detail.passingScore,
            status = detail.status,
            questions = detail.questions.map(AdminTestEditorQuestionDraft::from),
        )
    }

    fun createPayload(): AdminCreateTestPayload {
        return AdminCreateTestPayload(
            title = title,
            description = description,
            serviceId = serviceId,
            level = level,
            timeLimit = timeLimit,
            passingScore = passingScore,
            status = status,
            questions = questions.map { it.asPayloadQuestion() },
        )
    }

    fun updatePayload(): AdminUpdateTestPayload {
        return AdminUpdateTestPayload(
            title = title,
            description = description,
            serviceId = serviceId,
            level = level,
            timeLimit = timeLimit,
            passingScore = passingScore,
            status = status,
            questions = questions.map { it.asPayloadQuestion() },
        )
    }
}

data class AdminDeliveryProviderOption(
    val value: String,
    val label: String,
) {
    val id: String
        get() = value
}

enum class AdminServicesStatusFilter(
    val titleKey: String,
    val statusValue: String?,
) {
    ALL("admin.services.filters.all", null),
    ACTIVE("admin.services.statuses.ACTIVE", "ACTIVE"),
    DRAFT("admin.services.statuses.DRAFT", "DRAFT"),
    SUSPENDED("admin.services.statuses.SUSPENDED", "SUSPENDED"),
}

enum class AdminServiceStatusAction(val raw: String) {
    VIEW("view"),
    APPROVE("approve"),
    FEATURE("feature"),
    SUSPEND("suspend"),
}

enum class AdminServiceEditorMode {
    CREATE,
    EDIT,
}

data class AdminServiceEditorDraft(
    val name: String = "",
    val slug: String = "",
    val description: String = "",
    val requirements: String = "",
    val categoryId: String = "",
    val categorySlug: String? = null,
    val deliveryProvider: String = "",
    val skills: List<String> = emptyList(),
    val tags: List<String> = emptyList(),
    val status: String = "DRAFT",
) {
    val isCreateValid: Boolean
        get() = name.trim().isNotEmpty() &&
            slug.trim().isNotEmpty() &&
            description.trim().isNotEmpty() &&
            categoryId.trim().isNotEmpty() &&
            deliveryProvider.trim().isNotEmpty()

    fun apply(detail: AdminServiceDetail): AdminServiceEditorDraft {
        return copy(
            name = detail.name,
            slug = detail.slug,
            description = detail.description,
            requirements = detail.requirements,
            categoryId = detail.categoryId,
            categorySlug = detail.categorySlug,
            deliveryProvider = detail.deliveryProvider,
            skills = detail.skills,
            tags = detail.tags,
            status = detail.status,
        )
    }
}

enum class AdminUsersRoleFilter(
    val titleKey: String,
    val roleSlug: String?,
) {
    ALL(
        titleKey = "admin.users.filter_all",
        roleSlug = null,
    ),
    CLIENT(
        titleKey = "admin.users.filter_clients",
        roleSlug = "CLIENT",
    ),
    PROVIDER(
        titleKey = "admin.users.filter_providers",
        roleSlug = "PROVIDER",
    ),
    ADMIN(
        titleKey = "admin.users.filter_admins",
        roleSlug = "ADMIN",
    ),
}

enum class AdminUserStatusAction(val raw: String) {
    VERIFY("verify"),
    SUSPEND("suspend"),
    ACTIVATE("activate"),
}

data class AdminCreateUserPayload(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val role: String,
    val phone: String? = null,
)

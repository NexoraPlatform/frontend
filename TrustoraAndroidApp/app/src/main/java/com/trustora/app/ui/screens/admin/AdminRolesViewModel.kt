package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminCreateRolePayload
import com.trustora.app.core.models.AdminPermissionGroup
import com.trustora.app.core.models.AdminRoleEditorDraft
import com.trustora.app.core.models.AdminRoleLite
import com.trustora.app.core.models.AdminRoleSummary
import com.trustora.app.core.models.AdminRolesTab
import com.trustora.app.core.models.AdminUpdateRolePayload
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminRolesViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var selectedTab by mutableStateOf(AdminRolesTab.ROLES)

    var roles by mutableStateOf<List<AdminRoleSummary>>(emptyList())
        private set
    var page by mutableStateOf(1)
    var pageSize by mutableStateOf(10)
    var total by mutableStateOf(0)
        private set
    var lastPage by mutableStateOf(1)
        private set
    var searchText by mutableStateOf("")
    var appliedSearch by mutableStateOf("")
        private set

    var permissionGroups by mutableStateOf<List<AdminPermissionGroup>>(emptyList())
        private set
    var matrixRoles by mutableStateOf<List<AdminRoleLite>>(emptyList())
        private set
    var matrixSelections by mutableStateOf<Map<String, Set<String>>>(emptyMap())
        private set
    var matrixFilter by mutableStateOf("")
    var matrixSavingRoles by mutableStateOf<Set<String>>(emptySet())
        private set
    var matrixOpenGroups by mutableStateOf<Set<String>>(emptySet())
        private set

    var isLoadingRoles by mutableStateOf(false)
        private set
    var isLoadingMatrix by mutableStateOf(false)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)

    private val permissionSyncJobs = mutableMapOf<String, Job>()

    val canGoPrevious: Boolean
        get() = page > 1

    val canGoNext: Boolean
        get() = page < lastPage

    val filteredPermissionGroups: List<AdminPermissionGroup>
        get() {
            val query = matrixFilter.trim().lowercase()
            if (query.isEmpty()) {
                return permissionGroups
            }

            return permissionGroups.mapNotNull { group ->
                val filteredPermissions = group.permissions.filter { permission ->
                    permission.name.lowercase().contains(query) ||
                        permission.slug.lowercase().contains(query) ||
                        permission.description.lowercase().contains(query)
                }
                if (filteredPermissions.isEmpty()) {
                    null
                } else {
                    group.copy(permissions = filteredPermissions)
                }
            }
        }

    override fun onCleared() {
        permissionSyncJobs.values.forEach { it.cancel() }
        permissionSyncJobs.clear()
        super.onCleared()
    }

    fun loadRoles(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoadingRoles) return
        viewModelScope.launch {
            loadRolesInternal(
                token = token,
                language = language,
                currency = currency,
            )
        }
    }

    fun applySearch() {
        appliedSearch = searchText.trim()
        page = 1
    }

    fun clearSearch() {
        searchText = ""
        appliedSearch = ""
        page = 1
    }

    fun updatePageSize(newValue: Int) {
        val safeValue = maxOf(1, newValue)
        if (safeValue == pageSize) return
        pageSize = safeValue
        page = 1
    }

    fun goToPreviousPage() {
        if (page > 1) {
            page -= 1
        }
    }

    fun goToNextPage() {
        if (page < lastPage) {
            page += 1
        }
    }

    fun moveRole(
        roleId: String,
        direction: Int,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val sourceIndex = roles.indexOfFirst { it.id == roleId }
        if (sourceIndex < 0) return

        val targetIndex = sourceIndex + direction
        if (targetIndex !in roles.indices) return

        val reordered = roles.toMutableList().apply {
            val current = removeAt(sourceIndex)
            add(targetIndex, current)
        }
        val offset = (page - 1) * pageSize
        roles = reordered.mapIndexed { index, role ->
            role.copy(sortOrder = offset + index + 1)
        }

        val updates = roles.map { role ->
            role.id to (role.sortOrder ?: 0)
        }

        isSubmitting = true
        actionErrorMessage = null
        viewModelScope.launch {
            runCatching {
                updates.forEach { (id, order) ->
                    appContainer.dashboardRepository.updateAdminRoleSortOrder(
                        roleId = id,
                        sortOrder = order,
                        language = language,
                        currency = currency,
                        token = token,
                    )
                }
            }.onFailure { error ->
                actionErrorMessage = resolvedMessage(error)
            }

            loadRolesInternal(
                token = token,
                language = language,
                currency = currency,
            )
            isSubmitting = false
        }
    }

    fun deleteRole(
        roleId: String,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val success = runCatching {
                appContainer.dashboardRepository.deleteAdminRole(
                    roleId = roleId,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                loadRolesInternal(
                    token = token,
                    language = language,
                    currency = currency,
                )
                if (matrixRoles.isNotEmpty()) {
                    loadPermissionMatrixInternal(
                        token = token,
                        language = language,
                        currency = currency,
                    )
                }
            }

            isSubmitting = false
            onCompleted(success)
        }
    }

    fun loadRoleEditorDraft(
        roleId: String?,
        token: String,
        language: String,
        currency: AppCurrency,
        onResult: (AdminRoleEditorDraft?) -> Unit,
    ) {
        actionErrorMessage = null
        viewModelScope.launch {
            if (permissionGroups.isEmpty()) {
                runCatching {
                    appContainer.dashboardRepository.getAdminPermissionGroups(
                        language = language,
                        currency = currency,
                        token = token,
                    )
                }.onSuccess { groups ->
                    permissionGroups = groups
                    if (matrixOpenGroups.isEmpty()) {
                        matrixOpenGroups = groups.map { it.id }.toSet()
                    }
                }.onFailure { error ->
                    actionErrorMessage = resolvedMessage(error)
                    onResult(null)
                    return@launch
                }
            }

            if (roleId == null) {
                onResult(AdminRoleEditorDraft())
                return@launch
            }

            val draft = runCatching {
                val detail = appContainer.dashboardRepository.getAdminRole(
                    roleId = roleId,
                    language = language,
                    currency = currency,
                    token = token,
                )
                AdminRoleEditorDraft(
                    roleId = detail.id,
                    name = detail.name,
                    description = detail.description,
                    sortOrder = detail.sortOrder,
                    permissionIds = detail.permissionIds.toSet(),
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                null
            }

            onResult(draft)
        }
    }

    fun createRole(
        draft: AdminRoleEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val payload = AdminCreateRolePayload(
                name = draft.name.trim(),
                description = draft.description.trim(),
                permissionIds = draft.permissionIds.toList(),
            )

            val success = runCatching {
                appContainer.dashboardRepository.createAdminRole(
                    payloadData = payload,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                loadRolesInternal(
                    token = token,
                    language = language,
                    currency = currency,
                )
                if (selectedTab == AdminRolesTab.PERMISSIONS || matrixRoles.isNotEmpty()) {
                    loadPermissionMatrixInternal(
                        token = token,
                        language = language,
                        currency = currency,
                    )
                }
            }

            isSubmitting = false
            onCompleted(success)
        }
    }

    fun updateRole(
        draft: AdminRoleEditorDraft,
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        val roleId = draft.roleId
        if (roleId.isNullOrBlank()) {
            onCompleted(false)
            return
        }

        isSubmitting = true
        actionErrorMessage = null

        viewModelScope.launch {
            val payload = AdminUpdateRolePayload(
                name = draft.name.trim(),
                description = draft.description.trim(),
                permissionIds = draft.permissionIds.toList(),
            )

            val success = runCatching {
                appContainer.dashboardRepository.updateAdminRole(
                    roleId = roleId,
                    payloadData = payload,
                    language = language,
                    currency = currency,
                    token = token,
                )

                appContainer.dashboardRepository.updateAdminRoleSortOrder(
                    roleId = roleId,
                    sortOrder = draft.sortOrder,
                    language = language,
                    currency = currency,
                    token = token,
                )
                true
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                false
            }

            if (success) {
                loadRolesInternal(
                    token = token,
                    language = language,
                    currency = currency,
                )
                if (selectedTab == AdminRolesTab.PERMISSIONS || matrixRoles.isNotEmpty()) {
                    loadPermissionMatrixInternal(
                        token = token,
                        language = language,
                        currency = currency,
                    )
                }
            }

            isSubmitting = false
            onCompleted(success)
        }
    }

    fun loadPermissionMatrix(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoadingMatrix) return
        viewModelScope.launch {
            loadPermissionMatrixInternal(
                token = token,
                language = language,
                currency = currency,
            )
        }
    }

    fun roleColumnState(roleSlug: String): MatrixCheckboxState {
        val visiblePermissionSlugs = filteredPermissionGroups.flatMap { group ->
            group.permissions.map { it.slug }
        }
        if (visiblePermissionSlugs.isEmpty()) {
            return MatrixCheckboxState(all = false, none = true, indeterminate = false)
        }

        val selected = matrixSelections[roleSlug].orEmpty()
        val selectedCount = visiblePermissionSlugs.count(selected::contains)
        return MatrixCheckboxState(
            all = selectedCount == visiblePermissionSlugs.size,
            none = selectedCount == 0,
            indeterminate = selectedCount > 0 && selectedCount < visiblePermissionSlugs.size,
        )
    }

    fun groupRoleState(group: AdminPermissionGroup, roleSlug: String): MatrixCheckboxState {
        if (group.permissions.isEmpty()) {
            return MatrixCheckboxState(all = false, none = true, indeterminate = false)
        }

        val selected = matrixSelections[roleSlug].orEmpty()
        val slugs = group.permissions.map { it.slug }
        val selectedCount = slugs.count(selected::contains)
        return MatrixCheckboxState(
            all = selectedCount == slugs.size,
            none = selectedCount == 0,
            indeterminate = selectedCount > 0 && selectedCount < slugs.size,
        )
    }

    fun isPermissionEnabled(
        roleSlug: String,
        permissionSlug: String,
    ): Boolean {
        return matrixSelections[roleSlug]?.contains(permissionSlug) == true
    }

    fun togglePermission(
        role: AdminRoleLite,
        permissionSlug: String,
        enabled: Boolean,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val selected = matrixSelections[role.slug].orEmpty().toMutableSet()
        if (enabled) {
            selected.add(permissionSlug)
        } else {
            selected.remove(permissionSlug)
        }
        matrixSelections = matrixSelections.toMutableMap().apply {
            put(role.slug, selected)
        }
        queuePermissionSync(
            role = role,
            token = token,
            language = language,
            currency = currency,
        )
    }

    fun toggleRoleColumn(
        role: AdminRoleLite,
        enabled: Boolean,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val visible = filteredPermissionGroups.flatMap { group ->
            group.permissions.map { it.slug }
        }
        val selected = matrixSelections[role.slug].orEmpty().toMutableSet()
        if (enabled) {
            visible.forEach(selected::add)
        } else {
            visible.forEach(selected::remove)
        }
        matrixSelections = matrixSelections.toMutableMap().apply {
            put(role.slug, selected)
        }
        queuePermissionSync(
            role = role,
            token = token,
            language = language,
            currency = currency,
        )
    }

    fun toggleGroupForRole(
        group: AdminPermissionGroup,
        role: AdminRoleLite,
        enabled: Boolean,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val selected = matrixSelections[role.slug].orEmpty().toMutableSet()
        group.permissions.forEach { permission ->
            if (enabled) {
                selected.add(permission.slug)
            } else {
                selected.remove(permission.slug)
            }
        }
        matrixSelections = matrixSelections.toMutableMap().apply {
            put(role.slug, selected)
        }
        queuePermissionSync(
            role = role,
            token = token,
            language = language,
            currency = currency,
        )
    }

    fun toggleGroupExpanded(groupId: String) {
        matrixOpenGroups = if (matrixOpenGroups.contains(groupId)) {
            matrixOpenGroups - groupId
        } else {
            matrixOpenGroups + groupId
        }
    }

    private fun queuePermissionSync(
        role: AdminRoleLite,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        permissionSyncJobs[role.slug]?.cancel()
        matrixSavingRoles = matrixSavingRoles + role.slug

        val job = viewModelScope.launch {
            delay(350)
            val selected = matrixSelections[role.slug].orEmpty().toList()
            runCatching {
                appContainer.dashboardRepository.updateAdminRolePermissionsBySlug(
                    roleId = role.id,
                    permissionSlugs = selected,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.onFailure { error ->
                actionErrorMessage = resolvedMessage(error)
            }

            matrixSavingRoles = matrixSavingRoles - role.slug
            permissionSyncJobs.remove(role.slug)
        }

        permissionSyncJobs[role.slug] = job
    }

    private suspend fun loadRolesInternal(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        isLoadingRoles = true
        errorMessage = null

        runCatching {
            appContainer.dashboardRepository.getAdminRoles(
                language = language,
                currency = currency,
                token = token,
                search = appliedSearch,
                page = page,
                pageSize = pageSize,
            )
        }.onSuccess { collection ->
            roles = collection.roles
            total = collection.total
            page = maxOf(1, collection.currentPage)
            lastPage = maxOf(1, collection.lastPage)
        }.onFailure { error ->
            roles = emptyList()
            total = 0
            lastPage = 1
            errorMessage = resolvedMessage(error)
        }

        isLoadingRoles = false
    }

    private suspend fun loadPermissionMatrixInternal(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        isLoadingMatrix = true
        errorMessage = null
        actionErrorMessage = null

        runCatching {
            coroutineScope {
                val groupsTask = async {
                    appContainer.dashboardRepository.getAdminPermissionGroups(
                        language = language,
                        currency = currency,
                        token = token,
                    )
                }
                val rolesTask = async {
                    appContainer.dashboardRepository.getAdminRolesLite(
                        language = language,
                        currency = currency,
                        token = token,
                    )
                }

                val groups = groupsTask.await()
                val fetchedRoles = rolesTask.await()

                permissionGroups = groups
                matrixRoles = fetchedRoles
                if (matrixOpenGroups.isEmpty()) {
                    matrixOpenGroups = groups.map { it.id }.toSet()
                }

                val selections = mutableMapOf<String, Set<String>>()
                fetchedRoles.forEach { role ->
                    val slugs = appContainer.dashboardRepository.getAdminRolePermissionSlugs(
                        roleSlug = role.slug,
                        language = language,
                        currency = currency,
                        token = token,
                    )
                    selections[role.slug] = slugs.toSet()
                }

                matrixSelections = selections
            }
        }.onFailure { error ->
            matrixRoles = emptyList()
            matrixSelections = emptyMap()
            errorMessage = resolvedMessage(error)
        }

        isLoadingMatrix = false
    }

    private fun resolvedMessage(error: Throwable): String {
        if (error is HttpException) {
            val errorBody = runCatching { error.response()?.errorBody()?.string() }.getOrNull()
            if (!errorBody.isNullOrBlank()) {
                extractMessage(errorBody)?.let { return it }
            }
            return "HTTP ${error.code()}"
        }
        return error.message ?: "Unknown error"
    }

    private fun extractMessage(payload: String): String? {
        val root = runCatching { JsonParser.parseString(payload).asJsonObject }.getOrNull() ?: return payload

        val errors = root.objectOrNull("errors")
        if (errors != null) {
            errors.entrySet().forEach { (_, value) ->
                if (value.isJsonArray && value.asJsonArray.size() > 0) {
                    value.asJsonArray[0].asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
                }
                value.asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
            }
        }

        root.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        root.objectOrNull("data")?.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        return payload
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminRolesViewModel(appContainer) as T
        }
    }
}

data class MatrixCheckboxState(
    val all: Boolean,
    val none: Boolean,
    val indeterminate: Boolean,
)

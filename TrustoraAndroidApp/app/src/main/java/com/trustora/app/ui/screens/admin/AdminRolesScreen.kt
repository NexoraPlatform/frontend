@file:OptIn(
    androidx.compose.material3.ExperimentalMaterial3Api::class,
    androidx.compose.foundation.layout.ExperimentalLayoutApi::class,
)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CheckBox
import androidx.compose.material.icons.filled.CheckBoxOutlineBlank
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.IndeterminateCheckBox
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.ShieldMoon
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminPermissionGroup
import com.trustora.app.core.models.AdminRoleEditorDraft
import com.trustora.app.core.models.AdminRoleLite
import com.trustora.app.core.models.AdminRoleSummary
import com.trustora.app.core.models.AdminRolesTab
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

@Composable
fun AdminRolesScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminRolesViewModel,
    onBack: () -> Unit,
) {
    val resolvedLanguageCode = remember(languageCode) {
        if (languageCode.startsWith("ro", ignoreCase = true)) "ro" else "en"
    }
    val canAccessAdmin = remember(user, token) {
        token.isNotBlank() && (user.isSuperuser || user.hasRole("admin"))
    }

    var isEditorPresented by remember { mutableStateOf(false) }
    var editorMode by remember { mutableStateOf<AdminRoleEditorMode>(AdminRoleEditorMode.CREATE) }
    var editorDraft by remember { mutableStateOf(AdminRoleEditorDraft()) }
    var deleteCandidate by remember { mutableStateOf<AdminRoleSummary?>(null) }
    var isPreparingEditor by remember { mutableStateOf(false) }

    fun reloadCurrentTab(force: Boolean) {
        if (!canAccessAdmin) return
        when (viewModel.selectedTab) {
            AdminRolesTab.ROLES -> {
                viewModel.loadRoles(
                    token = token,
                    language = resolvedLanguageCode,
                    currency = currency,
                )
            }

            AdminRolesTab.PERMISSIONS -> {
                if (force || viewModel.matrixRoles.isEmpty()) {
                    viewModel.loadPermissionMatrix(
                        token = token,
                        language = resolvedLanguageCode,
                        currency = currency,
                    )
                }
            }
        }
    }

    fun openCreateEditor() {
        isPreparingEditor = true
        viewModel.loadRoleEditorDraft(
            roleId = null,
            token = token,
            language = resolvedLanguageCode,
            currency = currency,
        ) { draft ->
            isPreparingEditor = false
            if (draft != null) {
                editorDraft = draft
                editorMode = AdminRoleEditorMode.CREATE
                isEditorPresented = true
            }
        }
    }

    fun openEditEditor(role: AdminRoleSummary) {
        isPreparingEditor = true
        viewModel.loadRoleEditorDraft(
            roleId = role.id,
            token = token,
            language = resolvedLanguageCode,
            currency = currency,
        ) { draft ->
            isPreparingEditor = false
            if (draft != null) {
                editorDraft = draft
                editorMode = AdminRoleEditorMode.EDIT
                isEditorPresented = true
            }
        }
    }

    LaunchedEffect(
        user.id,
        token,
        resolvedLanguageCode,
        currency.raw,
        viewModel.selectedTab,
        viewModel.page,
        viewModel.pageSize,
        viewModel.appliedSearch,
        canAccessAdmin,
    ) {
        reloadCurrentTab(force = false)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
        ) {
            AdminRolesTopBar(
                languageCode = languageCode,
                canAdd = canAccessAdmin && viewModel.selectedTab == AdminRolesTab.ROLES,
                onBack = onBack,
                onAdd = ::openCreateEditor,
            )

            if (!canAccessAdmin) {
                AdminRolesUnavailableState(languageCode = languageCode)
            } else {
                val isRefreshing = if (viewModel.selectedTab == AdminRolesTab.ROLES) {
                    viewModel.isLoadingRoles
                } else {
                    viewModel.isLoadingMatrix
                }
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = isRefreshing,
                    onRefresh = { reloadCurrentTab(force = true) },
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        AdminRolesHeaderCard(
                            languageCode = languageCode,
                            selectedTab = viewModel.selectedTab,
                        )
                        AdminRolesTabsCard(
                            languageCode = languageCode,
                            selectedTab = viewModel.selectedTab,
                            onTabSelected = { tab -> viewModel.selectedTab = tab },
                        )

                        if (viewModel.selectedTab == AdminRolesTab.ROLES) {
                            AdminRolesListCard(
                                languageCode = languageCode,
                                viewModel = viewModel,
                                onRetry = { reloadCurrentTab(force = true) },
                                onOpenEdit = ::openEditEditor,
                                onDelete = { role -> deleteCandidate = role },
                                onMoveUp = { role ->
                                    viewModel.moveRole(
                                        roleId = role.id,
                                        direction = -1,
                                        token = token,
                                        language = resolvedLanguageCode,
                                        currency = currency,
                                    )
                                },
                                onMoveDown = { role ->
                                    viewModel.moveRole(
                                        roleId = role.id,
                                        direction = 1,
                                        token = token,
                                        language = resolvedLanguageCode,
                                        currency = currency,
                                    )
                                },
                            )
                        } else {
                            AdminRolesPermissionsCard(
                                languageCode = languageCode,
                                viewModel = viewModel,
                                token = token,
                                resolvedLanguageCode = resolvedLanguageCode,
                                currency = currency,
                                onRetry = { reloadCurrentTab(force = true) },
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        if (isPreparingEditor) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(TrustoraSurface)
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.4.dp,
                        color = TrustoraPrimary,
                    )
                    Text(
                        text = rolesString("admin.loading", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    if (isEditorPresented) {
        AdminRoleFormSheet(
            languageCode = languageCode,
            mode = editorMode,
            initialDraft = editorDraft,
            permissionGroups = viewModel.permissionGroups,
            isSubmitting = viewModel.isSubmitting,
            errorMessage = viewModel.actionErrorMessage,
            onDismiss = { isEditorPresented = false },
            onSubmit = { draft, mode, onCompleted ->
                when (mode) {
                    AdminRoleEditorMode.CREATE -> {
                        viewModel.createRole(
                            draft = draft,
                            token = token,
                            language = resolvedLanguageCode,
                            currency = currency,
                            onCompleted = onCompleted,
                        )
                    }

                    AdminRoleEditorMode.EDIT -> {
                        viewModel.updateRole(
                            draft = draft,
                            token = token,
                            language = resolvedLanguageCode,
                            currency = currency,
                            onCompleted = onCompleted,
                        )
                    }
                }
            },
        )
    }

    deleteCandidate?.let { role ->
        AlertDialog(
            onDismissRequest = { deleteCandidate = null },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteRole(
                            roleId = role.id,
                            token = token,
                            language = resolvedLanguageCode,
                            currency = currency,
                        ) {
                            deleteCandidate = null
                        }
                    },
                ) {
                    Text(
                        text = rolesString("admin.roles.delete", languageCode),
                        color = Color(0xFFB91C1C),
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) {
                    Text(rolesString("common.cancel", languageCode))
                }
            },
            title = {
                Text(rolesString("admin.roles.confirm_delete", languageCode))
            },
        )
    }
}

@Composable
private fun AdminRolesTopBar(
    languageCode: String,
    canAdd: Boolean,
    onBack: () -> Unit,
    onAdd: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .clickable(onClick = onBack)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = TrustoraPrimary)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = rolesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = rolesString("admin.roles.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )

        Spacer(modifier = Modifier.width(10.dp))
        if (canAdd) {
            IconButton(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                    .size(32.dp),
                onClick = onAdd,
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, tint = TrustoraPrimary)
            }
        } else {
            Spacer(modifier = Modifier.size(32.dp))
        }
    }
}

@Composable
private fun AdminRolesUnavailableState(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Filled.LockPerson,
            contentDescription = null,
            tint = TrustoraPrimary,
            modifier = Modifier.size(36.dp),
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = rolesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = rolesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminRolesHeaderCard(
    languageCode: String,
    selectedTab: AdminRolesTab,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = "Trustora Admin",
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )
        Text(
            text = if (selectedTab == AdminRolesTab.ROLES) {
                rolesString("admin.roles.manage_title", languageCode)
            } else {
                rolesString("admin.roles.permission_matrix.title", languageCode)
            },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Text(
            text = if (selectedTab == AdminRolesTab.ROLES) {
                rolesString("admin.roles.manage_subtitle", languageCode)
            } else {
                rolesString("admin.roles.permission_matrix.subtitle", languageCode)
            },
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminRolesTabsCard(
    languageCode: String,
    selectedTab: AdminRolesTab,
    onTabSelected: (AdminRolesTab) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        AdminRolesTab.values().forEach { tab ->
            val selected = selectedTab == tab
            Button(
                onClick = { onTabSelected(tab) },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selected) TrustoraAccent.copy(alpha = 0.28f) else TrustoraMutedSurface,
                    contentColor = if (selected) Color(0xFF052E16) else TrustoraSecondaryText,
                ),
                shape = RoundedCornerShape(100.dp),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
            ) {
                Text(
                    text = rolesString(tab.titleKey, languageCode),
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
    }
}

@Composable
private fun AdminRolesListCard(
    languageCode: String,
    viewModel: AdminRolesViewModel,
    onRetry: () -> Unit,
    onOpenEdit: (AdminRoleSummary) -> Unit,
    onDelete: (AdminRoleSummary) -> Unit,
    onMoveUp: (AdminRoleSummary) -> Unit,
    onMoveDown: (AdminRoleSummary) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(Icons.Filled.Tune, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(15.dp))
            Text(
                text = rolesString("admin.roles.list_title", languageCode),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = TrustoraPrimaryText,
            )
        }

        val count = viewModel.total
        Text(
            text = if (count == 1) {
                rolesString("admin.roles.list_description_one", languageCode)
            } else {
                rolesTemplate(
                    rolesString("admin.roles.list_description_other", languageCode),
                    mapOf("count" to count.toString()),
                )
            },
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
        )

        AdminRolesSearchRow(
            languageCode = languageCode,
            searchText = viewModel.searchText,
            appliedSearch = viewModel.appliedSearch,
            onSearchChanged = { viewModel.searchText = it },
            onApplySearch = { viewModel.applySearch() },
            onClearSearch = { viewModel.clearSearch() },
        )

        when {
            viewModel.errorMessage != null -> {
                AdminRolesRetryCard(
                    message = viewModel.errorMessage.orEmpty(),
                    languageCode = languageCode,
                    onRetry = onRetry,
                )
            }

            viewModel.isLoadingRoles && viewModel.roles.isEmpty() -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(
                        color = TrustoraAccent,
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.5.dp,
                    )
                }
            }

            viewModel.roles.isEmpty() -> {
                AdminRolesEmptyState(languageCode = languageCode)
            }

            else -> {
                viewModel.actionErrorMessage
                    ?.takeIf { it.isNotBlank() }
                    ?.let { error ->
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFFB91C1C),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFFFEF2F2))
                                .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(10.dp))
                                .padding(12.dp),
                        )
                    }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    viewModel.roles.forEachIndexed { index, role ->
                        AdminRoleRow(
                            role = role,
                            index = index,
                            lastIndex = viewModel.roles.lastIndex,
                            languageCode = languageCode,
                            isSubmitting = viewModel.isSubmitting,
                            onMoveUp = { onMoveUp(role) },
                            onMoveDown = { onMoveDown(role) },
                            onEdit = { onOpenEdit(role) },
                            onDelete = { onDelete(role) },
                        )
                    }
                }

                if (viewModel.isLoadingRoles && viewModel.roles.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(
                            color = TrustoraAccent,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.2.dp,
                        )
                    }
                }

                AdminRolesPaginationRow(
                    languageCode = languageCode,
                    page = viewModel.page,
                    lastPage = viewModel.lastPage,
                    canGoPrevious = viewModel.canGoPrevious,
                    canGoNext = viewModel.canGoNext,
                    pageSize = viewModel.pageSize,
                    onSetPageSize = viewModel::updatePageSize,
                    onPrevious = viewModel::goToPreviousPage,
                    onNext = viewModel::goToNextPage,
                )
            }
        }
    }
}

@Composable
private fun AdminRolesSearchRow(
    languageCode: String,
    searchText: String,
    appliedSearch: String,
    onSearchChanged: (String) -> Unit,
    onApplySearch: () -> Unit,
    onClearSearch: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = searchText,
            onValueChange = onSearchChanged,
            modifier = Modifier.weight(1f),
            textStyle = MaterialTheme.typography.bodyMedium,
            placeholder = {
                Text(
                    text = rolesString("admin.roles.search_placeholder", languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraTertiaryText,
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = null,
                    tint = TrustoraTertiaryText,
                )
            },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = TrustoraMutedSurface,
                focusedContainerColor = TrustoraMutedSurface,
                unfocusedBorderColor = TrustoraBorder,
                focusedBorderColor = TrustoraPrimary,
            ),
            shape = RoundedCornerShape(10.dp),
        )

        Button(
            onClick = onApplySearch,
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraMutedSurface,
                contentColor = TrustoraPrimary,
            ),
            shape = RoundedCornerShape(10.dp),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
        ) {
            Text(rolesString("admin.roles.search_button", languageCode))
        }

        if (appliedSearch.isNotBlank()) {
            TextButton(onClick = onClearSearch) {
                Text(
                    text = rolesString("common.clear", languageCode),
                    color = TrustoraSecondaryText,
                )
            }
        }
    }
}

@Composable
private fun AdminRoleRow(
    role: AdminRoleSummary,
    index: Int,
    lastIndex: Int,
    languageCode: String,
    isSubmitting: Boolean,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = role.name,
                style = MaterialTheme.typography.bodyLarge,
                color = TrustoraPrimaryText,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "/${role.slug}",
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraTertiaryText,
            )
            if (role.description.isNotBlank()) {
                Text(
                    text = role.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraSecondaryText,
                )
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = rolesTemplate(
                        rolesString("admin.roles.permissions_count", languageCode),
                        mapOf("count" to role.permissionsCount.toString()),
                    ),
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraTertiaryText,
                )
                role.sortOrder?.let { order ->
                    Text(
                        text = "#$order",
                        style = MaterialTheme.typography.bodySmall,
                        color = TrustoraSecondaryText,
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            IconButton(
                onClick = onMoveUp,
                enabled = index > 0 && !isSubmitting,
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(TrustoraMutedSurface),
            ) {
                Icon(
                    imageVector = Icons.Filled.ArrowUpward,
                    contentDescription = null,
                    tint = if (index > 0 && !isSubmitting) TrustoraPrimary else TrustoraTertiaryText,
                )
            }
            IconButton(
                onClick = onMoveDown,
                enabled = index < lastIndex && !isSubmitting,
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(TrustoraMutedSurface),
            ) {
                Icon(
                    imageVector = Icons.Filled.ArrowDownward,
                    contentDescription = null,
                    tint = if (index < lastIndex && !isSubmitting) TrustoraPrimary else TrustoraTertiaryText,
                )
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            IconButton(
                onClick = onEdit,
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(TrustoraMutedSurface),
            ) {
                Icon(Icons.Filled.Edit, contentDescription = null, tint = TrustoraPrimary)
            }
            IconButton(
                onClick = onDelete,
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(Color(0xFFFEE2E2)),
            ) {
                Icon(Icons.Filled.Delete, contentDescription = null, tint = Color(0xFFB91C1C))
            }
        }
    }
}

@Composable
private fun AdminRolesPaginationRow(
    languageCode: String,
    page: Int,
    lastPage: Int,
    canGoPrevious: Boolean,
    canGoNext: Boolean,
    pageSize: Int,
    onSetPageSize: (Int) -> Unit,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
) {
    var isPageSizeMenuExpanded by remember { mutableStateOf(false) }
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = rolesTemplate(
                rolesString("admin.roles.pagination.page_of", languageCode),
                mapOf(
                    "page" to page.toString(),
                    "last" to lastPage.toString(),
                ),
            ),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
        )

        Spacer(modifier = Modifier.weight(1f))

        Box {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp))
                    .clickable { isPageSizeMenuExpanded = true }
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = pageSize.toString(),
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraPrimaryText,
                )
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = TrustoraSecondaryText)
            }
            DropdownMenu(
                expanded = isPageSizeMenuExpanded,
                onDismissRequest = { isPageSizeMenuExpanded = false },
            ) {
                listOf(5, 10, 20, 50).forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option.toString()) },
                        onClick = {
                            isPageSizeMenuExpanded = false
                            onSetPageSize(option)
                        },
                    )
                }
            }
        }

        Text(
            text = rolesString("admin.roles.pagination.per_page", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
        )

        TextButton(
            onClick = onPrevious,
            enabled = canGoPrevious,
        ) {
            Text(
                text = rolesString("admin.roles.pagination.previous", languageCode),
                color = if (canGoPrevious) TrustoraPrimary else TrustoraTertiaryText,
            )
        }

        TextButton(
            onClick = onNext,
            enabled = canGoNext,
        ) {
            Text(
                text = rolesString("admin.roles.pagination.next", languageCode),
                color = if (canGoNext) TrustoraPrimary else TrustoraTertiaryText,
            )
        }
    }
}

@Composable
private fun AdminRolesPermissionsCard(
    languageCode: String,
    viewModel: AdminRolesViewModel,
    token: String,
    resolvedLanguageCode: String,
    currency: AppCurrency,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.ShieldMoon,
                contentDescription = null,
                tint = TrustoraPrimary,
                modifier = Modifier.size(15.dp),
            )
            Text(
                text = rolesString("admin.roles.permission_matrix.title", languageCode),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = TrustoraPrimaryText,
            )
        }

        OutlinedTextField(
            value = viewModel.matrixFilter,
            onValueChange = { viewModel.matrixFilter = it },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            placeholder = {
                Text(
                    text = rolesString("admin.roles.permission_matrix.search_placeholder", languageCode),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraTertiaryText,
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = null,
                    tint = TrustoraTertiaryText,
                )
            },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = TrustoraMutedSurface,
                focusedContainerColor = TrustoraMutedSurface,
                unfocusedBorderColor = TrustoraBorder,
                focusedBorderColor = TrustoraPrimary,
            ),
            shape = RoundedCornerShape(10.dp),
        )

        Text(
            text = if (viewModel.matrixSavingRoles.isNotEmpty()) {
                rolesString("admin.roles.permission_matrix.saving_changes", languageCode)
            } else {
                rolesString("admin.roles.permission_matrix.saved_auto", languageCode)
            },
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
        )

        when {
            viewModel.errorMessage != null -> {
                AdminRolesRetryCard(
                    message = viewModel.errorMessage.orEmpty(),
                    languageCode = languageCode,
                    onRetry = onRetry,
                )
            }

            viewModel.isLoadingMatrix -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(
                        color = TrustoraAccent,
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.5.dp,
                    )
                }
            }

            viewModel.filteredPermissionGroups.isEmpty() || viewModel.matrixRoles.isEmpty() -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Shield,
                        contentDescription = null,
                        tint = TrustoraTertiaryText,
                        modifier = Modifier.size(24.dp),
                    )
                    Text(
                        text = rolesString("admin.roles.permission_matrix.no_permissions", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            else -> {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 1.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        AdminRolesMatrixHeaderRow(
                            languageCode = languageCode,
                            roles = viewModel.matrixRoles,
                            roleState = viewModel::roleColumnState,
                            onToggleRole = { role, enabled ->
                                viewModel.toggleRoleColumn(
                                    role = role,
                                    enabled = enabled,
                                    token = token,
                                    language = resolvedLanguageCode,
                                    currency = currency,
                                )
                            },
                        )

                        viewModel.filteredPermissionGroups.forEach { group ->
                            AdminRolesMatrixGroupCard(
                                group = group,
                                isExpanded = viewModel.matrixOpenGroups.contains(group.id),
                                roles = viewModel.matrixRoles,
                                groupState = { roleSlug ->
                                    viewModel.groupRoleState(group = group, roleSlug = roleSlug)
                                },
                                isPermissionEnabled = { roleSlug, permissionSlug ->
                                    viewModel.isPermissionEnabled(
                                        roleSlug = roleSlug,
                                        permissionSlug = permissionSlug,
                                    )
                                },
                                onToggleExpanded = {
                                    viewModel.toggleGroupExpanded(group.id)
                                },
                                onToggleGroupForRole = { role, enabled ->
                                    viewModel.toggleGroupForRole(
                                        group = group,
                                        role = role,
                                        enabled = enabled,
                                        token = token,
                                        language = resolvedLanguageCode,
                                        currency = currency,
                                    )
                                },
                                onTogglePermission = { role, permissionSlug, enabled ->
                                    viewModel.togglePermission(
                                        role = role,
                                        permissionSlug = permissionSlug,
                                        enabled = enabled,
                                        token = token,
                                        language = resolvedLanguageCode,
                                        currency = currency,
                                    )
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminRolesMatrixHeaderRow(
    languageCode: String,
    roles: List<AdminRoleLite>,
    roleState: (String) -> MatrixCheckboxState,
    onToggleRole: (AdminRoleLite, Boolean) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = rolesString("admin.roles.permission_matrix.permissions", languageCode),
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraSecondaryText,
            modifier = Modifier.width(230.dp),
        )

        roles.forEach { role ->
            val state = roleState(role.slug)
            Button(
                onClick = { onToggleRole(role, !state.all) },
                modifier = Modifier.width(112.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraMutedSurface,
                    contentColor = TrustoraPrimary,
                ),
                shape = RoundedCornerShape(8.dp),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = role.name,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 1,
                    )
                    Icon(
                        imageVector = checkboxIcon(state),
                        contentDescription = null,
                        tint = if (state.none) TrustoraTertiaryText else TrustoraPrimary,
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminRolesMatrixGroupCard(
    group: AdminPermissionGroup,
    isExpanded: Boolean,
    roles: List<AdminRoleLite>,
    groupState: (String) -> MatrixCheckboxState,
    isPermissionEnabled: (roleSlug: String, permissionSlug: String) -> Boolean,
    onToggleExpanded: () -> Unit,
    onToggleGroupForRole: (AdminRoleLite, Boolean) -> Unit,
    onTogglePermission: (AdminRoleLite, String, Boolean) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().clickable(onClick = onToggleExpanded),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = if (isExpanded) Icons.Filled.ArrowDropDown else Icons.Filled.MoreHoriz,
                contentDescription = null,
                tint = TrustoraTertiaryText,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = group.name,
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraPrimaryText,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = group.permissions.size.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraTertiaryText,
            )
        }

        if (isExpanded) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Spacer(modifier = Modifier.width(230.dp))
                roles.forEach { role ->
                    val state = groupState(role.slug)
                    IconButton(
                        onClick = { onToggleGroupForRole(role, !state.all) },
                        modifier = Modifier.width(112.dp).height(30.dp),
                    ) {
                        Icon(
                            imageVector = checkboxIcon(state),
                            contentDescription = null,
                            tint = if (state.none) TrustoraTertiaryText else TrustoraPrimary,
                        )
                    }
                }
            }

            group.permissions.forEach { permission ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(
                        modifier = Modifier.width(230.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Text(
                            text = permission.name,
                            style = MaterialTheme.typography.bodySmall,
                            color = TrustoraPrimaryText,
                        )
                        Text(
                            text = permission.slug,
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                    }

                    roles.forEach { role ->
                        val enabled = isPermissionEnabled(role.slug, permission.slug)
                        IconButton(
                            onClick = { onTogglePermission(role, permission.slug, !enabled) },
                            modifier = Modifier.width(112.dp).height(30.dp),
                        ) {
                            Icon(
                                imageVector = if (enabled) Icons.Filled.CheckBox else Icons.Filled.CheckBoxOutlineBlank,
                                contentDescription = null,
                                tint = if (enabled) TrustoraPrimary else TrustoraTertiaryText,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminRolesEmptyState(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(
            imageVector = Icons.Filled.Tune,
            contentDescription = null,
            tint = TrustoraTertiaryText,
            modifier = Modifier.size(24.dp),
        )
        Text(
            text = rolesString("admin.roles.no_roles_title", languageCode),
            style = MaterialTheme.typography.bodyLarge,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Text(
            text = rolesString("admin.roles.no_roles_description", languageCode),
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminRolesRetryCard(
    message: String,
    languageCode: String,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFFEF2F2))
            .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(10.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFFB91C1C),
        )
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraMutedSurface,
                contentColor = TrustoraPrimary,
            ),
            shape = RoundedCornerShape(100.dp),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
        ) {
            Text(rolesString("admin.users.retry", languageCode))
        }
    }
}

@Composable
private fun AdminRoleFormSheet(
    languageCode: String,
    mode: AdminRoleEditorMode,
    initialDraft: AdminRoleEditorDraft,
    permissionGroups: List<AdminPermissionGroup>,
    isSubmitting: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSubmit: (AdminRoleEditorDraft, AdminRoleEditorMode, (Boolean) -> Unit) -> Unit,
) {
    var localDraft by remember(mode, initialDraft) { mutableStateOf(initialDraft) }
    var openGroups by remember(mode, permissionGroups) {
        mutableStateOf(permissionGroups.map { it.id }.toSet())
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = if (mode == AdminRoleEditorMode.CREATE) {
                        rolesString("admin.roles.new_role.title", languageCode)
                    } else {
                        rolesString("admin.roles.edit_role.title", languageCode)
                    },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TrustoraPrimaryText,
                )
                TextButton(onClick = onDismiss) {
                    Text(
                        text = if (mode == AdminRoleEditorMode.CREATE) {
                            rolesString("admin.roles.new_role.cancel", languageCode)
                        } else {
                            rolesString("admin.roles.edit_role.cancel", languageCode)
                        },
                    )
                }
            }

            errorMessage
                ?.takeIf { it.isNotBlank() }
                ?.let { error ->
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFB91C1C),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFFEF2F2))
                            .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                    )
                }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = if (mode == AdminRoleEditorMode.CREATE) {
                        rolesString("admin.roles.new_role.name_label", languageCode)
                    } else {
                        rolesString("admin.roles.edit_role.name_label", languageCode)
                    },
                    style = MaterialTheme.typography.labelLarge,
                    color = TrustoraSecondaryText,
                )
                OutlinedTextField(
                    value = localDraft.name,
                    onValueChange = { localDraft = localDraft.copy(name = it) },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = MaterialTheme.typography.bodyMedium,
                    placeholder = {
                        Text(
                            text = if (mode == AdminRoleEditorMode.CREATE) {
                                rolesString("admin.roles.new_role.name_placeholder", languageCode)
                            } else {
                                rolesString("admin.roles.edit_role.name_placeholder", languageCode)
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = TrustoraTertiaryText,
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = TrustoraMutedSurface,
                        focusedContainerColor = TrustoraMutedSurface,
                        unfocusedBorderColor = TrustoraBorder,
                        focusedBorderColor = TrustoraPrimary,
                    ),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true,
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = if (mode == AdminRoleEditorMode.CREATE) {
                        rolesString("admin.roles.new_role.description_label", languageCode)
                    } else {
                        rolesString("admin.roles.edit_role.description_label", languageCode)
                    },
                    style = MaterialTheme.typography.labelLarge,
                    color = TrustoraSecondaryText,
                )
                OutlinedTextField(
                    value = localDraft.description,
                    onValueChange = { localDraft = localDraft.copy(description = it) },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = MaterialTheme.typography.bodyMedium,
                    placeholder = {
                        Text(
                            text = if (mode == AdminRoleEditorMode.CREATE) {
                                rolesString("admin.roles.new_role.description_placeholder", languageCode)
                            } else {
                                rolesString("admin.roles.edit_role.description_placeholder", languageCode)
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = TrustoraTertiaryText,
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = TrustoraMutedSurface,
                        focusedContainerColor = TrustoraMutedSurface,
                        unfocusedBorderColor = TrustoraBorder,
                        focusedBorderColor = TrustoraPrimary,
                    ),
                    shape = RoundedCornerShape(10.dp),
                    minLines = 2,
                    maxLines = 5,
                )
            }

            if (mode == AdminRoleEditorMode.EDIT) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = rolesString("admin.roles.edit_role.sort_order_label", languageCode),
                        style = MaterialTheme.typography.labelLarge,
                        color = TrustoraSecondaryText,
                    )
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        IconButton(
                            onClick = { localDraft = localDraft.copy(sortOrder = localDraft.sortOrder - 1) },
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(TrustoraMutedSurface),
                        ) {
                            Text("-", color = TrustoraPrimary, style = MaterialTheme.typography.titleMedium)
                        }

                        OutlinedTextField(
                            value = localDraft.sortOrder.toString(),
                            onValueChange = { text ->
                                text.toIntOrNull()?.let { value ->
                                    localDraft = localDraft.copy(sortOrder = value)
                                }
                            },
                            modifier = Modifier.width(100.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedContainerColor = TrustoraMutedSurface,
                                focusedContainerColor = TrustoraMutedSurface,
                                unfocusedBorderColor = TrustoraBorder,
                                focusedBorderColor = TrustoraPrimary,
                            ),
                            shape = RoundedCornerShape(10.dp),
                        )

                        IconButton(
                            onClick = { localDraft = localDraft.copy(sortOrder = localDraft.sortOrder + 1) },
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(TrustoraMutedSurface),
                        ) {
                            Text("+", color = TrustoraPrimary, style = MaterialTheme.typography.titleMedium)
                        }
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = rolesString("admin.roles.new_role.permissions_title", languageCode),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TrustoraPrimaryText,
                )

                permissionGroups.forEach { group ->
                    val isExpanded = openGroups.contains(group.id)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(TrustoraSurface)
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                            .padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable {
                                openGroups = if (isExpanded) openGroups - group.id else openGroups + group.id
                            },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Icon(
                                imageVector = if (isExpanded) Icons.Filled.ArrowDropDown else Icons.Filled.MoreHoriz,
                                contentDescription = null,
                                tint = TrustoraTertiaryText,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                text = group.name,
                                style = MaterialTheme.typography.labelLarge,
                                color = TrustoraPrimaryText,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                text = group.permissions.size.toString(),
                                style = MaterialTheme.typography.bodySmall,
                                color = TrustoraTertiaryText,
                            )
                        }

                        if (isExpanded) {
                            group.permissions.forEach { permission ->
                                val selected = localDraft.permissionIds.contains(permission.id)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            val updated = localDraft.permissionIds.toMutableSet()
                                            if (selected) {
                                                updated.remove(permission.id)
                                            } else {
                                                updated.add(permission.id)
                                            }
                                            localDraft = localDraft.copy(permissionIds = updated)
                                        }
                                        .padding(vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Icon(
                                        imageVector = if (selected) Icons.Filled.CheckBox else Icons.Filled.CheckBoxOutlineBlank,
                                        contentDescription = null,
                                        tint = if (selected) TrustoraPrimary else TrustoraTertiaryText,
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = permission.name,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TrustoraPrimaryText,
                                        )
                                        Text(
                                            text = permission.slug,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TrustoraTertiaryText,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Button(
                onClick = {
                    onSubmit(localDraft, mode) { success ->
                        if (success) onDismiss()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = localDraft.isValid && !isSubmitting,
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                    disabledContainerColor = TrustoraMutedSurface,
                    disabledContentColor = TrustoraTertiaryText,
                ),
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = TrustoraAccentButtonText,
                        strokeWidth = 2.dp,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    text = if (mode == AdminRoleEditorMode.CREATE) {
                        if (isSubmitting) {
                            rolesString("admin.roles.new_role.creating", languageCode)
                        } else {
                            rolesString("admin.roles.new_role.create_button", languageCode)
                        }
                    } else {
                        if (isSubmitting) {
                            rolesString("admin.roles.edit_role.editing", languageCode)
                        } else {
                            rolesString("admin.roles.edit_role.edit_button", languageCode)
                        }
                    },
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

private fun checkboxIcon(state: MatrixCheckboxState): ImageVector {
    return when {
        state.all -> Icons.Filled.CheckBox
        state.indeterminate -> Icons.Filled.IndeterminateCheckBox
        else -> Icons.Filled.CheckBoxOutlineBlank
    }
}

private enum class AdminRoleEditorMode {
    CREATE,
    EDIT,
}

private fun rolesTemplate(
    text: String,
    placeholders: Map<String, String>,
): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun rolesString(
    key: String,
    languageCode: String,
): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "common.clear" -> if (ro) "Resetează" else "Clear"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.roles.tabs.roles" -> if (ro) "Roluri" else "Roles"
        "admin.roles.tabs.permissions" -> if (ro) "Permisiuni" else "Permissions"
        "admin.roles.manage_title" -> if (ro) "Gestionare Roluri" else "Manage Roles"
        "admin.roles.manage_subtitle" -> if (ro) "Administrează rolurile și permisiunile" else "Administer roles and permissions"
        "admin.roles.add_role" -> if (ro) "Adaugă Rol" else "Add Role"
        "admin.roles.search_placeholder" -> if (ro) "Caută roluri după titlu..." else "Search roles by title..."
        "admin.roles.search_button" -> if (ro) "Caută" else "Search"
        "admin.roles.list_title" -> if (ro) "Lista Roluri" else "Roles List"
        "admin.roles.list_description_one" -> if (ro) "1 rol găsit" else "1 role found"
        "admin.roles.list_description_other" -> if (ro) "{count} roluri găsite" else "{count} roles found"
        "admin.roles.no_roles_title" -> if (ro) "Nu s-au găsit roluri" else "No roles found"
        "admin.roles.no_roles_description" -> if (ro) "Încearcă să modifici termenii de căutare" else "Try adjusting search terms"
        "admin.roles.edit" -> if (ro) "Editează" else "Edit"
        "admin.roles.delete" -> if (ro) "Șterge" else "Delete"
        "admin.roles.confirm_delete" -> if (ro) "Ești sigur că vrei să ștergi acest rol?" else "Are you sure you want to delete this role?"
        "admin.roles.permissions_count" -> if (ro) "{count} permisiuni" else "{count} permissions"
        "admin.roles.pagination.page_of" -> if (ro) "Pagina {page} din {last}" else "Page {page} of {last}"
        "admin.roles.pagination.per_page" -> if (ro) "Pe pagină" else "Per page"
        "admin.roles.pagination.previous" -> if (ro) "Înapoi" else "Previous"
        "admin.roles.pagination.next" -> if (ro) "Înainte" else "Next"

        "admin.roles.permission_matrix.title" -> if (ro) "Gestionare Acces" else "Access Management"
        "admin.roles.permission_matrix.subtitle" -> if (ro) "Roluri și permisiuni" else "Roles and permissions"
        "admin.roles.permission_matrix.search_placeholder" -> if (ro) "Caută permisiuni (nume / slug / descriere)" else "Search permissions (name / slug / description)"
        "admin.roles.permission_matrix.saving_changes" -> if (ro) "Se salvează modificările..." else "Saving changes..."
        "admin.roles.permission_matrix.saved_auto" -> if (ro) "Toate schimbările sunt salvate automat" else "All changes are saved automatically"
        "admin.roles.permission_matrix.permissions" -> if (ro) "Permisiuni" else "Permissions"
        "admin.roles.permission_matrix.no_permissions" -> if (ro) "Nicio permisiune găsită pentru filtrul curent." else "No permissions found for current filter."

        "admin.roles.new_role.title" -> if (ro) "Adaugă Rol Nou" else "Add New Role"
        "admin.roles.new_role.name_label" -> if (ro) "Nume Rol *" else "Role Name *"
        "admin.roles.new_role.name_placeholder" -> if (ro) "ex: Administrator" else "e.g., Administrator"
        "admin.roles.new_role.description_label" -> if (ro) "Descriere Rol *" else "Role Description *"
        "admin.roles.new_role.description_placeholder" -> if (ro) "ex: Poate administra utilizatori și setări" else "e.g., Can manage users and settings"
        "admin.roles.new_role.permissions_title" -> if (ro) "Permisiuni" else "Permissions"
        "admin.roles.new_role.creating" -> if (ro) "Se creează..." else "Creating..."
        "admin.roles.new_role.create_button" -> if (ro) "Creează Rolul" else "Create Role"
        "admin.roles.new_role.cancel" -> if (ro) "Anulează" else "Cancel"

        "admin.roles.edit_role.title" -> if (ro) "Editează Rol" else "Edit Role"
        "admin.roles.edit_role.name_label" -> if (ro) "Nume Rol *" else "Role Name *"
        "admin.roles.edit_role.name_placeholder" -> if (ro) "ex: Administrator" else "e.g., Administrator"
        "admin.roles.edit_role.description_label" -> if (ro) "Descriere Rol *" else "Role Description *"
        "admin.roles.edit_role.description_placeholder" -> if (ro) "ex: Poate administra utilizatori și setări" else "e.g., Can manage users and settings"
        "admin.roles.edit_role.sort_order_label" -> if (ro) "Ordine rol" else "Role order"
        "admin.roles.edit_role.edit_button" -> if (ro) "Editează Rolul" else "Edit Role"
        "admin.roles.edit_role.editing" -> if (ro) "Se editează..." else "Editing..."
        "admin.roles.edit_role.cancel" -> if (ro) "Anulează" else "Cancel"

        else -> key
    }
}

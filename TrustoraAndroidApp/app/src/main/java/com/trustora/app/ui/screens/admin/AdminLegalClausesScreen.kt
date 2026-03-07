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
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminLegalClause
import com.trustora.app.core.models.AdminLegalClauseEditorDraft
import com.trustora.app.core.models.AdminLegalClauseEditorMode
import com.trustora.app.core.models.AdminLegalClauseLanguageOption
import com.trustora.app.core.models.AdminLegalClausesSortBy
import com.trustora.app.core.models.AdminLegalClausesSortDirection
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
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun AdminLegalClausesScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminLegalClausesViewModel,
    onBack: () -> Unit,
) {
    val resolvedLanguageCode = remember(languageCode) {
        if (languageCode.startsWith("ro", ignoreCase = true)) {
            "ro"
        } else {
            "en"
        }
    }
    val canView = remember(user, token) {
        hasLegalClausesAccess(
            user = user,
            hasToken = token.isNotBlank(),
            requiredPermissions = listOf("legal.clauses.read"),
        )
    }
    val canCreate = remember(user, token) {
        hasLegalClausesAccess(
            user = user,
            hasToken = token.isNotBlank(),
            requiredPermissions = listOf("legal.clauses.create"),
        )
    }
    val canEdit = remember(user, token) {
        hasLegalClausesAccess(
            user = user,
            hasToken = token.isNotBlank(),
            requiredPermissions = listOf("legal.clauses.update"),
        )
    }
    val canDelete = remember(user, token) {
        hasLegalClausesAccess(
            user = user,
            hasToken = token.isNotBlank(),
            requiredPermissions = listOf("legal.clauses.delete"),
        )
    }

    var isEditorPresented by remember { mutableStateOf(false) }
    var editorMode by remember { mutableStateOf<AdminLegalClauseEditorMode>(AdminLegalClauseEditorMode.CREATE) }
    var editorDraft by remember { mutableStateOf(AdminLegalClauseEditorDraft()) }
    var editorLanguageCode by remember { mutableStateOf("ro") }
    var deleteCandidate by remember { mutableStateOf<AdminLegalClause?>(null) }
    var isPreparingEdit by remember { mutableStateOf(false) }

    fun reloadData() {
        viewModel.load(
            token = token,
            language = resolvedLanguageCode,
            currency = currency,
        )
        viewModel.loadCategories(
            token = token,
            language = resolvedLanguageCode,
            currency = currency,
        )
    }

    fun openCreateEditor() {
        viewModel.actionErrorMessage = null
        editorMode = AdminLegalClauseEditorMode.CREATE
        editorLanguageCode = "ro"
        editorDraft = AdminLegalClauseEditorDraft()
        isEditorPresented = true
    }

    fun openEditEditor(clause: AdminLegalClause) {
        if (!canEdit) return

        isPreparingEdit = true
        viewModel.actionErrorMessage = null
        val selectedLanguage = if (viewModel.languageFilter == "all") {
            resolvedLanguageCode
        } else {
            viewModel.languageFilter
        }
        viewModel.loadClauseDetail(
            clauseId = clause.id,
            languageFilter = selectedLanguage,
            token = token,
            language = resolvedLanguageCode,
            currency = currency,
        ) { detail ->
            if (detail != null) {
                editorDraft = AdminLegalClauseEditorDraft()
                    .apply(detail)
                    .copy(selectedLanguage = selectedLanguage)
                editorLanguageCode = selectedLanguage
                editorMode = AdminLegalClauseEditorMode.EDIT(clause.id)
                isEditorPresented = true
            }
            isPreparingEdit = false
        }
    }

    LaunchedEffect(user.id, token, resolvedLanguageCode, currency.raw, canView) {
        if (canView) {
            reloadData()
        }
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
            AdminLegalClausesTopBar(
                languageCode = languageCode,
                canAdd = canView && canCreate,
                onBack = onBack,
                onAdd = ::openCreateEditor,
            )

            if (!canView) {
                AdminLegalClausesUnavailableState(languageCode = languageCode)
            } else {
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = viewModel.isLoading,
                    onRefresh = ::reloadData,
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        AdminLegalClausesHeaderCard(languageCode = languageCode)
                        AdminLegalClausesFiltersCard(
                            languageCode = languageCode,
                            viewModel = viewModel,
                            onApply = {
                                viewModel.page = 1
                                reloadData()
                            },
                            onReset = {
                                viewModel.resetFilters()
                                reloadData()
                            },
                        )
                        AdminLegalClausesListCard(
                            languageCode = languageCode,
                            clauses = viewModel.filteredClauses,
                            totalClauses = viewModel.totalClauses,
                            isLoading = viewModel.isLoading,
                            errorMessage = viewModel.errorMessage,
                            actionErrorMessage = viewModel.actionErrorMessage,
                            hasNextPage = viewModel.hasNextPage,
                            hasPreviousPage = viewModel.hasPreviousPage,
                            currentPage = viewModel.page,
                            lastPage = viewModel.lastPage,
                            canCreate = canCreate,
                            canEdit = canEdit,
                            canDelete = canDelete,
                            selectedLanguageFilter = viewModel.languageFilter,
                            resolvedLanguageCode = resolvedLanguageCode,
                            onRetry = ::reloadData,
                            onOpenCreate = ::openCreateEditor,
                            onOpenEdit = ::openEditEditor,
                            onDelete = { clause -> deleteCandidate = clause },
                            onLoadNextPage = {
                                if (viewModel.hasNextPage && !viewModel.isLoading) {
                                    viewModel.page += 1
                                    reloadData()
                                }
                            },
                            onPreviousPage = {
                                if (viewModel.hasPreviousPage && !viewModel.isLoading) {
                                    viewModel.page -= 1
                                    reloadData()
                                }
                            },
                            onNextPage = {
                                if (viewModel.hasNextPage && !viewModel.isLoading) {
                                    viewModel.page += 1
                                    reloadData()
                                }
                            },
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        if (isPreparingEdit) {
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
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.4.dp, color = TrustoraPrimary)
                    Text(
                        text = legalClausesString("admin.loading", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    if (isEditorPresented) {
        AdminLegalClauseFormSheet(
            languageCode = languageCode,
            mode = editorMode,
            selectedLanguageCode = editorLanguageCode,
            initialDraft = editorDraft,
            isSubmitting = viewModel.isSubmitting,
            errorMessage = viewModel.actionErrorMessage,
            onDismiss = { isEditorPresented = false },
            onSubmit = { draft, mode, selectedLanguage, onCompleted ->
                when (mode) {
                    AdminLegalClauseEditorMode.CREATE -> {
                        viewModel.createClause(
                            draft = draft,
                            token = token,
                            language = resolvedLanguageCode,
                            currency = currency,
                            onCompleted = onCompleted,
                        )
                    }

                    is AdminLegalClauseEditorMode.EDIT -> {
                        viewModel.updateClause(
                            clauseId = mode.clauseId,
                            draft = draft,
                            languageCode = selectedLanguage,
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

    deleteCandidate?.let { clause ->
        AlertDialog(
            onDismissRequest = { deleteCandidate = null },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteClause(
                            clause = clause,
                            token = token,
                            language = resolvedLanguageCode,
                            currency = currency,
                        ) {
                            deleteCandidate = null
                        }
                    },
                ) {
                    Text(legalClausesString("admin.legal_clauses.delete", languageCode))
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) {
                    Text(legalClausesString("common.cancel", languageCode))
                }
            },
            title = {
                Text(legalClausesString("admin.legal_clauses.confirm_delete", languageCode))
            },
        )
    }
}

@Composable
private fun AdminLegalClausesTopBar(
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
                text = legalClausesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = legalClausesString("admin.legal_clauses.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))

        if (canAdd) {
            IconButton(
                onClick = onAdd,
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(TrustoraSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp)),
            ) {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = legalClausesString("admin.legal_clauses.add_clause", languageCode),
                    tint = TrustoraPrimary,
                    modifier = Modifier.size(16.dp),
                )
            }
        } else {
            Spacer(modifier = Modifier.width(32.dp))
        }
    }
}

@Composable
private fun AdminLegalClausesUnavailableState(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = Icons.Filled.LockPerson,
            contentDescription = null,
            tint = TrustoraPrimary,
            modifier = Modifier.size(36.dp),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = legalClausesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = legalClausesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminLegalClausesHeaderCard(languageCode: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = legalClausesString("admin.legal_clauses.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = legalClausesString("admin.legal_clauses.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminLegalClausesFiltersCard(
    languageCode: String,
    viewModel: AdminLegalClausesViewModel,
    onApply: () -> Unit,
    onReset: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        OutlinedTextField(
            value = viewModel.searchText,
            onValueChange = { viewModel.searchText = it },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = TrustoraTertiaryText) },
            placeholder = { Text(legalClausesString("admin.legal_clauses.search_placeholder", languageCode)) },
            singleLine = true,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = viewModel.categoryFilter,
                onValueChange = { viewModel.categoryFilter = it },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.bodySmall,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
                placeholder = { Text(legalClausesString("admin.legal_clauses.category_filter_placeholder", languageCode)) },
                singleLine = true,
            )
            OutlinedTextField(
                value = viewModel.identifierFilter,
                onValueChange = { viewModel.identifierFilter = it },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.bodySmall,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
                placeholder = { Text(legalClausesString("admin.legal_clauses.identifier_filter_placeholder", languageCode)) },
                singleLine = true,
            )
        }

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            LegalClausesFilterMenu(
                title = legalClausesString("admin.legal_clauses.language_filter_title", languageCode),
                value = languageLabel(viewModel.languageFilter, languageCode),
            ) {
                AdminLegalClauseLanguageOption.all.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(legalClausesString(option.titleKey, languageCode)) },
                        onClick = {
                            viewModel.languageFilter = option.code
                            viewModel.page = 1
                            dismiss()
                        },
                    )
                }
            }

            LegalClausesFilterMenu(
                title = legalClausesString("admin.legal_clauses.sort_by_title", languageCode),
                value = legalClausesString(viewModel.sortBy.titleKey, languageCode),
            ) {
                AdminLegalClausesSortBy.entries.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(legalClausesString(option.titleKey, languageCode)) },
                        onClick = {
                            viewModel.sortBy = option
                            viewModel.page = 1
                            dismiss()
                        },
                    )
                }
            }

            LegalClausesFilterMenu(
                title = legalClausesString("admin.legal_clauses.sort_direction_title", languageCode),
                value = legalClausesString(viewModel.sortDirection.titleKey, languageCode),
            ) {
                AdminLegalClausesSortDirection.entries.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(legalClausesString(option.titleKey, languageCode)) },
                        onClick = {
                            viewModel.sortDirection = option
                            viewModel.page = 1
                            dismiss()
                        },
                    )
                }
            }

            LegalClausesFilterMenu(
                title = legalClausesString("admin.legal_clauses.per_page_title", languageCode),
                value = viewModel.perPage.toString(),
            ) {
                listOf(10, 15, 25, 50, 100).forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option.toString()) },
                        onClick = {
                            viewModel.perPage = option
                            viewModel.page = 1
                            dismiss()
                        },
                    )
                }
            }
        }

        if (viewModel.categories.isNotEmpty()) {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                viewModel.categories.forEach { category ->
                    val selected = viewModel.categoryFilter == category
                    Text(
                        text = category,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected) Color(0xFF052E16) else TrustoraSecondaryText,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (selected) TrustoraAccent.copy(alpha = 0.28f) else TrustoraSurface)
                            .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
                            .clickable {
                                viewModel.categoryFilter = category
                                viewModel.page = 1
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Button(
                onClick = onApply,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraMutedSurface,
                    contentColor = TrustoraPrimary,
                ),
            ) {
                Text(legalClausesString("admin.legal_clauses.apply_filters", languageCode))
            }

            Button(
                onClick = onReset,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraMutedSurface,
                    contentColor = TrustoraPrimary,
                ),
            ) {
                Text(legalClausesString("admin.legal_clauses.reset_filters", languageCode))
            }
        }
    }
}

@Composable
private fun LegalClausesFilterMenu(
    title: String,
    value: String,
    content: @Composable DropdownMenuScopeWithDismiss.() -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(TrustoraMutedSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                .clickable { expanded = true }
                .padding(horizontal = 10.dp, vertical = 8.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.labelLarge,
                    color = TrustoraPrimaryText,
                )
                Icon(
                    imageVector = Icons.Filled.ArrowDropDown,
                    contentDescription = null,
                    tint = TrustoraSecondaryText,
                    modifier = Modifier.size(16.dp),
                )
            }
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuScopeWithDismiss(
                dismiss = { expanded = false },
            ).content()
        }
    }
}

private class DropdownMenuScopeWithDismiss(
    private val dismiss: () -> Unit,
) {
    fun dismiss() = dismiss.invoke()
}

@Composable
private fun AdminLegalClausesListCard(
    languageCode: String,
    clauses: List<AdminLegalClause>,
    totalClauses: Int,
    isLoading: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    hasNextPage: Boolean,
    hasPreviousPage: Boolean,
    currentPage: Int,
    lastPage: Int,
    canCreate: Boolean,
    canEdit: Boolean,
    canDelete: Boolean,
    selectedLanguageFilter: String,
    resolvedLanguageCode: String,
    onRetry: () -> Unit,
    onOpenCreate: () -> Unit,
    onOpenEdit: (AdminLegalClause) -> Unit,
    onDelete: (AdminLegalClause) -> Unit,
    onLoadNextPage: () -> Unit,
    onPreviousPage: () -> Unit,
    onNextPage: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Filled.Description, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = legalClausesString("admin.legal_clauses.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = legalClausesTemplate(
                legalClausesString("admin.legal_clauses.list_description", languageCode),
                mapOf(
                    "shown" to clauses.size.toString(),
                    "total" to totalClauses.toString(),
                ),
            ),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        when {
            !errorMessage.isNullOrBlank() -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFB91C1C),
                    )
                    Button(
                        onClick = onRetry,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TrustoraMutedSurface,
                            contentColor = TrustoraPrimary,
                        ),
                    ) {
                        Text(legalClausesString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading && clauses.isEmpty() -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            clauses.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.Description, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = legalClausesString("admin.legal_clauses.empty_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = legalClausesString("admin.legal_clauses.empty_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                        textAlign = TextAlign.Center,
                    )
                    if (canCreate) {
                        Button(
                            onClick = onOpenCreate,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = TrustoraMutedSurface,
                                contentColor = TrustoraPrimary,
                            ),
                        ) {
                            Text(legalClausesString("admin.legal_clauses.add_clause", languageCode))
                        }
                    }
                }
            }

            else -> {
                if (!actionErrorMessage.isNullOrBlank()) {
                    Text(
                        text = actionErrorMessage,
                        color = Color(0xFFB91C1C),
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFFEF2F2))
                            .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                            .padding(10.dp),
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    clauses.forEachIndexed { index, clause ->
                        AdminLegalClauseRow(
                            languageCode = languageCode,
                            clause = clause,
                            selectedLanguageFilter = selectedLanguageFilter,
                            resolvedLanguageCode = resolvedLanguageCode,
                            canEdit = canEdit,
                            canDelete = canDelete,
                            onEdit = { onOpenEdit(clause) },
                            onDelete = { onDelete(clause) },
                        )

                        if (index == clauses.lastIndex) {
                            LaunchedEffect(clause.id, hasNextPage, isLoading, currentPage) {
                                if (hasNextPage && !isLoading) {
                                    onLoadNextPage()
                                }
                            }
                        }
                    }
                }

                if (isLoading && clauses.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.1.dp)
                    }
                }

                if (lastPage > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = legalClausesTemplate(
                                legalClausesString("admin.legal_clauses.pagination", languageCode),
                                mapOf(
                                    "current" to currentPage.toString(),
                                    "last" to lastPage.toString(),
                                ),
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(
                                onClick = onPreviousPage,
                                enabled = hasPreviousPage,
                            ) {
                                Text(legalClausesString("admin.legal_clauses.pagination_previous", languageCode))
                            }

                            TextButton(
                                onClick = onNextPage,
                                enabled = hasNextPage,
                            ) {
                                Text(legalClausesString("admin.legal_clauses.pagination_next", languageCode))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminLegalClauseRow(
    languageCode: String,
    clause: AdminLegalClause,
    selectedLanguageFilter: String,
    resolvedLanguageCode: String,
    canEdit: Boolean,
    canDelete: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = clause.identifier,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )

                    Text(
                        text = clause.category,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFF8FAFC))
                            .border(1.dp, TrustoraBorder, CircleShape)
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    )
                }

                val preview = clausePreviewText(
                    clause = clause,
                    selectedLanguageFilter = selectedLanguageFilter,
                    resolvedLanguageCode = resolvedLanguageCode,
                )
                if (preview.isNotEmpty()) {
                    Text(
                        text = preview,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    val updatedText = formatDate(clause.updatedAtIso, languageCode = languageCode, includeTime = false)
                    if (!updatedText.isNullOrBlank()) {
                        Text(
                            text = legalClausesTemplate(
                                legalClausesString("admin.legal_clauses.updated_prefix", languageCode),
                                mapOf("date" to updatedText),
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraSecondaryText,
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(4.dp)
                            .clip(CircleShape)
                            .background(TrustoraBorder),
                    )
                    Text(
                        text = legalClausesTemplate(
                            legalClausesString("admin.legal_clauses.translations_count", languageCode),
                            mapOf("count" to clause.translationCount.toString()),
                        ),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                    )
                }
            }

            if (canEdit || canDelete) {
                AdminLegalClauseActionsMenu(
                    languageCode = languageCode,
                    canEdit = canEdit,
                    canDelete = canDelete,
                    onEdit = onEdit,
                    onDelete = onDelete,
                )
            }
        }
    }
}

@Composable
private fun AdminLegalClauseActionsMenu(
    languageCode: String,
    canEdit: Boolean,
    canDelete: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        IconButton(
            onClick = { expanded = true },
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(TrustoraMutedSurface)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp)),
        ) {
            Icon(Icons.Filled.MoreHoriz, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(16.dp))
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            if (canEdit) {
                DropdownMenuItem(
                    text = { Text(legalClausesString("admin.legal_clauses.edit", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Edit, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onEdit()
                    },
                )
            }

            if (canDelete) {
                DropdownMenuItem(
                    text = { Text(legalClausesString("admin.legal_clauses.delete", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Delete, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onDelete()
                    },
                )
            }
        }
    }
}

@Composable
private fun AdminLegalClauseFormSheet(
    languageCode: String,
    mode: AdminLegalClauseEditorMode,
    selectedLanguageCode: String,
    initialDraft: AdminLegalClauseEditorDraft,
    isSubmitting: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSubmit: (
        draft: AdminLegalClauseEditorDraft,
        mode: AdminLegalClauseEditorMode,
        selectedLanguage: String,
        onCompleted: (Boolean) -> Unit,
    ) -> Unit,
) {
    var draft by remember(mode, initialDraft) { mutableStateOf(initialDraft) }
    var activeLanguageCode by remember(mode, selectedLanguageCode) { mutableStateOf(selectedLanguageCode) }

    val canSubmit = when (mode) {
        AdminLegalClauseEditorMode.CREATE -> {
            draft.isCreateValid && !isSubmitting
        }

        is AdminLegalClauseEditorMode.EDIT -> {
            val hasIdentifier = draft.identifier.trim().isNotEmpty()
            val hasCategory = draft.category.trim().isNotEmpty()
            val hasText = draft.textFor(activeLanguageCode).trim().isNotEmpty()
            hasIdentifier && hasCategory && hasText && !isSubmitting
        }
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = when (mode) {
                    AdminLegalClauseEditorMode.CREATE -> legalClausesString("admin.legal_clauses.add_clause", languageCode)
                    is AdminLegalClauseEditorMode.EDIT -> legalClausesString("admin.legal_clauses.edit", languageCode)
                },
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )

            if (!errorMessage.isNullOrBlank()) {
                Text(
                    text = errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFB91C1C),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFEF2F2))
                        .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                        .padding(10.dp),
                )
            }

            LegalClauseFieldSection(
                title = when (mode) {
                    AdminLegalClauseEditorMode.CREATE -> legalClausesString("admin.legal_clauses.create_title", languageCode)
                    is AdminLegalClauseEditorMode.EDIT -> legalClausesString("admin.legal_clauses.edit_title", languageCode)
                },
                subtitle = when (mode) {
                    AdminLegalClauseEditorMode.CREATE -> legalClausesString("admin.legal_clauses.create_subtitle", languageCode)
                    is AdminLegalClauseEditorMode.EDIT -> legalClausesString("admin.legal_clauses.edit_subtitle", languageCode)
                },
            ) {
                LegalClauseTextField(
                    label = legalClausesString("admin.legal_clauses.identifier_label", languageCode),
                    value = draft.identifier,
                    onValueChange = { draft = draft.copy(identifier = it) },
                    placeholder = legalClausesString("admin.legal_clauses.identifier_placeholder", languageCode),
                    singleLine = true,
                )
                LegalClauseTextField(
                    label = legalClausesString("admin.legal_clauses.category_label", languageCode),
                    value = draft.category,
                    onValueChange = { draft = draft.copy(category = it) },
                    placeholder = legalClausesString("admin.legal_clauses.category_placeholder", languageCode),
                    singleLine = true,
                )
            }

            when (mode) {
                AdminLegalClauseEditorMode.CREATE -> {
                    LegalClauseFieldSection(
                        title = legalClausesString("admin.legal_clauses.translations_title", languageCode),
                        subtitle = legalClausesString("admin.legal_clauses.translations_subtitle", languageCode),
                    ) {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            AdminLegalClauseLanguageOption.editable.forEach { option ->
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    Text(
                                        text = legalClausesString(option.titleKey, languageCode),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TrustoraSecondaryText,
                                    )
                                    OutlinedTextField(
                                        value = draft.textFor(option.code),
                                        onValueChange = { value ->
                                            draft = draft.withText(option.code, value)
                                        },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(120.dp),
                                        textStyle = MaterialTheme.typography.bodyMedium,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = TrustoraAccent,
                                            unfocusedBorderColor = TrustoraBorder,
                                        ),
                                        maxLines = 6,
                                    )
                                }
                            }
                        }
                    }
                }

                is AdminLegalClauseEditorMode.EDIT -> {
                    LegalClauseFieldSection(
                        title = legalClausesString("admin.legal_clauses.text_title", languageCode),
                        subtitle = legalClausesString("admin.legal_clauses.text_subtitle", languageCode),
                    ) {
                        var languageMenuExpanded by remember { mutableStateOf(false) }
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = legalClausesString("admin.legal_clauses.language_filter_title", languageCode),
                                style = MaterialTheme.typography.labelLarge,
                                color = TrustoraSecondaryText,
                            )
                            Box {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(TrustoraSurface)
                                        .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                                        .clickable { languageMenuExpanded = true }
                                        .padding(horizontal = 10.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = languageLabel(activeLanguageCode, languageCode),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TrustoraPrimaryText,
                                    )
                                    Spacer(modifier = Modifier.weight(1f))
                                    Icon(
                                        imageVector = Icons.Filled.ArrowDropDown,
                                        contentDescription = null,
                                        tint = TrustoraSecondaryText,
                                    )
                                }

                                DropdownMenu(
                                    expanded = languageMenuExpanded,
                                    onDismissRequest = { languageMenuExpanded = false },
                                ) {
                                    AdminLegalClauseLanguageOption.editable.forEach { option ->
                                        DropdownMenuItem(
                                            text = { Text(legalClausesString(option.titleKey, languageCode)) },
                                            onClick = {
                                                activeLanguageCode = option.code
                                                languageMenuExpanded = false
                                            },
                                        )
                                    }
                                }
                            }
                        }

                        LegalClauseTextField(
                            label = languageLabel(activeLanguageCode, languageCode),
                            value = draft.textFor(activeLanguageCode),
                            onValueChange = { value -> draft = draft.withText(activeLanguageCode, value) },
                            placeholder = "",
                            singleLine = false,
                            minLines = 8,
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraMutedSurface,
                        contentColor = TrustoraPrimaryText,
                    ),
                ) {
                    Text(legalClausesString("common.cancel", languageCode))
                }

                Button(
                    onClick = {
                        onSubmit(draft, mode, activeLanguageCode) { success ->
                            if (success) {
                                onDismiss()
                            }
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = canSubmit,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                    ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = TrustoraAccentButtonText)
                    } else {
                        Text(
                            when (mode) {
                                AdminLegalClauseEditorMode.CREATE -> legalClausesString("admin.legal_clauses.create_clause", languageCode)
                                is AdminLegalClauseEditorMode.EDIT -> legalClausesString("admin.legal_clauses.save_changes", languageCode)
                            },
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

@Composable
private fun LegalClauseFieldSection(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = TrustoraPrimaryText,
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )
        content()
    }
}

@Composable
private fun LegalClauseTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    singleLine: Boolean,
    minLines: Int = 1,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraSecondaryText,
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            placeholder = {
                if (placeholder.isNotBlank()) {
                    Text(placeholder)
                }
            },
            singleLine = singleLine,
            minLines = minLines,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
        )
    }
}

private fun clausePreviewText(
    clause: AdminLegalClause,
    selectedLanguageFilter: String,
    resolvedLanguageCode: String,
): String {
    val preferredCode = if (selectedLanguageFilter == "all") resolvedLanguageCode else selectedLanguageFilter
    val value = clause.content[preferredCode]
        ?: clause.content["ro"]
        ?: clause.content["en"]
        ?: clause.content.values.firstOrNull()
        ?: ""
    val trimmed = value.trim()
    if (trimmed.isEmpty()) return ""
    return if (trimmed.length > 140) {
        "${trimmed.take(140)}…"
    } else {
        trimmed
    }
}

private fun hasLegalClausesAccess(
    user: AuthUser,
    hasToken: Boolean,
    requiredPermissions: List<String>,
): Boolean {
    if (!hasToken) return false
    if (user.isSuperuser) return true

    val hasRole = user.hasRole("admin") || user.hasRole("legal")
    if (!hasRole) return false

    if (requiredPermissions.isEmpty()) return true
    val available = user.permissions
        .map { it.trim().lowercase() }
        .filter { it.isNotEmpty() }
        .toSet()
    return requiredPermissions.all { permission ->
        available.contains(permission.trim().lowercase())
    }
}

private fun formatDate(rawIso: String?, languageCode: String, includeTime: Boolean): String? {
    val raw = rawIso?.trim().orEmpty()
    if (raw.isEmpty()) return null

    val instant = parseIsoInstant(raw) ?: return raw
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val zoned = instant.atZone(ZoneId.systemDefault())
    val formatter = if (includeTime) {
        DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM, FormatStyle.SHORT).withLocale(locale)
    } else {
        DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)
    }
    return formatter.format(zoned)
}

private fun parseIsoInstant(raw: String): Instant? {
    return runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toInstant() }.getOrNull()
}

private fun languageLabel(code: String, languageCode: String): String {
    val option = AdminLegalClauseLanguageOption.all.firstOrNull { it.code == code }
    return option?.let { legalClausesString(it.titleKey, languageCode) } ?: code.uppercase()
}

private fun legalClausesTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun legalClausesString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.legal_clauses.manage_title" -> if (ro) "Clauze Legale" else "Legal Clauses"
        "admin.legal_clauses.manage_subtitle" -> if (ro) "Gestionează clauzele legale și traducerile" else "Manage legal clauses and translations"
        "admin.legal_clauses.add_clause" -> if (ro) "Adaugă Clauză" else "Add Clause"
        "admin.legal_clauses.search_placeholder" -> if (ro) "Caută clauze după categorie, identificator sau conținut..." else "Search clauses by category, identifier, or content..."
        "admin.legal_clauses.category_filter_placeholder" -> if (ro) "Filtru categorie" else "Category filter"
        "admin.legal_clauses.identifier_filter_placeholder" -> if (ro) "Filtru identificator" else "Identifier filter"
        "admin.legal_clauses.language_filter_title" -> if (ro) "Limbă" else "Language"
        "admin.legal_clauses.sort_by_title" -> if (ro) "Sortează după" else "Sort by"
        "admin.legal_clauses.sort_direction_title" -> if (ro) "Direcție" else "Direction"
        "admin.legal_clauses.per_page_title" -> if (ro) "Per pagină" else "Per page"
        "admin.legal_clauses.apply_filters" -> if (ro) "Aplică" else "Apply"
        "admin.legal_clauses.reset_filters" -> if (ro) "Resetează" else "Reset"
        "admin.legal_clauses.sort.created_at" -> if (ro) "Data creării" else "Created at"
        "admin.legal_clauses.sort.updated_at" -> if (ro) "Data actualizării" else "Updated at"
        "admin.legal_clauses.sort.identifier" -> if (ro) "Identificator" else "Identifier"
        "admin.legal_clauses.sort.category" -> if (ro) "Categorie" else "Category"
        "admin.legal_clauses.sort_direction.asc" -> if (ro) "Crescător" else "Ascending"
        "admin.legal_clauses.sort_direction.desc" -> if (ro) "Descrescător" else "Descending"
        "admin.legal_clauses.languages.all" -> if (ro) "Toate limbile" else "All languages"
        "admin.legal_clauses.languages.en" -> if (ro) "Engleză" else "English"
        "admin.legal_clauses.languages.ro" -> if (ro) "Română" else "Romanian"
        "admin.legal_clauses.languages.de" -> if (ro) "Germană" else "German"
        "admin.legal_clauses.languages.it" -> if (ro) "Italiană" else "Italian"
        "admin.legal_clauses.languages.fr" -> if (ro) "Franceză" else "French"
        "admin.legal_clauses.languages.es" -> if (ro) "Spaniolă" else "Spanish"
        "admin.legal_clauses.languages.pl" -> if (ro) "Poloneză" else "Polish"
        "admin.legal_clauses.languages.nl" -> if (ro) "Olandeză" else "Dutch"
        "admin.legal_clauses.languages.ch" -> if (ro) "Chineză" else "Chinese"
        "admin.legal_clauses.languages.ie" -> if (ro) "Irlandeză" else "Irish"
        "admin.legal_clauses.list_title" -> if (ro) "Clauze" else "Clauses"
        "admin.legal_clauses.list_description" -> if (ro) "Se afișează {shown} din {total} clauze." else "Showing {shown} of {total} clauses."
        "admin.legal_clauses.updated_prefix" -> if (ro) "Actualizat {date}" else "Updated {date}"
        "admin.legal_clauses.translations_count" -> if (ro) "{count} traduceri" else "{count} translations"
        "admin.legal_clauses.pagination" -> if (ro) "Pagina {current} din {last}" else "Page {current} of {last}"
        "admin.legal_clauses.pagination_previous" -> if (ro) "Anterior" else "Previous"
        "admin.legal_clauses.pagination_next" -> if (ro) "Următor" else "Next"
        "admin.legal_clauses.empty_title" -> if (ro) "Nu s-au găsit clauze" else "No clauses found"
        "admin.legal_clauses.empty_description" -> if (ro) "Modifică filtrele sau adaugă o clauză nouă." else "Adjust filters or add a new legal clause."
        "admin.legal_clauses.confirm_delete" -> if (ro) "Ștergi această clauză legală?" else "Delete this legal clause?"
        "admin.legal_clauses.delete" -> if (ro) "Șterge" else "Delete"
        "admin.legal_clauses.edit" -> if (ro) "Editează" else "Edit"
        "admin.legal_clauses.create_title" -> if (ro) "Creează clauză legală" else "Create legal clause"
        "admin.legal_clauses.create_subtitle" -> if (ro) "Completează identificatorul, categoria și cel puțin o traducere." else "Provide identifier, category, and at least one translation."
        "admin.legal_clauses.edit_title" -> if (ro) "Editează clauză legală" else "Edit legal clause"
        "admin.legal_clauses.edit_subtitle" -> if (ro) "Actualizează metadatele și textul pentru limba selectată." else "Update metadata and clause text for the selected language."
        "admin.legal_clauses.identifier_label" -> if (ro) "Identificator" else "Identifier"
        "admin.legal_clauses.identifier_placeholder" -> "custom_clause"
        "admin.legal_clauses.category_label" -> if (ro) "Categorie" else "Category"
        "admin.legal_clauses.category_placeholder" -> "scope"
        "admin.legal_clauses.translations_title" -> if (ro) "Traduceri" else "Translations"
        "admin.legal_clauses.translations_subtitle" -> if (ro) "Completează traducerile disponibile. Câmpurile goale sunt ignorate." else "Fill in all available translations. Empty fields are ignored."
        "admin.legal_clauses.text_title" -> if (ro) "Textul clauzei" else "Clause text"
        "admin.legal_clauses.text_subtitle" -> if (ro) "Editează textul pentru limba selectată." else "Edit text for the selected language."
        "admin.legal_clauses.save_changes" -> if (ro) "Salvează" else "Save"
        "admin.legal_clauses.create_clause" -> if (ro) "Creează" else "Create"

        else -> key
    }
}

@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.trustora.app.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CreateNewFolder
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Remove
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
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminCategoryEditorDraft
import com.trustora.app.core.models.AdminCategoryEditorMode
import com.trustora.app.core.models.AdminCategorySummary
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
fun AdminCategoriesScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminCategoriesViewModel,
    onBack: () -> Unit,
    openCreateOnAppear: Boolean,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")
    val filteredCategories = viewModel.filteredCategories
    val rootCategories = remember(filteredCategories) {
        filteredCategories.filter { parentKey(it.parentId).isEmpty() }
    }
    val flattenedRows = remember(filteredCategories) {
        flattenCategoryRows(filteredCategories)
    }

    var isEditorPresented by remember { mutableStateOf(false) }
    var editorMode by remember { mutableStateOf(AdminCategoryEditorMode.CREATE) }
    var editingCategoryId by remember { mutableStateOf<String?>(null) }
    var editorDraft by remember { mutableStateOf(AdminCategoryEditorDraft()) }
    var deleteCandidate by remember { mutableStateOf<AdminCategorySummary?>(null) }
    var isPreparingEdit by remember { mutableStateOf(false) }
    var didHandleInitialCreate by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        if (openCreateOnAppear && !didHandleInitialCreate) {
            didHandleInitialCreate = true
            viewModel.actionErrorMessage = null
            editorMode = AdminCategoryEditorMode.CREATE
            editingCategoryId = null
            editorDraft = AdminCategoryEditorDraft()
            isEditorPresented = true
        }
        if (canAccessAdmin) {
            viewModel.load(
                token = token,
                language = languageCode,
                currency = currency,
                reset = true,
            )
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
            AdminCategoriesTopBar(
                languageCode = languageCode,
                canAccessAdmin = canAccessAdmin,
                onBack = onBack,
                onAdd = {
                    viewModel.actionErrorMessage = null
                    editorMode = AdminCategoryEditorMode.CREATE
                    editingCategoryId = null
                    editorDraft = AdminCategoryEditorDraft()
                    isEditorPresented = true
                },
            )

            if (!canAccessAdmin) {
                AdminCategoriesUnavailableState(languageCode = languageCode)
            } else {
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = viewModel.isLoading,
                    onRefresh = {
                        viewModel.load(
                            token = token,
                            language = languageCode,
                            currency = currency,
                            reset = true,
                        )
                    },
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        AdminCategoriesHeaderCard(languageCode = languageCode)
                        AdminCategoriesFiltersCard(
                            languageCode = languageCode,
                            searchText = viewModel.searchText,
                            onSearchTextChanged = { viewModel.searchText = it },
                        )
                        AdminCategoriesListCard(
                            languageCode = languageCode,
                            categories = filteredCategories,
                            rows = flattenedRows,
                            rootsCount = rootCategories.size,
                            isLoading = viewModel.isLoading,
                            isLoadingMore = viewModel.isLoadingMore,
                            hasMorePages = viewModel.hasMorePages,
                            errorMessage = viewModel.errorMessage,
                            actionErrorMessage = viewModel.actionErrorMessage,
                            onRetry = {
                                viewModel.load(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                    reset = true,
                                )
                            },
                            onAddFirst = {
                                viewModel.actionErrorMessage = null
                                editorMode = AdminCategoryEditorMode.CREATE
                                editingCategoryId = null
                                editorDraft = AdminCategoryEditorDraft()
                                isEditorPresented = true
                            },
                            onLoadMore = {
                                viewModel.loadNextPage(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onEdit = { category ->
                                isPreparingEdit = true
                                viewModel.loadCategoryDetail(
                                    categoryId = category.id,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                ) { detail ->
                                    if (detail != null) {
                                        editorMode = AdminCategoryEditorMode.EDIT
                                        editingCategoryId = category.id
                                        editorDraft = AdminCategoryEditorDraft().apply(detail)
                                        isEditorPresented = true
                                    }
                                    isPreparingEdit = false
                                }
                            },
                            onDelete = { category ->
                                deleteCandidate = category
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
                        text = categoriesString("admin.loading", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    if (isEditorPresented) {
        val parentOptions = remember(viewModel.allCategories, editingCategoryId) {
            parentCategoryOptions(
                categories = viewModel.allCategories,
                excludingCategoryId = editingCategoryId,
            )
        }
        AdminCategoryFormSheet(
            languageCode = languageCode,
            mode = editorMode,
            initialDraft = editorDraft,
            parentCategories = parentOptions,
            isSubmitting = viewModel.isSubmitting,
            errorMessage = viewModel.actionErrorMessage,
            onDismiss = { isEditorPresented = false },
            onLoadCategorySlug = { categoryId, onResult ->
                viewModel.loadCategorySlug(
                    categoryId = categoryId,
                    token = token,
                    language = languageCode,
                    currency = currency,
                    onResult = onResult,
                )
            },
            onSubmit = { draft, onCompleted ->
                when (editorMode) {
                    AdminCategoryEditorMode.CREATE -> {
                        viewModel.createCategory(
                            draft = draft,
                            token = token,
                            language = languageCode,
                            currency = currency,
                            onCompleted = onCompleted,
                        )
                    }

                    AdminCategoryEditorMode.EDIT -> {
                        val categoryId = editingCategoryId.orEmpty()
                        if (categoryId.isEmpty()) {
                            onCompleted(false)
                        } else {
                            viewModel.updateCategory(
                                categoryId = categoryId,
                                draft = draft,
                                token = token,
                                language = languageCode,
                                currency = currency,
                                onCompleted = onCompleted,
                            )
                        }
                    }
                }
            },
        )
    }

    if (deleteCandidate != null) {
        AlertDialog(
            onDismissRequest = { deleteCandidate = null },
            confirmButton = {
                TextButton(
                    onClick = {
                        val target = deleteCandidate
                        deleteCandidate = null
                        if (target != null) {
                            viewModel.deleteCategory(
                                category = target,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        }
                    },
                ) {
                    Text(categoriesString("admin.categories.delete", languageCode), color = Color(0xFFB91C1C))
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) {
                    Text(categoriesString("common.cancel", languageCode))
                }
            },
            title = {
                Text(categoriesString("admin.categories.confirm_delete", languageCode))
            },
            text = {
                Text(deleteCandidate?.name.orEmpty())
            },
        )
    }
}

@Composable
private fun AdminCategoriesTopBar(
    languageCode: String,
    canAccessAdmin: Boolean,
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
                text = categoriesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = categoriesString("admin.categories.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.weight(1f))

        if (canAccessAdmin) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(TrustoraSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                    .clickable(onClick = onAdd),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(16.dp))
            }
        } else {
            Spacer(modifier = Modifier.width(32.dp))
        }
    }
}

@Composable
private fun AdminCategoriesUnavailableState(languageCode: String) {
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
            text = categoriesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = categoriesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminCategoriesHeaderCard(languageCode: String) {
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
            text = categoriesString("admin.categories.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = categoriesString("admin.categories.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminCategoriesFiltersCard(
    languageCode: String,
    searchText: String,
    onSearchTextChanged: (String) -> Unit,
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
            value = searchText,
            onValueChange = onSearchTextChanged,
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TrustoraAccent,
                unfocusedBorderColor = TrustoraBorder,
            ),
            leadingIcon = {
                Icon(Icons.Filled.Search, contentDescription = null, tint = TrustoraTertiaryText)
            },
            placeholder = {
                Text(categoriesString("admin.categories.name_placeholder", languageCode))
            },
            singleLine = true,
        )
    }
}

@Composable
private fun AdminCategoriesListCard(
    languageCode: String,
    categories: List<AdminCategorySummary>,
    rows: List<AdminCategoryFlattenedRow>,
    rootsCount: Int,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    hasMorePages: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    onRetry: () -> Unit,
    onAddFirst: () -> Unit,
    onLoadMore: () -> Unit,
    onEdit: (AdminCategorySummary) -> Unit,
    onDelete: (AdminCategorySummary) -> Unit,
) {
    val childrenCount = maxOf(0, categories.size - rootsCount)
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
            Icon(Icons.Filled.Folder, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = categoriesString("admin.categories.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = categoriesString("admin.categories.total_summary", languageCode)
                .replace("{count}", categories.size.toString())
                .replace("{parents}", rootsCount.toString())
                .replace("{children}", childrenCount.toString()),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

        when {
            !errorMessage.isNullOrBlank() -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFEF2F2))
                        .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
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
                        Text(categoriesString("admin.categories.retry", languageCode))
                    }
                }
            }

            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            categories.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        Icons.Filled.CreateNewFolder,
                        contentDescription = null,
                        tint = TrustoraTertiaryText,
                        modifier = Modifier.size(24.dp),
                    )
                    Text(
                        text = categoriesString("admin.categories.no_categories_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = categoriesString("admin.categories.no_categories_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                        textAlign = TextAlign.Center,
                    )
                    Button(
                        onClick = onAddFirst,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TrustoraMutedSurface,
                            contentColor = TrustoraPrimary,
                        ),
                    ) {
                        Text(categoriesString("admin.categories.add_first_category", languageCode))
                    }
                }
            }

            else -> {
                if (!actionErrorMessage.isNullOrBlank()) {
                    Text(
                        text = actionErrorMessage,
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

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    rows.forEachIndexed { index, row ->
                        AdminCategoryRow(
                            languageCode = languageCode,
                            row = row,
                            onEdit = { onEdit(row.category) },
                            onDelete = { onDelete(row.category) },
                        )
                        if (index == rows.lastIndex) {
                            LaunchedEffect(row.id, hasMorePages, isLoadingMore) {
                                if (hasMorePages && !isLoadingMore) {
                                    onLoadMore()
                                }
                            }
                        }
                    }
                }

                if (isLoadingMore) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(20.dp), strokeWidth = 2.1.dp)
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminCategoryRow(
    languageCode: String,
    row: AdminCategoryFlattenedRow,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    val category = row.category
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = (row.depth * 18).dp)
            .clip(RoundedCornerShape(14.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (row.depth == 0) Color(0xFFE0F2FE) else Color(0xFFF1F5F9)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.Folder,
                    contentDescription = null,
                    tint = if (row.depth == 0) Color(0xFF0284C7) else TrustoraSecondaryText,
                    modifier = Modifier.size(14.dp),
                )
            }

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = category.name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = category.slug,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xFFF8FAFC))
                            .border(1.dp, TrustoraBorder, RoundedCornerShape(999.dp))
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                    )
                    if (!category.isActive) {
                        Text(
                            text = categoriesString("admin.categories.inactive", languageCode),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF991B1B),
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(Color(0xFFFEE2E2))
                                .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(999.dp))
                                .padding(horizontal = 7.dp, vertical = 3.dp),
                        )
                    }
                }

                if (category.description.isNotBlank()) {
                    Text(
                        text = category.description,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = categoriesString("admin.categories.order_label", languageCode) + ": " + category.sortOrder,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                    )
                    if (row.childCount > 0) {
                        Text(
                            text = "•",
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                        Text(
                            text = row.childCount.toString() + " " + categoriesString("admin.categories.subcategories_label", languageCode),
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraSecondaryText,
                        )
                    }
                    if (!category.icon.isNullOrBlank()) {
                        Text(
                            text = "•",
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                        Text(
                            text = categoriesString("admin.categories.icon_label", languageCode) + ": " + category.icon,
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                        )
                    }
                }
            }

            AdminCategoryActionsMenu(
                languageCode = languageCode,
                onEdit = onEdit,
                onDelete = onDelete,
            )
        }
    }
}

@Composable
private fun AdminCategoryActionsMenu(
    languageCode: String,
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
            DropdownMenuItem(
                text = { Text(categoriesString("admin.categories.edit", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.Edit, contentDescription = null) },
                onClick = {
                    expanded = false
                    onEdit()
                },
            )
            DropdownMenuItem(
                text = { Text(categoriesString("admin.categories.delete", languageCode), color = Color(0xFFB91C1C)) },
                leadingIcon = { Icon(Icons.Filled.Delete, contentDescription = null, tint = Color(0xFFB91C1C)) },
                onClick = {
                    expanded = false
                    onDelete()
                },
            )
        }
    }
}

@Composable
private fun AdminCategoryFormSheet(
    languageCode: String,
    mode: AdminCategoryEditorMode,
    initialDraft: AdminCategoryEditorDraft,
    parentCategories: List<AdminCategoryParentOption>,
    isSubmitting: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onLoadCategorySlug: (String, (String?) -> Unit) -> Unit,
    onSubmit: (AdminCategoryEditorDraft, (Boolean) -> Unit) -> Unit,
) {
    var draft by remember(mode, initialDraft) { mutableStateOf(initialDraft) }
    var hasManualSlug by remember(mode, initialDraft.slug) {
        mutableStateOf(mode == AdminCategoryEditorMode.EDIT || initialDraft.slug.isNotBlank())
    }
    var isApplyingAutoSlug by remember { mutableStateOf(false) }
    var parentExpanded by remember { mutableStateOf(false) }
    var parentSlugs by remember(parentCategories) { mutableStateOf(parentCategories.associate { it.id to it.slug }) }

    fun computedAutoSlug(): String {
        val nameSlug = generateSlug(draft.name)
        if (nameSlug.isEmpty()) return ""

        val parentId = draft.parentId.trim()
        if (parentId.isEmpty()) return nameSlug

        val parentSlug = parentSlugs[parentId]?.trim().orEmpty()
        if (parentSlug.isEmpty()) return nameSlug
        return "$parentSlug/$nameSlug"
    }

    fun applyAutoSlugIfNeeded() {
        if (hasManualSlug) return
        isApplyingAutoSlug = true
        draft = draft.copy(slug = computedAutoSlug())
        isApplyingAutoSlug = false
    }

    val canSubmit = draft.isValid && !isSubmitting

    LaunchedEffect(draft.parentId) {
        val trimmedParentId = draft.parentId.trim()
        if (trimmedParentId.isEmpty()) {
            applyAutoSlugIfNeeded()
            return@LaunchedEffect
        }

        val knownParentSlug = parentSlugs[trimmedParentId]?.trim().orEmpty()
        if (knownParentSlug.isNotEmpty()) {
            applyAutoSlugIfNeeded()
            return@LaunchedEffect
        }

        onLoadCategorySlug(trimmedParentId) { slug ->
            if (!slug.isNullOrBlank()) {
                parentSlugs = parentSlugs + (trimmedParentId to slug)
            }
            applyAutoSlugIfNeeded()
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
                text = if (mode == AdminCategoryEditorMode.EDIT) {
                    categoriesString("admin.categories.modify_title", languageCode)
                } else {
                    categoriesString("admin.categories.add_new_title", languageCode)
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

            AdminCategoryFormSection(
                title = categoriesString("admin.categories.info_title", languageCode),
                subtitle = categoriesString("admin.categories.info_description", languageCode),
            ) {
                OutlinedTextField(
                    value = draft.name,
                    onValueChange = { value ->
                        draft = draft.copy(name = value)
                        applyAutoSlugIfNeeded()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(categoriesString("admin.categories.name_label", languageCode)) },
                    placeholder = { Text(categoriesString("admin.categories.name_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                )

                OutlinedTextField(
                    value = draft.slug,
                    onValueChange = { value ->
                        draft = draft.copy(slug = value)
                        if (!isApplyingAutoSlug) {
                            hasManualSlug = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(categoriesString("admin.categories.slug_label", languageCode)) },
                    placeholder = { Text(categoriesString("admin.categories.slug_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.None),
                )
                Text(
                    text = categoriesString("admin.categories.slug_help", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )

                OutlinedTextField(
                    value = draft.description,
                    onValueChange = { draft = draft.copy(description = it) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(categoriesString("admin.categories.description_label", languageCode)) },
                    placeholder = { Text(categoriesString("admin.categories.description_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    minLines = 4,
                    maxLines = 6,
                )

                OutlinedTextField(
                    value = draft.icon,
                    onValueChange = { draft = draft.copy(icon = it) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(categoriesString("admin.categories.icon_label", languageCode)) },
                    placeholder = { Text("material-symbols:folder") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.None),
                )

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = categoriesString("admin.categories.sort_order_label", languageCode),
                        style = MaterialTheme.typography.labelLarge,
                        color = TrustoraSecondaryText,
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        IconButton(
                            onClick = {
                                if (draft.sortOrder > 0) {
                                    draft = draft.copy(sortOrder = draft.sortOrder - 1)
                                }
                            },
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(TrustoraMutedSurface)
                                .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp)),
                        ) {
                            Icon(Icons.Filled.Remove, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(16.dp))
                        }
                        Text(
                            text = draft.sortOrder.toString(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = TrustoraPrimaryText,
                        )
                        IconButton(
                            onClick = {
                                if (draft.sortOrder < 9999) {
                                    draft = draft.copy(sortOrder = draft.sortOrder + 1)
                                }
                            },
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(TrustoraMutedSurface)
                                .border(1.dp, TrustoraBorder, RoundedCornerShape(8.dp)),
                        ) {
                            Icon(Icons.Filled.Add, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = parentCategories.firstOrNull { it.id == draft.parentId }?.name.orEmpty(),
                        onValueChange = {},
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { parentExpanded = true },
                        label = { Text(categoriesString("admin.categories.parent_category_label", languageCode)) },
                        placeholder = { Text(categoriesString("admin.categories.no_parent", languageCode)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TrustoraAccent,
                            unfocusedBorderColor = TrustoraBorder,
                        ),
                        readOnly = true,
                        singleLine = true,
                    )
                    DropdownMenu(
                        expanded = parentExpanded,
                        onDismissRequest = { parentExpanded = false },
                    ) {
                        DropdownMenuItem(
                            text = { Text(categoriesString("admin.categories.no_parent", languageCode)) },
                            onClick = {
                                draft = draft.copy(parentId = "")
                                parentExpanded = false
                                applyAutoSlugIfNeeded()
                            },
                        )
                        parentCategories.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.name) },
                                onClick = {
                                    draft = draft.copy(parentId = option.id)
                                    parentExpanded = false
                                    applyAutoSlugIfNeeded()
                                },
                            )
                        }
                    }
                }
                Text(
                    text = categoriesString("admin.categories.no_parent_help", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
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
                        contentColor = TrustoraPrimary,
                    ),
                ) {
                    Text(categoriesString("admin.categories.cancel", languageCode))
                }
                Button(
                    onClick = {
                        onSubmit(draft) { success ->
                            if (success) onDismiss()
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = canSubmit,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                        disabledContainerColor = TrustoraAccent.copy(alpha = 0.45f),
                        disabledContentColor = TrustoraAccentButtonText.copy(alpha = 0.75f),
                    ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = TrustoraAccentButtonText,
                        )
                    } else {
                        Text(
                            if (mode == AdminCategoryEditorMode.EDIT) {
                                categoriesString("admin.categories.modify_button", languageCode)
                            } else {
                                categoriesString("admin.categories.create_category", languageCode)
                            },
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun AdminCategoryFormSection(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit,
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
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = TrustoraPrimaryText,
        )
        if (subtitle.isNotBlank()) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
        content()
    }
}

private data class AdminCategoryParentOption(
    val id: String,
    val name: String,
    val slug: String,
)

private data class AdminCategoryFlattenedRow(
    val category: AdminCategorySummary,
    val depth: Int,
    val childCount: Int,
) {
    val id: String
        get() = category.id
}

private fun parentCategoryOptions(
    categories: List<AdminCategorySummary>,
    excludingCategoryId: String?,
): List<AdminCategoryParentOption> {
    return categories
        .filter { parentKey(it.parentId).isEmpty() && it.id != excludingCategoryId }
        .sortedWith(compareBy<AdminCategorySummary> { it.sortOrder }.thenBy { it.name.lowercase() })
        .map { category ->
            AdminCategoryParentOption(
                id = category.id,
                name = category.name,
                slug = category.slug,
            )
        }
}

private fun flattenCategoryRows(categories: List<AdminCategorySummary>): List<AdminCategoryFlattenedRow> {
    val childrenMap = mutableMapOf<String, MutableList<AdminCategorySummary>>()
    categories.forEach { category ->
        val key = parentKey(category.parentId)
        if (key.isNotEmpty()) {
            childrenMap.getOrPut(key) { mutableListOf() }.add(category)
        }
    }
    childrenMap.values.forEach { items ->
        items.sortWith(compareBy<AdminCategorySummary> { it.sortOrder }.thenBy { it.name.lowercase() })
    }

    val roots = categories
        .filter { parentKey(it.parentId).isEmpty() }
        .sortedWith(compareBy<AdminCategorySummary> { it.sortOrder }.thenBy { it.name.lowercase() })

    val result = mutableListOf<AdminCategoryFlattenedRow>()
    val visited = mutableSetOf<String>()

    fun walk(category: AdminCategorySummary, depth: Int) {
        if (!visited.add(category.id)) return
        val children = childrenMap[category.id].orEmpty()
        result += AdminCategoryFlattenedRow(
            category = category,
            depth = maxOf(0, depth),
            childCount = children.size,
        )
        children.forEach { child ->
            walk(child, depth + 1)
        }
    }

    roots.forEach { root ->
        walk(root, 0)
    }

    if (result.size < categories.size) {
        categories
            .sortedWith(compareBy<AdminCategorySummary> { it.sortOrder }.thenBy { it.name.lowercase() })
            .forEach { category ->
                if (!visited.contains(category.id)) {
                    walk(category, 0)
                }
            }
    }

    return result
}

private fun parentKey(value: String?): String {
    val trimmed = value?.trim().orEmpty()
    return if (trimmed == "0") "" else trimmed
}

private fun generateSlug(value: String): String {
    val rough = buildString {
        value.lowercase().forEach { character ->
            when {
                character.isLetterOrDigit() -> append(character)
                character.isWhitespace() || character == '-' -> append('-')
                else -> append('-')
            }
        }
    }
    return rough
        .replace(Regex("-{2,}"), "-")
        .trim('-')
}

private fun categoriesString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "common.ok" -> "OK"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."

        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.categories.manage_title" -> if (ro) "Gestionare Categorii" else "Category Management"
        "admin.categories.manage_subtitle" -> if (ro) "Administrează categoriile și subcategoriile platformei" else "Manage platform categories and subcategories"
        "admin.categories.add_category" -> if (ro) "Adaugă Categorie" else "Add Category"
        "admin.categories.name_placeholder" -> if (ro) "Caută categorie după nume..." else "Search categories by name..."
        "admin.categories.list_title" -> if (ro) "Lista Categorii" else "Category List"
        "admin.categories.total_summary" -> if (ro) "{count} categorii • {parents} principale • {children} subcategorii" else "{count} categories • {parents} parents • {children} children"
        "admin.categories.no_categories_title" -> if (ro) "Nu există categorii" else "No categories found"
        "admin.categories.no_categories_description" -> if (ro) "Adaugă prima categorie pentru a începe structurarea serviciilor." else "Add the first category to start organizing services."
        "admin.categories.add_first_category" -> if (ro) "Adaugă prima categorie" else "Add first category"
        "admin.categories.inactive" -> if (ro) "Inactivă" else "Inactive"
        "admin.categories.order_label" -> if (ro) "Ordine" else "Order"
        "admin.categories.subcategories_label" -> if (ro) "subcategorii" else "subcategories"
        "admin.categories.icon_label" -> "Icon"
        "admin.categories.edit" -> if (ro) "Editează" else "Edit"
        "admin.categories.delete" -> if (ro) "Șterge" else "Delete"
        "admin.categories.confirm_delete" -> if (ro) "Ești sigur că vrei să ștergi această categorie?" else "Are you sure you want to delete this category?"
        "admin.categories.retry" -> if (ro) "Reîncearcă" else "Retry"

        "admin.categories.info_title" -> if (ro) "Informații de bază" else "Basic information"
        "admin.categories.info_description" -> if (ro) "Configurează numele, slug-ul și structura ierarhică." else "Set name, slug and hierarchy."
        "admin.categories.name_label" -> if (ro) "Nume categorie *" else "Category name *"
        "admin.categories.slug_label" -> if (ro) "Slug (URL) *" else "Slug (URL) *"
        "admin.categories.slug_placeholder" -> if (ro) "ex: dezvoltare-web" else "e.g., web-development"
        "admin.categories.slug_help" -> if (ro) "Slug-ul se generează automat din nume, dar îl poți modifica manual." else "Slug is auto-generated from the name, but you can edit it manually."
        "admin.categories.description_label" -> if (ro) "Descriere" else "Description"
        "admin.categories.description_placeholder" -> if (ro) "Descrie scopul categoriei..." else "Describe category purpose..."
        "admin.categories.sort_order_label" -> if (ro) "Ordine afișare" else "Sort order"
        "admin.categories.parent_category_label" -> if (ro) "Categorie părinte" else "Parent category"
        "admin.categories.no_parent" -> if (ro) "Fără categorie părinte" else "No parent category"
        "admin.categories.no_parent_help" -> if (ro) "Lasă gol pentru categorie principală." else "Leave empty to create a top-level category."

        "admin.categories.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.categories.modify_title" -> if (ro) "Modifică Categorie" else "Edit Category"
        "admin.categories.add_new_title" -> if (ro) "Adaugă Categorie Nouă" else "Add New Category"
        "admin.categories.modify_button" -> if (ro) "Salvează Modificările" else "Save Changes"
        "admin.categories.create_category" -> if (ro) "Creează Categoria" else "Create Category"

        else -> key
    }
}

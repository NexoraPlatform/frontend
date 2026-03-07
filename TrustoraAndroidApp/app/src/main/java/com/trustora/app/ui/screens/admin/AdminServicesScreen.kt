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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.NoAccounts
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.trustora.app.core.models.AdminServiceCategoryOption
import com.trustora.app.core.models.AdminServiceEditorDraft
import com.trustora.app.core.models.AdminServiceEditorMode
import com.trustora.app.core.models.AdminServiceStatusAction
import com.trustora.app.core.models.AdminServiceSummary
import com.trustora.app.core.models.AdminServicesStatusFilter
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.AdminDeliveryProviderOption
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraSurface
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.util.Locale

@Composable
fun AdminServicesScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminServicesViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")

    var isEditorPresented by remember { mutableStateOf(false) }
    var editorMode by remember { mutableStateOf(AdminServiceEditorMode.CREATE) }
    var editingServiceId by remember { mutableStateOf<String?>(null) }
    var editorDraft by remember { mutableStateOf(AdminServiceEditorDraft()) }
    var deleteCandidate by remember { mutableStateOf<AdminServiceSummary?>(null) }
    var isPreparingEdit by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        if (canAccessAdmin) {
            viewModel.load(
                token = token,
                language = languageCode,
                currency = currency,
                includeMetadata = true,
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
            AdminServicesTopBar(
                languageCode = languageCode,
                canAccessAdmin = canAccessAdmin,
                onBack = onBack,
                onAdd = {
                    viewModel.loadFormMetadata(
                        token = token,
                        language = languageCode,
                        currency = currency,
                    ) {
                        viewModel.actionErrorMessage = null
                        editorMode = AdminServiceEditorMode.CREATE
                        editingServiceId = null
                        editorDraft = AdminServiceEditorDraft()
                        isEditorPresented = true
                    }
                },
            )

            if (!canAccessAdmin) {
                AdminServicesUnavailableState(languageCode = languageCode)
            } else {
                PullToRefreshBox(
                    modifier = Modifier.fillMaxSize(),
                    isRefreshing = viewModel.isLoading,
                    onRefresh = {
                        viewModel.load(
                            token = token,
                            language = languageCode,
                            currency = currency,
                            includeMetadata = true,
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
                        AdminServicesHeaderCard(languageCode = languageCode)
                        AdminServicesFiltersCard(
                            languageCode = languageCode,
                            searchText = viewModel.searchText,
                            onSearchTextChanged = { viewModel.searchText = it },
                            statusFilter = viewModel.statusFilter,
                            onStatusFilterChanged = { viewModel.statusFilter = it },
                        )
                        AdminServicesListCard(
                            languageCode = languageCode,
                            services = viewModel.filteredServices,
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
                                    includeMetadata = true,
                                    reset = true,
                                )
                            },
                            onLoadMore = {
                                viewModel.loadNextPage(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onView = { service ->
                                viewModel.performStatusAction(
                                    action = AdminServiceStatusAction.VIEW,
                                    service = service,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onEdit = { service ->
                                isPreparingEdit = true
                                viewModel.loadFormMetadata(
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                ) {
                                    viewModel.loadServiceDetail(
                                        serviceId = service.id,
                                        token = token,
                                        language = languageCode,
                                        currency = currency,
                                    ) { detail ->
                                        if (detail != null) {
                                            editorMode = AdminServiceEditorMode.EDIT
                                            editingServiceId = service.id
                                            editorDraft = AdminServiceEditorDraft().apply(detail)
                                            isEditorPresented = true
                                        }
                                        isPreparingEdit = false
                                    }
                                }
                            },
                            onApprove = { service ->
                                viewModel.performStatusAction(
                                    action = AdminServiceStatusAction.APPROVE,
                                    service = service,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onFeature = { service ->
                                viewModel.performStatusAction(
                                    action = AdminServiceStatusAction.FEATURE,
                                    service = service,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onSuspend = { service ->
                                viewModel.performStatusAction(
                                    action = AdminServiceStatusAction.SUSPEND,
                                    service = service,
                                    token = token,
                                    language = languageCode,
                                    currency = currency,
                                )
                            },
                            onDelete = { service ->
                                deleteCandidate = service
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
                        text = servicesString("admin.loading", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                }
            }
        }
    }

    if (isEditorPresented) {
        AdminServiceFormSheet(
            languageCode = languageCode,
            mode = editorMode,
            initialDraft = editorDraft,
            categories = viewModel.categories,
            deliveryProviders = viewModel.deliveryProviders,
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
                    AdminServiceEditorMode.CREATE -> {
                        viewModel.createService(
                            draft = draft,
                            token = token,
                            language = languageCode,
                            currency = currency,
                            onCompleted = onCompleted,
                        )
                    }

                    AdminServiceEditorMode.EDIT -> {
                        val serviceId = editingServiceId.orEmpty()
                        if (serviceId.isEmpty()) {
                            onCompleted(false)
                        } else {
                            viewModel.updateService(
                                serviceId = serviceId,
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
                            viewModel.deleteService(
                                service = target,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        }
                    },
                ) {
                    Text(servicesString("admin.services.delete", languageCode), color = Color(0xFFB91C1C))
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) {
                    Text(servicesString("common.cancel", languageCode))
                }
            },
            title = {
                Text(servicesString("admin.services.confirm_delete", languageCode))
            },
            text = {
                Text(deleteCandidate?.name.orEmpty())
            },
        )
    }
}

@Composable
private fun AdminServicesTopBar(
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
                text = servicesString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = servicesString("admin.services.manage_title", languageCode),
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
private fun AdminServicesUnavailableState(languageCode: String) {
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
            text = servicesString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = servicesString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminServicesHeaderCard(languageCode: String) {
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
            text = servicesString("admin.services.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = servicesString("admin.services.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminServicesFiltersCard(
    languageCode: String,
    searchText: String,
    onSearchTextChanged: (String) -> Unit,
    statusFilter: AdminServicesStatusFilter,
    onStatusFilterChanged: (AdminServicesStatusFilter) -> Unit,
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
                Text(servicesString("admin.services.search_placeholder", languageCode))
            },
            singleLine = true,
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminServicesStatusFilter.entries.forEach { filter ->
                val selected = filter == statusFilter
                Text(
                    text = servicesString(filter.titleKey, languageCode),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) Color(0xFF052E16) else TrustoraSecondaryText,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (selected) TrustoraAccent.copy(alpha = 0.28f) else TrustoraSurface)
                        .border(
                            width = 1.dp,
                            color = if (selected) TrustoraAccent else TrustoraBorder,
                            shape = CircleShape,
                        )
                        .clickable { onStatusFilterChanged(filter) }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun AdminServicesListCard(
    languageCode: String,
    services: List<AdminServiceSummary>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    hasMorePages: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    onView: (AdminServiceSummary) -> Unit,
    onEdit: (AdminServiceSummary) -> Unit,
    onApprove: (AdminServiceSummary) -> Unit,
    onFeature: (AdminServiceSummary) -> Unit,
    onSuspend: (AdminServiceSummary) -> Unit,
    onDelete: (AdminServiceSummary) -> Unit,
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
            Icon(Icons.Filled.NoAccounts, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = servicesString("admin.services.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }
        Text(
            text = servicesString("admin.services.list_description", languageCode).replace("{count}", services.size.toString()),
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
                        Text(servicesString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            services.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.NoAccounts, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = servicesString("admin.services.no_services_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = servicesString("admin.services.no_services_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
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
                    services.forEachIndexed { index, row ->
                        AdminServiceRow(
                            languageCode = languageCode,
                            service = row,
                            onView = { onView(row) },
                            onEdit = { onEdit(row) },
                            onApprove = { onApprove(row) },
                            onFeature = { onFeature(row) },
                            onSuspend = { onSuspend(row) },
                            onDelete = { onDelete(row) },
                        )
                        if (index == services.lastIndex) {
                            LaunchedEffect(row.id, hasMorePages, isLoadingMore) {
                                if (hasMorePages && !isLoadingMore) {
                                    onLoadMore()
                                }
                            }
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

@Composable
private fun AdminServiceRow(
    languageCode: String,
    service: AdminServiceSummary,
    onView: () -> Unit,
    onEdit: () -> Unit,
    onApprove: () -> Unit,
    onFeature: () -> Unit,
    onSuspend: () -> Unit,
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
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = service.name,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    if (service.isFeatured) {
                        AdminLabelBadge(
                            text = servicesString("admin.services.recommended", languageCode),
                            textColor = Color(0xFF92400E),
                            fill = Color(0xFFFEF3C7),
                            border = Color(0xFFFDE68A),
                        )
                    }
                }
                Text(
                    text = service.description,
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                    maxLines = 2,
                )
            }
            AdminServiceActionsMenu(
                languageCode = languageCode,
                isFeatured = service.isFeatured,
                onView = onView,
                onEdit = onEdit,
                onApprove = onApprove,
                onFeature = onFeature,
                onSuspend = onSuspend,
                onDelete = onDelete,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = servicesString("admin.services.slug_prefix", languageCode) + service.slug,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
            Text(
                text = "•",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = servicesString("admin.services.category_prefix", languageCode) + service.categoryName,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            AdminServiceStatusBadge(status = service.status, languageCode = languageCode)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFFEAB308), modifier = Modifier.size(11.dp))
                Text(
                    text = String.format(Locale.US, "%.2f", service.rating),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraSecondaryText,
                )
            }
            Text(
                text = servicesString("admin.services.reviews", languageCode).replace("{count}", service.reviewCount.toString()),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = servicesString("admin.services.orders", languageCode).replace("{count}", service.orderCount.toString()),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = servicesString("admin.services.views", languageCode).replace("{count}", service.viewCount.toString()),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
    }
}

@Composable
private fun AdminServiceActionsMenu(
    languageCode: String,
    isFeatured: Boolean,
    onView: () -> Unit,
    onEdit: () -> Unit,
    onApprove: () -> Unit,
    onFeature: () -> Unit,
    onSuspend: () -> Unit,
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
                text = { Text(servicesString("admin.services.view_details", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.RemoveRedEye, contentDescription = null) },
                onClick = {
                    expanded = false
                    onView()
                },
            )
            DropdownMenuItem(
                text = { Text(servicesString("admin.services.edit", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.Edit, contentDescription = null) },
                onClick = {
                    expanded = false
                    onEdit()
                },
            )
            DropdownMenuItem(
                text = { Text(servicesString("admin.services.approve", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.CheckCircle, contentDescription = null) },
                onClick = {
                    expanded = false
                    onApprove()
                },
            )
            DropdownMenuItem(
                text = {
                    Text(
                        if (isFeatured) {
                            servicesString("admin.services.unfeature", languageCode)
                        } else {
                            servicesString("admin.services.feature", languageCode)
                        },
                    )
                },
                leadingIcon = { Icon(Icons.Filled.Star, contentDescription = null) },
                onClick = {
                    expanded = false
                    onFeature()
                },
            )
            DropdownMenuItem(
                text = { Text(servicesString("admin.services.suspend", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.LockPerson, contentDescription = null) },
                onClick = {
                    expanded = false
                    onSuspend()
                },
            )
            DropdownMenuItem(
                text = { Text(servicesString("admin.services.delete", languageCode), color = Color(0xFFB91C1C)) },
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
private fun AdminServiceStatusBadge(
    status: String,
    languageCode: String,
) {
    val normalized = status.trim().uppercase()
    val statusKey = when (normalized) {
        "ACTIVE", "APPROVED" -> "ACTIVE"
        "SUSPENDED" -> "SUSPENDED"
        else -> "DRAFT"
    }
    val (textColor, fill, border) = when (statusKey) {
        "ACTIVE" -> Triple(Color(0xFF065F46), Color(0xFFD1FAE5), Color(0xFFA7F3D0))
        "SUSPENDED" -> Triple(Color(0xFF991B1B), Color(0xFFFEE2E2), Color(0xFFFECACA))
        else -> Triple(Color(0xFF92400E), Color(0xFFFEF3C7), Color(0xFFFDE68A))
    }
    AdminLabelBadge(
        text = servicesString("admin.services.statuses.$statusKey", languageCode),
        textColor = textColor,
        fill = fill,
        border = border,
    )
}

@Composable
private fun AdminLabelBadge(
    text: String,
    textColor: Color,
    fill: Color,
    border: Color,
) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        color = textColor,
        modifier = Modifier
            .clip(CircleShape)
            .background(fill)
            .border(1.dp, border, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun AdminServiceFormSheet(
    languageCode: String,
    mode: AdminServiceEditorMode,
    initialDraft: AdminServiceEditorDraft,
    categories: List<AdminServiceCategoryOption>,
    deliveryProviders: List<AdminDeliveryProviderOption>,
    isSubmitting: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onLoadCategorySlug: (String, (String?) -> Unit) -> Unit,
    onSubmit: (AdminServiceEditorDraft, (Boolean) -> Unit) -> Unit,
) {
    var draft by remember(mode, initialDraft) { mutableStateOf(initialDraft) }
    var newSkill by remember { mutableStateOf("") }
    var newTag by remember { mutableStateOf("") }
    var hasManualSlug by remember(mode, initialDraft.slug) { mutableStateOf(mode == AdminServiceEditorMode.EDIT || initialDraft.slug.isNotBlank()) }
    var isApplyingAutoSlug by remember { mutableStateOf(false) }
    var categoryExpanded by remember { mutableStateOf(false) }
    var providerExpanded by remember { mutableStateOf(false) }

    val canSubmit = draft.isCreateValid && !isSubmitting
    val orderedCategories = remember(categories) { orderedCategoryOptions(categories) }

    LaunchedEffect(draft.categoryId) {
        val trimmed = draft.categoryId.trim()
        if (trimmed.isEmpty()) {
            draft = draft.copy(categorySlug = null)
            return@LaunchedEffect
        }
        onLoadCategorySlug(trimmed) { slug ->
            draft = draft.copy(categorySlug = slug)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = if (mode == AdminServiceEditorMode.EDIT) {
                    servicesString("admin.services.edit_service.title", languageCode)
                } else {
                    servicesString("admin.services.new_service.title", languageCode)
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

            AdminServiceFormSection(
                title = servicesString("admin.services.info_title", languageCode),
                subtitle = servicesString("admin.services.info_description", languageCode),
            ) {
                OutlinedTextField(
                    value = draft.name,
                    onValueChange = { value ->
                        draft = draft.copy(name = value)
                        if (!hasManualSlug || draft.slug.trim().isEmpty()) {
                            isApplyingAutoSlug = true
                            draft = draft.copy(slug = generateSlug(value))
                            isApplyingAutoSlug = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(servicesString("admin.services.title_label", languageCode)) },
                    placeholder = { Text(servicesString("admin.services.title_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
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
                    label = { Text(servicesString("admin.services.slug_label", languageCode)) },
                    placeholder = { Text(servicesString("admin.services.slug_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                )

                draft.categorySlug?.trim()?.takeIf { it.isNotEmpty() }?.let { categorySlug ->
                    Text(
                        text = "$categorySlug/${draft.slug}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }

                Text(
                    text = servicesString("admin.services.slug_help", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )

                OutlinedTextField(
                    value = draft.description,
                    onValueChange = { draft = draft.copy(description = it) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(servicesString("admin.services.description_label", languageCode)) },
                    placeholder = { Text(servicesString("admin.services.description_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    minLines = 4,
                    maxLines = 8,
                )

                OutlinedTextField(
                    value = draft.requirements,
                    onValueChange = { draft = draft.copy(requirements = it) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(servicesString("admin.services.requirements_label", languageCode)) },
                    placeholder = { Text(servicesString("admin.services.requirements_placeholder", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    minLines = 3,
                    maxLines = 7,
                )

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = orderedCategories.firstOrNull { it.id == draft.categoryId }?.displayName.orEmpty(),
                        onValueChange = {},
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { categoryExpanded = true },
                        label = { Text(servicesString("admin.services.category_label", languageCode)) },
                        placeholder = { Text(servicesString("admin.services.category_placeholder", languageCode)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TrustoraAccent,
                            unfocusedBorderColor = TrustoraBorder,
                        ),
                        readOnly = true,
                        singleLine = true,
                    )
                    DropdownMenu(
                        expanded = categoryExpanded,
                        onDismissRequest = { categoryExpanded = false },
                    ) {
                        DropdownMenuItem(
                            text = { Text(servicesString("admin.services.category_placeholder", languageCode)) },
                            onClick = {
                                draft = draft.copy(categoryId = "", categorySlug = null)
                                categoryExpanded = false
                            },
                        )
                        orderedCategories.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.displayName) },
                                onClick = {
                                    draft = draft.copy(categoryId = option.id)
                                    categoryExpanded = false
                                },
                            )
                        }
                    }
                }

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = deliveryProviders.firstOrNull { it.value == draft.deliveryProvider }?.label.orEmpty(),
                        onValueChange = {},
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { providerExpanded = true },
                        label = { Text("Delivery Provider") },
                        placeholder = { Text("Select delivery provider") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TrustoraAccent,
                            unfocusedBorderColor = TrustoraBorder,
                        ),
                        readOnly = true,
                        singleLine = true,
                    )
                    DropdownMenu(
                        expanded = providerExpanded,
                        onDismissRequest = { providerExpanded = false },
                    ) {
                        DropdownMenuItem(
                            text = { Text("Select delivery provider") },
                            onClick = {
                                draft = draft.copy(deliveryProvider = "")
                                providerExpanded = false
                            },
                        )
                        deliveryProviders.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.label) },
                                onClick = {
                                    draft = draft.copy(deliveryProvider = option.value)
                                    providerExpanded = false
                                },
                            )
                        }
                    }
                }

                if (mode == AdminServiceEditorMode.EDIT) {
                    Text(
                        text = servicesString("admin.services.edit_service.status_label", languageCode),
                        style = MaterialTheme.typography.bodySmall,
                        color = TrustoraSecondaryText,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("DRAFT", "ACTIVE", "SUSPENDED").forEach { option ->
                            val selected = draft.status.trim().uppercase() == option
                            Text(
                                text = servicesString("admin.services.statuses.$option", languageCode),
                                style = MaterialTheme.typography.labelLarge,
                                color = if (selected) TrustoraAccentButtonText else TrustoraPrimaryText,
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(if (selected) TrustoraAccent else TrustoraMutedSurface)
                                    .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
                                    .clickable { draft = draft.copy(status = option) }
                                    .padding(horizontal = 10.dp, vertical = 7.dp),
                            )
                        }
                    }
                }
            }

            AdminServiceFormSection(
                title = servicesString("admin.services.skills_tags_title", languageCode),
                subtitle = servicesString("admin.services.skills_tags_description", languageCode),
            ) {
                AdminTagInput(
                    label = servicesString("admin.services.skills_label", languageCode),
                    placeholder = servicesString("admin.services.skills_placeholder", languageCode),
                    value = newSkill,
                    onValueChange = { newSkill = it },
                    onAdd = {
                        val trimmed = newSkill.trim()
                        if (trimmed.isNotEmpty() && draft.skills.none { it.equals(trimmed, ignoreCase = true) }) {
                            draft = draft.copy(skills = draft.skills + trimmed)
                        }
                        newSkill = ""
                    },
                    values = draft.skills,
                    onRemove = { skill ->
                        draft = draft.copy(skills = draft.skills.filterNot { it == skill })
                    },
                )

                AdminTagInput(
                    label = servicesString("admin.services.tags_label", languageCode),
                    placeholder = servicesString("admin.services.tags_placeholder", languageCode),
                    value = newTag,
                    onValueChange = { newTag = it },
                    onAdd = {
                        val trimmed = newTag.trim()
                        if (trimmed.isNotEmpty() && draft.tags.none { it.equals(trimmed, ignoreCase = true) }) {
                            draft = draft.copy(tags = draft.tags + trimmed)
                        }
                        newTag = ""
                    },
                    values = draft.tags,
                    onRemove = { tag ->
                        draft = draft.copy(tags = draft.tags.filterNot { it == tag })
                    },
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF8FAFC))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(
                    text = if (mode == AdminServiceEditorMode.EDIT) {
                        servicesString("admin.services.pricing_note_title_edit", languageCode)
                    } else {
                        servicesString("admin.services.pricing_note_title", languageCode)
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraPrimaryText,
                )
                Text(
                    text = if (mode == AdminServiceEditorMode.EDIT) {
                        servicesString("admin.services.pricing_note_description_edit", languageCode)
                    } else {
                        servicesString("admin.services.pricing_note_description", languageCode)
                    },
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
                        contentColor = TrustoraPrimaryText,
                    ),
                ) {
                    Text(servicesString("admin.services.cancel", languageCode))
                }

                Button(
                    onClick = {
                        onSubmit(draft) { success ->
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
                            if (mode == AdminServiceEditorMode.EDIT) {
                                servicesString("admin.services.save_changes", languageCode)
                            } else {
                                servicesString("admin.services.create_service", languageCode)
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
private fun AdminServiceFormSection(
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
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = TrustoraPrimaryText,
        )
        if (subtitle.isNotEmpty()) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }
        content()
    }
}

@Composable
private fun AdminTagInput(
    label: String,
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    onAdd: () -> Unit,
    values: List<String>,
    onRemove: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraSecondaryText,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text(placeholder) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
                singleLine = true,
            )
            Button(
                onClick = onAdd,
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraMutedSurface,
                    contentColor = TrustoraPrimary,
                ),
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(14.dp))
            }
        }
        if (values.isNotEmpty()) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                values.forEach { item ->
                    Row(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .border(1.dp, Color(0xFFE2E8F0), CircleShape)
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            text = item,
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraPrimaryText,
                        )
                        Text(
                            text = "x",
                            style = MaterialTheme.typography.labelSmall,
                            color = TrustoraTertiaryText,
                            modifier = Modifier.clickable { onRemove(item) },
                        )
                    }
                }
            }
        }
    }
}

private data class CategoryDisplayOption(
    val id: String,
    val name: String,
    val level: Int,
) {
    val displayName: String
        get() = if (level <= 0) name else "${"--".repeat(level)} $name"
}

private fun orderedCategoryOptions(categories: List<AdminServiceCategoryOption>): List<CategoryDisplayOption> {
    val nonEmpty = categories.filter { it.id.isNotBlank() && it.name.isNotBlank() }
    if (nonEmpty.isEmpty()) return emptyList()

    fun parentKey(parentId: String?): String {
        val id = parentId?.trim().orEmpty()
        return if (id.isEmpty() || id == "0") "" else id
    }

    val byParent = mutableMapOf<String, MutableList<AdminServiceCategoryOption>>()
    nonEmpty.forEach { option ->
        val key = parentKey(option.parentId)
        val list = byParent.getOrPut(key) { mutableListOf() }
        list += option
    }

    val allIds = nonEmpty.map { it.id }.toSet()
    val rootCandidates = nonEmpty.filter { option ->
        val parent = option.parentId?.trim().orEmpty()
        parent.isEmpty() || parent == "0" || !allIds.contains(parent)
    }.sortedBy { it.name.lowercase() }

    val result = mutableListOf<CategoryDisplayOption>()
    val seen = mutableSetOf<String>()

    fun walk(option: AdminServiceCategoryOption, level: Int) {
        if (!seen.add(option.id)) return
        result += CategoryDisplayOption(id = option.id, name = option.name, level = maxOf(0, level))
        val children = (byParent[option.id] ?: emptyList()).sortedBy { it.name.lowercase() }
        children.forEach { child -> walk(child, level + 1) }
    }

    rootCandidates.forEach { root -> walk(root, 0) }
    if (result.size < nonEmpty.size) {
        nonEmpty.forEach { option ->
            if (!seen.contains(option.id)) {
                walk(option, 0)
            }
        }
    }

    return result
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

private fun servicesString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."

        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.services.manage_title" -> if (ro) "Gestionare Servicii" else "Manage Services"
        "admin.services.manage_subtitle" -> if (ro) "Administrează serviciile platformei" else "Administer platform services"
        "admin.services.add_service" -> if (ro) "Adaugă Serviciu" else "Add Service"
        "admin.services.search_placeholder" -> if (ro) "Caută servicii după titlu sau descriere..." else "Search services by title or description..."
        "admin.services.filters.all" -> if (ro) "Toate serviciile" else "All services"
        "admin.services.statuses.ACTIVE" -> if (ro) "Activ" else "Active"
        "admin.services.statuses.DRAFT" -> "Draft"
        "admin.services.statuses.SUSPENDED" -> if (ro) "Suspendat" else "Suspended"
        "admin.services.list_title" -> if (ro) "Lista Servicii" else "Service List"
        "admin.services.list_description" -> if (ro) "{count} servicii găsite" else "{count} services found"
        "admin.services.recommended" -> if (ro) "Recomandat" else "Recommended"
        "admin.services.slug_prefix" -> if (ro) "Slug: /" else "Slug: /"
        "admin.services.category_prefix" -> if (ro) "Categorie: " else "Category: "
        "admin.services.reviews" -> if (ro) "{count} recenzii" else "{count} reviews"
        "admin.services.orders" -> if (ro) "{count} comenzi" else "{count} orders"
        "admin.services.views" -> if (ro) "{count} vizualizări" else "{count} views"
        "admin.services.view_details" -> if (ro) "Vezi Detalii" else "View Details"
        "admin.services.edit" -> if (ro) "Editează" else "Edit"
        "admin.services.approve" -> if (ro) "Aprobă" else "Approve"
        "admin.services.feature" -> if (ro) "Marchează ca Recomandat" else "Mark as Featured"
        "admin.services.unfeature" -> if (ro) "Elimină din Recomandate" else "Remove from Featured"
        "admin.services.suspend" -> if (ro) "Suspendă" else "Suspend"
        "admin.services.delete" -> if (ro) "Șterge" else "Delete"
        "admin.services.confirm_delete" -> if (ro) "Ești sigur că vrei să ștergi acest serviciu?" else "Are you sure you want to delete this service?"
        "admin.services.no_services_title" -> if (ro) "Nu s-au găsit servicii" else "No services found"
        "admin.services.no_services_description" -> if (ro) "Încearcă să modifici filtrele sau termenii de căutare" else "Try adjusting the filters or search terms"

        "admin.services.info_title" -> if (ro) "Informații de Bază" else "Basic Information"
        "admin.services.info_description" -> if (ro) "Detaliile principale ale serviciului" else "Main service details"
        "admin.services.title_label" -> if (ro) "Titlu Serviciu *" else "Service Title *"
        "admin.services.title_placeholder" -> if (ro) "ex: Dezvoltare Website Modern cu React" else "e.g., Modern Website Development with React"
        "admin.services.slug_label" -> if (ro) "Slug (URL) *" else "Slug (URL) *"
        "admin.services.slug_placeholder" -> if (ro) "ex: creare-aplicatie" else "e.g., build-application"
        "admin.services.slug_help" -> if (ro) "Se generează automat din nume. Folosit în URL-uri." else "Automatically generated from the name. Used in URLs."
        "admin.services.description_label" -> if (ro) "Descriere *" else "Description *"
        "admin.services.description_placeholder" -> if (ro) "Descrie serviciul în detaliu..." else "Describe the service in detail..."
        "admin.services.requirements_label" -> if (ro) "Cerințe și Specificații" else "Requirements and Specifications"
        "admin.services.requirements_placeholder" -> if (ro) "Ce informații ai nevoie de la client..." else "What information do you need from the client..."
        "admin.services.category_label" -> if (ro) "Categorie *" else "Category *"
        "admin.services.category_placeholder" -> if (ro) "Selectează categoria" else "Select category"
        "admin.services.skills_tags_title" -> if (ro) "Skills și Tags" else "Skills and Tags"
        "admin.services.skills_tags_description" -> if (ro) "Definește competențele necesare și cuvintele cheie" else "Define required skills and keywords"
        "admin.services.skills_label" -> if (ro) "Skills Necesare" else "Required Skills"
        "admin.services.skills_placeholder" -> if (ro) "ex: React, Node.js" else "e.g., React, Node.js"
        "admin.services.tags_label" -> "Tags"
        "admin.services.tags_placeholder" -> if (ro) "ex: website, modern, responsive" else "e.g., website, modern, responsive"
        "admin.services.pricing_note_title" -> if (ro) "Tarife Flexibile" else "Flexible Pricing"
        "admin.services.pricing_note_description" -> if (ro) "Prestatorii își vor seta propriile tarife pentru acest serviciu. Ei pot alege între preț fix, tarif pe oră, pe zi, sau preț negociabil, în funcție de natura proiectului și preferințele lor." else "Providers will set their own rates for this service. They can choose between fixed price, hourly rate, daily rate, or negotiable price depending on the project and their preferences."
        "admin.services.pricing_note_title_edit" -> if (ro) "Tarife Personalizate" else "Custom Pricing"
        "admin.services.pricing_note_description_edit" -> if (ro) "Prestatorii își gestionează propriile tarife pentru acest serviciu. Modificările de aici afectează doar informațiile generale, nu prețurile." else "Providers manage their own pricing for this service. Changes here affect only general information, not prices."
        "admin.services.create_service" -> if (ro) "Creează Serviciul" else "Create Service"
        "admin.services.save_changes" -> if (ro) "Salvează Modificările" else "Save Changes"
        "admin.services.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.services.new_service.title" -> if (ro) "Adaugă Serviciu Nou" else "Add New Service"
        "admin.services.edit_service.title" -> if (ro) "Editează Serviciu" else "Edit Service"
        "admin.services.edit_service.status_label" -> if (ro) "Status" else "Status"

        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        else -> key
    }
}

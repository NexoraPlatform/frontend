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
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.NoAccounts
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PersonOff
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.trustora.app.core.models.AdminUserListItem
import com.trustora.app.core.models.AdminUsersRoleFilter
import com.trustora.app.core.models.AdminUserStatusAction
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
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun AdminUsersScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminUsersViewModel,
    onBack: () -> Unit,
    openCreateOnAppear: Boolean,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")
    var isCreatePresented by remember { mutableStateOf(false) }
    var didHandleInitialCreate by remember { mutableStateOf(false) }
    var deleteCandidate by remember { mutableStateOf<AdminUserListItem?>(null) }
    var featureNotice by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        if (openCreateOnAppear && !didHandleInitialCreate) {
            didHandleInitialCreate = true
            isCreatePresented = true
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
            AdminUsersTopBar(
                languageCode = languageCode,
                canAccessAdmin = canAccessAdmin,
                onBack = onBack,
                onCreateUser = {
                    viewModel.actionErrorMessage = null
                    isCreatePresented = true
                },
            )

            if (!canAccessAdmin) {
                AdminUsersUnavailableState(languageCode = languageCode)
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    AdminUsersHeaderCard(languageCode = languageCode)
                    AdminUsersFiltersCard(
                        languageCode = languageCode,
                        searchText = viewModel.searchText,
                        onSearchTextChanged = { viewModel.searchText = it },
                        roleFilter = viewModel.roleFilter,
                        onRoleFilterChanged = { viewModel.roleFilter = it },
                    )
                    AdminUsersListCard(
                        languageCode = languageCode,
                        currentUser = user,
                        users = viewModel.filteredUsers,
                        isLoading = viewModel.isLoading,
                        isLoadingMore = viewModel.isLoadingMore,
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
                        onLoadMore = {
                            viewModel.loadNextPage(
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        },
                        hasMorePages = viewModel.hasMorePages,
                        onToggleSuperuser = { row ->
                            viewModel.toggleSuperuser(
                                user = row,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        },
                        onVerify = { row ->
                            viewModel.performStatusAction(
                                action = AdminUserStatusAction.VERIFY,
                                user = row,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        },
                        onSuspend = { row ->
                            viewModel.performStatusAction(
                                action = AdminUserStatusAction.SUSPEND,
                                user = row,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        },
                        onActivate = { row ->
                            viewModel.performStatusAction(
                                action = AdminUserStatusAction.ACTIVATE,
                                user = row,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        },
                        onDelete = { row ->
                            deleteCandidate = row
                        },
                        onModifyProfile = { featureNotice = true },
                        onViewProfile = { featureNotice = true },
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }

    if (isCreatePresented) {
        AdminCreateUserSheet(
            languageCode = languageCode,
            isSubmitting = viewModel.isSubmitting,
            errorMessage = viewModel.actionErrorMessage,
            onDismiss = { isCreatePresented = false },
            onSubmit = { firstName, lastName, email, password, role, phone ->
                viewModel.createUser(
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    password = password,
                    role = role,
                    phone = phone,
                    token = token,
                    language = languageCode,
                    currency = currency,
                ) { success ->
                    if (success) isCreatePresented = false
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
                            viewModel.deleteUser(
                                user = target,
                                token = token,
                                language = languageCode,
                                currency = currency,
                            )
                        }
                    },
                ) {
                    Text(usersString("admin.users.actions.delete", languageCode), color = Color(0xFFB91C1C))
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) {
                    Text(usersString("common.cancel", languageCode))
                }
            },
            title = {
                Text(usersString("admin.users.actions.confirm_delete", languageCode))
            },
            text = {
                Text(deleteCandidate?.displayName.orEmpty())
            },
        )
    }

    if (featureNotice) {
        AlertDialog(
            onDismissRequest = { featureNotice = false },
            confirmButton = {
                TextButton(onClick = { featureNotice = false }) {
                    Text(usersString("common.ok", languageCode))
                }
            },
            title = {
                Text(usersString("admin.dashboard.notice.title", languageCode))
            },
            text = {
                Text(usersString("admin.dashboard.notice.body", languageCode))
            },
        )
    }
}

@Composable
private fun AdminUsersTopBar(
    languageCode: String,
    canAccessAdmin: Boolean,
    onBack: () -> Unit,
    onCreateUser: () -> Unit,
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
                text = usersString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = usersString("admin.users.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))

        if (canAccessAdmin) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(TrustoraSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                    .clickable(onClick = onCreateUser),
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
private fun AdminUsersUnavailableState(languageCode: String) {
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
            text = usersString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = usersString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminUsersHeaderCard(languageCode: String) {
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
            text = usersString("admin.users.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = usersString("admin.users.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminUsersFiltersCard(
    languageCode: String,
    searchText: String,
    onSearchTextChanged: (String) -> Unit,
    roleFilter: AdminUsersRoleFilter,
    onRoleFilterChanged: (AdminUsersRoleFilter) -> Unit,
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
                Text(usersString("admin.users.search_placeholder", languageCode))
            },
            singleLine = true,
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminUsersRoleFilter.entries.forEach { filter ->
                val selected = filter == roleFilter
                Text(
                    text = usersString(filter.titleKey, languageCode),
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
                        .clickable { onRoleFilterChanged(filter) }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun AdminUsersListCard(
    languageCode: String,
    currentUser: AuthUser,
    users: List<AdminUserListItem>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    hasMorePages: Boolean,
    onToggleSuperuser: (AdminUserListItem) -> Unit,
    onModifyProfile: (AdminUserListItem) -> Unit,
    onViewProfile: (AdminUserListItem) -> Unit,
    onVerify: (AdminUserListItem) -> Unit,
    onSuspend: (AdminUserListItem) -> Unit,
    onActivate: (AdminUserListItem) -> Unit,
    onDelete: (AdminUserListItem) -> Unit,
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
            Icon(Icons.Filled.Person, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = usersString("admin.users.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }
        Text(
            text = usersString("admin.users.list_description", languageCode).replace("{count}", users.size.toString()),
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraTertiaryText,
        )

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
                        Text(usersString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            users.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.NoAccounts, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = usersString("admin.users.no_users_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = usersString("admin.users.no_users_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    users.forEachIndexed { index, row ->
                        AdminUserRow(
                            languageCode = languageCode,
                            currentUser = currentUser,
                            user = row,
                            onToggleSuperuser = { onToggleSuperuser(row) },
                            onModifyProfile = { onModifyProfile(row) },
                            onViewProfile = { onViewProfile(row) },
                            onVerify = { onVerify(row) },
                            onSuspend = { onSuspend(row) },
                            onActivate = { onActivate(row) },
                            onDelete = { onDelete(row) },
                        )

                        if (index == users.lastIndex) {
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
private fun AdminUserRow(
    languageCode: String,
    currentUser: AuthUser,
    user: AdminUserListItem,
    onToggleSuperuser: () -> Unit,
    onModifyProfile: () -> Unit,
    onViewProfile: () -> Unit,
    onVerify: () -> Unit,
    onSuspend: () -> Unit,
    onActivate: () -> Unit,
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
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            AdminUserAvatar(user = user)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = user.displayName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    if (user.isVerified) {
                        Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF16A34A),
                            modifier = Modifier.size(12.dp),
                        )
                    }
                }
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }
            AdminUserActionsMenu(
                languageCode = languageCode,
                currentUser = currentUser,
                user = user,
                onToggleSuperuser = onToggleSuperuser,
                onModifyProfile = onModifyProfile,
                onViewProfile = onViewProfile,
                onVerify = onVerify,
                onSuspend = onSuspend,
                onActivate = onActivate,
                onDelete = onDelete,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            AdminBadge(
                text = roleLabel(user.role, languageCode),
                textColor = roleStyle(user.role).first,
                fill = roleStyle(user.role).second,
                border = roleStyle(user.role).third,
            )
            AdminBadge(
                text = statusLabel(user.status, languageCode),
                textColor = statusStyle(user.status).first,
                fill = statusStyle(user.status).second,
                border = statusStyle(user.status).third,
            )
            if (user.isSuperuser) {
                AdminBadge(
                    text = usersString("admin.users.roles.SUPERUSER", languageCode),
                    textColor = Color(0xFF991B1B),
                    fill = Color(0xFFFEE2E2),
                    border = Color(0xFFFECACA),
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFFEAB308), modifier = Modifier.size(11.dp))
                Text(
                    text = String.format(Locale.US, "%.2f", user.rating),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraSecondaryText,
                )
            }
            Text(
                text = usersString("admin.users.reviews_label", languageCode).replace("{count}", user.reviewCount.toString()),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            formatDate(user.createdAtIso, languageCode)?.let { date ->
                Text(
                    text = usersString("admin.users.registered_prefix", languageCode).replace("{date}", date),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )
            }
        }
    }
}

@Composable
private fun AdminUserAvatar(user: AdminUserListItem) {
    if (!user.avatarUrl.isNullOrBlank()) {
        AsyncImage(
            model = user.avatarUrl,
            contentDescription = user.displayName,
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .border(1.dp, Color.White.copy(alpha = 0.9f), CircleShape),
        )
    } else {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        colors = listOf(Color(0xFF1BC47D), Color(0xFF0B1C2D)),
                    ),
                )
                .border(1.dp, Color.White.copy(alpha = 0.9f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = user.initials,
                style = MaterialTheme.typography.labelLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun AdminUserActionsMenu(
    languageCode: String,
    currentUser: AuthUser,
    user: AdminUserListItem,
    onToggleSuperuser: () -> Unit,
    onModifyProfile: () -> Unit,
    onViewProfile: () -> Unit,
    onVerify: () -> Unit,
    onSuspend: () -> Unit,
    onActivate: () -> Unit,
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
            if (user.id != "1" && currentUser.isSuperuser) {
                DropdownMenuItem(
                    text = {
                        Text(
                            if (user.isSuperuser) {
                                usersString("admin.users.actions.remove_superuser", languageCode)
                            } else {
                                usersString("admin.users.actions.set_superuser", languageCode)
                            },
                        )
                    },
                    leadingIcon = { Icon(Icons.Filled.Shield, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onToggleSuperuser()
                    },
                )
            }

            DropdownMenuItem(
                text = { Text(usersString("admin.users.actions.modify_profile", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.Edit, contentDescription = null) },
                onClick = {
                    expanded = false
                    onModifyProfile()
                },
            )

            if (user.hasRole("PROVIDER") && !user.profileUrl.isNullOrBlank()) {
                DropdownMenuItem(
                    text = { Text(usersString("admin.users.actions.view_profile", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.RemoveRedEye, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onViewProfile()
                    },
                )
            }

            DropdownMenuItem(
                text = { Text(usersString("admin.users.actions.verify", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.CheckCircle, contentDescription = null) },
                onClick = {
                    expanded = false
                    onVerify()
                },
            )

            if (user.status.uppercase() == "ACTIVE") {
                DropdownMenuItem(
                    text = { Text(usersString("admin.users.actions.suspend", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.PersonOff, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onSuspend()
                    },
                )
            } else {
                DropdownMenuItem(
                    text = { Text(usersString("admin.users.actions.activate", languageCode)) },
                    leadingIcon = { Icon(Icons.Filled.Check, contentDescription = null) },
                    onClick = {
                        expanded = false
                        onActivate()
                    },
                )
            }

            DropdownMenuItem(
                text = { Text(usersString("admin.users.actions.delete", languageCode), color = Color(0xFFB91C1C)) },
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
private fun AdminBadge(
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
private fun AdminCreateUserSheet(
    languageCode: String,
    isSubmitting: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSubmit: (firstName: String, lastName: String, email: String, password: String, role: String, phone: String?) -> Unit,
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("CLIENT") }
    var phone by remember { mutableStateOf("") }

    val canSubmit = firstName.trim().isNotEmpty() &&
        lastName.trim().isNotEmpty() &&
        email.trim().isNotEmpty() &&
        password.isNotEmpty() &&
        password.length >= 6

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = usersString("admin.users.new.title", languageCode),
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

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    modifier = Modifier.weight(1f),
                    label = { Text(usersString("admin.users.new.first_name_label", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    modifier = Modifier.weight(1f),
                    label = { Text(usersString("admin.users.new.last_name_label", languageCode)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TrustoraAccent,
                        unfocusedBorderColor = TrustoraBorder,
                    ),
                    singleLine = true,
                )
            }

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(usersString("admin.users.new.email_label", languageCode)) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                leadingIcon = { Icon(Icons.Filled.Email, contentDescription = null) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
            )

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(usersString("admin.users.new.password_label", languageCode)) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
            )
            Text(
                text = usersString("admin.users.new.password_hint", languageCode),
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )

            Text(
                text = usersString("admin.users.new.role_label", languageCode),
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraSecondaryText,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("CLIENT", "PROVIDER", "ADMIN").forEach { option ->
                    val selected = role == option
                    Text(
                        text = usersString("admin.users.new.roles.$option", languageCode),
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected) TrustoraAccentButtonText else TrustoraPrimaryText,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (selected) TrustoraAccent else TrustoraMutedSurface)
                            .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
                            .clickable { role = option }
                            .padding(horizontal = 10.dp, vertical = 7.dp),
                    )
                }
            }

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(usersString("admin.users.new.phone_label", languageCode)) },
                placeholder = { Text(usersString("admin.users.new.phone_placeholder", languageCode)) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TrustoraAccent,
                    unfocusedBorderColor = TrustoraBorder,
                ),
            )

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
                    Text(usersString("admin.users.new.cancel", languageCode))
                }

                Button(
                    onClick = {
                        onSubmit(
                            firstName.trim(),
                            lastName.trim(),
                            email.trim(),
                            password,
                            role,
                            phone.trim().ifEmpty { null },
                        )
                    },
                    modifier = Modifier.weight(1f),
                    enabled = canSubmit && !isSubmitting,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                    ),
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = TrustoraAccentButtonText)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Filled.PersonAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                            Text(usersString("admin.users.new.create_user", languageCode))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

private fun roleStyle(role: String): Triple<Color, Color, Color> {
    return when (role.trim().uppercase()) {
        "ADMIN" -> Triple(Color(0xFF6B21A8), Color(0xFFF3E8FF), Color(0xFFE9D5FF))
        "PROVIDER" -> Triple(Color(0xFF1D4ED8), Color(0xFFDBEAFE), Color(0xFFBFDBFE))
        else -> Triple(Color(0xFF334155), Color(0xFFF1F5F9), Color(0xFFE2E8F0))
    }
}

private fun statusStyle(status: String): Triple<Color, Color, Color> {
    return when (status.trim().uppercase()) {
        "ACTIVE" -> Triple(Color(0xFF065F46), Color(0xFFD1FAE5), Color(0xFFA7F3D0))
        "SUSPENDED" -> Triple(Color(0xFF991B1B), Color(0xFFFEE2E2), Color(0xFFFECACA))
        else -> Triple(Color(0xFF92400E), Color(0xFFFEF3C7), Color(0xFFFDE68A))
    }
}

private fun roleLabel(role: String, languageCode: String): String {
    return usersString("admin.users.roles.${role.trim().uppercase()}", languageCode)
}

private fun statusLabel(status: String, languageCode: String): String {
    return usersString("admin.users.statuses.${status.trim().uppercase()}", languageCode)
}

private fun formatDate(createdAtIso: String?, languageCode: String): String? {
    val raw = createdAtIso?.trim().orEmpty()
    if (raw.isEmpty()) return null
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val formatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)

    val instant = runCatching { Instant.parse(raw) }.getOrNull()
    if (instant != null) {
        return formatter.format(instant.atZone(java.time.ZoneId.systemDefault()).toLocalDate())
    }

    val offsetDateTime = runCatching { OffsetDateTime.parse(raw) }.getOrNull()
    if (offsetDateTime != null) {
        return formatter.format(offsetDateTime.toLocalDate())
    }

    return raw.take(10)
}

private fun usersString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "common.ok" -> "OK"

        "admin.dashboard.notice.title" -> if (ro) "Secțiune Admin" else "Admin Section"
        "admin.dashboard.notice.body" -> if (ro) "Această secțiune se va deschide după implementarea paginii mobile corespunzătoare." else "This section will open after the corresponding mobile screen is implemented."
        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.users.manage_title" -> if (ro) "Gestionare Utilizatori" else "User Management"
        "admin.users.manage_subtitle" -> if (ro) "Administrează utilizatorii platformei" else "Manage platform users"
        "admin.users.add_user" -> if (ro) "Adaugă Utilizator" else "Add User"
        "admin.users.search_placeholder" -> if (ro) "Caută utilizatori după nume sau email..." else "Search users by name or email..."
        "admin.users.filter_all" -> if (ro) "Toți utilizatorii" else "All users"
        "admin.users.filter_clients" -> if (ro) "Clienți" else "Clients"
        "admin.users.filter_providers" -> if (ro) "Prestatori" else "Providers"
        "admin.users.filter_admins" -> if (ro) "Administratori" else "Admins"
        "admin.users.list_title" -> if (ro) "Lista Utilizatori" else "User List"
        "admin.users.list_description" -> if (ro) "{count} utilizatori găsiți" else "{count} users found"
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"
        "admin.users.no_users_title" -> if (ro) "Nu s-au găsit utilizatori" else "No users found"
        "admin.users.no_users_description" -> if (ro) "Încearcă să modifici filtrele sau termenii de căutare" else "Try adjusting your filters or search terms"
        "admin.users.roles.ADMIN" -> "Admin"
        "admin.users.roles.PROVIDER" -> if (ro) "Prestator" else "Provider"
        "admin.users.roles.CLIENT" -> if (ro) "Client" else "Client"
        "admin.users.roles.SUPERUSER" -> if (ro) "SuperUser" else "SuperUser"
        "admin.users.statuses.ACTIVE" -> if (ro) "Activ" else "Active"
        "admin.users.statuses.SUSPENDED" -> if (ro) "Suspendat" else "Suspended"
        "admin.users.statuses.PENDING_VERIFICATION" -> if (ro) "În așteptare" else "Pending"
        "admin.users.actions.modify_profile" -> if (ro) "Modifică profil" else "Modify profile"
        "admin.users.actions.view_profile" -> if (ro) "Vezi Profil" else "View profile"
        "admin.users.actions.verify" -> if (ro) "Verifică" else "Verify"
        "admin.users.actions.suspend" -> if (ro) "Suspendă" else "Suspend"
        "admin.users.actions.activate" -> if (ro) "Activează" else "Activate"
        "admin.users.actions.delete" -> if (ro) "Șterge" else "Delete"
        "admin.users.actions.set_superuser" -> if (ro) "Setează SuperUser" else "Set SuperUser"
        "admin.users.actions.remove_superuser" -> if (ro) "Scoate SuperUser" else "Remove SuperUser"
        "admin.users.actions.confirm_delete" -> if (ro) "Ești sigur că vrei să ștergi acest utilizator?" else "Are you sure you want to delete this user?"
        "admin.users.reviews_label" -> if (ro) "{count} recenzii" else "{count} reviews"
        "admin.users.registered_prefix" -> if (ro) "Înregistrat: {date}" else "Registered: {date}"

        "admin.users.new.title" -> if (ro) "Adaugă Utilizator Nou" else "Add New User"
        "admin.users.new.first_name_label" -> if (ro) "Prenume *" else "First Name *"
        "admin.users.new.last_name_label" -> if (ro) "Nume *" else "Last Name *"
        "admin.users.new.email_label" -> if (ro) "Email *" else "Email *"
        "admin.users.new.password_label" -> if (ro) "Parola *" else "Password *"
        "admin.users.new.password_hint" -> if (ro) "Parola trebuie să aibă cel puțin 6 caractere" else "Password must have at least 6 characters"
        "admin.users.new.role_label" -> if (ro) "Rol *" else "Role *"
        "admin.users.new.phone_label" -> if (ro) "Telefon" else "Phone"
        "admin.users.new.phone_placeholder" -> "+40 123 456 789"
        "admin.users.new.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.users.new.create_user" -> if (ro) "Creează Utilizator" else "Create User"
        "admin.users.new.roles.CLIENT" -> if (ro) "Client" else "Client"
        "admin.users.new.roles.PROVIDER" -> if (ro) "Prestator" else "Provider"
        "admin.users.new.roles.ADMIN" -> if (ro) "Administrator" else "Admin"

        else -> key
    }
}

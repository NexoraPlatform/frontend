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
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LockPerson
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.NoAccounts
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Visibility
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.trustora.app.core.models.AdminOrderParticipantSummary
import com.trustora.app.core.models.AdminOrderStatusOption
import com.trustora.app.core.models.AdminOrderSummary
import com.trustora.app.core.models.AdminProjectsStatusFilter
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
import java.util.Currency
import java.util.Locale

@Composable
fun AdminProjectsScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: AdminProjectsViewModel,
    onBack: () -> Unit,
) {
    val canAccessAdmin = user.isSuperuser || user.hasRole("admin")
    var selectedOrder by remember { mutableStateOf<AdminOrderSummary?>(null) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
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
            AdminProjectsTopBar(
                languageCode = languageCode,
                onBack = onBack,
            )

            if (!canAccessAdmin) {
                AdminProjectsUnavailableState(languageCode = languageCode)
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
                        AdminProjectsHeaderCard(languageCode = languageCode)
                        AdminProjectsFiltersCard(
                            languageCode = languageCode,
                            searchText = viewModel.searchText,
                            onSearchTextChanged = { viewModel.searchText = it },
                            statusFilter = viewModel.statusFilter,
                            onStatusFilterChanged = { viewModel.statusFilter = it },
                        )
                        AdminProjectsListCard(
                            languageCode = languageCode,
                            orders = viewModel.filteredOrders,
                            isLoading = viewModel.isLoading,
                            isLoadingMore = viewModel.isLoadingMore,
                            hasMorePages = viewModel.hasMorePages,
                            errorMessage = viewModel.errorMessage,
                            actionErrorMessage = viewModel.actionErrorMessage,
                            currency = currency,
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
                            onViewOrder = { selectedOrder = it },
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }

    selectedOrder?.let { order ->
        AdminOrderDetailSheet(
            languageCode = languageCode,
            defaultCurrency = currency,
            initialOrder = order,
            onDismiss = { selectedOrder = null },
            loadOrder = { orderId, onResult ->
                viewModel.loadOrderDetail(
                    orderId = orderId,
                    token = token,
                    language = languageCode,
                    currency = currency,
                    onResult = onResult,
                )
            },
            saveOrder = { orderId, status, notes, onResult ->
                viewModel.updateOrder(
                    orderId = orderId,
                    status = status,
                    adminNotes = notes,
                    token = token,
                    language = languageCode,
                    currency = currency,
                    onCompleted = onResult,
                )
            },
        )
    }
}

@Composable
private fun AdminProjectsTopBar(
    languageCode: String,
    onBack: () -> Unit,
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
                text = projectsString("dashboard.actions.close", languageCode),
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimary,
            )
        }

        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = projectsString("admin.orders.manage_title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TrustoraPrimaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.width(32.dp))
    }
}

@Composable
private fun AdminProjectsUnavailableState(languageCode: String) {
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
            text = projectsString("admin.dashboard.unavailable.title", languageCode),
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = projectsString("admin.dashboard.unavailable.description", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun AdminProjectsHeaderCard(languageCode: String) {
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
            text = projectsString("admin.orders.manage_title", languageCode),
            style = MaterialTheme.typography.titleLarge,
            color = TrustoraPrimaryText,
        )
        Text(
            text = projectsString("admin.orders.manage_subtitle", languageCode),
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun AdminProjectsFiltersCard(
    languageCode: String,
    searchText: String,
    onSearchTextChanged: (String) -> Unit,
    statusFilter: AdminProjectsStatusFilter,
    onStatusFilterChanged: (AdminProjectsStatusFilter) -> Unit,
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
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = TrustoraTertiaryText) },
            placeholder = { Text(projectsString("admin.orders.search_placeholder", languageCode)) },
            singleLine = true,
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AdminProjectsStatusFilter.entries.forEach { filter ->
                val selected = filter == statusFilter
                Text(
                    text = projectsString(filter.titleKey, languageCode),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) Color(0xFF052E16) else TrustoraSecondaryText,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (selected) TrustoraAccent.copy(alpha = 0.28f) else TrustoraSurface)
                        .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
                        .clickable { onStatusFilterChanged(filter) }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun AdminProjectsListCard(
    languageCode: String,
    orders: List<AdminOrderSummary>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    hasMorePages: Boolean,
    errorMessage: String?,
    actionErrorMessage: String?,
    currency: AppCurrency,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    onViewOrder: (AdminOrderSummary) -> Unit,
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
            Icon(Icons.Filled.Info, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp))
            Text(
                text = projectsString("admin.orders.list_title", languageCode),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimaryText,
            )
        }

        Text(
            text = projectsTemplate(
                projectsString("admin.orders.list_description", languageCode),
                mapOf("count" to orders.size.toString()),
            ),
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
                        Text(projectsString("admin.users.retry", languageCode))
                    }
                }
            }

            isLoading -> {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(color = TrustoraAccent, modifier = Modifier.size(22.dp), strokeWidth = 2.2.dp)
                }
            }

            orders.isEmpty() -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Filled.NoAccounts, contentDescription = null, tint = TrustoraTertiaryText, modifier = Modifier.size(24.dp))
                    Text(
                        text = projectsString("admin.orders.no_orders_title", languageCode),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    Text(
                        text = projectsString("admin.orders.no_orders_description", languageCode),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraTertiaryText,
                    )
                }
            }

            else -> {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    orders.forEachIndexed { index, order ->
                        AdminOrderRow(
                            languageCode = languageCode,
                            order = order,
                            defaultCurrency = currency,
                            onViewOrder = { onViewOrder(order) },
                        )

                        if (index == orders.lastIndex) {
                            LaunchedEffect(order.id, hasMorePages, isLoadingMore) {
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
private fun AdminOrderRow(
    languageCode: String,
    order: AdminOrderSummary,
    defaultCurrency: AppCurrency,
    onViewOrder: () -> Unit,
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
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "#${order.orderNumber}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TrustoraPrimaryText,
                    )
                    OrderStatusBadge(status = order.status, languageCode = languageCode)
                    PaymentStatusBadge(status = order.paymentStatus, languageCode = languageCode)
                }
                Text(
                    text = order.service?.title ?: "-",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF0369A1),
                )
            }

            AdminOrderActionsMenu(
                languageCode = languageCode,
                onViewOrder = onViewOrder,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OrderParticipantMiniCard(
                languageCode = languageCode,
                title = projectsString("admin.orders.client_label", languageCode),
                participant = order.client,
                modifier = Modifier.weight(1f),
            )
            OrderParticipantMiniCard(
                languageCode = languageCode,
                title = projectsString("admin.orders.provider_label", languageCode),
                participant = order.provider,
                modifier = Modifier.weight(1f),
            )
        }

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OrderStatPill(
                icon = { Icon(Icons.Filled.MonetizationOn, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                text = formatPrice(order.amount, order.currency, languageCode, defaultCurrency),
            )

            formatDate(order.createdAtIso, languageCode, includeTime = false)?.let { date ->
                OrderStatPill(
                    icon = { Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                    text = date,
                )
            }

            formatDate(order.deliveryDateIso, languageCode, includeTime = false)?.let { date ->
                OrderStatPill(
                    icon = { Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = TrustoraSecondaryText, modifier = Modifier.size(12.dp)) },
                    text = "${projectsString("admin.orders.due_prefix", languageCode)} $date",
                )
            }
        }
    }
}

@Composable
private fun OrderParticipantMiniCard(
    languageCode: String,
    title: String,
    participant: AdminOrderParticipantSummary?,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ParticipantAvatar(participant = participant, size = 34.dp, initialsSize = MaterialTheme.typography.labelSmall)
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = participant?.fullName ?: "-",
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraPrimaryText,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun ParticipantAvatar(
    participant: AdminOrderParticipantSummary?,
    size: androidx.compose.ui.unit.Dp,
    initialsSize: androidx.compose.ui.text.TextStyle,
) {
    val avatarUrl = participant?.avatarUrl?.trim().orEmpty()
    if (avatarUrl.isNotEmpty()) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = participant?.fullName,
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .border(1.dp, Color.White.copy(alpha = 0.9f), CircleShape),
        )
    } else {
        Box(
            modifier = Modifier
                .size(size)
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
                text = participant?.initials ?: "U",
                style = initialsSize,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun AdminOrderActionsMenu(
    languageCode: String,
    onViewOrder: () -> Unit,
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
                text = { Text(projectsString("admin.orders.view_details", languageCode)) },
                leadingIcon = { Icon(Icons.Filled.Visibility, contentDescription = null) },
                onClick = {
                    expanded = false
                    onViewOrder()
                },
            )
        }
    }
}

@Composable
private fun OrderStatPill(
    icon: @Composable () -> Unit,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(TrustoraMutedSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(999.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
    ) {
        icon()
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = TrustoraSecondaryText,
        )
    }
}

@Composable
private fun OrderStatusBadge(status: String, languageCode: String) {
    val normalized = status.trim().uppercase()
    val style = when (normalized) {
        "COMPLETED", "DELIVERED" -> Triple(Color(0xFF065F46), Color(0xFFD1FAE5), Color(0xFFA7F3D0))
        "IN_PROGRESS", "ACCEPTED" -> Triple(Color(0xFF075985), Color(0xFFE0F2FE), Color(0xFFBAE6FD))
        "CANCELLED" -> Triple(Color(0xFFB91C1C), Color(0xFFFEE2E2), Color(0xFFFECACA))
        "DISPUTED" -> Triple(Color(0xFF6D28D9), Color(0xFFEDE9FE), Color(0xFFDDD6FE))
        else -> Triple(Color(0xFF92400E), Color(0xFFFEF3C7), Color(0xFFFDE68A))
    }

    val key = when (normalized) {
        "DELIVERED" -> "admin.orders.statuses.delivered"
        "COMPLETED" -> "admin.orders.statuses.completed"
        "ACCEPTED" -> "admin.orders.statuses.accepted"
        "IN_PROGRESS" -> "admin.orders.statuses.in_progress"
        "CANCELLED" -> "admin.orders.statuses.cancelled"
        "DISPUTED" -> "admin.orders.statuses.disputed"
        else -> "admin.orders.statuses.pending"
    }

    Text(
        text = projectsString(key, languageCode),
        style = MaterialTheme.typography.labelSmall,
        color = style.first,
        modifier = Modifier
            .clip(CircleShape)
            .background(style.second)
            .border(1.dp, style.third, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun PaymentStatusBadge(status: String, languageCode: String) {
    val normalized = status.trim().uppercase()
    val style = when (normalized) {
        "PAID" -> Triple(Color(0xFF065F46), Color(0xFFD1FAE5), Color(0xFFA7F3D0))
        "FAILED" -> Triple(Color(0xFFB91C1C), Color(0xFFFEE2E2), Color(0xFFFECACA))
        "REFUNDED" -> Triple(Color(0xFF334155), Color(0xFFE2E8F0), Color(0xFFCBD5E1))
        else -> Triple(Color(0xFF92400E), Color(0xFFFEF3C7), Color(0xFFFDE68A))
    }

    val key = when (normalized) {
        "PAID" -> "admin.orders.payment_statuses.paid"
        "FAILED" -> "admin.orders.payment_statuses.failed"
        "REFUNDED" -> "admin.orders.payment_statuses.refunded"
        else -> "admin.orders.payment_statuses.pending"
    }

    Text(
        text = projectsString(key, languageCode),
        style = MaterialTheme.typography.labelSmall,
        color = style.first,
        modifier = Modifier
            .clip(CircleShape)
            .background(style.second)
            .border(1.dp, style.third, CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    )
}

@Composable
private fun AdminOrderDetailSheet(
    languageCode: String,
    defaultCurrency: AppCurrency,
    initialOrder: AdminOrderSummary,
    onDismiss: () -> Unit,
    loadOrder: (String, (AdminOrderSummary?) -> Unit) -> Unit,
    saveOrder: (String, String, String?, (AdminOrderSummary?) -> Unit) -> Unit,
) {
    var order by remember(initialOrder.id) { mutableStateOf(initialOrder) }
    var selectedStatus by remember(initialOrder.id) { mutableStateOf(initialOrder.status) }
    var adminNotes by remember(initialOrder.id) { mutableStateOf(initialOrder.adminNotes) }
    var isLoading by remember(initialOrder.id) { mutableStateOf(false) }
    var isSaving by remember(initialOrder.id) { mutableStateOf(false) }
    var errorMessage by remember(initialOrder.id) { mutableStateOf<String?>(null) }

    LaunchedEffect(initialOrder.id) {
        isLoading = true
        loadOrder(initialOrder.id) { loaded ->
            if (loaded != null) {
                order = loaded
                selectedStatus = loaded.status
                if (adminNotes.trim().isEmpty()) {
                    adminNotes = loaded.adminNotes
                }
            }
            isLoading = false
        }
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.Description, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(16.dp))
                    Text(
                        text = "${projectsString("admin.orders.order_label", languageCode)} #${order.orderNumber}",
                        style = MaterialTheme.typography.titleMedium,
                        color = TrustoraPrimaryText,
                    )
                }
                Text(
                    text = projectsString("admin.orders.detail_subtitle", languageCode),
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraTertiaryText,
                )

                if (!errorMessage.isNullOrBlank()) {
                    Text(
                        text = errorMessage ?: "",
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

                DetailSectionCard(
                    title = projectsString("admin.orders.details_title", languageCode),
                    icon = { Icon(Icons.Filled.Description, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp)) },
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        order.service?.let { service ->
                            Text(
                                text = service.title,
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFF0369A1),
                            )
                            Text(
                                text = "${projectsString("admin.orders.category_label", languageCode)} ${service.categoryName}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TrustoraSecondaryText,
                            )
                        }

                        if (order.requirements.isNotBlank()) {
                            DetailTextBlock(
                                title = projectsString("admin.orders.requirements_title", languageCode),
                                value = order.requirements,
                            )
                        }
                        if (order.clientNotes.isNotBlank()) {
                            DetailTextBlock(
                                title = projectsString("admin.orders.client_notes_title", languageCode),
                                value = order.clientNotes,
                            )
                        }
                        if (order.providerNotes.isNotBlank()) {
                            DetailTextBlock(
                                title = projectsString("admin.orders.provider_notes_title", languageCode),
                                value = order.providerNotes,
                            )
                        }

                        if (order.deliverables.isNotEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = projectsString("admin.orders.deliverables_title", languageCode),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = TrustoraSecondaryText,
                                )
                                order.deliverables.forEachIndexed { index, item ->
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(
                                            text = "${index + 1}.",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TrustoraSecondaryText,
                                        )
                                        Text(
                                            text = item,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TrustoraSecondaryText,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                DetailSectionCard(
                    title = projectsString("admin.orders.participants_title", languageCode),
                    icon = { Icon(Icons.Filled.People, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp)) },
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ParticipantDetailCard(
                            languageCode = languageCode,
                            title = projectsString("admin.orders.client_label", languageCode),
                            participant = order.client,
                        )
                        ParticipantDetailCard(
                            languageCode = languageCode,
                            title = projectsString("admin.orders.provider_label", languageCode),
                            participant = order.provider,
                        )
                    }
                }

                DetailSectionCard(
                    title = projectsString("admin.orders.financial_title", languageCode),
                    icon = { Icon(Icons.Filled.Payments, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp)) },
                ) {
                    val platformFee = order.amount * 0.05
                    val providerReceives = maxOf(0.0, order.amount - platformFee)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        FinancialRow(
                            label = projectsString("admin.orders.order_value_label", languageCode),
                            value = formatPrice(order.amount, order.currency, languageCode, defaultCurrency),
                            valueColor = Color(0xFF0369A1),
                        )
                        FinancialRow(
                            label = projectsString("admin.orders.platform_fee_label", languageCode),
                            value = formatPrice(platformFee, order.currency, languageCode, defaultCurrency),
                            valueColor = TrustoraSecondaryText,
                        )
                        FinancialRow(
                            label = projectsString("admin.orders.provider_receives_label", languageCode),
                            value = formatPrice(providerReceives, order.currency, languageCode, defaultCurrency),
                            valueColor = Color(0xFF065F46),
                        )

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = projectsString("admin.orders.payment_status_label", languageCode),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TrustoraSecondaryText,
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            PaymentStatusBadge(status = order.paymentStatus, languageCode = languageCode)
                        }
                    }
                }

                DetailSectionCard(
                    title = projectsString("admin.orders.timeline_title", languageCode),
                    icon = { Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp)) },
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        formatDate(order.createdAtIso, languageCode, includeTime = true)?.let { created ->
                            TimelineRow(
                                label = projectsString("admin.orders.order_placed_label", languageCode),
                                value = created,
                            )
                        }
                        formatDate(order.deliveryDateIso, languageCode, includeTime = true)?.let { due ->
                            TimelineRow(
                                label = projectsString("admin.orders.delivery_due_label", languageCode),
                                value = due,
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = projectsString("admin.orders.current_status_label", languageCode),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TrustoraSecondaryText,
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            OrderStatusBadge(status = order.status, languageCode = languageCode)
                        }
                    }
                }

                DetailSectionCard(
                    title = projectsString("admin.orders.admin_actions_title", languageCode),
                    icon = { Icon(Icons.Filled.Edit, contentDescription = null, tint = TrustoraPrimary, modifier = Modifier.size(14.dp)) },
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = projectsString("admin.orders.update_status_label", languageCode),
                            style = MaterialTheme.typography.labelLarge,
                            color = TrustoraSecondaryText,
                        )
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            AdminOrderStatusOption.entries.forEach { option ->
                                val selected = selectedStatus.trim().uppercase() == option.rawValue
                                Text(
                                    text = projectsString(option.titleKey, languageCode),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = if (selected) TrustoraAccentButtonText else TrustoraPrimaryText,
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(if (selected) TrustoraAccent else TrustoraMutedSurface)
                                        .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, CircleShape)
                                        .clickable { selectedStatus = option.rawValue }
                                        .padding(horizontal = 10.dp, vertical = 7.dp),
                                )
                            }
                        }

                        Text(
                            text = projectsString("admin.orders.admin_notes_label", languageCode),
                            style = MaterialTheme.typography.labelLarge,
                            color = TrustoraSecondaryText,
                        )
                        OutlinedTextField(
                            value = adminNotes,
                            onValueChange = { adminNotes = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp),
                            placeholder = { Text(projectsString("admin.orders.admin_notes_placeholder", languageCode)) },
                            maxLines = 7,
                            textStyle = MaterialTheme.typography.bodyMedium,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TrustoraAccent,
                                unfocusedBorderColor = TrustoraBorder,
                            ),
                        )

                        Button(
                            onClick = {
                                isSaving = true
                                errorMessage = null
                                val notesPayload = adminNotes.trim().ifEmpty { null }
                                saveOrder(order.id, selectedStatus, notesPayload) { updated ->
                                    if (updated != null) {
                                        order = updated
                                        selectedStatus = updated.status
                                        adminNotes = updated.adminNotes
                                    } else {
                                        errorMessage = projectsString("admin.orders.update_error", languageCode)
                                    }
                                    isSaving = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isSaving,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = TrustoraAccent,
                                contentColor = TrustoraAccentButtonText,
                            ),
                        ) {
                            if (isSaving) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = TrustoraAccentButtonText)
                            } else {
                                Text(projectsString("admin.orders.save_changes", languageCode))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
            }

            if (isLoading || isSaving) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
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
                            text = projectsString("admin.loading", languageCode),
                            style = MaterialTheme.typography.bodyMedium,
                            color = TrustoraPrimaryText,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailSectionCard(
    title: String,
    icon: @Composable () -> Unit,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            icon()
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = TrustoraPrimaryText,
            )
        }
        content()
    }
}

@Composable
private fun DetailTextBlock(
    title: String,
    value: String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            color = TrustoraSecondaryText,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(TrustoraMutedSurface)
                .padding(horizontal = 10.dp, vertical = 8.dp),
        )
    }
}

@Composable
private fun ParticipantDetailCard(
    languageCode: String,
    title: String,
    participant: AdminOrderParticipantSummary?,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TrustoraSurface)
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        ParticipantAvatar(participant = participant, size = 42.dp, initialsSize = MaterialTheme.typography.bodySmall)
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
            Text(
                text = participant?.fullName ?: "-",
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraPrimaryText,
            )
            val email = participant?.email.orEmpty()
            if (email.isNotBlank()) {
                Text(
                    text = email,
                    style = MaterialTheme.typography.labelSmall,
                    color = TrustoraSecondaryText,
                )
            }
        }
        Spacer(modifier = Modifier.weight(1f))
    }
}

@Composable
private fun FinancialRow(
    label: String,
    value: String,
    valueColor: Color,
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor,
        )
    }
}

@Composable
private fun TimelineRow(
    label: String,
    value: String,
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraSecondaryText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraPrimaryText,
        )
    }
}

private fun formatPrice(
    amount: Double,
    currencyCodeRaw: String,
    languageCode: String,
    defaultCurrency: AppCurrency,
): String {
    val locale = if (languageCode.startsWith("ro", ignoreCase = true)) Locale.forLanguageTag("ro-RO") else Locale.US
    val formatter = java.text.NumberFormat.getCurrencyInstance(locale)
    val resolvedCode = currencyCodeRaw.trim().uppercase().ifEmpty {
        defaultCurrency.raw
    }
    runCatching {
        formatter.currency = Currency.getInstance(resolvedCode)
    }
    formatter.maximumFractionDigits = 2
    formatter.minimumFractionDigits = 0
    return runCatching { formatter.format(amount) }.getOrElse { "${amount.toInt()} $resolvedCode" }
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

private fun projectsTemplate(text: String, placeholders: Map<String, String>): String {
    var resolved = text
    placeholders.forEach { (name, value) ->
        resolved = resolved.replace("{$name}", value)
    }
    return resolved
}

private fun projectsString(key: String, languageCode: String): String {
    val ro = languageCode.startsWith("ro", ignoreCase = true)
    return when (key) {
        "dashboard.actions.close" -> if (ro) "Închide" else "Close"
        "common.cancel" -> if (ro) "Anulează" else "Cancel"
        "admin.loading" -> if (ro) "Se încarcă..." else "Loading..."
        "admin.users.retry" -> if (ro) "Reîncearcă" else "Retry"

        "admin.dashboard.unavailable.title" -> if (ro) "Panoul de administrare nu este disponibil" else "Admin dashboard is unavailable"
        "admin.dashboard.unavailable.description" -> if (ro) "Acest ecran este disponibil doar pentru conturile admin autentificate." else "This screen is available only for authenticated admin accounts."

        "admin.orders.manage_title" -> if (ro) "Gestionare Comenzi & Proiecte" else "Manage Orders & Projects"
        "admin.orders.manage_subtitle" -> if (ro) "Administrează comenzile și statusurile proiectelor" else "Administer order and project statuses"
        "admin.orders.search_placeholder" -> if (ro) "Caută după număr comandă, client, prestator..." else "Search by order number, client, provider..."
        "admin.orders.list_title" -> if (ro) "Lista Comenzi" else "Orders List"
        "admin.orders.list_description" -> if (ro) "{count} comenzi găsite" else "{count} orders found"
        "admin.orders.no_orders_title" -> if (ro) "Nu s-au găsit comenzi" else "No orders found"
        "admin.orders.no_orders_description" -> if (ro) "Încearcă să modifici filtrele sau termenii de căutare" else "Try adjusting filters or search terms"
        "admin.orders.view_details" -> if (ro) "Vezi detalii" else "View details"
        "admin.orders.client_label" -> if (ro) "Client" else "Client"
        "admin.orders.provider_label" -> if (ro) "Prestator" else "Provider"
        "admin.orders.due_prefix" -> if (ro) "Scadență:" else "Due:"
        "admin.orders.order_label" -> if (ro) "Comanda" else "Order"
        "admin.orders.detail_subtitle" -> if (ro) "Detalii complete, status și acțiuni admin" else "Full details, status and admin actions"
        "admin.orders.details_title" -> if (ro) "Detalii comandă" else "Order Details"
        "admin.orders.category_label" -> if (ro) "Categorie:" else "Category:"
        "admin.orders.requirements_title" -> if (ro) "Cerințe" else "Requirements"
        "admin.orders.client_notes_title" -> if (ro) "Notițe client" else "Client notes"
        "admin.orders.provider_notes_title" -> if (ro) "Notițe prestator" else "Provider notes"
        "admin.orders.deliverables_title" -> if (ro) "Livrabile" else "Deliverables"
        "admin.orders.participants_title" -> if (ro) "Participanți" else "Participants"
        "admin.orders.financial_title" -> if (ro) "Financiar" else "Financial"
        "admin.orders.order_value_label" -> if (ro) "Valoare comandă" else "Order value"
        "admin.orders.platform_fee_label" -> if (ro) "Comision platformă (5%)" else "Platform fee (5%)"
        "admin.orders.provider_receives_label" -> if (ro) "Prestatorul primește" else "Provider receives"
        "admin.orders.payment_status_label" -> if (ro) "Status plată" else "Payment status"
        "admin.orders.timeline_title" -> if (ro) "Timeline" else "Timeline"
        "admin.orders.order_placed_label" -> if (ro) "Comandă plasată" else "Order placed"
        "admin.orders.delivery_due_label" -> if (ro) "Livrare până la" else "Delivery due"
        "admin.orders.current_status_label" -> if (ro) "Status curent" else "Current status"
        "admin.orders.admin_actions_title" -> if (ro) "Acțiuni Admin" else "Admin Actions"
        "admin.orders.update_status_label" -> if (ro) "Actualizează status" else "Update status"
        "admin.orders.admin_notes_label" -> if (ro) "Notițe admin" else "Admin notes"
        "admin.orders.admin_notes_placeholder" -> if (ro) "Adaugă notițe interne..." else "Add internal notes..."
        "admin.orders.save_changes" -> if (ro) "Salvează modificările" else "Save changes"
        "admin.orders.update_error" -> if (ro) "Actualizarea comenzii a eșuat." else "Order update failed."

        "admin.orders.statuses.all" -> if (ro) "Toate statusurile" else "All statuses"
        "admin.orders.statuses.pending" -> if (ro) "În așteptare" else "Pending"
        "admin.orders.statuses.accepted" -> if (ro) "Acceptată" else "Accepted"
        "admin.orders.statuses.in_progress" -> if (ro) "În lucru" else "In progress"
        "admin.orders.statuses.delivered" -> if (ro) "Livrată" else "Delivered"
        "admin.orders.statuses.completed" -> if (ro) "Finalizată" else "Completed"
        "admin.orders.statuses.cancelled" -> if (ro) "Anulată" else "Cancelled"
        "admin.orders.statuses.disputed" -> if (ro) "În dispută" else "Disputed"

        "admin.orders.payment_statuses.paid" -> if (ro) "Plătit" else "Paid"
        "admin.orders.payment_statuses.failed" -> if (ro) "Eșuat" else "Failed"
        "admin.orders.payment_statuses.refunded" -> if (ro) "Rambursat" else "Refunded"
        "admin.orders.payment_statuses.pending" -> if (ro) "În așteptare" else "Pending"

        else -> key
    }
}

package com.trustora.app.ui.screens.services

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
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
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.MarketplaceCategory
import com.trustora.app.core.models.MarketplaceService
import com.trustora.app.designsystem.components.TrustoraCard
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

@Composable
fun ServicesScreen(
    languageCode: String,
    currency: AppCurrency,
    viewModel: ServicesViewModel,
) {
    val state = viewModel.state

    LaunchedEffect(languageCode, currency.raw) {
        viewModel.loadInitial(language = languageCode, currency = currency)
    }

    if (state.isInitializing) {
        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
            Text("Loading services...", color = TrustoraSecondaryText)
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Marketplace Services", style = MaterialTheme.typography.headlineMedium, color = TrustoraPrimary)
                Text(
                    "Same filters and cards as iOS TrustoraServicesView.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TrustoraTertiaryText,
                )
            }
        }

        item {
            FiltersCard(
                categories = listOf(MarketplaceCategory("all", "All")) + state.categories,
                selectedCategoryId = state.selectedCategoryId,
                onSelectCategory = { categoryId ->
                    viewModel.selectCategory(categoryId, languageCode, currency)
                },
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        if (!state.errorMessage.isNullOrBlank()) {
            item {
                Text(
                    text = state.errorMessage ?: "",
                    color = Color(0xFF7F1D1D),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFEE2E2))
                        .padding(12.dp),
                )
            }
        }

        if (state.services.isEmpty()) {
            item {
                Text(
                    text = "No services found.",
                    color = TrustoraTertiaryText,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 22.dp),
                )
            }
        }

        items(state.services, key = { it.id }) { service ->
            ServiceCard(
                service = service,
                isWishlisted = state.wishlist.contains(service.id),
                onToggleWishlist = { viewModel.toggleWishlist(service.id) },
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        if (state.hasMore && !state.isLoadingMore) {
            item {
                OutlinedButton(
                    onClick = { viewModel.loadNextPageIfNeeded(languageCode, currency) },
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .fillMaxWidth(),
                ) {
                    Text("Load more")
                }
            }
        }

        if (state.isLoadingMore) {
            item {
                Text(
                    text = "Loading more...",
                    color = TrustoraSecondaryText,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun FiltersCard(
    categories: List<MarketplaceCategory>,
    selectedCategoryId: String,
    onSelectCategory: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var isExpanded by remember { mutableStateOf(false) }
    val selectedName = categories.firstOrNull { it.id == selectedCategoryId }?.name ?: "All"

    TrustoraCard(modifier = modifier) {
        Text("Filters", style = MaterialTheme.typography.titleMedium, color = TrustoraPrimaryText)

        Box {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(11.dp))
                    .background(TrustoraMutedSurface)
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(11.dp))
                    .clickable { isExpanded = true }
                    .padding(horizontal = 12.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(selectedName, style = MaterialTheme.typography.labelLarge, color = TrustoraPrimary)
            }

            DropdownMenu(expanded = isExpanded, onDismissRequest = { isExpanded = false }) {
                categories.forEach { category ->
                    DropdownMenuItem(
                        text = { Text(category.name) },
                        onClick = {
                            onSelectCategory(category.id)
                            isExpanded = false
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ServiceCard(
    service: MarketplaceService,
    isWishlisted: Boolean,
    onToggleWishlist: () -> Unit,
    modifier: Modifier = Modifier,
) {
    TrustoraCard(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = service.categoryName,
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraSecondaryText,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFFF1F5F9))
                    .padding(horizontal = 8.dp, vertical = 5.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = if (service.isFeatured) "Recommended" else "Standard",
                style = MaterialTheme.typography.labelSmall,
                color = TrustoraTertiaryText,
            )
        }

        Text(
            text = service.name,
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimaryText,
            fontWeight = FontWeight.Bold,
        )

        Text(
            text = service.description.ifBlank { service.name },
            style = MaterialTheme.typography.bodyMedium,
            color = TrustoraTertiaryText,
        )

        if (service.technologies.isNotEmpty()) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                service.technologies.take(3).forEach { tag ->
                    Text(
                        text = tag,
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraAccent,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(TrustoraAccent.copy(alpha = 0.12f))
                            .padding(horizontal = 8.dp, vertical = 5.dp),
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "Providers available: ${service.providers.size}",
                style = MaterialTheme.typography.labelLarge,
                color = TrustoraTertiaryText,
            )

            if (service.providers.isNotEmpty()) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    service.providers.take(3).forEach { provider ->
                        if (!provider.avatarUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = provider.avatarUrl,
                                contentDescription = provider.displayName,
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .border(1.dp, Color.White, CircleShape),
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFDBEAFE)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(provider.initials, style = MaterialTheme.typography.labelSmall, color = Color(0xFF1E40AF))
                            }
                        }
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onToggleWishlist, modifier = Modifier.weight(1f)) {
                androidx.compose.material3.Icon(
                    imageVector = if (isWishlisted) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = null,
                    tint = if (isWishlisted) Color(0xFF991B1B) else TrustoraSecondaryText,
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (isWishlisted) "Wishlisted" else "Add")
            }
            OutlinedButton(onClick = { }, modifier = Modifier.weight(1f)) {
                Text("Share")
            }
        }
    }
}

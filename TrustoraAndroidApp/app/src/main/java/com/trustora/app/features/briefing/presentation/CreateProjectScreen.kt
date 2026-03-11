package com.trustora.app.features.briefing.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.filled.CheckBox
import androidx.compose.material.icons.filled.CheckBoxOutlineBlank
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalUriHandler
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.DashboardProjectSummary
import com.trustora.app.core.models.ProjectCreationAIStatus
import com.trustora.app.core.models.ProjectCreationMode
import com.trustora.app.core.models.ProjectCreationOAuthProvider
import com.trustora.app.core.models.ProjectCreationProviderCandidate
import com.trustora.app.core.models.ProjectCreationWizardStep
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

private fun tr(languageCode: String, en: String, ro: String): String {
    return if (languageCode.startsWith("ro", ignoreCase = true)) ro else en
}

@Composable
fun CreateProjectScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    currency: AppCurrency,
    viewModel: CreateProjectViewModel,
    onBack: () -> Unit,
    onCreated: (DashboardProjectSummary?) -> Unit,
    onRefreshProfile: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var isSubmitting by remember { mutableStateOf(false) }

    LaunchedEffect(user.id, token, languageCode, currency.raw) {
        viewModel.resetSession(defaultCurrency = currency)
        viewModel.attachRealtime(
            token = token,
            language = languageCode,
        )
        viewModel.loadGroupedServices(
            reset = true,
            currency = currency,
        )
    }

    LaunchedEffect(viewModel.serviceSearch, viewModel.mode, currency.raw) {
        if (viewModel.mode != ProjectCreationMode.MANUAL) return@LaunchedEffect
        delay(300)
        viewModel.loadGroupedServices(
            reset = true,
            currency = currency,
        )
    }

    LaunchedEffect(viewModel.step) {
        if (viewModel.step == ProjectCreationWizardStep.CONNECTIONS) {
            onRefreshProfile()
        }
    }

    DisposableEffect(lifecycleOwner, viewModel.step) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && viewModel.step == ProjectCreationWizardStep.CONNECTIONS) {
                onRefreshProfile()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.detachRealtime()
        }
    }

    val isBusy = viewModel.isLoadingRecommendation ||
        viewModel.isLoadingBrief ||
        viewModel.isLoadingProviders ||
        viewModel.isCreatingProject ||
        isSubmitting

    val isPrimaryDisabled = isPrimaryActionDisabled(
        viewModel = viewModel,
        user = user,
        isBusy = isBusy,
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC)),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 120.dp),
        ) {
            CreateProjectHeader(
                languageCode = languageCode,
                stepLabel = "${viewModel.currentStepIndex + 1}/${viewModel.wizardSteps.size}",
                onBack = onBack,
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (!viewModel.errorMessage.isNullOrBlank()) {
                    BannerCard(
                        text = viewModel.errorMessage.orEmpty(),
                        background = Color(0xFFFEE2E2),
                        foreground = Color(0xFF7F1D1D),
                    )
                }

                if (!viewModel.successMessage.isNullOrBlank()) {
                    BannerCard(
                        text = viewModel.successMessage.orEmpty(),
                        background = Color(0xFFDCFCE7),
                        foreground = Color(0xFF166534),
                    )
                }

                StepProgress(
                    total = viewModel.wizardSteps.size,
                    index = viewModel.currentStepIndex,
                )

                when (viewModel.step) {
                    ProjectCreationWizardStep.INTENT -> {
                        IntentStep(
                            languageCode = languageCode,
                            currency = currency,
                            viewModel = viewModel,
                        )
                    }

                    ProjectCreationWizardStep.RECOMMENDATION -> {
                        RecommendationStep(
                            languageCode = languageCode,
                            viewModel = viewModel,
                        )
                    }

                    ProjectCreationWizardStep.BRIEFING -> {
                        BriefingStep(
                            languageCode = languageCode,
                            currency = currency,
                            viewModel = viewModel,
                            onSendClarification = {
                                scope.launch {
                                    viewModel.sendClarification()
                                }
                            },
                        )
                    }

                    ProjectCreationWizardStep.PROVIDERS -> {
                        ProvidersStep(
                            languageCode = languageCode,
                            viewModel = viewModel,
                        )
                    }

                    ProjectCreationWizardStep.CONNECTIONS -> {
                        ConnectionsStep(
                            languageCode = languageCode,
                            user = user,
                            viewModel = viewModel,
                            onConnectProvider = { provider ->
                                val url = viewModel.requestOAuthConnection(provider)
                                if (url.isNullOrBlank()) {
                                    viewModel.showRuntimeError(
                                        tr(languageCode, "OAuth URL is missing.", "URL-ul OAuth lipsește."),
                                    )
                                } else {
                                    runCatching {
                                        uriHandler.openUri(url)
                                    }.onFailure {
                                        viewModel.showRuntimeError(
                                            tr(languageCode, "Failed to open OAuth URL.", "Nu am putut deschide URL-ul OAuth."),
                                        )
                                    }
                                }
                            },
                        )
                    }

                    ProjectCreationWizardStep.REVIEW -> {
                        ReviewStep(
                            languageCode = languageCode,
                            currency = currency,
                            viewModel = viewModel,
                        )
                    }
                }
            }
        }

        CreateProjectActionBar(
            languageCode = languageCode,
            step = viewModel.step,
            mode = viewModel.mode,
            aiStatus = viewModel.aiStatus,
            canGoBack = viewModel.currentStepIndex > 0,
            isBusy = isBusy,
            isPrimaryDisabled = isPrimaryDisabled,
            onBack = viewModel::goToPreviousStep,
            onContinue = {
                scope.launch {
                    viewModel.continueFlow(user = user)
                }
            },
            onCreate = {
                scope.launch {
                    isSubmitting = true
                    val created = viewModel.createProject(
                        userId = user.id,
                        appCurrency = currency,
                    )
                    isSubmitting = false
                    if (created) {
                        onCreated(viewModel.createdProject)
                    }
                }
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
        )
    }
}

@Composable
private fun CreateProjectHeader(
    languageCode: String,
    stepLabel: String,
    onBack: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.96f))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Button(
            onClick = onBack,
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraMutedSurface,
                contentColor = TrustoraPrimary,
            ),
            contentPadding = PaddingValues(0.dp),
            modifier = Modifier
                .width(34.dp)
                .height(34.dp),
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = tr(languageCode, "Back", "Înapoi"),
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = tr(languageCode, "Create project", "Creează proiect"),
                color = TrustoraPrimary,
                style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = tr(languageCode, "AI-assisted project setup", "Configurare proiect asistată de AI"),
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
            )
        }

        Box(
            modifier = Modifier
                .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                .padding(horizontal = 10.dp, vertical = 8.dp),
        ) {
            Text(
                text = stepLabel,
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun StepProgress(
    total: Int,
    index: Int,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        repeat(total) { stepIndex ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(6.dp)
                    .background(
                        color = if (stepIndex <= index) TrustoraAccent else Color(0xFFE2E8F0),
                        shape = RoundedCornerShape(100.dp),
                    ),
            )
        }
    }
}

@Composable
private fun IntentStep(
    languageCode: String,
    currency: AppCurrency,
    viewModel: CreateProjectViewModel,
) {
    SectionCard(
        title = tr(languageCode, "Mode", "Mod"),
        subtitle = tr(languageCode, "Choose AI or manual flow", "Alege flux AI sau manual"),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SegmentedButton(
                label = "AI",
                selected = viewModel.mode == ProjectCreationMode.AI,
                onClick = { viewModel.applyMode(ProjectCreationMode.AI) },
                modifier = Modifier.weight(1f),
            )
            SegmentedButton(
                label = tr(languageCode, "Manual", "Manual"),
                selected = viewModel.mode == ProjectCreationMode.MANUAL,
                onClick = { viewModel.applyMode(ProjectCreationMode.MANUAL) },
                modifier = Modifier.weight(1f),
            )
        }
    }

    SectionCard(
        title = tr(languageCode, "Project intent", "Intenția proiectului"),
        subtitle = tr(languageCode, "Describe the goal and expected result", "Descrie obiectivul și rezultatul dorit"),
    ) {
        InputField(
            value = viewModel.intent,
            onValueChange = { viewModel.intent = it },
            placeholder = tr(languageCode, "Describe your project...", "Descrie proiectul tău..."),
            minLines = 5,
        )
    }

    if (viewModel.mode == ProjectCreationMode.MANUAL) {
        SectionCard(
            title = tr(languageCode, "Manual details", "Detalii manuale"),
            subtitle = tr(languageCode, "Configure services, lines and milestones", "Configurează servicii, linii și milestone-uri"),
        ) {
            FieldLabel(tr(languageCode, "Project title", "Titlu proiect"))
            InputField(
                value = viewModel.manualTitle,
                onValueChange = { viewModel.manualTitle = it },
                placeholder = tr(languageCode, "Project title", "Titlu proiect"),
            )

            FieldLabel(tr(languageCode, "Duration", "Durată"))
            InputField(
                value = viewModel.manualDuration,
                onValueChange = { viewModel.manualDuration = it },
                placeholder = tr(languageCode, "Duration (e.g. 8 weeks)", "Durată (ex: 8 săptămâni)"),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ChoicePicker(
                    label = tr(languageCode, "Payment plan", "Plan de plată"),
                    value = viewModel.manualPaymentPlan,
                    values = listOf("FULL", "MILESTONE", "MONTHLY"),
                    onSelect = { viewModel.manualPaymentPlan = it },
                    modifier = Modifier.weight(1f),
                )

                ChoicePicker(
                    label = tr(languageCode, "Currency", "Monedă"),
                    value = viewModel.manualCurrency,
                    values = AppCurrency.entries.map { it.raw },
                    onSelect = { viewModel.manualCurrency = it },
                    modifier = Modifier.weight(1f),
                )
            }

            FieldLabel(tr(languageCode, "Specific requirements", "Cerințe specifice"))
            InputField(
                value = viewModel.manualSpecificRequirements,
                onValueChange = { viewModel.manualSpecificRequirements = it },
                placeholder = tr(languageCode, "Specific requirements (one per line)", "Cerințe specifice (una pe linie)"),
                minLines = 3,
            )

            HorizontalDivider(color = TrustoraBorder)

            FieldLabel(tr(languageCode, "Search services", "Caută servicii"))
            SearchField(
                value = viewModel.serviceSearch,
                onValueChange = { viewModel.serviceSearch = it },
                placeholder = tr(languageCode, "Search by name...", "Caută după nume..."),
            )

            when {
                viewModel.groupedServices.isEmpty() && viewModel.isLoadingServices -> {
                    Text(
                        text = tr(languageCode, "Loading services...", "Se încarcă serviciile..."),
                        color = TrustoraSecondaryText,
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    )
                }

                viewModel.groupedServices.isEmpty() -> {
                    Text(
                        text = tr(languageCode, "No services found.", "Nu au fost găsite servicii."),
                        color = TrustoraSecondaryText,
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    )
                }

                else -> {
                    viewModel.groupedServices.forEach { service ->
                        val selected = viewModel.selectedManualServiceIds.contains(service.id)
                        ManualServiceRow(
                            languageCode = languageCode,
                            selected = selected,
                            serviceName = service.name,
                            categoryName = service.categoryName,
                            provider = service.deliveryProvider,
                            description = service.description,
                            onToggle = {
                                viewModel.toggleManualService(
                                    service = service,
                                    selected = !selected,
                                )
                            },
                        )

                        if (viewModel.shouldLoadNextServicesPage(service.id)) {
                            LaunchedEffect(
                                "manual-next-${service.id}-${viewModel.groupedServicesPage}-${viewModel.serviceSearch}",
                            ) {
                                viewModel.loadGroupedServices(
                                    reset = false,
                                    currency = currency,
                                )
                            }
                        }
                    }

                    if (viewModel.isLoadingMoreServices) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = TrustoraPrimary,
                            )
                        }
                    }
                }
            }

            if (viewModel.manualLines.isNotEmpty()) {
                HorizontalDivider(color = TrustoraBorder)
                viewModel.manualLines.forEach { line ->
                    ManualLineCard(
                        languageCode = languageCode,
                        line = line,
                        onDescriptionChange = { next ->
                            viewModel.updateManualLine(line.id, description = next)
                        },
                        onBudgetPercentageChange = { next ->
                            viewModel.updateManualLine(line.id, budgetPercentage = next)
                        },
                        onAddMilestone = {
                            viewModel.addManualMilestone(line.id)
                        },
                        onRemoveMilestone = { milestoneId ->
                            viewModel.removeManualMilestone(line.id, milestoneId)
                        },
                        onMilestoneTitleChange = { milestoneId, next ->
                            viewModel.updateManualMilestone(line.id, milestoneId, title = next)
                        },
                        onMilestoneDescriptionChange = { milestoneId, next ->
                            viewModel.updateManualMilestone(line.id, milestoneId, description = next)
                        },
                        onMilestoneAmountChange = { milestoneId, next ->
                            viewModel.updateManualMilestone(line.id, milestoneId, amount = next)
                        },
                        onMilestonePercentageChange = { milestoneId, next ->
                            viewModel.updateManualMilestone(line.id, milestoneId, percentage = next)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(
        text = text,
        color = TrustoraPrimaryText,
        style = androidx.compose.material3.MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun ChoicePicker(
    label: String,
    value: String,
    values: List<String>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        FieldLabel(label)
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
        ) {
            Text(
                text = value,
                color = TrustoraPrimary,
                fontWeight = FontWeight.SemiBold,
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            values.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        expanded = false
                        onSelect(option)
                    },
                )
            }
        }
    }
}

@Composable
private fun SearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = {
            Text(
                text = placeholder,
                color = TrustoraSecondaryText,
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = null,
                tint = TrustoraSecondaryText,
            )
        },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = TrustoraBorder,
            unfocusedBorderColor = TrustoraBorder,
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
        ),
    )
}

@Composable
private fun ManualServiceRow(
    languageCode: String,
    selected: Boolean,
    serviceName: String,
    categoryName: String,
    provider: String,
    description: String,
    onToggle: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
            .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, RoundedCornerShape(12.dp))
            .clickable(onClick = onToggle)
            .padding(10.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(
            imageVector = if (selected) Icons.Default.CheckBox else Icons.Default.CheckBoxOutlineBlank,
            contentDescription = null,
            tint = if (selected) TrustoraAccent else TrustoraSecondaryText,
            modifier = Modifier.padding(top = 2.dp),
        )
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = serviceName,
                color = TrustoraPrimaryText,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "$categoryName • ${deliveryProviderTitle(provider, languageCode)}",
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            )
            if (description.isNotBlank()) {
                Text(
                    text = description,
                    color = TrustoraSecondaryText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun ManualLineCard(
    languageCode: String,
    line: com.trustora.app.core.models.ProjectCreationLineDraft,
    onDescriptionChange: (String) -> Unit,
    onBudgetPercentageChange: (String) -> Unit,
    onAddMilestone: () -> Unit,
    onRemoveMilestone: (String) -> Unit,
    onMilestoneTitleChange: (String, String) -> Unit,
    onMilestoneDescriptionChange: (String, String) -> Unit,
    onMilestoneAmountChange: (String, String) -> Unit,
    onMilestonePercentageChange: (String, String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = line.serviceName,
                color = TrustoraPrimary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = deliveryProviderTitle(line.deliveryProvider, languageCode),
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
            )
        }

        FieldLabel(tr(languageCode, "Line description", "Descriere linie"))
        InputField(
            value = line.description,
            onValueChange = onDescriptionChange,
            placeholder = tr(languageCode, "Describe this line", "Descrie această linie"),
        )

        FieldLabel(tr(languageCode, "Line budget percentage", "Procent buget linie"))
        InputField(
            value = line.budgetPercentage,
            onValueChange = onBudgetPercentageChange,
            placeholder = "0",
            keyboardType = KeyboardType.Decimal,
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            FieldLabel(tr(languageCode, "Milestones", "Milestone-uri"))
            Spacer(modifier = Modifier.weight(1f))
            TextButton(onClick = onAddMilestone) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    tint = TrustoraAccent,
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = tr(languageCode, "Add", "Adaugă"),
                    color = TrustoraAccent,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        if (line.milestones.isEmpty()) {
            Text(
                text = tr(languageCode, "No milestones yet.", "Nu există milestone-uri încă."),
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            )
        } else {
            line.milestones.forEach { milestone ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    InputField(
                        value = milestone.title,
                        onValueChange = { next ->
                            onMilestoneTitleChange(milestone.id, next)
                        },
                        placeholder = tr(languageCode, "Milestone title", "Titlu milestone"),
                    )

                    InputField(
                        value = milestone.description,
                        onValueChange = { next ->
                            onMilestoneDescriptionChange(milestone.id, next)
                        },
                        placeholder = tr(languageCode, "Milestone description", "Descriere milestone"),
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        InputField(
                            value = milestone.amount,
                            onValueChange = { next ->
                                onMilestoneAmountChange(milestone.id, next)
                            },
                            placeholder = tr(languageCode, "Amount", "Sumă"),
                            keyboardType = KeyboardType.Decimal,
                            modifier = Modifier.weight(1f),
                        )
                        InputField(
                            value = milestone.percentage,
                            onValueChange = { next ->
                                onMilestonePercentageChange(milestone.id, next)
                            },
                            placeholder = tr(languageCode, "Percentage", "Procent"),
                            keyboardType = KeyboardType.Decimal,
                            modifier = Modifier.weight(1f),
                        )
                    }

                    TextButton(
                        onClick = { onRemoveMilestone(milestone.id) },
                        modifier = Modifier.align(Alignment.End),
                    ) {
                        Text(
                            text = tr(languageCode, "Remove", "Elimină"),
                            color = Color(0xFFB91C1C),
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RecommendationStep(
    languageCode: String,
    viewModel: CreateProjectViewModel,
) {
    SectionCard(
        title = tr(languageCode, "Recommended services", "Servicii recomandate"),
        subtitle = tr(languageCode, "Select services to include in the brief", "Selectează serviciile pentru brief"),
    ) {
        if (viewModel.isLoadingRecommendation) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator(color = TrustoraPrimary)
            }
        } else if (viewModel.recommendations.isEmpty()) {
            Text(
                text = tr(languageCode, "No recommendations available.", "Nu există recomandări."),
                color = TrustoraSecondaryText,
            )
        } else {
            viewModel.recommendations.forEach { recommendation ->
                val selected = viewModel.selectedRecommendationIds.contains(recommendation.id)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (selected) Color(0xFFE0F2FE) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = { viewModel.toggleRecommendation(recommendation.id) },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selected) TrustoraAccent else Color(0xFFE2E8F0),
                            contentColor = if (selected) TrustoraAccentButtonText else TrustoraPrimary,
                        ),
                        modifier = Modifier
                            .size(28.dp),
                        contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(if (selected) "✓" else "")
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = recommendation.serviceName,
                                color = TrustoraPrimaryText,
                                fontWeight = FontWeight.Bold,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false),
                            )
                            if (recommendation.isAlternative) {
                                Text(
                                    text = tr(languageCode, "Alternative", "Alternativ"),
                                    color = Color(0xFF9A3412),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                )
                            }
                        }
                        Text(
                            text = deliveryProviderTitle(recommendation.deliveryProvider, languageCode),
                            color = TrustoraSecondaryText,
                            style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
                        )
                        if (!recommendation.description.isNullOrBlank()) {
                            Text(
                                text = recommendation.description,
                                color = TrustoraSecondaryText,
                                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BriefingStep(
    languageCode: String,
    currency: AppCurrency,
    viewModel: CreateProjectViewModel,
    onSendClarification: () -> Unit,
) {
    SectionCard(
        title = tr(languageCode, "AI briefing", "Brief AI"),
        subtitle = tr(languageCode, "Realtime updates are applied automatically", "Update-urile realtime se aplică automat"),
    ) {
        if (viewModel.isLoadingBrief) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator(color = TrustoraPrimary)
            }
        }

        when (viewModel.aiStatus) {
            ProjectCreationAIStatus.PROCESSING -> {
                Text(
                    text = tr(languageCode, "Processing...", "Se procesează..."),
                    color = TrustoraSecondaryText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                )
            }

            ProjectCreationAIStatus.CLARIFY -> {
                if (viewModel.aiQuestions.isEmpty()) {
                    Text(
                        text = tr(languageCode, "Waiting for AI clarification questions.", "Aștept întrebările de clarificare AI."),
                        color = TrustoraSecondaryText,
                    )
                } else {
                    viewModel.aiQuestions.forEachIndexed { index, question ->
                        Text(
                            text = "${index + 1}. $question",
                            color = TrustoraPrimaryText,
                            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        )
                    }
                }

                InputField(
                    value = viewModel.aiClarificationAnswer,
                    onValueChange = { viewModel.aiClarificationAnswer = it },
                    placeholder = tr(languageCode, "Your answer", "Răspunsul tău"),
                    minLines = 3,
                )

                Button(
                    onClick = onSendClarification,
                    enabled = viewModel.aiClarificationAnswer.trim().isNotEmpty() && !viewModel.isLoadingBrief,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TrustoraAccent,
                        contentColor = TrustoraAccentButtonText,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(tr(languageCode, "Send clarification", "Trimite clarificarea"))
                }
            }

            ProjectCreationAIStatus.FINAL -> {
                viewModel.brief?.let { brief ->
                    Text(
                        text = brief.title,
                        color = TrustoraPrimary,
                        fontWeight = FontWeight.Black,
                    )
                    if (brief.description.isNotBlank()) {
                        Text(
                            text = brief.description,
                            color = TrustoraSecondaryText,
                            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        InputField(
                            value = viewModel.totalBudget,
                            onValueChange = { viewModel.totalBudget = it },
                            placeholder = tr(languageCode, "Total budget", "Buget total"),
                            modifier = Modifier.weight(1f),
                        )
                        InputField(
                            value = viewModel.editableDuration,
                            onValueChange = { viewModel.editableDuration = it },
                            placeholder = tr(languageCode, "Duration", "Durată"),
                            modifier = Modifier.weight(1f),
                        )
                    }

                    InputField(
                        value = viewModel.editablePaymentPlan,
                        onValueChange = { viewModel.editablePaymentPlan = it.uppercase(Locale.ROOT) },
                        placeholder = tr(languageCode, "Payment plan", "Plan de plată"),
                    )

                    viewModel.reviewLines.forEach { line ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
                                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(
                                text = line.serviceName,
                                color = TrustoraPrimary,
                                fontWeight = FontWeight.Bold,
                            )
                            line.milestones.forEach { milestone ->
                                Text(
                                    text = "• ${milestone.title} - ${formatAmount(milestone.amount, currency.raw)}",
                                    color = TrustoraSecondaryText,
                                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                } ?: Text(
                    text = tr(languageCode, "No final brief yet.", "Nu există încă brief final."),
                    color = TrustoraSecondaryText,
                )
            }
        }
    }
}

@Composable
private fun ProvidersStep(
    languageCode: String,
    viewModel: CreateProjectViewModel,
) {
    SectionCard(
        title = tr(languageCode, "Provider recommendations", "Recomandări provideri"),
        subtitle = tr(languageCode, "Select providers and assign milestones", "Selectează provideri și atribuie milestone-uri"),
    ) {
        if (viewModel.isLoadingProviders) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator(color = TrustoraPrimary)
            }
        } else if (viewModel.recommendedProviders.isEmpty()) {
            Text(
                text = tr(languageCode, "No provider recommendations available.", "Nu există recomandări de provideri."),
                color = TrustoraSecondaryText,
            )
        } else {
            viewModel.reviewLines.forEach { line ->
                ProviderServiceCard(
                    languageCode = languageCode,
                    line = line,
                    viewModel = viewModel,
                )
            }
        }
    }
}

@Composable
private fun ProviderServiceCard(
    languageCode: String,
    line: com.trustora.app.core.models.ProjectCreationBriefLine,
    viewModel: CreateProjectViewModel,
) {
    val providers = viewModel.providerOptions(line.serviceName)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = line.serviceName,
            color = TrustoraPrimary,
            fontWeight = FontWeight.Bold,
        )

        if (providers.isEmpty()) {
            Text(
                text = tr(languageCode, "No provider candidates for this service.", "Nu există candidați provider pentru acest serviciu."),
                color = TrustoraSecondaryText,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            )
        } else {
            providers.forEach { provider ->
                ProviderRow(
                    provider = provider,
                    selected = viewModel.isProviderSelected(line.serviceName, provider.id),
                    onToggle = {
                        viewModel.toggleProvider(
                            serviceName = line.serviceName,
                            providerId = provider.id,
                        )
                    },
                )
            }
        }

        if (line.milestones.isNotEmpty()) {
            line.milestones.forEach { milestone ->
                val selectedProviderId = viewModel.selectedProviderIdForMilestone(
                    serviceName = line.serviceName,
                    lineId = line.id,
                    milestoneId = milestone.id,
                )
                val selectedName = selectedProviderId
                    ?.let { selectedId -> viewModel.providerById(line.serviceName, selectedId)?.displayName }
                    ?: tr(languageCode, "Assign provider", "Atribuie provider")

                val eligibleProviders = providers.filter { provider ->
                    viewModel.isProviderSelected(line.serviceName, provider.id)
                }

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = milestone.title,
                        color = TrustoraPrimaryText,
                        style = androidx.compose.material3.MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    MilestoneAssignmentPicker(
                        label = selectedName,
                        providers = eligibleProviders,
                        hasSelection = selectedProviderId != null,
                        onPick = { providerId ->
                            viewModel.assignMilestone(
                                serviceName = line.serviceName,
                                lineId = line.id,
                                milestoneId = milestone.id,
                                providerId = providerId,
                            )
                        },
                        onClear = {
                            viewModel.removeMilestoneAssignment(
                                serviceName = line.serviceName,
                                lineId = line.id,
                                milestoneId = milestone.id,
                            )
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ProviderRow(
    provider: ProjectCreationProviderCandidate,
    selected: Boolean,
    onToggle: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
            .border(1.dp, if (selected) TrustoraAccent else TrustoraBorder, RoundedCornerShape(10.dp))
            .clickable(onClick = onToggle)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ProviderAvatar(provider = provider)
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = provider.displayName,
                color = TrustoraPrimaryText,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            provider.matchScore?.let { score ->
                Text(
                    text = "Match ${"%.0f".format(score)}",
                    color = TrustoraSecondaryText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
            }
        }
        Text(
            text = if (selected) "✓" else "○",
            color = if (selected) TrustoraAccent else TrustoraSecondaryText,
            fontWeight = FontWeight.Black,
            fontSize = 16.sp,
        )
    }
}

@Composable
private fun ProviderAvatar(provider: ProjectCreationProviderCandidate) {
    val avatar = provider.avatarUrl
    if (!avatar.isNullOrBlank()) {
        AsyncImage(
            model = avatar,
            contentDescription = provider.displayName,
            modifier = Modifier
                .size(34.dp)
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp)),
        )
    } else {
        val initials = buildString {
            provider.firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
            provider.lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
        }.ifBlank { "P" }
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(TrustoraMutedSurface, RoundedCornerShape(10.dp))
                .border(1.dp, TrustoraBorder, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = initials,
                color = TrustoraSecondaryText,
                fontWeight = FontWeight.Black,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun MilestoneAssignmentPicker(
    label: String,
    providers: List<ProjectCreationProviderCandidate>,
    hasSelection: Boolean,
    onPick: (String) -> Unit,
    onClear: () -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(
            onClick = { expanded = true },
            shape = RoundedCornerShape(10.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
        ) {
            Text(
                text = label,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            providers.forEach { provider ->
                DropdownMenuItem(
                    text = { Text(provider.displayName) },
                    onClick = {
                        expanded = false
                        onPick(provider.id)
                    },
                )
            }
            if (hasSelection) {
                DropdownMenuItem(
                    text = { Text("Clear") },
                    onClick = {
                        expanded = false
                        onClear()
                    },
                )
            }
        }
    }
}

@Composable
private fun ConnectionsStep(
    languageCode: String,
    user: AuthUser,
    viewModel: CreateProjectViewModel,
    onConnectProvider: (ProjectCreationOAuthProvider) -> Unit,
) {
    val required = viewModel.requiredOAuthProviders()
    val connected = viewModel.connectedOAuthProviders(user)
    val missing = viewModel.missingOAuthProviders(user)

    SectionCard(
        title = tr(languageCode, "Required connections", "Conexiuni necesare"),
        subtitle = tr(languageCode, "Connect provider accounts required by selected services", "Conectează conturile cerute de serviciile selectate"),
    ) {
        if (required.isEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFDCFCE7), RoundedCornerShape(10.dp))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("✓", color = Color(0xFF166534), fontWeight = FontWeight.Black)
                Text(
                    text = tr(languageCode, "No external connections required.", "Nu sunt necesare conexiuni externe."),
                    color = Color(0xFF166534),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        } else {
            required.forEach { provider ->
                val isConnected = connected.contains(provider)
                val services = viewModel.requiredServices(provider)

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
                        .border(
                            1.dp,
                            if (isConnected) Color(0xFF86EFAC) else TrustoraBorder,
                            RoundedCornerShape(10.dp),
                        )
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = oauthProviderSymbol(provider),
                            color = TrustoraPrimary,
                            fontWeight = FontWeight.Black,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = oauthProviderTitle(provider),
                            color = TrustoraPrimaryText,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = if (isConnected) tr(languageCode, "Connected", "Conectat") else tr(languageCode, "Not connected", "Neconectat"),
                            color = if (isConnected) Color(0xFF166534) else Color(0xFF9A3412),
                            style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                        )
                    }

                    if (services.isNotEmpty()) {
                        Text(
                            text = tr(languageCode, "Required for", "Necesar pentru") + ": " + services.joinToString(", "),
                            color = TrustoraSecondaryText,
                            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        )
                    }

                    if (!isConnected) {
                        Button(
                            onClick = { onConnectProvider(provider) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = TrustoraAccent,
                                contentColor = TrustoraAccentButtonText,
                            ),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(tr(languageCode, "Connect", "Conectează"))
                        }
                    }
                }
            }

            if (missing.isNotEmpty()) {
                Text(
                    text = tr(
                        languageCode,
                        "Complete all required connections to continue.",
                        "Finalizează toate conexiunile necesare pentru a continua.",
                    ),
                    color = Color(0xFF9A3412),
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFFEDD5), RoundedCornerShape(10.dp))
                        .padding(10.dp),
                )
            }
        }
    }
}

@Composable
private fun ReviewStep(
    languageCode: String,
    currency: AppCurrency,
    viewModel: CreateProjectViewModel,
) {
    val brief = viewModel.brief
    SectionCard(
        title = tr(languageCode, "Review project", "Revizuiește proiectul"),
        subtitle = tr(languageCode, "Finalize values before create", "Finalizează valorile înainte de creare"),
    ) {
        InputField(
            value = viewModel.totalBudget,
            onValueChange = { viewModel.totalBudget = it },
            placeholder = tr(languageCode, "Total budget", "Buget total"),
        )
        InputField(
            value = viewModel.editableDuration,
            onValueChange = { viewModel.editableDuration = it },
            placeholder = tr(languageCode, "Duration", "Durată"),
        )
        InputField(
            value = viewModel.editablePaymentPlan,
            onValueChange = { viewModel.editablePaymentPlan = it.uppercase(Locale.ROOT) },
            placeholder = tr(languageCode, "Payment plan", "Plan de plată"),
        )

        if (brief != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                    .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = brief.title,
                    color = TrustoraPrimary,
                    fontWeight = FontWeight.Bold,
                )
                viewModel.reviewLines.forEach { line ->
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = line.serviceName,
                            color = TrustoraPrimaryText,
                            fontWeight = FontWeight.SemiBold,
                        )
                        line.milestones.forEach { milestone ->
                            val providerName = viewModel.selectedProviderIdForMilestone(
                                serviceName = line.serviceName,
                                lineId = line.id,
                                milestoneId = milestone.id,
                            )?.let { selectedId ->
                                viewModel.providerById(line.serviceName, selectedId)?.displayName
                            } ?: tr(languageCode, "Unassigned", "Neatribuit")

                            Text(
                                text = "• ${milestone.title} - ${formatAmount(milestone.amount, currency.raw)} - $providerName",
                                color = TrustoraSecondaryText,
                                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
        } else {
            Text(
                text = tr(languageCode, "No brief generated.", "Nu există brief generat."),
                color = TrustoraSecondaryText,
            )
        }
    }
}

@Composable
private fun CreateProjectActionBar(
    languageCode: String,
    step: ProjectCreationWizardStep,
    mode: ProjectCreationMode,
    aiStatus: ProjectCreationAIStatus,
    canGoBack: Boolean,
    isBusy: Boolean,
    isPrimaryDisabled: Boolean,
    onBack: () -> Unit,
    onContinue: () -> Unit,
    onCreate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .background(Color.White.copy(alpha = 0.96f))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TextButton(
            onClick = onBack,
            enabled = canGoBack && !isBusy,
            modifier = Modifier.weight(1f),
        ) {
            Text(
                text = tr(languageCode, "Back", "Înapoi"),
                color = if (canGoBack && !isBusy) TrustoraPrimary else Color(0xFF94A3B8),
            )
        }

        val isReview = step == ProjectCreationWizardStep.REVIEW
        val continueLabel = when (step) {
            ProjectCreationWizardStep.INTENT -> {
                if (mode == ProjectCreationMode.MANUAL) {
                    tr(languageCode, "Continue to providers", "Continuă la provideri")
                } else {
                    tr(languageCode, "Get recommendations", "Obține recomandări")
                }
            }

            ProjectCreationWizardStep.RECOMMENDATION ->
                tr(languageCode, "Generate brief", "Generează brief")

            ProjectCreationWizardStep.BRIEFING -> when (aiStatus) {
                ProjectCreationAIStatus.FINAL -> tr(languageCode, "Continue to providers", "Continuă la provideri")
                ProjectCreationAIStatus.CLARIFY -> tr(languageCode, "Send clarification", "Trimite clarificarea")
                ProjectCreationAIStatus.PROCESSING -> tr(languageCode, "Waiting...", "Așteptare...")
            }

            ProjectCreationWizardStep.PROVIDERS ->
                tr(languageCode, "Continue to connections", "Continuă la conexiuni")

            ProjectCreationWizardStep.CONNECTIONS ->
                tr(languageCode, "Continue to review", "Continuă la review")

            ProjectCreationWizardStep.REVIEW ->
                tr(languageCode, "Create project", "Creează proiect")
        }

        Button(
            onClick = {
                if (isReview) onCreate() else onContinue()
            },
            enabled = !isPrimaryDisabled && !isBusy,
            modifier = Modifier.weight(2f),
            colors = ButtonDefaults.buttonColors(
                containerColor = TrustoraAccent,
                contentColor = TrustoraAccentButtonText,
            ),
        ) {
            if (isBusy) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .width(16.dp)
                        .height(16.dp),
                    strokeWidth = 2.dp,
                    color = TrustoraAccentButtonText,
                )
            } else {
                Text(
                    text = continueLabel,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

private fun isPrimaryActionDisabled(
    viewModel: CreateProjectViewModel,
    user: AuthUser,
    isBusy: Boolean,
): Boolean {
    if (isBusy) return true
    return when (viewModel.step) {
        ProjectCreationWizardStep.INTENT ->
            viewModel.intent.trim().isEmpty()

        ProjectCreationWizardStep.RECOMMENDATION ->
            viewModel.selectedRecommendationIds.isEmpty()

        ProjectCreationWizardStep.BRIEFING -> when (viewModel.aiStatus) {
            ProjectCreationAIStatus.FINAL -> viewModel.brief == null
            ProjectCreationAIStatus.CLARIFY -> viewModel.aiClarificationAnswer.trim().isEmpty()
            ProjectCreationAIStatus.PROCESSING -> true
        }

        ProjectCreationWizardStep.PROVIDERS ->
            viewModel.brief == null

        ProjectCreationWizardStep.CONNECTIONS ->
            !viewModel.canContinueFromConnections(user)

        ProjectCreationWizardStep.REVIEW ->
            viewModel.brief == null || viewModel.parsedTotalBudget <= 0.0
    }
}

@Composable
private fun SectionCard(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(14.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = title,
            color = TrustoraPrimary,
            style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = subtitle,
            color = TrustoraSecondaryText,
            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
        )
        content()
    }
}

@Composable
private fun SegmentedButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) TrustoraAccent else Color(0xFFE2E8F0),
            contentColor = if (selected) TrustoraAccentButtonText else TrustoraPrimary,
        ),
    ) {
        Text(
            text = label,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
        )
    }
}

@Composable
private fun InputField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    minLines: Int = 1,
    keyboardType: KeyboardType = KeyboardType.Text,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = {
            Text(
                text = placeholder,
                color = TrustoraSecondaryText,
            )
        },
        minLines = minLines,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        keyboardOptions = KeyboardOptions.Default.copy(keyboardType = keyboardType),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = TrustoraBorder,
            unfocusedBorderColor = TrustoraBorder,
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
        ),
    )
}

@Composable
private fun BannerCard(
    text: String,
    background: Color,
    foreground: Color,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(background, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Text(
            text = text,
            color = foreground,
            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
        )
    }
}

private fun deliveryProviderTitle(provider: String, languageCode: String): String {
    return when (provider.lowercase(Locale.ROOT)) {
        "github" -> "GitHub"
        "figma" -> "Figma"
        "google_drive" -> "Google Drive"
        "google_analytics" -> "Google Analytics"
        else -> tr(languageCode, "Manual upload", "Upload manual")
    }
}

private fun oauthProviderTitle(provider: ProjectCreationOAuthProvider): String {
    return when (provider) {
        ProjectCreationOAuthProvider.GITHUB -> "GitHub"
        ProjectCreationOAuthProvider.FIGMA -> "Figma"
        ProjectCreationOAuthProvider.GOOGLE -> "Google"
    }
}

private fun oauthProviderSymbol(provider: ProjectCreationOAuthProvider): String {
    return when (provider) {
        ProjectCreationOAuthProvider.GITHUB -> "</>"
        ProjectCreationOAuthProvider.FIGMA -> "F"
        ProjectCreationOAuthProvider.GOOGLE -> "G"
    }
}

private fun formatAmount(value: Double, currencyCode: String): String {
    return runCatching {
        val formatter = NumberFormat.getCurrencyInstance()
        formatter.currency = Currency.getInstance(currencyCode.uppercase(Locale.ROOT))
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        formatter.format(value)
    }.getOrElse {
        "${"%.2f".format(Locale.US, value)} ${currencyCode.uppercase(Locale.ROOT)}"
    }
}

package com.trustora.app.ui.screens.provider

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.models.ProviderProfileTab
import com.trustora.app.core.models.ProviderProfileValidationField
import com.trustora.app.core.models.ProviderProfileWeekDay
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBorder
import com.trustora.app.designsystem.theme.TrustoraMutedSurface
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText
import java.io.ByteArrayOutputStream
import java.util.Locale
import kotlinx.coroutines.launch

@Composable
fun ProviderEditProfileScreen(
    user: AuthUser,
    token: String,
    languageCode: String,
    viewModel: ProviderProfileViewModel,
    onBack: () -> Unit,
    onRefreshProfile: () -> Unit,
) {
    val canEdit = user.hasRole("provider") && token.isNotBlank()
    val isRomanian = languageCode.startsWith("ro", ignoreCase = true)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult

        scope.launch {
            val bytes = runCatching {
                context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            }.getOrNull()

            if (bytes == null || bytes.isEmpty()) {
                viewModel.showError(
                    providerTr(
                        languageCode,
                        "The selected image could not be processed.",
                        "Imaginea selectata nu a putut fi procesata.",
                    ),
                )
                return@launch
            }

            val cropped = centerCropAvatarToPng(bytes) ?: bytes
            val fileName = providerAvatarFileName(
                firstName = viewModel.profile.firstName.ifEmpty { user.firstName },
                lastName = viewModel.profile.lastName.ifEmpty { user.lastName },
            )
            viewModel.uploadAvatar(
                imageData = cropped,
                fileName = fileName,
                mimeType = "image/png",
                token = token,
                language = languageCode,
            ) { success ->
                if (success) {
                    onRefreshProfile()
                }
            }
        }
    }

    LaunchedEffect(user.id, token, languageCode, canEdit) {
        if (canEdit) {
            viewModel.load(token = token, language = languageCode)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TrustoraPrimary)
            }

            Text(
                text = providerTr(languageCode, "Edit Profile", "Editeaza Profilul"),
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimary,
                modifier = Modifier.weight(1f),
            )

            TextButton(
                onClick = {
                    viewModel.save(
                        token = token,
                        language = languageCode,
                    ) { success ->
                        if (success) onRefreshProfile()
                    }
                },
                enabled = canEdit && !viewModel.isSaving && !viewModel.isLoading && !viewModel.isUploadingAvatar,
            ) {
                if (viewModel.isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Save, contentDescription = null, tint = TrustoraAccent)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(providerTr(languageCode, "Save", "Salveaza"), color = TrustoraAccent)
                }
            }
        }

        if (!canEdit) {
            ProviderUnavailableState(
                languageCode = languageCode,
                title = providerTr(languageCode, "Provider profile unavailable", "Profilul provider nu este disponibil"),
                message = providerTr(
                    languageCode,
                    "This screen is available only for authenticated provider accounts.",
                    "Acest ecran este disponibil doar pentru conturile provider autentificate.",
                ),
            )
            return
        }

        if (viewModel.isLoading && !viewModel.didLoadInitialData) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = TrustoraAccent)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = providerTr(languageCode, "Loading provider profile...", "Se incarca profilul provider..."),
                        color = TrustoraSecondaryText,
                    )
                }
            }
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            ProviderSectionCard(
                title = buildString {
                    append(
                        listOf(viewModel.profile.firstName, viewModel.profile.lastName)
                            .joinToString(" ")
                            .trim()
                            .ifEmpty { user.displayName },
                    )
                },
                subtitle = providerTr(
                    languageCode,
                    "Complete your information to attract more clients.",
                    "Completeaza informatiile pentru a atrage mai multi clienti.",
                ),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    ProviderAvatar(
                        avatarUrl = viewModel.profile.avatar,
                        initials = listOf(viewModel.profile.firstName, viewModel.profile.lastName)
                            .joinToString(" ")
                            .trim()
                            .ifEmpty { user.displayName }
                            .split(" ")
                            .take(2)
                            .mapNotNull { it.firstOrNull()?.toString() }
                            .joinToString("")
                            .uppercase(),
                        size = 76.dp,
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    Button(
                        onClick = { imagePickerLauncher.launch("image/*") },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TrustoraMutedSurface,
                            contentColor = TrustoraPrimary,
                        ),
                        enabled = !viewModel.isUploadingAvatar && !viewModel.isSaving && !viewModel.isLoading,
                    ) {
                        if (viewModel.isUploadingAvatar) {
                            CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.PhotoCamera, contentDescription = null)
                        }
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (viewModel.isUploadingAvatar) {
                                providerTr(languageCode, "Uploading...", "Se incarca...")
                            } else {
                                providerTr(languageCode, "Change Photo", "Schimba Poza")
                            },
                        )
                    }
                }

                Text(
                    text = providerTr(
                        languageCode,
                        "Use a clear professional photo.",
                        "Foloseste o poza clara si profesionala.",
                    ),
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraTertiaryText,
                )

                if (!viewModel.errorMessage.isNullOrBlank()) {
                    ProviderStatusBanner(
                        icon = Icons.Default.Error,
                        text = viewModel.errorMessage.orEmpty(),
                        background = Color(0xFFFEE2E2),
                        foreground = Color(0xFF7F1D1D),
                        border = Color(0xFFFCA5A5),
                    )
                }
                if (!viewModel.successMessage.isNullOrBlank()) {
                    ProviderStatusBanner(
                        icon = Icons.Default.CheckCircle,
                        text = viewModel.successMessage.orEmpty(),
                        background = Color(0xFFDCFCE7),
                        foreground = Color(0xFF14532D),
                        border = Color(0xFF86EFAC),
                    )
                }
            }

            EditProfileTabs(
                languageCode = languageCode,
                activeTab = viewModel.activeTab,
                onTabSelected = { viewModel.activeTab = it },
            )

            when (viewModel.activeTab) {
                ProviderProfileTab.BASIC -> {
                    BasicProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                        isRomanian = isRomanian,
                    )
                }

                ProviderProfileTab.AVAILABILITY -> {
                    AvailabilityProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                    )
                }

                ProviderProfileTab.LANGUAGES -> {
                    LanguagesProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                    )
                }

                ProviderProfileTab.EXPERIENCE -> {
                    ExperienceProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                    )
                }

                ProviderProfileTab.EDUCATION -> {
                    EducationProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                    )
                }

                ProviderProfileTab.PORTFOLIO -> {
                    PortfolioProfileSection(
                        viewModel = viewModel,
                        languageCode = languageCode,
                    )
                }
            }

            Button(
                onClick = {
                    viewModel.save(
                        token = token,
                        language = languageCode,
                    ) { success ->
                        if (success) onRefreshProfile()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !viewModel.isSaving && !viewModel.isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                if (viewModel.isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(15.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Save, contentDescription = null)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(providerTr(languageCode, "Save", "Salveaza"))
            }

            Spacer(modifier = Modifier.height(26.dp))
        }
    }
}

@Composable
private fun BasicProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
    isRomanian: Boolean,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Basic Information", "Informatii de Baza"),
        subtitle = providerTr(
            languageCode,
            "Update the same identity and billing fields used by the web dashboard.",
            "Actualizeaza aceleasi campuri de identitate si facturare folosite in dashboard-ul web.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "First Name", "Prenume"),
                value = viewModel.profile.firstName,
                onValueChange = { value -> viewModel.updateProfile { it.firstName = value } },
                isError = viewModel.validationErrors.contains(ProviderProfileValidationField.FIRST_NAME),
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Last Name", "Nume"),
                value = viewModel.profile.lastName,
                onValueChange = { value -> viewModel.updateProfile { it.lastName = value } },
                isError = viewModel.validationErrors.contains(ProviderProfileValidationField.LAST_NAME),
            )
        }

        if (viewModel.nameHasChanged) {
            ProviderStatusBanner(
                icon = Icons.Default.Error,
                text = providerTr(
                    languageCode,
                    "Changing your name can regenerate the public provider profile URL.",
                    "Schimbarea numelui poate regenera URL-ul public al profilului provider.",
                ),
                background = Color(0xFFFEF3C7),
                foreground = Color(0xFF92400E),
                border = Color(0xFFFCD34D),
            )
        }

        ProviderTwoColumns {
            ProviderTextInput(
                label = "Email",
                value = viewModel.profile.email,
                onValueChange = { value -> viewModel.updateProfile { it.email = value } },
                keyboardType = KeyboardType.Email,
                isError = viewModel.validationErrors.contains(ProviderProfileValidationField.EMAIL),
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Phone", "Telefon"),
                value = viewModel.profile.phone,
                onValueChange = { value -> viewModel.updateProfile { it.phone = value } },
                keyboardType = KeyboardType.Phone,
                isError = viewModel.validationErrors.contains(ProviderProfileValidationField.PHONE),
            )
        }

        ProviderTextInput(
            label = providerTr(languageCode, "Professional Bio", "Descriere Profesionala"),
            value = viewModel.profile.bio,
            onValueChange = { value -> viewModel.updateProfile { it.bio = value.take(500) } },
            singleLine = false,
            minLines = 5,
            isError = viewModel.validationErrors.contains(ProviderProfileValidationField.BIO),
        )
        Text(
            text = "${viewModel.profile.bio.length}/500",
            style = MaterialTheme.typography.bodySmall,
            color = TrustoraTertiaryText,
            modifier = Modifier.fillMaxWidth(),
        )

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Website", "Website"),
                value = viewModel.profile.website,
                onValueChange = { value -> viewModel.updateProfile { it.website = value } },
                keyboardType = KeyboardType.Uri,
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Location", "Locatie"),
                value = viewModel.profile.location,
                onValueChange = { value -> viewModel.updateProfile { it.location = value } },
            )
        }
    }

    ProviderSectionCard(
        title = providerTr(languageCode, "Billing Details", "Detalii de Facturare"),
        subtitle = providerTr(
            languageCode,
            "These fields update the legacy billing data from the provider profile.",
            "Aceste campuri actualizeaza datele legacy de facturare din profilul provider.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Billing Company Name", "Nume Companie Facturare"),
                value = viewModel.profile.companyName,
                onValueChange = { value -> viewModel.updateProfile { it.companyName = value } },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Tax ID", "Cod Fiscal"),
                value = viewModel.profile.taxID,
                onValueChange = { value -> viewModel.updateProfile { it.taxID = value } },
            )
        }

        ProviderTextInput(
            label = providerTr(languageCode, "Trade Registry Number", "Nr. Registrul Comertului"),
            value = viewModel.profile.tradeRegistryNumber,
            onValueChange = { value -> viewModel.updateProfile { it.tradeRegistryNumber = value } },
        )

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Billing Address", "Adresa Facturare"),
                value = viewModel.profile.billingAddress,
                onValueChange = { value -> viewModel.updateProfile { it.billingAddress = value } },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Billing City", "Oras Facturare"),
                value = viewModel.profile.billingCity,
                onValueChange = { value -> viewModel.updateProfile { it.billingCity = value } },
            )
        }

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Billing State", "Judet / Stat Facturare"),
                value = viewModel.profile.billingState,
                onValueChange = { value -> viewModel.updateProfile { it.billingState = value } },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Billing Postal Code", "Cod Postal Facturare"),
                value = viewModel.profile.billingPostalCode,
                onValueChange = { value -> viewModel.updateProfile { it.billingPostalCode = value } },
            )
        }
    }

    ProviderSectionCard(
        title = providerTr(languageCode, "Trust Metadata", "Metadate de Incredere"),
        subtitle = providerTr(
            languageCode,
            "System-generated values, displayed read-only.",
            "Valori generate de sistem, afisate doar in regim read-only.",
        ),
    ) {
        ProviderTrustGrid(
            languageCode = languageCode,
            viewModel = viewModel,
            isRomanian = isRomanian,
        )
    }
}

@Composable
private fun ProviderTrustGrid(
    languageCode: String,
    viewModel: ProviderProfileViewModel,
    isRomanian: Boolean,
) {
    val metrics = viewModel.profile.trustMetrics

    ProviderTwoColumns {
        ProviderTrustMetric(providerTr(languageCode, "Rating", "Rating"), metrics.rating)
        ProviderTrustMetric(providerTr(languageCode, "Reviews", "Review-uri"), metrics.reviewCount)
    }
    ProviderTwoColumns {
        ProviderTrustMetric(providerTr(languageCode, "Job Success Score", "Job Success Score"), metrics.jobSuccessScore)
        ProviderTrustMetric(providerTr(languageCode, "Projects Completed", "Proiecte Finalizate"), metrics.totalProjectsCompleted)
    }
    ProviderTwoColumns {
        ProviderTrustMetric(providerTr(languageCode, "Response Rate", "Rata de Raspuns"), metrics.responseRate)
        ProviderTrustMetric(
            providerTr(languageCode, "Avg. Response Time", "Timp Mediu de Raspuns"),
            metrics.averageResponseTimeMinutes,
        )
    }
    ProviderTwoColumns {
        ProviderTrustMetric(providerTr(languageCode, "KYC", "KYC"), metrics.kycStatus)
        ProviderTrustMetric(
            providerTr(languageCode, "Test Verified", "Verificare Test"),
            if (metrics.testVerified) {
                providerTr(languageCode, "Yes", "Da")
            } else {
                providerTr(languageCode, "No", "Nu")
            },
        )
    }
    ProviderTwoColumns {
        ProviderTrustMetric(
            providerTr(languageCode, "Call Verified", "Verificare Apel"),
            if (metrics.callVerified) {
                providerTr(languageCode, "Yes", "Da")
            } else {
                providerTr(languageCode, "No", "Nu")
            },
        )
        ProviderTrustMetric(
            providerTr(languageCode, "Total Earned", "Total Castigat"),
            metrics.totalEarned?.ifEmpty { "-" } ?: "-",
        )
    }

    if (metrics.badges.isNotEmpty()) {
        Text(
            text = providerTr(languageCode, "Badges", "Badge-uri"),
            style = MaterialTheme.typography.labelMedium,
            color = TrustoraSecondaryText,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            metrics.badges.forEach { badge ->
                Text(
                    text = badge,
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraPrimary,
                    modifier = Modifier
                        .background(TrustoraMutedSurface, RoundedCornerShape(100.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(100.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
    }
}

@Composable
private fun AvailabilityProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Status and Availability", "Status si Disponibilitate"),
        subtitle = providerTr(
            languageCode,
            "Keep the same availability payload used by the Next.js dashboard.",
            "Pastreaza acelasi payload de disponibilitate folosit in dashboard-ul Next.js.",
        ),
    ) {
        ProviderDropdownInput(
            label = providerTr(languageCode, "Current Status", "Status Curent"),
            value = providerAvailabilityLabel(languageCode, viewModel.profile.availability.status),
            options = viewModel.availabilityStatusOptions.map { option ->
                option to providerAvailabilityLabel(languageCode, option)
            },
            isError = viewModel.validationErrors.contains(ProviderProfileValidationField.AVAILABILITY_STATUS),
            onSelect = { selected ->
                viewModel.updateProfile {
                    it.availability = it.availability.copy(status = selected)
                }
            },
        )

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Hours per Week", "Ore pe Saptamana"),
                value = viewModel.profile.availability.hoursPerWeek,
                onValueChange = { value ->
                    viewModel.updateProfile {
                        it.availability = it.availability.copy(hoursPerWeek = value)
                    }
                },
                keyboardType = KeyboardType.Number,
                isError = viewModel.validationErrors.contains(ProviderProfileValidationField.HOURS_PER_WEEK),
            )
            ProviderDropdownInput(
                label = providerTr(languageCode, "Response Time", "Timp de Raspuns"),
                value = providerResponseTimeLabel(languageCode, viewModel.profile.availability.responseTime),
                options = viewModel.responseTimeOptions.map { option ->
                    option to providerResponseTimeLabel(languageCode, option)
                },
                onSelect = { selected ->
                    viewModel.updateProfile {
                        it.availability = it.availability.copy(responseTime = selected)
                    }
                },
            )
        }

        ProviderDropdownInput(
            label = providerTr(languageCode, "Timezone", "Fus Orar"),
            value = viewModel.profile.availability.timezone,
            options = viewModel.timezoneOptions.map { it to it },
            onSelect = { selected ->
                viewModel.updateProfile {
                    it.availability = it.availability.copy(timezone = selected)
                }
            },
        )
    }

    ProviderSectionCard(
        title = providerTr(languageCode, "Working Schedule", "Program de Lucru"),
        subtitle = providerTr(
            languageCode,
            "Set the hours when you are usually available.",
            "Seteaza orele in care esti de obicei disponibil.",
        ),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            ProviderProfileWeekDay.entries.forEach { day ->
                val hour = viewModel.profile.availability.workingHours[day]
                    ?: com.trustora.app.core.models.ProviderProfileWorkingHour.defaults(day)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
                        .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = providerDayLabel(languageCode, day),
                            style = MaterialTheme.typography.bodyLarge,
                            color = TrustoraPrimary,
                            modifier = Modifier.weight(1f),
                        )
                        Switch(
                            checked = hour.enabled,
                            onCheckedChange = { enabled ->
                                viewModel.updateWorkingHours(day = day, enabled = enabled)
                            },
                        )
                    }

                    if (hour.enabled) {
                        ProviderTwoColumns {
                            ProviderTextInput(
                                label = providerTr(languageCode, "Start", "De la"),
                                value = hour.start,
                                onValueChange = { viewModel.updateWorkingHours(day = day, start = it) },
                                placeholder = "09:00",
                            )
                            ProviderTextInput(
                                label = providerTr(languageCode, "End", "Pana la"),
                                value = hour.end,
                                onValueChange = { viewModel.updateWorkingHours(day = day, end = it) },
                                placeholder = "18:00",
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LanguagesProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Languages", "Limbi"),
        subtitle = providerTr(
            languageCode,
            "Matches the language list and proficiency structure from the web app.",
            "Pastreaza aceeasi lista de limbi si niveluri ca in aplicatia web.",
        ),
    ) {
        if (viewModel.availableLanguages.isEmpty()) {
            ProviderTextInput(
                label = providerTr(languageCode, "Language", "Limba"),
                value = viewModel.newLanguageName,
                onValueChange = { viewModel.newLanguageName = it },
            )
        } else {
            ProviderDropdownInput(
                label = providerTr(languageCode, "Language", "Limba"),
                value = viewModel.newLanguageName.ifBlank {
                    providerTr(languageCode, "Select a language", "Selecteaza o limba")
                },
                options = viewModel.availableLanguages.map { it.name to it.name },
                onSelect = { selected ->
                    viewModel.newLanguageName = selected
                },
            )
        }

        ProviderDropdownInput(
            label = providerTr(languageCode, "Level", "Nivel"),
            value = viewModel.newLanguageLevel,
            options = viewModel.languageLevels.map { it to it },
            onSelect = { selected -> viewModel.newLanguageLevel = selected },
        )

        ProviderAddButton(
            text = providerTr(languageCode, "Add Language", "Adauga Limba"),
            onClick = viewModel::addLanguage,
        )

        if (viewModel.profile.languages.isEmpty()) {
            ProviderEmptyState(text = providerTr(languageCode, "No languages added.", "Nu exista limbi adaugate."))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.profile.languages.forEach { language ->
                    ProviderRemovableRow(
                        title = language.name,
                        subtitle = language.level,
                        leading = language.flag,
                        onRemove = { viewModel.removeLanguage(language.id) },
                    )
                }
            }
        }
    }

    ProviderSectionCard(
        title = providerTr(languageCode, "Certifications", "Certificari"),
        subtitle = providerTr(
            languageCode,
            "Keep the same certification fields used in the provider profile.",
            "Pastreaza aceleasi campuri de certificari din profilul provider.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Certification Name", "Nume Certificare"),
                value = viewModel.newCertificationName,
                onValueChange = { viewModel.newCertificationName = it },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Issuer", "Emitent"),
                value = viewModel.newCertificationIssuer,
                onValueChange = { viewModel.newCertificationIssuer = it },
            )
        }
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Issue Date", "Data Emiterii"),
                value = viewModel.newCertificationDate,
                onValueChange = { viewModel.newCertificationDate = it },
                placeholder = "YYYY-MM-DD",
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Credential ID", "ID Credential"),
                value = viewModel.newCertificationCredentialID,
                onValueChange = { viewModel.newCertificationCredentialID = it },
            )
        }

        ProviderAddButton(
            text = providerTr(languageCode, "Add Certification", "Adauga Certificare"),
            onClick = viewModel::addCertification,
        )

        if (viewModel.profile.certifications.isEmpty()) {
            ProviderEmptyState(
                text = providerTr(languageCode, "No certifications added.", "Nu exista certificari adaugate."),
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.profile.certifications.forEach { item ->
                    ProviderRemovableRow(
                        title = item.name,
                        subtitle = listOf(item.issuer, item.date).filter { it.trim().isNotEmpty() }.joinToString(" - "),
                        onRemove = { viewModel.removeCertification(item.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun ExperienceProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Professional Experience", "Experienta Profesionala"),
        subtitle = providerTr(
            languageCode,
            "This maps to the workHistory payload used by the web provider profile.",
            "Acest formular mapeaza payload-ul workHistory folosit de profilul provider din web.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Professional Title", "Titlu Profesional"),
                value = viewModel.newWorkTitle,
                onValueChange = { viewModel.newWorkTitle = it },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Position", "Pozitie"),
                value = viewModel.newWorkPosition,
                onValueChange = { viewModel.newWorkPosition = it },
            )
        }

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Company", "Companie"),
                value = viewModel.newWorkCompany,
                onValueChange = { viewModel.newWorkCompany = it },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "City", "Oras"),
                value = viewModel.newWorkCity,
                onValueChange = { viewModel.newWorkCity = it },
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProviderTextInput(
                label = providerTr(languageCode, "Country", "Tara"),
                value = viewModel.newWorkCountry,
                onValueChange = { viewModel.newWorkCountry = it },
                modifier = Modifier.weight(1f),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Switch(
                    checked = viewModel.newWorkCurrentWorking,
                    onCheckedChange = { viewModel.newWorkCurrentWorking = it },
                )
                Text(
                    text = providerTr(languageCode, "Currently working here", "Lucrez aici in prezent"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraSecondaryText,
                )
            }
        }

        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Start Date", "Data Inceput"),
                value = viewModel.newWorkStartDate,
                onValueChange = { viewModel.newWorkStartDate = it },
                placeholder = "YYYY-MM-DD",
            )
            ProviderTextInput(
                label = providerTr(languageCode, "End Date", "Data Sfarsit"),
                value = viewModel.newWorkEndDate,
                onValueChange = { viewModel.newWorkEndDate = it },
                placeholder = "YYYY-MM-DD",
            )
        }

        ProviderTextInput(
            label = providerTr(languageCode, "Description", "Descriere"),
            value = viewModel.newWorkDescription,
            onValueChange = { viewModel.newWorkDescription = it },
            singleLine = false,
            minLines = 4,
        )

        ProviderAddButton(
            text = providerTr(languageCode, "Add Experience", "Adauga Experienta"),
            onClick = viewModel::addWorkHistory,
        )

        if (viewModel.profile.workHistory.isEmpty()) {
            ProviderEmptyState(text = providerTr(languageCode, "No work experience added.", "Nu exista experienta adaugata."))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.profile.workHistory.forEach { item ->
                    ProviderRemovableRow(
                        title = item.position.ifBlank { item.title.ifBlank { item.company } },
                        subtitle = listOf(item.company, item.city, item.country)
                            .filter { it.trim().isNotEmpty() }
                            .joinToString(" - "),
                        onRemove = { viewModel.removeWorkHistory(item.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun EducationProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Education", "Educatie"),
        subtitle = providerTr(
            languageCode,
            "Same education data structure as the Next.js provider profile.",
            "Aceeasi structura de educatie ca in profilul provider din Next.js.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Degree", "Diploma"),
                value = viewModel.newEducationDegree,
                onValueChange = { viewModel.newEducationDegree = it },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Institution", "Institutie"),
                value = viewModel.newEducationInstitution,
                onValueChange = { viewModel.newEducationInstitution = it },
            )
        }
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Attended From", "Urmat Din"),
                value = viewModel.newEducationFrom,
                onValueChange = { viewModel.newEducationFrom = it },
                placeholder = "YYYY-MM-DD",
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Attended To", "Urmat Pana La"),
                value = viewModel.newEducationTo,
                onValueChange = { viewModel.newEducationTo = it },
                placeholder = "YYYY-MM-DD",
            )
        }
        ProviderTextInput(
            label = providerTr(languageCode, "Study Area", "Domeniu de Studiu"),
            value = viewModel.newEducationStudyArea,
            onValueChange = { viewModel.newEducationStudyArea = it },
        )

        ProviderAddButton(
            text = providerTr(languageCode, "Add Education", "Adauga Educatie"),
            onClick = viewModel::addEducation,
        )

        if (viewModel.profile.education.isEmpty()) {
            ProviderEmptyState(text = providerTr(languageCode, "No education entries added.", "Nu exista intrari de educatie."))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.profile.education.forEach { item ->
                    ProviderRemovableRow(
                        title = item.degree,
                        subtitle = listOf(item.institution, item.studyArea)
                            .filter { it.trim().isNotEmpty() }
                            .joinToString(" - "),
                        onRemove = { viewModel.removeEducation(item.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun PortfolioProfileSection(
    viewModel: ProviderProfileViewModel,
    languageCode: String,
) {
    ProviderSectionCard(
        title = providerTr(languageCode, "Portfolio", "Portofoliu"),
        subtitle = providerTr(
            languageCode,
            "Manage the same portfolio payload used by the web provider profile.",
            "Gestioneaza acelasi payload de portofoliu folosit de profilul provider din web.",
        ),
    ) {
        ProviderTwoColumns {
            ProviderTextInput(
                label = providerTr(languageCode, "Project Title", "Titlu Proiect"),
                value = viewModel.newPortfolioTitle,
                onValueChange = { viewModel.newPortfolioTitle = it },
            )
            ProviderTextInput(
                label = providerTr(languageCode, "Role", "Rol"),
                value = viewModel.newPortfolioRole,
                onValueChange = { viewModel.newPortfolioRole = it },
            )
        }

        ProviderTextInput(
            label = providerTr(languageCode, "Project URL", "URL Proiect"),
            value = viewModel.newPortfolioURL,
            onValueChange = { viewModel.newPortfolioURL = it },
            keyboardType = KeyboardType.Uri,
        )
        ProviderTextInput(
            label = providerTr(languageCode, "Image URL", "URL Imagine"),
            value = viewModel.newPortfolioImage,
            onValueChange = { viewModel.newPortfolioImage = it },
            keyboardType = KeyboardType.Uri,
        )
        ProviderTextInput(
            label = providerTr(languageCode, "Technologies", "Tehnologii"),
            value = viewModel.newPortfolioTechnologies,
            onValueChange = { viewModel.newPortfolioTechnologies = it },
            placeholder = "React, Swift, Laravel",
        )
        ProviderTextInput(
            label = providerTr(languageCode, "Project Description", "Descriere Proiect"),
            value = viewModel.newPortfolioDescription,
            onValueChange = { viewModel.newPortfolioDescription = it },
            singleLine = false,
            minLines = 4,
        )

        ProviderAddButton(
            text = providerTr(languageCode, "Add Portfolio Item", "Adauga Element in Portofoliu"),
            onClick = viewModel::addPortfolio,
        )

        if (viewModel.profile.portfolio.isEmpty()) {
            ProviderEmptyState(text = providerTr(languageCode, "No portfolio items added.", "Nu exista elemente in portofoliu."))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                viewModel.profile.portfolio.forEach { item ->
                    ProviderRemovableRow(
                        title = item.title,
                        subtitle = item.role.ifBlank { item.url },
                        onRemove = { viewModel.removePortfolio(item.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun EditProfileTabs(
    languageCode: String,
    activeTab: ProviderProfileTab,
    onTabSelected: (ProviderProfileTab) -> Unit,
) {
    val tabs = listOf(
        ProviderProfileTab.BASIC to providerTr(languageCode, "Basic", "Baza"),
        ProviderProfileTab.AVAILABILITY to providerTr(languageCode, "Availability", "Disponibilitate"),
        ProviderProfileTab.LANGUAGES to providerTr(languageCode, "Languages", "Limbi"),
        ProviderProfileTab.EXPERIENCE to providerTr(languageCode, "Experience", "Experienta"),
        ProviderProfileTab.EDUCATION to providerTr(languageCode, "Education", "Educatie"),
        ProviderProfileTab.PORTFOLIO to providerTr(languageCode, "Portfolio", "Portofoliu"),
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .background(TrustoraMutedSurface, RoundedCornerShape(100.dp))
            .padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        tabs.forEach { (tab, label) ->
            val active = tab == activeTab
            Box(
                modifier = Modifier
                    .background(
                        if (active) TrustoraAccent else Color.White,
                        RoundedCornerShape(100.dp),
                    )
                    .border(
                        1.dp,
                        if (active) TrustoraAccent else TrustoraBorder,
                        RoundedCornerShape(100.dp),
                    )
                    .clickable { onTabSelected(tab) }
                    .padding(horizontal = 14.dp, vertical = 9.dp),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (active) TrustoraAccentButtonText else TrustoraPrimary,
                )
            }
        }
    }
}

@Composable
private fun ProviderUnavailableState(
    languageCode: String,
    title: String,
    message: String,
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.Default.Edit,
                contentDescription = null,
                tint = TrustoraAccent,
                modifier = Modifier.size(34.dp),
            )
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = TrustoraPrimary,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TrustoraSecondaryText,
            )
        }
    }
}

@Composable
private fun ProviderStatusBanner(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    background: Color,
    foreground: Color,
    border: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(background, RoundedCornerShape(12.dp))
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Icon(icon, contentDescription = null, tint = foreground, modifier = Modifier.size(16.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = foreground,
        )
    }
}

@Composable
private fun ProviderAvatar(
    avatarUrl: String?,
    initials: String,
    size: androidx.compose.ui.unit.Dp,
) {
    val resolvedAvatar = remember(avatarUrl) { normalizeProviderAvatarUrl(avatarUrl) }
    Box(
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(22.dp))
            .background(Color(0xFFD1FAE5))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(22.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initials.ifBlank { "T" }.take(2).uppercase(Locale.ROOT),
            style = MaterialTheme.typography.titleLarge,
            color = Color(0xFF065F46),
            fontWeight = FontWeight.Black,
        )
        if (!resolvedAvatar.isNullOrBlank()) {
            AsyncImage(
                model = resolvedAvatar,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(22.dp)),
                contentScale = ContentScale.Crop,
            )
        }
    }
}

@Composable
private fun ProviderTwoColumns(
    content: @Composable () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        content()
    }
}

@Composable
private fun ProviderTextInput(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
    isError: Boolean = false,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (isError) Color(0xFFB91C1C) else TrustoraSecondaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = if (placeholder.isBlank()) null else { { Text(placeholder) } },
            singleLine = singleLine,
            minLines = minLines,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = keyboardType),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = if (isError) Color(0xFFEF4444) else TrustoraBorder,
                focusedBorderColor = if (isError) Color(0xFFEF4444) else TrustoraAccent,
            ),
        )
    }
}

@Composable
private fun ProviderDropdownInput(
    label: String,
    value: String,
    options: List<Pair<String, String>>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
) {
    var expanded by remember { mutableStateOf(false) }
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (isError) Color(0xFFB91C1C) else TrustoraSecondaryText,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Box {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(10.dp))
                    .border(
                        1.dp,
                        if (isError) Color(0xFFEF4444) else TrustoraBorder,
                        RoundedCornerShape(10.dp),
                    )
                    .clickable { expanded = true }
                    .padding(horizontal = 12.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TrustoraPrimary,
                    modifier = Modifier.weight(1f),
                )
                Text(text = "v", color = TrustoraTertiaryText, fontWeight = FontWeight.Bold)
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.fillMaxWidth(0.94f),
            ) {
                options.forEach { (raw, labelValue) ->
                    DropdownMenuItem(
                        text = { Text(labelValue) },
                        onClick = {
                            expanded = false
                            onSelect(raw)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ProviderAddButton(
    text: String,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = TrustoraAccent.copy(alpha = 0.92f),
            contentColor = TrustoraAccentButtonText,
        ),
    ) {
        Icon(Icons.Default.Add, contentDescription = null)
        Spacer(modifier = Modifier.width(8.dp))
        Text(text)
    }
}

@Composable
private fun ProviderRemovableRow(
    title: String,
    subtitle: String,
    leading: String? = null,
    onRemove: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.Top,
    ) {
        if (!leading.isNullOrBlank()) {
            Text(text = leading, modifier = Modifier.padding(end = 8.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TrustoraPrimary,
                fontWeight = FontWeight.SemiBold,
            )
            if (subtitle.trim().isNotEmpty()) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraSecondaryText,
                )
            }
        }
        IconButton(onClick = onRemove) {
            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFB91C1C))
        }
    }
}

@Composable
private fun ProviderEmptyState(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = TrustoraSecondaryText,
        modifier = Modifier
            .fillMaxWidth()
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
    )
}

@Composable
private fun ProviderTrustMetric(
    title: String,
    value: String,
) {
    Column(
        modifier = Modifier
            .background(TrustoraMutedSurface, RoundedCornerShape(12.dp))
            .border(1.dp, TrustoraBorder, RoundedCornerShape(12.dp))
            .padding(11.dp),
    ) {
        Text(text = title, style = MaterialTheme.typography.labelMedium, color = TrustoraSecondaryText)
        Text(
            text = value.ifBlank { "-" },
            style = MaterialTheme.typography.titleMedium,
            color = TrustoraPrimary,
            fontWeight = FontWeight.Bold,
        )
    }
}

private fun providerAvatarFileName(firstName: String, lastName: String): String {
    val fullName = listOf(firstName, lastName)
        .joinToString(" ")
        .trim()
        .lowercase(Locale.ROOT)
    val sanitized = fullName
        .replace(" ", "-")
        .filter { it.isLetterOrDigit() || it == '-' }
    return if (sanitized.isBlank()) {
        "avatar.png"
    } else {
        "avatar_${sanitized}.png"
    }
}

private fun centerCropAvatarToPng(rawData: ByteArray): ByteArray? {
    val source = BitmapFactory.decodeByteArray(rawData, 0, rawData.size) ?: return null
    val side = minOf(source.width, source.height)
    if (side <= 0) return null
    val x = (source.width - side) / 2
    val y = (source.height - side) / 2
    val cropped = Bitmap.createBitmap(source, x, y, side, side)
    val output = Bitmap.createScaledBitmap(cropped, 512, 512, true)
    val stream = ByteArrayOutputStream()
    output.compress(Bitmap.CompressFormat.PNG, 100, stream)
    if (output != cropped) output.recycle()
    if (cropped != source) cropped.recycle()
    source.recycle()
    return stream.toByteArray()
}

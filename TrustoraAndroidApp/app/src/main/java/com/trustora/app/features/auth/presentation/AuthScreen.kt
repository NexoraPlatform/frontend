package com.trustora.app.features.auth.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.trustora.app.ui.app.AuthMode
import com.trustora.app.designsystem.theme.TrustoraAccent
import com.trustora.app.designsystem.theme.TrustoraAccentButtonText
import com.trustora.app.designsystem.theme.TrustoraBackground
import com.trustora.app.designsystem.theme.TrustoraPrimary
import com.trustora.app.designsystem.theme.TrustoraPrimaryText
import com.trustora.app.designsystem.theme.TrustoraSecondaryText
import com.trustora.app.designsystem.theme.TrustoraTertiaryText

private fun tr(languageCode: String, en: String, ro: String): String {
    return if (languageCode.startsWith("ro", ignoreCase = true)) ro else en
}

@Composable
fun AuthScreen(
    mode: AuthMode,
    languageCode: String,
    isLoading: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSignIn: (email: String, password: String) -> Unit,
    onSignUp: (
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        password: String,
        role: String,
        company: String,
        companyName: String,
        taxId: String,
        tradeRegistryNumber: String,
        billingAddress: String,
        billingCity: String,
        billingState: String,
        billingPostalCode: String,
    ) -> Unit,
    onSwitchMode: (AuthMode) -> Unit,
) {
    var signInEmail by rememberSaveable { mutableStateOf("") }
    var signInPassword by rememberSaveable { mutableStateOf("") }
    var signInLocalError by rememberSaveable { mutableStateOf<String?>(null) }

    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var signUpEmail by rememberSaveable { mutableStateOf("") }
    var signUpPhone by rememberSaveable { mutableStateOf("") }
    var signUpRole by rememberSaveable { mutableStateOf("CLIENT") }
    var signUpCompany by rememberSaveable { mutableStateOf("") }
    var signUpCompanyName by rememberSaveable { mutableStateOf("") }
    var signUpTaxId by rememberSaveable { mutableStateOf("") }
    var signUpTradeRegistry by rememberSaveable { mutableStateOf("") }
    var signUpBillingAddress by rememberSaveable { mutableStateOf("") }
    var signUpBillingCity by rememberSaveable { mutableStateOf("") }
    var signUpBillingState by rememberSaveable { mutableStateOf("") }
    var signUpBillingPostalCode by rememberSaveable { mutableStateOf("") }
    var signUpPassword by rememberSaveable { mutableStateOf("") }
    var signUpConfirmPassword by rememberSaveable { mutableStateOf("") }
    var signUpAgreeTerms by rememberSaveable { mutableStateOf(false) }
    var signUpLocalError by rememberSaveable { mutableStateOf<String?>(null) }

    val computedError = when (mode) {
        AuthMode.SIGN_IN -> signInLocalError ?: errorMessage
        AuthMode.SIGN_UP -> signUpLocalError ?: errorMessage
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(TrustoraBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val signInActive = mode == AuthMode.SIGN_IN
            val signUpActive = mode == AuthMode.SIGN_UP

            Button(
                onClick = {
                    signInLocalError = null
                    signUpLocalError = null
                    onSwitchMode(AuthMode.SIGN_IN)
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (signInActive) TrustoraAccent else Color.Transparent,
                    contentColor = if (signInActive) TrustoraAccentButtonText else TrustoraPrimary,
                ),
            ) {
                Text(tr(languageCode, "Sign in", "Conectare"))
            }

            Button(
                onClick = {
                    signInLocalError = null
                    signUpLocalError = null
                    onSwitchMode(AuthMode.SIGN_UP)
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (signUpActive) TrustoraAccent else Color.Transparent,
                    contentColor = if (signUpActive) TrustoraAccentButtonText else TrustoraPrimary,
                ),
            ) {
                Text(tr(languageCode, "Sign up", "Înregistrare"))
            }
        }

        Text(
            text = if (mode == AuthMode.SIGN_IN) {
                tr(languageCode, "Access your Trustora dashboard", "Accesează dashboard-ul Trustora")
            } else {
                tr(languageCode, "Create your Trustora account", "Creează contul tău Trustora")
            },
            style = MaterialTheme.typography.headlineMedium,
            color = TrustoraPrimary,
        )

        if (!computedError.isNullOrBlank()) {
            Text(
                text = computedError,
                color = Color(0xFF7F1D1D),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFEE2E2), RoundedCornerShape(12.dp))
                    .padding(12.dp),
            )
        }

        if (mode == AuthMode.SIGN_IN) {
            OutlinedTextField(
                value = signInEmail,
                onValueChange = { signInEmail = it; signInLocalError = null },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(tr(languageCode, "Email", "Email")) },
                singleLine = true,
            )
            OutlinedTextField(
                value = signInPassword,
                onValueChange = { signInPassword = it; signInLocalError = null },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(tr(languageCode, "Password", "Parolă")) },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
            )

            Button(
                onClick = {
                    val email = signInEmail.trim()
                    if (email.isBlank() || signInPassword.isBlank()) {
                        signInLocalError = tr(
                            languageCode,
                            "Please complete email and password.",
                            "Completează email-ul și parola.",
                        )
                        return@Button
                    }
                    signInLocalError = null
                    onSignIn(email, signInPassword)
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                Text(if (isLoading) tr(languageCode, "Loading...", "Se încarcă...") else tr(languageCode, "Sign in", "Conectează-te"))
            }

            TextButton(onClick = { onSwitchMode(AuthMode.SIGN_UP) }) {
                Text(tr(languageCode, "No account yet? Register", "Nu ai cont? Înregistrează-te"))
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "First name", "Prenume")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Last name", "Nume")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
            }
            OutlinedTextField(
                value = signUpEmail,
                onValueChange = { signUpEmail = it; signUpLocalError = null },
                label = { Text(tr(languageCode, "Email", "Email")) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = signUpPhone,
                    onValueChange = { signUpPhone = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Phone", "Telefon")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tr(languageCode, "Role", "Rol"),
                        style = MaterialTheme.typography.labelSmall,
                        color = TrustoraSecondaryText,
                        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { signUpRole = "CLIENT"; signUpLocalError = null },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (signUpRole == "CLIENT") TrustoraAccent.copy(alpha = 0.12f) else Color.Transparent,
                            ),
                        ) {
                            Text(tr(languageCode, "Client", "Client"))
                        }
                        OutlinedButton(
                            onClick = { signUpRole = "PROVIDER"; signUpLocalError = null },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (signUpRole == "PROVIDER") TrustoraAccent.copy(alpha = 0.12f) else Color.Transparent,
                            ),
                        ) {
                            Text(tr(languageCode, "Provider", "Provider"))
                        }
                    }
                }
            }

            OutlinedTextField(
                value = signUpCompany,
                onValueChange = { signUpCompany = it; signUpLocalError = null },
                label = { Text(tr(languageCode, "Company (display)", "Companie (display)")) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            Text(
                text = tr(languageCode, "Billing details", "Detalii facturare"),
                style = MaterialTheme.typography.titleSmall,
                color = TrustoraPrimaryText,
            )
            Text(
                text = tr(
                    languageCode,
                    "Tax ID and billing address are required when company legal name is provided.",
                    "CUI-ul și adresa de facturare sunt obligatorii când completezi numele legal al companiei.",
                ),
                style = MaterialTheme.typography.bodySmall,
                color = TrustoraTertiaryText,
            )

            OutlinedTextField(
                value = signUpCompanyName,
                onValueChange = { signUpCompanyName = it; signUpLocalError = null },
                label = { Text(tr(languageCode, "Company legal name", "Nume legal companie")) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = signUpTaxId,
                    onValueChange = { signUpTaxId = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Tax ID", "CUI")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = signUpTradeRegistry,
                    onValueChange = { signUpTradeRegistry = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Trade registry", "Reg. comerțului")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
            }
            OutlinedTextField(
                value = signUpBillingAddress,
                onValueChange = { signUpBillingAddress = it; signUpLocalError = null },
                label = { Text(tr(languageCode, "Billing address", "Adresă facturare")) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = signUpBillingCity,
                    onValueChange = { signUpBillingCity = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Billing city", "Oraș facturare")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = signUpBillingState,
                    onValueChange = { signUpBillingState = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Billing state", "Județ facturare")) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
            }
            OutlinedTextField(
                value = signUpBillingPostalCode,
                onValueChange = { signUpBillingPostalCode = it; signUpLocalError = null },
                label = { Text(tr(languageCode, "Billing postal code", "Cod poștal facturare")) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = signUpPassword,
                    onValueChange = { signUpPassword = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Password", "Parolă")) },
                    modifier = Modifier.weight(1f),
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = signUpConfirmPassword,
                    onValueChange = { signUpConfirmPassword = it; signUpLocalError = null },
                    label = { Text(tr(languageCode, "Confirm password", "Confirmă parola")) },
                    modifier = Modifier.weight(1f),
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = signUpAgreeTerms,
                    onCheckedChange = {
                        signUpAgreeTerms = it
                        signUpLocalError = null
                    },
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = tr(
                        languageCode,
                        "I agree with Terms and Privacy Policy",
                        "Sunt de acord cu Termenii și Politica de confidențialitate",
                    ),
                    style = MaterialTheme.typography.bodySmall,
                    color = TrustoraSecondaryText,
                )
            }

            Button(
                onClick = {
                    if (firstName.trim().isEmpty() || lastName.trim().isEmpty() || signUpEmail.trim().isEmpty() || signUpPassword.isBlank()) {
                        signUpLocalError = tr(
                            languageCode,
                            "Please complete first name, last name, email and password.",
                            "Completează prenume, nume, email și parolă.",
                        )
                        return@Button
                    }

                    if (signUpPassword != signUpConfirmPassword) {
                        signUpLocalError = tr(
                            languageCode,
                            "Passwords do not match.",
                            "Parolele nu coincid.",
                        )
                        return@Button
                    }

                    if (!signUpAgreeTerms) {
                        signUpLocalError = tr(
                            languageCode,
                            "Please accept terms and privacy policy.",
                            "Te rugăm să accepți termenii și politica de confidențialitate.",
                        )
                        return@Button
                    }

                    if (signUpCompanyName.trim().isNotEmpty() &&
                        (signUpTaxId.trim().isEmpty() || signUpBillingAddress.trim().isEmpty())
                    ) {
                        signUpLocalError = tr(
                            languageCode,
                            "Tax ID and billing address are required when company legal name is provided.",
                            "CUI-ul și adresa de facturare sunt obligatorii când completezi numele legal al companiei.",
                        )
                        return@Button
                    }

                    signUpLocalError = null

                    onSignUp(
                        firstName.trim(),
                        lastName.trim(),
                        signUpEmail.trim(),
                        signUpPhone.trim(),
                        signUpPassword,
                        signUpRole,
                        signUpCompany.trim(),
                        signUpCompanyName.trim(),
                        signUpTaxId.trim(),
                        signUpTradeRegistry.trim(),
                        signUpBillingAddress.trim(),
                        signUpBillingCity.trim(),
                        signUpBillingState.trim(),
                        signUpBillingPostalCode.trim(),
                    )
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TrustoraAccent,
                    contentColor = TrustoraAccentButtonText,
                ),
            ) {
                Text(
                    if (isLoading) tr(languageCode, "Loading...", "Se încarcă...")
                    else tr(languageCode, "Create account", "Creează cont"),
                )
            }

            TextButton(onClick = { onSwitchMode(AuthMode.SIGN_IN) }) {
                Text(tr(languageCode, "Already have an account? Sign in", "Ai deja cont? Conectează-te"))
            }
        }

        OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
            Text(tr(languageCode, "Close", "Închide"))
        }
    }
}

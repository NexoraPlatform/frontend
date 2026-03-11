package com.trustora.app.core.utils

import com.trustora.app.core.models.AppCurrency
import java.text.NumberFormat
import java.util.Locale

private val fallbackRates = mapOf(
    AppCurrency.USD to 1.0,
    AppCurrency.EUR to 0.92,
    AppCurrency.RON to 4.58,
)

fun formatMoneyFromUsd(
    amountUsd: Double,
    currency: AppCurrency,
    languageCode: String,
    maximumFractionDigits: Int = 0,
): String {
    val converted = amountUsd * (fallbackRates[currency] ?: 1.0)
    return formatMoney(
        amount = converted,
        currency = currency,
        locale = if (languageCode == "ro") localeOf("ro", "RO") else localeForCurrency(currency),
        maximumFractionDigits = maximumFractionDigits,
    )
}

fun formatMoney(
    amount: Double,
    currency: AppCurrency,
    locale: Locale,
    maximumFractionDigits: Int = 0,
): String {
    val formatter = NumberFormat.getCurrencyInstance(locale)
    formatter.currency = java.util.Currency.getInstance(currency.raw)
    formatter.maximumFractionDigits = maximumFractionDigits
    formatter.minimumFractionDigits = 0
    return formatter.format(amount)
}

private fun localeForCurrency(currency: AppCurrency): Locale = when (currency) {
    AppCurrency.USD -> localeOf("en", "US")
    AppCurrency.EUR -> localeOf("en", "IE")
    AppCurrency.RON -> localeOf("ro", "RO")
}

private fun localeOf(language: String, region: String): Locale = Locale.Builder()
    .setLanguage(language)
    .setRegion(region)
    .build()

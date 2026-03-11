package com.trustora.app.core.network

import com.google.gson.annotations.SerializedName

data class LoginPayload(
    val email: String,
    val password: String,
    @SerializedName("device_name") val deviceName: String = "android-app",
)

data class RegisterPayload(
    @SerializedName("firstName") val firstName: String,
    @SerializedName("lastName") val lastName: String,
    val email: String,
    val phone: String?,
    val password: String,
    val role: String,
    val company: String?,
    @SerializedName("company_name") val companyName: String?,
    @SerializedName("tax_id") val taxId: String?,
    @SerializedName("trade_registry_number") val tradeRegistryNumber: String?,
    @SerializedName("billing_address") val billingAddress: String?,
    @SerializedName("billing_city") val billingCity: String?,
    @SerializedName("billing_state") val billingState: String?,
    @SerializedName("billing_postal_code") val billingPostalCode: String?,
)

data class RapydPayoutPayload(
    val amount: Double,
    val currency: String?,
)

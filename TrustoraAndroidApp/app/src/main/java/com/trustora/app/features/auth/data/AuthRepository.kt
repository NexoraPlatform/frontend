package com.trustora.app.features.auth.data

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.trustora.app.core.models.AuthCompany
import com.trustora.app.core.models.AuthConnectedAccount
import com.trustora.app.core.models.AuthSession
import com.trustora.app.core.models.AuthUser
import com.trustora.app.core.network.LoginPayload
import com.trustora.app.core.network.RegisterPayload
import com.trustora.app.core.network.TrustoraApi
import com.trustora.app.core.datastore.SessionState
import com.trustora.app.core.datastore.SessionStore
import com.trustora.app.core.utils.arrayOrNull
import com.trustora.app.core.utils.booleanOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.flow.StateFlow
import java.util.UUID

class AuthRepository(
    private val api: TrustoraApi,
    private val sessionStore: SessionStore,
) {
    val session: StateFlow<SessionState> = sessionStore.state

    suspend fun bootstrap() {
        val token = sessionStore.state.value.accessToken ?: return
        runCatching {
            val response = api.me("Bearer $token")
            val parsedSession = parseSession(response, fallbackToken = token)
            sessionStore.setSession(parsedSession.accessToken, parsedSession.user)
        }.onFailure {
            sessionStore.clear()
        }
    }

    suspend fun signIn(email: String, password: String): AuthSession {
        val response = api.login(LoginPayload(email = email, password = password))
        val parsedSession = parseSession(response)
        sessionStore.setSession(parsedSession.accessToken, parsedSession.user)
        refreshProfile()
        return parsedSession
    }

    suspend fun signUp(payload: RegisterPayload): AuthSession {
        api.register(payload)
        return signIn(email = payload.email, password = payload.password)
    }

    suspend fun refreshProfile(): AuthUser {
        val token = sessionStore.state.value.accessToken
            ?: throw IllegalStateException("Missing access token")

        val response = api.me("Bearer $token")
        val parsedSession = parseSession(response, fallbackToken = token)
        sessionStore.setSession(parsedSession.accessToken, parsedSession.user)
        return parsedSession.user
    }

    suspend fun signOut() {
        val token = sessionStore.state.value.accessToken
        if (!token.isNullOrBlank()) {
            runCatching { api.logout("Bearer $token") }
        }
        sessionStore.clear()
    }

    private fun parseSession(payload: JsonElement, fallbackToken: String? = null): AuthSession {
        val root = payload.asJsonObjectOrNull() ?: throw IllegalStateException("Invalid auth response")
        val dataObject = root.objectOrNull("data")
        val token = root.stringOrNull("token", "access_token")
            ?: dataObject?.stringOrNull("token", "access_token")
            ?: fallbackToken
        require(!token.isNullOrBlank()) { "Authentication token is missing." }

        val userObject = root.objectOrNull("user")
            ?: dataObject?.objectOrNull("user")
            ?: dataObject
            ?: root
        val user = parseUser(userObject)

        return AuthSession(accessToken = token, user = user)
    }

    private fun parseUser(root: JsonObject): AuthUser {
        val fullNameParts = (root.stringOrNull("name") ?: "")
            .split(" ")
            .filter { it.isNotBlank() }

        val inferredFirstName = fullNameParts.firstOrNull().orEmpty()
        val inferredLastName = fullNameParts.drop(1).joinToString(" ")

        val roles = parseRoleSlugs(root)
        val permissions = parsePermissions(root)
        val parsedCompany = parseCompany(root.objectOrNull("company"))
        val connectedAccounts = parseConnectedAccounts(root)
        val companyName = root.stringOrNull("company_name")
            ?: root.stringOrNull("company")
            ?: parsedCompany?.name

        return AuthUser(
            id = root.stringOrNull("id", "user_id") ?: UUID.randomUUID().toString(),
            email = root.stringOrNull("email").orEmpty(),
            firstName = root.stringOrNull("firstName", "first_name") ?: inferredFirstName,
            lastName = root.stringOrNull("lastName", "last_name") ?: inferredLastName,
            role = root.stringOrNull("role", "role_slug"),
            roles = roles,
            permissions = permissions,
            isSuperuser = root.booleanOrNull("is_superuser") ?: false,
            phone = root.stringOrNull("phone"),
            avatar = root.stringOrNull("avatar", "profile_photo_url", "avatar_url", "profile_photo"),
            companyName = companyName,
            company = parsedCompany,
            githubToken = root.stringOrNull("github_token"),
            connectedAccounts = connectedAccounts,
            rapydWalletId = root.stringOrNull("rapyd_wallet_id", "wallet_id"),
            rapydContactId = root.stringOrNull("rapyd_contact_id", "contact_id"),
        )
    }

    private fun parseRoleSlugs(root: JsonObject): List<String> {
        val roleSet = linkedSetOf<String>()

        root.stringOrNull("role")?.lowercase()?.let(roleSet::add)
        root.stringOrNull("role_slug")?.lowercase()?.let(roleSet::add)

        root.arrayOrNull("role_slugs")
            ?.forEach { item -> item.asStringOrNull()?.lowercase()?.let(roleSet::add) }

        val rolesArray = root.arrayOrNull("roles")
        if (rolesArray != null) {
            for (entry in rolesArray) {
                when {
                    entry.isJsonPrimitive -> {
                        entry.asStringOrNull()?.lowercase()?.let(roleSet::add)
                    }

                    entry.isJsonObject -> {
                        val roleObject = entry.asJsonObject
                        roleObject.stringOrNull("slug", "name")?.lowercase()?.let(roleSet::add)
                    }
                }
            }
        }

        return roleSet.toList()
    }

    private fun parsePermissions(root: JsonObject): List<String> {
        val permissionSet = linkedSetOf<String>()

        root.arrayOrNull("permissions")
            ?.forEach { item ->
                when {
                    item.isJsonPrimitive -> item.asStringOrNull()?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }?.let(permissionSet::add)
                    item.isJsonObject -> item.asJsonObject.stringOrNull("slug", "name", "permission")
                        ?.trim()
                        ?.lowercase()
                        ?.takeIf { it.isNotEmpty() }
                        ?.let(permissionSet::add)
                }
            }

        root.arrayOrNull("permission_slugs")
            ?.forEach { item -> item.asStringOrNull()?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }?.let(permissionSet::add) }

        return permissionSet.toList()
    }

    private fun parseConnectedAccounts(root: JsonObject): List<AuthConnectedAccount> {
        return root.arrayOrNull("connected_accounts")
            ?.mapNotNull { item ->
                val account = if (item.isJsonObject) item.asJsonObject else null
                if (account == null) return@mapNotNull null
                val provider = account.stringOrNull("provider")?.trim().orEmpty()
                if (provider.isEmpty()) return@mapNotNull null
                AuthConnectedAccount(
                    id = account.stringOrNull("id") ?: UUID.randomUUID().toString(),
                    provider = provider.lowercase(),
                    providerId = account.stringOrNull("provider_id"),
                    expiresAt = account.stringOrNull("expires_at"),
                )
            }
            .orEmpty()
    }

    private fun parseCompany(companyObject: JsonObject?): AuthCompany? {
        val root = companyObject ?: return null

        val name = root.stringOrNull("name")
        val id = root.stringOrNull("id")
        if (name.isNullOrBlank() && id.isNullOrBlank()) {
            return null
        }

        return AuthCompany(
            id = id,
            name = name,
            idType = root.stringOrNull("id_type"),
            idNumber = root.stringOrNull("id_number"),
            companyCountry = root.stringOrNull("company_country"),
            companyCounty = root.stringOrNull("company_county"),
            companyCity = root.stringOrNull("company_city"),
            companyZip = root.stringOrNull("company_zip"),
            companyAddress = root.stringOrNull("company_address"),
            companyBankIban = root.stringOrNull("company_bank_iban"),
            companyBankBic = root.stringOrNull("company_bank_bic"),
            companyBankName = root.stringOrNull("company_bank_name"),
            bankCurrency = root.stringOrNull("bank_currency"),
        )
    }

    private fun JsonElement.asJsonObjectOrNull(): JsonObject? {
        if (isJsonObject) return asJsonObject
        return null
    }

    private fun JsonArray.forEach(action: (JsonElement) -> Unit) {
        for (index in 0 until size()) {
            action(this[index])
        }
    }
}

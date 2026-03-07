package com.trustora.app.core.utils

import android.content.Context
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.trustora.app.core.models.DashboardLocationCity
import com.trustora.app.core.models.DashboardLocationCountry
import com.trustora.app.core.models.DashboardLocationState
import java.util.Locale

object TrustoraCompanyIdentificationTypes {
    // Mirrors the iOS/Next mapping used in company settings.
    val byCountryIso: Map<String, String> = mapOf(
        "RO" to "CUI", "GB" to "CRN", "DE" to "USt-IdNr", "FR" to "SIRET", "IT" to "P.IVA",
        "ES" to "NIF", "NL" to "RSIN", "PL" to "NIP", "BG" to "UIC", "HU" to "Adószám",
        "AT" to "UID", "BE" to "BCE / KBO", "DK" to "CVR", "SE" to "Org.nr", "NO" to "Org.nr",
        "FI" to "Y-tunnus", "PT" to "NIPC", "GR" to "AFM", "IE" to "CRO / VAT", "CZ" to "IČO",
        "SK" to "IČO", "SI" to "MŠ", "HR" to "OIB", "EE" to "Registrikood", "LV" to "Reģ. Nr.",
        "LT" to "Įm. k.", "CY" to "TIC", "MT" to "VAT / C", "LU" to "RCS", "CH" to "UID / CHE",
        "IS" to "Kennitala", "RS" to "PIB", "TR" to "VKN", "UA" to "EDRPOU", "US" to "EIN",
        "CA" to "BN", "MX" to "RFC", "BR" to "CNPJ", "AR" to "CUIT", "CL" to "RUT", "CO" to "NIT",
        "PE" to "RUC", "CN" to "USCI", "JP" to "CN", "IN" to "GSTIN / PAN", "KR" to "BRN",
        "SG" to "UEN", "AU" to "ABN", "NZ" to "NZBN", "HK" to "BRN", "TW" to "BAN", "ID" to "NPWP",
        "MY" to "SSM", "TH" to "TIN", "VN" to "MST", "AE" to "TRN", "SA" to "VAT / CR",
        "IL" to "H.P.", "ZA" to "CIPC", "EG" to "TRN", "NG" to "RC", "MA" to "ICE",
    )
}

class TrustoraLocationCatalog(context: Context) {
    private val appContext = context.applicationContext

    @Volatile
    private var loaded = false
    private var countries: List<DashboardLocationCountry> = emptyList()
    private var states: List<DashboardLocationState> = emptyList()
    private var cities: List<DashboardLocationCity> = emptyList()

    @Synchronized
    private fun ensureLoaded() {
        if (loaded) return

        countries = loadCountries()
        states = loadStates()
        cities = loadCities()
        loaded = true
    }

    fun allCountries(): List<DashboardLocationCountry> {
        ensureLoaded()
        return countries
    }

    fun statesOf(countryIso: String): List<DashboardLocationState> {
        ensureLoaded()
        val normalized = countryIso.trim().uppercase(Locale.ROOT)
        if (normalized.isEmpty()) return emptyList()
        return states
            .asSequence()
            .filter { it.countryCode == normalized }
            .sortedBy { it.name.lowercase(Locale.ROOT) }
            .toList()
    }

    fun citiesOf(countryIso: String, stateIso: String): List<DashboardLocationCity> {
        ensureLoaded()
        val normalizedCountry = countryIso.trim().uppercase(Locale.ROOT)
        val normalizedState = stateIso.trim().uppercase(Locale.ROOT)
        if (normalizedCountry.isEmpty() || normalizedState.isEmpty()) return emptyList()

        return cities
            .asSequence()
            .filter { it.countryCode == normalizedCountry && it.stateCode == normalizedState }
            .sortedBy { it.name.lowercase(Locale.ROOT) }
            .toList()
    }

    fun countryMatching(value: String): DashboardLocationCountry? {
        ensureLoaded()
        val normalized = value.trim()
        if (normalized.isEmpty()) return null

        countries.firstOrNull { it.isoCode.equals(normalized, ignoreCase = true) }?.let { return it }
        return countries.firstOrNull { it.name.equals(normalized, ignoreCase = true) }
    }

    fun normalizeStateIso(countryIso: String, stateValue: String?): String {
        val raw = stateValue?.trim().orEmpty()
        if (raw.isEmpty()) return ""

        val countryStates = statesOf(countryIso)
        countryStates.firstOrNull { it.isoCode.equals(raw, ignoreCase = true) }?.let { return it.isoCode }
        countryStates.firstOrNull { it.name.equals(raw, ignoreCase = true) }?.let { return it.isoCode }
        return raw
    }

    private fun loadCountries(): List<DashboardLocationCountry> {
        val rows = parseArrayOfObjects("location/country.json")
        return rows.mapNotNull { row ->
            val isoCode = row.string("isoCode")?.trim().orEmpty()
            val name = row.string("name")?.trim().orEmpty()
            if (isoCode.isEmpty() || name.isEmpty()) return@mapNotNull null
            DashboardLocationCountry(
                isoCode = isoCode.uppercase(Locale.ROOT),
                name = name,
                flag = row.string("flag").orEmpty(),
            )
        }.sortedBy { it.name.lowercase(Locale.ROOT) }
    }

    private fun loadStates(): List<DashboardLocationState> {
        val rows = parseArrayOfObjects("location/state.json")
        return rows.mapNotNull { row ->
            val isoCode = row.string("isoCode")?.trim().orEmpty()
            val name = row.string("name")?.trim().orEmpty()
            val countryCode = row.string("countryCode")?.trim().orEmpty()
            if (isoCode.isEmpty() || name.isEmpty() || countryCode.isEmpty()) return@mapNotNull null
            DashboardLocationState(
                isoCode = isoCode.uppercase(Locale.ROOT),
                name = name,
                countryCode = countryCode.uppercase(Locale.ROOT),
            )
        }
    }

    private fun loadCities(): List<DashboardLocationCity> {
        val json = readAsset("location/city.json")
        val root = JsonParser.parseString(json)
        if (!root.isJsonArray) return emptyList()

        val seen = hashSetOf<String>()
        val list = arrayListOf<DashboardLocationCity>()
        val array = root.asJsonArray
        for (index in 0 until array.size()) {
            val row = array[index]
            if (!row.isJsonArray) continue
            val values = row.asJsonArray
            if (values.size() < 3) continue

            val name = values[0].asStringOrNull()?.trim().orEmpty()
            val countryCode = values[1].asStringOrNull()?.trim()?.uppercase(Locale.ROOT).orEmpty()
            val stateCode = values[2].asStringOrNull()?.trim()?.uppercase(Locale.ROOT).orEmpty()
            if (name.isEmpty() || countryCode.isEmpty() || stateCode.isEmpty()) continue

            val unique = "$countryCode|$stateCode|${name.lowercase(Locale.ROOT)}"
            if (!seen.add(unique)) continue

            list += DashboardLocationCity(
                name = name,
                countryCode = countryCode,
                stateCode = stateCode,
            )
        }

        return list
    }

    private fun parseArrayOfObjects(assetPath: String): List<JsonObject> {
        val json = readAsset(assetPath)
        val root = JsonParser.parseString(json)
        if (!root.isJsonArray) return emptyList()
        val out = arrayListOf<JsonObject>()
        val array = root.asJsonArray
        for (index in 0 until array.size()) {
            val row = array[index]
            if (row.isJsonObject) out += row.asJsonObject
        }
        return out
    }

    private fun readAsset(path: String): String {
        return appContext.assets.open(path).bufferedReader().use { it.readText() }
    }

    private fun JsonObject.string(key: String): String? {
        val value = get(key) ?: return null
        return value.asStringOrNull()
    }
}

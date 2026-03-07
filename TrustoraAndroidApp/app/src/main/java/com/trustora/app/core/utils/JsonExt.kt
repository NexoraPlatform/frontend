package com.trustora.app.core.utils

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.google.gson.JsonParser

fun JsonObject.stringOrNull(vararg keys: String): String? {
    for (key in keys) {
        val value = this[key] ?: continue
        value.asStringOrNull()?.trim()?.takeIf { it.isNotEmpty() }?.let { return it }
    }
    return null
}

fun JsonObject.booleanOrNull(vararg keys: String): Boolean? {
    for (key in keys) {
        val value = this[key] ?: continue
        value.asBooleanOrNull()?.let { return it }
    }
    return null
}

fun JsonObject.doubleOrNull(vararg keys: String): Double? {
    for (key in keys) {
        val value = this[key] ?: continue
        value.asDoubleOrNull()?.let { return it }
    }
    return null
}

fun JsonObject.intOrNull(vararg keys: String): Int? {
    for (key in keys) {
        val value = this[key] ?: continue
        value.asIntOrNull()?.let { return it }
    }
    return null
}

fun JsonObject.objectOrNull(vararg keys: String): JsonObject? {
    for (key in keys) {
        val value = this[key] ?: continue
        if (value is JsonObject) return value
        if (value is JsonPrimitive && value.isString) {
            value.asStringOrNull()?.toJsonObjectOrNull()?.let { return it }
        }
    }
    return null
}

fun JsonObject.arrayOrNull(vararg keys: String): JsonArray? {
    for (key in keys) {
        val value = this[key] ?: continue
        if (value is JsonArray) return value
        if (value is JsonPrimitive && value.isString) {
            value.asStringOrNull()?.toJsonArrayOrNull()?.let { return it }
        }
    }
    return null
}

fun JsonElement?.asStringOrNull(): String? {
    if (this == null || this is JsonNull) return null
    return runCatching { asString }.getOrNull()
}

fun JsonElement?.asBooleanOrNull(): Boolean? {
    if (this == null || this is JsonNull) return null
    return runCatching { asBoolean }.getOrNull()
        ?: asStringOrNull()?.let {
            when (it.lowercase()) {
                "1", "true", "yes" -> true
                "0", "false", "no" -> false
                else -> null
            }
        }
}

fun JsonElement?.asDoubleOrNull(): Double? {
    if (this == null || this is JsonNull) return null
    return runCatching { asDouble }.getOrNull() ?: asStringOrNull()?.toDoubleOrNull()
}

fun JsonElement?.asIntOrNull(): Int? {
    if (this == null || this is JsonNull) return null
    return runCatching { asInt }.getOrNull() ?: asStringOrNull()?.toIntOrNull()
}

fun String.toJsonObjectOrNull(): JsonObject? = runCatching {
    JsonParser.parseString(this).asJsonObject
}.getOrNull()

fun String.toJsonArrayOrNull(): JsonArray? = runCatching {
    JsonParser.parseString(this).asJsonArray
}.getOrNull()

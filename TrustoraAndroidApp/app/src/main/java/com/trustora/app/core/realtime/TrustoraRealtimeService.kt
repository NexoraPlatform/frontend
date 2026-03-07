package com.trustora.app.core.realtime

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonPrimitive
import com.pusher.client.AuthorizationFailureException
import com.pusher.client.Pusher
import com.pusher.client.PusherOptions
import com.pusher.client.ChannelAuthorizer
import com.pusher.client.channel.ChannelEventListener
import com.pusher.client.channel.PresenceChannelEventListener
import com.pusher.client.channel.PrivateChannelEventListener
import com.pusher.client.channel.PusherEvent
import com.pusher.client.channel.User
import com.pusher.client.connection.ConnectionEventListener
import com.pusher.client.connection.ConnectionState
import com.pusher.client.connection.ConnectionStateChange
import com.trustora.app.core.utils.asDoubleOrNull
import com.trustora.app.core.utils.booleanOrNull
import com.trustora.app.core.utils.intOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

data class TrustoraRealtimeEvent(
    val name: String,
    val channel: String? = null,
    val payload: JsonElement = JsonObject(),
)

object TrustoraRealtimeEventNames {
    const val CONNECTED = "trustora.realtime.connected"
    const val DISCONNECTED = "trustora.realtime.disconnected"
    const val USER_NOTIFICATION = "trustora.realtime.user.notification"
    const val AI_BRIEF_GENERATED = "trustora.realtime.ai_brief.generated"
    const val AI_BRIEF_FAILED = "trustora.realtime.ai_brief.failed"
    const val CHAT_MESSAGE_SENT = "trustora.realtime.chat.message_sent"
    const val CHAT_MESSAGE_UPDATED = "trustora.realtime.chat.message_updated"
    const val CHAT_GROUP_CREATED = "trustora.realtime.chat.group_created"
    const val CHAT_USER_JOINED = "trustora.realtime.chat.user_joined"
    const val CHAT_USER_LEFT = "trustora.realtime.chat.user_left"
    const val PRESENCE_HERE = "trustora.realtime.presence.here"
    const val PRESENCE_JOINING = "trustora.realtime.presence.joining"
    const val PRESENCE_LEAVING = "trustora.realtime.presence.leaving"
}

private enum class TrustoraRealtimeChannelType {
    PUBLIC,
    PRIVATE,
    PRESENCE,
}

private data class TrustoraRealtimeChannel(
    val baseName: String,
    val type: TrustoraRealtimeChannelType,
) {
    val channelName: String
        get() = when (type) {
            TrustoraRealtimeChannelType.PUBLIC -> baseName
            TrustoraRealtimeChannelType.PRIVATE -> "private-$baseName"
            TrustoraRealtimeChannelType.PRESENCE -> "presence-$baseName"
        }
}

private data class TrustoraRealtimeConfig(
    val key: String,
    val host: String,
    val port: Int,
    val useTls: Boolean,
    val cluster: String?,
    val explicitHost: Boolean,
)

private class TrustoraBroadcastAuthorizer(
    private val endpoint: HttpUrl,
    private val token: String,
    private val okHttpClient: OkHttpClient,
) : ChannelAuthorizer {
    override fun authorize(
        channelName: String?,
        socketId: String?,
    ): String {
        val normalizedChannel = channelName?.trim().orEmpty()
        val normalizedSocketId = socketId?.trim().orEmpty()
        if (normalizedChannel.isEmpty()) {
            throw AuthorizationFailureException("Broadcast auth failed: missing channel name")
        }
        if (normalizedSocketId.isEmpty()) {
            throw AuthorizationFailureException("Broadcast auth failed: missing socket id")
        }

        val jsonPayload = JsonObject().apply {
            addProperty("socket_id", normalizedSocketId)
            addProperty("channel_name", normalizedChannel)
        }.toString()

        runCatching {
            executeAuthRequest(
                body = jsonPayload.toRequestBody(),
                contentType = "application/json",
            )
        }.getOrNull()?.let { attempt ->
            validateAuthResponse(attempt)?.let { return it }
        }

        val formPayload =
            "socket_id=${urlEncode(normalizedSocketId)}&channel_name=${urlEncode(normalizedChannel)}"
        val fallbackAttempt = runCatching {
            executeAuthRequest(
                body = formPayload.toRequestBody(),
                contentType = "application/x-www-form-urlencoded",
            )
        }.getOrElse { error ->
            val cause = error as? Exception ?: Exception(error.message, error)
            throw AuthorizationFailureException(
                "Broadcast auth request failed: ${error.message.orEmpty()}",
                cause,
            )
        }
        return validateAuthResponse(fallbackAttempt)
            ?: throw AuthorizationFailureException(
                "Broadcast auth failed status=${fallbackAttempt.statusCode} body=${fallbackAttempt.body}",
            )
    }

    private fun executeAuthRequest(
        body: RequestBody,
        contentType: String,
    ): AuthAttempt {
        val request = Request.Builder()
            .url(endpoint)
            .post(body)
            .header("Accept", "application/json")
            .header("Content-Type", contentType)
            .header("X-Requested-With", "XMLHttpRequest")
            .header("Authorization", "Bearer $token")
            .build()

        okHttpClient.newCall(request).execute().use { response ->
            return AuthAttempt(
                statusCode = response.code,
                body = response.body?.string().orEmpty(),
            )
        }
    }

    private fun validateAuthResponse(attempt: AuthAttempt): String? {
        if (attempt.statusCode !in 200..299) return null
        val parsed = runCatching { JsonParser.parseString(attempt.body).asJsonObject }.getOrNull()
            ?: return null
        val auth = parsed.stringOrNull("auth") ?: return null
        if (auth.isBlank()) return null
        return attempt.body
    }

    private fun urlEncode(value: String): String {
        return URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
    }

    private data class AuthAttempt(
        val statusCode: Int,
        val body: String,
    )
}

class TrustoraRealtimeService(
    private val apiBaseUrl: HttpUrl,
    private val okHttpClient: OkHttpClient,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val stateMutex = Mutex()

    private val _events = MutableSharedFlow<TrustoraRealtimeEvent>(extraBufferCapacity = 128)
    val events: SharedFlow<TrustoraRealtimeEvent> = _events.asSharedFlow()

    private var shouldRun = false
    private var currentUserId: String? = null
    private var bearerToken: String? = null
    private var config: TrustoraRealtimeConfig? = null
    private var pusher: Pusher? = null
    private val channels = linkedSetOf<TrustoraRealtimeChannel>()
    private val subscribedChannelNames = linkedSetOf<String>()

    suspend fun start(userId: String, bearerToken: String) {
        val normalizedUserId = userId.trim()
        val normalizedToken = bearerToken.trim()
        if (normalizedUserId.isEmpty() || normalizedToken.isEmpty()) {
            stop()
            return
        }

        val nextConfig = runCatching {
            loadConfig(normalizedToken)
        }.getOrElse {
            emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
            return
        }

        var shouldReconnect = false
        stateMutex.withLock {
            val userChanged = currentUserId != normalizedUserId
            val tokenChanged = this.bearerToken != normalizedToken
            val configChanged = config != nextConfig

            shouldRun = true
            currentUserId = normalizedUserId
            this.bearerToken = normalizedToken
            config = nextConfig

            channels.clear()
            channels.addAll(defaultChannels(normalizedUserId))

            shouldReconnect = pusher == null || userChanged || tokenChanged || configChanged
            if (shouldReconnect) {
                subscribedChannelNames.clear()
            }
        }

        runCatching {
            if (shouldReconnect) {
                reconnect(nextConfig, normalizedToken)
            } else {
                subscribePendingChannelsIfPossible()
            }
        }.onFailure {
            emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
        }
    }

    suspend fun stop() {
        val pusherToDisconnect = stateMutex.withLock {
            shouldRun = false
            currentUserId = null
            bearerToken = null
            config = null
            channels.clear()
            subscribedChannelNames.clear()
            pusher.also { pusher = null }
        }
        runCatching {
            pusherToDisconnect?.disconnect()
        }
        emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
    }

    suspend fun subscribeChatGroupPresence(groupId: String) {
        val normalizedGroup = groupId.trim()
        if (normalizedGroup.isEmpty()) return
        stateMutex.withLock {
            channels.add(
                TrustoraRealtimeChannel(
                    baseName = "chat.group.$normalizedGroup",
                    type = TrustoraRealtimeChannelType.PRESENCE,
                ),
            )
        }
        subscribePendingChannelsIfPossible()
    }

    suspend fun unsubscribeChatGroupPresence(groupId: String) {
        val normalizedGroup = groupId.trim()
        if (normalizedGroup.isEmpty()) return

        val channel = TrustoraRealtimeChannel(
            baseName = "chat.group.$normalizedGroup",
            type = TrustoraRealtimeChannelType.PRESENCE,
        )

        val pusherSnapshot = stateMutex.withLock {
            channels.remove(channel)
            subscribedChannelNames.remove(channel.channelName)
            pusher
        }

        runCatching {
            pusherSnapshot?.unsubscribe(channel.channelName)
        }
    }

    fun shutdown() {
        scope.cancel()
    }

    private suspend fun reconnect(
        nextConfig: TrustoraRealtimeConfig,
        token: String,
    ) {
        val previous = stateMutex.withLock {
            subscribedChannelNames.clear()
            pusher.also { pusher = null }
        }

        runCatching { previous?.disconnect() }

        val nextPusher = runCatching {
            createPusher(config = nextConfig, token = token)
        }.getOrElse {
            emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
            return
        }
        stateMutex.withLock {
            pusher = nextPusher
        }
        runCatching {
            nextPusher.connect(
                createConnectionListener(),
                ConnectionState.ALL,
            )
        }.onFailure {
            stateMutex.withLock {
                if (pusher === nextPusher) {
                    pusher = null
                }
            }
            emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
        }
    }

    private fun createPusher(
        config: TrustoraRealtimeConfig,
        token: String,
    ): Pusher {
        val normalizedHost = sanitizeHost(config.host) ?: config.host.trim()
        val options = PusherOptions().apply {
            setChannelAuthorizer(buildAuthorizer(token))
            setUseTLS(config.useTls)
            setActivityTimeout(TimeUnit.SECONDS.toMillis(120))
            setPongTimeout(TimeUnit.SECONDS.toMillis(30))
            setMaxReconnectionAttempts(10)
            setMaxReconnectGapInSeconds(10)

            if (!config.explicitHost && !config.cluster.isNullOrBlank()) {
                setCluster(config.cluster)
            } else {
                require(normalizedHost.isNotEmpty()) { "Invalid realtime host" }
                setHost(normalizedHost)
                setWsPort(config.port)
                setWssPort(config.port)
            }
        }

        return Pusher(config.key, options)
    }

    private fun buildAuthorizer(token: String): ChannelAuthorizer {
        val endpoint = apiBaseUrl.newBuilder()
            .addPathSegment("broadcasting")
            .addPathSegment("auth")
            .build()

        return TrustoraBroadcastAuthorizer(
            endpoint = endpoint,
            token = token,
            okHttpClient = okHttpClient,
        )
    }

    private fun createConnectionListener(): ConnectionEventListener {
        return object : ConnectionEventListener {
            override fun onConnectionStateChange(change: ConnectionStateChange?) {
                val state = change?.currentState ?: return
                when (state) {
                    ConnectionState.CONNECTED -> {
                        emitEvent(TrustoraRealtimeEventNames.CONNECTED)
                        scope.launch {
                            subscribePendingChannelsIfPossible()
                        }
                    }

                    ConnectionState.DISCONNECTED -> {
                        scope.launch {
                            stateMutex.withLock {
                                subscribedChannelNames.clear()
                            }
                        }
                        emitEvent(TrustoraRealtimeEventNames.DISCONNECTED)
                    }

                    else -> Unit
                }
            }

            override fun onError(
                message: String?,
                code: String?,
                e: Exception?,
            ) {
                // Keep iOS parity: connection errors are not remapped to user notifications.
            }
        }
    }

    private suspend fun subscribePendingChannelsIfPossible() {
        val snapshot = stateMutex.withLock {
            val pusherSnapshot = pusher ?: return
            if (!shouldRun) return
            pusherSnapshot to channels.toList()
        }

        val pusherSnapshot = snapshot.first
        val channelSnapshot = snapshot.second

        for (channel in channelSnapshot) {
            val alreadySubscribed = stateMutex.withLock {
                subscribedChannelNames.contains(channel.channelName)
            }
            if (alreadySubscribed) continue

            val subscribed = subscribeChannel(
                pusher = pusherSnapshot,
                channel = channel,
            )
            if (subscribed) {
                stateMutex.withLock {
                    subscribedChannelNames.add(channel.channelName)
                }
            }
        }
    }

    private fun subscribeChannel(
        pusher: Pusher,
        channel: TrustoraRealtimeChannel,
    ): Boolean {
        return runCatching {
            when (channel.type) {
                TrustoraRealtimeChannelType.PUBLIC -> {
                    pusher.subscribe(
                        channel.channelName,
                        createPublicChannelListener(channel.channelName),
                        *BINDABLE_EVENT_NAMES,
                    )
                }

                TrustoraRealtimeChannelType.PRIVATE -> {
                    pusher.subscribePrivate(
                        channel.channelName,
                        createPrivateChannelListener(channel.channelName),
                        *BINDABLE_EVENT_NAMES,
                    )
                }

                TrustoraRealtimeChannelType.PRESENCE -> {
                    pusher.subscribePresence(
                        channel.channelName,
                        createPresenceChannelListener(channel.channelName),
                        *BINDABLE_EVENT_NAMES,
                    )
                }
            }
        }.isSuccess
    }

    private fun createPublicChannelListener(channelName: String): ChannelEventListener {
        return object : ChannelEventListener {
            override fun onSubscriptionSucceeded(channel: String?) {
                // No-op; subscription is tracked optimistically.
            }

            override fun onEvent(event: PusherEvent) {
                val actualChannel = event.channelName?.takeIf { it.isNotBlank() } ?: channelName
                val eventName = event.eventName.orEmpty()
                scope.launch {
                    routeApplicationEvent(
                        eventName = eventName,
                        channelName = actualChannel,
                        payload = parseEventData(JsonPrimitive(event.data.orEmpty())),
                    )
                }
            }
        }
    }

    private fun createPrivateChannelListener(channelName: String): PrivateChannelEventListener {
        return object : PrivateChannelEventListener {
            override fun onSubscriptionSucceeded(channel: String?) {
                // No-op; subscription is tracked optimistically.
            }

            override fun onAuthenticationFailure(
                message: String?,
                e: Exception?,
            ) {
                scope.launch {
                    stateMutex.withLock {
                        subscribedChannelNames.remove(channelName)
                    }
                }
            }

            override fun onEvent(event: PusherEvent) {
                val actualChannel = event.channelName?.takeIf { it.isNotBlank() } ?: channelName
                val eventName = event.eventName.orEmpty()
                scope.launch {
                    routeApplicationEvent(
                        eventName = eventName,
                        channelName = actualChannel,
                        payload = parseEventData(JsonPrimitive(event.data.orEmpty())),
                    )
                }
            }
        }
    }

    private fun createPresenceChannelListener(channelName: String): PresenceChannelEventListener {
        return object : PresenceChannelEventListener {
            override fun onUsersInformationReceived(
                channel: String?,
                users: MutableSet<User>?,
            ) {
                val payload = JsonObject().apply {
                    add(
                        "members",
                        JsonArray().apply {
                            users.orEmpty().forEach { user ->
                                add(user.id)
                            }
                        },
                    )
                }
                emitEvent(
                    TrustoraRealtimeEventNames.PRESENCE_HERE,
                    channel = channel ?: channelName,
                    payload = payload,
                )
            }

            override fun userSubscribed(
                channel: String?,
                user: User?,
            ) {
                val payload = JsonObject().apply {
                    if (user != null) {
                        addProperty("id", user.id)
                        user.info?.takeIf { it.isNotBlank() }?.let { addProperty("info", it) }
                    }
                }
                emitEvent(
                    TrustoraRealtimeEventNames.PRESENCE_JOINING,
                    channel = channel ?: channelName,
                    payload = payload,
                )
            }

            override fun userUnsubscribed(
                channel: String?,
                user: User?,
            ) {
                val payload = JsonObject().apply {
                    if (user != null) {
                        addProperty("id", user.id)
                        user.info?.takeIf { it.isNotBlank() }?.let { addProperty("info", it) }
                    }
                }
                emitEvent(
                    TrustoraRealtimeEventNames.PRESENCE_LEAVING,
                    channel = channel ?: channelName,
                    payload = payload,
                )
            }

            override fun onAuthenticationFailure(
                message: String?,
                e: Exception?,
            ) {
                scope.launch {
                    stateMutex.withLock {
                        subscribedChannelNames.remove(channelName)
                    }
                }
            }

            override fun onSubscriptionSucceeded(channel: String?) {
                // No-op; subscription is tracked optimistically.
            }

            override fun onEvent(event: PusherEvent) {
                val actualChannel = event.channelName?.takeIf { it.isNotBlank() } ?: channelName
                val eventName = event.eventName.orEmpty()
                scope.launch {
                    routeApplicationEvent(
                        eventName = eventName,
                        channelName = actualChannel,
                        payload = parseEventData(JsonPrimitive(event.data.orEmpty())),
                    )
                }
            }
        }
    }

    private suspend fun routeApplicationEvent(
        eventName: String,
        channelName: String,
        payload: JsonElement,
    ) {
        val normalizedEvent = normalizeEventName(eventName)
        val normalizedChannel = channelName.trim().lowercase()

        if (normalizedEvent.contains("broadcastnotificationcreated")) {
            emitEvent(TrustoraRealtimeEventNames.USER_NOTIFICATION, channelName, payload)
            return
        }

        if (
            isAIBriefGeneratedEvent(
                eventName = eventName,
                normalizedEvent = normalizedEvent,
                normalizedChannel = normalizedChannel,
                payload = payload,
            )
        ) {
            emitEvent(TrustoraRealtimeEventNames.AI_BRIEF_GENERATED, channelName, payload)
            return
        }

        if (
            isAIBriefFailedEvent(
                eventName = eventName,
                normalizedEvent = normalizedEvent,
                normalizedChannel = normalizedChannel,
                payload = payload,
            )
        ) {
            emitEvent(TrustoraRealtimeEventNames.AI_BRIEF_FAILED, channelName, payload)
            return
        }

        if (normalizedEvent == "messagesent" || normalizedEvent.endsWith("\\messagesent")) {
            emitEvent(TrustoraRealtimeEventNames.CHAT_MESSAGE_SENT, channelName, payload)
            return
        }

        if (normalizedEvent == "messageupdated" || normalizedEvent.endsWith("\\messageupdated")) {
            emitEvent(TrustoraRealtimeEventNames.CHAT_MESSAGE_UPDATED, channelName, payload)
            return
        }

        if (normalizedEvent == "groupcreated" || normalizedEvent.endsWith("\\groupcreated")) {
            emitEvent(TrustoraRealtimeEventNames.CHAT_GROUP_CREATED, channelName, payload)
            return
        }

        if (normalizedEvent == "userjoined" || normalizedEvent.endsWith("\\userjoined")) {
            emitEvent(TrustoraRealtimeEventNames.CHAT_USER_JOINED, channelName, payload)
            return
        }

        if (normalizedEvent == "userleft" || normalizedEvent.endsWith("\\userleft")) {
            emitEvent(TrustoraRealtimeEventNames.CHAT_USER_LEFT, channelName, payload)
            return
        }

        if (eventName == "pusher_internal:subscription_succeeded") {
            emitEvent(TrustoraRealtimeEventNames.PRESENCE_HERE, channelName, payload)
            return
        }

        if (eventName == "pusher_internal:member_added") {
            emitEvent(TrustoraRealtimeEventNames.PRESENCE_JOINING, channelName, payload)
            return
        }

        if (eventName == "pusher_internal:member_removed") {
            emitEvent(TrustoraRealtimeEventNames.PRESENCE_LEAVING, channelName, payload)
            return
        }
    }

    private suspend fun loadConfig(token: String): TrustoraRealtimeConfig {
        return withContext(Dispatchers.IO) {
            val endpoint = apiBaseUrl.newBuilder()
                .addPathSegment("realtime")
                .addPathSegment("pusher-config")
                .build()

            val request = Request.Builder()
                .url(endpoint)
                .get()
                .header("Accept", "application/json")
                .header("Authorization", "Bearer $token")
                .build()

            val backendHost = apiBaseUrl.host
            val backendIsLocal = backendHost == "127.0.0.1" || backendHost == "localhost" || backendHost == "10.0.2.2"
            val defaultUseTls = !backendIsLocal && apiBaseUrl.isHttps

            runCatching {
                okHttpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) return@use null
                    val body = response.body?.string().orEmpty()
                    val root = runCatching { JsonParser.parseString(body).asJsonObject }.getOrNull() ?: return@use null

                    val key = root.stringOrNull("key") ?: DEFAULT_PUSHER_KEY
                    val cluster = root.stringOrNull("cluster", "wsCluster")
                    val explicitHostRaw = root.stringOrNull("wsHost", "host")
                    val explicitHost = sanitizeHost(explicitHostRaw)
                    val explicitPort = extractPort(explicitHostRaw)
                    val hasExplicitHost = !explicitHost.isNullOrBlank()
                    val resolvedHost = explicitHost
                        ?: if (!cluster.isNullOrBlank()) "ws-$cluster.pusher.com" else backendHost
                    val useTls = root.booleanOrNull("useTLS", "forceTLS", "encrypted")
                        ?: if (!cluster.isNullOrBlank() && !hasExplicitHost) true else defaultUseTls
                    val port = root.intOrNull("wsPort", "wssPort", "port")
                        ?: explicitPort
                        ?: if (!cluster.isNullOrBlank() && !hasExplicitHost) {
                            if (useTls) 443 else 80
                        } else {
                            6001
                        }

                    TrustoraRealtimeConfig(
                        key = key,
                        host = resolvedHost,
                        port = maxOf(1, port),
                        useTls = useTls,
                        cluster = cluster,
                        explicitHost = hasExplicitHost,
                    )
                }
            }.getOrNull()?.let { config ->
                return@withContext config
            }

            val cluster = System.getenv("PUSHER_CLUSTER")?.trim().takeUnless { it.isNullOrEmpty() } ?: DEFAULT_PUSHER_CLUSTER
            val key = System.getenv("PUSHER_KEY")?.trim().takeUnless { it.isNullOrEmpty() } ?: DEFAULT_PUSHER_KEY

            if (key.isNotEmpty() && cluster.isNotEmpty()) {
                return@withContext TrustoraRealtimeConfig(
                    key = key,
                    host = "ws-$cluster.pusher.com",
                    port = 443,
                    useTls = true,
                    cluster = cluster,
                    explicitHost = false,
                )
            }

            return@withContext TrustoraRealtimeConfig(
                key = DEFAULT_PUSHER_KEY,
                host = backendHost,
                port = 6001,
                useTls = defaultUseTls,
                cluster = null,
                explicitHost = true,
            )
        }
    }

    private fun sanitizeHost(rawHost: String?): String? {
        val value = rawHost?.trim().orEmpty()
        if (value.isEmpty()) return null
        val authority = value.substringAfter("://", value)
            .substringBefore('/')
            .substringBefore('?')
            .substringBefore('#')
            .substringAfterLast('@')
            .trim()
        if (authority.isEmpty()) return null
        val host = when {
            authority.startsWith("[") -> authority.substringAfter("[").substringBefore("]")
            authority.count { it == ':' } == 1 -> authority.substringBefore(':')
            else -> authority
        }.trim()
        return host.takeIf { it.isNotEmpty() }
    }

    private fun extractPort(rawHost: String?): Int? {
        val value = rawHost?.trim().orEmpty()
        if (value.isEmpty()) return null
        val authority = value.substringAfter("://", value)
            .substringBefore('/')
            .substringBefore('?')
            .substringBefore('#')
            .substringAfterLast('@')
            .trim()
        if (authority.isEmpty()) return null

        val port = when {
            authority.startsWith("[") -> {
                val suffix = authority.substringAfter("]", "")
                if (suffix.startsWith(":")) suffix.drop(1).toIntOrNull() else null
            }

            authority.count { it == ':' } == 1 -> authority.substringAfter(':').toIntOrNull()
            else -> null
        }

        return port?.takeIf { it in 1..65535 }
    }

    private fun defaultChannels(userId: String): Set<TrustoraRealtimeChannel> {
        return setOf(
            TrustoraRealtimeChannel(
                baseName = "App.Models.User.$userId",
                type = TrustoraRealtimeChannelType.PRIVATE,
            ),
            TrustoraRealtimeChannel(
                baseName = "chat.user.$userId",
                type = TrustoraRealtimeChannelType.PRIVATE,
            ),
            TrustoraRealtimeChannel(
                baseName = "user.$userId.briefs",
                type = TrustoraRealtimeChannelType.PRIVATE,
            ),
            TrustoraRealtimeChannel(
                baseName = "online-users",
                type = TrustoraRealtimeChannelType.PRESENCE,
            ),
        )
    }

    private fun parseEventData(raw: JsonElement?): JsonElement {
        if (raw == null || raw is JsonNull) return JsonObject()
        if (raw.isJsonPrimitive && raw.asJsonPrimitive.isString) {
            val trimmed = raw.asString.trim()
            if (trimmed.isEmpty()) return JsonObject()
            val parsed = runCatching { JsonParser.parseString(trimmed) }.getOrNull()
                ?: return JsonPrimitive(trimmed)
            if (parsed.isJsonPrimitive && parsed.asJsonPrimitive.isString) {
                return parseEventData(parsed)
            }
            return parsed
        }
        return raw
    }

    private fun normalizeEventName(eventName: String): String {
        var normalized = eventName.trim()
        while (normalized.startsWith(".") || normalized.startsWith("\\")) {
            normalized = normalized.drop(1)
        }
        return normalized.lowercase()
    }

    private fun matchesEvent(
        eventName: String,
        normalized: String,
        rawCandidates: Set<String>,
        normalizedCandidates: Set<String>,
    ): Boolean {
        return rawCandidates.contains(eventName) || normalizedCandidates.contains(normalized)
    }

    private fun isAIBriefGeneratedEvent(
        eventName: String,
        normalizedEvent: String,
        normalizedChannel: String,
        payload: JsonElement,
    ): Boolean {
        if (
            matchesEvent(
                eventName = eventName,
                normalized = normalizedEvent,
                rawCandidates = aiGeneratedEventsRaw,
                normalizedCandidates = aiGeneratedEventsNormalized,
            )
        ) {
            return true
        }

        if (normalizedEvent.contains("aibriefgenerated") ||
            (normalizedEvent.contains("aibrief") && normalizedEvent.contains("generated"))
        ) {
            return true
        }

        if (!normalizedChannel.contains(".briefs")) return false
        val root = payload.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
        val source = root.objectOrNull("result")
            ?: root.objectOrNull("data")
            ?: root
        val sourceResponsePayload = source.objectOrNull("response_payload")
        val rootResponsePayload = root.objectOrNull("response_payload")
        val sourceDebugResponsePayload = source.objectOrNull("debug")?.objectOrNull("response_payload")
        val rootDebugResponsePayload = root.objectOrNull("debug")?.objectOrNull("response_payload")

        val status = (
            source.stringOrNull("status")
                ?: root.stringOrNull("status")
                ?: sourceResponsePayload?.stringOrNull("status")
                ?: rootResponsePayload?.stringOrNull("status")
                ?: sourceDebugResponsePayload?.stringOrNull("status")
                ?: rootDebugResponsePayload?.stringOrNull("status")
                ?: ""
            ).uppercase()

        if (status == "PROCESSING" || status == "CLARIFY" || status == "FINAL") {
            return true
        }

        return source.hasNonNull("questions") ||
            root.hasNonNull("questions") ||
            source.hasNonNull("final_brief") ||
            source.hasNonNull("final_brief_modular") ||
            root.hasNonNull("final_brief") ||
            root.hasNonNull("final_brief_modular") ||
            source.hasNonNull("brief_result_id") ||
            root.hasNonNull("brief_result_id") ||
            sourceResponsePayload.hasNonNull("questions") ||
            rootResponsePayload.hasNonNull("questions") ||
            sourceDebugResponsePayload.hasNonNull("questions") ||
            rootDebugResponsePayload.hasNonNull("questions") ||
            sourceResponsePayload.hasNonNull("brief_result_id") ||
            rootResponsePayload.hasNonNull("brief_result_id") ||
            sourceDebugResponsePayload.hasNonNull("brief_result_id") ||
            rootDebugResponsePayload.hasNonNull("brief_result_id")
    }

    private fun isAIBriefFailedEvent(
        eventName: String,
        normalizedEvent: String,
        normalizedChannel: String,
        payload: JsonElement,
    ): Boolean {
        if (
            matchesEvent(
                eventName = eventName,
                normalized = normalizedEvent,
                rawCandidates = aiFailedEventsRaw,
                normalizedCandidates = aiFailedEventsNormalized,
            )
        ) {
            return true
        }

        if (normalizedEvent.contains("aibrieffailed") ||
            (normalizedEvent.contains("aibrief") && normalizedEvent.contains("failed"))
        ) {
            return true
        }

        if (!normalizedChannel.contains(".briefs")) return false
        val root = payload.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
        val source = root.objectOrNull("result")
            ?: root.objectOrNull("data")
            ?: root
        val sourceResponsePayload = source.objectOrNull("response_payload")
        val rootResponsePayload = root.objectOrNull("response_payload")
        val sourceDebugResponsePayload = source.objectOrNull("debug")?.objectOrNull("response_payload")
        val rootDebugResponsePayload = root.objectOrNull("debug")?.objectOrNull("response_payload")

        val failureCandidates = listOf(
            source.stringOrNull("errorMessage", "error_message", "message", "error", "reason"),
            root.stringOrNull("errorMessage", "error_message", "message", "error", "reason"),
            sourceResponsePayload?.stringOrNull("errorMessage", "error_message", "message", "error"),
            rootResponsePayload?.stringOrNull("errorMessage", "error_message", "message", "error"),
            sourceDebugResponsePayload?.stringOrNull("errorMessage", "error_message", "message", "error"),
            rootDebugResponsePayload?.stringOrNull("errorMessage", "error_message", "message", "error"),
        )

        return failureCandidates.any { value ->
            !value.isNullOrBlank()
        }
    }

    private fun emitEvent(name: String, channel: String? = null, payload: JsonElement = JsonObject()) {
        _events.tryEmit(
            TrustoraRealtimeEvent(
                name = name,
                channel = channel,
                payload = payload,
            ),
        )
    }

    private fun JsonObject?.hasNonNull(key: String): Boolean {
        return this?.has(key) == true && this[key] !is JsonNull
    }

    companion object {
        private const val DEFAULT_PUSHER_KEY = "42d19af4cdc8ba03ac4b"
        private const val DEFAULT_PUSHER_CLUSTER = "eu"

        private val notificationEventsRaw = setOf(
            ".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated",
            "Illuminate\\Notifications\\Events\\BroadcastNotificationCreated",
            ".BroadcastNotificationCreated",
            "BroadcastNotificationCreated",
        )
        private val aiGeneratedEventsRaw = setOf(
            ".AiBriefGenerated",
            "AiBriefGenerated",
            ".App\\Events\\AiBriefGenerated",
            "App\\Events\\AiBriefGenerated",
        )
        private val aiFailedEventsRaw = setOf(
            ".AiBriefFailed",
            "AiBriefFailed",
            ".App\\Events\\AiBriefFailed",
            "App\\Events\\AiBriefFailed",
        )
        private val chatEventsRaw = setOf(
            ".MessageSent",
            "MessageSent",
            ".App\\Events\\MessageSent",
            "App\\Events\\MessageSent",
            ".MessageUpdated",
            "MessageUpdated",
            ".App\\Events\\MessageUpdated",
            "App\\Events\\MessageUpdated",
            ".GroupCreated",
            "GroupCreated",
            ".App\\Events\\GroupCreated",
            "App\\Events\\GroupCreated",
            ".UserJoined",
            "UserJoined",
            ".App\\Events\\UserJoined",
            "App\\Events\\UserJoined",
            ".UserLeft",
            "UserLeft",
            ".App\\Events\\UserLeft",
            "App\\Events\\UserLeft",
        )

        private val aiGeneratedEventsNormalized = setOf(
            "aibriefgenerated",
            "app\\events\\aibriefgenerated",
        )
        private val aiFailedEventsNormalized = setOf(
            "aibrieffailed",
            "app\\events\\aibrieffailed",
        )

        private val BINDABLE_EVENT_NAMES: Array<String> =
            linkedSetOf<String>().apply {
                addAll(notificationEventsRaw)
                addAll(aiGeneratedEventsRaw)
                addAll(aiFailedEventsRaw)
                addAll(chatEventsRaw)
            }.toTypedArray()
    }
}

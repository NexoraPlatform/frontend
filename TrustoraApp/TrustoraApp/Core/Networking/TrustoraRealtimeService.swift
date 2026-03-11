import Foundation

extension Notification.Name {
    static let trustoraRealtimeConnected = Notification.Name("trustora.realtime.connected")
    static let trustoraRealtimeDisconnected = Notification.Name("trustora.realtime.disconnected")
    static let trustoraRealtimeUserNotification = Notification.Name("trustora.realtime.user.notification")
    static let trustoraRealtimeAIBriefGenerated = Notification.Name("trustora.realtime.ai_brief.generated")
    static let trustoraRealtimeAIBriefFailed = Notification.Name("trustora.realtime.ai_brief.failed")
    static let trustoraRealtimeChatMessageSent = Notification.Name("trustora.realtime.chat.message_sent")
    static let trustoraRealtimeChatMessageUpdated = Notification.Name("trustora.realtime.chat.message_updated")
    static let trustoraRealtimeChatGroupCreated = Notification.Name("trustora.realtime.chat.group_created")
    static let trustoraRealtimeChatUserJoined = Notification.Name("trustora.realtime.chat.user_joined")
    static let trustoraRealtimeChatUserLeft = Notification.Name("trustora.realtime.chat.user_left")
    static let trustoraRealtimePresenceHere = Notification.Name("trustora.realtime.presence.here")
    static let trustoraRealtimePresenceJoining = Notification.Name("trustora.realtime.presence.joining")
    static let trustoraRealtimePresenceLeaving = Notification.Name("trustora.realtime.presence.leaving")
}

enum TrustoraRealtimeChannelType {
    case publicChannel
    case privateChannel
    case presence
}

private struct TrustoraRealtimeChannel: Hashable {
    let baseName: String
    let type: TrustoraRealtimeChannelType

    var channelName: String {
        switch type {
        case .publicChannel:
            return baseName
        case .privateChannel:
            return "private-\(baseName)"
        case .presence:
            return "presence-\(baseName)"
        }
    }
}

private struct TrustoraRealtimeConfig {
    let key: String
    let host: String
    let port: Int
    let useTLS: Bool
    let cluster: String?

    var webSocketScheme: String {
        useTLS ? "wss" : "ws"
    }
}

private enum TrustoraRealtimeDefaults {
    static let pusherKey = "42d19af4cdc8ba03ac4b"
    static let pusherCluster = "eu"
}

@MainActor
final class TrustoraRealtimeService {
    static let shared = TrustoraRealtimeService()

    private let apiBaseURL = URL(string: "https://previewbe.trustora.ro/api")!
    private let urlSession: URLSession

    private var socketTask: URLSessionWebSocketTask?
    private var receiveLoopTask: Task<Void, Never>?
    private var pingTask: Task<Void, Never>?

    private var shouldRun = false
    private var isConnecting = false
    private var isConnected = false
    private var reconnectAttempts = 0

    private var socketID: String?
    private var activityTimeout: TimeInterval = 120

    private var currentUserID: String?
    private var bearerToken: String?
    private var config: TrustoraRealtimeConfig?

    private var channels = Set<TrustoraRealtimeChannel>()
    private var subscribedChannelNames = Set<String>()
    // Keep these variants aligned with Next.js subscriptions.
    private let aiGeneratedEventsRaw: Set<String> = [
        ".AiBriefGenerated",
        "AiBriefGenerated",
        ".App\\Events\\AiBriefGenerated",
        "App\\Events\\AiBriefGenerated",
    ]
    private let aiFailedEventsRaw: Set<String> = [
        ".AiBriefFailed",
        "AiBriefFailed",
        ".App\\Events\\AiBriefFailed",
        "App\\Events\\AiBriefFailed",
    ]
    private let aiGeneratedEventsNormalized: Set<String> = [
        "aibriefgenerated",
        "app\\events\\aibriefgenerated",
    ]
    private let aiFailedEventsNormalized: Set<String> = [
        "aibrieffailed",
        "app\\events\\aibrieffailed",
    ]

    init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    func start(userID: String, bearerToken: String) async {
        let normalizedUserID = userID.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedToken = bearerToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedUserID.isEmpty, !normalizedToken.isEmpty else {
            log("start skipped: empty user/token")
            await stop()
            return
        }

        let userChanged = currentUserID != normalizedUserID
        let tokenChanged = self.bearerToken != normalizedToken

        currentUserID = normalizedUserID
        self.bearerToken = normalizedToken
        shouldRun = true
        log("start user=\(normalizedUserID)")

        if userChanged || tokenChanged {
            subscribedChannelNames = []
            channels = defaultChannels(for: normalizedUserID)
        } else {
            channels.formUnion(defaultChannels(for: normalizedUserID))
        }

        if isConnected {
            log("already connected, subscribe pending channels")
            await subscribePendingChannelsIfPossible()
            return
        }

        await connectIfNeeded()
    }

    func stop() async {
        log("stop called")
        shouldRun = false
        isConnecting = false
        isConnected = false
        reconnectAttempts = 0
        socketID = nil
        activityTimeout = 120
        currentUserID = nil
        bearerToken = nil
        subscribedChannelNames = []
        channels = []

        pingTask?.cancel()
        pingTask = nil
        receiveLoopTask?.cancel()
        receiveLoopTask = nil
        socketTask?.cancel(with: .goingAway, reason: nil)
        socketTask = nil

        postOnMain(.trustoraRealtimeDisconnected, userInfo: nil)
    }

    func subscribeChatGroupPresence(_ groupID: String) async {
        let normalized = groupID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return }

        channels.insert(
            TrustoraRealtimeChannel(
                baseName: "chat.group.\(normalized)",
                type: .presence
            )
        )
        await subscribePendingChannelsIfPossible()
    }

    func unsubscribeChatGroupPresence(_ groupID: String) async {
        let normalized = groupID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return }

        let channel = TrustoraRealtimeChannel(baseName: "chat.group.\(normalized)", type: .presence)
        channels.remove(channel)
        subscribedChannelNames.remove(channel.channelName)

        await sendEvent([
            "event": "pusher:unsubscribe",
            "data": [
                "channel": channel.channelName,
            ],
        ])
    }

    private func connectIfNeeded() async {
        guard shouldRun else { return }
        guard !isConnecting else { return }
        guard socketTask == nil else { return }

        isConnecting = true
        defer { isConnecting = false }

        guard let token = bearerToken else { return }
        do {
            config = try await loadConfig(token: token)
        } catch {
            log("loadConfig failed: \(error.localizedDescription)")
            await scheduleReconnect()
            return
        }

        guard let config else {
            log("connect aborted: config is nil")
            await scheduleReconnect()
            return
        }

        guard let url = buildSocketURL(config: config) else {
            log("connect aborted: invalid socket URL")
            await scheduleReconnect()
            return
        }
        log("connect socket url=\(url.absoluteString)")

        var request = URLRequest(url: url)
        request.timeoutInterval = 30
        request.setValue("https://\(config.host)", forHTTPHeaderField: "Origin")

        let task = urlSession.webSocketTask(with: request)
        socketTask = task
        task.resume()

        startReceiveLoop()
    }

    private func startReceiveLoop() {
        receiveLoopTask?.cancel()
        receiveLoopTask = Task { [weak self] in
            guard let self else { return }
            while !Task.isCancelled {
                guard let socketTask = self.socketTask else { return }
                do {
                    let message = try await socketTask.receive()
                    await self.handleSocketMessage(message)
                } catch {
                    self.log("socket receive failed: \(error.localizedDescription)")
                    await self.handleSocketDisconnected()
                    return
                }
            }
        }
    }

    private func handleSocketMessage(_ message: URLSessionWebSocketTask.Message) async {
        switch message {
        case .string(let text):
            await handleJSONText(text)
        case .data(let data):
            guard let text = String(data: data, encoding: .utf8) else { return }
            await handleJSONText(text)
        @unknown default:
            break
        }
    }

    private func handleJSONText(_ rawText: String) async {
        guard let data = rawText.data(using: .utf8) else { return }
        guard let object = try? JSONSerialization.jsonObject(with: data, options: []) else { return }
        guard let payload = object as? [String: Any] else { return }

        let eventName = (payload["event"] as? String) ?? ""
        let channelName = (payload["channel"] as? String) ?? ""
        let eventData = parseEventData(payload["data"])
        if eventName != "pusher:pong" {
            log("ws event=\(eventName) channel=\(channelName)")
        }

        if eventName == "pusher:connection_established" {
            if let eventDataDictionary = eventData as? [String: Any] {
                socketID = stringValue(eventDataDictionary["socket_id"])
                activityTimeout = doubleValue(eventDataDictionary["activity_timeout"]) ?? 120
            } else {
                socketID = nil
                activityTimeout = 120
            }

            isConnected = true
            reconnectAttempts = 0
            log("socket connected socket_id=\(socketID ?? "-") timeout=\(activityTimeout)")
            postOnMain(.trustoraRealtimeConnected, userInfo: nil)
            startPingLoopIfNeeded()
            await subscribePendingChannelsIfPossible()
            return
        }

        if eventName == "pusher:ping" {
            await sendEvent([
                "event": "pusher:pong",
                "data": [:] as [String: Any],
            ])
            return
        }

        if eventName == "pusher:pong" {
            return
        }

        if eventName == "pusher:error" {
            log("pusher:error")
            return
        }

        await routeApplicationEvent(eventName: eventName, channelName: channelName, payload: eventData)
    }

    private func routeApplicationEvent(eventName: String, channelName: String, payload: Any) async {
        let normalizedEvent = normalizeEventName(eventName)
        let normalizedChannel = channelName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let userInfo: [AnyHashable: Any] = [
            "channel": channelName,
            "event": eventName,
            "payload": payload,
        ]

        if normalizedEvent.contains("broadcastnotificationcreated") {
            postOnMain(.trustoraRealtimeUserNotification, userInfo: userInfo)
            return
        }

        if isAIBriefGeneratedEvent(
            eventName: eventName,
            normalizedEvent: normalizedEvent,
            normalizedChannel: normalizedChannel,
            payload: payload
        ) {
            postOnMain(.trustoraRealtimeAIBriefGenerated, userInfo: userInfo)
            return
        }

        if isAIBriefFailedEvent(
            eventName: eventName,
            normalizedEvent: normalizedEvent,
            normalizedChannel: normalizedChannel,
            payload: payload
        ) {
            postOnMain(.trustoraRealtimeAIBriefFailed, userInfo: userInfo)
            return
        }

        if normalizedEvent == "messagesent" {
            postOnMain(.trustoraRealtimeChatMessageSent, userInfo: userInfo)
            return
        }

        if normalizedEvent == "messageupdated" {
            postOnMain(.trustoraRealtimeChatMessageUpdated, userInfo: userInfo)
            return
        }

        if normalizedEvent == "groupcreated" {
            postOnMain(.trustoraRealtimeChatGroupCreated, userInfo: userInfo)
            return
        }

        if normalizedEvent == "userjoined" {
            postOnMain(.trustoraRealtimeChatUserJoined, userInfo: userInfo)
            return
        }

        if normalizedEvent == "userleft" {
            postOnMain(.trustoraRealtimeChatUserLeft, userInfo: userInfo)
            return
        }

        if eventName == "pusher_internal:subscription_succeeded" {
            postOnMain(.trustoraRealtimePresenceHere, userInfo: userInfo)
            return
        }

        if eventName == "pusher_internal:member_added" {
            postOnMain(.trustoraRealtimePresenceJoining, userInfo: userInfo)
            return
        }

        if eventName == "pusher_internal:member_removed" {
            postOnMain(.trustoraRealtimePresenceLeaving, userInfo: userInfo)
            return
        }
    }

    private func subscribePendingChannelsIfPossible() async {
        guard shouldRun else { return }
        guard isConnected, let socketID, !socketID.isEmpty else { return }
        guard let token = bearerToken else { return }

        for channel in channels {
            let actualName = channel.channelName
            if subscribedChannelNames.contains(actualName) {
                continue
            }

            switch channel.type {
            case .publicChannel:
                log("subscribe public channel=\(actualName)")
                await sendEvent([
                    "event": "pusher:subscribe",
                    "data": [
                        "channel": actualName,
                    ],
                ])
                subscribedChannelNames.insert(actualName)
            case .privateChannel, .presence:
                log("authorize channel=\(actualName)")
                guard let authPayload = try? await authorize(channelName: actualName, socketID: socketID, token: token) else {
                    log("authorize FAILED channel=\(actualName)")
                    continue
                }

                var data: [String: Any] = [
                    "channel": actualName,
                    "auth": authPayload.auth,
                ]
                if let channelData = authPayload.channelData, !channelData.isEmpty {
                    data["channel_data"] = channelData
                }

                await sendEvent([
                    "event": "pusher:subscribe",
                    "data": data,
                ])
                log("subscribe private/presence channel=\(actualName)")
                subscribedChannelNames.insert(actualName)
            }
        }
    }

    private func authorize(
        channelName: String,
        socketID: String,
        token: String
    ) async throws -> (auth: String, channelData: String?) {
        let endpoint = apiBaseURL.appendingPathComponent("broadcasting/auth")

        // Primary attempt: JSON body (same shape as web).
        do {
            var request = URLRequest(url: endpoint)
            request.httpMethod = "POST"
            request.timeoutInterval = 20
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("XMLHttpRequest", forHTTPHeaderField: "X-Requested-With")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.httpBody = try JSONSerialization.data(
                withJSONObject: [
                    "socket_id": socketID,
                    "channel_name": channelName,
                ],
                options: []
            )

            let (data, response) = try await urlSession.data(for: request)
            if let auth = parseBroadcastAuthResponse(data: data, response: response) {
                log("authorize JSON success channel=\(channelName)")
                return auth
            }
            logAuthFailure(variant: "json", channelName: channelName, response: response, data: data)
        } catch {
            log("authorize JSON error channel=\(channelName): \(error.localizedDescription)")
        }

        // Fallback: x-www-form-urlencoded body for stricter broadcast auth middleware.
        var fallbackRequest = URLRequest(url: endpoint)
        fallbackRequest.httpMethod = "POST"
        fallbackRequest.timeoutInterval = 20
        fallbackRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        fallbackRequest.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        fallbackRequest.setValue("XMLHttpRequest", forHTTPHeaderField: "X-Requested-With")
        fallbackRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let formBody =
            "socket_id=\(urlEncode(socketID))&channel_name=\(urlEncode(channelName))"
        fallbackRequest.httpBody = formBody.data(using: .utf8)

        let (fallbackData, fallbackResponse) = try await urlSession.data(for: fallbackRequest)
        if let auth = parseBroadcastAuthResponse(data: fallbackData, response: fallbackResponse) {
            log("authorize FORM success channel=\(channelName)")
            return auth
        }
        logAuthFailure(variant: "form", channelName: channelName, response: fallbackResponse, data: fallbackData)

        throw TrustoraNetworkError.invalidResponse
    }

    private func loadConfig(token: String) async throws -> TrustoraRealtimeConfig {
        var request = URLRequest(url: apiBaseURL.appendingPathComponent("realtime/pusher-config"))
        request.httpMethod = "GET"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await urlSession.data(for: request)
        let backendHost = apiBaseURL.host ?? "127.0.0.1"
        let backendIsLocal = backendHost == "127.0.0.1" || backendHost == "localhost"
        let defaultUseTLS = !backendIsLocal && (apiBaseURL.scheme?.lowercased() == "https")

        if let http = response as? HTTPURLResponse,
           (200...299).contains(http.statusCode),
           let dictionary = (try? JSONSerialization.jsonObject(with: data, options: [])) as? [String: Any] {
            let key = stringValue(dictionary["key"]) ?? "42d19af4cdc8ba03ac4b"
            let cluster = stringValue(dictionary["cluster"]) ?? stringValue(dictionary["wsCluster"])
            let hasExplicitHost =
                stringValue(dictionary["wsHost"]) != nil
                || stringValue(dictionary["host"]) != nil
            let resolvedHost =
                stringValue(dictionary["wsHost"])
                ?? stringValue(dictionary["host"])
                ?? {
                    if let cluster, !cluster.isEmpty {
                        return "ws-\(cluster).pusher.com"
                    }
                    return backendHost
                }()
            let useTLS = boolValue(dictionary["useTLS"])
                ?? boolValue(dictionary["forceTLS"])
                ?? boolValue(dictionary["encrypted"])
                ?? {
                    if cluster != nil && !hasExplicitHost {
                        return true
                    }
                    return defaultUseTLS
                }()
            let host =
                resolvedHost
            let port = intValue(dictionary["wsPort"])
                ?? intValue(dictionary["port"])
                ?? {
                    if cluster != nil && !hasExplicitHost {
                        return useTLS ? 443 : 80
                    }
                    return 6001
                }()

            return TrustoraRealtimeConfig(
                key: key,
                host: host,
                port: max(1, port),
                useTLS: useTLS,
                cluster: cluster
            )
        }

        // Fallback to Pusher cloud when config endpoint is unavailable.
        let envCluster =
            ProcessInfo.processInfo.environment["PUSHER_CLUSTER"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        let cluster = envCluster?.nilIfEmpty ?? TrustoraRealtimeDefaults.pusherCluster
        let envKey = ProcessInfo.processInfo.environment["PUSHER_KEY"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        let key = envKey?.nilIfEmpty ?? TrustoraRealtimeDefaults.pusherKey

        if !key.isEmpty, !cluster.isEmpty {
            let host = "ws-\(cluster).pusher.com"
            log("loadConfig fallback Pusher Cloud host=\(host) cluster=\(cluster)")
            return TrustoraRealtimeConfig(
                key: key,
                host: host,
                port: 443,
                useTLS: true,
                cluster: cluster
            )
        }

        // Last-resort compatibility fallback for local websocket server.
        log("loadConfig fallback local websocket host=\(backendHost):6001")
        return TrustoraRealtimeConfig(
            key: TrustoraRealtimeDefaults.pusherKey,
            host: backendHost,
            port: 6001,
            useTLS: defaultUseTLS,
            cluster: nil
        )
    }

    private func buildSocketURL(config: TrustoraRealtimeConfig) -> URL? {
        guard !config.key.isEmpty, !config.host.isEmpty else { return nil }
        var components = URLComponents()
        components.scheme = config.webSocketScheme
        components.host = config.host
        components.port = config.port
        components.path = "/app/\(config.key)"
        components.queryItems = [
            URLQueryItem(name: "protocol", value: "7"),
            URLQueryItem(name: "client", value: "ios-trustora"),
            URLQueryItem(name: "version", value: "1.0"),
            URLQueryItem(name: "flash", value: "false"),
        ]
        return components.url
    }

    private func sendEvent(_ object: [String: Any]) async {
        guard let socketTask else { return }
        guard JSONSerialization.isValidJSONObject(object) else { return }
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: []) else { return }
        guard let text = String(data: data, encoding: .utf8) else { return }

        do {
            try await socketTask.send(.string(text))
        } catch {
            log("socket send failed: \(error.localizedDescription)")
            await handleSocketDisconnected()
        }
    }

    private func startPingLoopIfNeeded() {
        pingTask?.cancel()
        let interval = max(15, min(60, Int(activityTimeout / 2)))
        pingTask = Task { [weak self] in
            guard let self else { return }
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(interval) * 1_000_000_000)
                guard self.isConnected else { return }
                await self.sendEvent([
                    "event": "pusher:ping",
                    "data": [:] as [String: Any],
                ])
            }
        }
    }

    private func handleSocketDisconnected() async {
        if socketTask == nil {
            return
        }
        log("socket disconnected; shouldRun=\(shouldRun)")

        isConnected = false
        socketID = nil
        socketTask?.cancel(with: .goingAway, reason: nil)
        socketTask = nil
        receiveLoopTask?.cancel()
        receiveLoopTask = nil
        pingTask?.cancel()
        pingTask = nil

        if !subscribedChannelNames.isEmpty {
            subscribedChannelNames = []
        }

        postOnMain(.trustoraRealtimeDisconnected, userInfo: nil)

        if shouldRun {
            await scheduleReconnect()
        }
    }

    private func scheduleReconnect() async {
        guard shouldRun else { return }
        reconnectAttempts += 1
        let delay = min(10.0, pow(2.0, Double(max(0, reconnectAttempts - 1))))
        log("schedule reconnect attempt=\(reconnectAttempts) delay=\(delay)s")
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        await connectIfNeeded()
    }

    private func defaultChannels(for userID: String) -> Set<TrustoraRealtimeChannel> {
        [
            TrustoraRealtimeChannel(baseName: "App.Models.User.\(userID)", type: .privateChannel),
            TrustoraRealtimeChannel(baseName: "chat.user.\(userID)", type: .privateChannel),
            TrustoraRealtimeChannel(baseName: "user.\(userID).briefs", type: .privateChannel),
            TrustoraRealtimeChannel(baseName: "online-users", type: .presence),
        ]
    }

    private func parseEventData(_ raw: Any?) -> Any {
        if let text = raw as? String {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return [:] as [String: Any] }
            if let data = trimmed.data(using: .utf8),
               let object = try? JSONSerialization.jsonObject(with: data, options: []) {
                if let nestedText = object as? String {
                    return parseEventData(nestedText)
                }
                return object
            }
            return trimmed
        }

        return raw ?? [:] as [String: Any]
    }

    private func normalizeEventName(_ eventName: String) -> String {
        var normalized = eventName.trimmingCharacters(in: .whitespacesAndNewlines)
        while normalized.hasPrefix(".") || normalized.hasPrefix("\\") {
            normalized.removeFirst()
        }
        return normalized.lowercased()
    }

    private func matchesEvent(
        _ eventName: String,
        normalized: String,
        rawCandidates: Set<String>,
        normalizedCandidates: Set<String>
    ) -> Bool {
        if rawCandidates.contains(eventName) {
            return true
        }
        return normalizedCandidates.contains(normalized)
    }

    private func isAIBriefGeneratedEvent(
        eventName: String,
        normalizedEvent: String,
        normalizedChannel: String,
        payload: Any
    ) -> Bool {
        if matchesEvent(
            eventName,
            normalized: normalizedEvent,
            rawCandidates: aiGeneratedEventsRaw,
            normalizedCandidates: aiGeneratedEventsNormalized
        ) {
            return true
        }

        if normalizedEvent.contains("aibriefgenerated")
            || (normalizedEvent.contains("aibrief") && normalizedEvent.contains("generated"))
        {
            return true
        }

        guard normalizedChannel.contains(".briefs") else {
            return false
        }

        let root = dictionaryValue(payload) ?? [:]
        let source = dictionaryValue(root["result"])
            ?? dictionaryValue(root["data"])
            ?? root
        let sourceResponsePayload = dictionaryValue(source["response_payload"])
        let rootResponsePayload = dictionaryValue(root["response_payload"])
        let sourceDebugResponsePayload = dictionaryValue(
            dictionaryValue(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = dictionaryValue(
            dictionaryValue(root["debug"])?["response_payload"]
        )

        let status = (
            stringValue(source["status"])
                ?? stringValue(root["status"])
                ?? stringValue(sourceResponsePayload?["status"])
                ?? stringValue(rootResponsePayload?["status"])
                ?? stringValue(sourceDebugResponsePayload?["status"])
                ?? stringValue(rootDebugResponsePayload?["status"])
                ?? ""
        ).uppercased()
        if status == "PROCESSING" || status == "CLARIFY" || status == "FINAL" {
            return true
        }

        let hasContent =
            source["questions"] != nil
            || root["questions"] != nil
            || source["final_brief"] != nil
            || source["final_brief_modular"] != nil
            || root["final_brief"] != nil
            || root["final_brief_modular"] != nil
            || source["brief_result_id"] != nil
            || root["brief_result_id"] != nil
            || sourceResponsePayload?["questions"] != nil
            || rootResponsePayload?["questions"] != nil
            || sourceDebugResponsePayload?["questions"] != nil
            || rootDebugResponsePayload?["questions"] != nil
            || sourceResponsePayload?["brief_result_id"] != nil
            || rootResponsePayload?["brief_result_id"] != nil
            || sourceDebugResponsePayload?["brief_result_id"] != nil
            || rootDebugResponsePayload?["brief_result_id"] != nil

        return hasContent
    }

    private func isAIBriefFailedEvent(
        eventName: String,
        normalizedEvent: String,
        normalizedChannel: String,
        payload: Any
    ) -> Bool {
        if matchesEvent(
            eventName,
            normalized: normalizedEvent,
            rawCandidates: aiFailedEventsRaw,
            normalizedCandidates: aiFailedEventsNormalized
        ) {
            return true
        }

        if normalizedEvent.contains("aibrieffailed")
            || (normalizedEvent.contains("aibrief") && normalizedEvent.contains("failed"))
        {
            return true
        }

        guard normalizedChannel.contains(".briefs") else {
            return false
        }

        let root = dictionaryValue(payload) ?? [:]
        let source = dictionaryValue(root["result"])
            ?? dictionaryValue(root["data"])
            ?? root
        let sourceResponsePayload = dictionaryValue(source["response_payload"])
        let rootResponsePayload = dictionaryValue(root["response_payload"])
        let sourceDebugResponsePayload = dictionaryValue(
            dictionaryValue(source["debug"])?["response_payload"]
        )
        let rootDebugResponsePayload = dictionaryValue(
            dictionaryValue(root["debug"])?["response_payload"]
        )

        let failureCandidates: [String?] = [
            stringValue(source["errorMessage"]),
            stringValue(source["error_message"]),
            stringValue(source["message"]),
            stringValue(source["error"]),
            stringValue(source["reason"]),
            stringValue(root["errorMessage"]),
            stringValue(root["error_message"]),
            stringValue(root["message"]),
            stringValue(root["error"]),
            stringValue(root["reason"]),
            stringValue(sourceResponsePayload?["errorMessage"]),
            stringValue(sourceResponsePayload?["error_message"]),
            stringValue(sourceResponsePayload?["message"]),
            stringValue(sourceResponsePayload?["error"]),
            stringValue(rootResponsePayload?["errorMessage"]),
            stringValue(rootResponsePayload?["error_message"]),
            stringValue(rootResponsePayload?["message"]),
            stringValue(rootResponsePayload?["error"]),
            stringValue(sourceDebugResponsePayload?["errorMessage"]),
            stringValue(sourceDebugResponsePayload?["error_message"]),
            stringValue(sourceDebugResponsePayload?["message"]),
            stringValue(sourceDebugResponsePayload?["error"]),
            stringValue(rootDebugResponsePayload?["errorMessage"]),
            stringValue(rootDebugResponsePayload?["error_message"]),
            stringValue(rootDebugResponsePayload?["message"]),
            stringValue(rootDebugResponsePayload?["error"]),
        ]

        return failureCandidates.contains { candidate in
            guard let candidate else { return false }
            return !candidate.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    private func postOnMain(_ name: Notification.Name, userInfo: [AnyHashable: Any]?) {
        NotificationCenter.default.post(name: name, object: nil, userInfo: userInfo)
    }

    private func dictionaryValue(_ value: Any?) -> [String: Any]? {
        if let dictionary = value as? [String: Any] {
            return dictionary
        }

        if let text = value as? String {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty, let data = trimmed.data(using: .utf8) else {
                return nil
            }
            if let object = try? JSONSerialization.jsonObject(with: data, options: []),
               let dictionary = object as? [String: Any]
            {
                return dictionary
            }
        }

        return nil
    }

    private func parseBroadcastAuthResponse(
        data: Data,
        response: URLResponse
    ) -> (auth: String, channelData: String?)? {
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            return nil
        }

        guard let dictionary = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            return nil
        }
        guard let auth = stringValue(dictionary["auth"]), !auth.isEmpty else {
            return nil
        }

        let channelData = stringValue(dictionary["channel_data"])
        return (auth, channelData)
    }

    private func urlEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

    private func log(_ message: String) {
        _ = message
    }

    private func logAuthFailure(
        variant: String,
        channelName: String,
        response: URLResponse,
        data: Data
    ) {
        let status = (response as? HTTPURLResponse)?.statusCode ?? -1
        let body = String(data: data, encoding: .utf8) ?? "<non-utf8>"
        log("authorize \(variant.uppercased()) failed channel=\(channelName) status=\(status) body=\(body)")
    }

    private func stringValue(_ value: Any?) -> String? {
        if let string = value as? String {
            let normalized = string.trimmingCharacters(in: .whitespacesAndNewlines)
            return normalized.isEmpty ? nil : normalized
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }

    private func intValue(_ value: Any?) -> Int? {
        if let int = value as? Int {
            return int
        }
        if let number = value as? NSNumber {
            return number.intValue
        }
        if let text = value as? String {
            return Int(text.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }

    private func boolValue(_ value: Any?) -> Bool? {
        if let bool = value as? Bool {
            return bool
        }
        if let number = value as? NSNumber {
            return number.boolValue
        }
        if let text = value as? String {
            switch text.lowercased() {
            case "1", "true", "yes":
                return true
            case "0", "false", "no":
                return false
            default:
                return nil
            }
        }
        return nil
    }

    private func doubleValue(_ value: Any?) -> Double? {
        if let double = value as? Double {
            return double
        }
        if let number = value as? NSNumber {
            return number.doubleValue
        }
        if let text = value as? String {
            return Double(text.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }
}

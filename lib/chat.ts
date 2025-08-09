import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

function normalizeMessage(raw: any): any {
    const sender = raw.sender || {};

    // parse attachments (fără content accidental pe attachment)
    const attachments = Array.isArray(raw.attachments)
        ? raw.attachments.map((a: any) => ({
            id: a.id,
            name: a.name,
            url: a.url,
            type: a.type,
            size: a.size,
            status: a.status || 'ok',
        }))
        : [];

    // derive senderName dacă lipsesc
    const senderName =
        raw.senderName ??
        raw.sender_name ??
        [sender.first_name ?? sender.firstName, sender.last_name ?? sender.lastName]
            .filter(Boolean)
            .join(' ');

    // --- FIX pentru read_by care vine ca string JSON ---
    let readByRaw = raw.readBy ?? raw.read_by ?? [];
    if (typeof readByRaw === 'string') {
        try {
            readByRaw = JSON.parse(readByRaw);
        } catch {
            readByRaw = [];
        }
    }
    const readBy: string[] = Array.isArray(readByRaw)
        ? readByRaw.map((r) => String(r)).filter(Boolean)
        : [];

    return {
        id: String(raw.id),
        groupId: String(raw.groupId ?? raw.group_id),

        sender_id: String(raw.senderId ?? raw.sender_id),
        senderName,
        senderAvatar: sender.avatar ?? sender.avatar_url ?? undefined,

        content: raw.content ?? '',
        originalContent: raw.originalContent ?? raw.original_content ?? '',
        isCensored: Boolean(raw.isCensored ?? raw.is_censored ?? false),

        attachments,

        // unifică timestamp
        timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
        created_at: raw.created_at, // păstrat pentru UI existent

        isRead: Boolean(raw.isRead ?? raw.is_read ?? false),
        readBy, // <— ACUM este mereu array de string‑uri (ex. ["1","5"])

        editedAt: raw.editedAt ?? raw.edited_at ?? undefined,
        replyTo: raw.replyTo ?? raw.reply_to_id ?? undefined,

        translations: raw.translations ?? undefined,
        sender, // UI-ul tău folosește message.sender.avatar în bubble
    };
}

export class ChatService {
    private static instance: ChatService;
    private echo: Echo<any> | null = null;
    private listeners: { [event: string]: Function[] } = {};
    private groupPresenceSubs: Record<string, any> = {};


    static getInstance(): ChatService {
        if (!ChatService.instance) ChatService.instance = new ChatService();
        return ChatService.instance;
    }



    connect(userId: string, token: string) {
        if (this.echo) return true;

        (window as any).Pusher = Pusher;

        this.echo = new Echo({
            broadcaster: 'pusher',
            key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            forceTLS: true,
            disableStats: true,
        });

        // Private user channel (mesaje, typing, etc.)
        this.echo.private(`chat.user.${userId}`)
            .listen('.MessageSent', (e: any) => this.emit('message', normalizeMessage(e.message)))
            .listen('.MessageUpdated',(e:any) => this.emit('messageUpdated', normalizeMessage(e.message)))
            .listen('UserJoined', (e: any) => this.emit('userJoined', e))
            .listen('UserLeft', (e: any) => this.emit('userLeft', e))
            .listen('GroupCreated', (e: any) => this.emit('groupCreated', e.group));

        // Presence global pentru “online-users”
        this.echo.join('online-users')
            .here((users: any[]) => this.emit('onlineUsersHere', users))
            .joining((user: any) => this.emit('userOnline', user))
            .leaving((user: any) => this.emit('userOffline', user));

        this.emit('connected');
        return true;
    }

    // Presence per‑grup (apelezi când intri într‑un grup)
    joinGroupPresence(groupId: string | number) {
        if (!this.echo) return;
        const key = String(groupId);
        if (this.groupPresenceSubs[key]) return;

        const sub = this.echo.join(`chat.group.${key}`)
            .here((users: any[]) => {
                this.emit('groupPresenceHere', { groupId: key, users });
            })
            .joining((user: any) => {
                this.emit('groupUserOnline', { groupId: key, user });
            })
            .leaving((user: any) => {
                this.emit('groupUserOffline', { groupId: key, user });
            });

        this.groupPresenceSubs[key] = sub;
    }

    leaveGroupPresence(groupId: string | number) {
        if (!this.echo) return;
        const key = String(groupId);
        if (this.groupPresenceSubs[key]) {
            this.echo.leave(`chat.group.${key}`);
            delete this.groupPresenceSubs[key];
        }
    }

    disconnect() {
        if (this.echo) {
            Object.keys(this.groupPresenceSubs).forEach(id => this.echo!.leave(`chat.group.${id}`));
            this.groupPresenceSubs = {};
            this.echo.disconnect();
            this.echo = null;
            this.emit('disconnected');
        }
    }

    async sendMessageViaApi(groupId: string, content: string, attachments?: any[]) {
        const censoredContent = this.censorMessage(content);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/groups/${groupId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({ content: censoredContent, attachments }),
        });

        const data = await res.json();
        return data.message;
    }

    async uploadAttachment(groupId: string | number, file: File, text = '') {
        const token = localStorage.getItem('auth_token');
        const fd = new FormData();
        fd.append('file', file);
        if (text) fd.append('message', text);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/groups/${groupId}/attachments`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });

        if (!res.ok) {
            let msg = 'Upload failed';
            try { const j = await res.json(); msg = j.message || msg; } catch {}
            throw new Error(msg);
        }

        const data = await res.json();
        return data.message; // are attachment.status = "scanning"
    }

    // sendTypingEvent(groupId: string, isTyping: boolean) {
    //     fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/groups/${groupId}/typing`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    //         },
    //         body: JSON.stringify({ isTyping }),
    //     });
    // }

    on(event: string, callback: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    private emit(event: string, data?: any) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }

    private censorMessage(content: string): string {
        let censoredContent = content;
        const phonePatterns = [
            /(\+4\d{1,2}[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/g,
            /(\b0\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b)/g,
            /(\b\d{4}[\s\-]?\d{3}[\s\-]?\d{3}\b)/g,
            /(\+\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4})/g,
        ];
        phonePatterns.forEach(p => (censoredContent = censoredContent.replace(p, '[NUMĂR TELEFON CENZURAT]')));
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        censoredContent = censoredContent.replace(emailPattern, '[EMAIL CENZURAT]');
        const contactKeywords = [
            /\b(whatsapp|telegram|skype|discord|viber)\s*:?\s*[^\s]+/gi,
            /\b(facebook|instagram|linkedin)\.com\/[^\s]+/gi,
            /\b(gmail|yahoo|outlook|hotmail)\.[^\s]+/gi,
        ];
        contactKeywords.forEach(p => (censoredContent = censoredContent.replace(p, '[CONTACT CENZURAT]')));
        return censoredContent;
    }
}

export const chatService = ChatService.getInstance();

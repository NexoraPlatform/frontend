import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export class ChatService {
    private static instance: ChatService;
    private echo: Echo<any> | null = null;
    private listeners: { [event: string]: Function[] } = {};

    static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }


    connect(userId: string, token: string) {
        if (this.echo) return true; // already connected

        (window as any).Pusher = Pusher; // Laravel Echo needs global Pusher

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
            wsHost: '127.0.0.1',
            wsPort: 3001,
            disableStats: true,
        });

        this.echo.join('online-users')
            .here((users: any[]) => {
                this.emit('onlineUsersHere', users);
            })
            .joining((user: any) => {
                this.emit('userOnline', user);
            })
            .leaving((user: any) => {
                this.emit('userOffline', user);
            });


        // Ascultă pentru toate grupurile userului, exemplu pentru grupurile în care este membru
        this.echo.private(`chat.user.${userId}`)
            .listen('MessageSent', (e: any) => this.emit('message', e.message))
            .listen('TypingEvent', (e: any) => this.emit('typing', e))
            .listen('UserJoined', (e: any) => this.emit('userJoined', e))
            .listen('UserLeft', (e: any) => this.emit('userLeft', e))
            .listen('GroupCreated', (e: any) => this.emit('groupCreated', e.group));

        this.emit('connected');

        return true;
    }

    disconnect() {
        if (this.echo) {
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
            body: JSON.stringify({
                content: censoredContent,
                attachments,
            }),
        });

        const data = await res.json();
        return data.message;
    }

    sendTypingEvent(groupId: string, isTyping: boolean) {
        // Poți trimite prin API sau WebSocket custom dacă ai
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/groups/${groupId}/typing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({ isTyping }),
        });
    }

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
        phonePatterns.forEach(pattern => {
            censoredContent = censoredContent.replace(pattern, '[NUMĂR TELEFON CENZURAT]');
        });

        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        censoredContent = censoredContent.replace(emailPattern, '[EMAIL CENZURAT]');

        const contactKeywords = [
            /\b(whatsapp|telegram|skype|discord|viber)\s*:?\s*[^\s]+/gi,
            /\b(facebook|instagram|linkedin)\.com\/[^\s]+/gi,
            /\b(gmail|yahoo|outlook|hotmail)\.[^\s]+/gi,
        ];
        contactKeywords.forEach(pattern => {
            censoredContent = censoredContent.replace(pattern, '[CONTACT CENZURAT]');
        });

        return censoredContent;
    }
}

export const chatService = ChatService.getInstance();

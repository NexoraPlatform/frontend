"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { chatService } from '@/lib/chat';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { toast } from 'sonner';

export interface ChatGroup {
    id: string;
    name: string;
    type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
    projectId?: string;
    members: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            avatar?: string;
        }
        role: string;
        isOnline: boolean;
        lastSeen?: string;
    }[];
    last_message?: {
        id: string;
        content: string;
        translations?: string;
        sender_id: string;
        timestamp: string;
        isRead: boolean;
    };
    unreadCount: number;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    groupId: string;
    sender_id: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    originalContent?: string;
    isCensored: boolean;
    translations?: string | Record<string, string>;
    attachments?: {
        id: string;
        name: string;
        url: string;
        type: string;
        size: number;
    }[];
    timestamp: string;
    isRead: boolean;
    readBy: string[];
    editedAt?: string;
    replyTo?: string;
}

export interface TypingUser {
    userId: string;
    userName: string;
    groupId: string;
}

interface ChatContextType {
    isPanelOpen: boolean;
    openPanel: (group?: ChatGroup) => void;
    closePanel: () => void;
    isUserOnline: (userId: string | number) => boolean;
    getGroupOnlineCount: (groupId: string | number) => number;
    upsertMessage: (msg: ChatMessage) => void;
    groups: ChatGroup[];
    activeGroup: ChatGroup | null;
    setActiveGroup: (group: ChatGroup | null) => void;
    createGroup: (data: {
        name: string;
        type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
        projectId?: string;
        participantIds: string[];
    }) => Promise<ChatGroup>;

    messages: { [groupId: string]: ChatMessage[] };
    sendMessage: (groupId: string, content: string, attachments?: any[]) => Promise<void>;
    editMessage: (messageId: string, newContent: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    markAsRead: (groupId: string, messageId?: string) => Promise<void>;

    typingUsers: TypingUser[];
    // sendTyping: (groupId: string, isTyping: boolean) => void;

    isConnected: boolean;
    connect: () => Promise<boolean>;
    disconnect: () => void;

    loading: boolean;
    loadingMessages: { [groupId: string]: boolean };

    getTotalUnreadCount: () => number;
    refreshGroups: () => Promise<void>;
    loadMessages: (groupId: string, page?: number, pageSize?: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { notifications, loading: notificationsLoading } = useNotifications();
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
    const [messages, setMessages] = useState<{ [groupId: string]: ChatMessage[] }>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<{ [groupId: string]: boolean }>({});
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [groupOnline, setGroupOnline] = useState<Record<string, string[]>>({});
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const groupsRef = useRef<ChatGroup[]>([]);

    const openPanel = (group?: ChatGroup) => {
        if (group) setActiveGroup(group);
        setIsPanelOpen(true);
    };
    const closePanel = () => setIsPanelOpen(false);

    const startedRef = React.useRef(false);
    const seenNotificationIdsRef = useRef<Set<string>>(new Set());
    const seededNotificationsRef = useRef(false);

    const upsertMessage = useCallback((msg: ChatMessage) => {
        setMessages(prev => {
            const gid = String(msg.groupId);
            const list = prev[gid] || [];
            const idx = list.findIndex(m => String(m.id) === String(msg.id));
            if (idx >= 0) {
                const clone = [...list];
                clone[idx] = msg;
                return { ...prev, [gid]: clone };
            }
            return { ...prev, [gid]: [...list, msg] };
        });
    }, []);

    const refreshGroups = useCallback(async () => {
        try {
            const response = await apiClient.getChatGroups();
            setGroups(response.groups || []);
        } catch (e) {
            console.error('Failed to load chat groups:', e);
        }
    }, []);

    const loadMessages = useCallback(async (groupId: string, page = 1, pageSize = 20) => {
        try {
            setLoadingMessages(prev => ({ ...prev, [groupId]: true }));
            const response = await apiClient.getChatMessages(groupId, page, pageSize);
            const newMessages = response.messages || [];

            setMessages(prev => {
                const existing = prev[groupId] || [];
                return {
                    ...prev,
                    [groupId]: page === 1 ? newMessages : [...newMessages, ...existing],
                };
            });
        } catch (e) {
            console.error('Failed to load messages:', e);
        } finally {
            setLoadingMessages(prev => ({ ...prev, [groupId]: false }));
        }
    }, []);

    const markAsRead = useCallback(async (groupId: string, messageId?: string) => {
        try {
            await apiClient.markChatMessagesAsRead(groupId, messageId);
            setGroups(prev => prev.map(group =>
                group.id === groupId ? { ...group, unreadCount: 0 } : group
            ));
            setMessages(prev => ({
                ...prev,
                [groupId]: (prev[groupId] || []).map(msg => ({ ...msg, isRead: true })),
            }));
        } catch (e) {
            console.error('Failed to mark as read:', e);
        }
    }, []);

    const initializeChat = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = apiClient.getToken() ?? localStorage.getItem('auth_token');
            if (token) {
                await chatService.connect(user.id, token);
                setIsConnected(true);

                if (!listenersReadyRef.current) {
                    setupEventListeners();
                    listenersReadyRef.current = true;
                }
            }

            await refreshGroups();
        } catch (e) {
            console.error('Failed to initialize chat:', e);
            toast.error('Nu s-a putut conecta la chat');
        } finally {
            setLoading(false);
        }
    }, [user, refreshGroups]);

    useEffect(() => {
        if (!user) return;
        if (!startedRef.current) {
            startedRef.current = true;
            initializeChat();
        }
        return () => {
            if (process.env.NODE_ENV === 'production') {
                chatService.disconnect();
            }
        };
    }, [user, initializeChat]);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        const onUnload = () => chatService.disconnect();
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, []);

    useEffect(() => {
        groupsRef.current = groups;
    }, [groups]);

    useEffect(() => {
        if (notificationsLoading) return;
        if (!seededNotificationsRef.current) {
            notifications.forEach(n => seenNotificationIdsRef.current.add(n.id));
            seededNotificationsRef.current = true;
            return;
        }

        const newMessageNotifications = notifications.filter(n => {
            if (seenNotificationIdsRef.current.has(n.id)) return false;
            seenNotificationIdsRef.current.add(n.id);
            return n.type === 'MESSAGE' && !n.isRead;
        });

        if (newMessageNotifications.length > 0) {
            void refreshGroups();
        }
    }, [notifications, notificationsLoading, refreshGroups]);

    const isUserOnline = useCallback((userId: string | number) => {
        return onlineUsers.includes(String(userId));
    }, [onlineUsers]);

    const getGroupOnlineCount = useCallback((groupId: string | number) => {
        const ids = groupOnline[String(groupId)] ?? [];
        return ids.length;
    }, [groupOnline]);

    const listenersReadyRef = React.useRef(false);

    const setupEventListeners = () => {
        chatService.on('connected', () => setIsConnected(true));
        chatService.on('disconnected', () => setIsConnected(false));

        // Presence global
        chatService.on('onlineUsersHere', (users: any[]) => {
            setOnlineUsers(users.map(u => String(u.id)));
        });
        chatService.on('userOnline', (user: any) => {
            setOnlineUsers(prev => [...new Set([...prev, String(user.id)])]);
        });
        chatService.on('userOffline', (user: any) => {
            setOnlineUsers(prev => prev.filter(id => id !== String(user.id)));
        });

        // Presence per‑grup
        chatService.on('groupPresenceHere', ({ groupId, users }: { groupId: string; users: any[] }) => {
            setGroupOnline(prev => ({ ...prev, [String(groupId)]: users.map(u => String(u.id)) }));
        });
        chatService.on('groupUserOnline', ({ groupId, user }: { groupId: string; user: any }) => {
            setGroupOnline(prev => {
                const key = String(groupId);
                const set = new Set([...(prev[key] ?? []), String(user.id)]);
                return { ...prev, [key]: Array.from(set) };
            });
        });
        chatService.on('groupUserOffline', ({ groupId, user }: { groupId: string; user: any }) => {
            setGroupOnline(prev => {
                const key = String(groupId);
                return { ...prev, [key]: (prev[key] ?? []).filter(id => id !== String(user.id)) };
            });
        });

        // ——— Chat events ———
        chatService.on('message', (message: ChatMessage) => {
            upsertMessage(message);
            setGroups(prev => prev.map(group =>
                String(group.id) === String(message.groupId)
                    ? {
                        ...group,
                        last_message: {
                            id: String(message.id),
                            content: String(message.content ?? ''),
                            translations: typeof message.translations === 'string' ? message.translations : undefined,
                            sender_id: String(message.sender_id),
                            timestamp: message.timestamp ?? new Date().toISOString(),
                            isRead: false,
                        },
                        unreadCount: message.sender_id !== user?.id
                            ? (group.unreadCount || 0) + 1
                            : group.unreadCount,
                        updated_at: message.timestamp ?? group.updated_at,
                    }
                    : group
            ));

            if (message.sender_id !== user?.id && (!activeGroup || activeGroup.id !== message.groupId)) {
                const openGroup = async () => {
                    const findGroup = () =>
                        groupsRef.current.find(g => String(g.id) === String(message.groupId));
                    let group = findGroup();
                    if (!group) {
                        await refreshGroups();
                        group = findGroup();
                    }
                    if (group) {
                        setActiveGroup(group);
                        openPanel(group);
                    }
                };

                toast(`💬 ${message.senderName}`, {
                    description: message.content.substring(0, 100),
                    onClick: () => void openGroup(),
                    action: {
                        label: 'Vezi',
                        onClick: () => void openGroup(),
                    },
                });
            }
        });

        chatService.on('messageUpdated', (message: ChatMessage) => {
            upsertMessage(message);
        });

        chatService.on('userJoined', (data: { groupId: string; user: any }) => {
            setGroups(prev => prev.map(group =>
                group.id === data.groupId
                    ? { ...group, members: [...group.members, { ...data.user, isOnline: onlineUsers.includes(data.user.id) }] }
                    : group
            ));
        });

        chatService.on('userLeft', (data: { groupId: string; userId: string }) => {
            setGroups(prev => prev.map(group =>
                group.id === data.groupId
                    ? { ...group, members: group.members.filter(p => p.id !== data.userId) }
                    : group
            ));
        });

        chatService.on('groupCreated', (group: ChatGroup) => {
            setGroups(prev => [group, ...prev]);
            toast.success('Grup creat cu succes');
        });
    };

    useEffect(() => {
        if (!activeGroup) return;
        chatService.joinGroupPresence(activeGroup.id);
        return () => chatService.leaveGroupPresence(activeGroup.id);
    }, [activeGroup]);

    const sendMessage = useCallback(async (groupId: string, content: string, attachments?: any[]) => {
        try {
            const message = await chatService.sendMessageViaApi(groupId, content, attachments);

            setMessages(prev => ({
                ...prev,
                [groupId]: [...(prev[groupId] || []), message],
            }));

            setGroups(prev => prev.map(g =>
                String(g.id) === String(groupId)
                    ? {
                        ...g,
                        last_message: {
                            id: String(message.id),
                            content: String(message.content ?? ''),
                            sender_id: String(message.sender_id),
                            timestamp: message.timestamp ?? new Date().toISOString(),
                            isRead: true,
                            translations: typeof message.translations === 'string' ? message.translations : undefined,
                        },
                        updated_at: message.timestamp ?? g.updated_at,
                    }
                    : g
            ));
        } catch (e) {
            console.error('Failed to send message:', e);
            toast.error('Nu s-a putut trimite mesajul');
        }
    }, []);

    const editMessage = useCallback(async (messageId: string, newContent: string) => {
        try {
            await apiClient.editChatMessage(messageId, newContent);
            setMessages(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(groupId => {
                    updated[groupId] = updated[groupId].map(msg =>
                        msg.id === messageId ? { ...msg, content: newContent, editedAt: new Date().toISOString() } : msg
                    );
                });
                return updated;
            });
        } catch (e) {
            console.error('Failed to edit message:', e);
            toast.error('Nu s-a putut edita mesajul');
        }
    }, []);

    const deleteMessage = useCallback(async (messageId: string) => {
        try {
            await apiClient.deleteChatMessage(messageId);
            setMessages(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(groupId => {
                    updated[groupId] = updated[groupId].filter(msg => msg.id !== messageId);
                });
                return updated;
            });
        } catch (e) {
            console.error('Failed to delete message:', e);
            toast.error('Nu s-a putut șterge mesajul');
        }
    }, []);

    const createGroup = useCallback(async (data: {
        name: string;
        type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
        projectId?: string;
        participantIds: string[];
    }): Promise<ChatGroup> => {
        try {
            const response = await apiClient.createChatGroup(data);
            const newGroup = response.group;
            setGroups(prev => [newGroup, ...prev]);
            return newGroup;
        } catch (e) {
            console.error('Failed to create group:', e);
            throw e;
        }
    }, []);

    const connect = async (): Promise<boolean> => {
        if (!user) return false;
        try {
            const token = apiClient.getToken() ?? localStorage.getItem('auth_token');
            if (token) {
                return await chatService.connect(user.id, token);
            }
            return false;
        } catch (e) {
            console.error('Failed to connect to chat:', e);
            return false;
        }
    };

    const disconnect = () => {
        chatService.disconnect();
        setIsConnected(false);
    };

    const getTotalUnreadCount = () => groups.reduce((total, g) => total + g.unreadCount, 0);

    const value: ChatContextType = {
        isUserOnline,
        getGroupOnlineCount,
        isPanelOpen,
        openPanel,
        closePanel,
        groups,
        activeGroup,
        setActiveGroup,
        createGroup,
        messages,
        sendMessage,
        editMessage,
        deleteMessage,
        markAsRead,
        typingUsers,
        isConnected,
        connect,
        disconnect,
        loading,
        loadingMessages,
        getTotalUnreadCount,
        refreshGroups,
        loadMessages,
        upsertMessage,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) throw new Error('useChat must be used within ChatProvider');
    return context;
}

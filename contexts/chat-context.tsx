"use client";

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import { chatService } from '@/lib/chat';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
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
    lastMessage?: {
        id: string;
        content: string;
        sender_id: string;
        timestamp: string;
        isRead: boolean;
    };
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
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
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
    const [messages, setMessages] = useState<{ [groupId: string]: ChatMessage[] }>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<{ [groupId: string]: boolean }>({});
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [groupOnline, setGroupOnline] = useState<Record<string, string[]>>({});


    useEffect(() => {
        if (user) initializeChat();
        return () => {
            chatService.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (user) {
            initializeChat();
        }
        return () => chatService.disconnect();
    }, [user]);

    const upsertMessage = (msg: ChatMessage) => {
        setMessages(prev => {
            const gid = String(msg.groupId);
            const list = prev[gid] || [];
            const idx = list.findIndex(m => String(m.id) === String(msg.id)); // <- comparație normalizată
            if (idx >= 0) {
                const clone = [...list];
                clone[idx] = msg; // replace
                return { ...prev, [gid]: clone };
            }
            return { ...prev, [gid]: [...list, msg] }; // append
        });
    };

    const isUserOnline = useCallback((userId: string | number) => {
        return onlineUsers.includes(String(userId));
    }, [onlineUsers]);

    const getGroupOnlineCount = useCallback((groupId: string | number) => {
        const ids = groupOnline[String(groupId)] ?? [];
        return ids.length;
    }, [groupOnline]);

    const initializeChat = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            if (token) {
                await chatService.connect(user.id, token);
                setIsConnected(true);
                setupEventListeners();
                await refreshGroups();
            }
        } catch (e) {
            console.error('Failed to initialize chat:', e);
            toast.error('Nu s-a putut conecta la chat');
        } finally {
            setLoading(false);
        }
    };

    // Reflectă onlineUsers în starea grupurilor (marchează isOnline)
    useEffect(() => {
        setGroups(prev =>
            prev.map(g => ({
                ...g,
                members: g.members.map(m => ({
                    ...m,
                    isOnline: onlineUsers.includes(m.id),
                })),
            }))
        );
    }, [onlineUsers]);

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
            // setMessages(prev => ({
            //     ...prev,
            //     [message.groupId]: [...(prev[message.groupId] || []), message],
            // }));

            setGroups(prev => prev.map(group =>
                group.id === message.groupId
                    ? {
                        ...group,
                        lastMessage: {
                            id: message.id,
                            content: message.content,
                            sender_id: message.sender_id,
                            timestamp: message.timestamp,
                            isRead: false,
                        },
                        unreadCount: message.sender_id !== user?.id ? group.unreadCount + 1 : group.unreadCount,
                    }
                    : group
            ));

            if (message.sender_id !== user?.id && (!activeGroup || activeGroup.id !== message.groupId)) {
                toast(`💬 ${message.senderName}`, {
                    description: message.content.substring(0, 100),
                    action: {
                        label: 'Vezi',
                        onClick: () => {
                            const group = groups.find(g => g.id === message.groupId);
                            if (group) setActiveGroup(group);
                        },
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
        chatService.joinGroupPresence(activeGroup.id);   // <-- must run
        return () => chatService.leaveGroupPresence(activeGroup.id);
    }, [activeGroup]);

    const connect = async (): Promise<boolean> => {
        if (!user) return false;
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const ok = await chatService.connect(user.id, token);
                if (ok) chatService.joinGroupPresence('online-users');
                return ok;
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

    const refreshGroups = async () => {
        try {
            const response = await apiClient.getChatGroups();
            setGroups(response.groups || []);
        } catch (e) {
            console.error('Failed to load chat groups:', e);
        }
    };

    const createGroup = async (data: {
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
    };

    const loadMessages = async (groupId: string, page = 1, pageSize = 20) => {
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
    };

    const sendMessage = async (groupId: string, content: string, attachments?: any[]) => {
        try {
            const message = await chatService.sendMessageViaApi(groupId, content, attachments);
            setMessages(prev => ({
                ...prev,
                [groupId]: [...(prev[groupId] || []), message],
            }));
        } catch (e) {
            console.error('Failed to send message:', e);
            toast.error('Nu s-a putut trimite mesajul');
        }
    };

    const editMessage = async (messageId: string, newContent: string) => {
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
    };

    const deleteMessage = async (messageId: string) => {
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
    };

    const markAsRead = async (groupId: string, messageId?: string) => {
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
    };

    // const sendTyping = (groupId: string, isTyping: boolean) => {
    //     chatService.sendTypingEvent(groupId, isTyping);
    // };

    const getTotalUnreadCount = () => groups.reduce((total, g) => total + g.unreadCount, 0);

    const value: ChatContextType = {
        // online helpers
        isUserOnline,
        getGroupOnlineCount,

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
        // sendTyping,
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

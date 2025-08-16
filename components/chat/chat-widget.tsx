"use client";

import {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ArrowLeft,
    MessageCircle,
    Send,
    Paperclip,
    Smile,
    Users,
    Plus,
    X,
    Edit,
    Trash2,
    EyeOff,
    AlertTriangle,
    Clock,
    Check,
    CheckCheck,
    Phone,
    Video,
    Settings,
    Search,
    Minimize2,
    Maximize2
} from 'lucide-react';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import apiClient from "@/lib/api";
import {chatService} from "@/lib/chat";
import Image from 'next/image';
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatMessage {
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
    read_by?: string[] | string | null;
    editedAt?: string;
    replyTo?: string;
}

const EmojiPicker = dynamic(() => import("@/components/emoji-picker"), {
    ssr: false,
});

function getReaders(msg: any, currentUserId?: string | number) {
    let raw = msg?.read_by ?? msg?.readBy ?? [];
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            raw = [];
        }
    }
    const senderId = String(msg?.sender_id ?? msg?.sender?.id ?? '');
    const me = currentUserId != null ? String(currentUserId) : '';

    return Array.isArray(raw)
        ? raw
            .map((r) => String(r))
            .filter(Boolean)
            .filter((id) => id !== senderId)
            .filter((id) => id !== me)
        : [];
}

export function ChatWidget() {
    const { user } = useAuth();
    const {
        groups,
        activeGroup,
        setActiveGroup,
        createGroup,
        messages,
        sendMessage,
        markAsRead,
        typingUsers,
        // sendTyping,
        isConnected,
        loadingMessages,
        getTotalUnreadCount,
        loadMessages,
        refreshGroups,
        getGroupOnlineCount,
        isUserOnline,
        upsertMessage,
        isPanelOpen,
        openPanel,
        closePanel,
    } = useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const onPickFile = () => fileInputRef.current?.click();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const pageRef = useRef(1);
    const [emojiOpen, setEmojiOpen] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeGroup]);

    // Load messages when active group changes
    useEffect(() => {
        if (activeGroup) {
            pageRef.current = 1;
            loadMessages(activeGroup.id, 1, 10); // încarcă ultimele 20 la început
            markAsRead(activeGroup.id);
        }
    }, [activeGroup, loadMessages, markAsRead]);

    const onlineMembers = useMemo(() => {
        if (!activeGroup) return [];
        return activeGroup.members.filter((m: any) => {
            const uid = String(m.user?.id ?? m.id); // fallback defensiv
            return isUserOnline(uid);
        });
    }, [activeGroup, isUserOnline]);

    const activeGroupMessages = useMemo(() => {
        if (!activeGroup) return [];
        return messages[activeGroup.id] || [];
    }, [activeGroup, messages]);

    const normalizeReaders = (msg: any): string[] => {
        let rb = msg?.read_by ?? msg?.readBy ?? [];

        // dacă vine ca string JSON, îl parsam
        if (typeof rb === 'string') {
            try {
                rb = JSON.parse(rb);
            } catch {
                rb = [];
            }
        }

        if (Array.isArray(rb)) {
            return rb.map((r) => String(r)).filter(Boolean);
        }
        return [];
    };


    const lastSeenIndexByUser = useMemo(() => {
        if (!activeGroup) return {};
        const map: Record<string, number> = {};

        activeGroupMessages.forEach((msg: any, idx: number) => {
            const readers = getReaders(msg, user?.id);
            readers.forEach((rid) => {
                map[String(rid)] = idx; // memorăm cel mai recent index văzut
            });
        });

        return map;
    }, [activeGroup, activeGroupMessages, user?.id]);

    const seenByMembersForMessage = (msgIndex: number) => {
        if (!activeGroup) return [];
        return activeGroup.members
            .filter((m: any) => {
                const uid = String(m.user?.id);
                if (!uid || uid === String(user?.id)) return false;
                return lastSeenIndexByUser[uid] === msgIndex;
            })
            // opțional: sortează ca să ai un ordin stabil
            .sort((a: any, b: any) =>
                `${a.user.firstName} ${a.user.lastName}`.localeCompare(
                    `${b.user.firstName} ${b.user.lastName}`
                )
            );
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeGroup) return;
        setUploading(true);
        try {
            // OPTIONAL: client-side pre-check size/mime
            if (!['application/pdf', 'text/plain'].includes(file.type) && !file.type.startsWith('image/')) {
                throw new Error('Tip fișier neacceptat (doar PDF/imagini)');
            }

            const msg = await chatService.uploadAttachment(activeGroup.id, file);
            upsertMessage(msg);
            // add message to state (server already returns a ChatMessage)
            // if your context has sendMessage side-effects, just update:
            // But easiest:
            // setMessages(prev => ({ ...prev, [activeGroup.id]: [...(prev[activeGroup.id]||[]), msg] }))
            // You already have a listener on MessageSent; if you also broadcast, it will arrive automatically.
        } catch (err:any) {
            // show a "file not sent" message bubble OR toast
            console.error(err);
            // Optional bubble:
            // setMessages(prev => ({
            //  ...prev,
            //  [activeGroup.id]: [...(prev[activeGroup.id]||[]), {
            //      id: crypto.randomUUID(),
            //      groupId: activeGroup.id,
            //      sender_id: user!.id,
            //      senderName: user!.firstName,
            //      content: `Fișierul nu poate fi trimis: ${err.message}`,
            //      isCensored: false,
            //      timestamp: new Date().toISOString(),
            //      readBy: [],
            //      attachments: [],
            //  }]
            // }))
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;

        if (!activeGroup || loadingMessages[activeGroup.id] || isLoadingMore.current) return;

        // Scroll to top trigger
        if (container.scrollTop === 0) {
            isLoadingMore.current = true;

            const previousScrollHeight = container.scrollHeight;

            const nextPage = pageRef.current + 1;

            loadMessages(activeGroup.id, nextPage, 10).then(() => {
                pageRef.current = nextPage;
                isLoadingMore.current = false;

                // Restore scroll position
                requestAnimationFrame(() => {
                    const newScrollHeight = container.scrollHeight;
                    container.scrollTop = newScrollHeight - previousScrollHeight;
                });
            });
        }
    };


    // Handle typing indicators
    const handleTyping = () => {
        if (!activeGroup || !user) return;

        // if (!isTyping) {
        //     setIsTyping(true);
        //     sendTyping(activeGroup.id, true);
        // }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        // typingTimeoutRef.current = setTimeout(() => {
        //     setIsTyping(false);
        //     sendTyping(activeGroup.id, false);
        // }, 1000);
    };
    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeGroup) return;

        // Check for sensitive information
        // if (detectSensitiveInfo(messageInput)) {
        //     setShowSensitiveWarning(true);
        //     return;
        // }

        sendMessage(activeGroup.id, messageInput.trim());
        setMessageInput('');

        // Stop typing indicator
        // if (isTyping) {
        //     setIsTyping(false);
        //     sendTyping(activeGroup.id, false);
        // }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else {
            handleTyping();
        }
    };

    const autoResizeTextarea = () => {
        const el = messageInputRef.current;
        if (el) {
            el.style.height = 'auto';
            const newHeight = Math.min(el.scrollHeight, 150);
            el.style.height = `${newHeight}px`;
        }
    };

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.members.some(p =>
            `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const activeGroupTyping = typingUsers.filter(t => t.groupId === activeGroup?.id);
    const totalUnread = getTotalUnreadCount();

    const getGroupIcon = (type: string) => {
        switch (type) {
            case 'PROJECT': return '🚀';
            case 'PROVIDER_ONLY': return '👥';
            case 'DIRECT': return '💬';
            default: return '💬';
        }
    };

    if (!user) return null;

    const insertAtCursor = (text: string) => {
        const el = messageInputRef.current;
        if (!el) { setMessageInput(v => v + text); return; }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const next = el.value.slice(0, start) + text + el.value.slice(end);
        setMessageInput(next);
        requestAnimationFrame(() => {
            el.focus();
            const caret = start + text.length;
            el.setSelectionRange(caret, caret);
        });
    };

    const handleEmojiSelect = (emoji: any) => {
        const toInsert = emoji?.native || "";
        if (toInsert) insertAtCursor(toInsert);
        setEmojiOpen(false);
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => (isPanelOpen ? closePanel() : openPanel())}
                    className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 relative"
                    aria-label="Deschide chat-ul"
                >
                    <MessageCircle className="w-6 h-6" />
                    {totalUnread > 0 && (
                        <Badge className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Chat Widget */}
            {isPanelOpen && (
                <Card className="fixed bottom-24 right-6 w-96 h-auto shadow-2xl border-2 z-40 bg-background">
                    {/* Header */}
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {activeGroup && (<Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveGroup(null)}
                                    className="p-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>)}
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <CardTitle className="text-lg">
                                    {activeGroup ? activeGroup.name : 'Chat'}
                                </CardTitle>
                                {activeGroup && (
                                    <Badge variant="outline" className="text-xs">
                                        {getGroupIcon(activeGroup.type)} {activeGroup.members.length}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="w-8 h-8"
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => closePanel()}
                                    className="w-8 h-8"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {activeGroup && (
                            <CardDescription className="flex items-center space-x-2">
                                <div>
                                    <div className="flex gap-2">
                                        <TooltipProvider delayDuration={150}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                        <span>{activeGroup.members.length} participanți</span>

                                            </TooltipTrigger>
                                            <TooltipContent className="p-2">
                                            {activeGroup.members.map((m: any) => (
                                                <div key={m.user.id} className="flex items-center gap-2 text-sm">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={m.user.avatar} />
                                                        <AvatarFallback className="text-[8px]">
                                                            {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>
                                                                {m.user.firstName} {m.user.lastName}
                                                        {/* marchează-l pe userul curent */}
                                                        {String(m.user.id) === String(user?.id) && " (tu)"}
                                                              </span>
                                                </div>
                                            ))}
                                            </TooltipContent>
                                        </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            <span className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <TooltipProvider delayDuration={150}>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className="cursor-default">
                                                        {onlineMembers.length} online
                                                      </span>
                                                    </TooltipTrigger>

                                                    <TooltipContent className="p-2">
                                                      {onlineMembers.length === 0 ? (
                                                          <div className="text-sm text-muted-foreground">Nimeni online acum</div>
                                                      ) : (
                                                          <div className="space-y-1">
                                                              {onlineMembers.map((m: any) => (
                                                                  <div key={m.user.id} className="flex items-center gap-2 text-sm">
                                                                      <Avatar className="w-5 h-5">
                                                                          <AvatarImage src={m.user.avatar} />
                                                                          <AvatarFallback className="text-[8px]">
                                                                              {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                                                                          </AvatarFallback>
                                                                      </Avatar>
                                                                      <span>
                                                                {m.user.firstName} {m.user.lastName}
                                                                          {/* marchează-l pe userul curent */}
                                                                          {String(m.user.id) === String(user?.id) && " (tu)"}
                                                              </span>
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      )}
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <TooltipProvider delayDuration={150}>
                                            <div className="flex">
                                                {activeGroup.members.slice(0, 6).map((participant: any) => {
                                                    const fullName = `${participant.user.firstName} ${participant.user.lastName}`;
                                                    return (
                                                        <Tooltip key={participant.id}>
                                                            <TooltipTrigger asChild>
                                                                <Avatar className="w-6 h-6 border-2 border-background">
                                                                    <AvatarImage src={participant.user.avatar} />
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {participant.user.firstName[0]}
                                                                        {participant.user.lastName[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <span className="font-medium">{fullName}</span>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}

                                                {activeGroup.members.length > 6 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="w-6 h-6 bg-muted border-2 border-background rounded-full flex items-center justify-center text-xs">
                                                                +{activeGroup.members.length - 6}
                                                            </div>
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TooltipProvider>
                                    </div>
                                </div>

                            </CardDescription>
                        )}
                    </CardHeader>

                    {!isMinimized && (
                        <CardContent className="p-0 flex flex-col">
                            {!activeGroup ? (
                                /* Groups List */
                                <div className="flex-1 flex flex-col">
                                    <div className="p-4 border-b">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                <Input
                                                    placeholder="Caută conversații..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                            {/*<CreateGroupDialog onGroupCreated={refreshGroups} />*/}
                                        </div>
                                    </div>

                                    <ScrollArea className="flex-1" >
                                        <div className="p-2 space-y-1">
                                            {filteredGroups.map(group => {
                                                const isUnread = (group.unreadCount ?? 0) > 0;

                                                return (
                                                    <div
                                                        key={group.id}
                                                        onClick={() => setActiveGroup(group)}
                                                        className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="relative">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                                    {getGroupIcon(group.type)}
                                                                </div>
                                                            </div>

                                                            {/* <- tot textul din acest container devine bold când e unread */}
                                                            <div className={`flex-1 min-w-0 ${isUnread ? 'font-semibold' : ''}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="truncate" title={group.name}>
                                                                        {group.name}
                                                                        {group.unreadCount > 0 && (
                                                                            <Badge className="ms-2 bg-red-500 text-white">
                                                                                {group.unreadCount}
                                                                            </Badge>
                                                                        )}
                                                                    </h4>

                                                                    {group.last_message && (
                                                                        <span
                                                                            className={`text-xs ${
                                                                                isUnread ? 'text-foreground' : 'text-muted-foreground'
                                                                            }`}
                                                                            title={new Date(group.last_message.timestamp).toLocaleString('ro-RO')}
                                                                        >
                {formatDistanceToNow(new Date(group.last_message.timestamp), {
                    addSuffix: true,
                    locale: ro,
                })}
              </span>
                                                                    )}
                                                                </div>

                                                                {group.last_message && (
                                                                    <p
                                                                        className={`text-sm truncate ${
                                                                            isUnread ? 'text-foreground' : 'text-muted-foreground'
                                                                        }`}
                                                                        title={group.last_message.content ?? '---'}
                                                                    >
                                                                        {group.last_message.content ?? '---'}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center space-x-1 mt-1">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {group.type === 'PROJECT'
                                                                            ? 'Proiect'
                                                                            : group.type === 'PROVIDER_ONLY'
                                                                                ? 'Prestatori'
                                                                                : 'Direct'}
                                                                    </Badge>
                                                                    <span
                                                                        className={`text-xs ${
                                                                            isUnread ? 'text-foreground' : 'text-muted-foreground'
                                                                        }`}
                                                                    >
              {group.members.length} membri
            </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {filteredGroups.length === 0 && (
                                                <div className="text-center py-8">
                                                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                    <p className="text-muted-foreground">Nu ai conversații</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            ) : (
                                /* Active Chat */
                                <div className="flex-1 flex flex-col">
                                    {/* Chat Header */}
                                    {/*<div className="ps-4 border-b">*/}
                                    {/*    <div className="flex items-center justify-between">*/}
                                    {/*        <Button*/}
                                    {/*            variant="ghost"*/}
                                    {/*            size="sm"*/}
                                    {/*            onClick={() => setActiveGroup(null)}*/}
                                    {/*            className="p-1"*/}
                                    {/*        >*/}
                                    {/*            <X className="w-4 h-4" />*/}
                                    {/*        </Button>*/}
                                    {/*        <div className="flex items-center space-x-2">*/}
                                    {/*            <Button variant="ghost" size="icon" className="w-8 h-8">*/}
                                    {/*                <Phone className="w-4 h-4" />*/}
                                    {/*            </Button>*/}
                                    {/*            <Button variant="ghost" size="icon" className="w-8 h-8">*/}
                                    {/*                <Video className="w-4 h-4" />*/}
                                    {/*            </Button>*/}
                                    {/*            <Button variant="ghost" size="icon" className="w-8 h-8">*/}
                                    {/*                <Settings className="w-4 h-4" />*/}
                                    {/*            </Button>*/}
                                    {/*        </div>*/}
                                    {/*    </div>*/}

                                    {/*</div>*/}

                                    {/* Messages */}
                                    <ScrollArea
                                        className="p-4 min-h-0"
                                        viewportProps={{ onScroll: handleScroll, ref: scrollRef }}
                                    >
                                        <div className="space-y-4">
                                            {activeGroupMessages.map((message: any, index: number) => (
                                                <MessageBubble
                                                    key={index}
                                                    message={message}
                                                    isOwn={Number(message.sender_id) === Number(user?.id)}
                                                    showAvatar={message.sender_id !== user?.id}
                                                    seenBy={seenByMembersForMessage(index)}
                                                />
                                            ))}

                                            {/* Typing Indicators */}
                                            {activeGroupTyping.length > 0 && (
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                    </div>
                                                    <span>
                            {activeGroupTyping.map(t => t.userName).join(', ')} scrie...
                          </span>
                                                </div>
                                            )}

                                            <div ref={messagesEndRef} />
                                        </div>
                                    </ScrollArea>

                                    {/* Message Input */}
                                    <div className="p-4 border-t overflow-hidden">
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                                                <div className="rounded-xl bg-white/90 p-3 text-sm">
                                                    Se încarcă și se verifică fișierul…
                                                </div>
                                            </div>
                                        )}
                                        {showSensitiveWarning && (
                                            <Alert variant="destructive" className="mb-3">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    <div className="flex items-center justify-between">
                                                        <span>Mesajul conține informații de contact care vor fi cenzurate</span>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    sendMessage(activeGroup.id, messageInput.trim());
                                                                    setMessageInput('');
                                                                    setShowSensitiveWarning(false);
                                                                }}
                                                            >
                                                                Trimite Oricum
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setShowSensitiveWarning(false)}
                                                            >
                                                                Anulează
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex items-end space-x-2">
                                            <div className="flex-1">
                                                <Textarea
                                                    ref={messageInputRef}
                                                    value={messageInput}
                                                    onChange={(e) => {
                                                        setMessageInput(e.target.value);
                                                        autoResizeTextarea();
                                                    }}
                                                    onKeyDown={handleKeyPress}
                                                    placeholder="Scrie un mesaj..."
                                                    className="resize-none min-h-[10px]"
                                                    rows={1}
                                                    style={{
                                                        overflow: 'scroll',
                                                        maxHeight: '70px',
                                                        height: 'auto'
                                                    }}
                                                    disabled={!isConnected}
                                                />
                                            </div>
                                            <div className="flex space-x-1">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*,.pdf, .txt"
                                                    className="hidden"
                                                    onChange={onFileChange}
                                                />
                                                <Button variant="ghost" size="icon" className="w-8 h-8"
                                                        onClick={onPickFile} disabled={!isConnected || uploading}
                                                >
                                                    <Paperclip className="w-4 h-4" />
                                                </Button>
                                                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="w-8 h-8">
                                                            <Smile className="w-4 h-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" side="top" className="p-0 border-0 rounded-2xl shadow-xl overflow-hidden !w-full">
                                                        <EmojiPicker
                                                            locale="ro"
                                                            navPosition="top"
                                                            previewPosition="bottom"
                                                            skinTonePosition="preview"
                                                            searchPosition="sticky"
                                                            perLine={7}
                                                            emojiSize={24}
                                                            onEmojiSelect={handleEmojiSelect}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                <Button
                                                    onClick={handleSendMessage}
                                                    disabled={!messageInput.trim() || !isConnected}
                                                    className="w-8 h-8"
                                                    size="icon"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            )}
        </>
    );
}

// Message Bubble Component
function MessageBubble({
                           message,
                           isOwn,
                           showAvatar,
                           seenBy = [],
                       }: {
    message: any;
    isOwn: boolean;
    showAvatar: boolean;
    seenBy?: any[];

}) {

    const [showActions, setShowActions] = useState(false);
    const { user } = useAuth();

    const userLang = user?.language ?? 'ro';
    const translated = message.translations?.[userLang];

    const getOwnMessageStatusIcon = (m: ChatMessage) => {
        if (String(m.sender_id) !== String(user?.id)) return null;
        const readersCount = getReaders(m, user?.id).length;
        let readers: string[] = [];
        if (typeof m.read_by === "string") {
            try {
                readers = JSON.parse(m.read_by);
            } catch {
                readers = [];
            }
        } else if (Array.isArray(m.read_by)) {
            readers = m.read_by;
        }

        const onlyMeRead = readers.length === 1 && readers[0] === String(user?.id);
        if (readersCount === 0) {
            if ((!m.isRead && (!m.read_by || (typeof m.read_by === 'string' && (m.read_by.length === 0)))) || onlyMeRead) {
                return (
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <CheckCheck className="w-4 h-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                                Mesaj trimis, dar nu a fost încă citit
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
            return null;
        }

        return null;
    };

    return (
        <>
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            {isOwn && (
                <div className="flex items-end space-x-1 me-2">
                    {message.editedAt && <span>editat</span>}
                    {getOwnMessageStatusIcon(message)}
                </div>
            )}
        <div className={`flex items-end space-x-2 max-w-[80%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {showAvatar && !isOwn && (
                <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback className="text-xs">
                        {message.sender.firstName[0]} {message.sender.lastName[0]}
                    </AvatarFallback>
                </Avatar>
            )}

            <div
                className={`relative px-4 py-2 rounded-2xl ${
                    isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                }`}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                {!isOwn && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                        {message.senderName}
                    </div>
                )}

                <div className="text-sm">
                    {message.attachments?.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {message.attachments.map((att:any, index: number) => (
                                <div key={att.id} className="flex items-center gap-2 text-xs">
                                    {att.status === 'scanning' && <span className="italic">Se scanează…</span>}
                                    {att.status === 'blocked_malware' && <span className="text-red-600">❌ Fișier blocat (malware)</span>}
                                    {att.status === 'blocked_pii' && <span className="text-red-600">❌ Fișier blocat (date contact)</span>}
                                    {att.status === 'scan_timeout' && <span className="text-amber-600">⚠️ Scan timeout</span>}
                                    {att.status === 'ok' && (
                                        att.type?.startsWith('image/')
                                            ? <a href={att.url} target="_blank" className="underline hover:opacity-80">
                                                <Image src={att.url} alt={att.name} width={160} height={120}
                                                       className="max-w-[160px] max-h-[120px] rounded border object-contain" />
                                            </a>
                                            : <a href={att.url} target="_blank" className={`underline hover:opacity-80 ${isOwn && 'text-white'}`}>📄 {att.name}</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div>{translated ?? message.content}</div>
                    {message.isCensored && (
                        <div className="flex items-center space-x-1 mt-1 text-xs opacity-70">
                            <EyeOff className="w-3 h-3" />
                            <span>Mesaj cenzurat</span>
                        </div>
                    )}
                </div>

                <div className={`flex items-center justify-between mt-1 text-xs ${
                    isOwn ? 'text-blue-100' : 'text-muted-foreground'
                }`}>
  <span>
    {formatDistanceToNow(new Date(message.created_at), {
        addSuffix: true,
        locale: ro
    })}
  </span>
                </div>

                {/* Message Actions */}
                {showActions && (
                    <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} transform ${isOwn ? '-translate-x-full' : 'translate-x-full'} flex space-x-1 bg-background border rounded-lg shadow-lg p-1`}>
                        <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Edit className={`w-3 h-3 ${isOwn && 'text-blue-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className={`w-6 h-6 ${isOwn && 'text-blue-600'}`}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                )}

            </div>

        </div>

    </div>
            {isOwn && seenBy.length > 0 && (
                <div
                    className={`!mt-2 flex gap-1 ${isOwn ? 'justify-end pr-2' : 'justify-start'} items-center`}
                >
                    <TooltipProvider delayDuration={150}>
                        {seenBy.map((m: any) => {
                            const fullName = `${m.user.firstName} ${m.user.lastName}`;
                            return (
                                <Tooltip key={m.user.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="w-5 h-5 ring-2 ring-background">
                                            <AvatarImage src={m.user.avatar} />
                                            <AvatarFallback className="text-[8px]">
                                                {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent className="px-2 py-1 text-xs">
                                        Văzut de {fullName}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
            )}
            </>
    );
}

// Create Group Dialog Component
function CreateGroupDialog({ onGroupCreated }: { onGroupCreated: () => void }) {
    const { user } = useAuth();
    const { createGroup, isUserOnline } = useChat();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT'>('DIRECT');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAvailableUsers = useCallback(async () => {
        try {
            // Load users based on role
            let response;
            if (user?.role === 'CLIENT') {
                response = await apiClient.getProviders();
            } else {
                response = await apiClient.getUsers({ role: 'PROVIDER' });
            }
            setAvailableUsers(response.users || response.providers || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }, [user?.role]);

    useEffect(() => {
        if (open) {
            loadAvailableUsers();
        }
    }, [open]);

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        setLoading(true);
        try {
            await createGroup({
                name: groupName,
                type: groupType,
                participantIds: selectedUsers
            });

            setOpen(false);
            setGroupName('');
            setSelectedUsers([]);
            onGroupCreated();
        } catch (error) {
            console.error('Failed to create group:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortedAvailableUsers = useMemo(() => {
        return [...availableUsers].sort((a, b) => {
            const aOnline = isUserOnline(a.id);
            const bOnline = isUserOnline(b.id);

            // online first
            if (aOnline !== bOnline) return Number(bOnline) - Number(aOnline);

            // then by name (optional)
            const aName = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
            const bName = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
            return aName.localeCompare(bName);
        });
    }, [availableUsers, isUserOnline]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="w-8 h-8">
                    <Plus className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Creează Grup Nou</DialogTitle>
                    <DialogDescription>
                        Adaugă participanți pentru a începe o conversație
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Nume Grup</label>
                        <Input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="ex: Proiect Website"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Tip Grup</label>
                        <Select value={groupType} onValueChange={(value: any) => setGroupType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DIRECT">Conversație Directă</SelectItem>
                                <SelectItem value="PROJECT">Grup Proiect</SelectItem>
                                {user?.role === 'PROVIDER' && (
                                    <SelectItem value="PROVIDER_ONLY">Doar Prestatori</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Participanți</label>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {sortedAvailableUsers.map(availableUser => (
                                <div key={availableUser.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={availableUser.id}
                                        checked={selectedUsers.includes(availableUser.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedUsers(prev => [...prev, availableUser.id]);
                                            } else {
                                                setSelectedUsers(prev => prev.filter(id => id !== availableUser.id));
                                            }
                                        }}
                                    />
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={availableUser.avatar} />
                                        <AvatarFallback className="text-xs">
                                            {availableUser.firstName[0]}{availableUser.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            {availableUser.firstName} {availableUser.lastName} <div className={`w-2 h-2 ${isUserOnline(availableUser.id) ? 'bg-green-500' : 'bg-red-500' } rounded-full`} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {availableUser.role === 'PROVIDER' ? 'Prestator' : 'Client'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            onClick={handleCreateGroup}
                            disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Se creează...
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4 mr-2" />
                                    Creează Grup
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Anulează
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

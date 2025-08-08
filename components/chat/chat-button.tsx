"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/contexts/chat-context';
import { ChatWidget } from './chat-widget';

export function ChatButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { getTotalUnreadCount } = useChat();

    const totalUnread = getTotalUnreadCount();

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-11 h-11 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all duration-200 hover:scale-105"
                aria-label="Deschide chat-ul"
            >
                <MessageCircle className="h-5 w-5" />
                {totalUnread > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs border-2 border-background">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </Badge>
                )}
            </Button>

            {isOpen && <ChatWidget onClose={() => setIsOpen(false)} />}
        </>
    );
}

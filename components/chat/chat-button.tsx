"use client";

import {useMemo, useState} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, MessageCircle, Search, Users, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { useChat } from "@/contexts/chat-context";
import { Input } from "@/components/ui/input";
import {useAuth} from "@/contexts/auth-context";

function getGroupIcon(type: string) {
    switch (type) {
        case "PROJECT": return "🚀";
        case "PROVIDER_ONLY": return "👥";
        case "DIRECT": return "💬";
        default: return "💬";
    }
}

export function ChatButton() {
    const {
        groups,
        setActiveGroup,
        getTotalUnreadCount,
        markAsRead,
        openPanel,
    } = useChat();
    const { user } = useAuth();

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const totalUnread = getTotalUnreadCount();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? groups.filter(g =>
                g.name.toLowerCase().includes(q) ||
                g.members.some(m => (`${m.user.firstName} ${m.user.lastName}`).toLowerCase().includes(q))
            )
            : groups;

        // sort: unread desc, then updated_at desc
        return [...list].sort((a, b) => {
            if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
    }, [groups, search]);

    const handleOpenGroup = async (g: any) => {
        setActiveGroup(g);
        openPanel(g);
        if (g.unreadCount > 0) {
            await markAsRead(g.id);
        }
        setOpen(false);
    };

    const userLang = user?.language ?? 'ro';
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    aria-label="Deschide conversațiile"
                    variant="ghost"
                    size="icon"
                    className="relative w-11 h-11 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all duration-200 hover:scale-105"
                >
                    <MessageCircle className="h-5 w-5" />
                    {totalUnread > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs border-2 border-background">
                            {totalUnread > 99 ? "99+" : totalUnread}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Mesaje</CardTitle>
                                <CardDescription>
                                    {totalUnread > 0 ? `${totalUnread} necitite în total` : "Totul citit 🧘"}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {totalUnread > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8"
                                        onClick={e => {
                                            e.stopPropagation();
                                            // mark all as read: do it client-side per group with unread>0
                                            groups.filter(g => g.unreadCount > 0)
                                                .forEach(g => markAsRead(g.id).catch(() => {}));
                                        }}
                                        title="Marchează tot ca citit"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Caută conversații sau persoane..."
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <ScrollArea className="h-96">
                            {filtered.length === 0 ? (
                                <div className="text-center py-10 px-4 text-muted-foreground">
                                    Nimic aici. Începe o conversație!
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filtered.map(g => {
                                        const isUnread = (g.unreadCount ?? 0) > 0;

                                        return (
                                            <button
                                                key={g.id}
                                                onClick={() => handleOpenGroup(g)}
                                                className="w-full text-left p-3 hover:bg-muted/60 transition-colors"
                                                aria-label={`${g.name}${isUnread ? ' (necitite)' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                                                            {getGroupIcon(g.type)}
                                                        </div>
                                                        {g.unreadCount > 0 && (
                                                            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 h-5 text-[10px] bg-red-500 text-white">
                                                                {g.unreadCount > 99 ? "99+" : g.unreadCount}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className={`truncate ${
                                                                    isUnread ? 'font-semibold text-foreground' : 'font-medium'
                                                                }`}
                                                                title={g.name}
                                                            >
                                                                {g.name}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                                                <Clock className="w-3 h-3" />
                                                                <span className={`${
                                                                    isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {formatDistanceToNow(
                    new Date(g.last_message?.timestamp || (g.updated_at || g.created_at)),
                    { addSuffix: true, locale: ro }
                )}
              </span>
                                                            </div>
                                                        </div>

                                                        {g.last_message ? (
                                                            <div
                                                                className={`mt-1 text-xs truncate ${
                                                                    isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                                                                }`}
                                                                title={
                                                                    g.last_message.translations?.[userLang] ??
                                                                    g.last_message.content ??
                                                                    '---'
                                                                }
                                                            >
                                                                {g.last_message.translations?.[userLang] ??
                                                                    g.last_message.content ??
                                                                    '---'}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs mt-1 text-muted-foreground italic">
                                                                Fără mesaje
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {g.type === "PROJECT" ? "Proiect" :
                                                                    g.type === "PROVIDER_ONLY" ? "Prestatori" : "Direct"}
                                                            </Badge>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {g.members.length} membri
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>

                    {filtered.length > 0 && (
                        <>
                            <Separator />
                            <CardContent className="py-3">
                                <div className="text-xs text-muted-foreground text-center">
                                    Sfaturi: click pe un grup pentru a deschide chatul; badge‑urile roșii arată necititele.
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}

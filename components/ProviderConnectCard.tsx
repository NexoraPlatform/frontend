"use client";

import { type ReactNode, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ProviderConnectCardProps {
    providerName: string;
    icon: ReactNode;
    isConnected: boolean;
    description?: string;
    onConnect: () => Promise<void> | void;
    onDisconnect?: () => Promise<void> | void;
}

export default function ProviderConnectCard({
    providerName,
    icon,
    isConnected,
    description,
    onConnect,
    onDisconnect,
}: ProviderConnectCardProps) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            await onConnect();
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!onDisconnect) return;
        setLoading(true);
        try {
            await onDisconnect();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass-card border-slate-200 dark:border-[#1E2A3D]">
            <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-slate-200 p-2 dark:border-[#1E2A3D]">
                            {icon}
                        </div>
                        <CardTitle className="text-lg">{providerName}</CardTitle>
                    </div>
                    <Badge
                        variant={isConnected ? 'default' : 'outline'}
                        className={isConnected ? 'bg-green-600 text-white' : ''}
                    >
                        {isConnected ? 'Connected' : 'Not connected'}
                    </Badge>
                </div>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent>
                {isConnected ? (
                    onDisconnect ? (
                        <Button variant="outline" disabled={loading} onClick={handleDisconnect}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                'Disconnect'
                            )}
                        </Button>
                    ) : (
                        <Button variant="outline" disabled>
                            Connected
                        </Button>
                    )
                ) : (
                    <Button onClick={handleConnect} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting...
                            </>
                        ) : (
                            'Connect'
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

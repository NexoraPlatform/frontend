"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from 'sonner';
import { buildOAuthRedirectUrl } from '@/lib/backend-url';

export default function GithubConnect({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const redirectUrl = buildOAuthRedirectUrl('github');
            if (!redirectUrl) {
                toast.error('NEXT_PUBLIC_BACKEND_URL is not configured');
                setLoading(false);
                return;
            }
            window.location.href = redirectUrl;
        } catch (error) {
            console.error("Failed to init GitHub auth", error);
            setLoading(false);
        }
    };

    if (isConnected) {
        return <Button disabled variant="outline" className="text-green-600 border-green-600"><Github className="mr-2 h-4 w-4" /> Cont Conectat</Button>;
    }

    return (
        <Button onClick={handleConnect} disabled={loading}>
            <Github className="mr-2 h-4 w-4" />
            {loading ? "Se redirecționează..." : "Conectează Cont GitHub"}
        </Button>
    );
}

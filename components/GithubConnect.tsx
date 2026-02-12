"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from 'sonner';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export default function GithubConnect({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            if (!API_BASE_URL) {
                toast.error('NEXT_PUBLIC_API_URL is not configured');
                setLoading(false);
                return;
            }
            window.location.href = `${API_BASE_URL}/auth/github/redirect`;
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

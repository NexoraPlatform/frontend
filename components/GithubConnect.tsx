"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { apiClient } from "@/lib/api"; // Axios instance-ul tău

export default function GithubConnect({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // 1. Cerem URL-ul de la Laravel
            const response = await apiClient.githubInitiate();
            const redirectUrl = response.url;

            // 2. Redirectăm browserul utilizatorului către GitHub
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
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

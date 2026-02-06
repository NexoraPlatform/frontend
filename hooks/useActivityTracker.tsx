import { useEffect } from 'react';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

export function useActivityTracker() {
    const { user, userLoading } = useAuth();
    useEffect(() => {
        if (userLoading || !user) return;

        let interval: ReturnType<typeof setInterval> | null = null;

        const start = () => {
            apiClient.updateLastActive();
            interval = setInterval(() => apiClient.updateLastActive(), 60_000);
        };

        start();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userLoading, user]);
}

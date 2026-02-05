import { useEffect } from 'react';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

export function useActivityTracker() {
    const { user, userLoading } = useAuth();
    useEffect(() => {
        if (userLoading || !user) return;

        let interval: ReturnType<typeof setInterval> | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;

        const resolveToken = () => {
            if (typeof window === 'undefined') return null;
            const clientToken = apiClient.getToken?.() ?? null;
            return clientToken || localStorage.getItem('auth_token');
        };

        const start = () => {
            const token = resolveToken();
            if (!token) {
                retryTimer = setTimeout(start, 500);
                return;
            }

            if (apiClient.getToken?.() !== token && apiClient.setToken) {
                apiClient.setToken(token);
            }

            apiClient.updateLastActive();
            interval = setInterval(() => apiClient.updateLastActive(), 60_000);
        };

        start();

        return () => {
            if (retryTimer) clearTimeout(retryTimer);
            if (interval) clearInterval(interval);
        };
    }, [userLoading, user]);
}

import { useEffect } from 'react';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

export function useActivityTracker() {
    const { user, userLoading } = useAuth();
    useEffect(() => {
        if (userLoading || !user) return;

        apiClient.updateLastActive();
        const interval = setInterval(() => apiClient.updateLastActive(), 60_000);

        return () => {
            clearInterval(interval);
        };
    }, [userLoading, user]);
}

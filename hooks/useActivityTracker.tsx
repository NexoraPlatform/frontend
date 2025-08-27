import { useEffect } from 'react';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

export function useActivityTracker() {
    const { user, loading } = useAuth();
    useEffect(() => {
        const updateLastActive = () => {
            apiClient.updateLastActive();
        };

        if (loading || !user) return;
        updateLastActive();
        const interval = setInterval(updateLastActive, 60_000);

        return () => clearInterval(interval);
    }, [loading, user]);
}

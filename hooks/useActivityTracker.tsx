import { useEffect } from 'react';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

export function useActivityTracker() {
    const { user, userLoading } = useAuth();
    useEffect(() => {
        if (userLoading || !user) return;

        const updateActivity = () => {
            void apiClient.updateLastActive().catch((error) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Failed to update last active timestamp:', error);
                }
            });
        };

        updateActivity();
        const interval = window.setInterval(updateActivity, 60_000);

        return () => {
            clearInterval(interval);
        };
    }, [userLoading, user]);
}

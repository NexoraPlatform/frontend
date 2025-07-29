'use client';

import { useEffect } from 'react';
import apiClient from '@/lib/api';

export function useActivityTracker() {
    useEffect(() => {
        const updateLastActive = () => {
            apiClient.updateLastActive();
        };

        updateLastActive();
        const interval = setInterval(updateLastActive, 60_000);

        return () => clearInterval(interval);
    }, []);
}

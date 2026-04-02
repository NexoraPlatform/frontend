import { useEffect } from 'react';

import { ensureEcho } from '@/lib/echo';

type RealtimeNotification = {
    type?: string;
    data?: {
        type?: string;
        projectId?: string | number;
        milestoneId?: string | number;
        milestone_id?: string | number;
        payload?: {
            projectId?: string | number;
            milestoneId?: string | number;
            milestone_id?: string | number;
            status?: string;
        };
    };
    projectId?: string | number;
    milestoneId?: string | number;
    milestone_id?: string | number;
    payload?: {
        projectId?: string | number;
        milestoneId?: string | number;
        milestone_id?: string | number;
        status?: string;
    };
};

type UseClientProjectRequestsRealtimeParams = {
    userId?: string | number | null;
    loadProjects: () => void | Promise<void>;
};

export function useClientProjectRequestsRealtime({
    userId,
    loadProjects,
}: UseClientProjectRequestsRealtimeParams) {
    useEffect(() => {
        if (!userId) return;

        let cancelled = false;
        let channel:
            | {
                  notification: (callback: (notification: RealtimeNotification) => void) => void;
                  stopListening: (event: string) => void;
              }
            | null = null;

        const handler = (notification: RealtimeNotification) => {
            const rawType = String(notification?.type ?? '').toLowerCase();
            const declaredType = String(notification?.data?.type ?? '').toLowerCase();
            const isBudgetAcceptedByProvider =
                declaredType === 'budget.accepted.by_provider' ||
                rawType.includes('provideracceptedclientbudget');
            const projectId =
                notification?.data?.projectId ??
                notification?.projectId ??
                notification?.data?.payload?.projectId ??
                notification?.payload?.projectId;
            const milestoneId =
                notification?.data?.milestoneId ??
                notification?.data?.milestone_id ??
                notification?.milestoneId ??
                notification?.milestone_id ??
                notification?.data?.payload?.milestoneId ??
                notification?.data?.payload?.milestone_id ??
                notification?.payload?.milestoneId ??
                notification?.payload?.milestone_id;
            const payloadStatus = String(
                notification?.data?.payload?.status ??
                    notification?.payload?.status ??
                    ''
            ).toUpperCase();
            const hasProjectContext = Boolean(projectId || milestoneId);
            const isProjectEvent =
                declaredType.startsWith('project.') ||
                declaredType.startsWith('budget.') ||
                declaredType.startsWith('milestone.') ||
                declaredType.includes('milestone');
            const isProjectStatusUpdatedEvent =
                declaredType === 'project.status.updated' ||
                rawType.includes('projectstatusupdated');
            const isProviderFinishedNotification =
                isProjectStatusUpdatedEvent && payloadStatus === 'FINISHED';
            const isRapydProjectEvent =
                declaredType.startsWith('rapyd.') && hasProjectContext;
            const isFallbackProjectEvent = !declaredType && hasProjectContext;

            if (
                !isProjectEvent &&
                !isProjectStatusUpdatedEvent &&
                !isProviderFinishedNotification &&
                !isBudgetAcceptedByProvider &&
                !isRapydProjectEvent &&
                !isFallbackProjectEvent
            ) {
                return;
            }

            void loadProjects();
        };

        void (async () => {
            const echo = await ensureEcho();
            if (!echo || cancelled) return;

            const privateChannel = echo.private(`App.Models.User.${userId}`);
            channel = privateChannel;
            privateChannel.notification(handler);
        })();

        return () => {
            cancelled = true;
            channel?.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
        };
    }, [loadProjects, userId]);
}

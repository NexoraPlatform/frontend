import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

type UseClientProjectRequestsAccessParams = {
    user: any;
    userLoading: boolean;
    hasRoleInfo: boolean;
    isClientRole: boolean;
    withLayout: boolean;
    refreshUser: () => Promise<any>;
    loadProjects: () => void | Promise<void>;
    setIsRefreshingRole: Dispatch<SetStateAction<boolean>>;
    roleRefreshAttemptedRef: MutableRefObject<boolean>;
    replace: (href: string) => void;
    dashboardHomeHref: string;
};

export function useClientProjectRequestsAccess({
    user,
    userLoading,
    hasRoleInfo,
    isClientRole,
    withLayout,
    refreshUser,
    loadProjects,
    setIsRefreshingRole,
    roleRefreshAttemptedRef,
    replace,
    dashboardHomeHref,
}: UseClientProjectRequestsAccessParams) {
    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            return;
        }

        if (!hasRoleInfo && !roleRefreshAttemptedRef.current) {
            roleRefreshAttemptedRef.current = true;
            setIsRefreshingRole(true);
            void refreshUser().finally(() => {
                setIsRefreshingRole(false);
            });
            return;
        }

        if (hasRoleInfo && !isClientRole) {
            if (withLayout) {
                replace(dashboardHomeHref);
            }
            return;
        }

        void loadProjects();
    }, [
        dashboardHomeHref,
        hasRoleInfo,
        isClientRole,
        loadProjects,
        refreshUser,
        replace,
        roleRefreshAttemptedRef,
        setIsRefreshingRole,
        user,
        userLoading,
        withLayout,
    ]);
}

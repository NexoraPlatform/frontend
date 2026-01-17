"use client";

import { ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

type EnvironmentStatusBannerProps = {
  earlyAccessEnabled: boolean;
  basicAuthEnabled: boolean;
};

export function EnvironmentStatusBanner({
  earlyAccessEnabled,
  basicAuthEnabled,
}: EnvironmentStatusBannerProps) {
  const { user, loading } = useAuth();
  const isAdminUser = Boolean(
    user?.is_superuser ||
      user?.roles?.some((role) => ["admin", "superuser"].includes(role.slug?.toLowerCase() ?? ""))
  );

  if (loading || !isAdminUser) {
    return null;
  }

  if (!earlyAccessEnabled && !basicAuthEnabled) {
    return null;
  }

  return (
    <div className="w-full border-b border-amber-200/70 bg-amber-50/90 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 text-sm">
        {earlyAccessEnabled ? (
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>
              Early access funnel este activ. Conturile de admin au bypass și văd site-ul complet.
            </span>
          </div>
        ) : null}
        {basicAuthEnabled ? (
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Basic Auth este activ.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

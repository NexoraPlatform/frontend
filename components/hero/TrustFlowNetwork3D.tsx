"use client";

import React, { useEffect, useState } from "react";

type TrustFlowComponent = React.ComponentType;

function TrustFlowFallback() {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C2D] via-[#0F2438] to-[#0B1C2D]">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1BC47D] rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#3B82F6] rounded-full blur-[100px]" />
            </div>
        </div>
    );
}

export default function TrustFlowNetwork3D() {
    const [NetworkComponent, setNetworkComponent] = useState<TrustFlowComponent | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const reactInternals = (React as {
            __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: { ReactCurrentOwner?: unknown };
        }).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

        if (!reactInternals?.ReactCurrentOwner) {
            setHasError(true);
            return () => {
                isMounted = false;
            };
        }

        import("@/components/hero/TrustFlowNetwork")
            .then((mod) => {
                if (!isMounted) return;
                setNetworkComponent(() => mod.default);
            })
            .catch((error) => {
                console.error("Failed to load TrustFlowNetwork 3D scene:", error);
                if (isMounted) {
                    setHasError(true);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (hasError || !NetworkComponent) {
        return <TrustFlowFallback />;
    }

    return <NetworkComponent />;
}

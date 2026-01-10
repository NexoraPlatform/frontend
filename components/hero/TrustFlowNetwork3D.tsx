"use client";

import React from "react";
import dynamic from "next/dynamic";

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

const TrustFlowNetwork = dynamic(() => import("@/components/hero/TrustFlowNetwork"), {
    ssr: false,
    loading: () => <TrustFlowFallback />,
});

class TrustFlowErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error("Failed to render TrustFlowNetwork 3D scene:", error);
    }

    render() {
        if (this.state.hasError) {
            return <TrustFlowFallback />;
        }
        return this.props.children;
    }
}

export default function TrustFlowNetwork3D() {
    return (
        <TrustFlowErrorBoundary>
            <TrustFlowNetwork />
        </TrustFlowErrorBoundary>
    );
}

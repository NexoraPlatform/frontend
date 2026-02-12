"use client";

import dynamic from "next/dynamic";

const TrustFlowNetwork = dynamic(() => import("@/components/hero/TrustFlowNetwork"), { ssr: false });

export function TrustFlowNetworkLayer() {
    return <TrustFlowNetwork />;
}

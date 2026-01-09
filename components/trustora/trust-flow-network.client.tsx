"use client";

import dynamic from "next/dynamic";

const TrustFlowNetwork = dynamic(() => import("./trust-flow-network"), { ssr: false });

export default function TrustFlowNetworkClient({ className = "" }: { className?: string }) {
    return <TrustFlowNetwork className={className} />;
}

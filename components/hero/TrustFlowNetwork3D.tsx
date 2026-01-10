"use client";

import dynamic from "next/dynamic";

const TrustFlowNetwork = dynamic(() => import("@/components/hero/TrustFlowNetwork"), { ssr: false });

export default function TrustFlowNetwork3D() {
    return <TrustFlowNetwork />;
}

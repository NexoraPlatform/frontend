"use client";

import dynamic from "next/dynamic";

export const LazyStylesClient = dynamic(() => import("./(home)/_client/LazyStyles.client"), {
    ssr: false,
    loading: () => null,
});

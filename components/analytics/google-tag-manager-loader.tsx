"use client";

import { useEffect } from "react";

type GoogleTagManagerLoaderProps = {
  gtmId: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function getCspNonce() {
  if (typeof document === "undefined") return null;
  // Căutăm meta tag-ul dedicat
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]');
  return meta ? meta.content : null;
}

export function GoogleTagManagerLoader({ gtmId }: GoogleTagManagerLoaderProps) {
  useEffect(() => {
    if (!gtmId) return;
    if (document.getElementById("trustora-gtm-loader")) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });

    const script = document.createElement("script");
    script.id = "trustora-gtm-loader";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    const nonce = getCspNonce();
    if (nonce) {
      script.nonce = nonce;
      script.setAttribute("nonce", nonce);
    }
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [gtmId]);

  return null;
}

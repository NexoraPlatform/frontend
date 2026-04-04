"use client";

import { useEffect } from "react";

type GoogleTagManagerLoaderProps = {
  gtmId: string;
  nonce?: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function getCspNonce(fallbackNonce?: string) {
  if (fallbackNonce) return fallbackNonce;
  if (typeof document === "undefined") return null;

  const existingScript = document.querySelector<HTMLScriptElement>("script[nonce]");
  if (existingScript?.nonce) {
    return existingScript.nonce;
  }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]');
  return meta ? meta.content : null;
}

export function GoogleTagManagerLoader({ gtmId, nonce }: GoogleTagManagerLoaderProps) {
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
    const resolvedNonce = getCspNonce(nonce);
    if (resolvedNonce) {
      script.nonce = resolvedNonce;
      script.setAttribute("nonce", resolvedNonce);
    }
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [gtmId, nonce]);

  return null;
}

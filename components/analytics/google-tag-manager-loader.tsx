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

  const nonceSource = document.querySelector<HTMLElement>("script[nonce], style[nonce], [nonce]");
  if (!nonceSource) return null;

  const nonceProperty = "nonce" in nonceSource ? nonceSource.nonce : "";
  return nonceProperty || nonceSource.getAttribute("nonce");
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

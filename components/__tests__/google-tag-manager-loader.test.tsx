import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { GoogleTagManagerLoader } from "@/components/analytics/google-tag-manager-loader";

afterEach(() => {
  cleanup();
  document.head.querySelector("#trustora-gtm-loader")?.remove();
  document.head.querySelector("#existing-nonce-script")?.remove();
});

describe("GoogleTagManagerLoader", () => {
  it("propagates the existing CSP nonce to the GTM script tag", async () => {
    const existingScript = document.createElement("script");
    existingScript.id = "existing-nonce-script";
    existingScript.nonce = "nonce-from-dom";
    existingScript.setAttribute("nonce", "nonce-from-dom");
    document.head.appendChild(existingScript);

    render(<GoogleTagManagerLoader gtmId="GTM-TEST123" />);

    await waitFor(() => {
      const gtmScript = document.head.querySelector("#trustora-gtm-loader") as HTMLScriptElement | null;
      expect(gtmScript).not.toBeNull();
      expect(gtmScript?.getAttribute("src")).toBe(
        "https://www.googletagmanager.com/gtm.js?id=GTM-TEST123"
      );
      expect(gtmScript?.nonce).toBe("nonce-from-dom");
      expect(gtmScript?.getAttribute("nonce")).toBe("nonce-from-dom");
    });
  });
});

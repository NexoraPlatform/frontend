import { describe, expect, it } from "vitest";

import { buildAllowedInlineScriptHashes, buildAllowedJsonLdHashes, sha256Base64 } from "@/lib/csp";
import { buildTrustoraThemeBootstrapScript } from "@/lib/theme";

describe("CSP JSON-LD hashes", () => {
  it("builds stable hashes for all inline JSON-LD payloads we render", async () => {
    const hashes = await buildAllowedJsonLdHashes();

    expect(hashes).toHaveLength(4);
    for (const hash of hashes) {
      expect(hash.startsWith("'sha256-")).toBe(true);
      expect(hash.endsWith("'")).toBe(true);
    }
  });

  it("computes SHA-256 hashes in base64", async () => {
    expect(await sha256Base64("hello")).toBe("LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=");
  });

  it("includes the next-themes bootstrap hash in the inline allow-list", async () => {
    const hashes = await buildAllowedInlineScriptHashes();
    const expectedThemeHash = `'sha256-${await sha256Base64(buildTrustoraThemeBootstrapScript())}'`;

    expect(hashes).toContain(expectedThemeHash);
    expect(hashes).toHaveLength(5);
  });
});

import { describe, expect, it } from "vitest";

import { JsonLdScript } from "@/components/seo/json-ld-script";

describe("JsonLdScript", () => {
  it("renders a server-side ld+json script tag", () => {
    const json = '{"@context":"https://schema.org","@type":"WebSite"}';

    const element = JsonLdScript({ id: "global", json });

    expect(element.type).toBe("script");
    expect(element.props.id).toBe("jsonld-global");
    expect(element.props.type).toBe("application/ld+json");
    expect(element.props.dangerouslySetInnerHTML).toEqual({ __html: json });
  });
});

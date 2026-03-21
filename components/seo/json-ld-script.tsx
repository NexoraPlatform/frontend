"use client";

import { useEffect } from "react";

type JsonLdScriptProps = {
  id: string;
  json: string;
};

export function JsonLdScript({ id, json }: JsonLdScriptProps) {
  useEffect(() => {
    const elementId = `jsonld-${id}`;
    let script = document.getElementById(elementId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = elementId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.text = json;

    return () => {
      script?.remove();
    };
  }, [id, json]);

  return null;
}

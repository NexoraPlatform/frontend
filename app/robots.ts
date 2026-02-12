import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/seo";

const DISALLOWED_PATHS = ["/dashboard", "/admin", "/api/auth"];

const TRUSTED_BOTS = [
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: TRUSTED_BOTS,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

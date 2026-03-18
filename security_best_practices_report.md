# Penetration Test Report

## Executive Summary

The highest-risk issue in this Next.js application is a server/client boundary failure that exposes provider GitHub OAuth tokens to browser JavaScript, collapsing the trust boundary between the authenticated backend session and any script running in the page. Secondary risks concentrate around unsafe external URL rendering, proxy-layer CSRF weakening, spoofable abuse controls, and weak frontend containment controls. The codebase already has some positive controls, including `HttpOnly`-style session handling via Auth.js, JSON-LD serialization helpers, and a non-trivial CSP, but several of those defenses are weakened or bypassed by implementation details.

## Findings

### F-01
- **Severity:** HIGH
- **Vulnerability Type:** SSR / Session Data Leak
- **Affected Component:** `/Users/arsene/react/t1/auth.ts` (`jwt` and `session` callbacks), `/Users/arsene/react/t1/lib/auth/user.ts` (`normalizeAuthUser`), `/Users/arsene/react/t1/contexts/auth-context.tsx` (`AuthProviderInner`), `/Users/arsene/react/t1/app/[locale]/projects/new/page.tsx` (`connectedOAuthProviders`)
- **Evidence:**
  - `auth.ts:46-61` strips only Laravel session/XSRF secrets, then copies the remainder of the backend user object into `token.user` and `session.user`.
  - `lib/auth/user.ts:61-68` explicitly models `github_token` and `github_refresh_token` on `AuthUser`, while `lib/auth/user.ts:174-185` returns `...rest` unfiltered.
  - `contexts/auth-context.tsx:57-59` hydrates the client context directly from `session.user`.
  - `app/[locale]/projects/new/page.tsx:4269-4274` checks `user?.github_token`, proving the raw OAuth access token is intended to be reachable from browser code.
- **Exploit Scenario:** Any DOM XSS, compromised third-party script, browser extension, or malicious dependency executing in the browser can read `user.github_token` from the client auth context and call the victim’s GitHub account on their behalf. If the backend includes `github_refresh_token` in the same payload, long-lived compromise becomes possible.
- **Business Impact:** GitHub repository access, source-code exfiltration, tampering with connected repos, CI/CD compromise, and secondary secret exposure from private repositories or GitHub Apps.
- **Remediation Code:**

```ts
// /Users/arsene/react/t1/lib/auth/user.ts
const SENSITIVE_USER_FIELDS = [
  'github_token',
  'github_refresh_token',
  'rapyd_wallet_id',
  'rapyd_contact_id',
];

export const normalizeAuthUser = (input: any): AuthUser | null => {
  if (!input) return null;

  const rest = { ...input };
  for (const key of SENSITIVE_USER_FIELDS) {
    delete rest[key];
  }

  const github_connected =
    Boolean(input.github_token) ||
    (Array.isArray(input.connected_accounts)
      ? input.connected_accounts.some((account: any) => account?.provider === 'github')
      : false);

  return {
    ...rest,
    id: id !== undefined && id !== null ? String(id) : '',
    email,
    firstName,
    lastName,
    avatar: input.avatar ?? input.profile_photo_url ?? null,
    role: input.role ?? input.role_slug ?? null,
    role_slugs: roleSlugs,
    company,
    permissions,
    github_connected,
  } as AuthUser;
};
```

```ts
// /Users/arsene/react/t1/app/[locale]/projects/new/page.tsx
if (user?.github_connected) {
  connected.add('github');
}
```

### F-02
- **Severity:** MEDIUM
- **Vulnerability Type:** Stored XSS / URL Injection
- **Affected Component:** `/Users/arsene/react/t1/app/[locale]/provider/[id]/provider-profile.tsx`, `/Users/arsene/react/t1/app/[locale]/provider/profile/page.tsx`, `/Users/arsene/react/t1/components/chat/chat-widget.tsx`, `/Users/arsene/react/t1/app/[locale]/admin/calls/page.tsx`
- **Evidence:**
  - `provider-profile.tsx:590-595`, `provider-profile.tsx:1166-1171`, `provider-profile.tsx:843-845`, and `provider/profile/page.tsx:1951-1955` render attacker-controlled `provider.website` / `project.url` directly into `href`.
  - `components/chat/chat-widget.tsx:913-925` renders attachment URLs directly into both `href` and `src`.
  - `admin/calls/page.tsx:395-396` opens `call.call_url` in a new tab without host validation.
- **Exploit Scenario:** A malicious provider can save a website such as `javascript:fetch('/api/auth/me').then(r=>r.text()).then(alert)` or a phishing `https://attacker.example/login-lookalike`. Any user or admin who clicks the rendered link executes attacker-controlled navigation. The same pattern exists for portfolio URLs, chat attachments, and call links.
- **Business Impact:** Session theft, phishing against clients/admins, malicious browser actions under the application origin, and trust erosion for the marketplace.
- **Remediation Code:**

```ts
// /Users/arsene/react/t1/lib/navigation-security.ts
export function sanitizeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
```

```tsx
// Example usage for profile/project URLs
const safeWebsite = sanitizeHttpUrl(provider.website);
{safeWebsite ? (
  <a href={safeWebsite} target="_blank" rel="noopener noreferrer">
    {provider.website}
  </a>
) : null}
```

```tsx
// Example usage for sensitive third-party flows such as calls/escrow
const safeCallUrl = sanitizeExternalRedirectUrl(call.call_url, ['cal.com', 'meet.google.com', 'zoom.us']);
{safeCallUrl ? (
  <Link target="_blank" rel="noopener noreferrer" href={safeCallUrl}>
    {t.connectToInterview}
  </Link>
) : null}
```

### F-03
- **Severity:** MEDIUM
- **Vulnerability Type:** Proxy-Assisted CSRF Weakening
- **Affected Component:** `/Users/arsene/react/t1/lib/server/laravel-proxy.ts` (`buildProxyHeaders`), representative callers `/Users/arsene/react/t1/app/api/auth/login/route.ts` and `/Users/arsene/react/t1/app/api/ai/brief-builder/route.ts`
- **Evidence:**
  - `lib/server/laravel-proxy.ts:36-44` automatically derives `X-XSRF-TOKEN` from the ambient cookie jar instead of requiring the browser to submit the header explicitly.
  - `lib/server/laravel-proxy.ts:39-40` also mirrors inbound cookies into a non-standard outbound `Set-Cookie` request header.
  - `app/api/auth/login/route.ts:4-15` and `app/api/ai/brief-builder/route.ts:13-21` trust `buildProxyHeaders(req)` for state-changing requests without performing local origin validation.
- **Exploit Scenario:** If a victim browser sends cookies to the Next.js origin, the proxy upgrades that request into a backend-valid CSRF request by manufacturing the `X-XSRF-TOKEN` header from the cookie itself. This defeats the point of the double-submit cookie pattern at the proxy layer and widens the blast radius of cross-site requests, particularly for routes that mutate server state.
- **Business Impact:** Forced logout, unauthorized state changes, AI-cost abuse, and future exposure of any new proxied write endpoints such as payouts or account settings.
- **Remediation Code:**

```ts
// /Users/arsene/react/t1/lib/server/laravel-proxy.ts
const isTrustedOrigin = (req: Request) => {
  const origin = req.headers.get('origin');
  const allowed = new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL,
    ].filter(Boolean)
  );
  return !origin || allowed.has(origin);
};

export const buildProxyHeaders = (req: Request, extra?: HeadersInit) => {
  if (!isTrustedOrigin(req)) {
    throw new Error('Untrusted origin');
  }

  const headers = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });

  const cookieHeader = req.headers.get('cookie') ?? '';
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const incomingXsrfHeader = req.headers.get('x-xsrf-token');
  if (incomingXsrfHeader) {
    headers.set('X-XSRF-TOKEN', incomingXsrfHeader);
  }

  return headers;
};
```

```ts
// /Users/arsene/react/t1/app/api/ai/brief-builder/route.ts
export async function POST(req: Request) {
  let headers: Headers;
  try {
    headers = buildProxyHeaders(req, { 'Content-Type': 'application/json' });
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  // continue...
}
```

### F-04
- **Severity:** LOW
- **Vulnerability Type:** Rate-Limit Identity Spoofing
- **Affected Component:** `/Users/arsene/react/t1/lib/server/rate-limit.ts` (`getClientIdentifier`, `enforceApiRateLimit`), `/Users/arsene/react/t1/proxy.ts` (`proxy`)
- **Evidence:**
  - `lib/server/rate-limit.ts:172-187` prefers `x-real-ip`, `cf-connecting-ip`, `x-vercel-forwarded-for`, and `x-forwarded-for` directly from the request when building the limiter key.
  - `proxy.ts:227-230` enforces the limiter globally for `/api/*`, which means the effectiveness of the control depends entirely on the trustworthiness of those headers.
  - If the app is deployed behind an origin or reverse proxy that does not overwrite these headers, an attacker can rotate them per request and evade the configured quota.
- **Exploit Scenario:** An attacker sends repeated login or AI-generation requests while changing `X-Forwarded-For`/`X-Real-IP` on each request. The limiter sees every request as a new client and never trips the sliding window.
- **Business Impact:** Reduced protection against brute force, AI-cost abuse, and endpoint flooding in deployments where forwarded-IP headers are not normalized by infrastructure.
- **Remediation Code:**

```ts
// /Users/arsene/react/t1/lib/server/rate-limit.ts
const getTrustedClientIp = (headers: Headers): string | null => {
  const vercelIp = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (vercelIp) return vercelIp;

  const cloudflareIp = headers.get('cf-connecting-ip')?.trim();
  if (cloudflareIp) return cloudflareIp;

  return null;
};

const getClientIdentifier = (headers: Headers): string => {
  const trustedIp = getTrustedClientIp(headers);
  if (trustedIp) return trustedIp;

  const sessionCookie =
    headers
      .get('cookie')
      ?.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('laravel_session=')) ?? null;
  if (sessionCookie) return `session:${sessionCookie}`;

  const userAgent = (headers.get('user-agent') ?? 'unknown').slice(0, 120);
  return `anonymous:${userAgent}`;
};
```

### F-05
- **Severity:** MEDIUM
- **Vulnerability Type:** Weak CSP / Reduced XSS Containment
- **Affected Component:** `/Users/arsene/react/t1/next.config.js` (`headers`)
- **Evidence:**
  - `next.config.js:171-180` allows `script-src 'unsafe-inline'` in production and trusts a broad set of third-party script origins.
  - `next.config.js:181-182` allows `style-src 'unsafe-inline'`.
  - Because the app also injects inline scripts in layout and JSON-LD via `dangerouslySetInnerHTML`, the current policy is not capable of containing many modern DOM-based injections.
- **Exploit Scenario:** If any HTML or URL injection lands in the app, the CSP is unlikely to stop inline payload execution. A compromise of any allowed script host also becomes immediately usable for arbitrary code execution in the frontend origin.
- **Business Impact:** Higher likelihood that any frontend injection becomes full account compromise, including access to client-side auth state and sensitive workflow actions.
- **Remediation Code:**

```js
// /Users/arsene/react/t1/next.config.js
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com https://cdn.onesignal.com",
    "style-src 'self' 'nonce-{NONCE}' https://cdn.cookie-script.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://backend.trustora.ro https://api.onesignal.com",
    "frame-src 'self' https://sandboxcheckout.rapyd.net https://onesignal.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
```

Use a per-request nonce via `@next-safe/middleware` or a dedicated middleware layer, then pass that nonce into `<Script nonce={nonce}>` in layout instead of relying on `unsafe-inline`.

### F-06
- **Severity:** MEDIUM
- **Vulnerability Type:** Vulnerable Dependency / Supply Chain Exposure
- **Affected Component:** `/Users/arsene/react/t1/package.json`
- **Evidence:**
  - `package.json:90` pins `next` to `16.1.6`.
  - Local `npm audit --json` reported known advisories affecting this version, including `GHSA-mq59-m269-xvcx` and `GHSA-ggv3-7p47-pfv8`; the available fix is `next@16.1.7`.
  - `package.json:129` pins `sharp-cli` to `^5.2.0`; `npm audit` flagged its dependency chain (`glob`) with a high-severity command-injection advisory and recommends moving to `sharp-cli@4.2.0`.
- **Exploit Scenario:** Runtime bugs in the framework can enable request smuggling, CSRF bypass in framework primitives, or resource exhaustion. Build/developer tooling flaws increase the chance of CI-agent compromise or malicious file writes during local tooling usage.
- **Business Impact:** Production instability and exploitable framework bugs in the public app; secondary compromise paths in build/maintenance workflows.
- **Remediation Code:**

```json
// /Users/arsene/react/t1/package.json
{
  "dependencies": {
    "next": "16.1.7"
  },
  "devDependencies": {
    "sharp-cli": "^4.2.0"
  }
}
```

After upgrading, re-run:

```bash
npm install
npm audit --production
npm run build
```

## Security Posture Overview

### Strengths observed
- Auth.js sessions are kept in cookies rather than `localStorage`.
- Route handlers generally proxy with `cache: 'no-store'`.
- JSON-LD insertion uses serialization helpers instead of raw string concatenation.
- The project already contains reusable URL sanitizers and an API rate limiter abstraction.

### Missing or weakened global protections
- **Server/client boundary discipline:** Do not expose third-party OAuth tokens or backend integration secrets to client components. Convert them to booleans or server-only fetches.
- **URL sanitization baseline:** Every user- or backend-controlled external URL should flow through a shared sanitizer before reaching `href`, `src`, or `window.open`.
- **Proxy security:** Add explicit origin checks to every state-changing route handler and stop synthesizing `X-XSRF-TOKEN` from cookies server-side.
- **Abuse controls:** Keep `/api/*` behind `enforceApiRateLimit`, but key it off trusted infrastructure headers or session-derived identifiers instead of attacker-controlled forwarding headers.
- **CSP hardening:** Replace `'unsafe-inline'` with nonces/hashes and cut the `script-src` allowlist to the smallest possible set.
- **Dependency hygiene:** Upgrade `next` to `16.1.7+` immediately and clear the remaining `npm audit` findings, prioritizing runtime dependencies over dev-only chains.

### Areas reviewed with no primary finding
- No evidence of auth tokens being stored in `localStorage` or `sessionStorage`.
- No high-confidence SSRF sink was found in server components or route handlers; backend target URLs are env-driven rather than request-driven.
- `dangerouslySetInnerHTML` usage appears confined to serialized JSON-LD and translation-owned content, not raw user-generated HTML.

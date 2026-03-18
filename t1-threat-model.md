# Threat Model

## Scope

- Application: `/Users/arsene/react/t1`
- Frontend framework: Next.js App Router with Auth.js, Route Handlers, server-only API utilities, and mixed client/server rendering
- Backend dependency: External Laravel API over HTTPS
- Primary roles: anonymous visitor, authenticated client, authenticated provider, admin

## Assumptions

- The application is internet-facing and processes real customer/provider traffic.
- Authentication relies on Auth.js session state plus Laravel session cookies and XSRF cookies.
- The browser can reach both the Next.js origin and third-party services such as Pusher, Google Tag Manager, OneSignal, Rapyd, and meeting/call providers.
- Route handlers under `/app/api/**` are reachable directly by attackers using raw HTTP tools, without going through the UI.
- Backend authorization is expected to exist, but the frontend proxy layer must not weaken it.

## Assets

- Auth.js session state and hydrated `session.user`
- Laravel session cookie and `XSRF-TOKEN`
- Provider OAuth credentials, especially GitHub access/refresh tokens
- Company billing and banking details
- Project, escrow, and milestone workflow state
- AI generation quotas and provider test/evaluation quotas
- Realtime channel access and chat attachment URLs

## Trust Boundaries

1. Browser to Next.js application
2. Next.js server components / route handlers to Laravel backend
3. Server-only code to client components through serialized props/session payloads
4. Next.js app to third-party JavaScript and iframe providers
5. Authenticated user data to privileged roles such as admins

## Entry Points

- Page requests under `/app/[locale]/**`
- Route handlers under `/app/api/**`
- Server actions in `/app/actions/secure.ts`
- Hydrated auth state in `/Users/arsene/react/t1/contexts/auth-context.tsx`
- User-controlled URLs rendered into `href`/`src`
- Realtime auth and chat attachment flows

## Attacker Profiles

### Anonymous attacker

- Can send arbitrary requests to `/api/*`
- Can fuzz query strings, request bodies, and headers
- Can attempt credential stuffing and AI-cost abuse

### Authenticated malicious provider/client

- Can submit profile URLs, portfolio links, chat attachments, and project data that later render for other users
- Can trigger high-value escrow, project, and test flows through direct HTTP calls

### In-browser attacker

- DOM XSS payload
- Compromised third-party script
- Malicious browser extension
- Compromised npm dependency executing in the browser bundle

### Infrastructure-adjacent attacker

- Exploits proxy/header trust assumptions
- Relies on weak CSP or framework-level dependency vulnerabilities

## Primary Abuse Paths

### 1. Client-side compromise of OAuth credentials

- Sensitive fields such as `github_token` and `github_refresh_token` are normalized onto the frontend auth user model and copied into Auth.js session state.
- Any script executing in the browser can read those tokens and act against the victim's GitHub account.

### 2. Stored navigation injection via profile, project, chat, or call URLs

- User-controlled URLs are rendered directly into anchors and image sources.
- A malicious user can persist phishing or `javascript:` links that target clients, providers, or admins.

### 3. Proxy-layer weakening of CSRF guarantees

- The proxy reconstructs `X-XSRF-TOKEN` from ambient cookies instead of requiring explicit caller proof.
- State-changing route handlers inherit that behavior, which broadens cross-site request risk and weakens the double-submit-cookie pattern.

### 4. Abuse-control bypass through spoofed client identity

- Rate limiting is enforced centrally, but the limiter identity trusts forwarded-IP style headers.
- In deployments that do not normalize those headers, an attacker can rotate them to evade quotas.

### 5. XSS containment failure after injection

- The global CSP still permits `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`.
- If a DOM or stored injection lands, CSP is unlikely to stop arbitrary script execution.

### 6. Framework / dependency-level compromise

- The app runs on `next@16.1.6`, which has active advisories.
- Known framework vulnerabilities can undermine app-level controls even when the local code is mostly correct.

## Highest-Risk Components

- `/Users/arsene/react/t1/auth.ts`
- `/Users/arsene/react/t1/lib/auth/user.ts`
- `/Users/arsene/react/t1/contexts/auth-context.tsx`
- `/Users/arsene/react/t1/lib/server/laravel-proxy.ts`
- `/Users/arsene/react/t1/lib/server/rate-limit.ts`
- `/Users/arsene/react/t1/proxy.ts`
- `/Users/arsene/react/t1/next.config.js`
- `/Users/arsene/react/t1/app/[locale]/provider/[id]/provider-profile.tsx`
- `/Users/arsene/react/t1/app/[locale]/provider/profile/page.tsx`
- `/Users/arsene/react/t1/components/chat/chat-widget.tsx`
- `/Users/arsene/react/t1/app/[locale]/admin/calls/page.tsx`

## Threats by Category

### Confidentiality

- Leakage of GitHub OAuth secrets into client-side session state
- Exposure of company/billing metadata beyond minimum-needed client usage
- Unauthorized viewing of private links or attachments if URL rendering is not constrained

### Integrity

- Forced state changes through weakened proxy CSRF semantics
- Malicious redirection through persisted external links
- Abuse of escrow, project, or exam flows through direct route-handler access

### Availability

- AI-generation and auth endpoint abuse if rate limiting is bypassed
- Resource exhaustion through vulnerable framework components

## Existing Mitigations

- Cookie-based session handling instead of `localStorage` token storage
- `server-only` usage in some backend request utilities
- Centralized proxy/matcher layer in `/Users/arsene/react/t1/proxy.ts`
- Existing URL-sanitization helpers in the codebase
- A present, though permissive, CSP and several standard security headers

## Recommended Priority Order

1. Remove OAuth and other integration secrets from all client-visible auth/session payloads.
2. Sanitize or allowlist every external URL before it reaches `href`, `src`, or `window.open`.
3. Stop synthesizing `X-XSRF-TOKEN` from cookies in the proxy and add local trusted-origin checks for mutating routes.
4. Tighten rate-limit identity to trusted infrastructure headers or session-derived identifiers.
5. Upgrade `next` to the patched release and clear remaining runtime dependency advisories.
6. Replace CSP `unsafe-inline` allowances with nonce-based script/style policies.

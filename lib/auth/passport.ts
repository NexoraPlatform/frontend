const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

export type PassportTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope?: string;
};

const API_ROOT_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
const PASSPORT_CLIENT_ID =
  process.env.PASSPORT_CLIENT_ID ||
  process.env.LARAVEL_CLIENT_ID ||
  '';
const PASSPORT_CLIENT_SECRET =
  process.env.PASSPORT_CLIENT_SECRET ||
  process.env.LARAVEL_CLIENT_SECRET ||
  '';
const PASSPORT_SCOPE =
  process.env.PASSPORT_SCOPE ||
  process.env.LARAVEL_PASSPORT_SCOPE ||
  '';
const PASSPORT_PROFILE_PATH =
  process.env.PASSPORT_PROFILE_PATH ||
  process.env.LARAVEL_PROFILE_PATH ||
  '/auth/me';
const PASSPORT_LOGOUT_PATH =
  process.env.PASSPORT_LOGOUT_PATH ||
  process.env.LARAVEL_LOGOUT_PATH ||
  '/auth/logout';

const resolveAppOrigin = (fallback?: string | null) =>
  fallback ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  'http://127.0.0.1:3000';

const ensurePassportClientConfig = () => {
  if (!PASSPORT_CLIENT_ID || !PASSPORT_CLIENT_SECRET) {
    throw new Error(
      'Missing Passport client credentials in the frontend server environment. Set PASSPORT_CLIENT_ID/PASSPORT_CLIENT_SECRET or LARAVEL_CLIENT_ID/LARAVEL_CLIENT_SECRET.'
    );
  }
};

const createDefaultHeaders = (origin?: string | null, bearerToken?: string | null) => {
  const appOrigin = resolveAppOrigin(origin);
  const headers = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Origin: appOrigin,
    Referer: appOrigin,
  });

  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }

  return headers;
};

const parseTokenResponse = async (response: Response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.error_description || payload.message || payload.error)) ||
      `Passport token request failed (${response.status})`;
    throw new Error(String(message));
  }

  return payload as PassportTokenResponse;
};

export async function exchangePassportPasswordGrant(params: {
  username: string;
  password: string;
  scope?: string;
  origin?: string | null;
}) {
  ensurePassportClientConfig();

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: PASSPORT_CLIENT_ID,
    client_secret: PASSPORT_CLIENT_SECRET,
    username: params.username,
    password: params.password,
    scope: params.scope ?? PASSPORT_SCOPE,
  });

  const response = await fetch(`${API_ROOT_URL}/oauth/token`, {
    method: 'POST',
    headers: new Headers({
      ...Object.fromEntries(createDefaultHeaders(params.origin).entries()),
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: body.toString(),
    cache: 'no-store',
  });

  return parseTokenResponse(response);
}

export async function refreshPassportAccessToken(params: {
  refreshToken: string;
  scope?: string;
  origin?: string | null;
}) {
  ensurePassportClientConfig();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    client_id: PASSPORT_CLIENT_ID,
    client_secret: PASSPORT_CLIENT_SECRET,
    scope: params.scope ?? PASSPORT_SCOPE,
  });

  const response = await fetch(`${API_ROOT_URL}/oauth/token`, {
    method: 'POST',
    headers: new Headers({
      ...Object.fromEntries(createDefaultHeaders(params.origin).entries()),
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: body.toString(),
    cache: 'no-store',
  });

  return parseTokenResponse(response);
}

export async function fetchPassportUserProfile(
  accessToken: string,
  params?: { origin?: string | null; includeConnectedAccounts?: boolean }
) {
  const url = new URL(`${API_BASE_URL}${PASSPORT_PROFILE_PATH}`);
  if (params?.includeConnectedAccounts !== false && !url.searchParams.has('include')) {
    url.searchParams.set('include', 'connected_accounts');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: createDefaultHeaders(params?.origin ?? null, accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  return payload?.user ?? payload ?? null;
}

export async function revokePassportAccessToken(params: {
  accessToken: string;
  origin?: string | null;
}) {
  const response = await fetch(`${API_BASE_URL}${PASSPORT_LOGOUT_PATH}`, {
    method: 'POST',
    headers: createDefaultHeaders(params.origin ?? null, params.accessToken),
    cache: 'no-store',
  });

  return response;
}

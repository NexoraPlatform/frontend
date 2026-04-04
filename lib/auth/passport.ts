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

const resolvePassportClientIdSource = () => {
  if (process.env.PASSPORT_CLIENT_ID) return 'PASSPORT_CLIENT_ID';
  if (process.env.LARAVEL_CLIENT_ID) return 'LARAVEL_CLIENT_ID';
  return 'missing';
};

const resolvePassportClientSecretSource = () => {
  if (process.env.PASSPORT_CLIENT_SECRET) return 'PASSPORT_CLIENT_SECRET';
  if (process.env.LARAVEL_CLIENT_SECRET) return 'LARAVEL_CLIENT_SECRET';
  return 'missing';
};

const maskValue = (value?: string | null, visibleChars = 4) => {
  if (!value) return null;
  if (value.length <= visibleChars * 2) return '*'.repeat(value.length);
  return `${value.slice(0, visibleChars)}...${value.slice(-visibleChars)}`;
};

const buildPassportDebugContext = (params?: {
  origin?: string | null;
  grantType?: string;
  username?: string | null;
}) => ({
  nodeEnv: process.env.NODE_ENV ?? 'unknown',
  apiBaseUrl: API_BASE_URL,
  apiRootUrl: API_ROOT_URL,
  origin: params?.origin ?? null,
  grantType: params?.grantType ?? null,
  usernameMasked: maskValue(params?.username ?? null, 2),
  passportClientIdSource: resolvePassportClientIdSource(),
  passportClientIdMasked: maskValue(PASSPORT_CLIENT_ID),
  passportClientSecretSource: resolvePassportClientSecretSource(),
  passportClientSecretPresent: PASSPORT_CLIENT_SECRET.length > 0,
  passportClientSecretLength: PASSPORT_CLIENT_SECRET.length || 0,
  passportScope: PASSPORT_SCOPE,
  passportProfilePath: PASSPORT_PROFILE_PATH,
  passportLogoutPath: PASSPORT_LOGOUT_PATH,
});

const resolveAppOrigin = (fallback?: string | null) =>
  fallback ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  'http://127.0.0.1:3000';

const ensurePassportClientConfig = (params?: {
  origin?: string | null;
  grantType?: string;
  username?: string | null;
}) => {
  if (!PASSPORT_CLIENT_ID || !PASSPORT_CLIENT_SECRET) {
    console.error('[passport][config-missing]', buildPassportDebugContext(params));
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

const parseTokenResponse = async (
  response: Response,
  params?: {
    origin?: string | null;
    grantType?: string;
    username?: string | null;
  }
) => {
  const payload = await response.json().catch(() => null);
  const errorPayload =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : null;

  if (!response.ok) {
    console.error('[passport][token-error]', {
      ...buildPassportDebugContext(params),
      status: response.status,
      statusText: response.statusText,
      responseError:
        errorPayload
          ? {
              error: errorPayload.error ?? null,
              error_description: errorPayload.error_description ?? null,
              message: errorPayload.message ?? null,
            }
          : null,
    });
    const message =
      (errorPayload && (errorPayload.error_description || errorPayload.message || errorPayload.error)) ||
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
  ensurePassportClientConfig({
    origin: params.origin,
    grantType: 'password',
    username: params.username,
  });

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

  return parseTokenResponse(response, {
    origin: params.origin,
    grantType: 'password',
    username: params.username,
  });
}

export async function refreshPassportAccessToken(params: {
  refreshToken: string;
  scope?: string;
  origin?: string | null;
}) {
  ensurePassportClientConfig({
    origin: params.origin,
    grantType: 'refresh_token',
  });

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

  return parseTokenResponse(response, {
    origin: params.origin,
    grantType: 'refresh_token',
  });
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

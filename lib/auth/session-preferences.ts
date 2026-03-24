export const REMEMBER_ME_COOKIE_NAME = 'trustora-remember';
export const BROWSER_SESSION_COOKIE_NAME = 'trustora-browser-session';
export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

export const NEXT_AUTH_SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

type CookieGetter = {
  get: (name: string) => { value?: string } | undefined;
};

const isCookieEnabled = (value?: string | null) => value === '1';

export const hasRememberMeCookie = (cookies: CookieGetter) =>
  isCookieEnabled(cookies.get(REMEMBER_ME_COOKIE_NAME)?.value);

export const hasBrowserSessionCookie = (cookies: CookieGetter) =>
  isCookieEnabled(cookies.get(BROWSER_SESSION_COOKIE_NAME)?.value);

export const isBrowserSessionExpired = (rememberMe: boolean, cookies: CookieGetter) =>
  !rememberMe && !hasBrowserSessionCookie(cookies);

export const setSessionPreferenceCookies = (rememberMe: boolean) => {
  if (typeof document === 'undefined') return;

  const baseAttributes = 'Path=/; SameSite=Lax';
  if (rememberMe) {
    document.cookie = `${REMEMBER_ME_COOKIE_NAME}=1; Max-Age=${REMEMBER_ME_MAX_AGE}; ${baseAttributes}`;
    document.cookie = `${BROWSER_SESSION_COOKIE_NAME}=; Max-Age=0; ${baseAttributes}`;
    return;
  }

  document.cookie = `${REMEMBER_ME_COOKIE_NAME}=; Max-Age=0; ${baseAttributes}`;
  document.cookie = `${BROWSER_SESSION_COOKIE_NAME}=1; ${baseAttributes}`;
};

export const clearSessionPreferenceCookies = () => {
  if (typeof document === 'undefined') return;

  const baseAttributes = 'Path=/; SameSite=Lax';
  document.cookie = `${REMEMBER_ME_COOKIE_NAME}=; Max-Age=0; ${baseAttributes}`;
  document.cookie = `${BROWSER_SESSION_COOKIE_NAME}=; Max-Age=0; ${baseAttributes}`;
};

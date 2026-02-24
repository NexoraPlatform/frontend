const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

let csrfPromise: Promise<void> | null = null;

export const getXsrfToken = () => {
  const value = getCookieValue('XSRF-TOKEN');
  return value ? decodeURIComponent(value) : null;
};

export const ensureCsrfCookie = async () => {
  if (typeof window === 'undefined') return;
  if (getCookieValue('XSRF-TOKEN')) return;

  const csrfEndpoints = [`${API_ROOT_URL}/sanctum/csrf-cookie`, '/api/sanctum/csrf-cookie'];

  if (!csrfPromise) {
    csrfPromise = (async () => {
      let lastError: unknown = null;

      for (const endpoint of csrfEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(`Failed to initialize CSRF cookie (${response.status})`);
          }

          if (process.env.NODE_ENV !== 'production') {
            const hasXsrfToken = Boolean(getCookieValue('XSRF-TOKEN'));
            const hasLaravelSession = Boolean(getCookieValue('laravel_session'));
            console.log('[csrf] initialized', {
              endpoint,
              hasXsrfToken,
              hasLaravelSession,
            });
          }

          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError ?? new Error('Failed to initialize CSRF cookie');
    })()
      .finally(() => {
        csrfPromise = null;
      });
  }

  await csrfPromise;
};

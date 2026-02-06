import Axios, { InternalAxiosRequestConfig } from 'axios';

// 1. Definim constantele
const DEFAULT_CURRENCY = 'USD';
const CURRENCY_STORAGE_KEY = 'preferred_currency';

// 2. Extragem logica de Language (Helper Function)
const getSelectedLanguageFromPathname = (): string | null => {
  if (typeof window === 'undefined') return null;

  // A. Din URL Path
  const pathnameLocale = window.location.pathname.split('/')[1]?.toLowerCase();
  if (pathnameLocale === 'ro' || pathnameLocale === 'en') {
    return pathnameLocale;
  }

  // B. Din LocalStorage
  const storedLocale = localStorage.getItem('NEXT_LOCALE')?.toLowerCase();
  if (storedLocale === 'ro' || storedLocale === 'en') {
    return storedLocale;
  }

  // C. Din Cookie
  const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1]
      ?.toLowerCase();
  if (cookieLocale === 'ro' || cookieLocale === 'en') {
    return cookieLocale;
  }

  // D. Din HTML lang tag
  const htmlLang = document.documentElement?.lang?.toLowerCase();
  if (htmlLang === 'ro' || htmlLang === 'en') {
    return htmlLang;
  }

  return null;
};

// 3. Extragem logica de Currency (Helper Function)
const getSelectedCurrencyFromStorage = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  return localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
};


// 4. Creăm instanța Axios
const axios = Axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://Trustorabe.dacars.ro/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
  withCredentials: true, // Critic pentru Sanctum Cookie Auth
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});


const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return false;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

const hasCookie = (name: string) => {
  return Boolean(getCookieValue(name));
};

const resolveUrl = (value: string) => {
  const base =
    axios.defaults.baseURL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
};

const urlHasParam = (value: string, param: string) => {
  const url = resolveUrl(value);
  if (!url) return false;
  return url.searchParams.has(param);
};

let csrfPromise: Promise<void> | null = null;
export const ensureCsrfCookie = async () => {
  if (typeof window === 'undefined') return;
  if (hasCookie('XSRF-TOKEN')) return;
  if (!csrfPromise) {
    const apiBase = axios.defaults.baseURL || '';
    const apiUrl = resolveUrl(apiBase || '/');
    if (apiUrl && apiUrl.host && apiUrl.host !== window.location.host) {
      console.warn(
        `API host (${apiUrl.host}) differs from app host (${window.location.host}). ` +
          'Sanctum cookies are host-bound; align hosts or use a proxy to avoid CSRF 419.'
      );
    }
    const rootUrl = apiBase.replace(/\/api\/?$/, '');
    const csrfUrl = `${rootUrl}/sanctum/csrf-cookie`;
    csrfPromise = Axios.get(csrfUrl, {
      withCredentials: true,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).then(() => undefined).finally(() => {
      csrfPromise = null;
    });
  }
  await csrfPromise;
  if (!hasCookie('XSRF-TOKEN')) {
    console.warn(
      'XSRF-TOKEN cookie missing after /sanctum/csrf-cookie. Check domain alignment and SANCTUM_STATEFUL_DOMAINS.'
    );
  }
};

// 5. REQUEST INTERCEPTOR (Aici se întâmplă magia cu params)
axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const requestUrl = String(config.url ?? '');
  const isCsrfRequest = requestUrl.includes('/sanctum/csrf-cookie');
  const isBroadcastAuth = requestUrl.includes('/broadcasting/auth');
  const shouldAttachParams = !isCsrfRequest && !isBroadcastAuth;
  const method = (config.method || 'get').toLowerCase();
  const isSafeMethod = method === 'get' || method === 'head' || method === 'options';

  if (!isSafeMethod && !isCsrfRequest) {
    await ensureCsrfCookie();
  }

  // Asigurăm că obiectul params există
  config.params = config.params || {};

  const selectedLanguage = getSelectedLanguageFromPathname();
  const selectedCurrency = getSelectedCurrencyFromStorage();

  // Logica ta: Dacă există limbă și nu e setată deja, o punem
  if (
    shouldAttachParams &&
    selectedLanguage &&
    !config.params.language &&
    !urlHasParam(requestUrl, 'language')
  ) {
    config.params.language = selectedLanguage;
  }

  // Logica ta: Dacă există monedă și nu e setată deja, o punem
  if (
    shouldAttachParams &&
    selectedCurrency &&
    !config.params.currency &&
    !urlHasParam(requestUrl, 'currency')
  ) {
    config.params.currency = selectedCurrency;
  }

  const xsrfToken = getCookieValue('XSRF-TOKEN');
  if (xsrfToken) {
    const decodedToken = decodeURIComponent(xsrfToken);
    if (typeof (config.headers as any)?.set === 'function') {
      (config.headers as any).set('X-XSRF-TOKEN', decodedToken);
    } else {
      config.headers = config.headers || {};
      if (!(config.headers as Record<string, any>)['X-XSRF-TOKEN']) {
        (config.headers as Record<string, any>)['X-XSRF-TOKEN'] = decodedToken;
      }
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});


// 6. RESPONSE INTERCEPTOR (Aici gestionăm 419 CSRF global)
// Mutăm logica de Retry 419 din ApiClient direct aici, ca să fie globală
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Detectăm eroarea 419 (CSRF Mismatch)
      if (error.response?.status === 419 && !originalRequest._retry) {
        if (isRefreshing) {
          // Dacă deja se face refresh, punem request-ul în coadă
          return new Promise(function(resolve, reject) {
            failedQueue.push({resolve, reject});
          }).then(() => {
            return axios(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Cerem cookie nou (fără /api în path, de obicei e la root)
          // Calculăm rootUrl din baseURL
          const apiBase = axios.defaults.baseURL || '';
          const rootUrl = apiBase.replace(/\/api\/?$/, '');

          await Axios.get(`${rootUrl}/sanctum/csrf-cookie`, {
            withCredentials: true,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });

          processQueue(null);
          isRefreshing = false;

          // Repetăm request-ul original
          return axios(originalRequest);
        } catch (err) {
          processQueue(err, null);
          isRefreshing = false;
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
);

export default axios;

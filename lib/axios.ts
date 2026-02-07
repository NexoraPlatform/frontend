import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Trustorabe.dacars.ro/api';
const API_ROOT_URL = API_URL.replace(/\/+$/, '').replace(/\/api$/, '');

const DEFAULT_CURRENCY = 'USD';
const CURRENCY_STORAGE_KEY = 'preferred_currency';
const SUPPORTED_LOCALES = new Set(['ro', 'en']);

type ParamValue = string | number | boolean | null | undefined;
type ParamsType = URLSearchParams | Record<string, ParamValue>;

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url) || url.startsWith('//');

const normalizeApiUrl = (url: string) => {
  if (!url) return url;
  if (isAbsoluteUrl(url)) return url;
  if (url.startsWith('/sanctum')) return url;
  if (url === '/api' || url.startsWith('/api/')) return url;
  if (url.startsWith('/')) return `/api${url}`;
  return `/api/${url}`;
};

const normalizeParams = (params: unknown): ParamsType => {
  if (!params) return {};
  if (params instanceof URLSearchParams) return params;
  if (typeof params === 'string') return new URLSearchParams(params);
  if (typeof params === 'object') return { ...(params as Record<string, ParamValue>) };
  return {};
};

const hasParamInUrl = (url: string, key: string) => {
  try {
    const parsed = new URL(url, 'http://local');
    return parsed.searchParams.has(key);
  } catch {
    return false;
  }
};

const ensureParam = (params: ParamsType, key: string, value: string | null, url?: string) => {
  if (!value) return params;
  if (url && hasParamInUrl(url, key)) return params;
  if (params instanceof URLSearchParams) {
    if (!params.has(key)) params.set(key, value);
    return params;
  }
  if (!(key in params)) {
    params[key] = value;
  }
  return params;
};

const getSelectedLanguage = (): string | null => {
  if (typeof window === 'undefined') return null;

  const pathnameLocale = window.location.pathname.split('/')[1]?.toLowerCase();
  if (pathnameLocale && SUPPORTED_LOCALES.has(pathnameLocale)) {
    return pathnameLocale;
  }

  const queryLocale = new URLSearchParams(window.location.search).get('language')?.toLowerCase();
  if (queryLocale && SUPPORTED_LOCALES.has(queryLocale)) {
    return queryLocale;
  }

  const storedLocale = localStorage.getItem('NEXT_LOCALE')?.toLowerCase();
  if (storedLocale && SUPPORTED_LOCALES.has(storedLocale)) {
    return storedLocale;
  }

  const cookieLocale = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1]
    ?.toLowerCase();

  if (cookieLocale && SUPPORTED_LOCALES.has(cookieLocale)) {
    return cookieLocale;
  }

  const htmlLang = document.documentElement?.lang?.toLowerCase();
  if (htmlLang && SUPPORTED_LOCALES.has(htmlLang)) {
    return htmlLang;
  }

  return null;
};

const getSelectedCurrency = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  const queryCurrency = new URLSearchParams(window.location.search).get('currency');
  if (queryCurrency) return queryCurrency;
  return localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
};

const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

const axiosInstance = axios.create({
  baseURL: API_ROOT_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Ensure XSRF header is sent even for cross-site requests when cookie is available
(axiosInstance.defaults as any).withXSRFToken = true;

axiosInstance.interceptors.request.use((config) => {
  if (config.url) {
    config.url = normalizeApiUrl(config.url);
  }

  const language = getSelectedLanguage();
  const currency = getSelectedCurrency();
  const params = normalizeParams(config.params);
  const url = typeof config.url === 'string' ? config.url : undefined;

  config.params = ensureParam(
    ensureParam(params, 'language', language, url),
    'currency',
    currency,
    url
  );

  const xsrfToken = getCookieValue('XSRF-TOKEN');
  if (xsrfToken) {
    const headerName = 'X-XSRF-TOKEN';
    const decoded = decodeURIComponent(xsrfToken);
    if (config.headers) {
      const headers = config.headers as any;
      if (typeof headers.set === 'function') {
        headers.set(headerName, decoded);
      } else if (!headers[headerName]) {
        headers[headerName] = decoded;
      }
    } else {
      config.headers = { [headerName]: decoded };
    }
  }
  return config;
});

type CsrfRetryConfig = AxiosRequestConfig & { _csrfRetry?: boolean };

let isRefreshing = false;
const retryQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: CsrfRetryConfig;
}> = [];

const flushQueue = (error?: unknown) => {
  while (retryQueue.length) {
    const queued = retryQueue.shift();
    if (!queued) continue;
    if (error) {
      queued.reject(error);
    } else {
      queued.resolve(axiosInstance(queued.config));
    }
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as CsrfRetryConfig | undefined;

    if (!originalConfig || status !== 419) {
      return Promise.reject(error);
    }

    if (originalConfig._csrfRetry) {
      return Promise.reject(error);
    }

    const originalUrl = typeof originalConfig.url === 'string' ? originalConfig.url : '';
    if (originalUrl.includes('/sanctum/csrf-cookie')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        retryQueue.push({
          resolve,
          reject,
          config: { ...originalConfig, _csrfRetry: true } as CsrfRetryConfig,
        });
      });
    }

    originalConfig._csrfRetry = true;
    isRefreshing = true;

    try {
      await axiosInstance.get('/sanctum/csrf-cookie');
      flushQueue();
      return axiosInstance(originalConfig);
    } catch (refreshError) {
      flushQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;

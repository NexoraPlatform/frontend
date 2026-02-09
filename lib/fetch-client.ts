/**
 * Lightweight fetch client for Next.js 15+ Server Components
 * Replaces heavy axios dependency to utilize native Request Memoization and Caching
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://Trustorabe.dacars.ro/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

// Types
export interface FetchOptions extends Omit<RequestInit, 'body'> {
    body?: any;
    params?: Record<string, string | number | boolean | null | undefined>;
}

export interface ApiResponse<T = any> {
    data: T;
    status: number;
    headers: Headers;
}

export class FetchError extends Error {
    status: number;
    response?: Response;
    data?: any;

    constructor(message: string, status: number, response?: Response, data?: any) {
        super(message);
        this.name = 'FetchError';
        this.status = status;
        this.response = response;
        this.data = data;
    }
}

// Helper to normalize API URLs
const normalizeApiUrl = (url: string): string => {
    if (!url) return url;
    // Absolute URLs
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    // Sanctum, explicitly use slash
    if (url.startsWith('/sanctum')) return url;
    // Already has /api prefix
    if (url === '/api' || url.startsWith('/api/')) return url;
    // Add /api prefix
    if (url.startsWith('/')) return `/api${url}`;
    return `/api/${url}`;
};

// Build query string from params
const buildQueryString = (params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) return '';

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
        } else {
            searchParams.append(key, String(value));
        }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

/**
 * Base fetch client
 * For Server Components: Uses native fetch with Next.js caching
 * For Client Components: Manages cookies via document.cookie
 */
export async function fetchClient<T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const {
        params,
        headers: customHeaders = {},
        body,
        ...init
    } = options;

    // Normalize URL
    let url = normalizeApiUrl(endpoint);
    const baseUrl = API_ROOT_URL;

    // Add query params
    const queryString = buildQueryString(params);
    url = `${baseUrl}${url}${queryString}`;

    // Build headers
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    // Add custom headers
    Object.entries(customHeaders).forEach(([key, value]) => {
        if (value !== undefined) {
            headers[key] = String(value);
        }
    });

    // Handle body serialization
    let finalBody: BodyInit | undefined;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (body !== undefined) {
        if (isFormData) {
            finalBody = body;
            // Let browser set Content-Type with boundary for FormData
        } else {
            headers['Content-Type'] = 'application/json';
            finalBody = JSON.stringify(body);
        }
    }

    // Server-side: Forward cookies from Next.js cookies() helper
    if (typeof window === 'undefined') {
        // This runs on the server
        // Cookies will be passed by calling code using Next.js cookies() helper
        // (see usage in services)
    } else {
        // Client-side: Include credentials for cookie-based auth
        init.credentials = 'include';

        // Get XSRF token from cookies if available
        const getCookieValue = (name: string) => {
            const match = document.cookie
                .split(';')
                .map((part) => part.trim())
                .find((part) => part.startsWith(`${name}=`));
            if (!match) return null;
            return match.slice(name.length + 1);
        };

        const xsrfToken = getCookieValue('XSRF-TOKEN');
        if (xsrfToken) {
            headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
    }

    // Make request
    const response = await fetch(url, {
        ...init,
        headers,
        body: finalBody,
    });

    // Handle response
    if (!response.ok) {
        let errorData: any;
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
            errorData = await response.json();
            errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
            // Response is not JSON
        }

        throw new FetchError(errorMessage, response.status, response, errorData);
    }

    // Parse successful response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return await response.json();
    }

    // Return response as-is for non-JSON
    return response as any;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const http = {
    get: <T = any>(endpoint: string, options?: FetchOptions) =>
        fetchClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
        fetchClient<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
        fetchClient<T>(endpoint, { ...options, method: 'PUT', body }),

    patch: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
        fetchClient<T>(endpoint, { ...options, method: 'PATCH', body }),

    delete: <T = any>(endpoint: string, options?: FetchOptions) =>
        fetchClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default fetchClient;

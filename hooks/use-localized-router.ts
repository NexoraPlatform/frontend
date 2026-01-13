'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import { useLocale } from './use-locale';

/**
 * Custom hook that wraps Next.js router to automatically handle locale in URLs.
 */
export function useLocalizedRouter() {
    const router = useNextRouter();
    const locale = useLocale();

    const getLocalizedPath = (path: string) => {
        // If path is external, return as is
        if (path.startsWith('http')) return path;

        // If path already starts with the locale, return as is
        if (path.startsWith(`/${locale}/`) || path === `/${locale}`) return path;

        // Ensure path starts with /
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        // Construct localized path
        return `/${locale}${cleanPath}`;
    };

    return {
        ...router,
        push: (href: string, options?: any) => {
            return router.push(getLocalizedPath(href), options);
        },
        replace: (href: string, options?: any) => {
            return router.replace(getLocalizedPath(href), options);
        },
        prefetch: (href: string, options?: any) => {
            return router.prefetch(getLocalizedPath(href), options);
        },
    };
}

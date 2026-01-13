'use client';

import { useParams } from 'next/navigation';
import { Locale } from '@/types/locale';
import { defaultLocale } from '@/lib/i18n';

/**
 * Hook to get the current locale from the URL parameters.
 * Returns the current locale or the default locale if not found.
 */
export function useLocale(): Locale {
    const params = useParams();
    const locale = params?.locale as Locale;

    if (locale && (locale === 'ro' || locale === 'en')) {
        return locale;
    }

    return defaultLocale;
}

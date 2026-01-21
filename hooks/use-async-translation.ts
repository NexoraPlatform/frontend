'use client';

import {useTranslations} from 'next-intl';
import type {Locale} from '@/types/locale';

/**
 * @deprecated Prefer next-intl's useTranslations directly.
 */
export function useAsyncTranslation(_locale: Locale, key: string, fallback = '') {
    const t = useTranslations();

    return fallback ? t(key, {defaultValue: fallback}) : t(key);
}

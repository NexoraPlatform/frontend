'use client';

import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n';
import { Locale } from '@/types/locale';

export function useAsyncTranslation(locale: Locale, key: string, fallback = '') {
    const [value, setValue] = useState(fallback);

    useEffect(() => {
        let active = true;
        t(locale, key).then((str) => {
            if (active) setValue(str);
        });
        return () => {
            active = false;
        };
    }, [locale, key]);

    return value;
}

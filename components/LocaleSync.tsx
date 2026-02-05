'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    if (!locale) return;

    try {
      localStorage.setItem('NEXT_LOCALE', locale);
    } catch {}

    try {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    } catch {}

    if (document?.documentElement) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}

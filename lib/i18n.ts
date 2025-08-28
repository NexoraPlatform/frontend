import {Locale} from '@/types/locale';

export const locales: Locale[] = ['ro', 'en'];
export const defaultLocale: Locale = 'ro';

export const localeConfig = {
    ro: {
        name: 'Română',
        flag: '🇷🇴',
    },
    en: {
        name: 'English',
        flag: '🇬🇧',
    },
};

// Basic translations structure - expand as needed
export const translations = {
    ro: {
        navigation: () => import("@/locales/ro/navigation.json"),
        common: () => import("@/locales/ro/common.json"),
        homepage: () => import("@/locales/ro/homepage.json"),
        errors: () => import("@/locales/ro/errors.json"),
        admin: () => import("@/locales/ro/admin.json"),
    },
    en: {
        navigation: () => import("@/locales/en/navigation.json"),
        common: () => import("@/locales/en/common.json"),
        homepage: () => import("@/locales/en/homepage.json"),
        errors: () => import("@/locales/en/errors.json"),
        admin: () => import("@/locales/en/admin.json"),
    },
};

export async function getTranslation(locale: Locale, key: string): Promise<string> {
    const keys = key.split('.'); // e.g. ['homepage', 'hero', 'title']
    const namespace = keys.shift(); // 'homepage'

    const loadNamespace = translations[locale]?.[namespace as keyof typeof translations[typeof locale]];
    if (!loadNamespace) return key;

    let value: any = await loadNamespace();
    for (const k of keys) {
        value = value?.[k];
    }

    return value ?? key;
}

// Async wrapper function
export async function t(locale: Locale, key: string): Promise<string> {
    return getTranslation(locale, key);
}

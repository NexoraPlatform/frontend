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

type NamespaceLoader = () => Promise<any>;

// Basic translations structure - expand as needed
export const translations: Record<Locale, Record<string, NamespaceLoader | NamespaceLoader[]>> = {
    ro: {
        navigation: [
            () => import("@/locales/ro/navigation/main.json"),
            () => import("@/locales/ro/navigation/account.json"),
        ],
        common: [
            () => import("@/locales/ro/common/search.json"),
            () => import("@/locales/ro/common/join.json"),
            () => import("@/locales/ro/common/stats.json"),
            () => import("@/locales/ro/common/ui.json"),
            () => import("@/locales/ro/common/accessibility.json"),
            () => import("@/locales/ro/common/footer.json"),
            () => import("@/locales/ro/common/newsletter.json"),
            () => import("@/locales/ro/common/policies.json"),
            () => import("@/locales/ro/common/lists.json"),
            () => import("@/locales/ro/common/notifications.json"),
            () => import("@/locales/ro/common/banner.json"),
        ],
        homepage: [
            () => import("@/locales/ro/homepage/hero.json"),
            () => import("@/locales/ro/homepage/features.json"),
            () => import("@/locales/ro/homepage/why_Trustora.json"),
            () => import("@/locales/ro/homepage/testimonials.json"),
            () => import("@/locales/ro/homepage/cta.json"),
            () => import("@/locales/ro/homepage/explore_services_in_category.json"),
        ],
        services: [
            () => import("@/locales/ro/services/page.json"),
            () => import("@/locales/ro/services/filters.json"),
            () => import("@/locales/ro/services/results.json"),
            () => import("@/locales/ro/services/actions.json"),
        ],
        trustora: [
            () => import("@/locales/ro/trustora/hero.json"),
            () => import("@/locales/ro/trustora/pillars.json"),
            () => import("@/locales/ro/trustora/messaging.json"),
            () => import("@/locales/ro/trustora/visual.json"),
            () => import("@/locales/ro/trustora/final_cta.json"),
            () => import("@/locales/ro/trustora/early_access.json"),
            () => import("@/locales/ro/trustora/open_soon.json"),
        ],
        errors: [() => import("@/locales/ro/errors/page.json")],
        admin: [
            () => import("@/locales/ro/admin/loading.json"),
            () => import("@/locales/ro/admin/dashboard.json"),
            () => import("@/locales/ro/admin/early_access.json"),
            () => import("@/locales/ro/admin/categories.json"),
            () => import("@/locales/ro/admin/calls.json"),
            () => import("@/locales/ro/admin/disputes.json"),
            () => import("@/locales/ro/admin/analytics.json"),
            () => import("@/locales/ro/admin/orders.json"),
            () => import("@/locales/ro/admin/roles.json"),
            () => import("@/locales/ro/admin/services.json"),
            () => import("@/locales/ro/admin/settings.json"),
            () => import("@/locales/ro/admin/tests.json"),
            () => import("@/locales/ro/admin/users.json"),
            () => import("@/locales/ro/admin/newsletter.json"),
        ],
        auth: [
            () => import("@/locales/ro/auth/signin.json"),
            () => import("@/locales/ro/auth/signup.json"),
        ],
    },
    en: {
        navigation: [
            () => import("@/locales/en/navigation/main.json"),
            () => import("@/locales/en/navigation/account.json"),
        ],
        common: [
            () => import("@/locales/en/common/search.json"),
            () => import("@/locales/en/common/join.json"),
            () => import("@/locales/en/common/stats.json"),
            () => import("@/locales/en/common/ui.json"),
            () => import("@/locales/en/common/accessibility.json"),
            () => import("@/locales/en/common/footer.json"),
            () => import("@/locales/en/common/newsletter.json"),
            () => import("@/locales/en/common/policies.json"),
            () => import("@/locales/en/common/lists.json"),
            () => import("@/locales/en/common/notifications.json"),
            () => import("@/locales/en/common/banner.json"),
        ],
        homepage: [
            () => import("@/locales/en/homepage/hero.json"),
            () => import("@/locales/en/homepage/features.json"),
            () => import("@/locales/en/homepage/why_Trustora.json"),
            () => import("@/locales/en/homepage/testimonials.json"),
            () => import("@/locales/en/homepage/cta.json"),
            () => import("@/locales/en/homepage/explore_services_in_category.json"),
        ],
        services: [
            () => import("@/locales/en/services/page.json"),
            () => import("@/locales/en/services/filters.json"),
            () => import("@/locales/en/services/results.json"),
            () => import("@/locales/en/services/actions.json"),
        ],
        trustora: [
            () => import("@/locales/en/trustora/hero.json"),
            () => import("@/locales/en/trustora/pillars.json"),
            () => import("@/locales/en/trustora/messaging.json"),
            () => import("@/locales/en/trustora/visual.json"),
            () => import("@/locales/en/trustora/final_cta.json"),
            () => import("@/locales/en/trustora/early_access.json"),
            () => import("@/locales/en/trustora/open_soon.json"),
        ],
        errors: [() => import("@/locales/en/errors/page.json")],
        admin: [
            () => import("@/locales/en/admin/loading.json"),
            () => import("@/locales/en/admin/dashboard.json"),
            () => import("@/locales/en/admin/early_access.json"),
            () => import("@/locales/en/admin/categories.json"),
            () => import("@/locales/en/admin/calls.json"),
            () => import("@/locales/en/admin/disputes.json"),
            () => import("@/locales/en/admin/analytics.json"),
            () => import("@/locales/en/admin/orders.json"),
            () => import("@/locales/en/admin/roles.json"),
            () => import("@/locales/en/admin/services.json"),
            () => import("@/locales/en/admin/settings.json"),
            () => import("@/locales/en/admin/tests.json"),
            () => import("@/locales/en/admin/users.json"),
            () => import("@/locales/en/admin/newsletter.json"),
        ],
        auth: [
            () => import("@/locales/en/auth/signin.json"),
            () => import("@/locales/en/auth/signup.json"),
        ],
    },
};

const namespaceCache: Record<Locale, Record<string, any>> = {
    ro: {},
    en: {},
};

export async function getTranslation(locale: Locale, key: string): Promise<string> {
    const keys = key.split('.'); // e.g. ['homepage', 'hero', 'title']
    const namespace = keys.shift(); // 'homepage'

    if (!namespace) return key;

    const resolvedLocale = translations[locale] ? locale : defaultLocale;
    if (!namespaceCache[resolvedLocale]) {
        namespaceCache[resolvedLocale] = {};
    }

    if (!namespaceCache[resolvedLocale][namespace]) {
        const loadNamespace =
            translations[resolvedLocale]?.[namespace as keyof typeof translations[typeof resolvedLocale]];
        if (!loadNamespace) return key;

        const loaders = Array.isArray(loadNamespace) ? loadNamespace : [loadNamespace];
        const loaded = await Promise.all(
            loaders.map(async (loader) => {
                const loadedModule = await loader();
                return loadedModule?.default ?? loadedModule;
            }),
        );

        namespaceCache[resolvedLocale][namespace] = Object.assign({}, ...loaded);
    }

    let value: any = namespaceCache[resolvedLocale][namespace];
    for (const k of keys) {
        value = value?.[k];
    }

    return value ?? key;
}

// Async wrapper function
export async function t(locale: Locale, key: string): Promise<string> {
    return getTranslation(locale, key);
}

import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';
import {defaultLocale} from '@/lib/i18n';

export const locales = ['en', 'ro'] as const;

export const routing = defineRouting({
    locales,
    defaultLocale,
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);

'use client';

import { useState, useEffect } from 'react';
import { locales, localeConfig } from '@/lib/i18n';
import { Locale } from '@/types/locale';
import { Link, usePathname, useRouter } from '@/lib/navigation';
import { useLocale } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LOCALE_COOKIE_NAME = 'preferred_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleSwitcher({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const currentLocale = useLocale() as Locale;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const setLocaleCookie = (locale: Locale) => {
        document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    };

    const currentConfig = localeConfig[currentLocale];

    const handleLocaleChange = (locale: Locale) => {
        setLocaleCookie(locale);
        router.replace(pathname, { locale });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn('h-11 w-auto px-3 flex items-center gap-2 rounded-xl', className)}
                    aria-label="Schimbă limba"
                >
                    <span className="text-[24px] leading-none relative top-[1px]"
                          aria-hidden="true">{currentConfig.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="center" forceMount>
                {locales.map((locale) => {
                    const config = localeConfig[locale];
                    const isCurrent = locale === currentLocale;

                    return (
                        <DropdownMenuItem key={locale} asChild>
                            <Link
                                href={pathname}
                                locale={locale}
                                aria-current={isCurrent ? 'true' : undefined}
                                hrefLang={locale}
                                onClick={() => handleLocaleChange(locale)}
                                className={`flex items-center gap-2 text-sm w-full ${isCurrent ? 'font-semibold text-primary' : ''}`}
                            >
                                <span className="text-[18px] leading-none relative top-[1px]"
                                      aria-hidden="true">{config.flag}</span>
                                <span>{config.name}</span>
                            </Link>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { locales, localeConfig } from '@/lib/i18n';
import { Locale } from '@/types/locale';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LocaleSwitcherProps {
    currentLocale: Locale;
    className?: string;
}

const LOCALE_COOKIE_NAME = 'preferred_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleSwitcher({ currentLocale, className }: LocaleSwitcherProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const getLocalizedPath = (locale: Locale) => {
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
        return `/${locale}${pathWithoutLocale}`;
    };

    const setLocaleCookie = (locale: Locale) => {
        document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    };

    const currentConfig = localeConfig[currentLocale];

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
                                href={getLocalizedPath(locale)}
                                aria-current={isCurrent ? 'true' : undefined}
                                hrefLang={locale}
                                onClick={() => setLocaleCookie(locale)}
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

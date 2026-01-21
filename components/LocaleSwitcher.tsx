'use client';

import { useEffect, useState, useTransition } from 'react';
import { locales, localeConfig } from '@/lib/i18n';
import type { Locale } from '@/types/locale';
import { usePathname, useRouter } from '@/lib/navigation';
import { useLocale } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LocaleSwitcher({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const currentLocale = useLocale() as Locale;
    const [mounted, setMounted] = useState(false);
    const [, startTransition] = useTransition();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentConfig = localeConfig[currentLocale];

    const handleLocaleChange = (nextLocale: Locale) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn('h-11 w-auto px-3 flex items-center gap-2 rounded-xl', className)}
                    aria-label="Schimbă limba"
                >
                    <span className="text-[24px] leading-none relative top-[1px]" aria-hidden="true">
                        {currentConfig.flag}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="center" forceMount>
                {locales.map((locale) => {
                    const config = localeConfig[locale];
                    const isCurrent = locale === currentLocale;

                    return (
                        <DropdownMenuItem
                            key={locale}
                            onSelect={() => handleLocaleChange(locale)}
                            className={`flex items-center gap-2 text-sm w-full ${
                                isCurrent ? 'font-semibold text-primary' : ''
                            }`}
                        >
                            <span className="text-[18px] leading-none relative top-[1px]" aria-hidden="true">
                                {config.flag}
                            </span>
                            <span>{config.name}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

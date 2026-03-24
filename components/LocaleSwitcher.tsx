'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { locales } from '@/lib/navigation';
import { localeConfig } from '@/lib/i18n';
import { usePathname, useRouter } from '@/lib/navigation';
import { useOptionalAuth } from '@/contexts/auth-context';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicAuth } from '@/hooks/use-public-auth';

interface LocaleSwitcherProps {
    className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const authContext = useOptionalAuth();
    const publicAuth = usePublicAuth(!authContext);
    const user = authContext?.user ?? publicAuth.user;
    const setUserLanguage = authContext?.setUserLanguage ?? publicAuth.setUserLanguage;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentConfig = localeConfig[locale as keyof typeof localeConfig];
    const normalizedPathname =
        pathname.replace(new RegExp(`^/(${locales.join('|')})(?=/|$)`), '') || '/';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        'h-11 w-auto px-3 flex items-center gap-2 rounded-xl text-foreground hover:text-foreground dark:text-white dark:hover:text-white',
                        className
                    )}
                    aria-label="Schimbă limba"
                >
                    <span className="text-[24px] leading-none relative top-[1px]"
                          aria-hidden="true">{currentConfig.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="center" forceMount>
                {locales.map((nextLocale) => {
                    const config = localeConfig[nextLocale];
                    const isCurrent = nextLocale === locale;

                    return (
                        <DropdownMenuItem
                            key={nextLocale}
                            onSelect={async (event) => {
                                event.preventDefault();
                                if (isCurrent) return;
                                if (user) {
                                    await setUserLanguage(nextLocale);
                                }
                                router.replace(normalizedPathname, { locale: nextLocale });
                            }}
                            aria-current={isCurrent ? 'true' : undefined}
                            className={`flex items-center gap-2 text-sm w-full ${isCurrent ? 'font-semibold text-primary' : ''}`}
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

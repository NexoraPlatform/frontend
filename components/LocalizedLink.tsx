'use client';

import Link, { LinkProps } from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for classnames

interface LocalizedLinkProps extends Omit<LinkProps, 'href'> {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
}

/**
 * A wrapper around Next.js Link that automatically prepends the current locale.
 * Use this for all internal navigation links.
 */
export function LocalizedLink({ href, children, className, ...props }: LocalizedLinkProps) {
    const locale = useLocale();

    const getLocalizedHref = (path: string) => {
        // If path is external or is a hash link, return as is
        if (path.startsWith('http') || path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('tel:')) {
            return path;
        }

        // If path already starts with a locale (any valid locale), we might want to leave it 
        // BUT usually we want to enforce CURRENT locale unless explicitly changing language.
        // For this helper, we assume we want to stay in current locale.

        // Check if path already starts with specifically the CURRENT locale
        if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
            return path;
        }

        // Ensure path starts with /
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        return `/${locale}${cleanPath}`;
    };

    const localizedHref = getLocalizedHref(href);

    return (
        <Link href={localizedHref} className={className} {...props}>
            {children}
        </Link>
    );
}

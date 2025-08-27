'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';

// încarcă Iconify doar pe client
const Iconify = dynamic(() => import('@iconify/react').then(m => m.Icon), {
    ssr: false,
});

export function MuiIcon({
                            icon,
                            size = 24,
                            color,
                            className,
                            style,
                        }: {
    icon: string;
    size?: number | string;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    if (!icon) return null; // nimic de afișat

    const w = typeof size === 'number' ? `${size}px` : size;

    return (
        <span
            className={['inline-flex items-center justify-center', className].filter(Boolean).join(' ')}
            style={{ verticalAlign: 'middle', ...style }}
            aria-hidden="true"
        >
      <Iconify icon={icon} width={w} height={w} color={color} />
    </span>
    );
}

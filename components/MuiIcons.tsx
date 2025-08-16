'use client';

import * as React from 'react';
import { Icon } from '@iconify/react';

export function MuiIcon({
                                icon,
                                size = 24,
                                color,
                                className,
                                style,
                            }: { icon: string; size?: number | string; color?: string; className?: string; style?: React.CSSProperties }) {
    const w = typeof size === 'number' ? `${size}px` : size;
    return <Icon icon={icon} width={w} height={w} color={color} className={className} style={{ verticalAlign: 'middle', ...style }} />;
}

'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

type RootEl = React.ElementRef<typeof ProgressPrimitive.Root>;
type RootProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

type ProgressProps = RootProps & {
    indicatorClassName?: string;
    value?: number; // ensure value is typed
};

const Progress = React.forwardRef<RootEl, ProgressProps>(
    ({ className, value = 0, indicatorClassName, ...props }, ref) => {
        // clamp to 0–100 to avoid weird transforms
        const clamped = Math.min(100, Math.max(0, value));

        return (
            <ProgressPrimitive.Root
                ref={ref}
                className={cn(
                    'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
                    className
                )}
                value={clamped}
                {...props}
            >
                <ProgressPrimitive.Indicator
                    className={cn(
                        'h-full w-full flex-1 transition-transform duration-200 ease-in-out',
                        indicatorClassName || 'bg-primary'
                    )}
                    style={{ transform: `translateX(-${100 - clamped}%)` }}
                />
            </ProgressPrimitive.Root>
        );
    }
);

// ✅ fixes react/display-name warning
Progress.displayName = 'Progress';

export { Progress };

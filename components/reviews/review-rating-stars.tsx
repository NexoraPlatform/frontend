"use client";

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type ReviewRatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  className?: string;
  sizeClassName?: string;
};

export function ReviewRatingStars({
  value,
  onChange,
  className,
  sizeClassName = 'h-4 w-4',
}: ReviewRatingStarsProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const isInteractive = typeof onChange === 'function';

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role={isInteractive ? 'radiogroup' : undefined}
      aria-label={isInteractive ? 'Review rating' : undefined}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const star = (
          <Star
            className={cn(
              sizeClassName,
              starValue <= normalizedValue
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            )}
          />
        );

        if (!isInteractive) {
          return <span key={starValue}>{star}</span>;
        }

        return (
          <button
            key={starValue}
            type="button"
            className="rounded-sm p-0.5 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1BC47D]/40"
            onClick={() => onChange(starValue)}
            aria-label={`Set rating to ${starValue}`}
            aria-checked={starValue === normalizedValue}
            role="radio"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { PriceDisplay } from '@/components/PriceDisplay';
import type { Currency } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductCardProps {
  title: string;
  description?: string;
  price: number;
  currency?: Currency;
}

export function ProductCard({ title, description, price, currency }: ProductCardProps) {
  const { currency: selectedCurrency } = useCurrency();
  const displayCurrency = currency ?? selectedCurrency;

  return (
    <div className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-900/60">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
          <PriceDisplay value={price} currency={displayCurrency} />
        </div>
      </div>
    </div>
  );
}

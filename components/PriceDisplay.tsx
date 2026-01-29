'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useCurrency } from '@/hooks/useCurrency';
import type { Currency } from '@/lib/currency';

interface PriceDisplayProps {
  value: number;
  currency?: Currency;
}

const localeByCurrency: Record<Currency, string> = {
  RON: 'ro-RO',
  EUR: 'en-IE',
  USD: 'en-US',
};

export function PriceDisplay({ value, currency }: PriceDisplayProps) {
  const locale = useLocale();
  const { currency: contextCurrency } = useCurrency();
  const activeCurrency = currency ?? contextCurrency;

  const formattedValue = useMemo(() => {
    const resolvedLocale = locale === 'ro' ? 'ro-RO' : localeByCurrency[activeCurrency];
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: activeCurrency,
    }).format(value);
  }, [activeCurrency, locale, value]);

  return <span>{formattedValue}</span>;
}

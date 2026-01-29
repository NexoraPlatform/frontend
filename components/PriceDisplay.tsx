'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useCurrency } from '@/hooks/useCurrency';
import { supportedCurrencies } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

interface PriceDisplayProps {
  value: number;
  currency?: Currency | string;
}

const localeByCurrency: Record<Currency, string> = {
  RON: 'ro-RO',
  EUR: 'en-IE',
  USD: 'en-US',
};

export function PriceDisplay({ value, currency }: PriceDisplayProps) {
  const locale = useLocale();
  const { currency: contextCurrency } = useCurrency();
  const resolvedCurrency =
    currency && supportedCurrencies.includes(currency as Currency)
      ? (currency as Currency)
      : contextCurrency;

  const formattedValue = useMemo(() => {
    const resolvedLocale = locale === 'ro' ? 'ro-RO' : localeByCurrency[resolvedCurrency];
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: resolvedCurrency,
    }).format(value);
  }, [resolvedCurrency, locale, value]);

  return <span>{formattedValue}</span>;
}

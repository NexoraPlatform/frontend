"use client";

import { createContext, useEffect, useMemo, useState } from 'react';
import { CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, supportedCurrencies } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (storedCurrency && supportedCurrencies.includes(storedCurrency as Currency)) {
      setCurrencyState(storedCurrency as Currency);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  const value = useMemo(
    () => ({
      currency,
      setCurrency: setCurrencyState,
    }),
    [currency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

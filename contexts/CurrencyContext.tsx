"use client";

import { Fragment, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, supportedCurrencies } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const getInitialCurrency = (): Currency => {
  if (typeof window === 'undefined') {
    return DEFAULT_CURRENCY;
  }

  const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (storedCurrency && supportedCurrencies.includes(storedCurrency as Currency)) {
    return storedCurrency as Currency;
  }

  return DEFAULT_CURRENCY;
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);

  const syncCurrencyQueryParam = useCallback((nextCurrency: Currency) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('currency', nextCurrency);
      window.history.replaceState(
        window.history.state,
        '',
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      );
    } catch {
      // Ignore URL sync issues and keep runtime currency state.
    }
  }, []);

  const setCurrency = useCallback((nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
    syncCurrencyQueryParam(nextCurrency);
  }, [syncCurrencyQueryParam]);

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
      setCurrency,
    }),
    [currency, setCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      <Fragment key={currency}>{children}</Fragment>
    </CurrencyContext.Provider>
  );
}

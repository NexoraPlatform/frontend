export const CURRENCY_STORAGE_KEY = 'preferred_currency';

export const supportedCurrencies = ['USD', 'EUR', 'RON'] as const;

export type Currency = (typeof supportedCurrencies)[number];

export const DEFAULT_CURRENCY: Currency = 'USD';

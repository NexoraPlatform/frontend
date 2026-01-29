'use client';

import { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supportedCurrencies } from '@/lib/currency';
import type { Currency } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencySwitcherProps {
  className?: string;
}

const currencyIcons: Record<Currency, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  RON: '🇷🇴',
};

export function CurrencySwitcher({ className }: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('h-11 w-auto px-3 flex items-center gap-2 rounded-xl text-sm font-semibold', className)}
          aria-label="Schimbă valuta"
        >
          <span aria-hidden="true" className="text-base">
            {currencyIcons[currency]}
          </span>
          {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32" align="center" forceMount>
        {supportedCurrencies.map((nextCurrency) => {
          const isCurrent = nextCurrency === currency;

          return (
            <DropdownMenuItem
              key={nextCurrency}
              onSelect={(event) => {
                event.preventDefault();
                setCurrency(nextCurrency as Currency);
              }}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'flex items-center gap-2 text-sm w-full',
                isCurrent && 'font-semibold text-primary'
              )}
            >
              <span aria-hidden="true" className="text-base">
                {currencyIcons[nextCurrency]}
              </span>
              {nextCurrency}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

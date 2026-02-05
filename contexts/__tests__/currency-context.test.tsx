import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/hooks/useCurrency';

describe('contexts/CurrencyContext', () => {
  it('throws if used without provider', () => {
    const { result } = renderHook(() => useCurrency());
    expect(result.error).toBeTruthy();
  });

  it('reads initial currency from localStorage and updates it', () => {
    localStorage.setItem('preferred_currency', 'EUR');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrencyProvider>{children}</CurrencyProvider>
    );

    const { result } = renderHook(() => useCurrency(), { wrapper });

    expect(result.current.currency).toBe('EUR');

    act(() => {
      result.current.setCurrency('RON');
    });

    expect(result.current.currency).toBe('RON');
    expect(localStorage.getItem('preferred_currency')).toBe('RON');
  });
});

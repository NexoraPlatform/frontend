import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { BillingDetailsForm } from '@/components/forms/BillingDetailsForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Forms components', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('BillingDetailsForm clears company fields when toggled off', () => {
    const defaultValues = {
      company_name: 'ACME',
      tax_id: 'RO123',
      trade_registry_number: 'J40/1',
      billing_address: 'Main',
      billing_city: 'Bucharest',
      billing_state: 'B',
      billing_postal_code: '12345',
    };

    let methods: ReturnType<typeof useForm> | null = null;

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const form = useForm({ defaultValues });
      methods = form as ReturnType<typeof useForm>;
      return <FormProvider {...form}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <BillingDetailsForm />
      </Wrapper>
    );

    // fields should exist when company is enabled
    expect(screen.getByLabelText('common.billing.company_name_label')).toBeTruthy();

    const toggle = screen.getByLabelText('common.billing.company_toggle_label');
    fireEvent.click(toggle);

    // fields are removed when company disabled
    expect(screen.queryByLabelText('common.billing.company_name_label')).toBeNull();

    // values are cleared in form state
    expect(methods?.getValues('company_name')).toBe('');
    expect(methods?.getValues('tax_id')).toBe('');
    expect(methods?.getValues('billing_address')).toBe('');
  });

  it('loads country, state and city options from the internal locations API when enabled', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal('HTMLElement', HTMLElement);
    HTMLElement.prototype.scrollIntoView = vi.fn();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      const scope = url.searchParams.get('scope');
      const country = url.searchParams.get('country');
      const state = url.searchParams.get('state');

      if (scope === 'countries') {
        return jsonResponse({
          data: [{ isoCode: 'RO', name: 'Romania', flag: '🇷🇴' }],
        });
      }

      if (scope === 'states' && country === 'RO') {
        return jsonResponse({
          data: [{ isoCode: 'IF', name: 'Ilfov', countryCode: 'RO' }],
        });
      }

      if (scope === 'cities' && country === 'RO' && state === 'IF') {
        return jsonResponse({
          data: [{ name: 'Otopeni', countryCode: 'RO', stateCode: 'IF' }],
        });
      }

      return jsonResponse({ message: 'Unexpected request' }, 404);
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const defaultValues = {
      company_name: 'ACME',
      tax_id: '',
      trade_registry_number: '',
      billing_address: '',
      billing_city: '',
      billing_state: '',
      billing_postal_code: '',
    };

    let methods: ReturnType<typeof useForm> | null = null;

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const form = useForm({ defaultValues });
      methods = form as ReturnType<typeof useForm>;
      return <FormProvider {...form}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <BillingDetailsForm useLocationApi />
      </Wrapper>
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'common.billing.country_label' }));
    fireEvent.click(await screen.findByText('Romania'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/locations?scope=states&country=RO'),
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByRole('combobox', { name: 'common.billing.billing_state_label' }));
    fireEvent.click(await screen.findByText('Ilfov'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/locations?scope=cities&country=RO&state=IF'),
        expect.any(Object)
      );
    });

    fireEvent.click(screen.getByRole('combobox', { name: 'common.billing.billing_city_label' }));
    fireEvent.click(await screen.findByText('Otopeni'));

    expect(methods?.getValues('billing_state')).toBe('IF');
    expect(methods?.getValues('billing_city')).toBe('Otopeni');
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { BillingDetailsForm } from '@/components/forms/BillingDetailsForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('Forms components', () => {
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
});

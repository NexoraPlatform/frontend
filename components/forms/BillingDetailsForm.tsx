"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { BillingDetailsFormValues } from '@/types/user-forms';

type BillingDetailsFormProps = {
  className?: string;
  showTitle?: boolean;
};

export function BillingDetailsForm({
  className,
  showTitle = true,
}: BillingDetailsFormProps) {
  const t = useTranslations();
  const { control, watch, setValue, clearErrors } =
    useFormContext<BillingDetailsFormValues>();
  const companyName = watch('company_name');
  const [isCompany, setIsCompany] = useState(Boolean(companyName));

  useEffect(() => {
    if (companyName) {
      setIsCompany(true);
    }
  }, [companyName]);

  const handleToggleCompany = (checked: boolean) => {
    setIsCompany(checked);
    if (!checked) {
      setValue('company_name', '');
      setValue('tax_id', '');
      setValue('trade_registry_number', '');
      setValue('billing_address', '');
      setValue('billing_city', '');
      setValue('billing_state', '');
      setValue('billing_postal_code', '');
      clearErrors();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {showTitle && (
        <div>
          <h3 className="text-lg font-semibold">
            {t('common.billing.section_title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('common.billing.section_description')}
          </p>
        </div>
      )}

      <div className="flex items-start gap-2">
        <Checkbox
          id="billing-is-company"
          checked={isCompany}
          onCheckedChange={(checked) =>
            handleToggleCompany(Boolean(checked))
          }
        />
        <Label
          htmlFor="billing-is-company"
          className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {t('common.billing.company_toggle_label')}
        </Label>
      </div>

      {isCompany && (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.billing.company_name_label')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.company_name_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('common.billing.tax_id_label')}
                  {companyName ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.tax_id_placeholder')}
                  />
                </FormControl>
                <FormDescription>
                  {t('common.billing.tax_id_required_hint')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="trade_registry_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('common.billing.trade_registry_number_label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.trade_registry_number_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="billing_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('common.billing.billing_address_label')}
                  {companyName ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.billing_address_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="billing_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.billing.billing_city_label')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.billing_city_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="billing_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.billing.billing_state_label')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.billing_state_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="billing_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('common.billing.billing_postal_code_label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.billing.billing_postal_code_placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}

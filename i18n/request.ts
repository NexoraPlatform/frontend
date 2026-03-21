import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from '@/lib/navigation';
import {defaultLocale, loadMessagesForNamespaces, translations} from '@/lib/i18n';

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale = (locale ?? defaultLocale) as keyof typeof translations;

  if (!locales.includes(resolvedLocale as (typeof locales)[number])) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: await loadMessagesForNamespaces(resolvedLocale),
  };
});

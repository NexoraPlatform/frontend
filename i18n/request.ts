import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from '@/lib/navigation';
import {defaultLocale, translations} from '@/lib/i18n';

type Messages = Record<string, any>;

function mergeDeep(target: Messages, source: Messages) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] ??= {};
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

async function loadMessages(locale: keyof typeof translations) {
  const messages: Messages = {};
  const namespaces = translations[locale];

  for (const [namespace, loader] of Object.entries(namespaces)) {
    const loaders = Array.isArray(loader) ? loader : [loader];
    const loaded = await Promise.all(
      loaders.map(async (load) => {
        const module = await load();
        return module?.default ?? module;
      }),
    );
    messages[namespace] = Object.assign({}, ...loaded);
  }

  return messages;
}

export default getRequestConfig(async ({locale}) => {
  const resolvedLocale = (locale ?? defaultLocale) as keyof typeof translations;

  if (!locales.includes(resolvedLocale as (typeof locales)[number])) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: await loadMessages(resolvedLocale),
  };
});

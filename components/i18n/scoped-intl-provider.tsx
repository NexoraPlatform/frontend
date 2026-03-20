import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";

import {
  buildClientMessageNamespaces,
  loadMessagesForNamespaces,
  type TranslationNamespace,
} from "@/lib/i18n";
import type { Locale } from "@/types/locale";

type ScopedIntlProviderProps = {
  children: ReactNode;
  extraNamespaces?: TranslationNamespace[];
  locale: Locale | string;
};

export default async function ScopedIntlProvider({
  children,
  extraNamespaces = [],
  locale,
}: ScopedIntlProviderProps) {
  const messages = await loadMessagesForNamespaces(
    locale,
    buildClientMessageNamespaces(extraNamespaces),
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

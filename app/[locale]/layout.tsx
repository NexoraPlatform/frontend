import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NotificationProvider } from "@/contexts/notification-context";
import { ChatProvider } from "@/contexts/chat-context";
import { LocaleSync } from "@/components/LocaleSync";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleSync />
      <NotificationProvider>
        <ChatProvider>{children}</ChatProvider>
      </NotificationProvider>
    </NextIntlClientProvider>
  );
}

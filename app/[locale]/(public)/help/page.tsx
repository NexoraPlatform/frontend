import type { Metadata } from 'next';

import { TrustoraHelpPage } from '@/components/help/trustora-help-page';
import { generateSEO } from '@/lib/seo';
import type { Locale } from '@/types/locale';

type HelpPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({ params }: HelpPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'FAQ - Frequently Asked Questions' : 'FAQ - Întrebări Frecvente',
    description: isEnglish
      ? 'Have a question? Check the FAQ section for fast answers to the most common questions about Trustora.'
      : 'Ai o intrebare? Verifica sectiunea de întrebări frecvente pentru răspunsuri rapide la cele mai comune întrebări despre Trustora.',
    locale,
    url: '/help',
  });
}

export default async function HelpPage() {
  return <TrustoraHelpPage />;
}

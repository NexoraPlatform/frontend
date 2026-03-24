import type { Metadata } from 'next';

import { TrustoraContactPage } from '@/components/contact/trustora-contact-page';
import { generateSEO } from '@/lib/seo';
import type { Locale } from '@/types/locale';

type ContactPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish
      ? 'Contact Trustora - Support & Information'
      : 'Contacteaza Trustora - Suport si Informatii',
    description: isEnglish
      ? 'Have a question or want to collaborate with Trustora? Reach out for fast support and service information.'
      : 'Ai o intrebare sau vrei sa colaborezi cu Trustora? Contacteaza-ne pentru suport rapid si informatii despre serviciile noastre.',
    locale,
    url: '/contact',
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  await params;

  return <TrustoraContactPage />;
}

import type { Metadata } from 'next';

import { TrustoraAboutPage } from '@/components/about/trustora-about-page';
import { generateSEO } from '@/lib/seo';
import type { Locale } from '@/types/locale';

type AboutPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'About us' : 'Despre noi',
    description: isEnglish
      ? 'Discover Trustora’s mission, vision and values, the team behind the platform, and our journey so far.'
      : 'Vrei să afli mai multe despre Trustora? Aici găsești informații despre misiunea, viziunea și valorile noastre, echipa din spatele platformei și povestea noastră de succes.',
    locale,
    url: '/about',
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  await params;

  return <TrustoraAboutPage />;
}

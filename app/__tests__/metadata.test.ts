import { describe, it, expect, beforeEach } from 'vitest';
import { generateMetadata as generatePrivacyMetadata } from '../[locale]/privacy/page';
import { generateMetadata as generateTermsMetadata } from '../[locale]/terms/page';
import { generateMetadata as generateHelpMetadata } from '../[locale]/help/page';
import { generateMetadata as generateHomeMetadata } from '../[locale]/page';
import { generateMetadata as generateDashboardMetadata } from '../[locale]/dashboard/page';

const makeParams = (locale: string) => Promise.resolve({ locale });

describe('SSR page metadata', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example';
  });

  it('privacy metadata uses locale-specific title/description', async () => {
    const en = await generatePrivacyMetadata({ params: makeParams('en') });
    const ro = await generatePrivacyMetadata({ params: makeParams('ro') });

    expect(en.title).toContain('Privacy Policy');
    expect(en.description).toContain('privacy policy');
    expect(ro.title).toContain('Politica');
    expect(ro.description).toContain('Trustora');
  });

  it('terms metadata uses locale-specific title/description', async () => {
    const en = await generateTermsMetadata({ params: makeParams('en') });
    const ro = await generateTermsMetadata({ params: makeParams('ro') });

    expect(en.title).toContain('Terms and Conditions');
    expect(en.description).toContain('terms and conditions');
    expect(ro.title).toContain('Termeni');
    expect(ro.description).toContain('Trustora');
  });

  it('help metadata uses locale-specific title/description', async () => {
    const en = await generateHelpMetadata({ params: makeParams('en') });
    const ro = await generateHelpMetadata({ params: makeParams('ro') });

    expect(en.title).toContain('FAQ');
    expect(en.description).toContain('FAQ');
    expect(ro.title).toContain('FAQ');
    expect(ro.description).toContain('Trustora');
  });

  it('home metadata uses locale in openGraph url and alternates', async () => {
    const meta = await generateHomeMetadata({ params: makeParams('en') });

    expect(meta.openGraph?.url).toBe('https://app.example/en');
    expect(meta.alternates?.languages?.en).toBe('/en');
    expect(meta.alternates?.languages?.ro).toBe('/ro');

    if (typeof meta.title === 'object' && meta.title) {
      expect(meta.title.default).toContain('Trustora');
    }
  });

  it('dashboard metadata uses locale-specific title', async () => {
    const en = await generateDashboardMetadata({ params: makeParams('en') });
    const ro = await generateDashboardMetadata({ params: makeParams('ro') });

    expect(en.title).toContain('Dashboard');
    expect(ro.title).toContain('Panou');
  });
});

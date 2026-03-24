import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const useSWRMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock('swr', () => ({
  default: (...args: unknown[]) => useSWRMock(...args),
}));

vi.mock('@/lib/navigation', () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/contexts/auth-context', () => ({
  useOptionalAuth: () => null,
}));

vi.mock('@/hooks/use-public-auth', () => ({
  usePublicAuth: () => ({ user: null }),
}));

vi.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getPopularServices: vi.fn(),
  },
}));

import { Footer } from '@/components/footer';

afterEach(() => {
  cleanup();
});

describe('Footer accessibility', () => {
  beforeEach(() => {
    useSWRMock.mockReset();
    useSWRMock.mockReturnValue({
      data: [
        { id: 1, name: 'Web Development', slug: 'web-development' },
      ],
      error: null,
    });
    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL = 'false';
    delete process.env.NEXT_PUBLIC_TRUSTORA_TWITTER_URL;
    delete process.env.NEXT_PUBLIC_TRUSTORA_INSTAGRAM_URL;
  });

  it('renders social icons as real links with valid destinations', () => {
    render(<Footer />);

    const facebookLink = screen.getByRole('link', {
      name: 'common.follow_us_on Facebook',
    }) as HTMLAnchorElement;
    const linkedInLink = screen.getByRole('link', {
      name: 'common.follow_us_on LinkedIn',
    }) as HTMLAnchorElement;

    expect(facebookLink.getAttribute('href')).toBe('https://www.facebook.com/trustora');
    expect(linkedInLink.getAttribute('href')).toBe(
      'https://www.linkedin.com/company/trustora-platform'
    );
    expect(
      screen.queryByRole('button', { name: 'common.follow_us_on Facebook' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'common.follow_us_on LinkedIn' })
    ).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'common.follow_us_on Twitter' })
    ).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'common.follow_us_on Instagram' })
    ).toBeNull();
  });

  it('uses unique labelled-by ids in both footer variants', () => {
    const { rerender } = render(<Footer />);

    expect(document.getElementById('contact-heading-default')).toBeTruthy();
    expect(document.getElementById('newsletter-heading-default')).toBeTruthy();
    expect(document.getElementById('quick-links-heading-default')).toBeTruthy();
    expect(document.getElementById('popular-services-heading-default')).toBeTruthy();
    expect(document.querySelector('[aria-labelledby="contact-heading-default"]')).toBeTruthy();
    expect(document.querySelector('[aria-labelledby="newsletter-heading-default"]')).toBeTruthy();
    expect(document.getElementById('contact-heading')).toBeNull();
    expect(document.getElementById('newsletter-heading')).toBeNull();

    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL = 'true';
    rerender(<Footer />);

    expect(document.getElementById('contact-heading-early-access')).toBeTruthy();
    expect(document.getElementById('newsletter-heading-early-access')).toBeTruthy();
    expect(document.querySelector('[aria-labelledby="contact-heading-early-access"]')).toBeTruthy();
    expect(document.querySelector('[aria-labelledby="newsletter-heading-early-access"]')).toBeTruthy();
  });

  it('keeps the footer rendered while popular services are loading', () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: null,
    });

    render(<Footer />);

    expect(screen.getByRole('link', { name: 'navigation.services' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'common.privacy_policy' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'common.popular_services_loading' })).toBeTruthy();
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('keeps the footer rendered and scopes errors to the popular services section', () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
    });

    render(<Footer />);

    expect(screen.getByRole('link', { name: 'navigation.contact' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'common.terms_conditions' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('common.popular_services_unavailable');
    expect(screen.queryByText('Failed to load')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  sanitizeExternalRedirectUrl,
  sanitizeNavigationTarget,
} from '../navigation-security';

describe('lib/navigation-security', () => {
  describe('sanitizeNavigationTarget', () => {
    it('allows same-origin relative paths', () => {
      expect(
        sanitizeNavigationTarget('/dashboard?tab=messages#latest', 'https://app.trustora.ro')
      ).toBe('/dashboard?tab=messages#latest');
    });

    it('rejects protocol-relative and external targets', () => {
      expect(sanitizeNavigationTarget('//evil.example', 'https://app.trustora.ro')).toBeNull();
      expect(sanitizeNavigationTarget('https://evil.example/path', 'https://app.trustora.ro')).toBeNull();
    });

    it('rejects backslash-based bypass payloads', () => {
      expect(sanitizeNavigationTarget('/\\evil.com', 'https://app.trustora.ro')).toBeNull();
      expect(sanitizeNavigationTarget('/%5Cevil.com', 'https://app.trustora.ro')).toBeNull();
      expect(sanitizeNavigationTarget('/%252f%252fevil.com', 'https://app.trustora.ro')).toBeNull();
    });
  });

  describe('sanitizeExternalRedirectUrl', () => {
    it('allows only https URLs to allowlisted hosts', () => {
      expect(
        sanitizeExternalRedirectUrl(
          'https://sandboxdashboard.rapyd.net/onboarding/session-123',
          ['rapyd.net']
        )
      ).toBe('https://sandboxdashboard.rapyd.net/onboarding/session-123');
    });

    it('rejects http or non-allowlisted hosts', () => {
      expect(
        sanitizeExternalRedirectUrl(
          'http://sandboxdashboard.rapyd.net/onboarding/session-123',
          ['rapyd.net']
        )
      ).toBeNull();
      expect(
        sanitizeExternalRedirectUrl(
          'https://evil.example/onboarding/session-123',
          ['rapyd.net']
        )
      ).toBeNull();
    });

    it('rejects credentialed URLs', () => {
      expect(
        sanitizeExternalRedirectUrl(
          'https://user:pass@sandboxdashboard.rapyd.net/onboarding/session-123',
          ['rapyd.net']
        )
      ).toBeNull();
    });
  });
});

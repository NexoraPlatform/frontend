import { describe, expect, it } from 'vitest';

import { buildLocalSearchSuggestions } from '../search-suggestions';

describe('buildLocalSearchSuggestions', () => {
  it('returns unique local suggestions from recent, trending, and fallback sources', () => {
    const result = buildLocalSearchSuggestions(
      'lar',
      ['Laravel Development', 'React Apps'],
      ['Laravel Development', 'Landing Page'],
      ['Laravel Support', 'Mobile App'],
    );

    expect(result).toEqual(['Laravel Development', 'Laravel Support']);
  });

  it('returns an empty array for short queries', () => {
    expect(buildLocalSearchSuggestions('l', ['Laravel'], ['Landing'], ['Logo'])).toEqual([]);
  });
});

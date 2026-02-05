import { describe, it, expect } from 'vitest';
import { formatBudgetRange, formatDeadline } from '../projects';

describe('lib/projects', () => {
  it('formatBudgetRange handles ranges and labels (en)', () => {
    const same = formatBudgetRange({ budget_min: 1000, budget_max: 1000, locale: 'en' });
    expect(same).not.toContain(' - ');

    const onlyMin = formatBudgetRange({ budget_min: 500, locale: 'en' });
    expect(onlyMin.startsWith('from ')).toBe(true);

    const onlyMax = formatBudgetRange({ budget_max: 2000, locale: 'en' });
    expect(onlyMax.startsWith('up to ')).toBe(true);

    const none = formatBudgetRange({ locale: 'en' });
    expect(none).toBe('Unspecified');
  });

  it('formatBudgetRange handles labels (ro)', () => {
    const onlyMin = formatBudgetRange({ budget_min: 500, locale: 'ro' });
    expect(onlyMin.startsWith('de la ')).toBe(true);

    const onlyMax = formatBudgetRange({ budget_max: 2000, locale: 'ro' });
    expect(onlyMax.startsWith('până la ')).toBe(true);

    const none = formatBudgetRange({ locale: 'ro' });
    expect(none).toBe('Nespecificat');
  });

  it('formatDeadline maps known values and falls back to input', () => {
    expect(formatDeadline('1week', 'ro')).toBe('O săptămână');
    expect(formatDeadline('1week', 'en')).toBe('1 week');
    expect(formatDeadline('unknown', 'ro')).toBe('unknown');
  });
});

import { describe, expect, it } from 'vitest';
import {
  getDashboardHomeHref,
  getDashboardTabHref,
  getNewProjectHref,
  getPrimaryDashboardTabHref,
  getProviderProfileHref,
  getSecondaryDashboardTabHref,
} from '../dashboard-navigation';

describe('lib/dashboard-navigation', () => {
  it('returns the canonical dashboard home href', () => {
    expect(getDashboardHomeHref()).toBe('/dashboard');
  });

  it('returns explicit dashboard tab hrefs', () => {
    expect(getDashboardTabHref('overview')).toBe('/dashboard?tab=overview');
    expect(getDashboardTabHref('projects')).toBe('/dashboard?tab=projects');
    expect(getDashboardTabHref('services')).toBe('/dashboard?tab=services');
    expect(getDashboardTabHref('messages')).toBe('/dashboard?tab=messages');
    expect(getDashboardTabHref('settings')).toBe('/dashboard?tab=settings');
    expect(getDashboardTabHref('finance')).toBe('/dashboard?tab=finance');
  });

  it('returns the shared role-dependent dashboard hrefs', () => {
    expect(getPrimaryDashboardTabHref(true)).toBe('/dashboard?tab=finance');
    expect(getPrimaryDashboardTabHref(false)).toBe('/dashboard?tab=projects');
    expect(getSecondaryDashboardTabHref(true)).toBe('/dashboard?tab=projects');
    expect(getSecondaryDashboardTabHref(false)).toBe('/dashboard?tab=services');
  });

  it('returns the shared auxiliary navigation hrefs', () => {
    expect(getProviderProfileHref()).toBe('/provider/profile');
    expect(getNewProjectHref()).toBe('/projects/new');
  });
});

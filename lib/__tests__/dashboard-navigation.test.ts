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
    expect(getDashboardTabHref('overview')).toBe('/dashboard');
    expect(getDashboardTabHref('projects')).toBe('/dashboard/projects');
    expect(getDashboardTabHref('services')).toBe('/dashboard/services');
    expect(getDashboardTabHref('messages')).toBe('/dashboard/messages');
    expect(getDashboardTabHref('settings')).toBe('/dashboard/settings');
    expect(getDashboardTabHref('finance')).toBe('/dashboard/finance');
  });

  it('returns the shared role-dependent dashboard hrefs', () => {
    expect(getPrimaryDashboardTabHref(true)).toBe('/dashboard/finance');
    expect(getPrimaryDashboardTabHref(false)).toBe('/dashboard/projects');
    expect(getSecondaryDashboardTabHref(true)).toBe('/dashboard/projects');
    expect(getSecondaryDashboardTabHref(false)).toBe('/dashboard/services');
  });

  it('returns the shared auxiliary navigation hrefs', () => {
    expect(getProviderProfileHref()).toBe('/provider/profile');
    expect(getNewProjectHref()).toBe('/projects/new');
  });
});

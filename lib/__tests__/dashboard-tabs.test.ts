import { describe, expect, it } from 'vitest';
import {
  BASE_DASHBOARD_TABS,
  buildDashboardSearchParams,
  getAvailableDashboardTabs,
  getDefaultDashboardTab,
  hasProjectScopedDashboardParams,
  resolveDashboardTab,
  resolveInitialDashboardTab,
} from '../dashboard-tabs';

describe('lib/dashboard-tabs', () => {
  it('returns the base dashboard tabs in a stable order', () => {
    expect(BASE_DASHBOARD_TABS).toEqual([
      'overview',
      'projects',
      'services',
      'messages',
      'settings',
    ]);
  });

  it('returns only the base tabs for providers and unresolved roles too', () => {
    expect(
      getAvailableDashboardTabs({ hasRoleInfo: true, isProvider: true })
    ).toEqual([
      'overview',
      'projects',
      'services',
      'messages',
      'settings',
    ]);

    expect(
      getAvailableDashboardTabs({ hasRoleInfo: false, isProvider: false })
    ).toEqual([
      'overview',
      'projects',
      'services',
      'messages',
      'settings',
    ]);
  });

  it('returns only the base tabs for non-provider users with resolved role info', () => {
    expect(
      getAvailableDashboardTabs({ hasRoleInfo: true, isProvider: false })
    ).toEqual([
      'overview',
      'projects',
      'services',
      'messages',
      'settings',
    ]);
  });

  it('uses the first available tab as the default tab', () => {
    expect(
      getDefaultDashboardTab(['overview', 'projects', 'services'])
    ).toBe('overview');
    expect(getDefaultDashboardTab([])).toBe('overview');
  });

  it('keeps project-scoped params while staying on the projects tab', () => {
    const nextParams = buildDashboardSearchParams(
      'tab=projects&projectId=42&activeMilestoneId=99&filter=open',
      'projects'
    );

    expect(nextParams.get('tab')).toBe('projects');
    expect(nextParams.get('projectId')).toBe('42');
    expect(nextParams.get('activeMilestoneId')).toBe('99');
    expect(nextParams.get('filter')).toBe('open');
  });

  it('removes project-scoped params when leaving the projects tab', () => {
    const nextParams = buildDashboardSearchParams(
      'tab=projects&projectId=42&activeMilestoneId=99&filter=open',
      'services'
    );

    expect(nextParams.get('tab')).toBe('services');
    expect(nextParams.has('projectId')).toBe(false);
    expect(nextParams.has('activeMilestoneId')).toBe(false);
    expect(nextParams.get('filter')).toBe('open');
  });

  it('removes the tab query for the default tab while still cleaning stale project params', () => {
    const nextParams = buildDashboardSearchParams(
      'tab=overview&projectId=42&activeMilestoneId=99',
      'overview'
    );

    expect(nextParams.has('tab')).toBe(false);
    expect(nextParams.has('projectId')).toBe(false);
    expect(nextParams.has('activeMilestoneId')).toBe(false);
  });

  it('detects when project-scoped params are still present', () => {
    expect(
      hasProjectScopedDashboardParams('tab=overview&projectId=42')
    ).toBe(true);
    expect(
      hasProjectScopedDashboardParams('tab=overview&activeMilestoneId=99')
    ).toBe(true);
    expect(hasProjectScopedDashboardParams('tab=overview')).toBe(false);
  });

  it('uses the URL tab for the initial dashboard tab when present', () => {
    expect(resolveInitialDashboardTab('projects')).toBe('projects');
    expect(resolveInitialDashboardTab(' settings ')).toBe('settings');
  });

  it('falls back to the default dashboard tab when the URL tab is missing', () => {
    expect(resolveInitialDashboardTab(null)).toBe('overview');
    expect(resolveInitialDashboardTab(undefined, 'services')).toBe('services');
    expect(resolveInitialDashboardTab('   ', 'messages')).toBe('messages');
  });

  it('falls back to the default tab when the URL tab is not available', () => {
    expect(
      resolveDashboardTab('billing', ['overview', 'projects', 'services'], 'overview')
    ).toBe('overview');
  });

  it('returns the URL tab when it is available', () => {
    expect(
      resolveDashboardTab('projects', ['overview', 'projects', 'services'], 'overview')
    ).toBe('projects');
  });
});

import { describe, expect, it } from 'vitest';

import {
  canGenerateContractsForProject,
  formatDateTime,
  formatFileSize,
  getProcessTone,
  getStatusTone,
  humanizeCode,
  isPrivilegedContractActor,
  normalizeId,
  normalizeTextLines,
} from '@/components/projects/project-contract-workspace/_lib/project-contract-workspace-helpers';

describe('project-contract-workspace helpers', () => {
  it('normalizes ids and text values safely', () => {
    expect(normalizeId(' 42 ')).toBe('42');
    expect(normalizeId(7)).toBe('7');
    expect(normalizeId('   ')).toBeNull();
    expect(normalizeId(null)).toBeNull();
  });

  it('formats codes, dates and file sizes', () => {
    expect(humanizeCode('pending_review')).toBe('Pending Review');
    expect(formatDateTime('2026-04-02T10:30:00Z', 'en')).toContain('2026');
    expect(formatDateTime('invalid', 'en')).toBeNull();
    expect(formatFileSize(2048, 'en')).toContain('2');
    expect(formatFileSize(null, 'en')).toBeNull();
  });

  it('resolves status and process tones', () => {
    expect(getStatusTone('signed')).toContain('emerald');
    expect(getStatusTone('blocked')).toContain('red');
    expect(getProcessTone('awaiting_client_upload')).toContain('amber');
    expect(getProcessTone('approved')).toContain('emerald');
  });

  it('detects who can generate contracts', () => {
    expect(
      canGenerateContractsForProject(
        { id: '10', email: 'client@example.com', role: 'client' },
        '10'
      )
    ).toBe(true);
    expect(
      canGenerateContractsForProject(
        { id: '11', email: 'client@example.com', permissions: ['contracts.generate'] },
        '10'
      )
    ).toBe(true);
    expect(
      canGenerateContractsForProject(
        { id: '11', email: 'client@example.com', role: 'client' },
        '10'
      )
    ).toBe(false);
  });

  it('detects privileged contract actors and normalizes review lines', () => {
    expect(
      isPrivilegedContractActor({
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      })
    ).toBe(true);
    expect(
      isPrivilegedContractActor({
        id: '1',
        email: 'user@example.com',
        role: 'client',
      })
    ).toBe(false);
    expect(normalizeTextLines(' first\n\nsecond \n  \nthird')).toEqual([
      'first',
      'second',
      'third',
    ]);
  });
});

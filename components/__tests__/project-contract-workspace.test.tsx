import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectContractWorkspace from '@/components/projects/project-contract-workspace';
import { useOptionalAuth } from '@/contexts/auth-context';
import { usePublicAuth } from '@/hooks/use-public-auth';

const { authState, generateProjectContract, getContract } = vi.hoisted(() => ({
  authState: {
    user: { id: '10', role: 'client' },
    loading: false,
    userLoading: false,
  },
  generateProjectContract: vi.fn(),
  getContract: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/contexts/auth-context', () => ({
  useOptionalAuth: vi.fn(),
}));

vi.mock('@/hooks/use-public-auth', () => ({
  usePublicAuth: vi.fn(),
}));

vi.mock('@/lib/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
    href?: string;
  }) => (
    <a href={href ?? '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/access', () => ({
  getPermissionSlugs: () => [],
  getRoleSlugs: () => ['client'],
  isSuperUser: () => false,
}));

vi.mock('@/lib/contracts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/contracts')>(
    '@/lib/contracts'
  );

  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getContract,
      generateProjectContract,
      getAdminContract: vi.fn(),
      getManualReview: vi.fn(),
      getContractSignature: vi.fn(),
      getContractHtml: vi.fn(),
      getContractPdfResponse: vi.fn(),
      openManualReview: vi.fn(),
      assignManualReview: vi.fn(),
      startManualReview: vi.fn(),
      requestManualReviewChanges: vi.fn(),
      approveManualReview: vi.fn(),
      rejectManualReview: vi.fn(),
      issueManualSignatureFlow: vi.fn(),
      getSignedPdfResponse: vi.fn(),
      getManualClientDownloadResponse: vi.fn(),
      getManualProviderDownloadResponse: vi.fn(),
      uploadManualClientSignedPdf: vi.fn(),
      uploadManualProviderSignedPdf: vi.fn(),
    },
  };
});

describe('ProjectContractWorkspace', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    getContract.mockReset();
    generateProjectContract.mockReset();
    authState.loading = false;
    authState.userLoading = false;

    (useOptionalAuth as unknown as vi.Mock).mockImplementation(() => authState);
    (usePublicAuth as unknown as vi.Mock).mockReturnValue({
      user: null,
      loading: false,
      userLoading: false,
    });

    getContract.mockResolvedValue({
      id: '42',
      project_id: '7',
      reference: 'CTR-42',
      status: 'pending_review',
      requires_manual_review: false,
      requires_qes: false,
      documents: [],
      parties: [],
      milestones: [],
      clause_usages: [],
      risk_assessments: [],
    });
  });

  it('loads the provided contract id instead of generating a new contract', async () => {
    render(
      <ProjectContractWorkspace
        projectId="7"
        projectClientId="10"
        initialContractId="42"
        autoGenerate
        locale="en"
      />
    );

    await waitFor(() => {
      expect(getContract).toHaveBeenCalledWith('42');
    });

    expect((await screen.findAllByText('CTR-42')).length).toBeGreaterThan(0);
    expect(screen.getByText('tabs.overview')).toBeTruthy();
    expect(generateProjectContract).not.toHaveBeenCalled();
  });

  it('syncs a contract id that arrives after the first render and still skips generation', async () => {
    authState.loading = true;
    authState.userLoading = true;

    const { rerender } = render(
      <ProjectContractWorkspace
        projectId="7"
        projectClientId="10"
        initialContractId={null}
        autoGenerate
        locale="en"
      />
    );

    expect(getContract).not.toHaveBeenCalled();
    expect(generateProjectContract).not.toHaveBeenCalled();

    authState.loading = false;
    authState.userLoading = false;

    rerender(
      <ProjectContractWorkspace
        projectId="7"
        projectClientId="10"
        initialContractId="42"
        autoGenerate
        locale="en"
      />
    );

    await waitFor(() => {
      expect(getContract).toHaveBeenCalledWith('42');
    });

    expect(generateProjectContract).not.toHaveBeenCalled();
  });

  it('auto-generates a contract when none is provided and generation is enabled', async () => {
    generateProjectContract.mockResolvedValue({
      contract_id: '99',
      project_id: '7',
      reference: 'CTR-99',
      status: 'draft',
      requires_manual_review: false,
      requires_qes: false,
    });

    getContract.mockImplementation(async (contractId: string) => ({
      id: contractId,
      project_id: '7',
      reference: contractId === '99' ? 'CTR-99' : 'CTR-42',
      status: 'draft',
      requires_manual_review: false,
      requires_qes: false,
      documents: [],
      parties: [],
      milestones: [],
      clause_usages: [],
      risk_assessments: [],
    }));

    render(
      <ProjectContractWorkspace
        projectId="7"
        projectClientId="10"
        initialContractId={null}
        autoGenerate
        locale="en"
      />
    );

    await waitFor(() => {
      expect(generateProjectContract).toHaveBeenCalledWith('7');
    });

    await waitFor(() => {
      expect(getContract).toHaveBeenCalledWith('99');
    });

    expect((await screen.findAllByText('CTR-99')).length).toBeGreaterThan(0);
  });
});

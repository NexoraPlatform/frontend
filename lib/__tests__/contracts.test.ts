import { describe, expect, it } from 'vitest';

import {
  extractFileNameFromContentDisposition,
  extractProjectContractIdCandidate,
  getCurrentContractDocument,
  getLatestContractRiskAssessment,
  getLatestContractSignatureValidation,
  normalizeContractManualReviewEntity,
  normalizeContractOperationsSnapshot,
  normalizeContractSignatureEntity,
  normalizeContractEntity,
} from '../contracts';

describe('lib/contracts', () => {
  it('extracts a project contract id from multiple payload shapes', () => {
    expect(extractProjectContractIdCandidate({ contract_id: 42 })).toBe('42');
    expect(extractProjectContractIdCandidate({ latestContract: { id: '77' } })).toBe('77');
    expect(extractProjectContractIdCandidate({ data: { contract_id: 15 } })).toBe('15');
    expect(
      extractProjectContractIdCandidate({ project: { latest_contract: { id: '63' } } })
    ).toBe('63');
    expect(
      extractProjectContractIdCandidate({
        contract_id: 91,
        contracts: [
          { id: 2, is_current: false },
          { id: 5, is_current: true },
        ],
      })
    ).toBe('91');
    expect(
      extractProjectContractIdCandidate({
        contracts: [
          { id: 2, is_current: false },
          { id: 5, is_current: true },
        ],
      })
    ).toBe('5');
  });

  it('normalizes contract details and resolves current documents', () => {
    const contract = normalizeContractEntity({
      contract: {
        id: 15,
        project_id: 5,
        reference: 'CTR-20260327-5',
        status: 'pending_review',
        requires_manual_review: true,
        requires_qes: true,
        documents: [
          {
            id: 1,
            document_role: 'FINAL_PDF',
            is_current: false,
            file_name: 'old-final.pdf',
          },
          {
            id: 2,
            document_role: 'FINAL_PDF',
            is_current: true,
            file_name: 'current-final.pdf',
          },
        ],
        risk_assessments: [
          {
            id: 1,
            overall_risk: 'MEDIUM',
            requires_manual_review: true,
            requires_qes: true,
            warnings: ['manual_review'],
            blocking_reasons: [],
            created_at: '2026-03-27T10:00:00Z',
          },
          {
            id: 2,
            overall_risk: 'HIGH',
            requires_manual_review: true,
            requires_qes: true,
            warnings: ['manual_review', 'qes'],
            blocking_reasons: ['misclassification'],
            created_at: '2026-03-28T10:00:00Z',
          },
        ],
      },
    });

    expect(contract?.id).toBe('15');
    expect(contract?.documents).toHaveLength(2);
    expect(getCurrentContractDocument(contract ?? null, 'FINAL_PDF')?.file_name).toBe(
      'current-final.pdf'
    );
    expect(getLatestContractRiskAssessment(contract ?? null)?.overall_risk).toBe('HIGH');
  });

  it('extracts file names from content disposition headers', () => {
    expect(
      extractFileNameFromContentDisposition('attachment; filename="contract-final.pdf"')
    ).toBe('contract-final.pdf');
    expect(
      extractFileNameFromContentDisposition(
        "attachment; filename*=UTF-8''contract%20signed.pdf"
      )
    ).toBe('contract signed.pdf');
  });

  it('normalizes manual review payloads with comments and actors', () => {
    const review = normalizeContractManualReviewEntity({
      review: {
        id: 7,
        status: 'CHANGES_REQUESTED',
        priority: 'HIGH',
        review_reason_codes: ['misclassification_risk'],
        review_summary: 'Requires legal review before signature.',
        requested_changes: ['Clarify acceptance criteria.'],
        assigned_to_user: {
          id: 31,
          name: 'Legal Ops',
          email: 'legal@example.com',
        },
        comments: [
          {
            id: 3,
            comment_type: 'INTERNAL_NOTE',
            body: 'Please revise before approval.',
            author_user: {
              id: 9,
              name: 'Reviewer',
              email: 'reviewer@example.com',
            },
          },
        ],
      },
    });

    expect(review?.id).toBe('7');
    expect(review?.assigned_to_user?.name).toBe('Legal Ops');
    expect(review?.requested_changes).toEqual(['Clarify acceptance criteria.']);
    expect(review?.comments[0]?.author_user?.email).toBe('reviewer@example.com');
  });

  it('normalizes signature payloads and selects the latest validation', () => {
    const signature = normalizeContractSignatureEntity({
      signature: {
        id: 9,
        contract_id: 15,
        status: 'partially_signed',
        provider: 'manual_pades',
        flow_type: 'MANUAL_PADES_SEQUENTIAL',
        flow_status: 'AWAITING_PROVIDER_UPLOAD',
        signature_level: 'QES',
        client_signed_document: {
          id: 41,
          document_role: 'CLIENT_SIGNED_PDF',
          file_name: 'client-signed.pdf',
          is_current: true,
        },
        validations: [
          {
            id: 1,
            validation_status: 'VALID',
            stage: 'CLIENT_UPLOAD',
            created_at: '2026-03-28T10:00:00Z',
          },
          {
            id: 2,
            validation_status: 'INVALID',
            stage: 'PROVIDER_UPLOAD',
            failure_reason: 'Provider signature validation failed in DSS.',
            created_at: '2026-03-29T10:00:00Z',
          },
        ],
      },
    });

    expect(signature?.flow_status).toBe('AWAITING_PROVIDER_UPLOAD');
    expect(signature?.client_signed_document?.file_name).toBe('client-signed.pdf');
    expect(getLatestContractSignatureValidation(signature ?? null)?.failure_reason).toBe(
      'Provider signature validation failed in DSS.'
    );
  });

  it('normalizes admin contract operational snapshots', () => {
    const snapshot = normalizeContractOperationsSnapshot({
      data: {
        id: 15,
        status: 'awaiting_client_signature',
        manual_reviews: [
          {
            id: 7,
            status: 'APPROVED',
            review_summary: 'Approved after legal review.',
          },
        ],
        signatures: [
          {
            id: 9,
            contract_id: 15,
            status: 'sent',
            flow_status: 'AWAITING_CLIENT_UPLOAD',
          },
        ],
      },
    });

    expect(snapshot?.status).toBe('awaiting_client_signature');
    expect(snapshot?.manual_reviews[0]?.status).toBe('APPROVED');
    expect(snapshot?.signatures[0]?.flow_status).toBe('AWAITING_CLIENT_UPLOAD');
  });
});

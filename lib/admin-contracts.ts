import { apiFetch } from '@/lib/fetch-client';
import {
  normalizeContractManualReviewEntity,
  normalizeContractSignatureEntity,
  type ContractManualReviewEntity,
  type ContractSignatureEntity,
  type ContractUserSummary,
} from '@/lib/contracts';

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const toIdString = (value: unknown): string => toStringOrNull(value) ?? '';

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }

  return false;
};

const normalizeCountMap = (value: unknown): Record<string, number> => {
  const payload = asObject(value);
  if (!payload) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, entry]) => [key, toFiniteNumber(entry) ?? 0] as const)
      .filter(([, entry]) => Number.isFinite(entry))
  );
};

const normalizeUserSummary = (value: unknown): ContractUserSummary | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toIdString(payload.id),
    name: toStringOrNull(payload.name),
    email: toStringOrNull(payload.email),
  };
};

export interface AdminContractsDashboardStats {
  contracts: {
    total: number;
    by_status: Record<string, number>;
  };
  reviews: {
    open_like_total: number;
    urgent_total: number;
    by_status: Record<string, number>;
  };
  signatures: {
    active_total: number;
    stalled_total: number;
    by_status: Record<string, number>;
  };
  obligations: {
    overdue_total: number;
    due_soon_total: number;
  };
}

export interface AdminContractProjectSummary {
  id: string;
  title: string | null;
  reference: string | null;
  status: string | null;
}

export interface AdminContractRiskSummary {
  overall_risk: string | null;
  misclassification_risk: string | null;
  gdpr_risk: string | null;
  ip_risk: string | null;
  tax_risk: string | null;
  enforceability_risk: string | null;
  requires_manual_review: boolean;
  requires_qes: boolean;
  warnings: string[];
  blocking_reasons: string[];
  scoring_payload: Record<string, unknown> | null;
}

export interface AdminContractPartySummary {
  id: string;
  party_role: string | null;
  legal_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  country_code: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  snapshot_payload: Record<string, unknown> | null;
}

export interface AdminContractDocumentSummary {
  id: string;
  document_role: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  sha256_hash: string | null;
  is_current: boolean;
  created_at: string | null;
}

export interface AdminContractObligation {
  id: string;
  party_role: string | null;
  obligation_type: string | null;
  title: string | null;
  status: string | null;
  due_date: string | null;
  due_datetime: string | null;
  completed_at: string | null;
}

export interface AdminContractNote {
  id: string;
  contract_id: string;
  author_user_id: string | null;
  note_type: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  author_user: ContractUserSummary | null;
}

export interface AdminContractListItem {
  id: string;
  reference: string;
  status: string | null;
  contract_form: string | null;
  governing_law_code: string | null;
  jurisdiction_code: string | null;
  signature_level: string | null;
  currency: string | null;
  total_amount: number | null;
  requires_manual_review: boolean;
  requires_qes: boolean;
  generated_at: string | null;
  created_at: string | null;
  project: AdminContractProjectSummary | null;
  latest_risk: AdminContractRiskSummary | null;
  parties: AdminContractPartySummary[];
}

export interface AdminContractDetail extends AdminContractListItem {
  jurisdiction_label: string | null;
  vat_treatment: string | null;
  template_code: string | null;
  updated_at: string | null;
  metadata: Record<string, unknown> | null;
  milestones: Array<Record<string, unknown>>;
  latest_risk_assessment: AdminContractRiskSummary | null;
  documents: AdminContractDocumentSummary[];
  manual_reviews: ContractManualReviewEntity[];
  signatures: ContractSignatureEntity[];
  obligations: AdminContractObligation[];
  notes: AdminContractNote[];
}

export interface AdminReviewQueueItem {
  id: string;
  status: string | null;
  priority: string | null;
  review_reason_codes: string[];
  review_summary: string | null;
  requested_changes: string[];
  opened_at: string | null;
  due_at: string | null;
  closed_at: string | null;
  assigned_to_user: ContractUserSummary | null;
  contract: {
    id: string;
    reference: string | null;
    status: string | null;
    signature_level: string | null;
    requires_manual_review: boolean;
  } | null;
  comments_count: number;
}

export interface AdminReviewComment {
  id: string;
  manual_review_id: string;
  author_user_id: string | null;
  comment_type: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  author_user: ContractUserSummary | null;
}

export interface AdminSignatureQueueItem {
  id: string;
  flow_reference: string | null;
  status: string | null;
  provider: string | null;
  flow_type: string | null;
  provider_status: string | null;
  flow_status: string | null;
  signature_level: string | null;
  external_envelope_id: string | null;
  sent_at: string | null;
  client_uploaded_at: string | null;
  provider_uploaded_at: string | null;
  last_event_at: string | null;
  completed_at: string | null;
  contract: {
    id: string;
    reference: string | null;
    status: string | null;
  } | null;
  signed_document: AdminContractDocumentSummary | null;
  events_count: number;
}

export interface AdminPaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

type AdminQueryParams = Record<string, string | number | boolean | null | undefined>;

export const CONTRACT_NOTE_TYPE_OPTIONS = [
  'INTERNAL',
  'LEGAL',
  'COMPLIANCE',
  'SYSTEM',
  'SIGNATURE',
  'PAYMENT',
] as const;

export const REVIEW_COMMENT_TYPE_OPTIONS = [
  'INTERNAL',
  'DECISION',
  'REQUEST_FOR_INFO',
  'SYSTEM',
] as const;

const normalizeProjectSummary = (value: unknown): AdminContractProjectSummary | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toIdString(payload.id),
    title: toStringOrNull(payload.title),
    reference: toStringOrNull(payload.reference),
    status: toStringOrNull(payload.status),
  };
};

const normalizeRiskSummary = (value: unknown): AdminContractRiskSummary | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    overall_risk: toStringOrNull(payload.overall_risk),
    misclassification_risk: toStringOrNull(payload.misclassification_risk),
    gdpr_risk: toStringOrNull(payload.gdpr_risk),
    ip_risk: toStringOrNull(payload.ip_risk),
    tax_risk: toStringOrNull(payload.tax_risk),
    enforceability_risk: toStringOrNull(payload.enforceability_risk),
    requires_manual_review: toBoolean(payload.requires_manual_review),
    requires_qes: toBoolean(payload.requires_qes),
    warnings: asArray<string>(payload.warnings).map((entry) => String(entry)),
    blocking_reasons: asArray<string>(payload.blocking_reasons).map((entry) =>
      String(entry)
    ),
    scoring_payload: asObject(payload.scoring_payload),
  };
};

const normalizePartySummary = (value: unknown): AdminContractPartySummary => {
  const payload = asObject(value) ?? {};

  return {
    id: toIdString(payload.id),
    party_role: toStringOrNull(payload.party_role),
    legal_name: toStringOrNull(payload.legal_name),
    registration_number: toStringOrNull(payload.registration_number),
    vat_number: toStringOrNull(payload.vat_number),
    country_code: toStringOrNull(payload.country_code),
    signatory_name: toStringOrNull(payload.signatory_name),
    signatory_title: toStringOrNull(payload.signatory_title),
    snapshot_payload: asObject(payload.snapshot_payload),
  };
};

const normalizeDocumentSummary = (value: unknown): AdminContractDocumentSummary => {
  const payload = asObject(value) ?? {};

  return {
    id: toIdString(payload.id),
    document_role: toStringOrNull(payload.document_role),
    file_name: toStringOrNull(payload.file_name),
    mime_type: toStringOrNull(payload.mime_type),
    file_size_bytes: toFiniteNumber(payload.file_size_bytes),
    sha256_hash: toStringOrNull(payload.sha256_hash),
    is_current: toBoolean(payload.is_current),
    created_at: toStringOrNull(payload.created_at),
  };
};

const normalizeObligation = (value: unknown): AdminContractObligation => {
  const payload = asObject(value) ?? {};

  return {
    id: toIdString(payload.id),
    party_role: toStringOrNull(payload.party_role),
    obligation_type: toStringOrNull(payload.obligation_type),
    title: toStringOrNull(payload.title),
    status: toStringOrNull(payload.status),
    due_date: toStringOrNull(payload.due_date),
    due_datetime: toStringOrNull(payload.due_datetime),
    completed_at: toStringOrNull(payload.completed_at),
  };
};

export const normalizeAdminContractNote = (value: unknown): AdminContractNote | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toIdString(payload.id),
    contract_id: toIdString(payload.contract_id),
    author_user_id: toStringOrNull(payload.author_user_id),
    note_type: toStringOrNull(payload.note_type),
    body: toStringOrNull(payload.body),
    metadata: asObject(payload.metadata),
    created_at: toStringOrNull(payload.created_at),
    updated_at: toStringOrNull(payload.updated_at),
    author_user: normalizeUserSummary(payload.author_user),
  };
};

export const normalizeAdminContractListItem = (
  value: unknown
): AdminContractListItem | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toIdString(payload.id),
    reference: toStringOrNull(payload.reference) ?? '',
    status: toStringOrNull(payload.status),
    contract_form: toStringOrNull(payload.contract_form),
    governing_law_code: toStringOrNull(payload.governing_law_code),
    jurisdiction_code: toStringOrNull(payload.jurisdiction_code),
    signature_level: toStringOrNull(payload.signature_level),
    currency: toStringOrNull(payload.currency),
    total_amount: toFiniteNumber(payload.total_amount),
    requires_manual_review: toBoolean(payload.requires_manual_review),
    requires_qes: toBoolean(payload.requires_qes),
    generated_at: toStringOrNull(payload.generated_at),
    created_at: toStringOrNull(payload.created_at),
    project: normalizeProjectSummary(payload.project),
    latest_risk: normalizeRiskSummary(payload.latest_risk),
    parties: asArray(payload.parties).map(normalizePartySummary),
  };
};

export const normalizeAdminContractDetail = (
  value: unknown
): AdminContractDetail | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  const base = normalizeAdminContractListItem(payload);
  if (!base) {
    return null;
  }

  return {
    ...base,
    jurisdiction_label: toStringOrNull(payload.jurisdiction_label),
    vat_treatment: toStringOrNull(payload.vat_treatment),
    template_code: toStringOrNull(payload.template_code),
    updated_at: toStringOrNull(payload.updated_at),
    metadata: asObject(payload.metadata),
    milestones: asArray<Record<string, unknown>>(payload.milestones),
    latest_risk_assessment: normalizeRiskSummary(payload.latest_risk_assessment),
    documents: asArray(payload.documents).map(normalizeDocumentSummary),
    manual_reviews: asArray(payload.manual_reviews)
      .map(normalizeContractManualReviewEntity)
      .filter((entry): entry is ContractManualReviewEntity => entry !== null),
    signatures: asArray(payload.signatures)
      .map(normalizeContractSignatureEntity)
      .filter((entry): entry is ContractSignatureEntity => entry !== null),
    obligations: asArray(payload.obligations).map(normalizeObligation),
    notes: asArray(payload.notes)
      .map(normalizeAdminContractNote)
      .filter((entry): entry is AdminContractNote => entry !== null),
  };
};

export const normalizeAdminReviewQueueItem = (
  value: unknown
): AdminReviewQueueItem | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  const contract = asObject(payload.contract);

  return {
    id: toIdString(payload.id),
    status: toStringOrNull(payload.status),
    priority: toStringOrNull(payload.priority),
    review_reason_codes: asArray<string>(payload.review_reason_codes).map((entry) =>
      String(entry)
    ),
    review_summary: toStringOrNull(payload.review_summary),
    requested_changes: asArray<string>(payload.requested_changes).map((entry) =>
      String(entry)
    ),
    opened_at: toStringOrNull(payload.opened_at),
    due_at: toStringOrNull(payload.due_at),
    closed_at: toStringOrNull(payload.closed_at),
    assigned_to_user: normalizeUserSummary(payload.assigned_to_user),
    contract: contract
      ? {
          id: toIdString(contract.id),
          reference: toStringOrNull(contract.reference),
          status: toStringOrNull(contract.status),
          signature_level: toStringOrNull(contract.signature_level),
          requires_manual_review: toBoolean(contract.requires_manual_review),
        }
      : null,
    comments_count: toFiniteNumber(payload.comments_count) ?? 0,
  };
};

export const normalizeAdminReviewComment = (value: unknown): AdminReviewComment | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toIdString(payload.id),
    manual_review_id: toIdString(payload.manual_review_id),
    author_user_id: toStringOrNull(payload.author_user_id),
    comment_type: toStringOrNull(payload.comment_type),
    body: toStringOrNull(payload.body),
    metadata: asObject(payload.metadata),
    created_at: toStringOrNull(payload.created_at),
    updated_at: toStringOrNull(payload.updated_at),
    author_user: normalizeUserSummary(payload.author_user),
  };
};

export const normalizeAdminSignatureQueueItem = (
  value: unknown
): AdminSignatureQueueItem | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  const contract = asObject(payload.contract);

  return {
    id: toIdString(payload.id),
    flow_reference: toStringOrNull(payload.flow_reference),
    status: toStringOrNull(payload.status),
    provider: toStringOrNull(payload.provider),
    flow_type: toStringOrNull(payload.flow_type),
    provider_status: toStringOrNull(payload.provider_status),
    flow_status: toStringOrNull(payload.flow_status),
    signature_level: toStringOrNull(payload.signature_level),
    external_envelope_id: toStringOrNull(payload.external_envelope_id),
    sent_at: toStringOrNull(payload.sent_at),
    client_uploaded_at: toStringOrNull(payload.client_uploaded_at),
    provider_uploaded_at: toStringOrNull(payload.provider_uploaded_at),
    last_event_at: toStringOrNull(payload.last_event_at),
    completed_at: toStringOrNull(payload.completed_at),
    contract: contract
      ? {
          id: toIdString(contract.id),
          reference: toStringOrNull(contract.reference),
          status: toStringOrNull(contract.status),
        }
      : null,
    signed_document: payload.signed_document
      ? normalizeDocumentSummary(payload.signed_document)
      : null,
    events_count: toFiniteNumber(payload.events_count) ?? 0,
  };
};

export const normalizeAdminContractsDashboardStats = (
  value: unknown
): AdminContractsDashboardStats => {
  const payload = asObject(value) ?? {};
  const contracts = asObject(payload.contracts) ?? {};
  const reviews = asObject(payload.reviews) ?? {};
  const signatures = asObject(payload.signatures) ?? {};
  const obligations = asObject(payload.obligations) ?? {};

  return {
    contracts: {
      total: toFiniteNumber(contracts.total) ?? 0,
      by_status: normalizeCountMap(contracts.by_status),
    },
    reviews: {
      open_like_total: toFiniteNumber(reviews.open_like_total) ?? 0,
      urgent_total: toFiniteNumber(reviews.urgent_total) ?? 0,
      by_status: normalizeCountMap(reviews.by_status),
    },
    signatures: {
      active_total: toFiniteNumber(signatures.active_total) ?? 0,
      stalled_total: toFiniteNumber(signatures.stalled_total) ?? 0,
      by_status: normalizeCountMap(signatures.by_status),
    },
    obligations: {
      overdue_total: toFiniteNumber(obligations.overdue_total) ?? 0,
      due_soon_total: toFiniteNumber(obligations.due_soon_total) ?? 0,
    },
  };
};

const normalizePaginatedResponse = <T>(
  value: unknown,
  normalizeItem: (entry: unknown) => T | null
): AdminPaginatedResponse<T> => {
  const payload = asObject(value) ?? {};
  const nestedData = asObject(payload.data);
  const collection = Array.isArray(payload.data)
    ? payload
    : nestedData && Array.isArray(nestedData.data)
      ? nestedData
      : payload;
  const meta = asObject(payload.meta) ?? asObject(collection.meta);

  return {
    current_page:
      toFiniteNumber(collection.current_page ?? meta?.current_page) ?? 1,
    data: asArray(collection.data)
      .map(normalizeItem)
      .filter((entry): entry is T => entry !== null),
    last_page: toFiniteNumber(collection.last_page ?? meta?.last_page) ?? 1,
    per_page: toFiniteNumber(collection.per_page ?? meta?.per_page) ?? 0,
    total: toFiniteNumber(collection.total ?? meta?.total) ?? 0,
  };
};

export const adminContractsApi = {
  async getDashboardStats() {
    const payload = await apiFetch<unknown>('/admin/dashboard/contracts/stats');
    return normalizeAdminContractsDashboardStats(payload);
  },

  async listContracts(params?: AdminQueryParams) {
    const payload = await apiFetch<unknown>('/admin/contracts', { params });
    return normalizePaginatedResponse(payload, normalizeAdminContractListItem);
  },

  async getContractDetail(contractId: string | number) {
    const payload = await apiFetch<unknown>(`/admin/contracts/${contractId}`);
    const contract = normalizeAdminContractDetail(payload);

    if (!contract) {
      throw new Error('Admin contract detail payload is missing the contract entity.');
    }

    return contract;
  },

  async listContractNotes(contractId: string | number, params?: AdminQueryParams) {
    const payload = await apiFetch<unknown>(`/admin/contracts/${contractId}/notes`, {
      params,
    });
    return normalizePaginatedResponse(payload, normalizeAdminContractNote);
  },

  async createContractNote(
    contractId: string | number,
    payload: {
      body: string;
      note_type?: (typeof CONTRACT_NOTE_TYPE_OPTIONS)[number] | null;
      metadata?: Record<string, unknown>;
    }
  ) {
    const response = await apiFetch<unknown>(`/admin/contracts/${contractId}/notes`, {
      method: 'POST',
      body: {
        body: payload.body,
        ...(payload.note_type ? { note_type: payload.note_type } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
      },
    });

    const note = normalizeAdminContractNote(response);
    if (!note) {
      throw new Error('Admin contract note payload is missing the created note.');
    }

    return note;
  },

  async listReviewQueue(params?: AdminQueryParams) {
    const payload = await apiFetch<unknown>('/admin/review-queue', { params });
    return normalizePaginatedResponse(payload, normalizeAdminReviewQueueItem);
  },

  async getReviewDetail(reviewId: string | number) {
    const payload = await apiFetch<unknown>(`/admin/review-queue/${reviewId}`);
    const review = normalizeContractManualReviewEntity(payload);

    if (!review) {
      throw new Error('Admin review detail payload is missing the review entity.');
    }

    return review;
  },

  async listReviewComments(reviewId: string | number, params?: AdminQueryParams) {
    const payload = await apiFetch<unknown>(`/admin/review-queue/${reviewId}/comments`, {
      params,
    });
    return normalizePaginatedResponse(payload, normalizeAdminReviewComment);
  },

  async createReviewComment(
    reviewId: string | number,
    payload: {
      body: string;
      comment_type?: (typeof REVIEW_COMMENT_TYPE_OPTIONS)[number] | null;
      metadata?: Record<string, unknown>;
    }
  ) {
    const response = await apiFetch<unknown>(
      `/admin/review-queue/${reviewId}/comments`,
      {
        method: 'POST',
        body: {
          body: payload.body,
          ...(payload.comment_type ? { comment_type: payload.comment_type } : {}),
          ...(payload.metadata ? { metadata: payload.metadata } : {}),
        },
      }
    );

    const comment = normalizeAdminReviewComment(response);
    if (!comment) {
      throw new Error('Admin review comment payload is missing the created comment.');
    }

    return comment;
  },

  async listSignatureQueue(params?: AdminQueryParams) {
    const payload = await apiFetch<unknown>('/admin/signature-queue', { params });
    return normalizePaginatedResponse(payload, normalizeAdminSignatureQueueItem);
  },

  async getSignatureDetail(signatureId: string | number) {
    const payload = await apiFetch<unknown>(`/admin/signature-queue/${signatureId}`);
    const signature = normalizeContractSignatureEntity(payload);

    if (!signature) {
      throw new Error('Admin signature detail payload is missing the signature entity.');
    }

    return signature;
  },

  async uploadSignedPdf(signatureId: string | number, file: File) {
    const body = new FormData();
    body.append('signed_pdf', file);

    const response = await apiFetch<unknown>(
      `/admin/signature-queue/${signatureId}/upload-signed-pdf`,
      {
        method: 'POST',
        body,
      }
    );

    const payload = asObject(response) ?? {};
    const signature = normalizeContractSignatureEntity(payload.signature ?? payload);

    if (!signature) {
      throw new Error('Admin signed PDF upload response is missing the signature entity.');
    }

    return {
      message: toStringOrNull(payload.message),
      document_id: toStringOrNull(payload.document_id),
      signature,
    };
  },
};

import { apiFetch } from '@/lib/fetch-client';

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
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

export type ContractDocumentRole =
  | 'DRAFT_HTML'
  | 'FINAL_PDF'
  | 'CLIENT_SIGNED_PDF'
  | 'SIGNED_PDF'
  | 'ANNEX'
  | 'DPA'
  | 'IP_ANNEX'
  | 'SOW'
  | (string & {});

export interface ContractGenerationSummary {
  contract_id: string;
  project_id: string;
  reference: string;
  status: string;
  requires_manual_review: boolean;
  requires_qes: boolean;
}

export interface ContractParty {
  id: string;
  party_role: string;
  company_id: string | null;
  user_id: string | null;
  legal_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  country_code: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  snapshot_payload: Record<string, unknown> | null;
}

export interface ContractMilestone {
  id: string;
  source_milestone_id: string | null;
  title: string | null;
  description: string | null;
  position: number | null;
  currency: string | null;
  amount: number | null;
  target_date: string | null;
  acceptance_criteria: string | null;
  delivery_requirements: string | null;
}

export interface ContractClauseUsage {
  id: string;
  contract_clause_id: string | null;
  clause_code: string | null;
  sort_order: number | null;
  rendered_body: string | null;
  render_context: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface ContractDocument {
  id: string;
  contract_id: string | null;
  generation_run_id: string | null;
  document_role: string;
  storage_disk: string | null;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  sha256_hash: string | null;
  language_code: string | null;
  is_current: boolean;
  metadata: Record<string, unknown> | null;
  created_by_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractRiskAssessment {
  id: string;
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
  created_at: string | null;
}

export interface ContractUserSummary {
  id: string;
  name: string | null;
  email: string | null;
}

export interface ContractReferenceSummary {
  id: string;
  reference: string | null;
  status: string | null;
  signature_level: string | null;
  requires_manual_review: boolean;
}

export interface ContractManualReviewComment {
  id: string;
  comment_type: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  author_user: ContractUserSummary | null;
}

export interface ContractManualReviewEntity {
  id: string;
  status: string;
  priority: string | null;
  review_reason_codes: string[];
  review_summary: string | null;
  requested_changes: string[];
  final_decision_notes: string | null;
  resolution_snapshot: Record<string, unknown> | null;
  risk_snapshot: Record<string, unknown> | null;
  contract_snapshot_hash: string | null;
  opened_at: string | null;
  due_at: string | null;
  closed_at: string | null;
  contract: ContractReferenceSummary | null;
  assigned_to_user: ContractUserSummary | null;
  created_by_user: ContractUserSummary | null;
  closed_by_user: ContractUserSummary | null;
  comments: ContractManualReviewComment[];
}

export interface ContractSignatureEvent {
  id: string;
  event_type: string | null;
  external_event_id: string | null;
  provider_status: string | null;
  actor_role: string | null;
  actor_email: string | null;
  event_payload: Record<string, unknown> | null;
  occurred_at: string | null;
}

export interface ContractSignatureValidationSigner {
  id: string;
  validation_id: string;
  signature_index: number | null;
  expected_role: string | null;
  signature_field_name: string | null;
  certificate_subject: string | null;
  certificate_issuer: string | null;
  certificate_serial: string | null;
  certificate_country_code: string | null;
  certificate_qualified: boolean;
  signature_valid: boolean;
  covers_document_revision: boolean;
  signing_time: string | null;
  certificate_metadata: Record<string, unknown> | null;
  signature_metadata: Record<string, unknown> | null;
}

export interface ContractSignatureValidation {
  id: string;
  contract_signature_id: string;
  stage: string | null;
  uploaded_document_id: string | null;
  validation_status: string | null;
  signature_count_found: number | null;
  client_signature_present: boolean;
  client_signature_valid: boolean;
  provider_signature_present: boolean;
  provider_signature_valid: boolean;
  integrity_ok: boolean;
  base_document_hash_match: boolean;
  allowed_changes_only: boolean;
  certificate_chain_ok: boolean;
  revocation_check_ok: boolean;
  trusted_list_match: boolean;
  detected_signature_format: string | null;
  detected_signature_level: string | null;
  best_signature_time: string | null;
  failure_reason: string | null;
  failure_codes: string[];
  validation_metadata: Record<string, unknown> | null;
  dss_report_json: Record<string, unknown> | null;
  uploaded_document: ContractDocument | null;
  created_by_user: ContractUserSummary | null;
  signers: ContractSignatureValidationSigner[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractSignatureEntity {
  id: string;
  contract_id: string;
  flow_reference: string | null;
  status: string | null;
  provider: string | null;
  flow_type: string | null;
  provider_status: string | null;
  flow_status: string | null;
  signature_level: string | null;
  validation_policy_code: string | null;
  external_envelope_id: string | null;
  failure_reason: string | null;
  decline_reason: string | null;
  provider_payload: Record<string, unknown> | null;
  submitted_payload_hash: string | null;
  required_signer_sequence: unknown[];
  base_document_id: string | null;
  client_signed_document_id: string | null;
  fully_signed_document_id: string | null;
  signed_document_id: string | null;
  sent_at: string | null;
  client_uploaded_at: string | null;
  provider_uploaded_at: string | null;
  last_event_at: string | null;
  last_synced_at: string | null;
  fully_validated_at: string | null;
  completed_at: string | null;
  contract: ContractReferenceSummary | null;
  signed_document: ContractDocument | null;
  base_document: ContractDocument | null;
  client_signed_document: ContractDocument | null;
  fully_signed_document: ContractDocument | null;
  events: ContractSignatureEvent[];
  validations: ContractSignatureValidation[];
}

export interface ContractOperationsSnapshot {
  id: string;
  status: string | null;
  manual_reviews: ContractManualReviewEntity[];
  signatures: ContractSignatureEntity[];
}

export interface ContractEntity {
  id: string;
  project_id: string;
  reference: string;
  status: string;
  governing_law_code: string | null;
  jurisdiction_code: string | null;
  jurisdiction_label: string | null;
  contract_form: string | null;
  vat_treatment: string | null;
  signature_level: string | null;
  template_code: string | null;
  currency: string | null;
  total_amount: number | null;
  requires_manual_review: boolean;
  requires_qes: boolean;
  generated_by_user_id: string | null;
  generated_at: string | null;
  metadata: Record<string, unknown> | null;
  parties: ContractParty[];
  milestones: ContractMilestone[];
  clause_usages: ContractClauseUsage[];
  documents: ContractDocument[];
  risk_assessments: ContractRiskAssessment[];
}

const normalizeContractGenerationSummary = (value: unknown): ContractGenerationSummary => {
  const payload = asObject(value) ?? {};

  return {
    contract_id: toIdString(payload.contract_id ?? payload.contractId ?? payload.id),
    project_id: toIdString(payload.project_id ?? payload.projectId),
    reference: toStringOrNull(payload.reference) ?? '',
    status: toStringOrNull(payload.status) ?? 'draft',
    requires_manual_review: toBoolean(
      payload.requires_manual_review ?? payload.requiresManualReview
    ),
    requires_qes: toBoolean(payload.requires_qes ?? payload.requiresQes),
  };
};

const normalizeContractParty = (value: unknown): ContractParty => {
  const party = asObject(value) ?? {};

  return {
    id: toIdString(party.id),
    party_role: toStringOrNull(party.party_role ?? party.partyRole) ?? 'UNKNOWN',
    company_id: toStringOrNull(party.company_id ?? party.companyId),
    user_id: toStringOrNull(party.user_id ?? party.userId),
    legal_name: toStringOrNull(party.legal_name ?? party.legalName),
    registration_number: toStringOrNull(
      party.registration_number ?? party.registrationNumber
    ),
    vat_number: toStringOrNull(party.vat_number ?? party.vatNumber),
    country_code: toStringOrNull(party.country_code ?? party.countryCode),
    signatory_name: toStringOrNull(party.signatory_name ?? party.signatoryName),
    signatory_title: toStringOrNull(party.signatory_title ?? party.signatoryTitle),
    snapshot_payload: asObject(party.snapshot_payload ?? party.snapshotPayload),
  };
};

const normalizeContractMilestone = (value: unknown): ContractMilestone => {
  const milestone = asObject(value) ?? {};

  return {
    id: toIdString(milestone.id),
    source_milestone_id: toStringOrNull(
      milestone.source_milestone_id ?? milestone.sourceMilestoneId
    ),
    title: toStringOrNull(milestone.title),
    description: toStringOrNull(milestone.description),
    position: toFiniteNumber(milestone.position),
    currency: toStringOrNull(milestone.currency),
    amount: toFiniteNumber(milestone.amount),
    target_date: toStringOrNull(milestone.target_date ?? milestone.targetDate),
    acceptance_criteria: toStringOrNull(
      milestone.acceptance_criteria ?? milestone.acceptanceCriteria
    ),
    delivery_requirements: toStringOrNull(
      milestone.delivery_requirements ?? milestone.deliveryRequirements
    ),
  };
};

const normalizeContractClauseUsage = (value: unknown): ContractClauseUsage => {
  const clauseUsage = asObject(value) ?? {};

  return {
    id: toIdString(clauseUsage.id),
    contract_clause_id: toStringOrNull(
      clauseUsage.contract_clause_id ?? clauseUsage.contractClauseId
    ),
    clause_code: toStringOrNull(clauseUsage.clause_code ?? clauseUsage.clauseCode),
    sort_order: toFiniteNumber(clauseUsage.sort_order ?? clauseUsage.sortOrder),
    rendered_body: toStringOrNull(clauseUsage.rendered_body ?? clauseUsage.renderedBody),
    render_context: asObject(clauseUsage.render_context ?? clauseUsage.renderContext),
    metadata: asObject(clauseUsage.metadata),
  };
};

const normalizeContractDocument = (value: unknown): ContractDocument => {
  const document = asObject(value) ?? {};

  return {
    id: toIdString(document.id),
    contract_id: toStringOrNull(document.contract_id ?? document.contractId),
    generation_run_id: toStringOrNull(
      document.generation_run_id ?? document.generationRunId
    ),
    document_role:
      toStringOrNull(document.document_role ?? document.documentRole) ?? 'UNKNOWN',
    storage_disk: toStringOrNull(document.storage_disk ?? document.storageDisk),
    storage_path: toStringOrNull(document.storage_path ?? document.storagePath),
    file_name: toStringOrNull(document.file_name ?? document.fileName),
    mime_type: toStringOrNull(document.mime_type ?? document.mimeType),
    file_size_bytes: toFiniteNumber(document.file_size_bytes ?? document.fileSizeBytes),
    sha256_hash: toStringOrNull(document.sha256_hash ?? document.sha256Hash),
    language_code: toStringOrNull(document.language_code ?? document.languageCode),
    is_current: toBoolean(document.is_current ?? document.isCurrent),
    metadata: asObject(document.metadata),
    created_by_user_id: toStringOrNull(
      document.created_by_user_id ?? document.createdByUserId
    ),
    created_at: toStringOrNull(document.created_at ?? document.createdAt),
    updated_at: toStringOrNull(document.updated_at ?? document.updatedAt),
  };
};

const normalizeContractRiskAssessment = (value: unknown): ContractRiskAssessment => {
  const risk = asObject(value) ?? {};

  return {
    id: toIdString(risk.id),
    overall_risk: toStringOrNull(risk.overall_risk ?? risk.overallRisk),
    misclassification_risk: toStringOrNull(
      risk.misclassification_risk ?? risk.misclassificationRisk
    ),
    gdpr_risk: toStringOrNull(risk.gdpr_risk ?? risk.gdprRisk),
    ip_risk: toStringOrNull(risk.ip_risk ?? risk.ipRisk),
    tax_risk: toStringOrNull(risk.tax_risk ?? risk.taxRisk),
    enforceability_risk: toStringOrNull(
      risk.enforceability_risk ?? risk.enforceabilityRisk
    ),
    requires_manual_review: toBoolean(
      risk.requires_manual_review ?? risk.requiresManualReview
    ),
    requires_qes: toBoolean(risk.requires_qes ?? risk.requiresQes),
    warnings: asArray<string>(risk.warnings).map((entry) => String(entry)),
    blocking_reasons: asArray<string>(
      risk.blocking_reasons ?? risk.blockingReasons
    ).map((entry) => String(entry)),
    created_at: toStringOrNull(risk.created_at ?? risk.createdAt),
  };
};

const normalizeContractUserSummary = (value: unknown): ContractUserSummary | null => {
  const user = asObject(value);
  if (!user) {
    return null;
  }

  const id = toStringOrNull(user.id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: toStringOrNull(user.name),
    email: toStringOrNull(user.email),
  };
};

const normalizeContractReferenceSummary = (
  value: unknown
): ContractReferenceSummary | null => {
  const contract = asObject(value);
  if (!contract) {
    return null;
  }

  const id = toStringOrNull(contract.id);
  if (!id) {
    return null;
  }

  return {
    id,
    reference: toStringOrNull(contract.reference),
    status: toStringOrNull(contract.status),
    signature_level: toStringOrNull(
      contract.signature_level ?? contract.signatureLevel
    ),
    requires_manual_review: toBoolean(
      contract.requires_manual_review ?? contract.requiresManualReview
    ),
  };
};

const normalizeContractManualReviewComment = (
  value: unknown
): ContractManualReviewComment => {
  const comment = asObject(value) ?? {};

  return {
    id: toIdString(comment.id),
    comment_type: toStringOrNull(comment.comment_type ?? comment.commentType),
    body: toStringOrNull(comment.body),
    metadata: asObject(comment.metadata),
    created_at: toStringOrNull(comment.created_at ?? comment.createdAt),
    author_user: normalizeContractUserSummary(
      comment.author_user ?? comment.authorUser
    ),
  };
};

const extractManualReviewEntity = (value: unknown): Record<string, unknown> | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  if ('id' in payload && 'status' in payload && ('review_summary' in payload || 'priority' in payload)) {
    return payload;
  }

  const review = asObject(payload.review);
  if (review) {
    return review;
  }

  const data = asObject(payload.data);
  if (!data) {
    return null;
  }

  if ('id' in data && 'status' in data && ('review_summary' in data || 'priority' in data)) {
    return data;
  }

  return asObject(data.review);
};

export const normalizeContractManualReviewEntity = (
  value: unknown
): ContractManualReviewEntity | null => {
  const review = extractManualReviewEntity(value);
  if (!review) {
    return null;
  }

  return {
    id: toIdString(review.id),
    status: toStringOrNull(review.status) ?? 'OPEN',
    priority: toStringOrNull(review.priority),
    review_reason_codes: asArray<string>(
      review.review_reason_codes ?? review.reviewReasonCodes
    ).map((entry) => String(entry)),
    review_summary: toStringOrNull(
      review.review_summary ?? review.reviewSummary
    ),
    requested_changes: asArray<string>(
      review.requested_changes ?? review.requestedChanges
    ).map((entry) => String(entry)),
    final_decision_notes: toStringOrNull(
      review.final_decision_notes ?? review.finalDecisionNotes
    ),
    resolution_snapshot: asObject(
      review.resolution_snapshot ?? review.resolutionSnapshot
    ),
    risk_snapshot: asObject(review.risk_snapshot ?? review.riskSnapshot),
    contract_snapshot_hash: toStringOrNull(
      review.contract_snapshot_hash ?? review.contractSnapshotHash
    ),
    opened_at: toStringOrNull(review.opened_at ?? review.openedAt),
    due_at: toStringOrNull(review.due_at ?? review.dueAt),
    closed_at: toStringOrNull(review.closed_at ?? review.closedAt),
    contract: normalizeContractReferenceSummary(review.contract),
    assigned_to_user: normalizeContractUserSummary(
      review.assigned_to_user ?? review.assignedToUser
    ),
    created_by_user: normalizeContractUserSummary(
      review.created_by_user ?? review.createdByUser
    ),
    closed_by_user: normalizeContractUserSummary(
      review.closed_by_user ?? review.closedByUser
    ),
    comments: asArray(review.comments).map(normalizeContractManualReviewComment),
  };
};

const normalizeContractSignatureEvent = (value: unknown): ContractSignatureEvent => {
  const event = asObject(value) ?? {};

  return {
    id: toIdString(event.id),
    event_type: toStringOrNull(event.event_type ?? event.eventType),
    external_event_id: toStringOrNull(
      event.external_event_id ?? event.externalEventId
    ),
    provider_status: toStringOrNull(
      event.provider_status ?? event.providerStatus
    ),
    actor_role: toStringOrNull(event.actor_role ?? event.actorRole),
    actor_email: toStringOrNull(event.actor_email ?? event.actorEmail),
    event_payload: asObject(event.event_payload ?? event.eventPayload),
    occurred_at: toStringOrNull(event.occurred_at ?? event.occurredAt),
  };
};

const normalizeContractSignatureValidationSigner = (
  value: unknown
): ContractSignatureValidationSigner => {
  const signer = asObject(value) ?? {};

  return {
    id: toIdString(signer.id),
    validation_id: toIdString(signer.validation_id ?? signer.validationId),
    signature_index: toFiniteNumber(
      signer.signature_index ?? signer.signatureIndex
    ),
    expected_role: toStringOrNull(signer.expected_role ?? signer.expectedRole),
    signature_field_name: toStringOrNull(
      signer.signature_field_name ?? signer.signatureFieldName
    ),
    certificate_subject: toStringOrNull(
      signer.certificate_subject ?? signer.certificateSubject
    ),
    certificate_issuer: toStringOrNull(
      signer.certificate_issuer ?? signer.certificateIssuer
    ),
    certificate_serial: toStringOrNull(
      signer.certificate_serial ?? signer.certificateSerial
    ),
    certificate_country_code: toStringOrNull(
      signer.certificate_country_code ?? signer.certificateCountryCode
    ),
    certificate_qualified: toBoolean(
      signer.certificate_qualified ?? signer.certificateQualified
    ),
    signature_valid: toBoolean(signer.signature_valid ?? signer.signatureValid),
    covers_document_revision: toBoolean(
      signer.covers_document_revision ?? signer.coversDocumentRevision
    ),
    signing_time: toStringOrNull(signer.signing_time ?? signer.signingTime),
    certificate_metadata: asObject(
      signer.certificate_metadata ?? signer.certificateMetadata
    ),
    signature_metadata: asObject(
      signer.signature_metadata ?? signer.signatureMetadata
    ),
  };
};

const normalizeContractSignatureValidation = (
  value: unknown
): ContractSignatureValidation => {
  const validation = asObject(value) ?? {};

  return {
    id: toIdString(validation.id),
    contract_signature_id: toIdString(
      validation.contract_signature_id ?? validation.contractSignatureId
    ),
    stage: toStringOrNull(validation.stage),
    uploaded_document_id: toStringOrNull(
      validation.uploaded_document_id ?? validation.uploadedDocumentId
    ),
    validation_status: toStringOrNull(
      validation.validation_status ?? validation.validationStatus
    ),
    signature_count_found: toFiniteNumber(
      validation.signature_count_found ?? validation.signatureCountFound
    ),
    client_signature_present: toBoolean(
      validation.client_signature_present ?? validation.clientSignaturePresent
    ),
    client_signature_valid: toBoolean(
      validation.client_signature_valid ?? validation.clientSignatureValid
    ),
    provider_signature_present: toBoolean(
      validation.provider_signature_present ?? validation.providerSignaturePresent
    ),
    provider_signature_valid: toBoolean(
      validation.provider_signature_valid ?? validation.providerSignatureValid
    ),
    integrity_ok: toBoolean(validation.integrity_ok ?? validation.integrityOk),
    base_document_hash_match: toBoolean(
      validation.base_document_hash_match ?? validation.baseDocumentHashMatch
    ),
    allowed_changes_only: toBoolean(
      validation.allowed_changes_only ?? validation.allowedChangesOnly
    ),
    certificate_chain_ok: toBoolean(
      validation.certificate_chain_ok ?? validation.certificateChainOk
    ),
    revocation_check_ok: toBoolean(
      validation.revocation_check_ok ?? validation.revocationCheckOk
    ),
    trusted_list_match: toBoolean(
      validation.trusted_list_match ?? validation.trustedListMatch
    ),
    detected_signature_format: toStringOrNull(
      validation.detected_signature_format ?? validation.detectedSignatureFormat
    ),
    detected_signature_level: toStringOrNull(
      validation.detected_signature_level ?? validation.detectedSignatureLevel
    ),
    best_signature_time: toStringOrNull(
      validation.best_signature_time ?? validation.bestSignatureTime
    ),
    failure_reason: toStringOrNull(
      validation.failure_reason ?? validation.failureReason
    ),
    failure_codes: asArray<string>(
      validation.failure_codes ?? validation.failureCodes
    ).map((entry) => String(entry)),
    validation_metadata: asObject(
      validation.validation_metadata ?? validation.validationMetadata
    ),
    dss_report_json: asObject(
      validation.dss_report_json ?? validation.dssReportJson
    ),
    uploaded_document: validation.uploaded_document
      ? normalizeContractDocument(validation.uploaded_document)
      : validation.uploadedDocument
        ? normalizeContractDocument(validation.uploadedDocument)
        : null,
    created_by_user: normalizeContractUserSummary(
      validation.created_by_user ?? validation.createdByUser
    ),
    signers: asArray(validation.signers).map(
      normalizeContractSignatureValidationSigner
    ),
    created_at: toStringOrNull(validation.created_at ?? validation.createdAt),
    updated_at: toStringOrNull(validation.updated_at ?? validation.updatedAt),
  };
};

const extractContractSignatureEntity = (
  value: unknown
): Record<string, unknown> | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  if ('id' in payload && ('contract_id' in payload || 'contractId' in payload)) {
    return payload;
  }

  const signature = asObject(payload.signature);
  if (signature) {
    return signature;
  }

  const data = asObject(payload.data);
  if (!data) {
    return null;
  }

  if ('id' in data && ('contract_id' in data || 'contractId' in data)) {
    return data;
  }

  return asObject(data.signature);
};

export const normalizeContractSignatureEntity = (
  value: unknown
): ContractSignatureEntity | null => {
  const signature = extractContractSignatureEntity(value);
  if (!signature) {
    return null;
  }

  return {
    id: toIdString(signature.id),
    contract_id: toIdString(signature.contract_id ?? signature.contractId),
    flow_reference: toStringOrNull(
      signature.flow_reference ?? signature.flowReference
    ),
    status: toStringOrNull(signature.status),
    provider: toStringOrNull(signature.provider),
    flow_type: toStringOrNull(signature.flow_type ?? signature.flowType),
    provider_status: toStringOrNull(
      signature.provider_status ?? signature.providerStatus
    ),
    flow_status: toStringOrNull(signature.flow_status ?? signature.flowStatus),
    signature_level: toStringOrNull(
      signature.signature_level ?? signature.signatureLevel
    ),
    validation_policy_code: toStringOrNull(
      signature.validation_policy_code ?? signature.validationPolicyCode
    ),
    external_envelope_id: toStringOrNull(
      signature.external_envelope_id ?? signature.externalEnvelopeId
    ),
    failure_reason: toStringOrNull(
      signature.failure_reason ?? signature.failureReason
    ),
    decline_reason: toStringOrNull(
      signature.decline_reason ?? signature.declineReason
    ),
    provider_payload: asObject(
      signature.provider_payload ?? signature.providerPayload
    ),
    submitted_payload_hash: toStringOrNull(
      signature.submitted_payload_hash ?? signature.submittedPayloadHash
    ),
    required_signer_sequence: asArray(
      signature.required_signer_sequence ??
        signature.requiredSignerSequence ??
        signature.required_signer_sequence_json ??
        signature.requiredSignerSequenceJson
    ),
    base_document_id: toStringOrNull(
      signature.base_document_id ?? signature.baseDocumentId
    ),
    client_signed_document_id: toStringOrNull(
      signature.client_signed_document_id ?? signature.clientSignedDocumentId
    ),
    fully_signed_document_id: toStringOrNull(
      signature.fully_signed_document_id ?? signature.fullySignedDocumentId
    ),
    signed_document_id: toStringOrNull(
      signature.signed_document_id ?? signature.signedDocumentId
    ),
    sent_at: toStringOrNull(signature.sent_at ?? signature.sentAt),
    client_uploaded_at: toStringOrNull(
      signature.client_uploaded_at ?? signature.clientUploadedAt
    ),
    provider_uploaded_at: toStringOrNull(
      signature.provider_uploaded_at ?? signature.providerUploadedAt
    ),
    last_event_at: toStringOrNull(
      signature.last_event_at ?? signature.lastEventAt
    ),
    last_synced_at: toStringOrNull(
      signature.last_synced_at ?? signature.lastSyncedAt
    ),
    fully_validated_at: toStringOrNull(
      signature.fully_validated_at ?? signature.fullyValidatedAt
    ),
    completed_at: toStringOrNull(
      signature.completed_at ?? signature.completedAt
    ),
    contract: normalizeContractReferenceSummary(signature.contract),
    signed_document: signature.signed_document
      ? normalizeContractDocument(signature.signed_document)
      : signature.signedDocument
        ? normalizeContractDocument(signature.signedDocument)
        : null,
    base_document: signature.base_document
      ? normalizeContractDocument(signature.base_document)
      : signature.baseDocument
        ? normalizeContractDocument(signature.baseDocument)
        : null,
    client_signed_document: signature.client_signed_document
      ? normalizeContractDocument(signature.client_signed_document)
      : signature.clientSignedDocument
        ? normalizeContractDocument(signature.clientSignedDocument)
        : null,
    fully_signed_document: signature.fully_signed_document
      ? normalizeContractDocument(signature.fully_signed_document)
      : signature.fullySignedDocument
        ? normalizeContractDocument(signature.fullySignedDocument)
        : null,
    events: asArray(signature.events).map(normalizeContractSignatureEvent),
    validations: asArray(signature.validations).map(
      normalizeContractSignatureValidation
    ),
  };
};

const extractContractOperationsSnapshot = (
  value: unknown
): Record<string, unknown> | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  if ('id' in payload && ('manual_reviews' in payload || 'manualReviews' in payload)) {
    return payload;
  }

  const data = asObject(payload.data);
  if (!data) {
    return null;
  }

  if ('id' in data && ('manual_reviews' in data || 'manualReviews' in data)) {
    return data;
  }

  return null;
};

export const normalizeContractOperationsSnapshot = (
  value: unknown
): ContractOperationsSnapshot | null => {
  const snapshot = extractContractOperationsSnapshot(value);
  if (!snapshot) {
    return null;
  }

  return {
    id: toIdString(snapshot.id),
    status: toStringOrNull(snapshot.status),
    manual_reviews: asArray(
      snapshot.manual_reviews ?? snapshot.manualReviews
    ).map(normalizeContractManualReviewEntity).filter(
      (entry): entry is ContractManualReviewEntity => entry !== null
    ),
    signatures: asArray(snapshot.signatures)
      .map(normalizeContractSignatureEntity)
      .filter((entry): entry is ContractSignatureEntity => entry !== null),
  };
};

export const extractContractEntity = (value: unknown): Record<string, unknown> | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  if ('id' in payload && 'project_id' in payload) {
    return payload;
  }

  const contract = asObject(payload.contract);
  if (contract) {
    return contract;
  }

  const data = asObject(payload.data);
  if (data && 'id' in data && 'project_id' in data) {
    return data;
  }

  const nestedContract = data ? asObject(data.contract) : null;
  if (nestedContract) {
    return nestedContract;
  }

  return null;
};

export const normalizeContractEntity = (value: unknown): ContractEntity | null => {
  const contract = extractContractEntity(value);
  if (!contract) {
    return null;
  }

  return {
    id: toIdString(contract.id),
    project_id: toIdString(contract.project_id ?? contract.projectId),
    reference: toStringOrNull(contract.reference) ?? '',
    status: toStringOrNull(contract.status) ?? 'draft',
    governing_law_code: toStringOrNull(
      contract.governing_law_code ?? contract.governingLawCode
    ),
    jurisdiction_code: toStringOrNull(
      contract.jurisdiction_code ?? contract.jurisdictionCode
    ),
    jurisdiction_label: toStringOrNull(
      contract.jurisdiction_label ?? contract.jurisdictionLabel
    ),
    contract_form: toStringOrNull(contract.contract_form ?? contract.contractForm),
    vat_treatment: toStringOrNull(contract.vat_treatment ?? contract.vatTreatment),
    signature_level: toStringOrNull(
      contract.signature_level ?? contract.signatureLevel
    ),
    template_code: toStringOrNull(contract.template_code ?? contract.templateCode),
    currency: toStringOrNull(contract.currency),
    total_amount: toFiniteNumber(contract.total_amount ?? contract.totalAmount),
    requires_manual_review: toBoolean(
      contract.requires_manual_review ?? contract.requiresManualReview
    ),
    requires_qes: toBoolean(contract.requires_qes ?? contract.requiresQes),
    generated_by_user_id: toStringOrNull(
      contract.generated_by_user_id ?? contract.generatedByUserId
    ),
    generated_at: toStringOrNull(contract.generated_at ?? contract.generatedAt),
    metadata: asObject(contract.metadata),
    parties: asArray(contract.parties).map(normalizeContractParty),
    milestones: asArray(contract.milestones).map(normalizeContractMilestone),
    clause_usages: asArray(contract.clause_usages ?? contract.clauseUsages).map(
      normalizeContractClauseUsage
    ),
    documents: asArray(contract.documents).map(normalizeContractDocument),
    risk_assessments: asArray(
      contract.risk_assessments ?? contract.riskAssessments
    ).map(normalizeContractRiskAssessment),
  };
};

export const getCurrentContractDocument = (
  contract: ContractEntity | null,
  documentRole: ContractDocumentRole
): ContractDocument | null => {
  if (!contract) {
    return null;
  }

  const currentDocument =
    contract.documents.find(
      (document) => document.document_role === documentRole && document.is_current
    ) ?? null;

  if (currentDocument) {
    return currentDocument;
  }

  return (
    contract.documents
      .filter((document) => document.document_role === documentRole)
      .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))[0] ?? null
  );
};

export const getLatestContractRiskAssessment = (
  contract: ContractEntity | null
): ContractRiskAssessment | null => {
  if (!contract || contract.risk_assessments.length === 0) {
    return null;
  }

  return [...contract.risk_assessments].sort((left, right) => {
    const leftTimestamp = Date.parse(left.created_at ?? '') || Number(left.id || 0);
    const rightTimestamp = Date.parse(right.created_at ?? '') || Number(right.id || 0);

    return rightTimestamp - leftTimestamp;
  })[0]!;
};

export const getLatestContractSignatureValidation = (
  signature: ContractSignatureEntity | null
): ContractSignatureValidation | null => {
  if (!signature || signature.validations.length === 0) {
    return null;
  }

  return [...signature.validations].sort((left, right) => {
    const leftTimestamp = Date.parse(left.created_at ?? '') || Number(left.id || 0);
    const rightTimestamp =
      Date.parse(right.created_at ?? '') || Number(right.id || 0);

    return rightTimestamp - leftTimestamp;
  })[0]!;
};

const extractIdCandidate = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'object') {
    const objectValue = asObject(value);
    if (!objectValue) {
      return null;
    }

    return (
      extractIdCandidate(objectValue.id) ??
      extractIdCandidate(objectValue.contract_id) ??
      extractIdCandidate(objectValue.contractId)
    );
  }

  return null;
};

export const extractProjectContractIdCandidate = (value: unknown): string | null => {
  const project = asObject(value);
  if (!project) {
    return null;
  }

  const directCandidate =
    extractIdCandidate(project.contract_id) ??
    extractIdCandidate(project.contractId) ??
    extractIdCandidate(project.current_contract_id) ??
    extractIdCandidate(project.currentContractId) ??
    extractIdCandidate(project.latest_contract_id) ??
    extractIdCandidate(project.latestContractId);

  if (directCandidate) {
    return directCandidate;
  }

  const nestedCandidate =
    extractIdCandidate(project.contract) ??
    extractIdCandidate(project.current_contract) ??
    extractIdCandidate(project.currentContract) ??
    extractIdCandidate(project.latest_contract) ??
    extractIdCandidate(project.latestContract);

  if (nestedCandidate) {
    return nestedCandidate;
  }

  const wrappedPayloads = [project.data, project.project, project.attributes]
    .map((entry) => asObject(entry))
    .filter(
      (entry): entry is Record<string, unknown> => entry !== null && entry !== project
    );

  for (const wrappedPayload of wrappedPayloads) {
    const wrappedCandidate = extractProjectContractIdCandidate(wrappedPayload);
    if (wrappedCandidate) {
      return wrappedCandidate;
    }
  }

  const collections = [
    ...asArray(project.contracts),
    ...asArray(project.project_contracts ?? project.projectContracts),
  ];

  if (collections.length === 0) {
    return null;
  }

  const prioritizedContracts = collections
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .sort((left, right) => {
      const currentScore = Number(
        toBoolean(right.is_current ?? right.isCurrent)
      ) - Number(toBoolean(left.is_current ?? left.isCurrent));
      if (currentScore !== 0) {
        return currentScore;
      }

      return (toFiniteNumber(right.id) ?? 0) - (toFiniteNumber(left.id) ?? 0);
    });

  return extractIdCandidate(prioritizedContracts[0]);
};

export const extractFileNameFromContentDisposition = (
  value: string | null | undefined
): string | null => {
  if (!value) {
    return null;
  }

  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = value.match(/filename\s*=\s*"?([^\";]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return null;
};

export const contractsApi = {
  async generateProjectContract(projectId: string | number) {
    const payload = await apiFetch<unknown>('/contracts/generate', {
      method: 'POST',
      body: {
        project_id: toFiniteNumber(projectId) ?? String(projectId),
      },
    });

    return normalizeContractGenerationSummary(payload);
  },

  async getContract(contractId: string | number) {
    const payload = await apiFetch<unknown>(`/contracts/${contractId}`);
    const contract = normalizeContractEntity(payload);

    if (!contract) {
      throw new Error('Contract payload is missing the contract entity.');
    }

    return contract;
  },

  async getContractHtml(contractId: string | number) {
    return apiFetch<string>(`/contracts/${contractId}/html`, {
      parseAs: 'text',
      headers: {
        Accept: 'text/html',
      },
    });
  },

  async getContractPdfResponse(contractId: string | number) {
    return apiFetch<Response>(`/contracts/${contractId}/pdf`, {
      parseAs: 'response',
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  async getAdminContract(contractId: string | number) {
    const payload = await apiFetch<unknown>(`/admin/contracts/${contractId}`);
    const contract = normalizeContractOperationsSnapshot(payload);

    if (!contract) {
      throw new Error('Admin contract payload is missing operational data.');
    }

    return contract;
  },

  async openManualReview(
    contractId: string | number,
    payload: {
      reason_codes?: string[];
      summary?: string | null;
      priority?: string | null;
      comment?: string | null;
      due_at?: string | null;
      assigned_to_user_id?: string | number | null;
      generation_run_id?: string | number | null;
    }
  ) {
    const response = await apiFetch<unknown>(
      `/contracts/${contractId}/manual-review/open`,
      {
        method: 'POST',
        body: {
          ...(payload.reason_codes?.length
            ? { reason_codes: payload.reason_codes }
            : {}),
          ...(payload.summary ? { summary: payload.summary } : {}),
          ...(payload.priority ? { priority: payload.priority } : {}),
          ...(payload.comment ? { comment: payload.comment } : {}),
          ...(payload.due_at ? { due_at: payload.due_at } : {}),
          ...(payload.assigned_to_user_id
            ? {
                assigned_to_user_id:
                  toFiniteNumber(payload.assigned_to_user_id) ??
                  String(payload.assigned_to_user_id),
              }
            : {}),
          ...(payload.generation_run_id
            ? {
                generation_run_id:
                  toFiniteNumber(payload.generation_run_id) ??
                  String(payload.generation_run_id),
              }
            : {}),
        },
      }
    );

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async getManualReview(reviewId: string | number) {
    const payload = await apiFetch<unknown>(`/manual-reviews/${reviewId}`);
    const review = normalizeContractManualReviewEntity(payload);

    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async assignManualReview(
    reviewId: string | number,
    payload: { assigned_to_user_id: string | number; comment?: string | null }
  ) {
    const response = await apiFetch<unknown>(`/manual-reviews/${reviewId}/assign`, {
      method: 'POST',
      body: {
        assigned_to_user_id:
          toFiniteNumber(payload.assigned_to_user_id) ??
          String(payload.assigned_to_user_id),
        ...(payload.comment ? { comment: payload.comment } : {}),
      },
    });

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async startManualReview(
    reviewId: string | number,
    payload?: { comment?: string | null }
  ) {
    const response = await apiFetch<unknown>(`/admin/review-queue/${reviewId}/start`, {
      method: 'POST',
      body: payload?.comment ? { comment: payload.comment } : {},
    });

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async requestManualReviewChanges(
    reviewId: string | number,
    payload: { requested_changes: string[]; comment?: string | null }
  ) {
    const response = await apiFetch<unknown>(
      `/manual-reviews/${reviewId}/request-changes`,
      {
        method: 'POST',
        body: {
          requested_changes: payload.requested_changes,
          ...(payload.comment ? { comment: payload.comment } : {}),
        },
      }
    );

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async approveManualReview(
    reviewId: string | number,
    payload?: { notes?: string | null }
  ) {
    const response = await apiFetch<unknown>(`/manual-reviews/${reviewId}/approve`, {
      method: 'POST',
      body: payload?.notes ? { notes: payload.notes } : {},
    });

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async rejectManualReview(
    reviewId: string | number,
    payload?: { notes?: string | null }
  ) {
    const response = await apiFetch<unknown>(`/manual-reviews/${reviewId}/reject`, {
      method: 'POST',
      body: payload?.notes ? { notes: payload.notes } : {},
    });

    const review = normalizeContractManualReviewEntity(response);
    if (!review) {
      throw new Error('Manual review payload is missing the review entity.');
    }

    return review;
  },

  async issueManualSignatureFlow(
    contractId: string | number,
    payload?: { validation_policy_code?: string | null }
  ) {
    const response = await apiFetch<unknown>(
      `/admin/contracts/${contractId}/manual-signature-flow/issue`,
      {
        method: 'POST',
        body: payload?.validation_policy_code
          ? { validation_policy_code: payload.validation_policy_code }
          : {},
      }
    );

    const signature = normalizeContractSignatureEntity(response);
    if (!signature) {
      throw new Error('Signature flow payload is missing the signature entity.');
    }

    return signature;
  },

  async getManualSignatureFlow(contractId: string | number) {
    const payload = await apiFetch<unknown>(
      `/admin/contracts/${contractId}/manual-signature-flow`
    );
    const signature = normalizeContractSignatureEntity(payload);

    if (!signature) {
      throw new Error('Signature flow payload is missing the signature entity.');
    }

    return signature;
  },

  async getContractSignature(signatureId: string | number) {
    const payload = await apiFetch<unknown>(`/contract-signatures/${signatureId}`);
    const signature = normalizeContractSignatureEntity(payload);

    if (!signature) {
      throw new Error('Signature payload is missing the signature entity.');
    }

    return signature;
  },

  async getSignedPdfResponse(signatureId: string | number) {
    return apiFetch<Response>(`/contract-signatures/${signatureId}/signed-pdf`, {
      parseAs: 'response',
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  async getManualClientDownloadResponse(contractId: string | number) {
    return apiFetch<Response>(
      `/admin/contracts/${contractId}/manual-signature-flow/client-download`,
      {
        parseAs: 'response',
        headers: {
          Accept: 'application/pdf',
        },
      }
    );
  },

  async getManualProviderDownloadResponse(contractId: string | number) {
    return apiFetch<Response>(
      `/admin/contracts/${contractId}/manual-signature-flow/provider-download`,
      {
        parseAs: 'response',
        headers: {
          Accept: 'application/pdf',
        },
      }
    );
  },

  async uploadManualClientSignedPdf(
    contractId: string | number,
    file: File
  ) {
    const body = new FormData();
    body.append('signed_pdf', file);

    const response = await apiFetch<unknown>(
      `/admin/contracts/${contractId}/manual-signature-flow/client-upload`,
      {
        method: 'POST',
        body,
      }
    );

    const signature = normalizeContractSignatureEntity(response);
    if (!signature) {
      throw new Error('Signature flow payload is missing the signature entity.');
    }

    return signature;
  },

  async uploadManualProviderSignedPdf(
    contractId: string | number,
    file: File
  ) {
    const body = new FormData();
    body.append('signed_pdf', file);

    const response = await apiFetch<unknown>(
      `/admin/contracts/${contractId}/manual-signature-flow/provider-upload`,
      {
        method: 'POST',
        body,
      }
    );

    const signature = normalizeContractSignatureEntity(response);
    if (!signature) {
      throw new Error('Signature flow payload is missing the signature entity.');
    }

    return signature;
  },
};

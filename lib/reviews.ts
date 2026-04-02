export type ProjectReviewRole = 'CLIENT' | 'PROVIDER' | (string & {});

export type ProjectReviewStatus = 'SUBMITTED' | 'PUBLISHED' | 'REMOVED' | (string & {});

export type ProjectReviewScorePayload = {
  communication?: number | null;
  quality?: number | null;
  timeliness?: number | null;
  professionalism?: number | null;
  scope_clarity?: number | null;
  payment_reliability?: number | null;
  would_work_again?: boolean | null;
};

export type ProjectReviewUserSummary = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  profile_url: string | null;
};

export type ProjectReviewProjectSummary = {
  id: string | null;
  title: string;
  status: string | null;
  contract_id: string | null;
};

export type ProjectReviewMilestoneSummary = {
  id: string;
  title: string;
  status: string | null;
  service: {
    id: string | null;
    name: string;
  } | null;
};

export type ProjectReviewRecord = {
  id: string;
  project_id: string;
  project_line_milestone_id: string | null;
  reviewer_user_id: string;
  reviewee_user_id: string;
  reviewer_role: ProjectReviewRole;
  reviewee_role: ProjectReviewRole;
  status: ProjectReviewStatus;
  rating_overall: number;
  headline: string | null;
  body: string;
  score_payload: ProjectReviewScorePayload;
  submitted_at: string | null;
  published_at: string | null;
  edited_at: string | null;
  flag_count: number;
  project: ProjectReviewProjectSummary | null;
  milestone: ProjectReviewMilestoneSummary | null;
  reviewer: ProjectReviewUserSummary | null;
  reviewee: ProjectReviewUserSummary | null;
};

export type ReviewOpportunityRecord = {
  project_id: string;
  project_title: string;
  project_status: string | null;
  contract_id: string | null;
  reviewer_role: ProjectReviewRole;
  reviewee: ProjectReviewUserSummary | null;
  service_names: string[];
  eligible_milestone_ids: string[];
};

export type ProjectReviewFlagRecord = {
  id: string;
  project_review_id: string;
  reason_code: string;
  notes: string | null;
  status: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string | null;
  flagged_by_user: ProjectReviewUserSummary | null;
  resolved_by_user: ProjectReviewUserSummary | null;
};

export type ReviewPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type MyProjectReviewsResponse = {
  data: ProjectReviewRecord[];
  meta: ReviewPaginationMeta;
};

export type PublicUserReviewsSummary = {
  user_id: string;
  average_rating: number;
  review_count: number;
};

export type PublicUserReviewsResponse = {
  success: boolean;
  summary: PublicUserReviewsSummary;
  data: ProjectReviewRecord[];
  meta: ReviewPaginationMeta;
};

export type SubmitProjectReviewPayload = {
  reviewee_user_id: string | number;
  project_line_milestone_id?: string | number | null;
  rating_overall: number;
  headline?: string | null;
  body: string;
  private_feedback?: string | null;
  score_payload?: ProjectReviewScorePayload | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateProjectReviewPayload = {
  project_line_milestone_id?: string | number | null;
  rating_overall?: number;
  headline?: string | null;
  body?: string;
  private_feedback?: string | null;
  score_payload?: ProjectReviewScorePayload | null;
};

export type FlagProjectReviewPayload = {
  reason_code: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

const FINAL_PROJECT_REVIEW_STATUSES = new Set([
  'COMPLETED',
  'FINISHED',
  'DELIVERED',
]);

const REVIEW_SCORE_KEYS = [
  'communication',
  'quality',
  'timeliness',
  'professionalism',
  'scope_clarity',
  'payment_reliability',
] as const;

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
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
  }

  return null;
};

const toPaginationMeta = (value: unknown): ReviewPaginationMeta => {
  const payload = asObject(value) ?? {};

  return {
    current_page: toFiniteNumber(payload.current_page) ?? 1,
    last_page: toFiniteNumber(payload.last_page) ?? 1,
    per_page: toFiniteNumber(payload.per_page) ?? 0,
    total: toFiniteNumber(payload.total) ?? 0,
  };
};

export const buildProjectReviewUserSummary = (
  value: unknown
): ProjectReviewUserSummary | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  const firstName = toStringOrNull(payload.first_name ?? payload.firstName) ?? '';
  const lastName = toStringOrNull(payload.last_name ?? payload.lastName) ?? '';
  const fallbackName = toStringOrNull(payload.name) ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || fallbackName;

  return {
    id: toStringOrNull(payload.id) ?? '',
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    avatar: toStringOrNull(payload.avatar),
    profile_url: toStringOrNull(payload.profile_url),
  };
};

export const normalizeProjectReviewScorePayload = (
  value: unknown
): ProjectReviewScorePayload => {
  const payload = asObject(value) ?? {};

  return {
    communication: toFiniteNumber(payload.communication),
    quality: toFiniteNumber(payload.quality),
    timeliness: toFiniteNumber(payload.timeliness),
    professionalism: toFiniteNumber(payload.professionalism),
    scope_clarity: toFiniteNumber(payload.scope_clarity),
    payment_reliability: toFiniteNumber(payload.payment_reliability),
    would_work_again: toBoolean(payload.would_work_again),
  };
};

export const normalizeProjectReview = (value: unknown): ProjectReviewRecord | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  const projectPayload = asObject(payload.project);
  const milestonePayload = asObject(payload.milestone);
  const milestoneServicePayload = asObject(milestonePayload?.service);

  return {
    id: toStringOrNull(payload.id) ?? '',
    project_id: toStringOrNull(payload.project_id) ?? '',
    project_line_milestone_id: toStringOrNull(payload.project_line_milestone_id),
    reviewer_user_id: toStringOrNull(payload.reviewer_user_id) ?? '',
    reviewee_user_id: toStringOrNull(payload.reviewee_user_id) ?? '',
    reviewer_role:
      (toStringOrNull(payload.reviewer_role)?.toUpperCase() as ProjectReviewRole) ?? 'CLIENT',
    reviewee_role:
      (toStringOrNull(payload.reviewee_role)?.toUpperCase() as ProjectReviewRole) ?? 'PROVIDER',
    status:
      (toStringOrNull(payload.status)?.toUpperCase() as ProjectReviewStatus) ?? 'SUBMITTED',
    rating_overall: toFiniteNumber(payload.rating_overall) ?? 0,
    headline: toStringOrNull(payload.headline),
    body: toStringOrNull(payload.body) ?? '',
    score_payload: normalizeProjectReviewScorePayload(payload.score_payload),
    submitted_at: toStringOrNull(payload.submitted_at),
    published_at: toStringOrNull(payload.published_at),
    edited_at: toStringOrNull(payload.edited_at),
    flag_count: toFiniteNumber(payload.flag_count) ?? 0,
    project: projectPayload
      ? {
          id: toStringOrNull(projectPayload.id),
          title: toStringOrNull(projectPayload.title) ?? 'Untitled project',
          status: toStringOrNull(projectPayload.status),
          contract_id: toStringOrNull(projectPayload.contract_id),
        }
      : null,
    milestone: milestonePayload
      ? {
          id: toStringOrNull(milestonePayload.id) ?? '',
          title: toStringOrNull(milestonePayload.title) ?? 'Milestone',
          status: toStringOrNull(milestonePayload.status),
          service: milestoneServicePayload
            ? {
                id: toStringOrNull(milestoneServicePayload.id),
                name: toStringOrNull(milestoneServicePayload.name) ?? 'Service',
              }
            : null,
        }
      : null,
    reviewer: buildProjectReviewUserSummary(payload.reviewer),
    reviewee: buildProjectReviewUserSummary(payload.reviewee),
  };
};

export const normalizeProjectReviewCollection = (
  value: unknown
): ProjectReviewRecord[] => {
  const payload = asObject(value);
  const source: unknown[] =
    payload && Array.isArray(payload.data)
      ? payload.data
      : payload && Array.isArray(payload.reviews)
        ? payload.reviews
        : Array.isArray(value)
          ? value
          : [];

  return source
    .map(normalizeProjectReview)
    .filter((entry): entry is ProjectReviewRecord => entry !== null);
};

export const normalizeReviewOpportunity = (
  value: unknown
): ReviewOpportunityRecord | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    project_id: toStringOrNull(payload.project_id) ?? '',
    project_title: toStringOrNull(payload.project_title) ?? 'Untitled project',
    project_status: toStringOrNull(payload.project_status),
    contract_id: toStringOrNull(payload.contract_id),
    reviewer_role:
      (toStringOrNull(payload.reviewer_role)?.toUpperCase() as ProjectReviewRole) ?? 'CLIENT',
    reviewee: buildProjectReviewUserSummary(payload.reviewee),
    service_names: asArray(payload.service_names)
      .map((entry) => toStringOrNull(entry))
      .filter((entry): entry is string => entry !== null),
    eligible_milestone_ids: asArray(payload.eligible_milestone_ids)
      .map((entry) => toStringOrNull(entry))
      .filter((entry): entry is string => entry !== null),
  };
};

export const normalizeReviewOpportunityCollection = (
  value: unknown
): ReviewOpportunityRecord[] => {
  const payload = asObject(value);
  const source: unknown[] =
    payload && Array.isArray(payload.data)
      ? payload.data
      : payload && Array.isArray(payload.opportunities)
        ? payload.opportunities
        : Array.isArray(value)
          ? value
          : [];

  return source
    .map(normalizeReviewOpportunity)
    .filter((entry): entry is ReviewOpportunityRecord => entry !== null);
};

export const isProjectReviewOpportunityProjectFinished = (
  opportunity: Pick<ReviewOpportunityRecord, 'project_status'> | null | undefined
) => {
  const normalizedStatus = toStringOrNull(opportunity?.project_status)?.toUpperCase();
  return normalizedStatus ? FINAL_PROJECT_REVIEW_STATUSES.has(normalizedStatus) : false;
};

export const normalizeProjectReviewFlag = (
  value: unknown
): ProjectReviewFlagRecord | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  return {
    id: toStringOrNull(payload.id) ?? '',
    project_review_id: toStringOrNull(payload.project_review_id) ?? '',
    reason_code: toStringOrNull(payload.reason_code) ?? '',
    notes: toStringOrNull(payload.notes),
    status: toStringOrNull(payload.status) ?? 'OPEN',
    resolution_notes: toStringOrNull(payload.resolution_notes),
    resolved_at: toStringOrNull(payload.resolved_at),
    created_at: toStringOrNull(payload.created_at),
    flagged_by_user: buildProjectReviewUserSummary(payload.flagged_by_user),
    resolved_by_user: buildProjectReviewUserSummary(payload.resolved_by_user),
  };
};

export const normalizeMyProjectReviewsResponse = (
  value: unknown
): MyProjectReviewsResponse => {
  const payload = asObject(value) ?? {};

  return {
    data: normalizeProjectReviewCollection(payload),
    meta: toPaginationMeta(payload.meta),
  };
};

export const normalizePublicUserReviewsResponse = (
  value: unknown
): PublicUserReviewsResponse => {
  const payload = asObject(value) ?? {};
  const summaryPayload = asObject(payload.summary) ?? {};

  return {
    success: payload.success !== false,
    summary: {
      user_id: toStringOrNull(summaryPayload.user_id) ?? '',
      average_rating: toFiniteNumber(summaryPayload.average_rating) ?? 0,
      review_count: toFiniteNumber(summaryPayload.review_count) ?? 0,
    },
    data: normalizeProjectReviewCollection(payload),
    meta: toPaginationMeta(payload.meta),
  };
};

export const getProjectReviewDisplayDate = (review: ProjectReviewRecord) =>
  review.published_at ?? review.submitted_at ?? review.edited_at ?? null;

export const getProjectReviewDisplayPerson = (
  review: ProjectReviewRecord,
  perspective: 'reviewer' | 'reviewee'
) => (perspective === 'reviewer' ? review.reviewer : review.reviewee);

export type ProjectReviewScoreEntry =
  | {
      key: (typeof REVIEW_SCORE_KEYS)[number];
      value: number;
    }
  | {
      key: 'would_work_again';
      value: 0 | 1;
    };

export const getProjectReviewScoreEntries = (review: ProjectReviewRecord) => {
  const numericEntries = REVIEW_SCORE_KEYS.map((key) => {
    const value = review.score_payload[key];
    return value === null || value === undefined
      ? null
      : {
          key,
          value,
        };
  }).filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

  const entries: ProjectReviewScoreEntry[] = [...numericEntries];

  if (typeof review.score_payload.would_work_again === 'boolean') {
    entries.push({
      key: 'would_work_again',
      value: review.score_payload.would_work_again ? 1 : 0,
    });
  }

  return entries;
};

export const buildProjectReviewMutationPayload = <
  T extends SubmitProjectReviewPayload | UpdateProjectReviewPayload
>(
  payload: T
) => {
  const nextPayload: Record<string, unknown> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (key === 'headline' || key === 'body' || key === 'private_feedback') {
      if (typeof value === 'string') {
        nextPayload[key] = value.trim();
        return;
      }

      nextPayload[key] = value;
      return;
    }

    if (key === 'project_line_milestone_id') {
      nextPayload[key] =
        value === null || value === ''
          ? null
          : typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : value;
      return;
    }

    if (key === 'reviewee_user_id') {
      nextPayload[key] =
        typeof value === 'string' || typeof value === 'number' ? String(value) : value;
      return;
    }

    if (key === 'score_payload' && value && typeof value === 'object') {
      const normalizedScorePayload = Object.entries(value).reduce<Record<string, unknown>>(
        (acc, [scoreKey, scoreValue]) => {
          if (scoreValue === undefined) {
            return acc;
          }

          if (scoreKey === 'would_work_again') {
            const normalizedBoolean = toBoolean(scoreValue);
            if (normalizedBoolean !== null) {
              acc[scoreKey] = normalizedBoolean;
            }
            return acc;
          }

          const normalizedNumber = toFiniteNumber(scoreValue);
          if (normalizedNumber !== null && normalizedNumber > 0) {
            acc[scoreKey] = normalizedNumber;
          }

          return acc;
        },
        {}
      );

      nextPayload[key] = normalizedScorePayload;
      return;
    }

    nextPayload[key] = value;
  });

  return nextPayload;
};

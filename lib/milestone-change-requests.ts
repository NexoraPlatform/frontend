import type {
  Project,
  ProjectLine,
  ProjectLineMilestone,
  ProjectMilestoneChangeRequest,
  ProjectMilestoneChangeRequestCurrentSnapshot,
} from '@/types/projects';

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
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

const toOptionalText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toIdLike = (value: unknown): string | number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return null;
};

const normalizeCurrentSnapshot = (
  value: unknown
): ProjectMilestoneChangeRequestCurrentSnapshot | null => {
  const snapshot = asObject(value);
  if (!snapshot) {
    return null;
  }

  const id = toIdLike(snapshot.id);
  const projectLineId = toIdLike(snapshot.project_line_id ?? snapshot.projectLineId);
  const assignedProviderId = toIdLike(
    snapshot.assigned_provider_id ?? snapshot.assignedProviderId ?? snapshot.provider_id ?? snapshot.providerId
  );
  const percentage = toFiniteNumber(snapshot.percentage);
  const amount = toFiniteNumber(snapshot.amount);

  return {
    ...snapshot,
    ...(id !== null ? { id } : {}),
    ...(projectLineId !== null ? { project_line_id: projectLineId } : {}),
    ...(assignedProviderId !== null ? { assigned_provider_id: assignedProviderId } : {}),
    ...(typeof snapshot.currency === 'string' ? { currency: snapshot.currency } : {}),
    title: toOptionalText(snapshot.title),
    description: toOptionalText(snapshot.description),
    ...(percentage !== null ? { percentage } : {}),
    ...(amount !== null ? { amount } : {}),
    status: toOptionalText(snapshot.status),
    budget_status: toOptionalText(snapshot.budget_status ?? snapshot.budgetStatus),
  };
};

export const normalizeMilestoneChangeRequest = (
  value: unknown
): ProjectMilestoneChangeRequest => {
  const proposal = asObject(value) ?? {};
  const id = toIdLike(proposal.id);
  const projectId = toIdLike(proposal.project_id ?? proposal.projectId);
  const projectLineId = toIdLike(proposal.project_line_id ?? proposal.projectLineId);
  const projectLineMilestoneId = toIdLike(
    proposal.project_line_milestone_id ?? proposal.projectLineMilestoneId
  );
  const providerId = toIdLike(proposal.provider_id ?? proposal.providerId);
  const serviceId = toIdLike(proposal.service_id ?? proposal.serviceId);
  const percentage = toFiniteNumber(proposal.percentage);
  const amount = toFiniteNumber(proposal.amount);
  const provider = asObject(proposal.provider);
  const providerEntityId = provider ? toIdLike(provider.id) : null;
  const proposalType = String(proposal.proposal_type ?? proposal.proposalType ?? '').trim().toUpperCase();
  const status = String(proposal.status ?? '').trim().toUpperCase();

  return {
    ...proposal,
    ...(id !== null ? { id } : {}),
    ...(projectId !== null ? { project_id: projectId } : {}),
    ...(projectLineId !== null ? { project_line_id: projectLineId } : {}),
    ...(projectLineMilestoneId !== null ? { project_line_milestone_id: projectLineMilestoneId } : {}),
    ...(providerId !== null ? { provider_id: providerId } : {}),
    ...(serviceId !== null ? { service_id: serviceId } : {}),
    ...(proposalType ? { proposal_type: proposalType } : {}),
    ...(status ? { status } : {}),
    title: toOptionalText(proposal.title),
    description: toOptionalText(proposal.description),
    ...(percentage !== null ? { percentage } : {}),
    ...(amount !== null ? { amount } : {}),
    reason: toOptionalText(proposal.reason),
    client_reason: toOptionalText(proposal.client_reason ?? proposal.clientReason),
    ...(provider
      ? {
          provider: {
            ...provider,
            ...(providerEntityId !== null ? { id: providerEntityId } : {}),
            firstName:
              toOptionalText(provider.firstName ?? provider.first_name) ?? undefined,
            lastName:
              toOptionalText(provider.lastName ?? provider.last_name) ?? undefined,
            name: toOptionalText(provider.name) ?? undefined,
            avatar: toOptionalText(provider.avatar),
            rating: toFiniteNumber(provider.rating),
          },
        }
      : {}),
    service_name: toOptionalText(proposal.service_name ?? proposal.serviceName),
    delivery_provider: toOptionalText(
      proposal.delivery_provider ?? proposal.deliveryProvider
    ) as ProjectMilestoneChangeRequest['delivery_provider'],
    milestone_title: toOptionalText(proposal.milestone_title ?? proposal.milestoneTitle),
    current_snapshot: normalizeCurrentSnapshot(proposal.current_snapshot ?? proposal.currentSnapshot),
    created_at: toOptionalText(proposal.created_at ?? proposal.createdAt),
    updated_at: toOptionalText(proposal.updated_at ?? proposal.updatedAt),
  };
};

const dedupeMilestoneChangeRequests = (
  proposals: ProjectMilestoneChangeRequest[]
): ProjectMilestoneChangeRequest[] => {
  const seen = new Set<string>();

  return proposals.filter((proposal) => {
    const key =
      proposal.id != null
        ? `id:${String(proposal.id)}`
        : [
            proposal.project_id ?? '',
            proposal.project_line_id ?? '',
            proposal.project_line_milestone_id ?? '',
            proposal.provider_id ?? '',
            proposal.proposal_type ?? '',
            proposal.status ?? '',
            proposal.title ?? '',
            proposal.created_at ?? '',
          ].join('::');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const collectProjectMilestoneChangeRequests = (
  project: unknown
): ProjectMilestoneChangeRequest[] => {
  const projectObject = asObject(project);
  if (!projectObject) {
    return [];
  }

  const topLevel = asArray(projectObject.milestone_change_requests).map(
    normalizeMilestoneChangeRequest
  );

  const lineLevel = asArray(projectObject.project_lines).flatMap((line) => {
    const lineObject = asObject(line);
    if (!lineObject) {
      return [];
    }

    return asArray(lineObject.milestone_change_requests).map(
      normalizeMilestoneChangeRequest
    );
  });

  const milestoneLevel = asArray(projectObject.project_lines).flatMap((line) => {
    const lineObject = asObject(line);
    if (!lineObject) {
      return [];
    }

    return asArray(lineObject.milestones).flatMap((milestone) => {
      const milestoneObject = asObject(milestone);
      if (!milestoneObject) {
        return [];
      }

      return asArray(milestoneObject.milestone_change_requests).map(
        normalizeMilestoneChangeRequest
      );
    });
  });

  return dedupeMilestoneChangeRequests([...topLevel, ...lineLevel, ...milestoneLevel]).sort(
    (left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightTime - leftTime;
    }
  );
};

export const getProjectMilestoneChangeRequestsForProvider = (
  project: Project | Record<string, unknown> | null | undefined,
  providerId: string | number | null | undefined
): ProjectMilestoneChangeRequest[] => {
  if (!project || providerId === null || providerId === undefined) {
    return [];
  }

  const normalizedProviderId = String(providerId);

  return collectProjectMilestoneChangeRequests(project).filter((proposal) => {
    const proposalProviderId = proposal.provider_id;
    return proposalProviderId !== null && proposalProviderId !== undefined
      ? String(proposalProviderId) === normalizedProviderId
      : false;
  });
};

export const getProjectMilestoneChangeRequestsForMilestone = (
  project: Project | Record<string, unknown> | null | undefined,
  milestoneId: string | number | null | undefined
): ProjectMilestoneChangeRequest[] => {
  if (!project || milestoneId === null || milestoneId === undefined) {
    return [];
  }

  const normalizedMilestoneId = String(milestoneId);

  return collectProjectMilestoneChangeRequests(project).filter((proposal) => {
    const proposalMilestoneId = proposal.project_line_milestone_id;
    return proposalMilestoneId !== null && proposalMilestoneId !== undefined
      ? String(proposalMilestoneId) === normalizedMilestoneId
      : false;
  });
};

export const getProjectMilestoneChangeRequestsForLine = (
  project: Project | Record<string, unknown> | null | undefined,
  lineId: string | number | null | undefined,
  providerId?: string | number | null
): ProjectMilestoneChangeRequest[] => {
  if (!project || lineId === null || lineId === undefined) {
    return [];
  }

  const normalizedLineId = String(lineId);
  const normalizedProviderId =
    providerId === null || providerId === undefined ? null : String(providerId);

  return collectProjectMilestoneChangeRequests(project).filter((proposal) => {
    const proposalLineId = proposal.project_line_id;
    if (proposalLineId === null || proposalLineId === undefined) {
      return false;
    }

    if (String(proposalLineId) !== normalizedLineId) {
      return false;
    }

    if (normalizedProviderId === null) {
      return true;
    }

    const proposalProviderId = proposal.provider_id;
    return proposalProviderId !== null && proposalProviderId !== undefined
      ? String(proposalProviderId) === normalizedProviderId
      : false;
  });
};

export const getProjectLineForMilestone = (
  project: Project | Record<string, unknown> | null | undefined,
  milestone: ProjectLineMilestone | Record<string, unknown> | null | undefined
): ProjectLine | Record<string, unknown> | null => {
  if (!project || !milestone) {
    return null;
  }

  const milestoneObject = asObject(milestone);
  const milestoneLineId = toIdLike(
    milestoneObject?.project_line_id ?? milestoneObject?.projectLineId
  );
  if (milestoneLineId === null) {
    return null;
  }

  const projectObject = asObject(project);
  if (!projectObject) {
    return null;
  }

  const projectLines = asArray(projectObject.project_lines);
  const matchedLine = projectLines.find((line) => {
    const lineObject = asObject(line);
    const lineId = toIdLike(lineObject?.id);
    return lineId !== null && String(lineId) === String(milestoneLineId);
  });

  return matchedLine
    ? (matchedLine as ProjectLine | Record<string, unknown>)
    : null;
};

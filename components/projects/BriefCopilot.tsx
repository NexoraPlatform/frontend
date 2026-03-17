'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, SendHorizontal, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { ensureEcho, getEcho } from '@/lib/echo';
import { FetchError, fetchClient } from '@/lib/fetch-client';
import { aiService } from '@/services/ai.service';
import { cn } from '@/lib/utils';
import { normalizeProjectDeadlineValue } from '@/types/ai';
import type {
  AiBusinessAnalysis,
  AiBriefAvailableService,
  AiAssistantMessage,
  AiBriefBuilderResponse,
  AiBriefBuilderStatus,
  AiBriefFormDraft,
  AiMilestoneItem,
  AiStructuredBrief,
  AiTeamRecommendationMember,
  AiTeamStructureItem,
  AiTechStack,
} from '@/types/ai';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type BriefEchoInstance = NonNullable<ReturnType<typeof getEcho>>;
type BriefEchoChannel = ReturnType<BriefEchoInstance['private']>;

type BriefCopilotProps = {
  locale: string;
  className?: string;
  availableServices?: AiBriefAvailableService[];
  onApply: (draft: AiBriefFormDraft) => void;
};

const DEFAULT_SYSTEM_PROMPT = [
  'You are an AI marketplace architect.',
  'Help clients clarify their project brief through iterative questions.',
  'When more details are needed return status=CLARIFY with concise questions.',
  'When enough details exist return status=FINAL and include structured brief data.',
].join(' ');

const HTML_TAG_PATTERN = /<[^>]+>/g;
const HTML_BREAK_PATTERN = /<\s*br\s*\/?>/gi;
const HTML_BLOCK_END_PATTERN =
  /<\/\s*(p|div|section|article|header|footer|h[1-6]|ul|ol|li|table|tr)\s*>/gi;
const HTML_LIST_ITEM_START_PATTERN = /<\s*li[^>]*>/gi;
const MULTI_NEWLINE_PATTERN = /\n{3,}/g;

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
};

const decodeHtmlEntities = (value: string): string => {
  if (!value) {
    return '';
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
};

const normalizeTextForTextarea = (value: string): string => {
  if (!value) {
    return '';
  }

  let normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const hasHtml = /<\/?[a-z][^>]*>/i.test(normalized);

  if (hasHtml) {
    normalized = normalized
      .replace(HTML_BREAK_PATTERN, '\n')
      .replace(HTML_LIST_ITEM_START_PATTERN, '- ')
      .replace(HTML_BLOCK_END_PATTERN, '\n')
      .replace(HTML_TAG_PATTERN, '');
    normalized = decodeHtmlEntities(normalized);
  }

  return normalized
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(MULTI_NEWLINE_PATTERN, '\n\n')
    .trim();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const extractBriefResultId = (value: unknown): number | string | null => {
  const root = toObject(value);
  if (!root) {
    return null;
  }

  const source =
    toObject(root.result) ??
    toObject(root.result_payload) ??
    toObject(root.data) ??
    root;
  const sourceResponsePayload = toObject(source.response_payload);
  const rootResponsePayload = toObject(root.response_payload);
  const sourceResultPayload = toObject(source.result_payload);
  const rootResultPayload = toObject(root.result_payload);
  const sourceDebug = toObject(source.debug);
  const rootDebug = toObject(root.debug);
  const sourceDebugPayload = toObject(source.debug_payload);
  const rootDebugPayload = toObject(root.debug_payload);
  const sourceDebugResponsePayload = toObject(sourceDebug?.response_payload);
  const rootDebugResponsePayload = toObject(rootDebug?.response_payload);
  const sourceDebugResultRaw = toObject(sourceDebugPayload?.result_raw);
  const rootDebugResultRaw = toObject(rootDebugPayload?.result_raw);
  const candidate =
    source.brief_result_id ??
    root.brief_result_id ??
    source.id ??
    root.id ??
    sourceResponsePayload?.brief_result_id ??
    rootResponsePayload?.brief_result_id ??
    sourceResultPayload?.brief_result_id ??
    rootResultPayload?.brief_result_id ??
    sourceDebugResponsePayload?.brief_result_id ??
    rootDebugResponsePayload?.brief_result_id ??
    sourceDebugResultRaw?.brief_result_id ??
    rootDebugResultRaw?.brief_result_id;

  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }

  return null;
};

const normalizeBudgetType = (value: unknown): 'FIXED' | 'HOURLY' => {
  const normalized = toString(value).toUpperCase();
  return normalized === 'HOURLY' ? 'HOURLY' : 'FIXED';
};

const extractAssistantText = (response: AiBriefBuilderResponse): string => {
  const objectResponse = toObject(response);
  const candidates = [
    response.message,
    objectResponse?.reply,
    objectResponse?.content,
    objectResponse?.summary,
    objectResponse?.text,
  ];

  for (const candidate of candidates) {
    const normalized = toString(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

const normalizeQuestions = (questions: unknown): string[] => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      if (entry && typeof entry === 'object' && 'question' in entry) {
        return toString((entry as { question?: unknown }).question);
      }
      return '';
    })
    .filter(Boolean);
};

const buildClarifyChatMessage = (baseText: string, questions: string[]): string => {
  const normalizedBase = baseText.trim();
  if (questions.length === 0) {
    return normalizedBase;
  }

  const alreadyContainsQuestions = questions.some((question) => normalizedBase.includes(question));
  if (alreadyContainsQuestions) {
    return normalizedBase;
  }

  return `${normalizedBase}\n${questions.map((question) => `• ${question}`).join('\n')}`;
};

const normalizeQuickReplies = (response: AiBriefBuilderResponse): string[] => {
  const directReplies = Array.isArray(response.quick_replies)
    ? response.quick_replies
    : [];
  const rawQuestions = (response as { questions?: unknown }).questions;
  const questionReplies = Array.isArray(rawQuestions)
    ? rawQuestions.flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return [];
      }

      const replies = (entry as { quick_replies?: unknown }).quick_replies;
      return Array.isArray(replies) ? replies : [];
    })
    : [];

  return Array.from(
    new Set(
      [...directReplies, ...questionReplies]
        .map((entry) => toString(entry))
        .filter(Boolean)
        .slice(0, 8)
    )
  );
};

const normalizeTeamStructure = (
  response: AiBriefBuilderResponse,
  briefPayload: Record<string, unknown> | null
): AiTeamStructureItem[] => {
  const directTeam = Array.isArray(response.team_structure) ? response.team_structure : [];
  const briefTeam =
    briefPayload && Array.isArray(briefPayload.team_structure)
      ? briefPayload.team_structure
      : [];
  const rawItems = (directTeam.length > 0 ? directTeam : briefTeam) as unknown[];

  return rawItems
    .map((entry) => {
      const teamItem = toObject(entry);
      if (!teamItem) {
        return null;
      }

      const role = normalizeTextForTextarea(toString(teamItem.role)).replace(/\n+/g, ' ').trim();
      if (!role) {
        return null;
      }

      const normalizedItem: AiTeamStructureItem = { role };
      const service = normalizeTextForTextarea(toString(teamItem.service))
        .replace(/\n+/g, ' ')
        .trim();
      const level = normalizeTextForTextarea(toString(teamItem.level))
        .replace(/\n+/g, ' ')
        .trim();
      const count = toNumber(teamItem.count);
      const percentage = toNumber(teamItem.percentage);
      const estimatedCost = toNumber(teamItem.estimated_cost);
      const rawServiceId = teamItem.service_id ?? teamItem.serviceId;
      const serviceId =
        typeof rawServiceId === 'string' || typeof rawServiceId === 'number'
          ? rawServiceId
          : undefined;
      const deliveryProvider = normalizeTextForTextarea(
        toString(teamItem.delivery_provider ?? teamItem.deliveryProvider)
      )
        .replace(/\n+/g, ' ')
        .trim();
      const description = normalizeTextForTextarea(toString(teamItem.description)).trim();

      if (serviceId !== undefined) {
        normalizedItem.service_id = serviceId;
      }
      if (service) {
        normalizedItem.service = service;
      }
      if (deliveryProvider) {
        normalizedItem.delivery_provider = deliveryProvider as AiTeamStructureItem['delivery_provider'];
      }
      if (description) {
        normalizedItem.description = description;
      }
      if (level) {
        normalizedItem.level = level;
      }
      if (count !== null) {
        normalizedItem.count = count;
      }
      if (percentage !== null) {
        normalizedItem.percentage = percentage;
      }
      if (estimatedCost !== null) {
        normalizedItem.estimated_cost = estimatedCost;
      }

      return normalizedItem;
    })
    .filter((entry): entry is AiTeamStructureItem => entry !== null);
};

const normalizeMilestones = (briefPayload: Record<string, unknown>): AiMilestoneItem[] => {
  if (!Array.isArray(briefPayload.milestones)) {
    return [];
  }

  return briefPayload.milestones
    .map((entry) => {
      const milestone = toObject(entry);
      if (!milestone) {
        return null;
      }

      const title = normalizeTextForTextarea(toString(milestone.title))
        .replace(/\n+/g, ' ')
        .trim();
      if (!title) {
        return null;
      }

      const normalizedMilestone: AiMilestoneItem = { title };
      const description = normalizeTextForTextarea(toString(milestone.description));
      const percentage = toNumber(milestone.percentage);
      const amount = toNumber(milestone.amount);
      const durationDays = toNumber(milestone.duration_days ?? milestone.durationDays);
      const rawServiceId = milestone.service_id ?? milestone.serviceId;
      const serviceId =
        typeof rawServiceId === 'string' || typeof rawServiceId === 'number'
          ? rawServiceId
          : undefined;
      const serviceName = normalizeTextForTextarea(
        toString(milestone.service_name ?? milestone.serviceName ?? milestone.service)
      )
        .replace(/\n+/g, ' ')
        .trim();
      const deliveryProvider = normalizeTextForTextarea(
        toString(milestone.delivery_provider ?? milestone.deliveryProvider ?? milestone.provider)
      )
        .replace(/\n+/g, ' ')
        .trim();

      if (description) {
        normalizedMilestone.description = description;
      }
      if (percentage !== null) {
        normalizedMilestone.percentage = percentage;
      }
      if (amount !== null) {
        normalizedMilestone.amount = amount;
      }
      if (durationDays !== null) {
        normalizedMilestone.duration_days = durationDays;
      }
      if (serviceId !== undefined) {
        normalizedMilestone.service_id = serviceId;
      }
      if (serviceName) {
        normalizedMilestone.service_name = serviceName;
      }
      if (deliveryProvider) {
        normalizedMilestone.delivery_provider =
          deliveryProvider as AiMilestoneItem['delivery_provider'];
      }

      return normalizedMilestone;
    })
    .filter((entry): entry is AiMilestoneItem => entry !== null);
};

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => normalizeTextForTextarea(toString(entry)))
        .map((entry) => entry.replace(/\n+/g, ' ').trim())
        .filter(Boolean)
    )
  );
};

const normalizeNumericMap = (value: unknown): Record<string, number> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const normalizedEntries = Object.entries(value).flatMap(([key, rawValue]) => {
    const amount = toNumber(rawValue);
    if (!Number.isFinite(amount)) {
      return [];
    }
    return [[key, amount]] as [string, number][];
  });

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
};

const normalizeBusinessAnalysis = (value: unknown): AiBusinessAnalysis | undefined => {
  const data = toObject(value);
  if (!data) {
    return undefined;
  }

  const problemStatement = normalizeTextForTextarea(toString(data.problem_statement));
  const targetUsers = normalizeTextForTextarea(toString(data.target_users));
  const valueProposition = normalizeTextForTextarea(toString(data.value_proposition));
  const featureBusinessValue = normalizeStringList(data.feature_business_value);

  if (
    !problemStatement &&
    !targetUsers &&
    !valueProposition &&
    featureBusinessValue.length === 0
  ) {
    return undefined;
  }

  return {
    ...(problemStatement ? { problem_statement: problemStatement } : {}),
    ...(targetUsers ? { target_users: targetUsers } : {}),
    ...(valueProposition ? { value_proposition: valueProposition } : {}),
    ...(featureBusinessValue.length > 0
      ? { feature_business_value: featureBusinessValue }
      : {}),
  };
};

const normalizeTechStack = (value: unknown): AiTechStack | undefined => {
  const data = toObject(value);
  if (!data) {
    return undefined;
  }

  const recommendedStackRaw = Array.isArray(data.recommended_stack)
    ? data.recommended_stack
    : [];
  const recommendedStack = recommendedStackRaw
    .map((entry) => {
      const stackItem = toObject(entry);
      if (!stackItem) {
        return null;
      }

      const technology = normalizeTextForTextarea(toString(stackItem.technology))
        .replace(/\n+/g, ' ')
        .trim();
      if (!technology) {
        return null;
      }

      const purpose = normalizeTextForTextarea(toString(stackItem.purpose)).trim();
      const justification = normalizeTextForTextarea(toString(stackItem.justification)).trim();

      return {
        technology,
        ...(purpose ? { purpose } : {}),
        ...(justification ? { justification } : {}),
      };
    })
    .filter(
      (
        entry
      ): entry is {
        technology: string;
        purpose?: string;
        justification?: string;
      } => entry !== null
    );

  const architectureNotes = normalizeTextForTextarea(toString(data.architecture_notes)).trim();
  if (recommendedStack.length === 0 && !architectureNotes) {
    return undefined;
  }

  return {
    ...(recommendedStack.length > 0 ? { recommended_stack: recommendedStack } : {}),
    ...(architectureNotes ? { architecture_notes: architectureNotes } : {}),
  };
};

const normalizeTeamRecommendation = (
  value: unknown
): Record<string, AiTeamRecommendationMember[]> | undefined => {
  const data = toObject(value);
  if (!data) {
    return undefined;
  }

  const normalizedEntries = Object.entries(data).flatMap(([phase, members]) => {
    if (!Array.isArray(members)) {
      return [];
    }

    const parsedMembers = members
      .map((entry) => {
        const member = toObject(entry);
        if (!member) {
          return null;
        }

        const role = normalizeTextForTextarea(toString(member.role))
          .replace(/\n+/g, ' ')
          .trim();
        if (!role) {
          return null;
        }

        const count = toNumber(member.count);
        const seniority = normalizeTextForTextarea(toString(member.seniority))
          .replace(/\n+/g, ' ')
          .trim();

        return {
          role,
          ...(count !== null ? { count } : {}),
          ...(seniority ? { seniority } : {}),
        };
      })
      .filter((entry): entry is AiTeamRecommendationMember => entry !== null);

    if (parsedMembers.length === 0) {
      return [];
    }

    return [[phase, parsedMembers]] as [string, AiTeamRecommendationMember[]][];
  });

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
};

const toHeadline = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildStructuredBriefText = ({
  technologies,
  budgetAmount,
  durationLabel,
  specificRequirements,
  teamStructure,
  milestones,
}: {
  technologies: string[];
  budgetAmount: number | null;
  durationLabel: string;
  specificRequirements: string[];
  teamStructure: AiTeamStructureItem[];
  milestones: AiMilestoneItem[];
}) => {
  const sections: string[] = [];

  if (technologies.length > 0) {
    sections.push(['Technologies:', ...technologies.map((tech) => `- ${tech}`)].join('\n'));
  }

  if (budgetAmount !== null) {
    sections.push(['Budget:', `- ${budgetAmount}`].join('\n'));
  }

  if (durationLabel) {
    sections.push(['Duration:', `- ${durationLabel}`].join('\n'));
  }

  if (specificRequirements.length > 0) {
    sections.push(
      ['Specific Requirements:', ...specificRequirements.map((item) => `- ${item}`)].join('\n')
    );
  }

  if (teamStructure.length > 0) {
    sections.push(
      [
        'Team Structure:',
        ...teamStructure.map((member) => {
          const details = [
            member.level ? `Level: ${member.level}` : '',
            member.count !== undefined ? `Count: ${member.count}` : '',
            member.estimated_cost !== undefined
              ? `Estimated Cost: ${member.estimated_cost}`
              : '',
          ].filter(Boolean);

          return details.length > 0
            ? `- ${member.role} (${details.join(', ')})`
            : `- ${member.role}`;
        }),
      ].join('\n')
    );
  }

  if (milestones.length > 0) {
    sections.push(
      [
        'Milestones:',
        ...milestones.map((milestone, index) => {
          const lines = [`${index + 1}. ${milestone.title}`];
          if (milestone.description) {
            lines.push(`   ${milestone.description}`);
          }
          const milestoneMeta = [
            milestone.percentage !== undefined ? `${milestone.percentage}%` : '',
            milestone.amount !== undefined ? `Amount: ${milestone.amount}` : '',
          ].filter(Boolean);
          if (milestoneMeta.length > 0) {
            lines.push(`   ${milestoneMeta.join(' | ')}`);
          }
          return lines.join('\n');
        }),
      ].join('\n')
    );
  }

  return sections.join('\n\n').trim();
};

const buildFormDraft = (response: AiBriefBuilderResponse): AiBriefFormDraft | null => {
  const briefPayload =
    toObject(response.final_brief) ??
    toObject(response.brief) ??
    toObject(response.result) ??
    toObject(response.data) ??
    null;
  const briefData = briefPayload ?? {};
  const fallbackBudget = toNumber((response as { estimated_budget?: unknown }).estimated_budget);
  const fallbackFinalBriefText = normalizeTextForTextarea(
    toString((response as { final_brief_text?: unknown }).final_brief_text)
  );

  const title = normalizeTextForTextarea(toString(briefData.title))
    .replace(/\n+/g, ' ')
    .trim();
  const technologies = Array.isArray(briefData.technologies)
    ? briefData.technologies
      .map((item) => normalizeTextForTextarea(toString(item)))
      .map((item) => item.replace(/\n+/g, ' ').trim())
      .filter(Boolean)
    : [];

  const budgetObject = toObject(briefData.budget);
  const budgetAmount =
    toNumber(briefData.estimated_budget) ??
    toNumber(briefData.budget) ??
    toNumber(budgetObject?.amount) ??
    fallbackBudget;
  const budgetMin = toNumber(briefData.budget_min);
  const budgetMax = toNumber(briefData.budget_max);

  const budgetType = normalizeBudgetType(briefData.budget_type ?? budgetObject?.type);
  const team_structure = normalizeTeamStructure(response, briefPayload);
  const milestones = normalizeMilestones(briefData);
  const specificRequirements = normalizeStringList(briefData.specific_requirements);
  const businessAnalysis = normalizeBusinessAnalysis(briefData.business_analysis);
  const techStack = normalizeTechStack(briefData.tech_stack);
  const technicalRisks = normalizeStringList(briefData.technical_risks);
  const complexityEstimation = normalizeNumericMap(briefData.complexity_estimation);
  const teamRecommendation = normalizeTeamRecommendation(briefData.team_recommendation);
  const complexity = normalizeNumericMap(briefData.complexity);
  const paymentPlan = normalizeTextForTextarea(toString(briefData.payment_plan))
    .replace(/\n+/g, ' ')
    .trim();
  const currency = normalizeTextForTextarea(toString(briefData.currency))
    .replace(/\n+/g, ' ')
    .trim()
    .toUpperCase();

  const durationSource =
    toString(briefData.project_duration) ||
    toString(briefData.recommended_duration) ||
    toString(briefData.duration) ||
    toString(briefData.deadline);
  const durationLabel = normalizeTextForTextarea(durationSource)
    .replace(/\n+/g, ' ')
    .trim();
  const deadline = normalizeProjectDeadlineValue(durationLabel);

  const rawDescription = normalizeTextForTextarea(toString(briefData.description));
  const baseDescription = rawDescription || fallbackFinalBriefText;
  const structuredDescription = buildStructuredBriefText({
    technologies,
    budgetAmount,
    durationLabel,
    specificRequirements,
    teamStructure: team_structure,
    milestones,
  });
  const descriptionProbe = baseDescription.toLowerCase();
  const hasStructuredBlocks = /(technolog|team|milestone|requirement|duration|buget|budget)/.test(
    descriptionProbe
  );
  const description = baseDescription
    ? !hasStructuredBlocks && structuredDescription
      ? `${baseDescription}\n\n${structuredDescription}`
      : baseDescription
    : structuredDescription;

  const hasMaterialData =
    Boolean(title) ||
    Boolean(description) ||
    Boolean(technologies.length) ||
    budgetAmount !== null ||
    budgetMin !== null ||
    budgetMax !== null ||
    Boolean(durationLabel) ||
    specificRequirements.length > 0 ||
    Boolean(businessAnalysis) ||
    Boolean(techStack) ||
    technicalRisks.length > 0 ||
    Boolean(complexityEstimation) ||
    Boolean(teamRecommendation) ||
    Boolean(complexity) ||
    team_structure.length > 0 ||
    milestones.length > 0 ||
    Boolean(paymentPlan) ||
    Boolean(currency) ||
    Boolean(fallbackFinalBriefText);

  if (!hasMaterialData) {
    return null;
  }

  return {
    title,
    description,
    budget: budgetAmount !== null ? String(budgetAmount) : '',
    budgetType,
    deadline,
    ...(durationLabel ? { durationLabel } : {}),
    ...(budgetMin !== null ? { budgetMin } : {}),
    ...(budgetMax !== null ? { budgetMax } : {}),
    ...(specificRequirements.length > 0
      ? { specific_requirements: specificRequirements }
      : {}),
    ...(businessAnalysis ? { business_analysis: businessAnalysis } : {}),
    ...(techStack ? { tech_stack: techStack } : {}),
    ...(technicalRisks.length > 0 ? { technical_risks: technicalRisks } : {}),
    ...(complexityEstimation ? { complexity_estimation: complexityEstimation } : {}),
    technologies: Array.from(new Set(technologies)),
    team_structure,
    ...(teamRecommendation ? { team_recommendation: teamRecommendation } : {}),
    ...(complexity ? { complexity } : {}),
    milestones,
    ...(paymentPlan ? { payment_plan: paymentPlan } : {}),
    ...(currency ? { currency } : {}),
    ...(fallbackFinalBriefText ? { final_brief_text: fallbackFinalBriefText } : {}),
    ...(response.recommended_providers ? { recommended_providers: response.recommended_providers } : {}),
    ...(response.other_providers ? { other_providers: response.other_providers } : {}),
    ...(response.other_providers_by_service
      ? { other_providers_by_service: response.other_providers_by_service }
      : {}),
  };
};

const AI_BRIEF_GENERATED_EVENT_NAMES = [
  '.AiBriefGenerated',
  'AiBriefGenerated',
  '.App\\Events\\AiBriefGenerated',
  'App\\Events\\AiBriefGenerated',
] as const;

const AI_BRIEF_FAILED_EVENT_NAMES = [
  '.AiBriefFailed',
  'AiBriefFailed',
  '.App\\Events\\AiBriefFailed',
  'App\\Events\\AiBriefFailed',
] as const;

const AI_BRIEF_FIELD_KEYS = new Set([
  'title',
  'description',
  'budget',
  'budget_min',
  'budget_max',
  'budget_type',
  'technologies',
  'specific_requirements',
  'business_analysis',
  'tech_stack',
  'technical_risks',
  'complexity_estimation',
  'team_structure',
  'team_recommendation',
  'complexity',
  'milestones',
  'recommended_duration',
  'project_duration',
  'duration',
  'payment_plan',
  'currency',
  'final_brief_text',
  'recommended_providers',
  'other_providers',
  'other_providers_by_service',
  'payload_truncated',
  'payload_trimmed_sections',
]);

const toBriefStatus = (value: unknown): AiBriefBuilderStatus | null => {
  const normalized = toString(value).toUpperCase();
  if (normalized === 'FINAL') {
    return 'FINAL';
  }
  if (normalized === 'CLARIFY') {
    return 'CLARIFY';
  }
  if (normalized === 'PROCESSING') {
    return 'PROCESSING';
  }
  return null;
};

const toStructuredBrief = (value: unknown): AiStructuredBrief | null => {
  const data = toObject(value);
  if (!data) {
    return null;
  }

  const hasBriefFields = Object.keys(data).some((key) => AI_BRIEF_FIELD_KEYS.has(key));
  if (!hasBriefFields) {
    return null;
  }

  return data as AiStructuredBrief;
};

const normalizeBriefGeneratedPayload = (payload: unknown): AiBriefBuilderResponse | null => {
  const root = toObject(payload);
  if (!root) {
    return null;
  }

  const nestedResult =
    toObject(root.result) ??
    toObject(root.result_payload) ??
    toObject(root.data);
  const source = nestedResult ?? root;
  const status = toBriefStatus(source.status ?? root.status);
  const rawQuestions = source.questions ?? root.questions;
  const hasQuestions = Array.isArray(rawQuestions);
  const payloadTruncated = Boolean(source.payload_truncated ?? root.payload_truncated);
  const payloadTrimmedSource = source.payload_trimmed_sections ?? root.payload_trimmed_sections;
  const payloadTrimmedSections = Array.isArray(payloadTrimmedSource)
    ? payloadTrimmedSource.map((entry) => toString(entry)).filter(Boolean)
    : [];

  const finalBrief =
    toStructuredBrief(source.final_brief) ??
    toStructuredBrief(root.final_brief) ??
    toStructuredBrief(source.brief) ??
    toStructuredBrief(root.brief) ??
    toStructuredBrief(source.data) ??
    toStructuredBrief(source.result) ??
    (status === 'FINAL' ? toStructuredBrief(source) : null);

  if (!status && !hasQuestions && !finalBrief && !payloadTruncated && payloadTrimmedSections.length === 0) {
    return null;
  }

  const message =
    toString(source.message) ||
    toString(root.message) ||
    toString(source.summary) ||
    toString(root.summary) ||
    '';
  const summary = toString(source.summary) || toString(root.summary) || '';
  const finalBriefText =
    toString(source.final_brief_text) || toString(root.final_brief_text) || '';

  const quickRepliesRaw =
    (Array.isArray(source.quick_replies) ? source.quick_replies : null) ??
    (Array.isArray(root.quick_replies) ? root.quick_replies : null);
  const quickReplies = quickRepliesRaw
    ? quickRepliesRaw.map((entry) => toString(entry)).filter(Boolean)
    : [];

  const teamStructureRaw =
    (Array.isArray(source.team_structure) ? source.team_structure : null) ??
    (Array.isArray(root.team_structure) ? root.team_structure : null);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const recommendedProviders = (source.recommended_providers ?? root.recommended_providers) as any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const otherProviders = (source.other_providers ?? root.other_providers) as any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const otherProvidersByService = (source.other_providers_by_service ?? root.other_providers_by_service) as any;
  const briefResultId = extractBriefResultId(payload);

  return {
    status: status ?? (finalBrief ? 'FINAL' : 'CLARIFY'),
    ...(briefResultId !== null ? { brief_result_id: briefResultId } : {}),
    questions: hasQuestions ? (rawQuestions as string[]) : [],
    final_brief: finalBrief,
    ...(message ? { message } : {}),
    ...(quickReplies.length > 0 ? { quick_replies: quickReplies } : {}),
    ...(summary ? { summary } : {}),
    ...(finalBriefText ? { final_brief_text: finalBriefText } : {}),
    ...(teamStructureRaw ? { team_structure: teamStructureRaw as AiTeamStructureItem[] } : {}),
    ...(recommendedProviders ? { recommended_providers: recommendedProviders } : {}),
    ...(otherProviders ? { other_providers: otherProviders } : {}),
    ...(otherProvidersByService ? { other_providers_by_service: otherProvidersByService } : {}),
    ...(payloadTruncated ? { payload_truncated: true } : {}),
    ...(payloadTrimmedSections.length > 0 ? { payload_trimmed_sections: payloadTrimmedSections } : {}),
  };
};

const extractBriefFailureMessage = (payload: unknown): string => {
  const data = toObject(payload);
  if (!data) {
    return '';
  }

  return (
    toString(data.errorMessage) ||
    toString(data.error_message) ||
    toString(data.message) ||
    toString(data.error)
  );
};

function TechnicalDraftSkeleton() {
  return (
    <Card className="border-dashed border-slate-300/90 bg-white/90 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-20" />
          <motion.div
            className="h-3 w-[2px] bg-emerald-500"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-10/12" />
        <Skeleton className="h-3 w-9/12" />
        <Skeleton className="h-3 w-7/12" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BriefCopilot({
  locale,
  className,
  availableServices,
  onApply,
}: BriefCopilotProps) {
  const t = useTranslations();
  const { user } = useAuth();

  const welcomeMessage = t('client.project_requests.brief_copilot.welcome');
  const [conversation, setConversation] = useState<AiAssistantMessage[]>([
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    { role: 'assistant', content: welcomeMessage },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'assistant', content: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [finalDraft, setFinalDraft] = useState<AiBriefFormDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payloadTruncated, setPayloadTruncated] = useState(false);
  const [payloadTrimmedSections, setPayloadTrimmedSections] = useState<string[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const briefSubscriptionRef = useRef<{
    echo: BriefEchoInstance;
    channelName: string;
    channel: BriefEchoChannel;
    requestId: number;
  } | null>(null);
  const requestCounterRef = useRef(0);

  const cleanupBriefSubscription = useCallback(() => {
    const activeSubscription = briefSubscriptionRef.current;
    if (!activeSubscription) {
      return;
    }

    AI_BRIEF_GENERATED_EVENT_NAMES.forEach((eventName) => {
      activeSubscription.channel.stopListening(eventName);
    });
    AI_BRIEF_FAILED_EVENT_NAMES.forEach((eventName) => {
      activeSubscription.channel.stopListening(eventName);
    });

    activeSubscription.echo.leave(activeSubscription.channelName);
    const privateChannelName = `private-${activeSubscription.channelName}`;
    const echoWithLeaveChannel = activeSubscription.echo as BriefEchoInstance & {
      leaveChannel?: (channelName: string) => void;
    };
    if (typeof echoWithLeaveChannel.leaveChannel === 'function') {
      echoWithLeaveChannel.leaveChannel(privateChannelName);
    }

    briefSubscriptionRef.current = null;
  }, []);

  const applyAssistantResponse = useCallback(
    (response: AiBriefBuilderResponse) => {
      const status = toBriefStatus(response.status) ?? (response.final_brief ? 'FINAL' : 'CLARIFY');
      setPayloadTruncated(Boolean(response.payload_truncated));
      setPayloadTrimmedSections(response.payload_trimmed_sections ?? []);
      const clarifyQuestions = normalizeQuestions(
        (response as { questions?: unknown }).questions ?? response.questions
      );
      const baseAssistantText =
        extractAssistantText(response) ||
        (status === 'FINAL'
          ? t('client.project_requests.brief_copilot.final_ready')
          : t('client.project_requests.brief_copilot.clarify_ready'));
      const assistantText =
        status === 'CLARIFY'
          ? buildClarifyChatMessage(baseAssistantText, clarifyQuestions)
          : baseAssistantText;

      if (assistantText) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantText,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setConversation((prev) => [...prev, { role: 'assistant', content: assistantText }]);
      }

      if (status === 'CLARIFY') {
        setFinalDraft(null);
        setQuickReplies(normalizeQuickReplies(response));
        return;
      }

      setQuickReplies([]);
      setFinalDraft(buildFormDraft(response));
    },
    [t]
  );

  const fetchBriefResultById = useCallback(async (briefResultId: number | string) => {
    const payload = await aiService.getFinalBriefResult(briefResultId);
    return normalizeBriefGeneratedPayload(payload);
  }, []);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  useEffect(
    () => () => {
      cleanupBriefSubscription();
    },
    [cleanupBriefSubscription]
  );

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const normalizedContent = rawContent.trim();
      if (!normalizedContent || isLoading) {
        return;
      }

      const userId = String(user?.id ?? '').trim();
      if (!userId) {
        setError(t('client.project_requests.brief_copilot.errors.generic'));
        return;
      }

      setIsLoading(true);
      setError(null);
      setInput('');
      setPayloadTruncated(false);
      setPayloadTrimmedSections([]);

      const nextUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: normalizedContent,
      };
      const nextConversation: AiAssistantMessage[] = [
        ...conversation,
        { role: 'user', content: normalizedContent },
      ];

      setMessages((prev) => [...prev, nextUserMessage]);
      setConversation(nextConversation);
      setQuickReplies([]);

      cleanupBriefSubscription();
      const echo = await ensureEcho();
      if (!echo) {
        setIsLoading(false);
        setError(t('client.project_requests.brief_copilot.errors.generic'));
        return;
      }

      const requestId = requestCounterRef.current + 1;
      requestCounterRef.current = requestId;
      const channelName = `user.${userId}.briefs`;
      const channel = echo.private(channelName);
      briefSubscriptionRef.current = {
        echo,
        channelName,
        channel,
        requestId,
      };

      const completePendingRequest = () => {
        if (briefSubscriptionRef.current?.requestId !== requestId) {
          return;
        }

        setIsLoading(false);
        cleanupBriefSubscription();
      };

      const handleGenerated = (payload: unknown) => {
        if (briefSubscriptionRef.current?.requestId !== requestId) {
          return;
        }

        const response = normalizeBriefGeneratedPayload(payload);
        if (response) {
          applyAssistantResponse(response);
          completePendingRequest();
          return;
        }

        const briefResultId = extractBriefResultId(payload);
        if (briefResultId === null) {
          setError(t('client.project_requests.brief_copilot.errors.generic'));
          completePendingRequest();
          return;
        }

        void (async () => {
          try {
            const persistedResponse = await fetchBriefResultById(briefResultId);
            if (!persistedResponse) {
              setError(t('client.project_requests.brief_copilot.errors.generic'));
              return;
            }

            if (briefSubscriptionRef.current?.requestId !== requestId) {
              return;
            }

            applyAssistantResponse(persistedResponse);
          } catch (cause) {
            if (cause instanceof FetchError) {
              setError(cause.message);
            } else if (cause instanceof Error) {
              setError(cause.message);
            } else {
              setError(t('client.project_requests.brief_copilot.errors.generic'));
            }
          } finally {
            completePendingRequest();
          }
        })();
      };

      const handleFailed = (payload: unknown) => {
        if (briefSubscriptionRef.current?.requestId !== requestId) {
          return;
        }

        const failedMessage =
          extractBriefFailureMessage(payload) || t('client.project_requests.brief_copilot.errors.generic');
        setError(failedMessage);
        completePendingRequest();
      };

      AI_BRIEF_GENERATED_EVENT_NAMES.forEach((eventName) => {
        channel.listen(eventName, handleGenerated);
      });
      AI_BRIEF_FAILED_EVENT_NAMES.forEach((eventName) => {
        channel.listen(eventName, handleFailed);
      });

      try {
        const immediatePayload = (await fetchClient.buildBrief(
          nextConversation,
          locale,
          availableServices
        )) as unknown;
        const immediateResponse = normalizeBriefGeneratedPayload(immediatePayload);

        if (immediateResponse && briefSubscriptionRef.current?.requestId === requestId) {
          applyAssistantResponse(immediateResponse);
          completePendingRequest();
          return;
        }

        const immediateBriefResultId = extractBriefResultId(immediatePayload);
        if (immediateBriefResultId !== null && briefSubscriptionRef.current?.requestId === requestId) {
          try {
            const persistedResponse = await fetchBriefResultById(immediateBriefResultId);
            if (persistedResponse && briefSubscriptionRef.current?.requestId === requestId) {
              applyAssistantResponse(persistedResponse);
              completePendingRequest();
            }
          } catch {
            // Ignore here and keep websocket as fallback path.
          }
        }
      } catch (cause) {
        if (briefSubscriptionRef.current?.requestId !== requestId) {
          return;
        }

        if (cause instanceof FetchError) {
          setError(cause.message);
        } else if (cause instanceof Error) {
          setError(cause.message);
        } else {
          setError(t('client.project_requests.brief_copilot.errors.generic'));
        }

        completePendingRequest();
      }
    },
    [
      applyAssistantResponse,
      availableServices,
      cleanupBriefSubscription,
      conversation,
      fetchBriefResultById,
      isLoading,
      locale,
      t,
      user?.id,
    ]
  );

  const submitDisabled = useMemo(() => isLoading || input.trim().length === 0, [input, isLoading]);
  const teamPreview = finalDraft?.team_structure ?? [];
  const milestonesPreview = finalDraft?.milestones ?? [];
  const specificRequirements = finalDraft?.specific_requirements ?? [];
  const businessAnalysis = finalDraft?.business_analysis;
  const recommendedStack = finalDraft?.tech_stack?.recommended_stack ?? [];
  const architectureNotes = finalDraft?.tech_stack?.architecture_notes ?? '';
  const technicalRisks = finalDraft?.technical_risks ?? [];
  const complexityEstimationEntries = Object.entries(finalDraft?.complexity_estimation ?? {});
  const complexityEntries = Object.entries(finalDraft?.complexity ?? {});
  const teamRecommendationEntries = Object.entries(finalDraft?.team_recommendation ?? {});

  return (
    <Card className={cn('border-transparent shadow-sm', className)}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          {t('client.project_requests.brief_copilot.title')}
        </CardTitle>
        <CardDescription>{t('client.project_requests.brief_copilot.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={chatScrollRef}
          className="max-h-[360px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/60"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  'max-w-[92%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'assistant'
                    ? 'border border-slate-200 bg-white text-slate-700 dark:border-[#1E2A3D] dark:bg-[#0F1827] dark:text-[#C9D4E7]'
                    : 'ml-auto bg-emerald-600 text-white'
                )}
              >
                {message.role === 'assistant' ? (
                  <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    <Bot className="h-3.5 w-3.5" />
                    {t('client.project_requests.brief_copilot.assistant_name')}
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading ? <TechnicalDraftSkeleton /> : null}
        </div>

        {quickReplies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => void sendMessage(reply)}
                disabled={isLoading}
              >
                {reply}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder={t('client.project_requests.brief_copilot.input_placeholder')}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={submitDisabled}
              className="inline-flex items-center gap-2"
            >
              <SendHorizontal className="h-4 w-4" />
              {t('client.project_requests.brief_copilot.send')}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {payloadTruncated ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p>Payload-ul răspunsului a fost compactat pentru limita de broadcast (10KB).</p>
            {payloadTrimmedSections.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs">
                {payloadTrimmedSections.map((section, index) => (
                  <li key={`${section}-${index}`}>• {section}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {finalDraft ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <div>
              <h4 className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('client.project_requests.brief_copilot.summary_title')}
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                {finalDraft.title || t('client.project_requests.brief_copilot.summary_title_empty')}
              </p>
              {finalDraft.description ? (
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {finalDraft.description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.summary_budget')}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {finalDraft.budget ? <PriceDisplay value={Number(finalDraft.budget)} /> : '—'}
                  <span className="ml-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                    ({finalDraft.budgetType})
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.summary_technologies')}
                </div>
                <div className="mt-1 text-sm text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {finalDraft.technologies.length > 0
                    ? finalDraft.technologies.join(', ')
                    : t('client.project_requests.brief_copilot.summary_technologies_empty')}
                </div>
              </div>

              {finalDraft.durationLabel ? (
                <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                    {t('client.project_requests.brief_copilot.summary_duration')}
                  </div>
                  <div className="mt-1 text-sm text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {finalDraft.durationLabel}
                  </div>
                </div>
              ) : null}

              {finalDraft.budgetMin !== undefined || finalDraft.budgetMax !== undefined ? (
                <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                    {t('client.project_requests.brief_copilot.summary_budget_range')}
                  </div>
                  <div className="mt-1 text-sm text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {finalDraft.budgetMin !== undefined ? (
                      <PriceDisplay value={finalDraft.budgetMin} />
                    ) : (
                      '—'
                    )}
                    {' - '}
                    {finalDraft.budgetMax !== undefined ? (
                      <PriceDisplay value={finalDraft.budgetMax} />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              ) : null}

              {finalDraft.payment_plan || finalDraft.currency ? (
                <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                    {t('client.project_requests.brief_copilot.summary_payment_meta')}
                  </div>
                  <div className="mt-1 text-sm text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {finalDraft.payment_plan || '—'}
                    {finalDraft.currency ? ` • ${finalDraft.currency}` : ''}
                  </div>
                </div>
              ) : null}
            </div>

            {specificRequirements.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_specific_requirements')}
                </div>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {specificRequirements.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {businessAnalysis ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_business_analysis')}
                </div>
                {businessAnalysis.problem_statement ? (
                  <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                    <span className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('client.project_requests.brief_copilot.business_problem_statement')}:
                    </span>{' '}
                    {businessAnalysis.problem_statement}
                  </p>
                ) : null}
                {businessAnalysis.target_users ? (
                  <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                    <span className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('client.project_requests.brief_copilot.business_target_users')}:
                    </span>{' '}
                    {businessAnalysis.target_users}
                  </p>
                ) : null}
                {businessAnalysis.value_proposition ? (
                  <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                    <span className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('client.project_requests.brief_copilot.business_value_proposition')}:
                    </span>{' '}
                    {businessAnalysis.value_proposition}
                  </p>
                ) : null}
                {(businessAnalysis.feature_business_value ?? []).length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('client.project_requests.brief_copilot.business_feature_business_value')}
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                      {businessAnalysis.feature_business_value?.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {recommendedStack.length > 0 || architectureNotes ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_tech_stack')}
                </div>
                {recommendedStack.length > 0 ? (
                  <div className="space-y-2">
                    {recommendedStack.map((item, index) => (
                      <div
                        key={`${item.technology}-${index}`}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                      >
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {item.technology}
                        </div>
                        {item.purpose ? (
                          <p className="mt-1 text-slate-600 dark:text-[#A3ADC2]">
                            {item.purpose}
                          </p>
                        ) : null}
                        {item.justification ? (
                          <p className="mt-1 text-slate-500 dark:text-[#8FA0B8]">
                            {item.justification}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {architectureNotes ? (
                  <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                    <span className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('client.project_requests.brief_copilot.tech_architecture_notes')}:
                    </span>{' '}
                    {architectureNotes}
                  </p>
                ) : null}
              </div>
            ) : null}

            {technicalRisks.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_technical_risks')}
                </div>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {technicalRisks.map((risk) => (
                    <li key={risk}>• {risk}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {complexityEstimationEntries.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_complexity_estimation')}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {complexityEstimationEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                    >
                      <div className="text-slate-500 dark:text-[#8FA0B8]">{toHeadline(key)}</div>
                      <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {complexityEntries.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_complexity')}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {complexityEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                    >
                      <div className="text-slate-500 dark:text-[#8FA0B8]">{toHeadline(key)}</div>
                      <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {teamPreview.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.team_title')}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {teamPreview.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0F1827]"
                    >
                      <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {item.role}
                        {item.count ? ` × ${item.count}` : ''}
                      </div>
                      {item.level ? (
                        <div className="text-slate-500 dark:text-[#8FA0B8]">
                          {t('client.project_requests.brief_copilot.team_level', { level: item.level })}
                        </div>
                      ) : null}
                      {item.estimated_cost !== undefined ? (
                        <div className="mt-1 text-emerald-700 dark:text-emerald-300">
                          <PriceDisplay value={item.estimated_cost} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {teamRecommendationEntries.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_team_recommendation')}
                </div>
                <div className="space-y-2">
                  {teamRecommendationEntries.map(([phase, members]) => (
                    <div key={phase}>
                      <div className="text-xs font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {toHeadline(phase)}
                      </div>
                      <ul className="mt-1 space-y-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                        {members.map((member, index) => (
                          <li key={`${phase}-${member.role}-${index}`}>
                            • {member.role}
                            {member.count ? ` × ${member.count}` : ''}
                            {member.seniority ? ` (${member.seniority})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {milestonesPreview.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_milestones')}
                </div>
                <div className="space-y-2">
                  {milestonesPreview.map((milestone, index) => (
                    <div
                      key={`${milestone.title}-${index}`}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                    >
                      <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {index + 1}. {milestone.title}
                      </div>
                      {milestone.description ? (
                        <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-[#A3ADC2]">
                          {milestone.description}
                        </p>
                      ) : null}
                      {milestone.percentage !== undefined || milestone.amount !== undefined ? (
                        <div className="mt-1 text-slate-500 dark:text-[#8FA0B8]">
                          {milestone.percentage !== undefined ? `${milestone.percentage}%` : ''}
                          {milestone.percentage !== undefined && milestone.amount !== undefined
                            ? ' • '
                            : ''}
                          {milestone.amount !== undefined ? (
                            <PriceDisplay value={milestone.amount} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {finalDraft.final_brief_text ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.section_final_brief_text')}
                </div>
                <p className="whitespace-pre-wrap text-xs text-slate-600 dark:text-[#A3ADC2]">
                  {finalDraft.final_brief_text}
                </p>
              </div>
            ) : null}

            <Button type="button" onClick={() => onApply(finalDraft)} className="w-full">
              {t('client.project_requests.brief_copilot.apply_to_form')}
            </Button>
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  );
}

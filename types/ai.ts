import type { DeliveryProvider } from './projects';

export type AiAssistantMessageRole = 'system' | 'user' | 'assistant';

export interface AiAssistantMessage {
  role: AiAssistantMessageRole;
  content: string;
}

export interface AiBriefProjectLineMilestone {
  title: string;
  description?: string;
  percentage?: number;
  amount: number;
  duration_days?: number;
  assigned_provider_id?: number | null;
  provider_id?: number | null;
  providerId?: number | null;
  assigned_provider?: {
    id: number | string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string | null;
    rating?: number | null;
    pivot_type?: string | null;
    provider_response?: string | null;
    client_budget_approved?: string | null;
    allocated_budget?: number | null;
    proposed_budget?: number | null;
    [key: string]: unknown;
  } | null;
}

export interface AiBriefProjectLine {
  service_name: string;
  delivery_provider: DeliveryProvider;
  description: string;
  budget_percentage: number;
  milestones: AiBriefProjectLineMilestone[];
}

export interface AiBriefFinalBrief {
  title: string;
  project_lines: AiBriefProjectLine[];
  description?: string;
  overview?: string;
  client_goal?: string;
  target_audience?: string;
  technologies?: string[];
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  business_analysis?: AiBusinessAnalysis;
  technical_risks?: string[];
  complexity_estimation?: Record<string, number>;
  specific_requirements?: string[];
  team_structure?: AiTeamStructureItem[];
  milestones?: AiMilestoneItem[];
  duration?: string;
  recommended_duration?: string;
  project_duration?: string;
  payment_plan?: string;
  currency?: string;
}

export interface AiBriefResponse {
  status: 'PROCESSING' | 'CLARIFY' | 'FINAL';
  id?: number | string;
  brief_result_id?: number | string;
  channel?: string;
  locale?: string;
  messages?: AiAssistantMessage[];
  questions?: string[];
  final_brief?: AiBriefFinalBrief;
  final_brief_modular?: AiBriefFinalBrief;
  final_brief_full?: AiStructuredBrief;
  final_brief_text?: string;
  recommended_providers?: AiBriefRecommendedProviders;
  other_providers?: AiBriefOtherProviders;
  other_providers_by_service?: AiBriefOtherProvidersByService;
  payload_truncated?: boolean;
  payload_trimmed_sections?: string[];
}

export interface AiBriefBuilderResultEnvelope {
  id?: number | string;
  status?: AiBriefBuilderStatus | string;
  channel?: string;
  locale?: string;
  messages?: AiAssistantMessage[];
  result?: AiBriefResponse | AiBriefBuilderResponse | Record<string, unknown>;
  debug?: Record<string, unknown>;
  [key: string]: unknown;
}

export type AiBriefBuilderStatus = 'PROCESSING' | 'CLARIFY' | 'FINAL';

export interface AiTeamStructureItem {
  role: string;
  service?: string;
  level?: string;
  count?: number;
  estimated_cost?: number;
}

export interface AiMilestoneItem {
  title: string;
  description?: string;
  percentage?: number;
  amount?: number;
  duration_days?: number;
}

export interface AiBusinessAnalysis {
  problem_statement?: string;
  target_users?: string[] | string;
  value_proposition?: string;
  feature_business_value?: string[];
}

export interface AiTechStackItem {
  technology: string;
  purpose?: string;
  justification?: string;
}

export interface AiTechStack {
  recommended_stack?: AiTechStackItem[];
  architecture_notes?: string;
}

export interface AiTeamRecommendationMember {
  role: string;
  count?: number;
  seniority?: string;
}

export interface AiStructuredBrief {
  title?: string;
  description?: string;
  overview?: string;
  client_goal?: string;
  target_audience?: string;
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  budget_type?: 'FIXED' | 'HOURLY' | 'MILESTONE' | string;
  technologies?: string[];
  specific_requirements?: string[];
  business_analysis?: AiBusinessAnalysis;
  tech_stack?: AiTechStack;
  technical_risks?: string[];
  complexity_estimation?: Record<string, number>;
  team_structure?: AiTeamStructureItem[];
  team_recommendation?: Record<string, AiTeamRecommendationMember[]>;
  complexity?: Record<string, number>;
  milestones?: AiMilestoneItem[];
  recommended_duration?: string;
  project_duration?: string;
  duration?: string;
  payment_plan?: string;
  currency?: string;
  project_lines?: AiBriefProjectLine[];
  selected_providers?: AiBriefProvider[];
}

export interface AiBriefAvailableService {
  service_name?: string;
  score?: number;
  service_id?: number | string;
  [key: string]: unknown;
}

export interface AiBriefBuilderRequestBody {
  locale?: string;
  messages: AiAssistantMessage[];
  available_services?: AiBriefAvailableService[];
}

export interface AiBriefProvider {
  id: number;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  matchScore?: number;
  matchReasons?: string[];
  [key: string]: unknown;
}

export interface AiBriefRecommendedProviders {
  [serviceName: string]: AiBriefProvider[];
}

export interface AiBriefOtherProviders {
  current_page?: number;
  data?: AiBriefProvider[];
  first_page_url?: string;
  from?: number | null;
  last_page?: number;
  last_page_url?: string;
  links?: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number | null;
  total?: number;
}

export interface AiBriefOtherProvidersByServiceEntry {
  service_id?: number | string;
  service_name: string;
  providers: AiBriefOtherProviders;
}

export type AiBriefOtherProvidersByService = AiBriefOtherProvidersByServiceEntry[];

export interface AiBriefBuilderResponse {
  status: AiBriefBuilderStatus;
  questions: string[];
  final_brief: AiStructuredBrief | AiBriefFinalBrief | null;
  brief_result_id?: number | string;
  channel?: string;
  final_brief_modular?: AiBriefFinalBrief;
  final_brief_full?: AiStructuredBrief;
  final_brief_text?: string;
  recommended_providers?: AiBriefRecommendedProviders;
  other_providers?: AiBriefOtherProviders;
  other_providers_by_service?: AiBriefOtherProvidersByService;
  payload_truncated?: boolean;
  payload_trimmed_sections?: string[];

  // Backward-compatibility (older backend variants)
  message?: string;
  quick_replies?: string[];
  summary?: string;
  brief?: AiStructuredBrief;
  data?: AiStructuredBrief;
  result?: AiStructuredBrief;
  team_structure?: AiTeamStructureItem[];
}

export interface AiMatchRequestPayload {
  brief: string;
  limit?: number;
  category_id?: number | string;
}

export interface AiBriefFormDraft {
  title: string;
  description: string;
  budget: string;
  budgetType: 'FIXED' | 'HOURLY';
  deadline: string;
  durationLabel?: string;
  budgetMin?: number;
  budgetMax?: number;
  specific_requirements?: string[];
  business_analysis?: AiBusinessAnalysis;
  tech_stack?: AiTechStack;
  technical_risks?: string[];
  complexity_estimation?: Record<string, number>;
  technologies: string[];
  team_structure?: AiTeamStructureItem[];
  team_recommendation?: Record<string, AiTeamRecommendationMember[]>;
  complexity?: Record<string, number>;
  milestones?: AiMilestoneItem[];
  payment_plan?: string;
  currency?: string;
  final_brief_text?: string;
  recommended_providers?: AiBriefRecommendedProviders;
  other_providers?: AiBriefOtherProviders;
  other_providers_by_service?: AiBriefOtherProvidersByService;
  payload_truncated?: boolean;
  payload_trimmed_sections?: string[];
  selected_providers?: AiBriefProvider[];
}

export const AI_BRIEF_DRAFT_STORAGE_KEY = 'trustora:ai-brief-draft';

const DEADLINE_DIRECT_MAP: Record<string, string> = {
  '1day': '1day',
  'day': '1day',
  '24h': '1day',
  '24hours': '1day',
  '1week': '1week',
  'week': '1week',
  '7days': '1week',
  '2weeks': '2weeks',
  '14days': '2weeks',
  '3weeks': '3weeks',
  '21days': '3weeks',
  '1month': '1month',
  'month': '1month',
  '30days': '1month',
  '3months': '3months',
  '90days': '3months',
  '6months': '6months',
  '180days': '6months',
  '1year': '1year',
  'year': '1year',
  '12months': '1year',
  '1plusyear': '1plusyear',
  'over1year': '1plusyear',
  'morethan1year': '1plusyear',
  'above1year': '1plusyear',
};

export const normalizeProjectDeadlineValue = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const raw = value.trim().toLowerCase();
  if (!raw) {
    return '';
  }

  if (
    /(?:\+|over|above|more\s*than|greater\s*than)\s*1?\s*year/.test(raw) ||
    />\s*1\s*year/.test(raw)
  ) {
    return '1plusyear';
  }

  const token = raw.replace(/[^a-z0-9]/g, '');
  if (!token) {
    return '';
  }

  if (DEADLINE_DIRECT_MAP[token]) {
    return DEADLINE_DIRECT_MAP[token];
  }

  const match = token.match(/^(\d+)(day|days|week|weeks|month|months|year|years)$/);
  if (!match) {
    return '';
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (amount === 1 && (unit === 'day' || unit === 'days')) return '1day';
  if (amount === 1 && (unit === 'week' || unit === 'weeks')) return '1week';
  if (amount === 2 && (unit === 'week' || unit === 'weeks')) return '2weeks';
  if (amount === 3 && (unit === 'week' || unit === 'weeks')) return '3weeks';
  if (amount === 1 && (unit === 'month' || unit === 'months')) return '1month';
  if (amount === 3 && (unit === 'month' || unit === 'months')) return '3months';
  if (amount === 6 && (unit === 'month' || unit === 'months')) return '6months';
  if (amount === 1 && (unit === 'year' || unit === 'years')) return '1year';
  if (amount > 1 && (unit === 'year' || unit === 'years')) return '1plusyear';

  return '';
};

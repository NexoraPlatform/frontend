export type AiAssistantMessageRole = 'system' | 'user' | 'assistant';

export interface AiAssistantMessage {
  role: AiAssistantMessageRole;
  content: string;
}

export type AiBriefBuilderStatus = 'CLARIFY' | 'FINAL';

export interface AiBriefQuestion {
  question: string;
  quick_replies?: string[];
}

export interface AiTeamStructureItem {
  role: string;
  service?: string;
  level?: string;
  count?: number;
  estimated_cost?: number;
}

export interface AiBudgetSuggestion {
  amount?: number;
  type?: 'FIXED' | 'HOURLY' | 'MILESTONE' | string;
  currency?: string;
}

export interface AiStructuredBrief {
  title?: string;
  description?: string;
  budget?: AiBudgetSuggestion | number;
  budget_type?: 'FIXED' | 'HOURLY' | 'MILESTONE' | string;
  estimated_budget?: number;
  technologies?: string[];
  team_structure?: AiTeamStructureItem[];
}

export interface AiBriefBuilderResponse {
  status: AiBriefBuilderStatus;
  message?: string;
  questions?: AiBriefQuestion[] | string[];
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
  technologies: string[];
  team_structure?: AiTeamStructureItem[];
}

export const AI_BRIEF_DRAFT_STORAGE_KEY = 'trustora:ai-brief-draft';

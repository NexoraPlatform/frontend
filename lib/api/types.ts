export type RoleLite = {
  id: number;
  name: string;
  slug: string;
};

export type AuthApiResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: any;
  roles?: any[];
  permissions?: string[];
};

export type ChatPagination = {
  current_page: number;
  per_page: number;
  total?: number;
  last_page: number;
  has_more_pages?: boolean;
};

export type ChatGroupsResponse = {
  groups: any[];
  pagination: ChatPagination | null;
};

export type ChatMessagesResponse = {
  messages: any[];
  total?: number;
  hasMore?: boolean;
  pagination: ChatPagination | null;
};

export type LegalClauseContent = Record<string, string>;

export type LegalClause = {
  id: number;
  identifier: string;
  category: string;
  content: LegalClauseContent;
  created_at: string;
  updated_at: string;
};

export type AdminServiceCategoryContractType =
  | 'SERVICES'
  | 'WORK_FOR_RESULT'
  | 'MIXED';

export type AdminServiceCategorySortField =
  | 'service_code'
  | 'service_name'
  | 'service_group'
  | 'sort_order'
  | 'created_at'
  | 'updated_at';

export type AdminServiceCategory = {
  id: number | null;
  service_code: string;
  service_name: string;
  service_group: string;
  description: string;
  default_contract_type: AdminServiceCategoryContractType;
  milestone_recommended: boolean;
  acceptance_testing_required: boolean;
  delivery_spec_required: boolean;
  ip_transfer_expected: boolean;
  background_ip_expected: boolean;
  open_source_risk: boolean;
  third_party_material_risk: boolean;
  moral_rights_sensitive: boolean;
  nda_recommended: boolean;
  dpa_required_by_default: boolean;
  personal_data_processing_likely: boolean;
  security_clause_required: boolean;
  warranty_period_days: number | null;
  bug_fix_period_days: number | null;
  service_levels_required: boolean;
  professional_standards_clause_required: boolean;
  regulated_activity_risk: boolean;
  export_control_risk: boolean;
  default_acceptance_rule: string;
  default_delivery_definition: string;
  internal_legal_note: string;
  is_active: boolean;
  sort_order: number;
  version: number | null;
  created_at: string | null;
  updated_at: string | null;
  code: string;
  name: string;
  group: string;
  requires_ip_assignment: boolean;
};

export type AdminServiceCategoryPayload = Pick<
  AdminServiceCategory,
  | 'service_code'
  | 'service_name'
  | 'service_group'
  | 'description'
  | 'default_contract_type'
  | 'milestone_recommended'
  | 'acceptance_testing_required'
  | 'delivery_spec_required'
  | 'ip_transfer_expected'
  | 'background_ip_expected'
  | 'open_source_risk'
  | 'third_party_material_risk'
  | 'moral_rights_sensitive'
  | 'nda_recommended'
  | 'dpa_required_by_default'
  | 'personal_data_processing_likely'
  | 'security_clause_required'
  | 'warranty_period_days'
  | 'bug_fix_period_days'
  | 'service_levels_required'
  | 'professional_standards_clause_required'
  | 'regulated_activity_risk'
  | 'export_control_risk'
  | 'default_acceptance_rule'
  | 'default_delivery_definition'
  | 'internal_legal_note'
  | 'is_active'
  | 'sort_order'
  | 'version'
>;

export type AdminServiceCategoryListResponse = {
  current_page: number;
  data: AdminServiceCategory[];
  last_page: number;
  per_page: number;
  total: number;
};

export type MilestoneEntry = {
  title: string;
  amount: number;
};

export type ProviderMilestonePayload = {
  providerId: number;
  milestones: MilestoneEntry[];
};

export type ProviderRoleMilestonePayload = {
  provider_role: string;
  milestones: MilestoneEntry[];
};

export type MilestoneStatusInput =
  | 'pending'
  | 'work_in_progress'
  | 'in_progress'
  | 'work in progress'
  | 'finished'
  | 'paid'
  | (string & {});

export type MarkProjectMilestonePayload = {
  milestone: number | string;
  language?: string;
  currency?: string;
  status?: MilestoneStatusInput;
};

export type ProjectRespondPayload = {
  response: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE';
  proposedBudget?: number;
  reason?: string;
  refusal_scope?: 'project' | 'milestone' | 'milestones';
  milestone_ids?: Array<string | number>;
  suggestions_limit?: number;
};

export type ProjectProviderBudgetResponsePayload = {
  response: 'ACCEPTED' | 'REJECTED';
  reason?: string;
  [key: string]: unknown;
};

export type MilestoneProposalType = 'ADD' | 'UPDATE' | 'DELETE';

export type ProjectMilestoneProposalInput = {
  proposal_type: MilestoneProposalType;
  project_line_id: string | number;
  project_line_milestone_id?: string | number;
  title?: string;
  description?: string | null;
  amount?: number;
  percentage?: number;
  reason?: string;
};

export type SubmitProjectMilestoneProposalsPayload = {
  proposals: ProjectMilestoneProposalInput[];
};

export type RespondToProjectMilestoneProposalPayload = {
  response: 'ACCEPTED' | 'REJECTED';
  reason?: string;
};

export type ReplacementSuggestionsQuery = {
  milestone_ids?: Array<string | number>;
  exclude_provider_id?: string | number;
  limit?: number;
};

export type ReassignProjectMilestonesPayload = {
  provider_id: string | number;
  milestone_ids: Array<string | number>;
  language?: string;
};

export type CreateProjectPayload = {
  title: string;
  description: string;
  budget: number;
  budgetType: 'FIXED' | 'HOURLY';
  paymentPlan?: string;
  project_terms?: {
    license_provider: 'CLIENT';
    allow_open_source: boolean;
    nda_active: boolean;
  };
  milestoneCount?: number;
  milestones?: ProviderMilestonePayload[];
  [key: string]: unknown;
};

export type GenerateProjectInformationResponse = {
  title: string;
  description: string;
  technologies: string[];
  estimated_budget: number;
  budget_type: string;
  team_structure: unknown[];
  deadline: string;
  additional_services: string[];
  payment_plan?: string;
  milestone_count?: number;
  milestones?: ProviderRoleMilestonePayload[];
  notes?: string;
};

export type ProviderServiceCategory = {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  image: string | null;
  sortOrder: number | null;
  isActive: boolean;
  parent_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type ProviderServiceDetails = {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  programming_language: string;
  tags: string[];
  isActive: boolean;
  category_id: number | null;
  status: string;
  isFeatured: boolean;
  orderCount: number;
  rating: number | null;
  reviewCount: number;
  viewCount: number;
  favoriteCount: number;
  price: number | null;
  delivery_provider: string;
  vector_synced_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  category: ProviderServiceCategory | null;
};

export type ProviderServiceRecord = {
  id: number | null;
  user_id: number | null;
  service_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  level: string;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  provider_project_count: number;
  service: ProviderServiceDetails | null;
};

export type StatsChangeType = 'increase' | 'decrease' | 'neutral';

export type StatsEntry = {
  value: number;
  change: number;
  change_type: StatsChangeType;
};

export type MoneyStatsEntry = StatsEntry & {
  value: number;
  currency: string;
  change_percentage: number;
};

export type ProviderDashboardStats = {
  active_projects: StatsEntry;
  monthly_revenue: MoneyStatsEntry;
  average_rating: StatsEntry;
  new_requests: StatsEntry;
};

export type ClientDashboardStats = {
  projects_posted: StatsEntry;
  budget_spent: MoneyStatsEntry;
  projects_completed: StatsEntry;
  active_providers: StatsEntry;
};

export type DashboardStatsResponse =
  | { role: 'provider'; stats: ProviderDashboardStats }
  | { role: 'client'; stats: ClientDashboardStats };

export type ActivityType =
  | 'project_created'
  | 'invoice_paid'
  | 'proposal_received'
  | 'project_paid';

export interface Activity {
  id: number;
  type: ActivityType;
  metadata: Record<string, string>;
  read_at: string | null;
  created_at: string;
  created_at_human: string;
}

export interface ActivityPageResponse {
  data: Activity[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ActivityFeedResponse {
  data: Activity[];
  meta: {
    current_page: number;
    last_page: number;
  };
}

export interface RecentActivityQuick {
  id?: number;
  type?: string;
  action?: string;
  title: string;
  project_id?: number | null;
  actor?: {
    id?: number | string;
    name?: string;
    role?: string;
  };
  payload?: Record<string, unknown>;
  time_ago: string;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  actor_name: string;
  action: string;
  event: 'created' | 'updated' | 'deleted';
  subject_type: string;
  subject_id: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip: string;
  created_at: string;
}

export interface AuditLogFilters {
  user_id?: number;
  subject_type?: string;
  event?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

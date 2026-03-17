export type DeliveryProvider =
  | 'github'
  | 'figma'
  | 'google_drive'
  | 'google_analytics'
  | 'manual_upload';

export type ProjectLineStatus =
  | 'pending'
  | 'active'
  | 'review'
  | 'in_review'
  | 'completed'
  | 'blocked'
  | 'cancelled'
  | (string & {});

export interface ProjectBudget {
  amount: number | null;
  currency: string;
  original_usd?: number | null;
  [key: string]: unknown;
}

export interface ProjectMilestoneChangeRequestCurrentSnapshot {
  id?: number | string;
  project_line_id?: number | string;
  assigned_provider_id?: number | string | null;
  currency?: string | null;
  title?: string | null;
  description?: string | null;
  percentage?: number | null;
  amount?: number | null;
  status?: string | null;
  budget_status?: string | null;
  [key: string]: unknown;
}

export interface ProjectMilestoneChangeRequest {
  id?: number | string;
  project_id?: number | string;
  project_line_id?: number | string | null;
  project_line_milestone_id?: number | string | null;
  proposal_type?: string;
  status?: string;
  title?: string | null;
  description?: string | null;
  percentage?: number | null;
  amount?: number | null;
  reason?: string | null;
  client_reason?: string | null;
  provider_id?: number | string | null;
  provider?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string | null;
    rating?: number | null;
    [key: string]: unknown;
  } | null;
  service_id?: number | string | null;
  service_name?: string | null;
  delivery_provider?: DeliveryProvider | string | null;
  milestone_title?: string | null;
  current_snapshot?: ProjectMilestoneChangeRequestCurrentSnapshot | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface ProjectLineMilestone {
  id?: number | string;
  project_line_id?: number | string;
  title: string;
  description?: string | null;
  percentage?: number;
  amount: number;
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
  status?:
    | 'pending'
    | 'work_in_progress'
    | 'finished'
    | 'paid'
    | 'in_progress'
    | 'completed'
    | 'PENDING'
    | 'WORK_IN_PROGRESS'
    | 'FINISHED'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | (string & {});
  due_date?: string;
  milestone_change_requests?: ProjectMilestoneChangeRequest[];
  [key: string]: unknown;
}

export interface ProjectDeliverable {
  id: number | string;
  project_line_id?: number | string;
  service_id?: number | string | null;
  service_name?: string;
  resource_type?: string;
  resource_id?: string;
  meta_data?: Record<string, unknown> | null;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ProjectLine {
  id: number | string;
  service_id?: number | string | null;
  service_name: string;
  delivery_provider: DeliveryProvider;
  status: ProjectLineStatus;
  budget_allocation: number;
  price?: number;
  milestones: ProjectLineMilestone[];
  deliverables: ProjectDeliverable[];
  description?: string;
  budget_percentage?: number;
  title?: string;
  milestone_change_requests?: ProjectMilestoneChangeRequest[];
  [key: string]: unknown;
}

export interface Service {
  id?: number | string;
  name?: string;
  delivery_provider: DeliveryProvider;
  [key: string]: unknown;
}

export interface Project {
  id: number | string;
  slug?: string;
  title?: string;
  description?: string;
  budget?: ProjectBudget;
  budget_value?: number | null;
  status?: string;
  project_lines: ProjectLine[];
  project_line_milestones: ProjectLineMilestone[];
  project_deliverables: ProjectDeliverable[];
  providers?: unknown[];
  selected_providers?: unknown[];
  existing_services?: unknown[];
  custom_services?: unknown[];
  milestones?: unknown[];
  milestone_change_requests?: ProjectMilestoneChangeRequest[];
  service?: Service | null;
  delivery_type?: string;
  delivery_settings?: unknown;
  [key: string]: unknown;
}

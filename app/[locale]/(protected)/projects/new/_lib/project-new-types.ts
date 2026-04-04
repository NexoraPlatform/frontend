import type { RecommendedServiceCandidate } from '@/services/ai.service';
import type {
  AiAssistantMessage,
  AiBriefOtherProvidersByService,
  AiBriefProvider,
  AiBriefRecommendedProviders,
  AiBriefResponse,
  AiMilestoneItem,
} from '@/types/ai';
import type { DeliveryProvider } from '@/types/projects';

export type WizardStep =
  | 'intent'
  | 'recommendation'
  | 'briefing'
  | 'providers'
  | 'connections'
  | 'review';

export type ProjectInputMode = 'ai' | 'manual';

export type RecommendationResult = {
  bundle_name?: string;
  services: RecommendedServiceCandidate[];
};

export type ServiceCatalogEntry = {
  name?: string;
  description?: string;
  delivery_provider?: DeliveryProvider;
  category_name?: string;
  category_id?: string | number;
  subcategory_name?: string;
};

export type ApiServiceOption = {
  id: string;
  name: string;
  delivery_provider?: DeliveryProvider;
  category_name: string;
  category_id?: string | number;
  subcategory_name?: string;
};

export type RecommendedCard = RecommendedServiceCandidate & {
  key: string;
};

export type ManualMilestoneForm = {
  id: string;
  title: string;
  description: string;
  percentage: string;
  amount: string;
  sync_source?: 'amount' | 'percentage' | null;
};

export type ManualProjectLineForm = {
  id: string;
  service_id: string;
  service_name: string;
  delivery_provider: DeliveryProvider;
  description: string;
  budget_percentage: string;
  milestones: ManualMilestoneForm[];
};

export type NormalizedBriefProjectLine =
  NonNullable<AiBriefResponse['final_brief']>['project_lines'][number];

export type NormalizedBriefProjectLineMilestone =
  NormalizedBriefProjectLine['milestones'][number];

export type NormalizedTechnologyLine = {
  service_name: string;
  service_id?: string | number;
  delivery_provider?: DeliveryProvider;
};

export type NormalizedMilestoneWithService = AiMilestoneItem & {
  service_id?: string | number;
  service_name?: string;
  delivery_provider?: DeliveryProvider;
};

export type ProjectNewOAuthSnapshot = {
  savedAt: number;
  step: WizardStep;
  projectInputMode: ProjectInputMode;
  intent: string;
  manualTitle: string;
  briefStatus: 'IDLE' | AiBriefResponse['status'];
  briefResult: NonNullable<AiBriefResponse['final_brief']> | null;
  briefModularDetails: AiBriefResponse['final_brief_modular'] | null;
  briefFullDetails: AiBriefResponse['final_brief_full'] | null;
  briefText: string;
  briefPayloadTruncated: boolean;
  briefPayloadTrimmedSections: string[];
  briefResultId: number | string | null;
  briefChannel: string;
  briefInputSignature: string;
  recommendedProviders?: AiBriefRecommendedProviders;
  otherProviders?: AiBriefOtherProvidersByService;
  selectedProviders: AiBriefProvider[];
  totalBudget: string;
  editableDuration: string;
  editablePaymentPlan: string;
  ndaActive: boolean;
  allowOpenSource: boolean;
};

export type ProjectNewPersistedWizardState = {
  savedAt: number;
  step: WizardStep;
  projectInputMode: ProjectInputMode;
  intent: string;
  manualTitle: string;
  manualServiceSearch: string;
  groupedServicesPage: number;
  manualServiceIds: string[];
  manualSelectedServicesMap: Record<string, ApiServiceOption>;
  manualSpecificRequirements: string;
  manualDuration: string;
  manualPaymentPlan: string;
  manualCurrency: string;
  manualProjectLines: ManualProjectLineForm[];
  recommendation: RecommendationResult | null;
  selectedServiceIndexes: number[];
  briefMessages: AiAssistantMessage[];
  briefStatus: 'IDLE' | AiBriefResponse['status'];
  briefQuestions: string[];
  briefAnswer: string;
  briefResult: NonNullable<AiBriefResponse['final_brief']> | null;
  briefModularDetails: AiBriefResponse['final_brief_modular'] | null;
  briefFullDetails: AiBriefResponse['final_brief_full'] | null;
  briefText: string;
  briefPayloadTruncated: boolean;
  briefPayloadTrimmedSections: string[];
  briefResultId: number | string | null;
  briefChannel: string;
  briefInputSignature: string;
  recommendedProviders?: AiBriefRecommendedProviders;
  otherProviders?: AiBriefOtherProvidersByService;
  selectedProviders: AiBriefProvider[];
  milestoneAssignments: Record<string, number>;
  milestoneAssignmentsInitialized: boolean;
  totalBudget: string;
  editableDuration: string;
  editablePaymentPlan: string;
  ndaActive: boolean;
  allowOpenSource: boolean;
};

export type ReviewMilestoneEntry = {
  key: string;
  lineIndex: number;
  milestoneIndex: number;
  serviceName: string;
  serviceKey: string;
  milestone: NonNullable<AiBriefResponse['final_brief']>['project_lines'][number]['milestones'][number];
  initialAssignedProviderId: number | null;
};

export type WizardStepItem = {
  id: WizardStep;
  labelKey: string;
};

export type CreateProjectThemeVars = {
  '--bg-main': string;
  '--bg-card': string;
  '--text-main': string;
  '--text-muted': string;
  '--border-color': string;
  '--header-bg': string;
  '--input-bg': string;
  '--stat-bg': string;
};

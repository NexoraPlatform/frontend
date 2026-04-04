import type {
  CreateProjectThemeVars,
  ProjectInputMode,
  WizardStep,
  WizardStepItem,
} from './project-new-types';

export const PROJECT_NEW_OAUTH_SNAPSHOT_KEY = 'trustora:projects-new-oauth-snapshot';
export const PROJECT_NEW_OAUTH_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
export const PROJECT_NEW_WIZARD_STATE_KEY = 'trustora:projects-new-wizard-state';
export const PROJECT_NEW_WIZARD_STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const WIZARD_STEP_VALUES: WizardStep[] = [
  'intent',
  'recommendation',
  'briefing',
  'providers',
  'connections',
  'review',
];

export const isWizardStep = (value: unknown): value is WizardStep =>
  typeof value === 'string' && WIZARD_STEP_VALUES.includes(value as WizardStep);

export const isProjectInputMode = (value: unknown): value is ProjectInputMode =>
  value === 'ai' || value === 'manual';

export const PAYMENT_PLAN_OPTIONS = [
  { value: 'FULL', labelKey: 'payment_plan_full' },
  { value: 'MILESTONE', labelKey: 'payment_plan_milestone' },
  { value: 'MONTHLY', labelKey: 'payment_plan_monthly' },
] as const;

export const AI_WIZARD_STEPS: WizardStepItem[] = [
  { id: 'intent', labelKey: 'step_label_intent' },
  { id: 'recommendation', labelKey: 'step_label_recommendation' },
  { id: 'briefing', labelKey: 'step_label_briefing' },
  { id: 'providers', labelKey: 'step_label_providers' },
  { id: 'connections', labelKey: 'step_label_connections' },
  { id: 'review', labelKey: 'step_label_review' },
];

export const MANUAL_WIZARD_STEPS: WizardStepItem[] = [
  { id: 'intent', labelKey: 'step_label_project_details' },
  { id: 'providers', labelKey: 'step_label_providers' },
  { id: 'connections', labelKey: 'step_label_connections' },
  { id: 'review', labelKey: 'step_label_review' },
];

export const createProjectThemes: Record<'light' | 'dark', CreateProjectThemeVars> = {
  light: {
    '--bg-main': '#F5F7FA',
    '--bg-card': '#FFFFFF',
    '--text-main': '#0B1C2D',
    '--text-muted': '#64748B',
    '--border-color': 'rgba(226, 232, 240, 0.8)',
    '--header-bg': 'rgba(255, 255, 255, 0.8)',
    '--input-bg': '#F5F7FA',
    '--stat-bg': '#F5F7FA',
  },
  dark: {
    '--bg-main': '#06111A',
    '--bg-card': '#0D1F30',
    '--text-main': '#F8FAFC',
    '--text-muted': '#94A3B8',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
    '--header-bg': 'rgba(13, 31, 48, 0.8)',
    '--input-bg': '#06111A',
    '--stat-bg': '#152A40',
  },
};

export const GROUPED_SERVICES_DEFAULT_LIMIT = 2;

export const STEP_TRANSITIONS: Record<WizardStep, WizardStep[]> = {
  intent: ['recommendation', 'providers', 'connections', 'review'],
  recommendation: ['intent', 'briefing'],
  briefing: ['recommendation', 'providers'],
  providers: ['intent', 'briefing', 'connections'],
  connections: ['providers', 'review'],
  review: ['connections', 'providers', 'intent'],
};

export const AI_BRIEF_GENERATED_EVENT_NAMES = [
  '.AiBriefGenerated',
  'AiBriefGenerated',
  '.App\\Events\\AiBriefGenerated',
  'App\\Events\\AiBriefGenerated',
] as const;

export const AI_BRIEF_FAILED_EVENT_NAMES = [
  '.AiBriefFailed',
  'AiBriefFailed',
  '.App\\Events\\AiBriefFailed',
  'App\\Events\\AiBriefFailed',
] as const;

export const BUDGET_COMPARISON_EPSILON = 0.01;

import { apiClient } from './api';
import { Locale } from '@/types/locale';
import { DEFAULT_CURRENCY } from '@/lib/currency';

export type ProjectClient = {
  name: string;
  avatar_url?: string;
  location: string;
  rating: number;
  total_reviews: number;
};

export type ProjectMilestone = {
  providerId: number;
  milestones: {
    title: string;
    amount: number;
  }[];
};

type ProjectBudget = {
  amount: number;
  currency: string;
  original_usd: number;
}

export type ProjectWithClient = {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  budget?: ProjectBudget;
  budget_min?: number;
  budget_max?: number;
  budget_type: 'fixed' | 'hourly';
  payment_plan?: string;
  milestone_count?: number;
  milestones?: ProjectMilestone[];
  deadline: string;
  offers_count: number;
  created_at: string;
  is_recommended: boolean;
  client?: ProjectClient;
};


const PAGE_SIZE = 8;

export async function getProjects(
  page: number,
  filters?: {
    search?: string;
    category?: string;
    technologies?: string[];
    budget_min?: number;
    budget_max?: number;
  }
): Promise<ProjectWithClient[]> {
  return apiClient.getPublicProjects({
    page,
    search: filters?.search,
    category: filters?.category,
    technologies: filters?.technologies,
    budget_min: filters?.budget_min,
    budget_max: filters?.budget_max,
  });
}

export function formatCurrency(value: number, currency: string = DEFAULT_CURRENCY, locale = 'ro-RO') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBudgetRange({
  budget,
  budget_min,
  budget_max,
  locale = 'ro'
}: {
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  locale?: Locale;
}) {
  const minValue = budget_min ?? budget;
  const maxValue = budget_max ?? budget;

  const labels: Record<Locale, { from: string; to: string; unspecified: string }> = {
    ro: { from: 'de la', to: 'până la', unspecified: 'Nespecificat' },
    en: { from: 'from', to: 'up to', unspecified: 'Unspecified' },
  };

  const t = labels[locale] ?? labels.ro;

  if (minValue !== undefined && maxValue !== undefined) {
    if (minValue === maxValue) {
      return formatCurrency(minValue, DEFAULT_CURRENCY, locale === 'en' ? 'en-US' : 'ro-RO');
    }
    return `${formatCurrency(minValue, DEFAULT_CURRENCY, locale === 'en' ? 'en-US' : 'ro-RO')} - ${formatCurrency(maxValue, DEFAULT_CURRENCY, locale === 'en' ? 'en-US' : 'ro-RO')}`;
  }

  if (minValue !== undefined) {
    return `${t.from} ${formatCurrency(minValue, DEFAULT_CURRENCY, locale === 'en' ? 'en-US' : 'ro-RO')}`;
  }

  if (maxValue !== undefined) {
    return `${t.to} ${formatCurrency(maxValue, DEFAULT_CURRENCY, locale === 'en' ? 'en-US' : 'ro-RO')}`;
  }

  return t.unspecified;
}

export function formatDeadline(value: string, locale: Locale = 'ro') {
  const labels: Record<Locale, Record<string, string>> = {
    ro: {
      '1day': '1 zi',
      '1week': 'O săptămână',
      '2weeks': '2 săptămâni',
      '3weeks': '3 săptămâni',
      '1month': '1 lună',
      '3months': '3 luni',
      '6months': '6 luni',
      '1year': '1 an',
      '1plusyear': '1+ ani',
    },
    en: {
      '1day': '1 day',
      '1week': '1 week',
      '2weeks': '2 weeks',
      '3weeks': '3 weeks',
      '1month': '1 month',
      '3months': '3 months',
      '6months': '6 months',
      '1year': '1 year',
      '1plusyear': '1+ years',
    },
  };

  return labels[locale]?.[value] ?? labels.ro[value] ?? value;
}

export function formatDate(value: string, locale: Locale = 'ro') {
  return new Date(value).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

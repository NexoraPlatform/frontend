import { apiClient } from './api';
import { Locale } from '@/types/locale';

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

export type ProjectWithClient = {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  budget?: number;
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

const PROJECTS: ProjectWithClient[] = [
  {
    id: '1',
    title: 'Website E-commerce Modern',
    description:
      'Dezvoltare platformă e-commerce cu React și Node.js pentru vânzarea de produse handmade.',
    category: 'Dezvoltare Web',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'TypeScript'],
    budget: 5500,
    budget_min: 4000,
    budget_max: 7000,
    budget_type: 'fixed',
    payment_plan: 'MILESTONE',
    milestone_count: 3,
    milestones: [
      {
        providerId: 10,
        milestones: [{ title: 'Discovery', amount: 1500 }],
      },
      {
        providerId: 22,
        milestones: [
          { title: 'Development', amount: 4000 },
          { title: 'QA + launch', amount: 1500 },
        ],
      },
    ],
    deadline: '2024-03-15',
    offers_count: 12,
    created_at: '2024-01-15',
    is_recommended: true,
    client: {
      name: 'Maria Popescu',
      avatar_url: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.8,
      total_reviews: 32,
      location: 'București',
    },
  },
  {
    id: '2',
    title: 'Aplicație Mobile pentru Fitness',
    description: 'App nativ iOS și Android pentru tracking antrenamente și nutriție.',
    category: 'Mobile Development',
    technologies: ['React Native', 'Firebase', 'Redux', 'TypeScript'],
    budget: 9500,
    budget_type: 'fixed',
    deadline: '2024-04-20',
    offers_count: 8,
    created_at: '2024-01-20',
    is_recommended: false,
    client: {
      name: 'Alexandru Ionescu',
      avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.9,
      total_reviews: 41,
      location: 'Cluj-Napoca',
    },
  },
  {
    id: '3',
    title: 'Redesign Identitate Vizuală',
    description: 'Logo nou, brand guidelines și materiale de marketing pentru startup tech.',
    category: 'Design UI/UX',
    technologies: ['Figma', 'Adobe Illustrator', 'Photoshop'],
    budget: 3200,
    budget_type: 'fixed',
    deadline: '2024-02-28',
    offers_count: 15,
    created_at: '2024-01-25',
    is_recommended: true,
    client: {
      name: 'Diana Radu',
      avatar_url: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.7,
      total_reviews: 27,
      location: 'Timișoara',
    },
  },
  {
    id: '4',
    title: 'Dashboard Analytics pentru SaaS',
    description: 'Construire dashboard analytics cu grafice interactive și exporturi.',
    category: 'Dezvoltare Web',
    technologies: ['Next.js', 'Tailwind CSS', 'Chart.js'],
    budget: 7000,
    budget_type: 'fixed',
    deadline: '2024-05-10',
    offers_count: 6,
    created_at: '2024-02-02',
    is_recommended: false,
    client: {
      name: 'Victor Marinescu',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.5,
      total_reviews: 19,
      location: 'Iași',
    },
  },
  {
    id: '5',
    title: 'Campanie Marketing Digital',
    description: 'Strategie completă de promovare online pentru magazin de fashion.',
    category: 'Marketing Digital',
    technologies: ['Meta Ads', 'Google Ads', 'TikTok'],
    budget: 4200,
    budget_type: 'fixed',
    deadline: '2024-03-30',
    offers_count: 9,
    created_at: '2024-01-30',
    is_recommended: false,
    client: {
      name: 'Laura Dumitrescu',
      avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.6,
      total_reviews: 21,
      location: 'Constanța',
    },
  },
  {
    id: '6',
    title: 'Sistem CRM Personalizat',
    description: 'CRM complet pentru echipe de vânzări, cu integrare email și rapoarte.',
    category: 'Dezvoltare Software',
    technologies: ['Laravel', 'MySQL', 'Vue.js'],
    budget: 14000,
    budget_type: 'fixed',
    deadline: '2024-06-01',
    offers_count: 4,
    created_at: '2024-02-08',
    is_recommended: true,
    client: {
      name: 'Radu Pavel',
      avatar_url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.9,
      total_reviews: 48,
      location: 'Brașov',
    },
  },
  {
    id: '7',
    title: 'Automatizare Procese HR',
    description: 'Workflow digital pentru recrutare și onboarding, cu notificări automate.',
    category: 'Productivitate',
    technologies: ['Notion', 'Zapier', 'Make'],
    budget: 2200,
    budget_type: 'fixed',
    deadline: '2024-03-12',
    offers_count: 11,
    created_at: '2024-02-11',
    is_recommended: false,
    client: {
      name: 'Carmen Tudor',
      avatar_url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.4,
      total_reviews: 17,
      location: 'Sibiu',
    },
  },
  {
    id: '8',
    title: 'UI Kit pentru Fintech',
    description: 'Set complet de componente UI și prototipuri pentru aplicație fintech.',
    category: 'Design UI/UX',
    technologies: ['Figma', 'Storybook'],
    budget: 4500,
    budget_type: 'fixed',
    deadline: '2024-04-05',
    offers_count: 7,
    created_at: '2024-02-14',
    is_recommended: false,
    client: {
      name: 'Andrei Stoica',
      avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.8,
      total_reviews: 29,
      location: 'București',
    },
  },
  {
    id: '9',
    title: 'Landing Page Startup',
    description: 'Landing page optimizat pentru conversii, cu secțiuni dinamice.',
    category: 'Dezvoltare Web',
    technologies: ['Astro', 'Tailwind CSS', 'GSAP'],
    budget: 1800,
    budget_type: 'fixed',
    deadline: '2024-03-05',
    offers_count: 14,
    created_at: '2024-02-18',
    is_recommended: false,
    client: {
      name: 'Ilinca Petrescu',
      avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.6,
      total_reviews: 25,
      location: 'Oradea',
    },
  },
  {
    id: '10',
    title: 'Chatbot pentru Support',
    description: 'Implementare chatbot bazat pe AI pentru suport clienți și FAQs.',
    category: 'AI & Automatizări',
    technologies: ['OpenAI', 'Node.js', 'Pinecone'],
    budget: 8500,
    budget_type: 'fixed',
    deadline: '2024-05-22',
    offers_count: 5,
    created_at: '2024-02-20',
    is_recommended: true,
    client: {
      name: 'Sorin Matei',
      avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.9,
      total_reviews: 52,
      location: 'București',
    },
  },
  {
    id: '11',
    title: 'Aplicație IoT pentru Smart Home',
    description: 'Monitorizare și control dispozitive smart home cu dashboard web.',
    category: 'IoT',
    technologies: ['Python', 'MQTT', 'React'],
    budget: 11000,
    budget_type: 'fixed',
    deadline: '2024-06-15',
    offers_count: 3,
    created_at: '2024-02-22',
    is_recommended: false,
    client: {
      name: 'Gabriel Lupu',
      avatar_url: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.7,
      total_reviews: 33,
      location: 'Craiova',
    },
  },
  {
    id: '12',
    title: 'Optimizare SEO pentru Blog',
    description: 'Audit SEO complet și plan de optimizare tehnică pentru trafic organic.',
    category: 'Marketing Digital',
    technologies: ['SEO', 'Google Analytics', 'Ahrefs'],
    budget: 1500,
    budget_type: 'fixed',
    deadline: '2024-03-18',
    offers_count: 10,
    created_at: '2024-02-25',
    is_recommended: false,
    client: {
      name: 'Teodora Iacob',
      avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.5,
      total_reviews: 16,
      location: 'Galați',
    },
  },
];

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

export async function getProjectCategories(): Promise<string[]> {
  const categories = Array.from(new Set(PROJECTS.map((project) => project.category)));
  return ['Toate', ...categories];
}

export async function getProjectTechnologies(): Promise<string[]> {
  const uniqueTechs = new Set<string>();
  PROJECTS.forEach((project) => {
    project.technologies.forEach((tech) => uniqueTechs.add(tech));
  });
  return Array.from(uniqueTechs.values());
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
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
      return formatCurrency(minValue);
    }
    return `${formatCurrency(minValue)} - ${formatCurrency(maxValue)}`;
  }

  if (minValue !== undefined) {
    return `${t.from} ${formatCurrency(minValue)}`;
  }

  if (maxValue !== undefined) {
    return `${t.to} ${formatCurrency(maxValue)}`;
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

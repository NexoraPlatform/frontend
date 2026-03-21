export type PublicProviderLanguageOption = {
  id?: number;
  name: string;
  code?: string;
  locale?: string;
  flag?: string;
  timezone?: string;
};

export type ProviderProfileViewModel = {
  id: string | number;
  profileUrl: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  bio: string;
  company: string;
  website?: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  responseTime: string | null;
  isVerified: boolean;
  memberSince: string | null;
  firstJob: string | null;
  lastActive: string | null;
  availability: {
    status: string;
    hoursPerWeek: number;
    timezone: string | null;
    workingHours: Record<string, { start: string; end: string; enabled: boolean } | null>;
    nextAvailable: string | null;
  };
  languages: Array<{ name: string; level: string; flag: string }>;
  certifications: Array<{ name: string; issuer: string; date: string; credentialId: string; verified: boolean }>;
  education: Array<{ degree: string; institution: string; attended_from: string; attended_to: string; study_area: string; period: string; description: string }>;
  workHistory: Array<{ position: string; company: string; city: string; country: string; start_date: string; end_date: string; description: string; current_working: boolean; period: string; type: string; technologies: string[] }>;
  portfolio: Array<{ title: string; description: string; image: string; role: string; technologies: string[]; url: string }>;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type DayKey = (typeof DAYS)[number];

const asArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNullableString = (value: unknown): string | null => {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const asNumber = (value: unknown, fallback = 0): number => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const formatPeriod = (start: string, end: string, isCurrent = false): string => {
  const normalizedStart = start.trim();
  const normalizedEnd = end.trim();

  if (!normalizedStart && !normalizedEnd) {
    return '';
  }

  if (!normalizedStart) {
    return normalizedEnd;
  }

  if (!normalizedEnd) {
    return isCurrent ? `${normalizedStart} - Prezent` : normalizedStart;
  }

  return `${normalizedStart} - ${normalizedEnd}`;
};

const buildLegacyWorkingDay = (profile: Record<string, any>, day: DayKey) => {
  const start = asNullableString(profile[`working_${day}_from`]);
  const end = asNullableString(profile[`working_${day}_to`]);
  const enabled = Boolean(profile[`working_${day}_enabled`]);

  if (!enabled || !start || !end) {
    return null;
  }

  return { start, end, enabled: true };
};

const buildWorkingHours = (profile: Record<string, any>) => {
  const availabilityObject =
    profile && typeof profile.availability === 'object' && profile.availability !== null && !Array.isArray(profile.availability)
      ? profile.availability
      : null;

  const availabilityWorkingHours =
    availabilityObject && typeof availabilityObject.workingHours === 'object' && availabilityObject.workingHours !== null
      ? availabilityObject.workingHours
      : null;

  return DAYS.reduce<Record<string, { start: string; end: string; enabled: boolean } | null>>((acc, day) => {
    const rawDay = availabilityWorkingHours?.[day];
    const start = asNullableString(rawDay?.start);
    const end = asNullableString(rawDay?.end);
    const enabled = Boolean(rawDay?.enabled);

    acc[day] = enabled && start && end
      ? { start, end, enabled: true }
      : buildLegacyWorkingDay(profile, day);

    return acc;
  }, {});
};

export function mapPublicProviderProfile(
  providerData: any,
  profileUrl: string,
  languageOptions: PublicProviderLanguageOption[] = []
): ProviderProfileViewModel {
  const profile = providerData?.profile && typeof providerData.profile === 'object' ? providerData.profile : {};
  const availabilityObject =
    profile && typeof profile.availability === 'object' && profile.availability !== null && !Array.isArray(profile.availability)
      ? profile.availability
      : null;

  const rawLanguages = asArray<any>(providerData?.languages);
  const mappedLanguages = rawLanguages.map((lang) => {
    const languageName = asString(lang?.language ?? lang?.name);
    const match = languageOptions.find((item) => item.name.toLowerCase() === languageName.toLowerCase());

    return {
      name: languageName,
      level: asString(lang?.proficiency ?? lang?.level),
      flag: asString(match?.flag) || '🇷🇴',
    };
  });

  const education = asArray<any>(providerData?.education ?? providerData?.educations).map((edu) => {
    const attendedFrom = asString(edu?.attended_from);
    const attendedTo = asString(edu?.attended_to);

    return {
      degree: asString(edu?.degree),
      institution: asString(edu?.institution),
      attended_from: attendedFrom,
      attended_to: attendedTo,
      study_area: asString(edu?.study_area),
      period: formatPeriod(attendedFrom, attendedTo),
      description: asString(edu?.study_area),
    };
  });

  const workHistory = asArray<any>(providerData?.work_history ?? providerData?.workHistory).map((work) => {
    const startDate = asString(work?.start_date);
    const endDate = asString(work?.end_date);
    const currentWorking = Boolean(work?.current_working);

    return {
      position: asString(work?.position),
      company: asString(work?.company),
      city: asString(work?.city),
      country: asString(work?.country),
      start_date: startDate,
      end_date: endDate,
      description: asString(work?.description),
      current_working: currentWorking,
      period: formatPeriod(startDate, endDate, currentWorking),
      type: currentWorking ? 'Curent' : 'Finalizat',
      technologies: asArray<string>(work?.technologies),
    };
  });

  const portfolio = asArray<any>(providerData?.portfolio ?? providerData?.portfolios).map((item) => ({
    title: asString(item?.project_title ?? item?.title),
    description: asString(item?.description),
    image: asString(item?.image),
    role: asString(item?.role),
    technologies: asArray<string>(item?.technologies_used ?? item?.technologies),
    url: asString(item?.url),
  }));

  const certifications = asArray<any>(providerData?.certifications).map((cert) => ({
    name: asString(cert?.name),
    issuer: asString(cert?.issuer_name ?? cert?.issuer),
    date: asString(cert?.issued_at ?? cert?.date),
    credentialId: asString(cert?.credential_id ?? cert?.credentialId),
    verified: Boolean(cert?.verified),
  }));

  const providerCompanyName =
    typeof providerData?.company === 'string'
      ? providerData.company
      : asString(providerData?.company?.name ?? providerData?.company_name);

  const firstJob =
    asNullableString(providerData?.oldest_work_experience) ??
    asNullableString(workHistory[0]?.start_date);

  return {
    id: providerData?.id ?? profileUrl,
    profileUrl: asString(providerData?.profile_url) || profileUrl,
    firstName: asString(providerData?.firstName),
    lastName: asString(providerData?.lastName),
    email: asNullableString(providerData?.email),
    phone: asNullableString(providerData?.phone),
    avatar: asNullableString(providerData?.avatar),
    bio: asString(profile?.bio),
    company: providerCompanyName,
    website: asNullableString(providerData?.website),
    location: asString(profile?.location),
    rating: asNumber(providerData?.rating),
    reviewCount: asNumber(providerData?.reviewCount),
    completedProjects: portfolio.length,
    responseTime: asNullableString(profile?.answer_hour ?? availabilityObject?.responseTime),
    isVerified: Boolean(providerData?.callVerified) && Boolean(providerData?.testVerified),
    memberSince: asNullableString(providerData?.created_at),
    firstJob,
    lastActive: asNullableString(providerData?.last_active_at),
    availability: {
      status: asString(availabilityObject?.status ?? profile?.availability) || 'UNAVAILABLE',
      hoursPerWeek: asNumber(profile?.working_hours_per_week ?? availabilityObject?.hoursPerWeek),
      timezone: asNullableString(providerData?.timezone ?? availabilityObject?.timezone),
      workingHours: buildWorkingHours(profile),
      nextAvailable: asNullableString(providerData?.next_available_job),
    },
    languages: mappedLanguages,
    certifications,
    education,
    workHistory,
    portfolio,
  };
}

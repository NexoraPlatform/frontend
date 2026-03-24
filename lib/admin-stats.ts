export type AdminStats = {
  totalUsers: number;
  currentMonthUsers: number;
  currentMonthVsLastMonthUsers: number;
  activeServices: number;
  currentMonthServices: number;
  currentMonthVsLastMonthServices: number;
  totalProjects: number;
  currentMonthProjects: number;
  totalPendingProjects: number;
  currentMonthVsLastMonthProjects: number;
  totalRevenue: number;
  currentMonthRevenue: number;
  currentMonthVsLastMonthRevenue: number;
  pendingUsers: number;
  pendingServices: number;
  pendingCalls: number;
  totalScheduleCalls: number;
};

export const EMPTY_ADMIN_STATS: AdminStats = {
  totalUsers: 0,
  currentMonthUsers: 0,
  currentMonthVsLastMonthUsers: 0,
  activeServices: 0,
  currentMonthServices: 0,
  currentMonthVsLastMonthServices: 0,
  totalProjects: 0,
  currentMonthProjects: 0,
  totalPendingProjects: 0,
  currentMonthVsLastMonthProjects: 0,
  totalRevenue: 0,
  currentMonthRevenue: 0,
  currentMonthVsLastMonthRevenue: 0,
  pendingUsers: 0,
  pendingServices: 0,
  pendingCalls: 0,
  totalScheduleCalls: 0,
};

function asNumber(value: unknown) {
  const normalizedValue =
    typeof value === "string" && value.trim() === "" ? Number.NaN : Number(value);

  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

export function normalizeAdminStats(
  value: Partial<AdminStats> | null | undefined
): AdminStats {
  return {
    totalUsers: asNumber(value?.totalUsers),
    currentMonthUsers: asNumber(value?.currentMonthUsers),
    currentMonthVsLastMonthUsers: asNumber(value?.currentMonthVsLastMonthUsers),
    activeServices: asNumber(value?.activeServices),
    currentMonthServices: asNumber(value?.currentMonthServices),
    currentMonthVsLastMonthServices: asNumber(value?.currentMonthVsLastMonthServices),
    totalProjects: asNumber(value?.totalProjects),
    currentMonthProjects: asNumber(value?.currentMonthProjects),
    totalPendingProjects: asNumber(value?.totalPendingProjects),
    currentMonthVsLastMonthProjects: asNumber(value?.currentMonthVsLastMonthProjects),
    totalRevenue: asNumber(value?.totalRevenue),
    currentMonthRevenue: asNumber(value?.currentMonthRevenue),
    currentMonthVsLastMonthRevenue: asNumber(value?.currentMonthVsLastMonthRevenue),
    pendingUsers: asNumber(value?.pendingUsers),
    pendingServices: asNumber(value?.pendingServices),
    pendingCalls: asNumber(value?.pendingCalls),
    totalScheduleCalls: asNumber(value?.totalScheduleCalls),
  };
}

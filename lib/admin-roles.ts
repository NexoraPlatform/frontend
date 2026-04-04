import type { RoleLite } from "@/lib/api";

export type AdminRoleRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number | null;
  permissions?: Array<{ id?: number; slug?: string } | number | string>;
};

export type AdminRolePermission = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: number;
  permission_group_id: number;
};

export type AdminRolePermissionGroup = {
  id: number;
  name: string;
  slug: string;
  permissions: AdminRolePermission[];
};

export type AdminRoleFormValues = {
  name: string;
  description: string;
  permissions: number[];
  sortOrder?: number;
};

type PagedRolesResponse =
  | { results: AdminRoleRow[]; count: number; page?: number; page_size?: number }
  | { data: AdminRoleRow[]; total?: number; page?: number; page_size?: number }
  | AdminRoleRow[];

export function extractAdminRoles(
  data: PagedRolesResponse
): { items: AdminRoleRow[]; total: number | null } {
  if (Array.isArray(data)) {
    return { items: data, total: null };
  }

  if ("results" in data && Array.isArray(data.results)) {
    return { items: data.results, total: data.count ?? null };
  }

  if ("data" in data && Array.isArray(data.data)) {
    return { items: data.data, total: data.total ?? null };
  }

  return { items: [], total: 0 };
}

export function countPermissionsInGroups(groups: AdminRolePermissionGroup[]) {
  return groups.reduce((sum, group) => sum + group.permissions.length, 0);
}

export function getPermissionCountForRole(role: AdminRoleRow) {
  return Array.isArray(role.permissions) ? role.permissions.length : 0;
}

export function buildRoleFormValues(input?: Partial<AdminRoleFormValues>): AdminRoleFormValues {
  return {
    name: input?.name ?? "",
    description: input?.description ?? "",
    permissions: input?.permissions ?? [],
    sortOrder: input?.sortOrder ?? 0,
  };
}

export function normalizeRolesLite(input: RoleLite[]) {
  return input.map((role) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
  }));
}

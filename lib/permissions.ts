import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { rolePermissions } from '@/db/schema';
import {
  CONFIGURABLE_ROLES,
  defaultPermissions,
  normalizeRole,
  PermissionError,
  type ConfigurableRole,
  type PermissionAction,
  type PermissionMap,
  type ResourceKey,
  type RolePermissionState,
} from './permission-meta';

export * from './permission-meta';

export async function getRolePermissions(
  role: string | null | undefined,
): Promise<PermissionMap> {
  const normalized = normalizeRole(role);
  const map = defaultPermissions(normalized);

  if (normalized === 'master') return map;

  const rows = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, normalized));

  for (const row of rows) {
    if (!(row.resource in map)) continue;
    const key = row.resource as ResourceKey;
    map[key] = {
      view: row.canView,
      create: row.canCreate,
      update: row.canUpdate,
      delete: row.canDelete,
    };
  }

  return map;
}

export async function getAllRolePermissions(): Promise<RolePermissionState> {
  const entries = await Promise.all(
    CONFIGURABLE_ROLES.map(async (role) => {
      const permissions = await getRolePermissions(role);
      return [role, permissions] as const;
    }),
  );

  return Object.fromEntries(entries) as RolePermissionState;
}

export async function can(
  role: string | null | undefined,
  resource: ResourceKey,
  action: PermissionAction,
): Promise<boolean> {
  if (normalizeRole(role) === 'master') return true;
  const permissions = await getRolePermissions(role);
  return Boolean(permissions[resource]?.[action]);
}

export async function assertPermission(
  role: string | null | undefined,
  resource: ResourceKey,
  action: PermissionAction,
): Promise<void> {
  if (!(await can(role, resource, action))) {
    throw new PermissionError(
      'Peran akun tidak memiliki izin untuk melakukan aksi ini.',
    );
  }
}

export type { ConfigurableRole };

import type { Session } from 'next-auth';
import { auth } from '@/auth';
import {
  getRolePermissions,
  isRole,
  type PermissionMap,
  type Role,
  type ResourceKey,
} from './permissions';

export type SessionAccess = {
  session: Session | null;
  role: Role;
  permissions: PermissionMap;
};

export async function getSessionAccess(): Promise<SessionAccess> {
  const session = (await auth()) as Session | null;
  const rawRole = (session?.user as { role?: string } | undefined)?.role;
  const role = isRole(rawRole) ? rawRole : 'penggarap';
  const permissions = await getRolePermissions(role);
  return { session, role, permissions };
}

export async function getPageAccess(resource: ResourceKey) {
  const access = await getSessionAccess();
  return {
    ...access,
    allowed: Boolean(access.session?.user) && access.permissions[resource].view,
  };
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rolePermissions } from '@/db/schema';
import {
  currentUser,
  forbidden,
  handleRouteError,
  readBody,
  unauthorized,
} from '@/lib/api';
import {
  CONFIGURABLE_ROLES,
  RESOURCES,
  getAllRolePermissions,
  type ConfigurableRole,
  type PermissionAction,
  type ResourceKey,
} from '@/lib/permissions';
import { ValidationError } from '@/lib/validation';

async function requireMaster() {
  const user = await currentUser();
  if (!user) return { error: unauthorized() } as const;
  if ((user as { role?: string }).role !== 'master') {
    return { error: forbidden() } as const;
  }
  return { user } as const;
}

function flag(
  source: Record<string, unknown> | undefined,
  action: PermissionAction,
): boolean {
  return Boolean(source?.[action]);
}

export async function GET() {
  const access = await requireMaster();
  if ('error' in access) return access.error;

  try {
    return NextResponse.json({
      data: {
        resources: RESOURCES,
        roles: CONFIGURABLE_ROLES,
        permissions: await getAllRolePermissions(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  const access = await requireMaster();
  if ('error' in access) return access.error;

  try {
    const body = await readBody(request);
    const incoming = body.permissions;

    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      throw new ValidationError('Data permission tidak valid.');
    }

    for (const role of CONFIGURABLE_ROLES) {
      const roleMap = (incoming as Record<string, unknown>)[role];
      if (!roleMap || typeof roleMap !== 'object' || Array.isArray(roleMap)) {
        throw new ValidationError(`Permission untuk role ${role} tidak lengkap.`);
      }

      for (const resource of RESOURCES) {
        const resourceMap = (roleMap as Record<string, unknown>)[
          resource.key
        ] as Record<string, unknown> | undefined;
        if (!resourceMap || typeof resourceMap !== 'object') continue;

        const canView = flag(resourceMap, 'view');
        const canCreate =
          resource.actions.includes('create') && flag(resourceMap, 'create');
        const canUpdate =
          resource.actions.includes('update') && flag(resourceMap, 'update');
        const canDelete =
          resource.actions.includes('delete') && flag(resourceMap, 'delete');

        await db
          .insert(rolePermissions)
          .values({
            role: role as ConfigurableRole,
            resource: resource.key as ResourceKey,
            canView,
            canCreate,
            canUpdate,
            canDelete,
          })
          .onDuplicateKeyUpdate({
            set: {
              canView,
              canCreate,
              canUpdate,
              canDelete,
            },
          });
      }
    }

    return NextResponse.json({
      data: {
        resources: RESOURCES,
        roles: CONFIGURABLE_ROLES,
        permissions: await getAllRolePermissions(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { Suspense } from 'react';
import AksesClient from '@/components/dashboard/AksesClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getSessionAccess } from '@/lib/access';
import {
  ACTION_LABELS,
  CONFIGURABLE_ROLES,
  RESOURCES,
  ROLE_LABELS,
  getAllRolePermissions,
} from '@/lib/permissions';

async function Content() {
  const access = await getSessionAccess();
  if (access.role !== 'master') {
    return (
      <AccessDenied
        title="Hak Akses khusus Master"
        description="Hanya role Master yang dapat mengatur izin tindakan setiap role."
      />
    );
  }

  const permissions = await getAllRolePermissions();

  return (
    <AksesClient
      initialPermissions={permissions}
      resources={RESOURCES}
      roles={CONFIGURABLE_ROLES}
      roleLabels={ROLE_LABELS}
      actionLabels={ACTION_LABELS}
    />
  );
}

export default function AksesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat hak akses...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

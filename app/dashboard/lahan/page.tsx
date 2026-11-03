import { Suspense } from 'react';
import LahanClient from '@/components/dashboard/LahanClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listPetak } from '@/lib/queries/lahan';
import { penggarapOptions } from '@/lib/queries/penggarap';

async function Content() {
  const access = await getPageAccess('lahan');
  if (!access.allowed) return <AccessDenied />;

  const [rows, penggarap] = await Promise.all([listPetak(), penggarapOptions()]);
  return <LahanClient rows={rows} penggarap={penggarap} permissions={access.permissions.lahan} />;
}

export default function LahanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat peta lahan...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

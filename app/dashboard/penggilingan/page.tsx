import { Suspense } from 'react';
import BatchClient from '@/components/dashboard/BatchClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listBatch, lotOptions } from '@/lib/queries/operasional';
import { penggarapOptions } from '@/lib/queries/penggarap';

async function Content() {
  const access = await getPageAccess('penggilingan');
  if (!access.allowed) return <AccessDenied />;

  const [rows, penggarap, lot] = await Promise.all([
    listBatch(),
    penggarapOptions(),
    lotOptions(),
  ]);
  return <BatchClient rows={rows} penggarap={penggarap} lot={lot} permissions={access.permissions.penggilingan} />;
}

export default function PenggilinganPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat jadwal penggilingan...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

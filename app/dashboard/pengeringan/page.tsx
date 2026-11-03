import { Suspense } from 'react';
import LotClient from '@/components/dashboard/LotClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listLot } from '@/lib/queries/operasional';
import { penggarapOptions } from '@/lib/queries/penggarap';

async function Content() {
  const access = await getPageAccess('pengeringan');
  if (!access.allowed) return <AccessDenied />;

  const [rows, penggarap] = await Promise.all([listLot(), penggarapOptions()]);
  return <LotClient rows={rows} penggarap={penggarap} permissions={access.permissions.pengeringan} />;
}

export default function PengeringanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data lot pengeringan...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { connection } from 'next/server';
import PengirimanClient from '@/components/dashboard/PengirimanClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listBatch } from '@/lib/queries/operasional';
import { listPengiriman, listToko } from '@/lib/queries/keuangan';
import { parsePeriod } from '@/lib/period';

type SearchParams = Promise<{
  bulan?: string | string[];
  tahun?: string | string[];
}>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
  const access = await getPageAccess('pengiriman');
  if (!access.allowed) return <AccessDenied />;

  const period = parsePeriod(params.bulan, params.tahun);

  const [rows, toko, batch] = await Promise.all([
    listPengiriman(),
    listToko(),
    listBatch(),
  ]);

  return (
    <PengirimanClient
      rows={rows}
      toko={toko}
      batch={batch}
      period={period}
      permissions={access.permissions.pengiriman}
      tokoView={access.permissions.toko.view}
    />
  );
}

export default function PengirimanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data pengiriman...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

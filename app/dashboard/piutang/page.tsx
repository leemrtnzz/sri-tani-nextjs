import { Suspense } from 'react';
import { connection } from 'next/server';
import PiutangClient from '@/components/dashboard/PiutangClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listPiutang } from '@/lib/queries/keuangan';
import { penggarapOptions } from '@/lib/queries/penggarap';
import { parsePeriod } from '@/lib/period';

type SearchParams = Promise<{
  bulan?: string | string[];
  tahun?: string | string[];
}>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
  const access = await getPageAccess('piutang');
  if (!access.allowed) return <AccessDenied />;

  const period = parsePeriod(params.bulan, params.tahun);

  const [rows, penggarap] = await Promise.all([listPiutang(), penggarapOptions()]);
  return (
    <PiutangClient
      rows={rows}
      penggarap={penggarap}
      period={period}
      permissions={access.permissions.piutang}
    />
  );
}

export default function PiutangPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data piutang...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

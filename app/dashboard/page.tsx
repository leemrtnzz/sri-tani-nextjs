import { Suspense } from 'react';
import { connection } from 'next/server';
import DashboardHomeClient from '@/components/dashboard/DashboardHomeClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { getDashboardData } from '@/lib/queries/dashboard';
import { parsePeriod } from '@/lib/period';

type SearchParams = Promise<{
  bulan?: string | string[];
  tahun?: string | string[];
}>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
  const access = await getPageAccess('dashboard');
  if (!access.allowed) return <AccessDenied />;

  const period = parsePeriod(params.bulan, params.tahun);
  const data = await getDashboardData(period);
  return <DashboardHomeClient data={data} />;
}

export default function DashboardHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data dashboard...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

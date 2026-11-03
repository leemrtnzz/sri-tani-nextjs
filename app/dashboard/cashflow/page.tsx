import { Suspense } from 'react';
import { connection } from 'next/server';
import CashflowClient from '@/components/dashboard/CashflowClient';
import AccessDenied from '@/components/ui/AccessDenied';
import { getPageAccess } from '@/lib/access';
import { listBatch } from '@/lib/queries/operasional';
import { penggarapOptions } from '@/lib/queries/penggarap';
import {
  listToko,
  listTransaksi,
  monthlySeries,
  summarizeCashflow,
} from '@/lib/queries/keuangan';
import { parsePeriod } from '@/lib/period';

type SearchParams = Promise<{
  bulan?: string | string[];
  tahun?: string | string[];
}>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
  const access = await getPageAccess('cashflow');
  if (!access.allowed) return <AccessDenied />;

  const period = parsePeriod(params.bulan, params.tahun);

  const [rows, toko, penggarap, batch, monthly] = await Promise.all([
    listTransaksi({ start: period.start, end: period.end }),
    listToko(),
    penggarapOptions(),
    listBatch(),
    monthlySeries(period.tahun),
  ]);

  const summary = summarizeCashflow(rows);

  return (
    <CashflowClient
      rows={rows}
      summary={summary}
      monthly={monthly}
      toko={toko}
      penggarap={penggarap}
      batch={batch}
      period={period}
      permissions={access.permissions.cashflow}
    />
  );
}

export default function CashflowPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data cashflow...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

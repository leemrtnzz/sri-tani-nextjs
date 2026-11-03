import { Suspense } from 'react';
import { connection } from 'next/server';
import PanenClient from '@/components/dashboard/PanenClient';
import {
  harvestRanking,
  listPanen,
} from '@/lib/queries/operasional';
import { penggarapOptions } from '@/lib/queries/penggarap';
import { parseQuarter, parseYear, quarterRange } from '@/lib/period';

type SearchParams = Promise<{
  tahun?: string | string[];
  kuartal?: string | string[];
}>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection();
  const tahun = parseYear(params.tahun);
  const kuartal = parseQuarter(params.kuartal);
  const range = quarterRange(tahun, kuartal);

  const [rows, ranking, penggarap] = await Promise.all([
    listPanen(range.start, range.end),
    harvestRanking(tahun, kuartal),
    penggarapOptions(),
  ]);

  return (
    <PanenClient
      rows={rows}
      ranking={ranking}
      penggarap={penggarap}
      tahun={tahun}
      kuartal={kuartal}
    />
  );
}

export default function PanenPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data panen...
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

import { Suspense } from 'react';
import LahanClient from '@/components/dashboard/LahanClient';
import { listPetak } from '@/lib/queries/lahan';
import { penggarapOptions } from '@/lib/queries/penggarap';

async function Content() {
  const [rows, penggarap] = await Promise.all([listPetak(), penggarapOptions()]);
  return <LahanClient rows={rows} penggarap={penggarap} />;
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

import { Suspense } from 'react';
import BatchClient from '@/components/dashboard/BatchClient';
import { listBatch, lotOptions } from '@/lib/queries/operasional';
import { penggarapOptions } from '@/lib/queries/penggarap';

async function Content() {
  const [rows, penggarap, lot] = await Promise.all([
    listBatch(),
    penggarapOptions(),
    lotOptions(),
  ]);
  return <BatchClient rows={rows} penggarap={penggarap} lot={lot} />;
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

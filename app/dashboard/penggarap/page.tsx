import { Suspense } from 'react';
import PenggarapClient from '@/components/dashboard/PenggarapClient';
import { listPenggarap } from '@/lib/queries/penggarap';

async function Content() {
  const rows = await listPenggarap();
  return <PenggarapClient rows={rows} />;
}

export default function PenggarapPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data penggarap...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

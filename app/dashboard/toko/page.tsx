import { Suspense } from 'react';
import TokoClient from '@/components/dashboard/TokoClient';
import { listToko } from '@/lib/queries/keuangan';

async function Content() {
  const rows = await listToko();
  return <TokoClient rows={rows} />;
}

export default function TokoPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data toko...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

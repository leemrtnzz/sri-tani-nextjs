import { Suspense } from 'react';
import { getDashboardData } from '@/lib/db-data';
import DashboardHomeClient from '@/components/DashboardHomeClient';

async function DashboardContent() {
  const data = await getDashboardData();
  return <DashboardHomeClient data={data} />;
}

export default function DashboardHomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

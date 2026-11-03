import { Suspense } from 'react';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center text-slate-500">
          Memuat Dashboard...
        </div>
      }
    >
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  );
}

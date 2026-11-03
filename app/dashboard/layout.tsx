import { Suspense } from 'react';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';
import { getSessionAccess } from '@/lib/access';

async function Content({ children }: { children: React.ReactNode }) {
  const { role, permissions } = await getSessionAccess();
  return (
    <DashboardLayoutClient role={role} permissions={permissions}>
      {children}
    </DashboardLayoutClient>
  );
}

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
      <Content>{children}</Content>
    </Suspense>
  );
}

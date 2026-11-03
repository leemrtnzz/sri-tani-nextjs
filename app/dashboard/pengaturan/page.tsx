import { Suspense } from 'react';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import PengaturanAkunClient from '@/components/dashboard/PengaturanAkunClient';

async function Content() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!Number.isInteger(userId)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-700">
        Sesi akun tidak ditemukan. Silakan masuk kembali.
      </div>
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-700">
        Data akun tidak ditemukan.
      </div>
    );
  }

  return (
    <PengaturanAkunClient
      user={{
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        role: user.role,
      }}
    />
  );
}

export default function PengaturanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat pengaturan akun...
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { auth } from '@/auth';
import { db } from '@/db';
import { pengaturan, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function PengaturanContent() {
  const session = await auth();

  const [settings] = await db.select().from(pengaturan).limit(1);
  const user = session?.user?.email
    ? await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
      })
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-sri-green flex items-center justify-center text-lg">
            <i className="bi bi-gear-fill" />
          </span>
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi organisasi dan profil akun petugas mitra dari database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profil Akun */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-sri-sidebar text-white flex items-center justify-center font-bold text-lg">
              {(user?.nama || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{user?.nama || 'Petugas'}</h3>
              <p className="text-xs text-slate-500 capitalize">
                Peran:{' '}
                <span className="font-semibold text-emerald-700">
                  {user?.role || 'user'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Username</span>
              <span className="font-medium text-slate-700">
                @{user?.username || '-'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Alamat Email</span>
              <span className="font-medium text-slate-700">
                {user?.email || '-'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Status Akun</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif Terverifikasi
              </span>
            </div>
          </div>
        </div>

        {/* Data Organisasi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
            Preferensi Sistem
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Nama Organisasi
              </label>
              <input
                type="text"
                readOnly
                value={settings?.namaOrganisasi || 'SRI TANI'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Periode Pelaporan Default
              </label>
              <input
                type="text"
                readOnly
                value={settings?.periodeDefault || 'Oktober 2025'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
              <i className="bi bi-info-circle-fill text-blue-600 mt-0.5 shrink-0" />
              <span>
                Data pengaturan terhubung langsung ke tabel{' '}
                <code className="font-mono font-semibold">pengaturan</code> di
                database MySQL.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat pengaturan...
        </div>
      }
    >
      <PengaturanContent />
    </Suspense>
  );
}

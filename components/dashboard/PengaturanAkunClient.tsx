'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { initials, label } from '@/lib/format';

type AccountUser = {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: string;
};

export default function PengaturanAkunClient({ user }: { user: AccountUser }) {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState({
    nama: user.nama,
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  const setField = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setNotice('');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/akun', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Penyimpanan pengaturan akun gagal.');
      }

      const updated = result.data as AccountUser;
      setForm((current) => ({
        ...current,
        nama: updated.nama,
        username: updated.username,
        email: updated.email,
        password: '',
        confirmPassword: '',
      }));
      setNotice('Pengaturan akun berhasil disimpan.');
      await update({
        user: {
          name: updated.nama,
          email: updated.email,
          nama: updated.nama,
          username: updated.username,
        },
      });
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Penyimpanan pengaturan akun gagal.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg bg-emerald-100 text-sri-sidebar flex items-center justify-center text-xl">
            <i className="bi bi-person-gear" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Pengaturan Akun
            </h1>
            <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">
              Kelola nama, username, email, dan kata sandi akun yang sedang masuk.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="w-14 h-14 rounded-full bg-sri-sidebar text-white flex items-center justify-center text-lg font-bold">
                {initials(form.nama)}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">
                  {form.nama}
                </div>
                <div className="text-xs text-slate-600 truncate">
                  @{form.username}
                </div>
                <div className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  {label(user.role)}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-600">Email</div>
                <div className="font-medium text-slate-800 break-all">
                  {form.email}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Peran akun</div>
                <div className="font-medium text-slate-800">
                  {label(user.role)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Status</div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aktif
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <div className="flex items-start gap-2">
              <i className="bi bi-info-circle-fill mt-0.5" />
              <p>
                Jika email atau username diubah, gunakan data baru saat masuk
                berikutnya. Perubahan nama langsung dipakai pada sesi ini.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900">
            Data akun dan keamanan
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 mb-4">
            Kolom kata sandi kosong berarti kata sandi lama tetap dipakai.
          </p>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 flex items-start gap-2"
              >
                <i className="bi bi-exclamation-triangle-fill mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900 flex items-start gap-2"
              >
                <i className="bi bi-check-circle-fill mt-0.5" />
                <span>{notice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="akun-nama"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Nama lengkap <span className="text-red-600">*</span>
                </label>
                <input
                  id="akun-nama"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.nama}
                  onChange={(event) => setField('nama', event.target.value)}
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="akun-username"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  id="akun-username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={60}
                  pattern="[a-zA-Z0-9_]+"
                  value={form.username}
                  onChange={(event) => setField('username', event.target.value)}
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="akun-email"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="akun-email"
                  type="email"
                  required
                  maxLength={190}
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="akun-password"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Kata sandi baru
                </label>
                <input
                  id="akun-password"
                  type="password"
                  minLength={6}
                  maxLength={100}
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  placeholder="Kosongkan jika tidak diubah"
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="akun-konfirmasi"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Konfirmasi kata sandi baru
                </label>
                <input
                  id="akun-konfirmasi"
                  type="password"
                  minLength={6}
                  maxLength={100}
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setField('confirmPassword', event.target.value)
                  }
                  placeholder="Ulangi kata sandi baru"
                  className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    nama: user.nama,
                    username: user.username,
                    email: user.email,
                    password: '',
                    confirmPassword: '',
                  });
                  setError('');
                  setNotice('');
                }}
                disabled={pending}
                className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                Kembalikan data awal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active disabled:opacity-70"
              >
                {pending && <i className="bi bi-arrow-repeat animate-spin" />}
                {pending ? 'Menyimpan...' : 'Simpan pengaturan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

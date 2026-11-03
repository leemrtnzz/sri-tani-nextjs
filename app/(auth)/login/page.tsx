'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const u = username.trim();
    const uErr = u ? '' : 'Username atau email wajib diisi.';
    const pErr = password.length >= 6 ? '' : 'Kata sandi minimal 6 karakter.';

    setErrors({ username: uErr, password: pErr, general: '' });

    if (uErr || pErr) {
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username: u,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrors({
          username: '',
          password: '',
          general: 'Username/email atau kata sandi tidak sesuai. Silakan periksa kembali.',
        });
        setLoading(false);
        return;
      }

      // Login berhasil, arahkan ke dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setErrors((prev) => ({
        ...prev,
        general: 'Terjadi kesalahan saat masuk. Coba lagi beberapa saat lagi.',
      }));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f4f6f8] text-slate-800 font-sans antialiased">
      {/* Panel visual: warna dan motif dari dashboard */}
      <aside className="hidden lg:flex relative bg-sri-sidebar text-white flex-col justify-between overflow-hidden">
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="SRI TANI, ke beranda">
            <span className="w-11 h-11 rounded-full bg-linear-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-sri-sidebar text-xl shadow-md">
              <i className="bi bi-flower1" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-wide leading-tight">SRI TANI</span>
              <span className="block text-xs text-white/75">Pertanian dan Ternak Terpadu</span>
            </span>
          </Link>
          <h1 className="mt-14 text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight max-w-md">
            Satu akun untuk memantau sawah, kandang, dan kas.
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-sm">
            Masuk untuk membuka peta lahan, jadwal giling, populasi ternak, dan laporan keuangan mitra.
          </p>
        </div>
      </aside>

      {/* Form Area */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-8" aria-label="SRI TANI, ke beranda">
            <span className="w-10 h-10 rounded-full bg-sri-sidebar text-white flex items-center justify-center">
              <i className="bi bi-flower1" />
            </span>
            <span className="text-lg font-bold text-sri-sidebar">SRI TANI</span>
          </Link>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-800">Masuk ke akun</h2>
            <p className="text-sm text-slate-600 mt-1">Gunakan akun petugas mitra atau administrator.</p>

            {registered && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                <i className="bi bi-check-circle-fill text-emerald-600 shrink-0" />
                <span>Akun berhasil didaftarkan. Silakan masukkan data Anda untuk masuk.</span>
              </div>
            )}

            {errors.general && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-red-600 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form id="loginForm" className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username atau email
                </label>
                <div className="relative">
                  <i className="bi bi-person absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="contoh: admin atau admin@sritani.com"
                    aria-describedby="usernameErr"
                    aria-invalid={!!errors.username}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((prev) => ({ ...prev, username: '', general: '' }));
                    }}
                    className="w-full pl-10 pr-4 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20 aria-[invalid=true]:border-red-600"
                  />
                </div>
                <p id="usernameErr" className={`${errors.username ? 'block' : 'hidden'} mt-1.5 text-xs text-red-700`}>
                  {errors.username}
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kata sandi
                </label>
                <div className="relative">
                  <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Minimal 6 karakter"
                    aria-describedby="passwordErr"
                    aria-invalid={!!errors.password}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: '', general: '' }));
                    }}
                    className="w-full pl-10 pr-12 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20 aria-invalid:border-red-600"
                  />
                  <button
                    id="togglePw"
                    type="button"
                    aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-pressed={showPw}
                    onClick={() => setShowPw((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    <i className={showPw ? 'bi bi-eye-slash' : 'bi bi-eye'} />
                  </button>
                </div>
                <p id="passwordErr" className={`${errors.password ? 'block' : 'hidden'} mt-1.5 text-xs text-red-700`}>
                  {errors.password}
                </p>
              </div>

              <button
                id="submitBtn"
                type="submit"
                disabled={loading}
                className="w-full min-h-12 rounded-xl bg-sri-sidebar hover:bg-sri-active text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              >
                <i id="btnIcon" className={loading ? 'bi bi-arrow-repeat animate-spin' : 'bi bi-box-arrow-in-right'} />
                <span id="btnText">{loading ? 'Memproses...' : 'Masuk ke Dashboard'}</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Belum memiliki akun?{' '}
                <Link href="/register" className="font-semibold text-sri-green hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>

          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sri-sidebar transition-colors">
            <i className="bi bi-arrow-left" /> Kembali ke beranda
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}

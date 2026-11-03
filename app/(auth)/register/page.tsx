'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
  });

  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama lengkap wajib diisi.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Format email tidak valid.';
    }

    const usernameTrim = formData.username.trim();
    if (!usernameTrim) {
      newErrors.username = 'Username wajib diisi.';
    } else if (usernameTrim.length < 3) {
      newErrors.username = 'Username minimal 3 karakter.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(usernameTrim)) {
      newErrors.username = 'Hanya huruf, angka, dan garis bawah (_).';
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || 'Registrasi gagal. Silakan coba lagi.' });
        setLoading(false);
        return;
      }

      setSuccessMsg('Akun berhasil didaftarkan! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ general: 'Terjadi kesalahan sistem saat menghubungi server.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f4f6f8] text-slate-800 font-sans antialiased">
      {/* Panel visual */}
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
            Mulai kelola pertanian dan peternakan lebih terintegrasi.
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-sm">
            Daftarkan akun petugas mitra atau administrator untuk mengakses pemetaan lahan, pengeringan, dan pencatatan kas.
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
            <h2 className="text-2xl font-bold text-slate-800">Daftar akun baru</h2>
            <p className="text-sm text-slate-600 mt-1">Lengkapi data diri Anda untuk membuat akun.</p>

            {successMsg && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                <i className="bi bi-check-circle-fill text-emerald-600 shrink-0 text-base" />
                <span>{successMsg}</span>
              </div>
            )}

            {errors.general && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-red-600 shrink-0 text-base" />
                <span>{errors.general}</span>
              </div>
            )}

            <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama lengkap
                </label>
                <div className="relative">
                  <i className="bi bi-card-text absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    placeholder="contoh: Budi Santoso"
                    value={formData.nama}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20"
                  />
                </div>
                {errors.nama && <p className="mt-1 text-xs text-red-700">{errors.nama}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Alamat email
                </label>
                <div className="relative">
                  <i className="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="contoh: budi@sritani.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <i className="bi bi-person absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="contoh: budisantoso"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20"
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-red-700">{errors.username}</p>}
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
                    autoComplete="new-password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 min-h-11 border border-slate-300 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    onClick={() => setShowPw((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    <i className={showPw ? 'bi bi-eye-slash' : 'bi bi-eye'} />
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-700">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Peran Akun
                </label>
                <div className="relative">
                  <i className="bi bi-shield-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 min-h-11 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-sri-green focus:ring-2 focus:ring-sri-green/20 cursor-pointer"
                  >
                    <option value="user">User (Petugas Lapangan / Mitra)</option>
                    <option value="admin">Admin (Administrator)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 mt-2 rounded-xl bg-sri-sidebar hover:bg-sri-active text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              >
                <i className={loading ? 'bi bi-arrow-repeat animate-spin' : 'bi bi-person-plus'} />
                <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="font-semibold text-sri-green hover:underline">
                  Masuk di sini
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

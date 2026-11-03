import Link from 'next/link';

export default function AccessDenied({
  title = 'Akses dibatasi',
  description = 'Peran akun Anda tidak memiliki izin untuk membuka halaman ini.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-2xs max-w-2xl">
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center text-xl">
        <i className="bi bi-shield-lock-fill" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mt-4">{title}</h1>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
      <p className="text-xs text-slate-500 mt-3">
        Hubungi Master untuk mengubah izin peran melalui halaman Hak Akses.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 min-h-10 inline-flex items-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active"
      >
        <i className="bi bi-arrow-left" />
        Kembali ke dashboard
      </Link>
    </div>
  );
}

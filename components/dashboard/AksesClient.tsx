'use client';

import { useState } from 'react';
import type {
  ConfigurableRole,
  PermissionAction,
  ResourceDefinition,
  RolePermissionState,
} from '@/lib/permission-meta';

type AksesClientProps = {
  initialPermissions: RolePermissionState;
  resources: ResourceDefinition[];
  roles: readonly ConfigurableRole[];
  roleLabels: Record<string, string>;
  actionLabels: Record<PermissionAction, string>;
};

function cloneState(state: RolePermissionState): RolePermissionState {
  return JSON.parse(JSON.stringify(state)) as RolePermissionState;
}

export default function AksesClient({
  initialPermissions,
  resources,
  roles,
  roleLabels,
  actionLabels,
}: AksesClientProps) {
  const [permissions, setPermissions] = useState<RolePermissionState>(() =>
    cloneState(initialPermissions),
  );
  const [activeRole, setActiveRole] = useState<ConfigurableRole>(roles[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const toggle = (
    resourceKey: string,
    action: PermissionAction,
    value: boolean,
  ) => {
    setNotice('');
    setError('');
    setPermissions((current) => {
      const next = cloneState(current);
      const resource = resourceKey as keyof typeof next[typeof activeRole];
      next[activeRole][resource][action] = value;
      return next;
    });
  };

  const save = async () => {
    setPending(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Penyimpanan hak akses gagal.');
      }
      if (result?.data?.permissions) {
        setPermissions(cloneState(result.data.permissions));
      }
      setNotice('Hak akses berhasil disimpan.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Penyimpanan hak akses gagal.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-emerald-100 text-sri-sidebar flex items-center justify-center text-xl">
              <i className="bi bi-shield-lock-fill" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Hak Akses Role
              </h1>
              <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">
                Atur aksi yang boleh dilakukan setiap role pada tiap modul.
                Perubahan berlaku saat pengguna memuat ulang halaman.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <i className="bi bi-person-badge-fill" />
            Khusus Master
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 flex items-start gap-2.5">
        <i className="bi bi-info-circle-fill mt-0.5" />
        <p>
          Role Master selalu memiliki akses penuh dan tidak dapat diubah dari
          halaman ini. Role yang dapat diatur adalah Admin, Petugas Lapangan, dan
          Penggarap.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const active = role === activeRole;
          return (
            <button
              key={role}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setActiveRole(role);
                setError('');
                setNotice('');
              }}
              className={`min-h-10 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                active
                  ? 'border-sri-sidebar bg-sri-sidebar text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {roleLabels[role] ?? role}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Aksi untuk role {roleLabels[activeRole] ?? activeRole}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Centang aksi yang diizinkan. Aksi yang tidak tersedia untuk modul
              ditampilkan sebagai tanda hubung.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="min-h-11 inline-flex items-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active disabled:opacity-70"
          >
            {pending && <i className="bi bi-arrow-repeat animate-spin" />}
            {pending ? 'Menyimpan...' : 'Simpan hak akses'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3 text-center">Lihat</th>
                <th className="px-4 py-3 text-center">Tambah</th>
                <th className="px-4 py-3 text-center">Ubah</th>
                <th className="px-4 py-3 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.map((resource) => {
                const resourcePermissions =
                  permissions[activeRole][resource.key as keyof typeof permissions[typeof activeRole]];
                return (
                  <tr key={resource.key} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {resource.label}
                      </div>
                      <div className="text-xs text-slate-600">
                        {resource.description}
                      </div>
                    </td>
                    {(['view', 'create', 'update', 'delete'] as PermissionAction[]).map(
                      (action) => {
                        const available = resource.actions.includes(action);
                        return (
                          <td key={action} className="px-4 py-3 text-center">
                            {available ? (
                              <label className="inline-flex items-center justify-center min-h-9 min-w-9 cursor-pointer">
                                <span className="sr-only">
                                  {actionLabels[action]} {resource.label}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(resourcePermissions[action])}
                                  onChange={(event) =>
                                    toggle(
                                      resource.key,
                                      action,
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-400 text-sri-green focus:ring-sri-green"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}

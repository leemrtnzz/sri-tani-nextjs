'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { label as statusLabel, statusBadgeClass } from '@/lib/format';

export type FieldOption = { value: string | number; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'hidden';
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: string;
  defaultValue?: string | number | boolean;
  span?: 1 | 2;
  hiddenOnEdit?: boolean;
  visible?: (values: FormValues) => boolean;
};

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export type FormValues = Record<string, string | number | boolean>;

type CrudPageProps<T extends { id: number }> = {
  title: string;
  description: string;
  icon: string;
  endpoint: string;
  rows: T[];
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  toForm?: (row: T) => FormValues;
  searchFields?: string[];
  searchPlaceholder?: string;
  rowKey?: (row: T) => string | number;
  addLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  extraTop?: ReactNode;
  extraHeader?: ReactNode;
  rowActions?: (row: T) => ReactNode;
};

function initialValues(fields: FieldDef[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      values[field.name] = false;
    } else {
      values[field.name] = '';
    }
  }
  return values;
}

function valueForInput(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value as string | number;
}

function serializeForm(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === 'hidden') continue;
    const raw = values[field.name];

    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(raw);
      continue;
    }

    if (raw === '' || raw === undefined) {
      payload[field.name] = '';
      continue;
    }

    if (field.type === 'number') {
      payload[field.name] = Number(raw);
      continue;
    }

    if (
      field.type === 'select' &&
      field.options?.some((option) => typeof option.value === 'number')
    ) {
      payload[field.name] = Number(raw);
      continue;
    }

    payload[field.name] = raw;
  }

  return payload;
}

export default function CrudPage<T extends { id: number }>({
  title,
  description,
  icon,
  endpoint,
  rows,
  columns,
  fields,
  toForm,
  searchFields,
  searchPlaceholder = 'Cari data...',
  rowKey = (row) => row.id,
  addLabel = 'Tambah data',
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Tambahkan data pertama untuk mulai mengelola modul ini.',
  extraTop,
  extraHeader,
  rowActions,
}: CrudPageProps<T>) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<FormValues>(() => initialValues(fields));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleFields = fields.filter(
    (field) =>
      !(field.hiddenOnEdit && editing) &&
      (field.visible ? field.visible(form) : true),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((item) => {
      const record = item as Record<string, unknown>;
      const source = searchFields?.length
        ? searchFields.map((key) => record[key]).join(' ')
        : Object.values(record).join(' ');
      return String(source).toLowerCase().includes(needle);
    });
  }, [rows, query, searchFields]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialValues(fields));
    setFormError('');
    setOpen(true);
  };

  const openEdit = (row: T) => {
    let nextForm: FormValues;
    if (toForm) {
      nextForm = toForm(row);
    } else {
      const record = row as Record<string, unknown>;
      nextForm = initialValues(fields);
      for (const field of fields) {
        const value = record[field.name];
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          nextForm[field.name] = value;
        }
      }
    }
    setEditing(row);
    setForm(nextForm);
    setFormError('');
    setOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setOpen(false);
    setFormError('');
  };

  const setField = (name: string, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const isEdit = Boolean(editing);
      const id = editing ? rowKey(editing) : null;
      const response = await fetch(isEdit ? `${endpoint}/${id}` : endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeForm(fields, form)),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || 'Penyimpanan data gagal.');
      }

      if (!result?.data) {
        throw new Error('Server tidak mengembalikan data yang disimpan.');
      }

      setOpen(false);
      setNotice({
        tone: 'ok',
        text: isEdit ? 'Perubahan data berhasil disimpan.' : 'Data baru berhasil ditambahkan.',
      });
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Penyimpanan data gagal.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    setDeleteError('');

    try {
      const id = rowKey(deleting);
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || 'Penghapusan data gagal.');
      }

      setDeleting(null);
      setNotice({ tone: 'ok', text: 'Data berhasil dihapus.' });
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Penghapusan data gagal.',
      );
    } finally {
      setDeletePending(false);
    }
  };

  const renderCell = (row: T, column: ColumnDef<T>) => {
    if (column.render) return column.render(row);
    const value = (row as Record<string, unknown>)[column.key];
    if (typeof value === 'string') {
      const badge = statusBadgeClass(value);
      if (
        [
          'aktif',
          'nonaktif',
          'perlu_verifikasi',
          'terpetakan',
          'belum_dipetakan',
          'kosong',
          'dijemur',
          'hampir_kering',
          'siap_giling',
          'menunggu',
          'terjadwal',
          'berjalan',
          'selesai',
          'dimuat',
          'dalam_perjalanan',
          'diterima',
          'belum_jatuh_tempo',
          'segera_jatuh_tempo',
          'terlambat',
          'lunas',
        ].includes(value)
      ) {
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}
          >
            {statusLabel(value)}
          </span>
        );
      }
    }
    return value === null || value === undefined || value === '' ? '-' : String(value);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-emerald-100 text-sri-sidebar flex items-center justify-center text-xl shrink-0">
              <i className={`bi bi-${icon}`} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
              <p className="text-sm text-slate-600 mt-0.5 max-w-2xl">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-11 inline-flex items-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active"
          >
            <i className="bi bi-plus-lg" />
            {addLabel}
          </button>
        </div>
        {extraHeader}
      </div>

      {extraTop}

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <label htmlFor={`search-${title}`} className="sr-only">
              {searchPlaceholder}
            </label>
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              id={`search-${title}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
            />
          </div>
          <span className="text-xs text-slate-600">
            {filtered.length} dari {rows.length} data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200">
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl mx-auto mb-3">
                        <i className="bi bi-inbox" />
                      </div>
                      <p className="font-semibold text-slate-800">
                        {rows.length === 0 ? emptyTitle : 'Tidak ada hasil pencarian'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {rows.length === 0
                          ? emptyDescription
                          : 'Ubah kata kunci pencarian atau kosongkan kolom pencarian.'}
                      </p>
                      {rows.length === 0 && (
                        <button
                          type="button"
                          onClick={openCreate}
                          className="mt-4 min-h-10 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <i className="bi bi-plus-lg" />
                          {addLabel}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={rowKey(row)} data-row className="hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-middle text-slate-700 ${column.className ?? ''}`}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {rowActions?.(row)}
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        aria-label={`Ubah data ${rowKey(row)}`}
                        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(row);
                          setDeleteError('');
                        }}
                        aria-label={`Hapus data ${rowKey(row)}`}
                        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeForm}
        title={editing ? `Ubah ${title}` : `Tambah ${title}`}
        description={
          editing
            ? 'Perbarui data lalu simpan perubahan.'
            : 'Isi data yang diperlukan lalu simpan.'
        }
        size="lg"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              form="crud-form"
              disabled={submitting}
              className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-sri-sidebar px-4 text-sm font-semibold text-white hover:bg-sri-active disabled:opacity-70"
            >
              {submitting && <i className="bi bi-arrow-repeat animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan data'}
            </button>
          </div>
        }
      >
        <form id="crud-form" onSubmit={submit} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 flex items-start gap-2"
            >
              <i className="bi bi-exclamation-triangle-fill mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleFields.map((field) => {
              const value = valueForInput(form[field.name]);
              const inputId = `field-${field.name}`;
              const wrapperClass = field.span === 2 ? 'sm:col-span-2' : '';

              if (field.type === 'hidden') return null;

              if (field.type === 'checkbox') {
                return (
                  <label
                    key={field.name}
                    htmlFor={inputId}
                    className={`${wrapperClass} flex items-start gap-3 rounded-lg border border-slate-200 px-3.5 py-3 cursor-pointer`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={Boolean(form[field.name])}
                      onChange={(event) => setField(field.name, event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-400 text-sri-green focus:ring-sri-green"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        {field.label}
                      </span>
                      {field.help && (
                        <span className="block text-xs text-slate-600 mt-0.5">
                          {field.help}
                        </span>
                      )}
                    </span>
                  </label>
                );
              }

              return (
                <div key={field.name} className={wrapperClass}>
                  <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    {field.label}
                    {field.required && <span className="text-red-600"> *</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      id={inputId}
                      value={value}
                      required={field.required}
                      onChange={(event) => setField(field.name, event.target.value)}
                      className="w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
                    >
                      <option value="">{field.placeholder ?? 'Pilih data'}</option>
                      {field.options?.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={inputId}
                      value={value}
                      required={field.required}
                      rows={3}
                      placeholder={field.placeholder}
                      onChange={(event) => setField(field.name, event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
                    />
                  ) : (
                    <input
                      id={inputId}
                      type={field.type ?? 'text'}
                      value={value}
                      required={field.required}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(event) => setField(field.name, event.target.value)}
                      className="w-full min-h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 focus:border-sri-green focus:outline-none focus:ring-2 focus:ring-sri-green/20"
                    />
                  )}

                  {field.help && (
                    <p className="mt-1 text-xs text-slate-600">{field.help}</p>
                  )}
                </div>
              );
            })}
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (!deletePending) setDeleting(null);
        }}
        title="Hapus data"
        description="Tindakan ini tidak bisa dibatalkan."
        size="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deletePending}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deletePending}
              className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
            >
              {deletePending && <i className="bi bi-arrow-repeat animate-spin" />}
              {deletePending ? 'Menghapus...' : 'Hapus data'}
            </button>
          </div>
        }
      >
        {deleteError && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
          >
            {deleteError}
          </div>
        )}
        <p className="text-sm text-slate-700">
          Data yang dihapus akan hilang dari daftar. Pastikan tidak ada catatan lain
          yang masih memakai data ini.
        </p>
      </Modal>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-[1300] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg flex items-start gap-2.5 ${
            notice.tone === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <i
            className={`bi ${
              notice.tone === 'ok' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
            } mt-0.5`}
          />
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Tutup notifikasi"
            className="text-current/70 hover:text-current"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}
    </div>
  );
}

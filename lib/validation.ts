import { isValidPolygon, type Coordinate } from './geo';
import { parseDateString } from './period';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function has(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

type TextOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  fallback?: string | null;
};

export function text(
  value: unknown,
  field: string,
  options: TextOptions = {},
): string | null | undefined {
  if (value === undefined) {
    if (options.required) throw new ValidationError(`${field} wajib diisi.`);
    return options.fallback === undefined ? undefined : options.fallback;
  }

  if (value === null || value === '') {
    if (options.required) throw new ValidationError(`${field} wajib diisi.`);
    return options.fallback === undefined ? null : options.fallback;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    if (options.required) throw new ValidationError(`${field} wajib diisi.`);
    return options.fallback === undefined ? null : options.fallback;
  }

  if (normalized.length < (options.min ?? 0)) {
    throw new ValidationError(`${field} minimal ${options.min} karakter.`);
  }
  if (normalized.length > (options.max ?? 255)) {
    throw new ValidationError(`${field} maksimal ${options.max} karakter.`);
  }
  return normalized;
}

type NumberOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
};

export function numberValue(
  value: unknown,
  field: string,
  options: NumberOptions = {},
): number | undefined {
  if (value === undefined || value === null || value === '') {
    if (options.required) throw new ValidationError(`${field} wajib diisi.`);
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${field} harus berupa angka.`);
  }
  if (options.integer && !Number.isInteger(parsed)) {
    throw new ValidationError(`${field} harus berupa bilangan bulat.`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new ValidationError(`${field} minimal ${options.min}.`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new ValidationError(`${field} maksimal ${options.max}.`);
  }
  return parsed;
}

export function decimalString(
  value: unknown,
  field: string,
  options: NumberOptions & { scale?: number } = {},
): string | undefined {
  const parsed = numberValue(value, field, options);
  if (parsed === undefined) return undefined;
  return parsed.toFixed(options.scale ?? 2);
}

export function dateValue(
  value: unknown,
  field: string,
  required = false,
): string | null | undefined {
  if (value === undefined) {
    if (required) throw new ValidationError(`${field} wajib diisi.`);
    return undefined;
  }
  if (value === null || value === '') {
    if (required) throw new ValidationError(`${field} wajib diisi.`);
    return null;
  }
  const normalized = String(value).trim();
  if (!parseDateString(normalized)) {
    throw new ValidationError(`${field} harus berupa tanggal yang valid.`);
  }
  return normalized;
}

export function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  options: { required?: boolean; fallback?: T } = {},
): T | undefined {
  if (value === undefined || value === null || value === '') {
    if (options.fallback !== undefined) return options.fallback;
    if (options.required) throw new ValidationError(`${field} wajib dipilih.`);
    return undefined;
  }
  const normalized = String(value) as T;
  if (!allowed.includes(normalized)) {
    throw new ValidationError(`${field} tidak valid.`);
  }
  return normalized;
}

export function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

export function coordinatesValue(
  value: unknown,
  field: string,
  required = false,
): Coordinate[] | undefined {
  if (value === undefined) {
    if (required) throw new ValidationError(`${field} wajib diisi.`);
    return undefined;
  }
  if (!isValidPolygon(value)) {
    throw new ValidationError(`${field} harus berisi minimal 3 titik koordinat yang valid.`);
  }
  return value.map(([lat, lng]) => [
    Number(lat.toFixed(6)),
    Number(lng.toFixed(6)),
  ]) as Coordinate[];
}

export function colorValue(value: unknown, fallback = '#16a34a'): string {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function idValue(value: unknown, field: string): number {
  const parsed = numberValue(value, field, {
    required: true,
    min: 1,
    integer: true,
  });
  return parsed as number;
}

export function optionalIdValue(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return idValue(value, field);
}

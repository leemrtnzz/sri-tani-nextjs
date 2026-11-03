export const ROLE_VALUES = ['master', 'admin', 'petugas', 'penggarap'] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const CONFIGURABLE_ROLES = ['admin', 'petugas', 'penggarap'] as const;
export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

export const ACTION_VALUES = ['view', 'create', 'update', 'delete'] as const;
export type PermissionAction = (typeof ACTION_VALUES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  master: 'Master',
  admin: 'Administrator',
  petugas: 'Petugas Lapangan',
  penggarap: 'Penggarap',
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Lihat',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
};

export type ResourceKey =
  | 'dashboard'
  | 'penggarap'
  | 'lahan'
  | 'pengeringan'
  | 'penggilingan'
  | 'panen'
  | 'pengiriman'
  | 'cashflow'
  | 'piutang'
  | 'toko';

export type ResourceDefinition = {
  key: ResourceKey;
  label: string;
  description: string;
  actions: PermissionAction[];
};

export const RESOURCES: ResourceDefinition[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Ringkasan lahan, produksi, keuangan, dan jadwal.',
    actions: ['view'],
  },
  {
    key: 'penggarap',
    label: 'Data Penggarap',
    description: 'Profil penggarap dan akun penggarap.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'lahan',
    label: 'Peta Lahan',
    description: 'Petak lahan, poligon, luas, dan status petak.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'pengeringan',
    label: 'Lot Pengeringan',
    description: 'Kapasitas dan isi lot pengeringan gabah.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'penggilingan',
    label: 'Jadwal Penggilingan',
    description: 'Batch giling, kapasitas, beras, dan rendemen.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'panen',
    label: 'Panen dan Rating',
    description: 'Catatan panen dan peringkat kuartal.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'pengiriman',
    label: 'Pengiriman Beras',
    description: 'Pengiriman gudang ke toko dan status penerimaan.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'cashflow',
    label: 'Cashflow',
    description: 'Modal, pengeluaran, penjualan, dan laba rugi.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'piutang',
    label: 'Piutang Penggarap',
    description: 'Kewajiban usaha kepada penggarap dan jatuh tempo.',
    actions: ['view', 'create', 'update', 'delete'],
  },
  {
    key: 'toko',
    label: 'Data Toko',
    description: 'Toko tujuan pengiriman beras.',
    actions: ['view', 'create', 'update', 'delete'],
  },
];

export type ResourcePermissions = Record<PermissionAction, boolean>;
export type PermissionMap = Record<ResourceKey, ResourcePermissions>;
export type RolePermissionState = Record<ConfigurableRole, PermissionMap>;

export class PermissionError extends Error {
  constructor(message = 'Peran akun tidak memiliki izin untuk aksi ini.') {
    super(message);
    this.name = 'PermissionError';
  }
}

function emptyMap(): PermissionMap {
  const map = {} as PermissionMap;
  for (const resource of RESOURCES) {
    map[resource.key] = {
      view: false,
      create: false,
      update: false,
      delete: false,
    };
  }
  return map;
}

export function defaultPermissions(role: Role): PermissionMap {
  const map = emptyMap();

  for (const resource of RESOURCES) {
    if (role === 'master' || role === 'admin') {
      map[resource.key] = {
        view: true,
        create: resource.actions.includes('create'),
        update: resource.actions.includes('update'),
        delete: resource.actions.includes('delete'),
      };
      continue;
    }

    if (role === 'petugas') {
      map[resource.key] = {
        view: true,
        create: resource.key !== 'dashboard' && resource.actions.includes('create'),
        update: resource.key !== 'dashboard' && resource.actions.includes('update'),
        delete: false,
      };
      continue;
    }

    map[resource.key] = {
      view: resource.key === 'dashboard',
      create: false,
      update: false,
      delete: false,
    };
  }

  return map;
}

export function isRole(value: string | null | undefined): value is Role {
  return ROLE_VALUES.includes(value as Role);
}

export function isConfigurableRole(
  value: string | null | undefined,
): value is ConfigurableRole {
  return CONFIGURABLE_ROLES.includes(value as ConfigurableRole);
}

export function normalizeRole(role: string | null | undefined): Role {
  return isRole(role) ? role : 'penggarap';
}

import type { ResourceKey } from './permission-meta';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  resource?: ResourceKey;
  masterOnly?: boolean;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'grid-1x2-fill',
    resource: 'dashboard',
  },
  {
    href: '/dashboard/lahan',
    label: 'Peta Lahan',
    icon: 'map-fill',
    resource: 'lahan',
  },
  {
    href: '/dashboard/penggarap',
    label: 'Penggarap',
    icon: 'people-fill',
    resource: 'penggarap',
  },
  {
    href: '#operasional',
    label: 'Operasional',
    icon: 'gear-fill',
    children: [
      {
        href: '/dashboard/pengeringan',
        label: 'Lot Pengeringan',
        icon: 'house-gear-fill',
        resource: 'pengeringan',
      },
      {
        href: '/dashboard/penggilingan',
        label: 'Jadwal Penggilingan',
        icon: 'calendar2-week-fill',
        resource: 'penggilingan',
      },
      {
        href: '/dashboard/panen',
        label: 'Panen & Rating',
        icon: 'trophy-fill',
        resource: 'panen',
      },
      {
        href: '/dashboard/pengiriman',
        label: 'Pengiriman Beras',
        icon: 'truck',
        resource: 'pengiriman',
      },
    ],
  },
  {
    href: '#keuangan',
    label: 'Keuangan',
    icon: 'cash-stack',
    children: [
      {
        href: '/dashboard/cashflow',
        label: 'Cashflow',
        icon: 'bar-chart-fill',
        resource: 'cashflow',
      },
      {
        href: '/dashboard/piutang',
        label: 'Piutang Penggarap',
        icon: 'file-earmark-text-fill',
        resource: 'piutang',
      },
      {
        href: '/dashboard/toko',
        label: 'Data Toko',
        icon: 'shop',
        resource: 'toko',
      },
    ],
  },
  {
    href: '/dashboard/akses',
    label: 'Hak Akses',
    icon: 'shield-lock-fill',
    masterOnly: true,
  },
];

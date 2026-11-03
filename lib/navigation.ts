export interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid-1x2-fill' },
  { href: '/dashboard/lahan', label: 'Peta Lahan', icon: 'map-fill' },
  { href: '/dashboard/penggarap', label: 'Penggarap', icon: 'people-fill' },
  {
    href: '#operasional',
    label: 'Operasional',
    icon: 'gear-fill',
    children: [
      { href: '/dashboard/pengeringan', label: 'Lot Pengeringan', icon: 'house-gear-fill' },
      { href: '/dashboard/penggilingan', label: 'Jadwal Penggilingan', icon: 'calendar2-week-fill' },
      { href: '/dashboard/panen', label: 'Panen & Rating', icon: 'trophy-fill' },
      { href: '/dashboard/pengiriman', label: 'Pengiriman Beras', icon: 'truck' },
    ],
  },
  {
    href: '#keuangan',
    label: 'Keuangan',
    icon: 'cash-stack',
    children: [
      { href: '/dashboard/cashflow', label: 'Cashflow', icon: 'bar-chart-fill' },
      { href: '/dashboard/piutang', label: 'Piutang Penggarap', icon: 'file-earmark-text-fill' },
      { href: '/dashboard/toko', label: 'Data Toko', icon: 'shop' },
    ],
  },
];

export const FLAT_NAV: NavItem[] = NAV.flatMap((item) => item.children ?? [item]);

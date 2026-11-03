'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import anime from 'animejs';
import { NAV, FLAT_NAV, type NavItem } from '@/lib/navigation';

const row = 'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ';
const on = 'bg-sri-active text-white font-semibold';
const off = 'text-white/85 hover:bg-sri-hover hover:text-white font-medium';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const sessionUser = session?.user as
    | {
        nama?: string;
        name?: string | null;
        username?: string;
        email?: string | null;
        role?: string;
      }
    | undefined;

  const userName =
    sessionUser?.nama || sessionUser?.name || sessionUser?.username || 'Pengguna';

  const userRole =
    sessionUser?.role === 'admin'
      ? 'Administrator'
      : sessionUser?.role === 'petugas'
        ? 'Petugas Lapangan'
        : 'User Mitra';

  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      anime({
        targets: '.nav-item',
        translateX: [-16, 0],
        opacity: [0, 1],
        delay: anime.stagger(40, { start: 80 }),
        duration: 500,
        easing: 'easeOutQuad',
      });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((current) => !current);
    } else {
      setDesktopCollapsed((current) => !current);
    }
  };

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    const needle = value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('[data-row]').forEach((element) => {
      const hit = element.textContent?.toLowerCase().includes(needle);
      element.classList.toggle('hidden', !hit);
      if (hit) shown += 1;
    });
    document
      .getElementById('emptyState')
      ?.classList.toggle('hidden', shown > 0 || !needle);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const hit = FLAT_NAV.find(
      (item) => item.label.toLowerCase() === searchQuery.trim().toLowerCase(),
    );
    if (hit) router.push(hit.href);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('sri-user');
    } catch {
      // ignore
    }
    await signOut({ callbackUrl: '/login' });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={`nav-item ${row}${active ? on : off}`}
      >
        <i className={`bi bi-${item.icon} text-base`} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen w-full relative">
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        onTransitionEnd={(event) => {
          if (event.propertyName === 'margin-left') {
            window.dispatchEvent(new Event('resize'));
          }
        }}
        className={`w-[250px] shrink-0 bg-sri-sidebar text-white flex flex-col fixed lg:sticky lg:top-0 lg:h-screen lg:self-start inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          desktopCollapsed
            ? 'lg:-translate-x-full lg:-ml-[250px]'
            : 'lg:translate-x-0 lg:ml-0'
        }`}
      >
        <Link
          href="/"
          className="px-5 py-5 flex items-center gap-3 border-b border-white/10"
          aria-label="SRI TANI, ke beranda"
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-sri-sidebar text-xl shrink-0 shadow-md">
            <i className="bi bi-flower1" />
          </div>
          <div>
            <div className="text-base font-bold tracking-wide leading-tight">
              SRI TANI
            </div>
            <span className="text-xs text-white/70 block">Pertanian Terpadu</span>
          </div>
        </Link>

        <nav
          className="p-3 flex-1 flex flex-col space-y-1 overflow-y-auto"
          aria-label="Menu utama"
        >
          {NAV.map((item) => {
            if (item.children) {
              const groupActive = item.children.some((child) => isActive(child.href));
              const expanded = openGroups[item.label] ?? groupActive;

              return (
                <div key={item.label} className="nav-item">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpenGroups((current) => ({
                        ...current,
                        [item.label]: !expanded,
                      }))
                    }
                    className={`w-full justify-between cursor-pointer ${row}${
                      groupActive ? 'text-white' : off
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <i className={`bi bi-${item.icon} text-base`} />
                      <span>{item.label}</span>
                    </span>
                    <i
                      className={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden pl-9 pr-2 space-y-1 py-0.5">
                      {item.children.map((child) => {
                        const active = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? 'page' : undefined}
                            className={`block py-1.5 px-2 rounded text-xs transition-colors ${
                              active
                                ? 'text-white bg-white/10 font-semibold'
                                : 'text-white/75 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return renderItem(item);
          })}

        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Buka atau tutup menu"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
            >
              <i className="bi bi-list text-xl" />
            </button>
            <div className="relative hidden sm:block w-72 md:w-96">
              <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
              <input
                type="search"
                list="navList"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                aria-label="Cari data di halaman ini atau ketik nama halaman lalu Enter"
                placeholder="Cari data atau ketik nama halaman..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-sri-green focus:ring-2 focus:ring-sri-green/15 transition-colors"
              />
              <datalist id="navList">
                {FLAT_NAV.map((item) => (
                  <option key={item.href} value={item.label} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-slate-50 min-h-11"
              >
                <span className="w-9 h-9 rounded-full bg-sri-sidebar text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  {userInitial}
                </span>
                <span className="hidden md:block leading-tight text-left">
                  <span className="block text-sm font-bold text-slate-800">
                    {userName}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {userRole}
                  </span>
                </span>
                <i
                  className={`bi bi-chevron-down text-xs text-slate-500 transition-transform ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Menu akun"
                  className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {userName}
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      {sessionUser?.email || 'Email belum tersedia'}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {userRole}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/pengaturan"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <i className="bi bi-gear-fill text-slate-500" />
                    Pengaturan akun
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 border-t border-slate-100"
                  >
                    <i className="bi bi-box-arrow-right" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

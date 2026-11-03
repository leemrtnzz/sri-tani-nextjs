'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import anime from 'animejs';
import { NAV } from '@/lib/data';

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
  const [laporanOpen, setLaporanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const flatNav = (NAV as any[]).flatMap((i: any) => i.children || [i]);

  const userName =
    (session?.user as any)?.nama ||
    session?.user?.name ||
    (session?.user as any)?.username ||
    'Pengguna';

  const userRole =
    (session?.user as any)?.role === 'admin'
      ? 'Administrator'
      : (session?.user as any)?.role === 'petugas'
      ? 'Petugas Lapangan'
      : 'User Mitra';

  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const isSubActive = (NAV as any[])
      .find((g: any) => g.children)
      ?.children?.some((c: any) => pathname === c.href);
    if (isSubActive) setLaporanOpen(true);
    setMobileOpen(false);
    setSearchQuery('');
  }, [pathname]);

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const q = val.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('[data-row]').forEach((r) => {
      const hit = r.textContent?.toLowerCase().includes(q);
      r.classList.toggle('hidden', !hit);
      if (hit) shown++;
    });
    document.getElementById('emptyState')?.classList.toggle('hidden', shown > 0 || !q);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const hit = flatNav.find(
      (i: any) => i.label.toLowerCase() === searchQuery.trim().toLowerCase()
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

  return (
    <div className="flex min-h-screen w-full relative">
      {/* Overlay Mobile */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <aside
  onTransitionEnd={(e) => {
    if (e.propertyName === 'margin-left') window.dispatchEvent(new Event('resize'));
  }}
  className={`w-[250px] shrink-0 bg-sri-sidebar text-white flex flex-col fixed lg:sticky lg:top-0 lg:h-screen lg:self-start inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
    mobileOpen ? 'translate-x-0' : '-translate-x-full'
  } ${
    desktopCollapsed ? 'lg:-translate-x-full lg:-ml-[250px]' : 'lg:translate-x-0 lg:ml-0'
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
            <div className="text-base font-bold tracking-wide leading-tight">SRI TANI</div>
            <span className="text-xs text-white/70 block">Pertanian Terpadu</span>
          </div>
        </Link>

        <nav className="p-3 flex-1 flex flex-col space-y-1 overflow-y-auto" aria-label="Menu utama">
          {(NAV as any[]).map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="nav-item">
                  <button
                    type="button"
                    aria-expanded={laporanOpen}
                    onClick={() => setLaporanOpen((prev) => !prev)}
                    className={`w-full justify-between cursor-pointer ${row}${off}`}
                  >
                    <span className="flex items-center gap-3">
                      <i className={`bi bi-${item.icon} text-base`} />
                      <span>{item.label}</span>
                    </span>
                    <i
                      className={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                        laporanOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      laporanOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden pl-9 pr-2 space-y-1 py-0.5">
                      {item.children.map((c: any) => {
                        const act = pathname === c.href;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            aria-current={act ? 'page' : undefined}
                            className={`block py-1.5 px-2 rounded text-xs transition-colors ${
                              act
                                ? 'text-white bg-white/10 font-semibold'
                                : 'text-white/75 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const act = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={act ? 'page' : undefined}
                className={`nav-item ${row}${act ? on : off}`}
              >
                <i className={`bi bi-${item.icon} text-base`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto sticky bottom-0 bg-sri-sidebar pt-3 pb-3 -mb-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full text-left cursor-pointer ${row}${off}`}
            >
              <i className="bi bi-box-arrow-right text-base text-red-300" />
              <span>Keluar</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
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
                {flatNav.map((i: any) => (
                  <option key={i.href} value={i.label} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sri-sidebar text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                {userInitial}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-bold text-slate-800">{userName}</div>
                <div className="text-[11px] text-slate-500">{userRole}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}


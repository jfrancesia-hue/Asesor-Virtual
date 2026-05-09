'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, MessageCircle, FileText, Shield, LayoutDashboard,
  Settings, LogOut, Scale, X, Menu, Bell, History,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore, useAlertsStore } from '@/stores';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/home', icon: Home, label: 'Asesores' },
  { href: '/advisor', icon: MessageCircle, label: 'Chat IA' },
  { href: '/conversations', icon: History, label: 'Historial' },
  { href: '/contracts', icon: FileText, label: 'Contratos' },
  { href: '/analysis', icon: Shield, label: 'Análisis' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel', showBadge: true },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout } = useAuthStore();
  const { unreadCount } = useAlertsStore();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-[rgba(188,102,27,0.55)] bg-gradient-to-b from-[#C85F12] via-[#E46F17] to-[#A94D0D] text-white shadow-[18px_0_50px_rgba(188,102,27,0.16)]">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/18 px-5 py-5">
        <Link href="/home" onClick={onClose} className="flex items-center gap-3 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#BC661B] shadow-soft transition-transform group-hover:scale-105"
          >
            <Scale className="w-4.5 h-4.5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold leading-none tracking-tight text-white">MiAsesor</p>
            <p className="mt-1 text-[11px] font-semibold capitalize tracking-wide text-white/72">
              Plan {tenant?.plan || 'start'}
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/12 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, showBadge }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
                active
                  ? 'bg-white text-[#9A470D] shadow-soft'
                  : 'text-white/82 hover:bg-white/13 hover:text-white',
              )}
            >
              <Icon className={clsx('w-[18px] h-[18px] flex-shrink-0', active ? 'text-[#BC661B]' : 'text-white/82')} strokeWidth={2.2} />
              <span>{label}</span>
              {showBadge && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-[#BC661B]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-white/18 px-3 py-3">
        <Link
          href="/alerts"
          onClick={onClose}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
            pathname === '/alerts'
              ? 'bg-white text-[#9A470D]'
              : 'text-white/82 hover:bg-white/13 hover:text-white',
          )}
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Alertas
          {unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-[#BC661B]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
            pathname === '/settings'
              ? 'bg-white text-[#9A470D]'
              : 'text-white/82 hover:bg-white/13 hover:text-white',
          )}
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Configuración
        </Link>

        {/* User card */}
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/18 bg-white/12 px-3 py-3 backdrop-blur">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#BC661B] shadow-soft"
            aria-hidden="true"
          >
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold leading-tight text-white">{user?.fullName || 'Usuario'}</p>
            <p className="mt-0.5 truncate text-[11px] capitalize text-white/68">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 text-white/68 transition-colors hover:bg-white/14 hover:text-white"
          >
            <LogOut className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const { loadUnreadCount } = useAlertsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Cierra el drawer al cambiar de ruta en mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-[240px] z-30">
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2 text-[var(--text-medium)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
            aria-hidden="true"
          >
            <Scale className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-[var(--text-strong)] text-[14.5px] tracking-tight">MiAsesor</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-[var(--text-strong)]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[280px] h-full shadow-strong">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

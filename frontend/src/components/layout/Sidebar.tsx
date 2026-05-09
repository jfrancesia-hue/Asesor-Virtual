'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, MessageCircle, FileText, Shield, LayoutDashboard,
  Settings, LogOut, Sparkles, X, Menu, Bell, History,
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
    <aside className="flex flex-col h-full w-full bg-[var(--surface)]/95 backdrop-blur-xl border-r border-[var(--border)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/home" onClick={onClose} className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-soft transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #E46F17, #A94D0D)' }}
          >
            <Sparkles className="w-4.5 h-4.5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-[var(--text-strong)] text-[15px] leading-none tracking-tight">MiAsesor</p>
            <p className="text-[11px] font-medium text-[var(--cta-dark)] mt-1 capitalize tracking-wide">
              Plan {tenant?.plan || 'start'}
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] rounded-lg md:hidden transition-colors"
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
                  ? 'bg-[#E46F17] text-white shadow-[0_8px_22px_rgba(188,102,27,0.24)]'
                  : 'text-[var(--text-medium)] hover:bg-[#FBE3CF] hover:text-[#9A470D]',
              )}
            >
              <Icon className={clsx('w-[18px] h-[18px] flex-shrink-0', active ? 'text-white' : 'text-[#BC661B]')} strokeWidth={2.2} />
              <span>{label}</span>
              {showBadge && unreadCount > 0 && (
                <span className="ml-auto bg-white text-[#BC661B] text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[var(--border)] space-y-1">
        <Link
          href="/alerts"
          onClick={onClose}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
            pathname === '/alerts'
              ? 'bg-[#E46F17] text-white'
              : 'text-[var(--text-medium)] hover:bg-[#FBE3CF] hover:text-[#9A470D]',
          )}
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Alertas
          {unreadCount > 0 && (
            <span className="ml-auto bg-[#E46F17] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
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
              ? 'bg-[#E46F17] text-white'
              : 'text-[var(--text-medium)] hover:bg-[#FBE3CF] hover:text-[#9A470D]',
          )}
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Configuración
        </Link>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-soft"
            style={{ background: 'linear-gradient(135deg, #E46F17, #A94D0D)' }}
            aria-hidden="true"
          >
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-[var(--text-strong)] truncate leading-tight">{user?.fullName || 'Usuario'}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate capitalize mt-0.5">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
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
            <Sparkles className="w-4 h-4" strokeWidth={2.4} />
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

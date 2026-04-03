'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores';
import { Spinner } from '@/components/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadProfile } = useAuthStore();

  useEffect(() => {
    loadProfile().then(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.push('/auth/login');
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* Desktop: margin for fixed sidebar. Mobile: padding-top for top bar */}
      <main className="flex-1 md:ml-[240px] pt-14 md:pt-0 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}

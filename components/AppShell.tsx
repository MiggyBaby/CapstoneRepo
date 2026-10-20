'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const isLoginPage = usePathname() === '/login';

  useEffect(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('dpwh-website-preferences') || '{}');
      document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    } catch {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import ToastContainer from '@/components/Toast';
import Link from 'next/link';

const PAGE_LABELS: Record<string, string> = {
  '/feed': 'Feed', '/explore': 'Explorar', '/sprints': 'Sprints',
  '/communities': 'Clubes', '/map': 'Mapa', '/chat': 'Chat',
  '/profile': 'Garagem', '/ranking': 'Ranking', '/battles': 'Battles',
  '/rivals': 'Rivals', '/marketplace': 'Mercado', '/live': 'Live',
  '/achievements': 'Troféus', '/settings': 'Config', '/notifications': 'Notificações',
};

const FULLSCREEN = ['/map'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem('usuario_logado');
    if (!user) router.replace('/login');
  }, []);

  const basePath = '/' + pathname.split('/').filter(Boolean)[0];
  const label = PAGE_LABELS[basePath] || 'GearHub';
  const isFullscreen = FULLSCREEN.includes(basePath);

  return (
    <div id="app">
      <div className="app-layout">
        <Sidebar />
        <div className="app-main" id="main-scroll">
          <div className="app-topbar hide-mobile">
            <span className="topbar-title">{label}</span>
            <div className="topbar-actions">
              <Link href="/achievements" className="topbar-btn hide-mobile" title="Troféus">
                <span className="material-symbols-outlined">military_tech</span>
              </Link>
              <Link href="/notifications" className="topbar-btn hide-mobile" title="Notificações">
                <span className="material-symbols-outlined">notifications</span>
                <span className="notif-dot" />
              </Link>
            </div>
          </div>
          <div className={`app-content page-enter${isFullscreen ? ' fullscreen-page' : ''}`}>
            {children}
          </div>
        </div>
      </div>
      <MobileNav />
      <ToastContainer />
    </div>
  );
}

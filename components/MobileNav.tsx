'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const MAIN_NAV = [
  { href: '/feed',    icon: 'home',       label: 'Feed' },
  { href: '/explore', icon: 'search',     label: 'Explorar' },
  { href: '/map',     icon: 'map',        label: 'Mapa' },
  { href: '/profile', icon: 'garage',     label: 'Garagem' },
];

const DRAWER_NAV = [
  { href: '/sprints',      icon: 'bolt',          label: 'Sprints' },
  { href: '/communities',  icon: 'groups',        label: 'Clubes' },
  { href: '/chat',         icon: 'chat_bubble',   label: 'Chat' },
  { href: '/ranking',      icon: 'emoji_events',  label: 'Ranking' },
  { href: '/battles',      icon: 'swords',        label: 'Battles' },
  { href: '/marketplace',  icon: 'shopping_bag',  label: 'Mercado' },
  { href: '/live',         icon: 'live_tv',       label: 'Live' },
  { href: '/achievements', icon: 'military_tech', label: 'Troféus' },
  { href: '/notifications',icon: 'notifications', label: 'Avisos' },
  { href: '/settings',     icon: 'settings',      label: 'Config' },
  { href: '/rivals',       icon: 'swords',        label: 'Rivals' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="m-topbar">
        <div className="m-logo">
          <span className="material-symbols-outlined">directions_car</span>
          GearHub
        </div>
        <div className="m-topbar-right">
          <Link href="/achievements" className="topbar-btn"><span className="material-symbols-outlined">military_tech</span></Link>
          <Link href="/notifications" className="topbar-btn"><span className="material-symbols-outlined">notifications</span><span className="notif-dot" /></Link>
        </div>
      </div>

      <div className="m-bottomnav">
        {MAIN_NAV.map(n => (
          <Link key={n.href} href={n.href} className={`bnav-item${pathname === n.href ? ' active' : ''}`}>
            <span className="material-symbols-outlined">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
        <button className={`bnav-fab${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {open && (
        <>
          <div className="m-overlay" onClick={() => setOpen(false)} />
          <div className="m-drawer">
            <div className="drawer-grid">
              {DRAWER_NAV.map(n => (
                <Link key={n.href} href={n.href} className="drawer-item" onClick={() => setOpen(false)}>
                  <span className="material-symbols-outlined">{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

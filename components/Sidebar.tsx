'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/feed',         icon: 'home',          label: 'Feed',       group: 'PRINCIPAL' },
  { href: '/explore',      icon: 'search',         label: 'Explorar',   group: 'PRINCIPAL' },
  { href: '/sprints',      icon: 'bolt',           label: 'Sprints',    group: 'PRINCIPAL' },
  { href: '/communities',  icon: 'groups',         label: 'Clubes',     group: 'COMUNIDADE' },
  { href: '/map',          icon: 'map',            label: 'Mapa',       group: 'COMUNIDADE' },
  { href: '/chat',         icon: 'chat_bubble',    label: 'Chat',       group: 'COMUNIDADE' },
  { href: '/profile',      icon: 'garage',         label: 'Garagem',    group: 'PESSOAL' },
  { href: '/ranking',      icon: 'emoji_events',   label: 'Ranking',    group: 'PESSOAL' },
  { href: '/battles',      icon: 'swords',         label: 'Battles',    group: 'PESSOAL' },
  { href: '/marketplace',  icon: 'shopping_bag',   label: 'Mercado',    group: 'MAIS' },
  { href: '/live',         icon: 'live_tv',        label: 'Live',       group: 'MAIS' },
  { href: '/achievements', icon: 'military_tech',  label: 'Troféus',    group: 'MAIS' },
  { href: '/settings',     icon: 'settings',       label: 'Config',     group: 'MAIS' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } })() : null;

  const groups = [...new Set(NAV.map(n => n.group))];

  function handleLogout() {
    localStorage.removeItem('usuario_logado');
    router.push('/login');
  }

  return (
    <div className="app-sidebar">
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => router.push('/feed')}>
          <span className="material-symbols-outlined logo-icon">directions_car</span>
          <span className="logo-text">GearHub</span>
        </div>

        <nav className="sidebar-nav">
          {groups.map(group => (
            <div key={group}>
              <div className="nav-group-label">{group}</div>
              {NAV.filter(n => n.group === group).map(n => (
                <Link key={n.href} href={n.href} className={`nav-item${pathname === n.href || pathname.startsWith(n.href + '/') ? ' active' : ''}`}>
                  <span className="material-symbols-outlined nav-icon">{n.icon}</span>
                  <span className="nav-label">{n.label}</span>
                </Link>
              ))}
              <div className="nav-sep" />
            </div>
          ))}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user-btn" onClick={handleLogout} title="Sair">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=ef4444&color=fff`} alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=ef4444&color=fff`; }} />
              <div className="sidebar-user-info">
                <div className="uname">{user.nome}</div>
                <div className="ulevel">Nível {user.nivel || 1} · {user.xp || 0} XP</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

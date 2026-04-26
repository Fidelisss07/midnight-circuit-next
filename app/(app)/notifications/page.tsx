'use client';
import { useEffect, useState } from 'react';
import { timeAgo, avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const NOTIF_ICONS: Record<string, string> = {
  like: 'favorite', comment: 'chat_bubble', follow: 'person_add',
  race_invite: 'flag', mention: 'alternate_email',
};

export default function NotificationsPage() {
  const user = getUser();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notificacoes?user=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setNotifs);
    fetch('/api/notificacoes/ler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: user.email }) });
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '24px' }}>🔔 NOTIFICAÇÕES</h1>
      {notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--t-dim)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>notifications_off</span>
          Nenhuma notificação
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifs.map((n: any) => (
            <div key={n.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: n.lida ? 0.6 : 1 }}>
              <img src={n.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(n.de || '?'); }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>{n.de} </span>
                <span style={{ fontSize: '13px', color: 'var(--t-mid)' }}>{n.texto}</span>
                <div style={{ fontSize: '10px', color: 'var(--t-dim)', marginTop: '2px' }}>{timeAgo(n.created_at)}</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--c-fire2)', flexShrink: 0 }}>{NOTIF_ICONS[n.tipo] || 'notifications'}</span>
              {!n.lida && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--c-fire2)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

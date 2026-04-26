'use client';
import { useEffect, useState } from 'react';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const ACHIEVEMENTS = [
  { id: 'first_post',    icon: '📸', title: 'Primeiro Post',       desc: 'Publicaste o teu primeiro post',    xp: 50  },
  { id: 'first_follow',  icon: '👥', title: 'Primeiro Follow',     desc: 'Seguiste outro piloto',             xp: 20  },
  { id: 'first_car',     icon: '🚗', title: 'Garagem Aberta',      desc: 'Adicionaste o teu primeiro carro',  xp: 100 },
  { id: 'win_battle',    icon: '🏆', title: 'Vitória em Battle',   desc: 'O teu carro ganhou uma battle',     xp: 80  },
  { id: 'join_club',     icon: '🏎️', title: 'Membro de Clube',     desc: 'Entraste numa comunidade',          xp: 30  },
  { id: 'spot_add',      icon: '📍', title: 'Explorador',          desc: 'Adicionaste um spot no mapa',       xp: 40  },
  { id: 'first_sprint',  icon: '⚡', title: 'Primeiro Sprint',     desc: 'Publicaste o teu primeiro vídeo',   xp: 60  },
  { id: 'level_5',       icon: '🎯', title: 'Nível 5',             desc: 'Chegaste ao nível 5',               xp: 200 },
  { id: 'level_10',      icon: '💎', title: 'Veterano',            desc: 'Chegaste ao nível 10',              xp: 500 },
  { id: 'market_sell',   icon: '💰', title: 'Vendedor',            desc: 'Publicaste um anúncio no mercado',  xp: 25  },
];

export default function AchievementsPage() {
  const user = getUser();
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const key = `achievements_${user.email}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    setUnlocked(stored);
  }, []);

  const total = ACHIEVEMENTS.length;
  const done = unlocked.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '8px' }}>🏅 TROFÉUS</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '6px', background: 'var(--b-dim)', borderRadius: '99px', overflow: 'hidden' }}>
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--c-fire2)' }}>{done}/{total}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
        {ACHIEVEMENTS.map(a => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <div key={a.id} className={`card${isUnlocked ? ' achievement-unlocked' : ''}`} style={{ padding: '16px', opacity: isUnlocked ? 1 : 0.45, transition: 'all 0.3s', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{a.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', marginBottom: '4px' }}>{a.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--t-mid)', marginBottom: '8px' }}>{a.desc}</div>
              <div className="badge badge-fire" style={{ fontSize: '10px' }}>+{a.xp} XP</div>
              {isUnlocked && <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--c-fire2)', fontWeight: 700 }}>✓ DESBLOQUEADO</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

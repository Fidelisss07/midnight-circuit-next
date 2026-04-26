'use client';
import { useState, useEffect } from 'react';
import { formatNumber, getTier } from '@/lib/utils';
import { avatarFallback } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function RankingPage() {
  const user = getUser();
  const router = useRouter();
  const [tab, setTab] = useState<'xp'|'semanal'>('xp');
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => { loadRanking(); }, [tab]);

  async function loadRanking() {
    const res = await fetch(tab === 'semanal' ? '/api/leaderboard/semanal' : '/api/ranking');
    setRanking(await res.json());
  }

  const xpKey = tab === 'semanal' ? 'xp_semanal' : 'xp';
  const myEntry = ranking.find(u => u.email === user?.email);
  const myTier = getTier(myEntry?.nivel || 1);
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div>
      <style>{`
        @keyframes rankIn { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
        @keyframes tierGlow { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        .rank-card { animation: rankIn 0.35s ease both; }
        .tier-badge { animation: tierGlow 2.5s ease infinite; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>⚡ RANKING</h1>
        {myTier && (
          <span className="tier-badge" style={{ fontSize: '13px', fontWeight: 800, color: myTier.color, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 12px', borderRadius: '99px', border: `1px solid ${myTier.color}40`, background: `${myTier.color}15` }}>
            {myTier.icon} {myTier.label}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-pit)', borderRadius: 'var(--r-md)', padding: '4px' }}>
        {([['xp', '🏆 XP Total'], ['semanal', '🔥 Esta Semana']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--c-fire2)' : 'none', color: tab === t ? '#000' : 'var(--t-mid)' }}>{l}</button>
        ))}
      </div>

      {/* Podium */}
      {top3.length >= 3 && (() => {
        const order = [top3[1], top3[0], top3[2]];
        const heights = ['110px', '140px', '100px'];
        const labels = ['🥈 2º', '🥇 1º', '🥉 3º'];
        const glows = ['#94a3b8', '#f59e0b', '#b45309'];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {order.map((u, i) => (
              <div key={u.email} className="card" style={{ padding: '16px 12px', textAlign: 'center', cursor: 'pointer', alignSelf: 'flex-end', minHeight: heights[i], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', borderColor: `${glows[i]}30`, boxShadow: `0 0 20px ${glows[i]}20` }} onClick={() => router.push(`/profile/${encodeURIComponent(u.email)}`)}>
                <img src={u.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${glows[i]}` }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(u.nome); }} />
                <div style={{ fontWeight: 800, fontSize: '12px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: glows[i] }}>{formatNumber(u[xpKey] || u.xp || 0)} XP</div>
                <div style={{ fontSize: '16px' }}>{labels[i]}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Rest */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rest.map((u: any, i: number) => {
          const pos = i + 4;
          const tier = getTier(u.nivel || 1);
          const isMe = u.email === user?.email;
          return (
            <div key={u.email} className="card rank-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', animationDelay: `${i*0.04}s`, ...(isMe ? { borderColor: 'var(--c-fire2)', boxShadow: '0 0 14px rgba(255,112,32,0.2)' } : {}) }} onClick={() => router.push(`/profile/${encodeURIComponent(u.email)}`)}>
              <span style={{ fontSize: '13px', fontWeight: 800, minWidth: '28px', textAlign: 'center', color: 'var(--t-dim)', fontFamily: 'var(--f-display)' }}>#{pos}</span>
              <img src={u.avatar} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${tier.color}50` }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(u.nome); }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', ...(isMe ? { color: 'var(--c-fire2)' } : {}), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome} {isMe ? '(Tu)' : ''}</div>
                <div style={{ fontSize: '10px', color: 'var(--t-dim)' }}>Nível {u.nivel || 1} · <span style={{ color: tier.color }}>{tier.icon} {tier.label}</span></div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '15px', fontFamily: 'var(--f-display)', color: 'var(--c-fire2)' }}>{formatNumber(u[xpKey] || u.xp || 0)}</div>
                <div style={{ fontSize: '10px', color: 'var(--t-dim)' }}>XP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

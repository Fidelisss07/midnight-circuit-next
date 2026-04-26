'use client';
import { useState, useEffect } from 'react';
import { avatarFallback } from '@/lib/utils';

export default function BattlesPage() {
  const [par, setPar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  useEffect(() => { loadPar(); }, []);

  async function loadPar() {
    setLoading(true); setVoted(false);
    try { const res = await fetch('/api/rivals/par'); const data = await res.json(); setPar(data); } catch {}
    setLoading(false);
  }

  async function votar(vencedorId: string, perdedorId: string) {
    setVoted(true);
    await fetch('/api/rivals/votar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vencedorId, perdedorId }) });
    setTimeout(loadPar, 800);
  }

  if (loading || par.length < 2) return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '20px' }}>⚔️ BATTLES</h1>
      <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--r-xl)' }} />
    </div>
  );

  const [c1, c2] = par;
  return (
    <div>
      <style>{`
        @keyframes battleSlideL { from{opacity:0;transform:translateX(-60px) scale(0.92)} to{opacity:1;transform:none} }
        @keyframes battleSlideR { from{opacity:0;transform:translateX(60px) scale(0.92)} to{opacity:1;transform:none} }
        @keyframes vsPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.25) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes votePulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.7)} 70%{box-shadow:0 0 0 14px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
      `}</style>

      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '8px' }}>⚔️ BATTLES</h1>
      <p style={{ color: 'var(--t-mid)', fontSize: '13px', marginBottom: '24px' }}>Qual ganha? Vota na tua máquina favorita.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        {[c1, c2].map((c, ci) => (
          <div key={c.id} className="card battle-car" style={{ overflow: 'hidden', animation: ci === 0 ? 'battleSlideL 0.5s ease both' : 'battleSlideR 0.5s ease both' }}>
            <div style={{ height: '200px', background: `url('${c.imagem_url || c.imagemUrl}') center/cover`, backgroundColor: 'var(--bg-lift)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px' }}>
                <div style={{ fontWeight: 900, fontSize: '14px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', color: 'white' }}>{c.modelo}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{c.marca}</div>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <img src={c.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(c.dono || '?'); }} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{c.dono}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--t-dim)' }}>{c.votos || 0} votos</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', animation: voted ? 'votePulse 0.6s ease' : 'none' }} onClick={() => votar(c.id, ci === 0 ? c2.id : c1.id)} disabled={voted}>
                {voted ? '✅ Votado!' : '🏆 Votar'}
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'vsPop 0.5s 0.3s ease both', opacity: 0 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: '32px', fontWeight: 900, fontStyle: 'italic', color: 'var(--c-fire2)', textShadow: '0 0 20px var(--c-fire)' }}>VS</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-outline" onClick={loadPar}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shuffle</span> Próxima Battle</button>
      </div>
    </div>
  );
}

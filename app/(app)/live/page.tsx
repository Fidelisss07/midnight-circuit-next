'use client';
import { useState, useEffect } from 'react';
import { avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function LivePage() {
  const user = getUser();
  const [lives, setLives] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [chatMsgs, setChatMsgs] = useState([
    { nome: 'Carlos', texto: '🔥 Que máquina!', color: '#ff7020' },
    { nome: 'Ana', texto: 'Que motor incrível!! 😍', color: '#a78bfa' },
    { nome: 'Miguel', texto: 'Quero esse escape 💨', color: '#00e5cc' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<{id: number; emoji: string}[]>([]);

  useEffect(() => { loadLives(); }, []);

  async function loadLives() {
    const res = await fetch('/api/lives');
    const data = await res.json();
    if (data.length === 0) {
      setLives([
        { id: '1', titulo: '🔥 Tune da minha BMW', nome_autor: 'GearHead', viewers: 142 },
        { id: '2', titulo: 'Build ao vivo — Civic EK9', nome_autor: 'TurboKing', viewers: 89 },
        { id: '3', titulo: 'Drift session na pista', nome_autor: 'DriftMaster', viewers: 234 },
      ]);
    } else setLives(data);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    const colors = ['#ff7020','#a78bfa','#00e5cc','#f59e0b','#ef4444'];
    setChatMsgs(prev => {
      const next = [...prev, { nome: user?.nome || 'Tu', texto: chatInput, color: colors[Math.floor(Math.random() * colors.length)] }];
      return next.slice(-5);
    });
    setChatInput('');
  }

  function sendReaction(emoji: string) {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2000);
  }

  return (
    <div>
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-120px) scale(1.4);opacity:0} }
        @keyframes chatIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:none} }
        .reaction-float { animation: floatUp 1.8s ease forwards; position:absolute; bottom:20px; font-size:28px; pointer-events:none; }
        .chat-msg { animation: chatIn 0.3s ease; }
      `}</style>

      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '24px' }}>📡 LIVE</h1>

      {!activeRoom ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
            {lives.map(l => (
              <div key={l.id} className="card card-lift" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setActiveRoom(l)}>
                <div style={{ height: '160px', background: 'linear-gradient(135deg,var(--bg-lift),var(--bg-panel))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--c-fire2)', opacity: 0.3 }}>live_tv</span>
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}><span className="live-badge">LIVE</span></div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>👁 {l.viewers || Math.floor(Math.random() * 200) + 10}</div>
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', marginBottom: '6px' }}>{l.titulo}</div>
                  <div style={{ fontSize: '12px', color: 'var(--t-mid)' }}>por {l.nome_autor}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-panel)', borderRadius: 'var(--r-lg)', border: '1px solid var(--b-fire)', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--c-fire2)', display: 'block', marginBottom: '12px' }}>live_tv</span>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Vai ao Vivo</h3>
            <p style={{ color: 'var(--t-mid)', fontSize: '13px', marginBottom: '16px' }}>Mostra o teu build em direto</p>
            <button className="btn-race" onClick={async () => { await fetch('/api/lives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: `Live de ${user?.nome}`, email_autor: user?.email, nome_autor: user?.nome, avatar: user?.avatar }) }); loadLives(); }}>
              <span className="material-symbols-outlined">fiber_manual_record</span> Começar Live
            </button>
          </div>
        </>
      ) : (
        <div style={{ position: 'relative', height: 'calc(100vh - 160px)', minHeight: '500px', background: 'linear-gradient(135deg,var(--bg-void),var(--bg-pit))', borderRadius: 'var(--r-lg)', border: '1px solid var(--b-fire)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: '14px', left: '14px', right: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <div>
              <span className="live-badge">LIVE</span>
              <div style={{ fontWeight: 800, fontSize: '16px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', marginTop: '6px' }}>{activeRoom.titulo}</div>
              <div style={{ fontSize: '11px', color: 'var(--t-mid)' }}>por {activeRoom.nome_autor}</div>
            </div>
            <button className="btn btn-outline" onClick={() => setActiveRoom(null)}><span className="material-symbols-outlined">close</span></button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', color: 'var(--c-fire2)', opacity: 0.15 }}>live_tv</span>
          </div>

          {/* Reactions */}
          <div style={{ position: 'absolute', right: '20px', bottom: '120px', width: '60px', height: '200px', pointerEvents: 'none' }}>
            {reactions.map(r => (
              <span key={r.id} className="reaction-float" style={{ right: `${Math.random() * 40}px` }}>{r.emoji}</span>
            ))}
          </div>

          {/* Chat */}
          <div style={{ position: 'absolute', left: '14px', bottom: '80px', width: '260px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {chatMsgs.map((m, i) => (
              <div key={i} className="chat-msg" style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: m.color, marginRight: '6px' }}>{m.nome}</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{m.texto}</span>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px', background: 'rgba(4,4,10,0.95)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input className="input" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} placeholder="Diz algo..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChat(); }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {['🔥','❤️','💨','🏁','😱','👑'].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} style={{ fontSize: '18px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-sm)', transition: 'transform 0.15s' }}>{emoji}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

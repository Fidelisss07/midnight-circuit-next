'use client';
import { useEffect, useState, useRef } from 'react';
import { timeAgo, avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function ChatPage() {
  const user = getUser();
  const [amigos, setAmigos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/amigos?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setAmigos);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = () => fetch(`/api/chat/mensagens?eu=${encodeURIComponent(user.email)}&outro=${encodeURIComponent(selected.email)}`).then(r => r.json()).then(setMsgs);
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send() {
    if (!text.trim() || !selected) return;
    const t = text; setText('');
    await fetch('/api/chat/mensagens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ de: user.email, para: selected.email, texto: t }) });
    setMsgs(prev => [...prev, { de: user.email, para: selected.email, texto: t, created_at: new Date().toISOString() }]);
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '16px' }}>
      {/* Contacts */}
      <div className="card" style={{ width: '240px', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--b-dim)', fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>💬 Chat</div>
        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {amigos.length === 0 && <div style={{ padding: '20px', color: 'var(--t-dim)', fontSize: '12px', textAlign: 'center' }}>Segue outros pilotos para chattar!</div>}
          {amigos.map(a => (
            <div key={a.email} onClick={() => setSelected(a)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: selected?.email === a.email ? 'rgba(255,112,32,0.1)' : 'transparent', borderLeft: selected?.email === a.email ? '2px solid var(--c-fire2)' : '2px solid transparent', transition: 'all 0.15s' }}>
              <img src={a.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(a.nome); }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                <div style={{ fontSize: '10px', color: 'var(--t-dim)' }}>Nível {a.nivel || 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-dim)', flexDirection: 'column', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>chat_bubble</span>
            <span style={{ fontSize: '13px' }}>Seleciona um piloto</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b-dim)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={selected.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(selected.nome); }} />
              <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--f-display)', textTransform: 'uppercase' }}>{selected.nome}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
              {msgs.map((m: any, i: number) => {
                const isMe = m.de === user.email;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMe ? 'linear-gradient(135deg,var(--c-fire),var(--c-fire2))' : 'var(--bg-lift)', color: isMe ? '#000' : 'var(--t-white)', fontSize: '13px', fontWeight: isMe ? 600 : 400 }}>
                      {m.texto}
                      <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '3px', textAlign: 'right' }}>{timeAgo(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgsEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--b-dim)', display: 'flex', gap: '8px' }}>
              <input className="input" style={{ flex: 1 }} placeholder="Mensagem..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} />
              <button className="btn btn-primary" onClick={send}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

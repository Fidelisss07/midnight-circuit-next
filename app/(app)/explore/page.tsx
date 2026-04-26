'use client';
import { useState, useEffect, useRef } from 'react';
import { CAR_BRANDS, avatarFallback } from '@/lib/utils';
import { showToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function ExplorePage() {
  const user = getUser();
  const router = useRouter();
  const [tab, setTab] = useState<'pilotos'|'carros'>('pilotos');
  const [brand, setBrand] = useState('Todos');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any>({ usuarios: [], carros: [] });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { search(); }, [tab, brand]);

  function search() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/pesquisa?q=${encodeURIComponent(q || ' ')}`);
      setResults(await res.json());
    }, 200);
  }

  async function toggleFollow(email: string, currentlyFollowing: boolean) {
    const res = await fetch('/api/seguir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eu: user.email, ele: email }) });
    if (res.ok) { showToast(currentlyFollowing ? 'Deixou de seguir' : 'A seguir!'); search(); }
  }

  const pilotos = (results.usuarios || []).filter((u: any) => u.email !== user?.email);
  let carros = results.carros || [];
  if (brand !== 'Todos') carros = carros.filter((c: any) => (c.marca || '').toLowerCase().includes(brand.toLowerCase()) || (c.modelo || '').toLowerCase().includes(brand.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '16px' }}>🔍 EXPLORAR</h1>
        <div className="input-group" style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '22px', color: 'var(--t-dim)', pointerEvents: 'none' }}>search</span>
          <input type="text" className="input" value={q} onChange={e => { setQ(e.target.value); search(); }} style={{ padding: '14px 14px 14px 46px', fontSize: '14px' }} placeholder={tab === 'pilotos' ? 'Pesquisar piloto...' : 'Pesquisar carro ou marca...'} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-pit)', borderRadius: 'var(--r-md)', padding: '4px' }}>
        {(['pilotos', 'carros'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--c-fire2)' : 'none', color: tab === t ? '#000' : 'var(--t-mid)' }}>
            {t === 'pilotos' ? '👤 Pilotos' : '🚗 Garagens'}
          </button>
        ))}
      </div>

      {tab === 'carros' && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '18px' }} className="no-scrollbar">
          {CAR_BRANDS.map(b => (
            <button key={b} onClick={() => setBrand(b)} style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${b === brand ? 'var(--c-fire2)' : 'var(--b-mid)'}`, background: b === brand ? 'var(--c-fire2)' : 'transparent', color: b === brand ? '#000' : 'var(--t-mid)', cursor: 'pointer' }}>
              {b}
            </button>
          ))}
        </div>
      )}

      {tab === 'pilotos' && (
        <div>
          {pilotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--t-dim)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>person_search</span>
              {q ? 'Nenhum piloto encontrado.' : 'Começa a pesquisar...'}
            </div>
          ) : pilotos.map((u: any, i: number) => {
            const isFollowing = (user?.seguindo || []).includes(u.email);
            return (
              <div key={u.email} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', marginBottom: '10px', animationDelay: `${i*0.04}s` }} onClick={() => router.push(`/profile/${encodeURIComponent(u.email)}`)}>
                <div style={{ position: 'relative' }}>
                  <img src={u.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--b-mid)' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(u.nome); }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--bg-void)', borderRadius: '99px', padding: '1px 5px', fontSize: '9px', fontWeight: 800, color: 'var(--c-fire2)', border: '1px solid var(--b-dim)' }}>Nv{u.nivel||1}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t-dim)', marginTop: '2px' }}>{u.bio || 'Piloto'}</div>
                </div>
                <button className={`btn ${isFollowing ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '11px', padding: '7px 14px', flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleFollow(u.email, isFollowing); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', verticalAlign: 'middle' }}>{isFollowing ? 'check' : 'person_add'}</span>
                  {isFollowing ? ' Seguindo' : ' Seguir'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'carros' && (
        <div>
          {carros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--t-dim)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>directions_car</span>
              {q || brand !== 'Todos' ? 'Nenhuma máquina encontrada.' : 'Começa a pesquisar...'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
              {carros.map((c: any, i: number) => (
                <div key={c.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer', animationDelay: `${i*0.04}s` }} onClick={() => router.push(`/profile/${encodeURIComponent(c.email_dono)}`)}>
                  <div style={{ height: '150px', background: `url('${c.imagem_url || c.imagemUrl}') center/cover`, backgroundColor: 'var(--bg-lift)', position: 'relative' }}>
                    {(c.specs?.hp || c.specs?.potencia) && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.75)', color: 'var(--c-fire2)', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800 }}>{c.specs.hp || c.specs.potencia} HP</div>}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px' }}>
                      <div style={{ fontWeight: 900, fontSize: '14px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', color: 'white' }}>{c.modelo || 'Sem modelo'}</div>
                      {c.apelido && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>"{c.apelido}"</div>}
                    </div>
                  </div>
                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={c.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(c.dono || '?'); }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.dono || 'Piloto'}</span>
                    <span style={{ fontSize: '10px', color: 'var(--t-dim)' }}>{c.votos || 0} votos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

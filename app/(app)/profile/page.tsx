'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo, formatNumber, avatarFallback, getTier } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function ProfilePage() {
  const user = getUser();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'garage'>('posts');
  const [showAddCar, setShowAddCar] = useState(false);
  const [carForm, setCarForm] = useState({ marca: '', modelo: '', ano: '', cor: '', cv: '', descricao: '' });
  const [carImg, setCarImg] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/perfil/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setProfile);
    fetch(`/api/posts?autor=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setPosts);
    fetch(`/api/garagem/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setCars);
  }, []);

  async function addCar() {
    const fd = new FormData();
    Object.entries(carForm).forEach(([k, v]) => fd.append(k, v as string));
    fd.append('email', user.email);
    if (carImg) fd.append('imagem', carImg);
    await fetch('/api/garagem', { method: 'POST', body: fd });
    showToast('Carro adicionado!');
    setShowAddCar(false);
    fetch(`/api/garagem/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setCars);
  }

  if (!profile) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t-dim)' }}>A carregar...</div>;

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div>
      {/* Cover */}
      <div style={{ height: '180px', background: profile.capa ? `url('${profile.capa}') center/cover` : 'linear-gradient(135deg, var(--c-fire) 0%, var(--c-fire2) 100%)', borderRadius: 'var(--r-md)', marginBottom: '0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
      </div>

      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-48px', marginBottom: '20px', padding: '0 8px' }}>
        <img src={profile.avatar} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--c-fire2)', flexShrink: 0 }} alt=""
          onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
        <div style={{ flex: 1, paddingBottom: '4px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>{profile.nome}</div>
          <div style={{ fontSize: '11px', color: 'var(--t-mid)', marginBottom: '4px' }}>{profile.bio || ''}</div>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}>
            {tier.icon} {tier.label} · Nível {profile.nivel || 1}
          </span>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 14px', marginBottom: '4px' }} onClick={() => router.push('/settings')}>Editar</button>
      </div>

      {/* XP Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t-dim)', marginBottom: '4px' }}>
          <span>{formatNumber(profile.xp || 0)} XP</span>
          <span>Próximo nível: {formatNumber(xpToNext)} XP</span>
        </div>
        <div style={{ height: '4px', background: 'var(--b-dim)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg, var(--c-fire), var(--c-fire2))`, borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Posts', value: formatNumber(posts.length) },
          { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length) },
          { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length) },
          { label: 'Carros', value: formatNumber(cars.length) },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, color: 'var(--c-fire2)' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--t-dim)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid var(--b-dim)' }}>
        {(['posts', 'garage'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 24px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--f-display)', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--c-fire2)' : 'transparent'}`, color: tab === t ? 'var(--c-fire2)' : 'var(--t-mid)', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t === 'posts' ? '📸 Posts' : '🚗 Garage'}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {posts.map((p: any) => (
            <div key={p.id} style={{ aspectRatio: '1', background: `url('${p.imagem_url}') center/cover`, backgroundColor: 'var(--bg-lift)', borderRadius: 'var(--r-sm)', overflow: 'hidden', cursor: 'pointer' }} />
          ))}
          {posts.length === 0 && <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--t-dim)', fontSize: '13px' }}>Nenhum post ainda</div>}
        </div>
      )}

      {tab === 'garage' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary" style={{ fontSize: '11px' }} onClick={() => setShowAddCar(true)}>+ Adicionar Carro</button>
          </div>

          {showAddCar && (
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Novo Carro</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className="input" placeholder="Marca" value={carForm.marca} onChange={e => setCarForm(f => ({ ...f, marca: e.target.value }))} />
                <input className="input" placeholder="Modelo" value={carForm.modelo} onChange={e => setCarForm(f => ({ ...f, modelo: e.target.value }))} />
                <input className="input" placeholder="Ano" value={carForm.ano} onChange={e => setCarForm(f => ({ ...f, ano: e.target.value }))} />
                <input className="input" placeholder="Cor" value={carForm.cor} onChange={e => setCarForm(f => ({ ...f, cor: e.target.value }))} />
                <input className="input" placeholder="CV / BHP" value={carForm.cv} onChange={e => setCarForm(f => ({ ...f, cv: e.target.value }))} />
                <textarea className="input" style={{ gridColumn: '1/-1', resize: 'none', minHeight: '70px' }} placeholder="Descrição / mods" value={carForm.descricao} onChange={e => setCarForm(f => ({ ...f, descricao: e.target.value }))} />
                <label style={{ gridColumn: '1/-1', border: '1px dashed var(--b-mid)', borderRadius: 'var(--r-sm)', padding: '10px', cursor: 'pointer', fontSize: '12px', color: 'var(--t-mid)' }}>
                  {carImg ? carImg.name : '📷 Foto do carro'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCarImg(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={addCar}>Guardar</button>
                <button className="btn btn-ghost" onClick={() => setShowAddCar(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '16px' }}>
            {cars.map((c: any) => (
              <div key={c.id} className="card card-lift" style={{ overflow: 'hidden' }}>
                {c.imagem_url && <div style={{ height: '160px', background: `url('${c.imagem_url}') center/cover`, backgroundColor: 'var(--bg-lift)' }} />}
                <div style={{ padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase' }}>{c.marca} {c.modelo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t-dim)', marginBottom: '6px' }}>{c.ano} · {c.cor}</div>
                  {c.cv && <span className="badge badge-fire" style={{ fontSize: '10px' }}>⚡ {c.cv} CV</span>}
                  {c.descricao && <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginTop: '8px' }}>{c.descricao}</div>}
                </div>
              </div>
            ))}
            {cars.length === 0 && <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--t-dim)', fontSize: '13px' }}>Nenhum carro na garage ainda</div>}
          </div>
        </div>
      )}
    </div>
  );
}

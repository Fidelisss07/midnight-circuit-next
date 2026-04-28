'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { timeAgo, formatNumber, avatarFallback, getTier } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconGarage = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);
const IconCar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconBolt = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);

export default function PublicProfilePage() {
  const { username } = useParams() as { username: string };
  const me = getUser();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'garage'>('posts');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/perfil/username?u=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) { setNotFound(true); return; }
        if (me && me.email === data.email) { router.replace('/profile'); return; }
        setProfile(data);
        if (me) setFollowing((data.seguidores || []).includes(me.email));
        fetch(`/api/posts?autor=${encodeURIComponent(data.email)}`).then(r => r.json()).then(setPosts);
        fetch(`/api/garagem/${encodeURIComponent(data.email)}`).then(r => r.json()).then(setCars);
      });
  }, [username]);

  async function toggleFollow() {
    if (!me) { showToast('Faz login para seguir'); return; }
    setFollowLoading(true);
    const res = await fetch('/api/seguir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eu: me.email, ele: profile.email }) });
    const data = await res.json();
    setFollowing(data.aSeguir);
    setProfile((p: any) => ({
      ...p,
      seguidores: data.aSeguir ? [...(p.seguidores || []), me.email] : (p.seguidores || []).filter((e: string) => e !== me.email),
    }));
    showToast(data.aSeguir ? `A seguir @${profile.username}` : `Deixaste de seguir @${profile.username}`);
    setFollowLoading(false);
  }

  if (notFound) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '48px', fontWeight: 700, color: 'rgba(255,255,255,0.06)', marginBottom: '12px' }}>404</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>@{username} não encontrado</div>
      <button onClick={() => router.back()} style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)', cursor: 'pointer' }}>
        <IconBack /> Voltar
      </button>
    </div>
  );

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--c-fire2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '11px', color: 'var(--t-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>@{username}</span>
    </div>
  );

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* Back */}
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 0', marginBottom: '12px', background: 'none', border: 'none', fontSize: '11px', fontFamily: 'var(--f-mono)', color: 'var(--t-dim)', cursor: 'pointer', letterSpacing: '0.08em', transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-white)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-dim)')}>
        <IconBack /> VOLTAR
      </button>

      {/* Cover */}
      <div style={{ height: '220px', background: profile.capa ? `url('${profile.capa}') center/cover` : 'linear-gradient(135deg, #050012 0%, #0d001f 40%, #040a18 100%)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(4,4,10,0.9) 100%)' }} />
        <div style={{ position: 'absolute', top: '14px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: `${tier.color}18`, border: `1px solid ${tier.color}40`, borderRadius: '6px', padding: '5px 10px', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: '13px' }}>{tier.icon}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, color: tier.color, letterSpacing: '0.12em' }}>{tier.label}</span>
        </div>
      </div>

      {/* Avatar + Info + Follow */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-54px', marginBottom: '0', padding: '0 20px' }}>
        <div style={{ width: '108px', height: '108px', borderRadius: '50%', padding: '3px', background: `linear-gradient(135deg, var(--c-fire), var(--c-fire2), transparent)`, boxShadow: 'var(--glow-fire)', flexShrink: 0 }}>
          <img src={profile.avatar} alt={profile.nome} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', background: 'var(--bg-pit)' }}
            onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
        </div>
        <div style={{ flex: 1, paddingBottom: '8px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{profile.nome}</div>
          {profile.username && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '12px', color: 'var(--c-fire2)', marginTop: '3px', letterSpacing: '0.06em' }}>@{profile.username}</div>}
          {profile.bio && <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginTop: '5px', lineHeight: 1.4, maxWidth: '320px' }}>{profile.bio}</div>}
        </div>
        <div style={{ paddingBottom: '8px', flexShrink: 0 }}>
          <button onClick={toggleFollow} disabled={followLoading} style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', opacity: followLoading ? 0.6 : 1, background: following ? 'transparent' : 'var(--c-fire2)', color: following ? 'var(--t-mid)' : '#000', border: following ? '1px solid rgba(255,255,255,0.12)' : 'none', boxShadow: following ? 'none' : '0 0 16px rgba(255,112,32,0.35)' }}>
            {followLoading ? '...' : following ? 'A Seguir' : 'Seguir'}
          </button>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--c-fire2)' }}>{formatNumber(profile.xp || 0)} XP</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)' }}>NV {profile.nivel || 1}</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'visible', position: 'relative' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--c-fire) 0%, var(--c-fire2) 100%)', borderRadius: '99px', transition: 'width 1s var(--ease-out)', position: 'relative' }}>
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%,-50%)', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-fire2)', boxShadow: '0 0 8px var(--c-fire2), 0 0 16px var(--c-fire2)' }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '20px 20px 0' }}>
        {[
          { label: 'Posts', value: formatNumber(posts.length) },
          { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length) },
          { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length) },
          { label: 'Carros', value: formatNumber(cars.length) },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '24px', fontWeight: 900, color: 'var(--c-fire2)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t-dim)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '20px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        {[
          { id: 'posts' as const, label: 'Posts', icon: <IconGrid /> },
          { id: 'garage' as const, label: 'Garagem', icon: <IconGarage /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--c-fire2)' : 'transparent'}`, color: tab === t.id ? 'var(--c-fire2)' : 'var(--t-dim)', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px', paddingBottom: '12px' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', borderRadius: '8px', overflow: 'hidden' }}>
            {posts.map((p: any) => (
              <div key={p.id} onClick={() => setSelectedPost(p)} style={{ aspectRatio: '1', background: p.imagem_url ? `url('${p.imagem_url}') center/cover` : 'rgba(255,255,255,0.04)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,0,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')} />
              </div>
            ))}
          </div>
          {posts.length === 0 && (
            <div style={{ padding: '70px 0', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--t-dim)' }}><IconCamera /></div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sem posts</div>
            </div>
          )}
        </div>
      )}

      {/* Garage (read-only) */}
      {tab === 'garage' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '14px' }}>
            {cars.map((c: any) => (
              <div key={c.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                {c.imagem_url
                  ? <div style={{ height: '170px', background: `url('${c.imagem_url}') center/cover`, position: 'relative' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,10,0.8) 0%, transparent 60%)' }} /></div>
                  : <div style={{ height: '100px', background: 'linear-gradient(135deg, rgba(255,69,0,0.06) 0%, rgba(255,112,32,0.03) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--t-dim)' }}><IconCar /></div>
                }
                <div style={{ padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>{c.marca} {c.modelo}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', margin: '4px 0 10px', letterSpacing: '0.06em' }}>{[c.ano, c.cor, c.motor].filter(Boolean).join(' · ')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: c.descricao ? '10px' : '0' }}>
                    {c.cv && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,112,32,0.12)', border: '1px solid rgba(255,112,32,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-fire2)' }}><IconBolt />{c.cv} CV</span>}
                    {c.torque && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.torque} Nm</span>}
                    {c.transmissao && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.transmissao}</span>}
                    {c.tracao && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.tracao}</span>}
                    {c.aceleracao && <span style={{ background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-teal)' }}>0-100: {c.aceleracao}s</span>}
                    {c.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-amber)' }}>TURBO</span>}
                    {c.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-blue)' }}>NOS</span>}
                    {c.launch_control && <span style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: '#ff4060' }}>LC</span>}
                  </div>
                  {c.descricao && <div style={{ fontSize: '11px', color: 'var(--t-mid)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>{c.descricao}</div>}
                </div>
              </div>
            ))}
            {cars.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '70px 0', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--t-dim)' }}><IconCar /></div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Garagem Vazia</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedPost(null)}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxWidth: '500px', width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {selectedPost.imagem_url && <img src={selectedPost.imagem_url} style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' }} alt="" />}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {selectedPost.legenda && <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '6px' }}>{selectedPost.legenda}</p>}
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.06em' }}>{timeAgo(selectedPost.criado_em)}</span>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ color: 'var(--t-dim)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}><IconX /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

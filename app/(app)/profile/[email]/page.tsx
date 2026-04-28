'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { timeAgo, formatNumber, avatarFallback, getTier } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function PublicProfilePage() {
  const { email: rawEmail } = useParams();
  const email = decodeURIComponent(rawEmail as string);
  const me = getUser();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'garage'>('posts');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // redirect to own profile page if viewing yourself
  useEffect(() => {
    if (me && me.email === email) { router.replace('/profile'); return; }
    fetch(`/api/perfil/${encodeURIComponent(email)}`).then(r => r.json()).then(data => {
      setProfile(data);
      if (me) setFollowing((data.seguidores || []).includes(me.email));
    });
    fetch(`/api/posts?autor=${encodeURIComponent(email)}`).then(r => r.json()).then(setPosts);
    fetch(`/api/garagem/${encodeURIComponent(email)}`).then(r => r.json()).then(setCars);
  }, [email]);

  async function toggleFollow() {
    if (!me) { showToast('Faz login para seguir'); return; }
    setFollowLoading(true);
    const res = await fetch('/api/seguir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eu: me.email, ele: email }) });
    const data = await res.json();
    setFollowing(data.aSeguir);
    setProfile((p: any) => ({
      ...p,
      seguidores: data.aSeguir
        ? [...(p.seguidores || []), me.email]
        : (p.seguidores || []).filter((e: string) => e !== me.email),
    }));
    showToast(data.aSeguir ? `A seguir ${profile?.nome}` : `Deixaste de seguir ${profile?.nome}`);
    setFollowLoading(false);
  }

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--c-fire2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '12px', color: 'var(--t-dim)' }}>A carregar perfil...</span>
    </div>
  );

  if (profile.erro) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t-dim)' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚫</div>
      <div style={{ fontSize: '16px', fontWeight: 700 }}>Utilizador não encontrado</div>
    </div>
  );

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Back button */}
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--t-mid)', fontSize: '13px', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        ← Voltar
      </button>

      {/* Cover */}
      <div style={{ height: '200px', background: profile.capa ? `url('${profile.capa}') center/cover` : 'linear-gradient(135deg, #0a001a 0%, #1e003d 50%, #0a001a 100%)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden', marginBottom: '0' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(4,4,10,0.85))' }} />
      </div>

      {/* Avatar + info + follow */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-52px', marginBottom: '20px', padding: '0 16px' }}>
        <img src={profile.avatar} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--c-fire2)', flexShrink: 0, display: 'block' }} alt=""
          onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
        <div style={{ flex: 1, paddingBottom: '4px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>{profile.nome}</div>
          <div style={{ fontSize: '12px', color: 'var(--t-mid)', margin: '4px 0 6px' }}>{profile.bio || ''}</div>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}55` }}>
            {tier.icon} {tier.label} · Nível {profile.nivel || 1}
          </span>
        </div>
        <button
          onClick={toggleFollow}
          disabled={followLoading}
          style={{
            padding: '8px 18px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: '4px', minHeight: '36px', minWidth: '90px',
            background: following ? 'transparent' : 'var(--c-fire2)',
            color: following ? 'var(--t-base)' : '#000',
            border: following ? '1px solid var(--b-mid)' : 'none',
            transition: 'all 0.15s',
            opacity: followLoading ? 0.6 : 1,
          }}
        >
          {followLoading ? '...' : following ? 'A Seguir' : 'Seguir'}
        </button>
      </div>

      {/* XP Bar */}
      <div style={{ padding: '0 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t-dim)', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, color: 'var(--c-fire2)' }}>{formatNumber(profile.xp || 0)} XP</span>
          <span>Nível {profile.nivel || 1}</span>
        </div>
        <div style={{ height: '4px', background: 'var(--b-dim)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--c-fire), var(--c-fire2))', borderRadius: '99px', transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '0 16px', marginBottom: '24px' }}>
        {[
          { label: 'Posts', value: formatNumber(posts.length) },
          { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length) },
          { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length) },
          { label: 'Carros', value: formatNumber(cars.length) },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, color: 'var(--c-fire2)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--t-dim)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--b-dim)', marginBottom: '20px', padding: '0 16px' }}>
        {(['posts', 'garage'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--f-display)', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--c-fire2)' : 'transparent'}`, color: tab === t ? 'var(--c-fire2)' : 'var(--t-mid)', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px' }}>
            {t === 'posts' ? '📸 Posts' : '🚗 Garagem'}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {tab === 'posts' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
            {posts.map((p: any) => (
              <div key={p.id} onClick={() => setSelectedPost(p)}
                style={{ aspectRatio: '1', background: p.imagem_url ? `url('${p.imagem_url}') center/cover` : 'var(--bg-lift)', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                {!p.imagem_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📝</div>}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')} />
              </div>
            ))}
          </div>
          {posts.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--t-dim)' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📸</div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Ainda sem posts</div>
            </div>
          )}
        </div>
      )}

      {/* Garage (read-only) */}
      {tab === 'garage' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '16px' }}>
            {cars.map((c: any) => (
              <div key={c.id} className="card card-lift" style={{ overflow: 'hidden' }}>
                {c.imagem_url
                  ? <div style={{ height: '160px', background: `url('${c.imagem_url}') center/cover` }} />
                  : <div style={{ height: '100px', background: 'var(--bg-lift)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🚗</div>
                }
                <div style={{ padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase' }}>{c.marca} {c.modelo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t-dim)', marginBottom: '8px' }}>{c.ano}{c.cor ? ` · ${c.cor}` : ''}</div>
                  {c.cv && <span className="badge badge-fire" style={{ fontSize: '10px' }}>⚡ {c.cv} CV</span>}
                  {c.descricao && <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginTop: '8px', lineHeight: 1.4 }}>{c.descricao}</div>}
                </div>
              </div>
            ))}
            {cars.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '60px 0', textAlign: 'center', color: 'var(--t-dim)' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚗</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Garagem vazia</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post modal */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedPost(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', maxWidth: '480px', width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {selectedPost.imagem_url && <img src={selectedPost.imagem_url} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }} alt="" />}
            <div style={{ padding: '16px' }}>
              {selectedPost.legenda && <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>{selectedPost.legenda}</p>}
              <div style={{ fontSize: '11px', color: 'var(--t-dim)' }}>{timeAgo(selectedPost.criado_em)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

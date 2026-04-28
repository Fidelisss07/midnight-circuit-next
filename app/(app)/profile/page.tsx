'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo, formatNumber, avatarFallback, getTier } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const TRANSMISSAO = ['Manual', 'Automático', 'Sequencial', 'CVT', 'PDK / DCT'];
const TRACAO = ['RWD', 'FWD', 'AWD', '4WD'];
const COMBUSTIVEL = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico', 'Flex'];

const EMPTY_CAR = {
  marca: '', modelo: '', ano: '', cor: '', cv: '', torque: '',
  motor: '', cilindros: '', transmissao: '', tracao: '', combustivel: '',
  peso: '', aceleracao: '', vel_max: '', pneus: '',
  turbo: false, intercooler: false, nos: false, launch_control: false,
  descricao: '',
};

// SVG Icons (no emojis per design system)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconCar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
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
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconBolt = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${checked ? 'var(--c-fire2)' : 'rgba(255,255,255,0.08)'}`, background: checked ? 'rgba(255,112,32,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto', minWidth: '130px' }}>
      <div style={{ width: '32px', height: '18px', borderRadius: '99px', background: checked ? 'var(--c-fire2)' : 'rgba(255,255,255,0.12)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: '3px', left: checked ? '15px' : '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: checked ? 'var(--c-fire2)' : 'var(--t-mid)', letterSpacing: '0.03em' }}>{label}</span>
    </button>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 32px 10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: value ? 'var(--t-white)' : 'var(--t-mid)', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#14141e' }}>{o}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

export default function ProfilePage() {
  const user = getUser();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'garage'>('posts');
  const [showAddCar, setShowAddCar] = useState(false);
  const [carForm, setCarForm] = useState({ ...EMPTY_CAR });
  const [carImg, setCarImg] = useState<File | null>(null);
  const [carImgPreview, setCarImgPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetch(`/api/perfil/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setProfile);
    fetch(`/api/posts?autor=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setPosts);
    fetch(`/api/garagem/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setCars);
  }, []);

  function setField(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCarForm(f => ({ ...f, [k]: e.target.value })); }
  function setSelect(k: string) { return (v: string) => setCarForm(f => ({ ...f, [k]: v })); }
  function toggleFlag(k: string) { setCarForm(f => ({ ...f, [k]: !(f as any)[k] })); }

  function handleCarImg(file: File | null) {
    setCarImg(file);
    if (file) { const url = URL.createObjectURL(file); setCarImgPreview(url); }
    else setCarImgPreview(null);
  }

  async function addCar() {
    setSaving(true);
    const fd = new FormData();
    Object.entries(carForm).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append('email', user.email);
    if (carImg) fd.append('imagem', carImg);
    await fetch('/api/garagem', { method: 'POST', body: fd });
    showToast('Carro adicionado na garagem!');
    setShowAddCar(false);
    setCarForm({ ...EMPTY_CAR });
    setCarImg(null);
    setCarImgPreview(null);
    setSaving(false);
    fetch(`/api/garagem/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setCars);
  }

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--c-fire2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '11px', color: 'var(--t-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>Carregando...</span>
    </div>
  );

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── COVER ── */}
      <div ref={coverRef} style={{ height: '220px', background: profile.capa ? `url('${profile.capa}') center/cover` : 'linear-gradient(135deg, #0d0005 0%, #1a0010 40%, #0a0818 100%)', borderRadius: '12px', position: 'relative', overflow: 'hidden', marginBottom: '0' }}>
        {/* scanline overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(4,4,10,0.9) 100%)' }} />
        {/* tier badge top-left */}
        <div style={{ position: 'absolute', top: '14px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: `${tier.color}18`, border: `1px solid ${tier.color}40`, borderRadius: '6px', padding: '5px 10px', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: '13px' }}>{tier.icon}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, color: tier.color, letterSpacing: '0.12em' }}>{tier.label}</span>
        </div>
        {/* edit button */}
        <button onClick={() => router.push('/settings')} style={{ position: 'absolute', bottom: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(4,4,10,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', backdropFilter: 'blur(10px)', fontSize: '11px', fontWeight: 600, color: 'var(--t-white)', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--c-fire2)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}>
          <IconEdit /> Editar Perfil
        </button>
      </div>

      {/* ── AVATAR + INFO ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-54px', marginBottom: '0', padding: '0 20px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '108px', height: '108px', borderRadius: '50%', padding: '3px', background: `linear-gradient(135deg, var(--c-fire), var(--c-fire2), transparent)`, boxShadow: 'var(--glow-fire)' }}>
            <img src={profile.avatar} alt={profile.nome} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', background: 'var(--bg-pit)' }}
              onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
          </div>
          <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#22c55e', border: '2.5px solid var(--bg-void)', boxShadow: '0 0 6px #22c55e80' }} />
        </div>
        <div style={{ flex: 1, paddingBottom: '8px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1, color: 'var(--t-white)', textShadow: '0 0 30px rgba(255,112,32,0.3)' }}>{profile.nome}</div>
          {profile.username && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '12px', color: 'var(--c-fire2)', marginTop: '3px', letterSpacing: '0.06em' }}>@{profile.username}</div>}
          {profile.bio && <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginTop: '5px', lineHeight: 1.4, maxWidth: '380px' }}>{profile.bio}</div>}
        </div>
      </div>

      {/* ── XP BAR ── */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--c-fire2)' }}>{formatNumber(profile.xp || 0)} XP</span>
            <span style={{ fontSize: '10px', color: 'var(--t-dim)', fontFamily: 'var(--f-mono)' }}>NV {profile.nivel || 1}</span>
          </div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)' }}>{Math.round(xpPct)}%</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'visible', position: 'relative' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--c-fire) 0%, var(--c-fire2) 100%)', borderRadius: '99px', transition: 'width 1s var(--ease-out)', position: 'relative' }}>
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%,-50%)', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-fire2)', boxShadow: '0 0 8px var(--c-fire2), 0 0 16px var(--c-fire2)' }} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '20px 20px 0' }}>
        {[
          { label: 'Posts', value: formatNumber(posts.length) },
          { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length) },
          { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length) },
          { label: 'Carros', value: formatNumber(cars.length) },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px 8px', textAlign: 'center', transition: 'border-color 0.2s, background 0.2s', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,112,32,0.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '24px', fontWeight: 900, color: 'var(--c-fire2)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t-dim)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
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

      {/* ── POSTS GRID ── */}
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
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <IconCamera />
              </div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sem posts ainda</div>
              <div style={{ fontSize: '12px', color: 'var(--t-dim)' }}>Partilha o teu primeiro momento</div>
            </div>
          )}
        </div>
      )}

      {/* ── GARAGE ── */}
      {tab === 'garage' && (
        <div style={{ padding: '0 20px' }}>
          {!showAddCar && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button onClick={() => setShowAddCar(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--c-fire2)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '11px', fontWeight: 800, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', transition: 'opacity 0.2s, box-shadow 0.2s', boxShadow: '0 0 0 rgba(255,112,32,0)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--glow-fire)'; (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                <IconPlus /> Adicionar Carro
              </button>
            </div>
          )}

          {/* ADD CAR FORM */}
          {showAddCar && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              {/* form header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,112,32,0.05)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Novo Carro</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', marginTop: '2px', letterSpacing: '0.1em' }}>ESPECIFICAÇÕES DO VEÍCULO</div>
                </div>
                <button onClick={() => setShowAddCar(false)} style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'var(--t-mid)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t-mid)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                  <IconX />
                </button>
              </div>

              {/* photo upload */}
              <label style={{ display: 'block', margin: '20px 20px 0', height: '160px', borderRadius: '8px', border: `1.5px dashed ${carImgPreview ? 'var(--c-fire2)' : 'rgba(255,255,255,0.1)'}`, background: carImgPreview ? `url('${carImgPreview}') center/cover` : 'rgba(255,255,255,0.02)', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s' }}
                onMouseEnter={e => { if (!carImgPreview) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.4)'; }}
                onMouseLeave={e => { if (!carImgPreview) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                {!carImgPreview && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <IconCamera />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.1em' }}>FOTO DO CARRO</span>
                  </div>
                )}
                {carImgPreview && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}><span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.1em' }}>TROCAR FOTO</span></div>}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCarImg(e.target.files?.[0] || null)} />
              </label>

              <div style={{ padding: '20px' }}>
                {/* Section: Identificação */}
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--c-fire2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                  IDENTIFICAÇÃO
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { k: 'marca', p: 'Marca  (BMW, Honda...)' },
                    { k: 'modelo', p: 'Modelo (M3, Civic...)' },
                    { k: 'ano', p: 'Ano' },
                    { k: 'cor', p: 'Cor' },
                  ].map(({ k, p }) => (
                    <input key={k} className="input" placeholder={p} value={(carForm as any)[k]} onChange={setField(k)} style={{ fontSize: '13px' }} />
                  ))}
                </div>

                {/* Section: Motor */}
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--c-fire2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                  MOTOR & PERFORMANCE
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input className="input" placeholder="Motor (ex: 2.0T)" value={carForm.motor} onChange={setField('motor')} style={{ fontSize: '13px' }} />
                  <input className="input" placeholder="Cilindros (ex: 4)" value={carForm.cilindros} onChange={setField('cilindros')} style={{ fontSize: '13px' }} />
                  <input className="input" placeholder="Potência (CV / BHP)" value={carForm.cv} onChange={setField('cv')} style={{ fontSize: '13px' }} />
                  <input className="input" placeholder="Torque (Nm)" value={carForm.torque} onChange={setField('torque')} style={{ fontSize: '13px' }} />
                  <input className="input" placeholder="0-100 km/h (s)" value={carForm.aceleracao} onChange={setField('aceleracao')} style={{ fontSize: '13px' }} />
                  <input className="input" placeholder="Vel. Máx. (km/h)" value={carForm.vel_max} onChange={setField('vel_max')} style={{ fontSize: '13px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <Select value={carForm.combustivel} onChange={setSelect('combustivel')} options={COMBUSTIVEL} placeholder="Combustível" />
                  <input className="input" placeholder="Peso (kg)" value={carForm.peso} onChange={setField('peso')} style={{ fontSize: '13px' }} />
                </div>

                {/* Section: Transmissão */}
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--c-fire2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                  TRANSMISSÃO & TRAÇÃO
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <Select value={carForm.transmissao} onChange={setSelect('transmissao')} options={TRANSMISSAO} placeholder="Transmissão" />
                  <Select value={carForm.tracao} onChange={setSelect('tracao')} options={TRACAO} placeholder="Tração" />
                  <input className="input" style={{ gridColumn: '1/-1', fontSize: '13px' }} placeholder="Pneus (ex: 245/40 R18)" value={carForm.pneus} onChange={setField('pneus')} />
                </div>

                {/* Section: Extras */}
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--c-fire2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                  EXTRAS / UPGRADES
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,112,32,0.2)' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <Toggle label="Turbo" checked={carForm.turbo} onChange={() => toggleFlag('turbo')} />
                  <Toggle label="Intercooler" checked={carForm.intercooler} onChange={() => toggleFlag('intercooler')} />
                  <Toggle label="NOS / Nitroso" checked={carForm.nos} onChange={() => toggleFlag('nos')} />
                  <Toggle label="Launch Control" checked={carForm.launch_control} onChange={() => toggleFlag('launch_control')} />
                </div>

                {/* Descrição */}
                <textarea className="input" style={{ width: '100%', resize: 'none', minHeight: '80px', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }} placeholder="Descrição, mods, história do carro..." value={carForm.descricao} onChange={setField('descricao')} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={addCar} disabled={saving || !carForm.marca || !carForm.modelo} style={{ flex: 1, padding: '12px', background: 'var(--c-fire2)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '12px', fontWeight: 800, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'opacity 0.2s', opacity: saving || !carForm.marca || !carForm.modelo ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Guardar Carro'}
                  </button>
                  <button onClick={() => { setShowAddCar(false); setCarForm({ ...EMPTY_CAR }); setCarImg(null); setCarImgPreview(null); }} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--t-mid)', fontSize: '11px', fontFamily: 'var(--f-mono)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CAR CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '14px' }}>
            {cars.map((c: any) => (
              <div key={c.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                {/* Car image */}
                {c.imagem_url
                  ? <div style={{ height: '170px', background: `url('${c.imagem_url}') center/cover`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,10,0.8) 0%, transparent 60%)' }} />
                  </div>
                  : <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(255,69,0,0.06) 0%, rgba(255,112,32,0.03) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--t-dim)' }}>
                    <IconCar />
                  </div>
                }
                <div style={{ padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>{c.marca} {c.modelo}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', margin: '4px 0 10px', letterSpacing: '0.06em' }}>
                    {[c.ano, c.cor, c.motor].filter(Boolean).join(' · ')}
                  </div>
                  {/* specs row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: c.descricao ? '10px' : '0' }}>
                    {c.cv && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,112,32,0.12)', border: '1px solid rgba(255,112,32,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-fire2)' }}><IconBolt />{c.cv} CV</span>}
                    {c.torque && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.torque} Nm</span>}
                    {c.transmissao && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.transmissao}</span>}
                    {c.tracao && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.tracao}</span>}
                    {c.aceleracao && <span style={{ background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-teal)' }}>0-100: {c.aceleracao}s</span>}
                    {c.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-amber)' }}>TURBO</span>}
                    {c.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-blue)' }}>NOS</span>}
                    {c.launch_control && <span style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: '#ff4060' }}>LC</span>}
                  </div>
                  {c.descricao && <div style={{ fontSize: '11px', color: 'var(--t-mid)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>{c.descricao}</div>}
                </div>
              </div>
            ))}
            {cars.length === 0 && !showAddCar && (
              <div style={{ gridColumn: '1/-1', padding: '70px 0', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--t-dim)' }}><IconCar /></div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Garagem Vazia</div>
                <div style={{ fontSize: '12px', color: 'var(--t-dim)', marginBottom: '20px' }}>Adiciona o teu primeiro carro</div>
                <button onClick={() => setShowAddCar(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: 'var(--c-fire2)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '11px', fontWeight: 800, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
                  <IconPlus /> Adicionar Carro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POST MODAL ── */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedPost(null)}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxWidth: '500px', width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {selectedPost.imagem_url && <img src={selectedPost.imagem_url} style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' }} alt="" />}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {selectedPost.legenda && <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '6px', color: 'var(--t-white)' }}>{selectedPost.legenda}</p>}
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

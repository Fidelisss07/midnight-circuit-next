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

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconCar = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
);
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconGarage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);
const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconBolt = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const IconFlag = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IconGauge = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-8"/>
  </svg>
);

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px',
      borderRadius: '8px',
      border: `1px solid ${checked ? 'var(--c-fire2)' : 'rgba(255,255,255,0.07)'}`,
      background: checked ? 'rgba(255,112,32,0.1)' : 'rgba(255,255,255,0.02)',
      cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto', minWidth: '130px'
    }}>
      <div style={{ width: '34px', height: '19px', borderRadius: '99px', background: checked ? 'var(--c-fire2)' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, transition: 'background 0.2s', boxShadow: checked ? '0 0 8px rgba(255,112,32,0.5)' : 'none' }}>
        <div style={{ position: 'absolute', top: '3.5px', left: checked ? '16px' : '3.5px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: checked ? 'var(--t-white)' : 'var(--t-mid)', letterSpacing: '0.02em' }}>{label}</span>
    </button>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 32px 10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: value ? 'var(--t-white)' : 'var(--t-mid)', fontSize: '13px', appearance: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
        onFocus={e => (e.target.style.borderColor = 'var(--c-fire2)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#0e0e16' }}>{o}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 12px' }}>
      <div style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg, var(--c-fire), var(--c-fire2))', borderRadius: '2px', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--f-display)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-white)' }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
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
  const [selectedCar, setSelectedCar] = useState<any>(null);

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
    if (file) setCarImgPreview(URL.createObjectURL(file));
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
      <span style={{ fontSize: '11px', color: 'var(--t-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>A carregar...</span>
    </div>
  );

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ══════════════════════════════
          HERO COVER — cinematic
      ══════════════════════════════ */}
      <div style={{ position: 'relative', height: '260px', borderRadius: '0 0 20px 20px', overflow: 'hidden', marginBottom: '0' }}>
        {/* bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: profile.capa
            ? `url('${profile.capa}') center/cover`
            : 'linear-gradient(135deg, #0a0005 0%, #1c0015 35%, #080520 70%, #040410 100%)',
        }} />
        {/* scanlines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)', pointerEvents: 'none' }} />
        {/* vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
        {/* bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to top, var(--bg-void) 0%, rgba(4,4,10,0.6) 60%, transparent 100%)' }} />
        {/* top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, var(--c-fire) 30%, var(--c-fire2) 70%, transparent 100%)', opacity: 0.8 }} />

        {/* tier badge */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(4,4,10,0.6)', border: `1px solid ${tier.color}50`, borderRadius: '6px', padding: '5px 11px', backdropFilter: 'blur(12px)' }}>
          <span style={{ fontSize: '12px' }}>{tier.icon}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, color: tier.color, letterSpacing: '0.12em' }}>{tier.label}</span>
        </div>

        {/* edit button */}
        <button onClick={() => router.push('/settings')} style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', background: 'rgba(4,4,10,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', backdropFilter: 'blur(12px)', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-white)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-fire2)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-fire2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'var(--t-white)'; }}>
          <IconEdit /> Editar
        </button>

        {/* XP bar at bottom of cover */}
        <div style={{ position: 'absolute', bottom: '14px', left: '20px', right: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--c-fire2)', letterSpacing: '0.06em' }}>{formatNumber(profile.xp || 0)} XP</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>NV {profile.nivel || 1} · {Math.round(xpPct)}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'visible', position: 'relative', backdropFilter: 'blur(4px)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--c-fire), var(--c-fire2))', borderRadius: '99px', boxShadow: '0 0 10px var(--c-fire)', position: 'relative', minWidth: xpPct > 0 ? '8px' : '0' }}>
              <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%,-50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--c-fire2)', boxShadow: '0 0 10px var(--c-fire2), 0 0 20px var(--c-fire2)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          AVATAR + INFO
      ══════════════════════════════ */}
      <div style={{ padding: '0 20px', marginTop: '-52px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px' }}>
          {/* avatar with double ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', padding: '3px', background: `conic-gradient(var(--c-fire) 0%, var(--c-fire2) 40%, rgba(255,255,255,0.1) 60%, var(--c-fire) 100%)`, boxShadow: '0 0 0 4px var(--bg-void), var(--glow-fire)' }}>
              <div style={{ borderRadius: '50%', overflow: 'hidden', width: '100%', height: '100%', border: '2px solid var(--bg-void)' }}>
                <img src={profile.avatar} alt={profile.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
              </div>
            </div>
            {/* online pulse */}
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '16px', height: '16px', borderRadius: '50%', background: '#22c55e', border: '2.5px solid var(--bg-void)', boxShadow: '0 0 8px #22c55e' }}>
              <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: '2px solid #22c55e', animation: 'ping 1.5s infinite', opacity: 0.5 }} />
            </div>
          </div>

          {/* name / username / bio */}
          <div style={{ flex: 1, paddingBottom: '6px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '30px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1, color: 'var(--t-white)', textShadow: '0 2px 20px rgba(255,69,0,0.35)' }}>{profile.nome}</div>
            {profile.username && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                <div style={{ width: '14px', height: '1px', background: 'var(--c-fire2)' }} />
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '12px', color: 'var(--c-fire2)', letterSpacing: '0.06em' }}>@{profile.username}</span>
              </div>
            )}
            {profile.bio && <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginTop: '7px', lineHeight: 1.5, maxWidth: '380px' }}>{profile.bio}</div>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          STATS ROW — vitrine style
      ══════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '0 20px 24px' }}>
        {[
          { label: 'Posts', value: formatNumber(posts.length), icon: <IconCamera /> },
          { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length), icon: <IconFlag /> },
          { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length), icon: <IconFlag /> },
          { label: 'Carros', value: formatNumber(cars.length), icon: <IconCar /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 8px 12px', textAlign: 'center', cursor: 'default', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,112,32,0.35)'; el.style.background = 'rgba(255,69,0,0.07)'; el.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.background = 'rgba(255,255,255,0.025)'; el.style.transform = 'translateY(0)'; }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '26px', fontWeight: 900, fontStyle: 'italic', color: 'var(--t-white)', lineHeight: 1, letterSpacing: '-0.01em' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--t-dim)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--f-display)', fontWeight: 700 }}>{s.label}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--c-fire2), transparent)', opacity: 0, transition: 'opacity 0.2s' }} />
          </div>
        ))}
      </div>

      {/* ══════════════════════════════
          TABS
      ══════════════════════════════ */}
      <div style={{ display: 'flex', padding: '0 20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '0' }}>
        {[
          { id: 'posts' as const, label: 'Posts', icon: <IconGrid /> },
          { id: 'garage' as const, label: 'Garagem', icon: <IconGarage /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px',
            fontSize: '12px', fontWeight: 800, fontFamily: 'var(--f-display)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? 'var(--c-fire2)' : 'transparent'}`,
            color: tab === t.id ? 'var(--c-fire2)' : 'var(--t-dim)',
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px', paddingBottom: '13px',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════
          POSTS GRID
      ══════════════════════════════ */}
      {tab === 'posts' && (
        <div style={{ padding: '0 20px' }}>
          {posts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', borderRadius: '10px', overflow: 'hidden' }}>
              {posts.map((p: any) => (
                <div key={p.id} onClick={() => setSelectedPost(p)} style={{ aspectRatio: '1', background: p.imagem_url ? `url('${p.imagem_url}') center/cover` : 'rgba(255,255,255,0.04)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,0,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--t-dim)' }}><IconCamera /></div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sem posts ainda</div>
              <div style={{ fontSize: '13px', color: 'var(--t-dim)' }}>Partilha o teu primeiro momento</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════
          GARAGE
      ══════════════════════════════ */}
      {tab === 'garage' && (
        <div style={{ padding: '0 20px' }}>
          {!showAddCar && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button onClick={() => setShowAddCar(true)} className="btn btn-fire" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconPlus /> Adicionar Carro
              </button>
            </div>
          )}

          {/* ── ADD CAR FORM ── */}
          {showAddCar && (
            <div style={{ background: 'rgba(14,14,22,0.95)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', backdropFilter: 'blur(20px)' }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(90deg, rgba(255,69,0,0.08) 0%, transparent 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,112,32,0.12)', border: '1px solid rgba(255,112,32,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-fire2)' }}>
                    <IconCar />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novo Carro</div>
                    <div style={{ fontSize: '11px', color: 'var(--t-mid)', marginTop: '1px' }}>Especificações do veículo</div>
                  </div>
                </div>
                <button onClick={() => setShowAddCar(false)} style={{ width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'var(--t-mid)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t-mid)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                  <IconX />
                </button>
              </div>

              <div style={{ padding: '22px' }}>
                {/* photo upload */}
                <label style={{ display: 'block', height: '180px', borderRadius: '10px', border: `1.5px dashed ${carImgPreview ? 'var(--c-fire2)' : 'rgba(255,255,255,0.1)'}`, background: carImgPreview ? `url('${carImgPreview}') center/cover` : 'rgba(255,255,255,0.02)', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.2s', marginBottom: '4px' }}
                  onMouseEnter={e => { if (!carImgPreview) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,69,0,0.04)'; } }}
                  onMouseLeave={e => { if (!carImgPreview) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; } }}>
                  {!carImgPreview && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--t-dim)' }}>
                      <IconCamera />
                      <span style={{ fontSize: '12px', color: 'var(--t-mid)', letterSpacing: '0.04em' }}>Clica para adicionar foto do carro</span>
                    </div>
                  )}
                  {carImgPreview && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>Trocar foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCarImg(e.target.files?.[0] || null)} />
                </label>

                <SectionLabel text="Identificação" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { k: 'marca', p: 'Marca  (BMW, Honda...)' },
                    { k: 'modelo', p: 'Modelo (M3, Civic...)' },
                    { k: 'ano', p: 'Ano (ex: 2021)' },
                    { k: 'cor', p: 'Cor (ex: Preto Mate)' },
                  ].map(({ k, p }) => (
                    <input key={k} className="input" placeholder={p} value={(carForm as any)[k]} onChange={setField(k)} />
                  ))}
                </div>

                <SectionLabel text="Motor & Performance" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input className="input" placeholder="Motor (ex: 2.0T)" value={carForm.motor} onChange={setField('motor')} />
                  <input className="input" placeholder="Cilindros (ex: 4)" value={carForm.cilindros} onChange={setField('cilindros')} />
                  <input className="input" placeholder="Potência (CV / BHP)" value={carForm.cv} onChange={setField('cv')} />
                  <input className="input" placeholder="Torque (Nm)" value={carForm.torque} onChange={setField('torque')} />
                  <input className="input" placeholder="0-100 km/h (s)" value={carForm.aceleracao} onChange={setField('aceleracao')} />
                  <input className="input" placeholder="Vel. Máxima (km/h)" value={carForm.vel_max} onChange={setField('vel_max')} />
                  <Select value={carForm.combustivel} onChange={setSelect('combustivel')} options={COMBUSTIVEL} placeholder="Combustível" />
                  <input className="input" placeholder="Peso (kg)" value={carForm.peso} onChange={setField('peso')} />
                </div>

                <SectionLabel text="Transmissão & Tração" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Select value={carForm.transmissao} onChange={setSelect('transmissao')} options={TRANSMISSAO} placeholder="Transmissão" />
                  <Select value={carForm.tracao} onChange={setSelect('tracao')} options={TRACAO} placeholder="Tração" />
                  <input className="input" style={{ gridColumn: '1/-1' }} placeholder="Pneus (ex: 245/40 R18)" value={carForm.pneus} onChange={setField('pneus')} />
                </div>

                <SectionLabel text="Extras / Upgrades" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <Toggle label="Turbo" checked={carForm.turbo} onChange={() => toggleFlag('turbo')} />
                  <Toggle label="Intercooler" checked={carForm.intercooler} onChange={() => toggleFlag('intercooler')} />
                  <Toggle label="NOS / Nitroso" checked={carForm.nos} onChange={() => toggleFlag('nos')} />
                  <Toggle label="Launch Control" checked={carForm.launch_control} onChange={() => toggleFlag('launch_control')} />
                </div>

                <SectionLabel text="Descrição" />
                <textarea className="input" style={{ width: '100%', resize: 'none', minHeight: '88px', lineHeight: 1.6, marginBottom: '22px' }} placeholder="Conta a história do carro, modificações, conquistas..." value={carForm.descricao} onChange={setField('descricao')} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={addCar} disabled={saving || !carForm.marca || !carForm.modelo} className="btn btn-fire" style={{ flex: 1, justifyContent: 'center', opacity: saving || !carForm.marca || !carForm.modelo ? 0.45 : 1 }}>
                    {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Guardar Carro'}
                  </button>
                  <button onClick={() => { setShowAddCar(false); setCarForm({ ...EMPTY_CAR }); setCarImg(null); setCarImgPreview(null); }} className="btn btn-outline">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CAR CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '14px' }}>
            {cars.map((c: any) => (
              <div key={c.id} onClick={() => setSelectedCar(c)} style={{ background: 'rgba(14,14,22,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.22s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,112,32,0.4)'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,69,0,0.1)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}>
                {c.imagem_url
                  ? <div style={{ height: '175px', background: `url('${c.imagem_url}') center/cover`, position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,14,22,1) 0%, rgba(14,14,22,0.3) 50%, transparent 100%)' }} />
                      {/* overlay name on image */}
                      <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{c.marca} {c.modelo}</div>
                        {(c.ano || c.cor) && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '3px', letterSpacing: '0.06em' }}>{[c.ano, c.cor].filter(Boolean).join(' · ')}</div>}
                      </div>
                    </div>
                  : <div style={{ height: '110px', background: 'linear-gradient(135deg, rgba(255,69,0,0.07), rgba(255,112,32,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                      <IconCar />
                      <div style={{ position: 'absolute', bottom: '10px', left: '14px', right: '14px' }}>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{c.marca} {c.modelo}</div>
                        {(c.ano || c.cor) && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', marginTop: '3px' }}>{[c.ano, c.cor].filter(Boolean).join(' · ')}</div>}
                      </div>
                    </div>
                }
                <div style={{ padding: '12px 14px 14px' }}>
                  {/* specs badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {c.cv && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,112,32,0.12)', border: '1px solid rgba(255,112,32,0.28)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-fire2)' }}><IconBolt />{c.cv} CV</span>}
                    {c.torque && <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.torque} Nm</span>}
                    {c.motor && <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.motor}</span>}
                    {c.aceleracao && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.22)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-teal)' }}><IconFlag />0-100: {c.aceleracao}s</span>}
                    {c.vel_max && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.22)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-blue)' }}><IconGauge />{c.vel_max} km/h</span>}
                    {c.transmissao && <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.transmissao}</span>}
                    {c.tracao && <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-mid)' }}>{c.tracao}</span>}
                    {c.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.28)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-amber)' }}>TURBO</span>}
                    {c.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.28)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-blue)' }}>NOS</span>}
                    {c.launch_control && <span style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.28)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#ff4060' }}>LC</span>}
                    {c.intercooler && <span style={{ background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-teal)' }}>INTERCOOLER</span>}
                  </div>
                  {c.descricao && <div style={{ fontSize: '12px', color: 'var(--t-mid)', lineHeight: 1.55, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px' }}>{c.descricao}</div>}
                </div>
              </div>
            ))}

            {cars.length === 0 && !showAddCar && (
              <div style={{ gridColumn: '1/-1', padding: '80px 0', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--t-dim)' }}><IconCar /></div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Garagem Vazia</div>
                <div style={{ fontSize: '13px', color: 'var(--t-dim)', marginBottom: '24px' }}>Adiciona o teu primeiro carro</div>
                <button onClick={() => setShowAddCar(true)} className="btn btn-fire" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <IconPlus /> Adicionar Carro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          POST MODAL
      ══════════════════════════════ */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            {selectedPost.imagem_url && <img src={selectedPost.imagem_url} style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' }} alt="" />}
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                {selectedPost.legenda && <p style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '8px', color: 'var(--t-white)' }}>{selectedPost.legenda}</p>}
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.06em' }}>{timeAgo(selectedPost.criado_em)}</span>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ color: 'var(--t-dim)', cursor: 'pointer', padding: '4px', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-white)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-dim)')}><IconX /></button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          CAR DETAIL MODAL
      ══════════════════════════════ */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            {selectedCar.imagem_url
              ? <div style={{ height: '220px', background: `url('${selectedCar.imagem_url}') center/cover`, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-panel) 0%, transparent 60%)' }} />
                </div>
              : <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(255,69,0,0.08), rgba(255,112,32,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}><IconCar /></div>
            }
            <div style={{ padding: '20px 22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{selectedCar.marca} {selectedCar.modelo}</div>
                  {(selectedCar.ano || selectedCar.cor) && <div style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--t-dim)', marginTop: '4px' }}>{[selectedCar.ano, selectedCar.cor, selectedCar.motor].filter(Boolean).join(' · ')}</div>}
                </div>
                <button onClick={() => setSelectedCar(null)} style={{ color: 'var(--t-dim)', cursor: 'pointer', padding: '4px', flexShrink: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-white)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-dim)')}><IconX /></button>
              </div>

              {/* spec grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Potência', value: selectedCar.cv ? `${selectedCar.cv} CV` : null, color: 'var(--c-fire2)' },
                  { label: 'Torque', value: selectedCar.torque ? `${selectedCar.torque} Nm` : null, color: 'var(--t-white)' },
                  { label: '0-100 km/h', value: selectedCar.aceleracao ? `${selectedCar.aceleracao}s` : null, color: 'var(--c-teal)' },
                  { label: 'Vel. Máx.', value: selectedCar.vel_max ? `${selectedCar.vel_max} km/h` : null, color: 'var(--c-blue)' },
                  { label: 'Cilindros', value: selectedCar.cilindros || null, color: 'var(--t-white)' },
                  { label: 'Peso', value: selectedCar.peso ? `${selectedCar.peso} kg` : null, color: 'var(--t-white)' },
                  { label: 'Transmissão', value: selectedCar.transmissao || null, color: 'var(--t-white)' },
                  { label: 'Tração', value: selectedCar.tracao || null, color: 'var(--t-white)' },
                  { label: 'Combustível', value: selectedCar.combustivel || null, color: 'var(--t-white)' },
                  { label: 'Pneus', value: selectedCar.pneus || null, color: 'var(--t-white)' },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--t-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--f-mono)', marginBottom: '3px' }}>{s.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: s.color, fontFamily: 'var(--f-mono)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* extras */}
              {(selectedCar.turbo || selectedCar.nos || selectedCar.intercooler || selectedCar.launch_control) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {selectedCar.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.3)', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-amber)' }}>TURBO</span>}
                  {selectedCar.intercooler && <span style={{ background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.25)', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-teal)' }}>INTERCOOLER</span>}
                  {selectedCar.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.3)', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-blue)' }}>NOS</span>}
                  {selectedCar.launch_control && <span style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.3)', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#ff4060' }}>LAUNCH CONTROL</span>}
                </div>
              )}

              {selectedCar.descricao && <div style={{ fontSize: '13px', color: 'var(--t-mid)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>{selectedCar.descricao}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

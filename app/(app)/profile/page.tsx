'use client';
import { useEffect, useState } from 'react';
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

/* ── SVG ICONS ── */
const Ico = {
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  cam:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  car:  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  x:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  bolt: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  flag: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  gauge:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-8"/></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  garage:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>,
  wrench:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
      borderRadius: '6px',
      border: `1px solid ${checked ? 'rgba(255,112,32,0.4)' : 'rgba(255,255,255,0.07)'}`,
      background: checked ? 'rgba(255,69,0,0.1)' : 'transparent',
      cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto', minWidth: '130px',
    }}>
      <div style={{ width: '32px', height: '18px', borderRadius: '99px', background: checked ? 'var(--c-fire2)' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, transition: 'all 0.2s', boxShadow: checked ? '0 0 8px rgba(255,112,32,0.5)' : 'none' }}>
        <div style={{ position: 'absolute', top: '3px', left: checked ? '14px' : '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: checked ? 'var(--t-white)' : 'var(--t-mid)', letterSpacing: '0.02em' }}>{label}</span>
    </button>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 32px 10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: value ? 'var(--t-white)' : 'var(--t-mid)', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#0e0e16' }}>{o}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

/* ── TELEMETRY STAT BLOCK ── */
function TelStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t-dim)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em', color: accent || 'var(--t-white)', lineHeight: 1 }}>{value}</span>
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
  function handleCarImg(file: File | null) { setCarImg(file); setCarImgPreview(file ? URL.createObjectURL(file) : null); }

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
    setCarImg(null); setCarImgPreview(null);
    setSaving(false);
    fetch(`/api/garagem/${encodeURIComponent(user.email)}`).then(r => r.json()).then(setCars);
  }

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--c-fire2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>LOADING</span>
    </div>
  );

  const tier = getTier(profile.nivel || 1);
  const xpToNext = (profile.nivel || 1) * 500;
  const xpPct = Math.min(100, ((profile.xp || 0) % xpToNext) / xpToNext * 100);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          IDENTITY BLOCK — full-bleed horizontal
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ position: 'relative', marginBottom: '2px' }}>
        {/* cover strip */}
        <div style={{
          height: '200px',
          background: profile.capa
            ? `url('${profile.capa}') center/cover`
            : 'linear-gradient(120deg,#06000e 0%,#1a0014 40%,#050515 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* scanlines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)', pointerEvents: 'none' }} />
          {/* vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,0.65) 100%)' }} />
          {/* bottom hard fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top,var(--bg-void),transparent)' }} />

          {/* top stripe — left orange block like race livery */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,var(--c-fire) 0%,var(--c-fire2) 50%,transparent 100%)' }} />

          {/* chassis number top-left */}
          <div style={{ position: 'absolute', top: '14px', left: '16px', fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            CIRCUIT · DRIVER PROFILE
          </div>

          {/* tier — top right */}
          <div style={{ position: 'absolute', top: '12px', right: '52px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.55)', border: `1px solid ${tier.color}40`, borderRadius: '4px', padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: '11px' }}>{tier.icon}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', fontWeight: 700, color: tier.color, letterSpacing: '0.12em' }}>{tier.label}</span>
          </div>

          {/* edit button */}
          <button onClick={() => router.push('/settings')} style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'var(--t-mid)', transition: 'all 0.15s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--c-fire2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t-mid)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}>
            {Ico.edit}
          </button>
        </div>

        {/* ── INFO PANEL below cover ── */}
        <div style={{ background: 'var(--bg-pit)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px 20px' }}>
          {/* avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px', marginTop: '-44px', marginBottom: '16px' }}>
            {/* avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* outer hex ring */}
              <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: `conic-gradient(var(--c-fire),var(--c-fire2) 35%,rgba(255,255,255,0.07) 55%,var(--c-fire) 100%)`, padding: '3px', boxShadow: '0 0 0 3px var(--bg-void), 0 0 30px rgba(255,69,0,0.4)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-void)' }}>
                  <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = avatarFallback(profile.nome || '?'); }} />
                </div>
              </div>
              {/* pulse */}
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-void)', boxShadow: '0 0 8px #22c55e' }}>
                <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: '2px solid #22c55e', animation: 'ping 1.5s infinite', opacity: 0.4 }} />
              </div>
            </div>

            {/* name block */}
            <div style={{ flex: 1, paddingBottom: '4px' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '34px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.01em', textShadow: '0 0 40px rgba(255,69,0,0.3)' }}>{profile.nome}</div>
              {profile.username && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px', background: 'rgba(255,112,32,0.08)', border: '1px solid rgba(255,112,32,0.2)', borderRadius: '4px', padding: '2px 8px' }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--c-fire2)', letterSpacing: '0.04em' }}>@{profile.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* bio */}
          {profile.bio && (
            <div style={{ fontSize: '13px', color: 'var(--t-mid)', lineHeight: 1.6, maxWidth: '520px', marginBottom: '18px', paddingLeft: '2px' }}>{profile.bio}</div>
          )}

          {/* ── XP BAR ── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--c-fire2)', letterSpacing: '0.06em' }}>LVL {profile.nivel || 1}</span>
                <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.12)' }} />
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.04em' }}>{formatNumber(profile.xp || 0)} XP</span>
              </div>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t-dim)', letterSpacing: '0.06em' }}>{Math.round(xpPct)}% to next</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,var(--c-fire),var(--c-fire2))', borderRadius: '99px', boxShadow: '0 0 8px var(--c-fire)', minWidth: xpPct > 0 ? '6px' : '0' }}>
                <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%,-50%)', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-fire2)', boxShadow: '0 0 8px var(--c-fire2)' }} />
              </div>
            </div>
          </div>

          {/* ── TELEMETRY STATS ROW ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            {[
              { label: 'Posts', value: formatNumber(posts.length) },
              { label: 'Seguidores', value: formatNumber((profile.seguidores || []).length) },
              { label: 'Seguindo', value: formatNumber((profile.seguindo || []).length) },
              { label: 'Carros', value: formatNumber(cars.length), accent: 'var(--c-fire2)' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '14px 0', textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,69,0,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <TelStat label={s.label} value={s.value} accent={s.accent} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAB BAR — sticky race strip
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: '0', zIndex: 20,
        marginBottom: '0',
      }}>
        {/* left fire line */}
        <div style={{ width: '3px', background: 'linear-gradient(180deg,var(--c-fire),var(--c-fire2))', flexShrink: 0 }} />
        {[
          { id: 'posts' as const, label: 'Actividade', icon: Ico.grid },
          { id: 'garage' as const, label: 'Garagem', icon: Ico.garage },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '14px 22px',
            fontSize: '11px', fontWeight: 800, fontFamily: 'var(--f-display)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            background: tab === t.id ? 'rgba(255,69,0,0.07)' : 'transparent',
            borderBottom: `2px solid ${tab === t.id ? 'var(--c-fire2)' : 'transparent'}`,
            color: tab === t.id ? 'var(--c-fire2)' : 'var(--t-dim)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          POSTS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === 'posts' && (
        <div style={{ padding: '20px' }}>
          {posts.length > 0 ? (
            <>
              {/* photo grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px', borderRadius: '8px', overflow: 'hidden', marginBottom: '2px' }}>
                {posts.map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedPost(p)} style={{ aspectRatio: '1', background: p.imagem_url ? `url('${p.imagem_url}') center/cover` : 'var(--bg-lift)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'transparent', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,0,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />
                    {!p.imagem_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-dim)', fontFamily: 'var(--f-display)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>TEXT</div>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--t-dim)' }}>{Ico.cam}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Sem Posts</div>
              <div style={{ fontSize: '12px', color: 'var(--t-dim)' }}>Partilha o teu primeiro momento na pista</div>
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GARAGE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === 'garage' && (
        <div style={{ padding: '20px' }}>

          {/* header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>Minha Garagem</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', marginTop: '3px', letterSpacing: '0.08em' }}>{cars.length} {cars.length === 1 ? 'VEÍCULO' : 'VEÍCULOS'}</div>
            </div>
            {!showAddCar && (
              <button onClick={() => setShowAddCar(true)} className="btn btn-fire" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                {Ico.plus} Novo Carro
              </button>
            )}
          </div>

          {/* ── ADD CAR FORM (MODAL-LIKE PANEL) ── */}
          {showAddCar && (
            <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
              {/* form header stripe */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(90deg,rgba(255,69,0,0.1) 0%,transparent 60%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,112,32,0.15)', border: '1px solid rgba(255,112,32,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-fire2)' }}>{Ico.car}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registar Veículo</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t-dim)', letterSpacing: '0.1em', marginTop: '1px' }}>FICHA TÉCNICA COMPLETA</div>
                  </div>
                </div>
                <button onClick={() => setShowAddCar(false)} style={{ width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: 'var(--t-mid)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t-mid)'; }}>
                  {Ico.x}
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                {/* photo upload */}
                <label style={{ display: 'block', height: '160px', borderRadius: '8px', border: `1.5px dashed ${carImgPreview ? 'var(--c-fire2)' : 'rgba(255,255,255,0.1)'}`, background: carImgPreview ? `url('${carImgPreview}') center/cover` : 'rgba(255,255,255,0.015)', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.2s', marginBottom: '18px' }}
                  onMouseEnter={e => { if (!carImgPreview) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,112,32,0.5)'; }}
                  onMouseLeave={e => { if (!carImgPreview) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  {!carImgPreview && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--t-dim)' }}>
                      {Ico.cam}
                      <span style={{ fontSize: '11px', color: 'var(--t-mid)', letterSpacing: '0.04em' }}>Adicionar foto do carro</span>
                    </div>
                  )}
                  {carImgPreview && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Trocar foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCarImg(e.target.files?.[0] || null)} />
                </label>

                {/* SECTION: Identificação */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '2px', height: '12px', background: 'linear-gradient(var(--c-fire),var(--c-fire2))', borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t-mid)' }}>Identificação</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[{ k: 'marca', p: 'Marca  (BMW, Honda...)' }, { k: 'modelo', p: 'Modelo (M3, Civic...)' }, { k: 'ano', p: 'Ano' }, { k: 'cor', p: 'Cor' }].map(({ k, p }) => (
                      <input key={k} className="input" placeholder={p} value={(carForm as any)[k]} onChange={setField(k)} />
                    ))}
                  </div>
                </div>

                {/* SECTION: Motor & Performance */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '2px', height: '12px', background: 'linear-gradient(var(--c-fire),var(--c-fire2))', borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t-mid)' }}>Motor & Performance</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input className="input" placeholder="Motor (ex: 2.0T)" value={carForm.motor} onChange={setField('motor')} />
                    <input className="input" placeholder="Cilindros" value={carForm.cilindros} onChange={setField('cilindros')} />
                    <input className="input" placeholder="Potência (CV)" value={carForm.cv} onChange={setField('cv')} />
                    <input className="input" placeholder="Torque (Nm)" value={carForm.torque} onChange={setField('torque')} />
                    <input className="input" placeholder="0-100 km/h (s)" value={carForm.aceleracao} onChange={setField('aceleracao')} />
                    <input className="input" placeholder="Vel. Máxima (km/h)" value={carForm.vel_max} onChange={setField('vel_max')} />
                    <Select value={carForm.combustivel} onChange={setSelect('combustivel')} options={COMBUSTIVEL} placeholder="Combustível" />
                    <input className="input" placeholder="Peso (kg)" value={carForm.peso} onChange={setField('peso')} />
                  </div>
                </div>

                {/* SECTION: Transmissão */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '2px', height: '12px', background: 'linear-gradient(var(--c-fire),var(--c-fire2))', borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t-mid)' }}>Transmissão & Tração</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Select value={carForm.transmissao} onChange={setSelect('transmissao')} options={TRANSMISSAO} placeholder="Transmissão" />
                    <Select value={carForm.tracao} onChange={setSelect('tracao')} options={TRACAO} placeholder="Tração" />
                    <input className="input" style={{ gridColumn: '1/-1' }} placeholder="Pneus (ex: 245/40 R18)" value={carForm.pneus} onChange={setField('pneus')} />
                  </div>
                </div>

                {/* SECTION: Extras */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '2px', height: '12px', background: 'linear-gradient(var(--c-fire),var(--c-fire2))', borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t-mid)' }}>Extras / Upgrades</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Toggle label="Turbo" checked={carForm.turbo} onChange={() => toggleFlag('turbo')} />
                    <Toggle label="Intercooler" checked={carForm.intercooler} onChange={() => toggleFlag('intercooler')} />
                    <Toggle label="NOS / Nitroso" checked={carForm.nos} onChange={() => toggleFlag('nos')} />
                    <Toggle label="Launch Control" checked={carForm.launch_control} onChange={() => toggleFlag('launch_control')} />
                  </div>
                </div>

                {/* descrição */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '2px', height: '12px', background: 'linear-gradient(var(--c-fire),var(--c-fire2))', borderRadius: '1px' }} />
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t-mid)' }}>Descrição</span>
                  </div>
                  <textarea className="input" style={{ width: '100%', resize: 'none', minHeight: '80px', lineHeight: 1.6 }} placeholder="História do carro, modificações, conquistas..." value={carForm.descricao} onChange={setField('descricao')} />
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={addCar} disabled={saving || !carForm.marca || !carForm.modelo} className="btn btn-fire" style={{ flex: 1, justifyContent: 'center', opacity: saving || !carForm.marca || !carForm.modelo ? 0.4 : 1 }}>
                    {saving ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Guardar Carro'}
                  </button>
                  <button onClick={() => { setShowAddCar(false); setCarForm({ ...EMPTY_CAR }); setCarImg(null); setCarImgPreview(null); }} className="btn btn-outline">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* ── CAR LIST — horizontal-scroll cards ── */}
          {cars.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {cars.map((c: any, idx: number) => (
                <div key={c.id} onClick={() => setSelectedCar(c)} style={{
                  display: 'flex', alignItems: 'stretch', background: 'var(--bg-panel)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
                  overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,112,32,0.3)'; el.style.background = 'var(--bg-lift)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.background = 'var(--bg-panel)'; }}>

                  {/* left: index strip */}
                  <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,69,0,0.06)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: 'rgba(255,112,32,0.35)' }}>{String(idx + 1).padStart(2, '0')}</span>
                  </div>

                  {/* car image */}
                  {c.imagem_url ? (
                    <div style={{ width: '100px', height: '74px', flexShrink: 0, background: `url('${c.imagem_url}') center/cover`, borderRight: '1px solid rgba(255,255,255,0.04)' }} />
                  ) : (
                    <div style={{ width: '100px', height: '74px', flexShrink: 0, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>{Ico.car}</div>
                  )}

                  {/* main info */}
                  <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: '17px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.marca} {c.modelo}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {c.cv && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,112,32,0.1)', border: '1px solid rgba(255,112,32,0.25)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-fire2)' }}>{Ico.bolt}{c.cv}cv</span>}
                      {c.aceleracao && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(0,229,204,0.07)', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-teal)' }}>{Ico.flag}{c.aceleracao}s</span>}
                      {c.vel_max && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(0,170,255,0.07)', border: '1px solid rgba(0,170,255,0.2)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--c-blue)' }}>{Ico.gauge}{c.vel_max}km/h</span>}
                      {c.motor && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-dim)' }}>{c.motor}</span>}
                      {c.ano && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', color: 'var(--t-dim)' }}>{c.ano}</span>}
                      {c.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.25)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-amber)' }}>TURBO</span>}
                      {c.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.25)', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-blue)' }}>NOS</span>}
                    </div>
                  </div>

                  {/* right: chevron */}
                  <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-dim)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))}
            </div>
          ) : !showAddCar && (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--t-dim)' }}>{Ico.car}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Garagem Vazia</div>
              <div style={{ fontSize: '12px', color: 'var(--t-dim)', marginBottom: '20px' }}>Adiciona o teu primeiro carro</div>
              <button onClick={() => setShowAddCar(true)} className="btn btn-fire" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {Ico.plus} Adicionar Carro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          POST MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            {selectedPost.imagem_url && <img src={selectedPost.imagem_url} style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block' }} alt="" />}
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                {selectedPost.legenda && <p style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '8px' }}>{selectedPost.legenda}</p>}
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t-dim)', letterSpacing: '0.06em' }}>{timeAgo(selectedPost.criado_em)}</span>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ color: 'var(--t-dim)', cursor: 'pointer', padding: '4px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-white)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-dim)')}>{Ico.x}</button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CAR DETAIL MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal-content" style={{ maxWidth: '560px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* hero image */}
            <div style={{ position: 'relative', height: selectedCar.imagem_url ? '220px' : '80px', background: selectedCar.imagem_url ? `url('${selectedCar.imagem_url}') center/cover` : 'linear-gradient(135deg,rgba(255,69,0,0.08),rgba(14,14,22,1))' }}>
              {selectedCar.imagem_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,var(--bg-panel) 0%,transparent 50%)' }} />}
              {!selectedCar.imagem_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.07)' }}>{Ico.car}</div>}
              {/* top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,var(--c-fire),var(--c-fire2),transparent)' }} />
              {/* close */}
              <button onClick={() => setSelectedCar(null)} style={{ position: 'absolute', top: '12px', right: '12px', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: 'var(--t-mid)', backdropFilter: 'blur(8px)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-mid)')}>
                {Ico.x}
              </button>
            </div>

            <div style={{ padding: '18px 22px 24px' }}>
              {/* title */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '26px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{selectedCar.marca} {selectedCar.modelo}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--t-dim)', marginTop: '5px', letterSpacing: '0.06em' }}>{[selectedCar.ano, selectedCar.cor, selectedCar.motor].filter(Boolean).join(' · ')}</div>
              </div>

              {/* spec grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '6px', marginBottom: '14px' }}>
                {[
                  { label: 'Potência', value: selectedCar.cv ? `${selectedCar.cv} CV` : null, accent: 'var(--c-fire2)' },
                  { label: 'Torque', value: selectedCar.torque ? `${selectedCar.torque} Nm` : null },
                  { label: '0-100 km/h', value: selectedCar.aceleracao ? `${selectedCar.aceleracao}s` : null, accent: 'var(--c-teal)' },
                  { label: 'Vel. Máx.', value: selectedCar.vel_max ? `${selectedCar.vel_max} km/h` : null, accent: 'var(--c-blue)' },
                  { label: 'Cilindros', value: selectedCar.cilindros || null },
                  { label: 'Peso', value: selectedCar.peso ? `${selectedCar.peso} kg` : null },
                  { label: 'Transmissão', value: selectedCar.transmissao || null },
                  { label: 'Tração', value: selectedCar.tracao || null },
                  { label: 'Combustível', value: selectedCar.combustivel || null },
                  { label: 'Pneus', value: selectedCar.pneus || null },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--t-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--f-mono)', marginBottom: '3px' }}>{s.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: s.accent || 'var(--t-white)', fontFamily: 'var(--f-mono)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* extras */}
              {(selectedCar.turbo || selectedCar.nos || selectedCar.intercooler || selectedCar.launch_control) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {selectedCar.turbo && <span style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-amber)' }}>TURBO</span>}
                  {selectedCar.intercooler && <span style={{ background: 'rgba(0,229,204,0.08)', border: '1px solid rgba(0,229,204,0.25)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-teal)' }}>INTERCOOLER</span>}
                  {selectedCar.nos && <span style={{ background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-blue)' }}>NOS</span>}
                  {selectedCar.launch_control && <span style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: 700, color: '#ff4060' }}>LAUNCH CONTROL</span>}
                </div>
              )}

              {selectedCar.descricao && <div style={{ fontSize: '13px', color: 'var(--t-mid)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>{selectedCar.descricao}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }
const THEMES = [
  { id: 'theme-fire', label: '🔥 Fire', color: '#ff4500' }, { id: 'theme-blood', label: '🩸 Blood', color: '#ff0040' },
  { id: 'theme-violet', label: '🟣 Violet', color: '#cc00ff' }, { id: 'theme-blue', label: '🔵 Blue', color: '#0080ff' },
  { id: 'theme-ice', label: '🧊 Ice', color: '#00d4ff' }, { id: 'theme-mint', label: '🌿 Mint', color: '#00ffb3' },
  { id: 'theme-green', label: '🟢 Green', color: '#39ff14' }, { id: 'theme-gold', label: '🏆 Gold', color: '#ffcc00' },
  { id: 'theme-pink', label: '🌸 Pink', color: '#ff2d9f' }, { id: 'theme-white', label: '🤍 Chrome', color: '#e0e0f0' },
];

export default function SettingsPage() {
  const user = getUser();
  const router = useRouter();
  const [form, setForm] = useState({ nome: user?.nome || '', bio: user?.bio || '', username: user?.username || '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'short'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTheme, setActiveTheme] = useState(typeof window !== 'undefined' ? localStorage.getItem('midnight_tema') || 'theme-fire' : 'theme-fire');

  function applyTheme(t: string) {
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    document.body.classList.add(t);
    localStorage.setItem('midnight_tema', t);
    setActiveTheme(t);
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    setForm(f => ({ ...f, username: raw }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw === user?.username) { setUsernameStatus('idle'); return; }
    if (raw.length < 3) { setUsernameStatus(raw.length === 0 ? 'idle' : 'short'); return; }
    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/perfil/check-username?u=${encodeURIComponent(raw)}&exclude=${encodeURIComponent(user?.email || '')}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'ok' : 'taken');
    }, 500);
  }

  async function save() {
    if (usernameStatus === 'taken') { showToast('Username já em uso', 'error'); return; }
    if (form.username.length < 3) { showToast('Username precisa de 3+ caracteres', 'error'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('emailOriginal', user.email);
    fd.append('nome', form.nome);
    fd.append('bio', form.bio);
    fd.append('username', form.username);
    if (avatarFile) fd.append('avatar', avatarFile);
    if (capaFile) fd.append('capa', capaFile);
    const res = await fetch('/api/perfil/atualizar', { method: 'POST', body: fd });
    if (res.ok) {
      const updated = await res.json();
      localStorage.setItem('usuario_logado', JSON.stringify(updated));
      showToast('Perfil atualizado!');
    } else {
      const err = await res.json();
      showToast(err.erro || 'Erro ao salvar', 'error');
    }
    setSaving(false);
  }

  const usernameHint = {
    idle: null,
    short: <span style={{ color: 'var(--t-dim)' }}>Mínimo 3 caracteres</span>,
    checking: <span style={{ color: 'var(--t-dim)' }}>A verificar...</span>,
    ok: <span style={{ color: '#22c55e' }}>✓ Disponível</span>,
    taken: <span style={{ color: '#ef4444' }}>✗ Já em uso</span>,
  }[usernameStatus];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '24px' }}>⚙️ CONFIGURAÇÕES</h1>

      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>Perfil</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--b-fire)', marginBottom: '8px' }} alt=""
              onError={e => { (e.target as HTMLImageElement).src = avatarFallback(user?.nome || '?'); }} />
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-fire2)', cursor: 'pointer', fontWeight: 600 }}>
              Trocar avatar
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '42px', borderRadius: '6px', background: user?.capa ? `url('${user.capa}') center/cover` : 'var(--bg-lift)', border: '2px solid var(--b-dim)', marginBottom: '8px' }} />
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-fire2)', cursor: 'pointer', fontWeight: 600 }}>
              Trocar capa
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCapaFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input" placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />

          <div>
            <div className="input-group">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-fire2)', fontWeight: 700, fontSize: '15px', pointerEvents: 'none' }}>@</span>
              <input className="input" style={{ paddingLeft: '28px' }} placeholder="username" value={form.username} onChange={handleUsernameChange} maxLength={20} autoComplete="off" />
            </div>
            {usernameHint && <div style={{ fontSize: '11px', marginTop: '4px', paddingLeft: '4px' }}>{usernameHint}</div>}
          </div>

          <textarea className="input" placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={{ resize: 'none', minHeight: '80px' }} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={save} disabled={saving || usernameStatus === 'taken' || usernameStatus === 'checking'}>
          {saving ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span> : 'Guardar'}
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>Tema</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '8px' }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => applyTheme(t.id)} style={{ padding: '10px 8px', borderRadius: 'var(--r-sm)', border: `2px solid ${activeTheme === t.id ? t.color : 'var(--b-dim)'}`, background: activeTheme === t.id ? `${t.color}15` : 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: activeTheme === t.id ? t.color : 'var(--t-mid)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.color, boxShadow: activeTheme === t.id ? `0 0 10px ${t.color}` : 'none' }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', color: '#ef4444' }}>Zona de Perigo</h3>
        <button className="btn btn-danger" onClick={() => { localStorage.removeItem('usuario_logado'); router.push('/login'); }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span> Sair da Conta
        </button>
      </div>
    </div>
  );
}

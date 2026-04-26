'use client';
import { useState } from 'react';
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
  const [form, setForm] = useState({ nome: user?.nome || '', bio: user?.bio || '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTheme, setActiveTheme] = useState(typeof window !== 'undefined' ? localStorage.getItem('midnight_tema') || 'theme-fire' : 'theme-fire');

  function applyTheme(t: string) {
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    document.body.classList.add(t);
    localStorage.setItem('midnight_tema', t);
    setActiveTheme(t);
  }

  async function save() {
    setSaving(true);
    const fd = new FormData();
    fd.append('emailOriginal', user.email); fd.append('nome', form.nome); fd.append('bio', form.bio);
    if (avatarFile) fd.append('avatar', avatarFile);
    if (capaFile) fd.append('capa', capaFile);
    const res = await fetch('/api/perfil/atualizar', { method: 'POST', body: fd });
    if (res.ok) { const updated = await res.json(); localStorage.setItem('usuario_logado', JSON.stringify(updated)); showToast('Perfil atualizado!'); }
    else showToast('Erro ao salvar', 'error');
    setSaving(false);
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '24px' }}>⚙️ CONFIGURAÇÕES</h1>

      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>Perfil</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--b-fire)', marginBottom: '8px' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(user?.nome || '?'); }} />
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-fire2)', cursor: 'pointer', fontWeight: 600 }}>
              Trocar avatar
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input" placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          <textarea className="input" placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={{ resize: 'none', minHeight: '80px' }} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={save} disabled={saving}>
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

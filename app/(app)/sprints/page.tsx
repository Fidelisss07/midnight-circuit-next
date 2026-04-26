'use client';
import { useState, useEffect } from 'react';
import { timeAgo, formatNumber, avatarFallback } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function SprintsPage() {
  const user = getUser();
  const [sprints, setSprints] = useState<any[]>([]);
  const [desc, setDesc] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetch('/api/sprints').then(r => r.json()).then(setSprints); }, []);

  async function upload() {
    if (!videoFile) return showToast('Escolhe um vídeo!', 'error');
    setUploading(true);
    const form = new FormData();
    form.append('autor', user.nome); form.append('emailAutor', user.email); form.append('avatar', user.avatar); form.append('descricao', desc); form.append('video', videoFile);
    await fetch('/api/sprints', { method: 'POST', body: form });
    setDesc(''); setVideoFile(null); showToast('Sprint publicado!');
    const res = await fetch('/api/sprints'); setSprints(await res.json());
    setUploading(false);
  }

  async function like(id: string) {
    await fetch(`/api/sprints/like/${id}`, { method: 'POST' });
    setSprints(prev => prev.map(s => s.id === id ? { ...s, likes: (s.likes || 0) + 1 } : s));
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '24px' }}>⚡ SPRINTS</h1>

      <div className="card" style={{ padding: '20px', marginBottom: '28px' }}>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Publicar Sprint</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ border: '2px dashed var(--b-mid)', borderRadius: 'var(--r-md)', padding: '20px', textAlign: 'center', cursor: 'pointer', color: 'var(--t-mid)', fontSize: '13px' }}>
            {videoFile ? `✅ ${videoFile.name}` : '🎬 Clica para escolher vídeo'}
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
          </label>
          <input className="input" placeholder="Descrição do sprint..." value={desc} onChange={e => setDesc(e.target.value)} />
          <button className="btn-race" style={{ alignSelf: 'flex-end', padding: '10px 24px', fontSize: '12px' }} onClick={upload} disabled={uploading}>
            {uploading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span> : '⚡ Publicar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {sprints.map((s: any) => (
          <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
            <video src={s.video_url} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', background: '#000' }} controls playsInline />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src={s.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(s.autor); }} />
                <span style={{ fontWeight: 700, fontSize: '13px', flex: 1 }}>{s.autor}</span>
                <span style={{ fontSize: '10px', color: 'var(--t-dim)' }}>{timeAgo(s.created_at)}</span>
              </div>
              {s.descricao && <p style={{ fontSize: '13px', color: 'var(--t-mid)', marginBottom: '10px' }}>{s.descricao}</p>}
              <button className="action-btn" onClick={() => like(s.id)}>
                <span className="material-symbols-outlined">favorite</span>
                <span>{formatNumber(s.likes || 0)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

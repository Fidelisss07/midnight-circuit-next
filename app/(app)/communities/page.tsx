'use client';
import { useState, useEffect } from 'react';
import { showToast } from '@/components/Toast';
import { avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function CommunitiesPage() {
  const user = getUser();
  const [clubs, setClubs] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [imgFile, setImgFile] = useState<File | null>(null);

  useEffect(() => { fetch('/api/comunidades').then(r => r.json()).then(setClubs); }, []);

  async function create() {
    const fd = new FormData();
    fd.append('nome', form.nome); fd.append('descricao', form.descricao); fd.append('dono', user.email);
    if (imgFile) fd.append('imagem', imgFile);
    await fetch('/api/comunidades', { method: 'POST', body: fd });
    showToast('Clube criado!'); setShowCreate(false);
    fetch('/api/comunidades').then(r => r.json()).then(setClubs);
  }

  async function toggleMembro(c: any) {
    const isMembro = (c.membros || []).includes(user.email);
    await fetch(`/api/comunidades/${c.id}/${isMembro ? 'sair' : 'entrar'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
    showToast(isMembro ? 'Saíste do clube' : 'Entraste no clube!');
    fetch('/api/comunidades').then(r => r.json()).then(setClubs);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>🏎️ CLUBES</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Criar</button>
      </div>

      {showCreate && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Novo Clube</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input className="input" placeholder="Nome do clube" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            <textarea className="input" placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'none', minHeight: '80px' }} />
            <label style={{ border: '1px dashed var(--b-mid)', borderRadius: 'var(--r-sm)', padding: '10px', cursor: 'pointer', fontSize: '12px', color: 'var(--t-mid)' }}>
              {imgFile ? imgFile.name : '📷 Imagem do clube'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setImgFile(e.target.files?.[0] || null)} />
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={create}>Criar Clube</button>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
        {clubs.map((c: any) => {
          const isMembro = (c.membros || []).includes(user?.email);
          return (
            <div key={c.id} className="card card-lift" style={{ overflow: 'hidden' }}>
              {c.imagem && <div style={{ height: '120px', background: `url('${c.imagem}') center/cover`, backgroundColor: 'var(--bg-lift)' }} />}
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 900, fontSize: '16px', fontFamily: 'var(--f-display)', textTransform: 'uppercase', marginBottom: '4px' }}>{c.nome}</div>
                <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginBottom: '12px' }}>{c.descricao}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--t-dim)' }}>{(c.membros || []).length} membros</span>
                  <button className={`btn ${isMembro ? 'btn-secondary' : 'btn-primary'}`} style={{ fontSize: '11px', padding: '6px 14px' }} onClick={() => toggleMembro(c)}>
                    {isMembro ? 'Sair' : 'Entrar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

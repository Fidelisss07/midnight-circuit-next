'use client';
import { useState, useEffect } from 'react';
import { showToast } from '@/components/Toast';
import { avatarFallback } from '@/lib/utils';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const CATS = ['todos','carros','peças','acessórios','rodas','jantes','pneus','tuning','outros'];

export default function MarketplacePage() {
  const user = getUser();
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState('todos');
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', categoria: 'peças', preco: '', condicao: 'bom', descricao: '', localizacao: '' });

  useEffect(() => { load(); }, [cat, q]);

  async function load() {
    const params = new URLSearchParams({ cat, q });
    const res = await fetch(`/api/marketplace?${params}`);
    setItems(await res.json());
  }

  async function publish() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('vendedor_email', user.email); fd.append('vendedor_nome', user.nome); fd.append('vendedor_avatar', user.avatar);
    await fetch('/api/marketplace', { method: 'POST', body: fd });
    showToast('Anúncio publicado!'); setShowForm(false); load();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>🛒 MERCADO</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Anunciar</button>
      </div>

      <div className="input-group" style={{ position: 'relative', marginBottom: '16px' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t-dim)', pointerEvents: 'none' }}>search</span>
        <input className="input" style={{ paddingLeft: '40px' }} placeholder="Pesquisar..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }} className="no-scrollbar">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${c === cat ? 'var(--c-fire2)' : 'var(--b-mid)'}`, background: c === cat ? 'var(--c-fire2)' : 'transparent', color: c === cat ? '#000' : 'var(--t-mid)', cursor: 'pointer', textTransform: 'capitalize' }}>
            {c}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Novo Anúncio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input className="input" style={{ gridColumn: '1/-1' }} placeholder="Título do anúncio" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {CATS.filter(c => c !== 'todos').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input" type="number" placeholder="Preço (€)" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} />
            <select className="input" value={form.condicao} onChange={e => setForm(f => ({ ...f, condicao: e.target.value }))}>
              <option value="novo">Novo</option><option value="bom">Bom estado</option><option value="usado">Usado</option>
            </select>
            <input className="input" placeholder="Localização" value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} />
            <textarea className="input" style={{ gridColumn: '1/-1', resize: 'none', minHeight: '80px' }} placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-primary" onClick={publish}>Publicar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
        {items.map((item: any) => (
          <div key={item.id} className="card card-lift" style={{ overflow: 'hidden' }}>
            {item.imagem_url && <div style={{ height: '180px', background: `url('${item.imagem_url}') center/cover`, backgroundColor: 'var(--bg-lift)' }} />}
            <div style={{ padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--f-display)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</div>
              <div style={{ fontSize: '12px', color: 'var(--t-mid)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.descricao}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 900, color: 'var(--c-fire2)' }}>€{item.preco || 0}</span>
                <span className="badge badge-ghost">{item.categoria}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--b-dim)' }}>
                <img src={item.vendedor_avatar} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(item.vendedor_nome || '?'); }} />
                <span style={{ fontSize: '11px', color: 'var(--t-mid)' }}>{item.vendedor_nome}</span>
                {item.localizacao && <span style={{ fontSize: '10px', color: 'var(--t-dim)', marginLeft: 'auto' }}>📍 {item.localizacao}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

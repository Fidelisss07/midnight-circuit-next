'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.senha !== form.confirmar) { setErro('Palavras-passe não coincidem'); return; }
    setLoading(true); setErro('');
    try {
      const res = await fetch('/api/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: form.nome, email: form.email, senha: form.senha }) });
      if (!res.ok) { const d = await res.json(); setErro(d.erro || 'Erro'); setLoading(false); return; }
      const user = await res.json();
      localStorage.setItem('usuario_logado', JSON.stringify(user));
      router.push('/feed');
    } catch { setErro('Erro de ligação'); setLoading(false); }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', background: 'linear-gradient(135deg,var(--c-fire),var(--c-fire2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Criar Conta</h1>
          <p style={{ color: 'var(--t-mid)', fontSize: '13px', marginTop: '4px' }}>Junta-te à comunidade</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">person</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="text" placeholder="O teu nome de piloto" value={form.nome} onChange={set('nome')} required />
            </div>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">alternate_email</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">lock</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="password" placeholder="Palavra-passe" value={form.senha} onChange={set('senha')} required minLength={6} />
            </div>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">lock_check</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="password" placeholder="Confirmar palavra-passe" value={form.confirmar} onChange={set('confirmar')} required />
            </div>
            {erro && <div style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>{erro}</div>}
            <button type="submit" className="btn-race" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
              {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span> : <><span className="material-symbols-outlined">rocket_launch</span> Criar Conta</>}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--t-mid)', marginTop: '20px' }}>
            Já tens conta? <Link href="/login" style={{ color: 'var(--c-fire2)', fontWeight: 700 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

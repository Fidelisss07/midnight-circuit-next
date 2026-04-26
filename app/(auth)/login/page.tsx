'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro('');
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
      if (!res.ok) { setErro('Email ou senha incorretos'); setLoading(false); return; }
      const user = await res.json();
      localStorage.setItem('usuario_logado', JSON.stringify(user));
      router.push('/feed');
    } catch { setErro('Erro de ligação'); setLoading(false); }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '36px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'linear-gradient(135deg,var(--c-fire),var(--c-fire2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GearHub</h1>
          <p style={{ color: 'var(--t-mid)', fontSize: '13px', marginTop: '6px' }}>A rede social dos entusiastas de carros</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px' }}>Entrar na pista</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">alternate_email</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="email" placeholder="O teu email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon-left">lock</span>
              <input className="input" style={{ paddingLeft: '40px' }} type="password" placeholder="Palavra-passe" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            {erro && <div style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>{erro}</div>}
            <button type="submit" className="btn-race" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
              {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span> : <><span className="material-symbols-outlined">flag</span> Arrancar</>}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--t-mid)', marginTop: '20px' }}>
            Sem conta? <Link href="/register" style={{ color: 'var(--c-fire2)', fontWeight: 700 }}>Regista-te</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

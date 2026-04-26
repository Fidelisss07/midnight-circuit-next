'use client';
import { useState, useEffect, useRef } from 'react';
import { timeAgo, formatNumber, avatarFallback } from '@/lib/utils';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

export default function FeedPage() {
  const user = getUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<Record<string, any>>({});
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalPost, setModalPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [storyViewer, setStoryViewer] = useState<{ stories: any[]; index: number } | null>(null);
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadPosts(); loadStories(); }, []);

  async function loadPosts() {
    const res = await fetch('/api/posts');
    setPosts(await res.json());
  }

  async function loadStories() {
    const res = await fetch('/api/stories');
    const data = await res.json();
    const grouped: Record<string, any> = {};
    data.forEach((s: any) => {
      const email = s.email_autor || s.emailAutor;
      if (!grouped[email]) grouped[email] = { nome: s.nome, avatar: s.avatar, posts: [] };
      grouped[email].posts.push(s);
    });
    setStories(grouped);
  }

  async function handlePost() {
    if (!content && !mediaFile) return showToast('Escreve algo!', 'error');
    setLoading(true);
    const form = new FormData();
    form.append('nome', user.nome); form.append('avatar', user.avatar);
    form.append('emailAutor', user.email); form.append('conteudo', content);
    if (mediaFile) form.append('midia', mediaFile);
    await fetch('/api/posts', { method: 'POST', body: form });
    setContent(''); setMediaFile(null); setMediaPreview('');
    showToast('Post publicado!'); loadPosts(); setLoading(false);
  }

  async function handleLike(id: string) {
    await fetch(`/api/posts/like/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quemDeuLikeNome: user.nome, quemDeuLikeEmail: user.email, quemDeuLikeAvatar: user.avatar }) });
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)));
  }

  async function handleComment() {
    if (!commentText.trim() || !modalPost) return;
    await fetch(`/api/posts/comentar/${modalPost.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autor: user.nome, emailAutor: user.email, avatar: user.avatar, texto: commentText }) });
    const novoComentario = { autor: user.nome, avatar: user.avatar, texto: commentText };
    setModalPost((p: any) => ({ ...p, comentarios: [...(p.comentarios || []), novoComentario] }));
    setCommentText(''); showToast('Comentário adicionado!');
  }

  async function handleStoryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData();
    form.append('emailAutor', user.email); form.append('nome', user.nome); form.append('avatar', user.avatar); form.append('midia', file);
    await fetch('/api/stories', { method: 'POST', body: form });
    loadStories(); showToast('Story publicado!');
  }

  function openStory(storyList: any[], idx: number) {
    setStoryViewer({ stories: storyList, index: idx });
    scheduleStoryNext(storyList, idx);
  }

  function scheduleStoryNext(storyList: any[], idx: number) {
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    storyTimerRef.current = setTimeout(() => {
      if (idx + 1 < storyList.length) openStory(storyList, idx + 1);
      else setStoryViewer(null);
    }, 5000);
  }

  function prevStory() {
    if (!storyViewer) return;
    const ni = Math.max(0, storyViewer.index - 1);
    setStoryViewer(s => s ? { ...s, index: ni } : null);
    scheduleStoryNext(storyViewer.stories, ni);
  }

  function nextStory() {
    if (!storyViewer) return;
    const ni = storyViewer.index + 1;
    if (ni >= storyViewer.stories.length) { setStoryViewer(null); return; }
    setStoryViewer(s => s ? { ...s, index: ni } : null);
    scheduleStoryNext(storyViewer.stories, ni);
  }

  if (!user) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase' }}>PADDOCK</h1>
          <p style={{ color: 'var(--t-mid)', fontSize: '13px', marginTop: '2px' }}>Bem-vindo, <span style={{ color: 'var(--c-fire2)', fontWeight: 600 }}>{user.nome}</span></p>
        </div>
      </div>

      {/* Stories */}
      <div style={{ marginBottom: '28px', overflowX: 'auto', paddingBottom: '8px' }} className="no-scrollbar">
        <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content', alignItems: 'center' }}>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <div className="story-ring" style={{ background: 'none', border: '2px dashed var(--b-hi)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-void)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--c-fire2)', fontSize: '24px' }}>add</span>
              </div>
            </div>
            <span className="label" style={{ fontSize: '9px' }}>Novo</span>
            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleStoryUpload} />
          </label>
          {Object.entries(stories).map(([email, g]: [string, any]) => (
            <div key={email} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => openStory(g.posts, 0)}>
              <div className="story-ring">
                <img src={g.avatar} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(g.nome); }} />
              </div>
              <span className="label" style={{ fontSize: '9px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email === user.email ? 'Tu' : g.nome}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post */}
      <div className="card" style={{ padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '14px' }}>
          <img className="avatar avatar-round" src={user.avatar} alt="" style={{ width: '40px', height: '40px' }} onError={e => { (e.target as HTMLImageElement).src = avatarFallback(user.nome); }} />
          <div style={{ flex: 1 }}>
            <textarea className="input" style={{ background: 'transparent', border: 'none', padding: 0, minHeight: '48px', fontSize: '15px', resize: 'none', width: '100%' }} placeholder="O que estás a modificar hoje?" value={content} onChange={e => setContent(e.target.value)} />
            {mediaPreview && (
              <div style={{ marginTop: '12px', height: '200px', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--b-mid)' }}>
                {mediaFile?.type.startsWith('video') ? <video src={mediaPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop /> : <img src={mediaPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--b-dim)' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--t-mid)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', padding: '6px 10px', borderRadius: 'var(--r-sm)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_a_photo</span> Mídia
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setMediaFile(f); setMediaPreview(URL.createObjectURL(f)); } }} />
              </label>
              <button className="btn-race" style={{ padding: '10px 24px', fontSize: '12px' }} onClick={handlePost} disabled={loading}>
                {loading ? <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span> : 'Arrancar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
        {posts.length === 0 && <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--r-xl)' }} />}
        {posts.map((p, i) => {
          const mid = p.midia_url || p.midiaUrl;
          const isVid = p.tipo === 'video' || (mid && /\.(mp4|webm|ogg)$/i.test(mid));
          return (
            <div key={p.id || i} className="post-card card-glow" style={{ cursor: 'pointer' }} onClick={() => setModalPost(p)}>
              <div className="post-header">
                <img className="avatar avatar-sm avatar-round" src={p.avatar} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(p.nome); }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{p.nome}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--t-dim)', fontFamily: 'var(--f-mono)' }}>{timeAgo(p.created_at)}</span>
              </div>
              {mid && (
                <div className="post-media">
                  {isVid ? <video src={mid} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop playsInline /> : <div style={{ width: '100%', height: '100%', background: `url('${mid}') center/cover` }} />}
                </div>
              )}
              <div className="post-actions">
                <button className="action-btn" onClick={e => { e.stopPropagation(); handleLike(p.id); }}>
                  <span className="material-symbols-outlined">favorite</span>
                  <span>{formatNumber(p.likes || 0)}</span>
                </button>
                <button className="action-btn">
                  <span className="material-symbols-outlined">chat_bubble</span>
                  <span>{p.comentarios?.length || 0}</span>
                </button>
              </div>
              {p.conteudo && <div className="post-body"><p className="line-clamp-2"><span style={{ fontWeight: 700, color: 'var(--t-white)', marginRight: '6px', textTransform: 'uppercase', fontSize: '11px' }}>{p.nome}</span>{p.conteudo}</p></div>}
            </div>
          );
        })}
      </div>

      {/* Post Modal */}
      {modalPost && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalPost(null); }}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--b-dim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={modalPost.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(modalPost.nome); }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{modalPost.nome}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t-dim)' }}>{timeAgo(modalPost.created_at)}</div>
                </div>
              </div>
              <button onClick={() => setModalPost(null)} style={{ color: 'var(--t-mid)' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            {(modalPost.midia_url || modalPost.midiaUrl) && (
              <div style={{ maxHeight: '420px', overflow: 'hidden', background: 'black' }}>
                {modalPost.tipo === 'video' ? <video src={modalPost.midia_url} controls style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }} /> : <img src={modalPost.midia_url} style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }} alt="" />}
              </div>
            )}
            {modalPost.conteudo && <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b-dim)', fontSize: '14px', color: 'var(--t-mid)' }}><span style={{ fontWeight: 700, color: 'var(--t-white)', marginRight: '6px' }}>{modalPost.nome}</span>{modalPost.conteudo}</div>}
            <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
              {(modalPost.comentarios || []).length === 0
                ? <div style={{ textAlign: 'center', color: 'var(--t-dim)', fontSize: '13px', padding: '16px' }}>Sem comentários. Sê o primeiro!</div>
                : (modalPost.comentarios || []).map((c: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <img src={c.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(c.autor); }} />
                    <div style={{ flex: 1, background: 'var(--bg-lift)', borderRadius: 'var(--r-md)', padding: '8px 12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '12px', marginRight: '8px' }}>{c.autor}</span>
                      <span style={{ fontSize: '13px', color: 'var(--t-mid)' }}>{c.texto}</span>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b-dim)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img src={user.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" onError={e => { (e.target as HTMLImageElement).src = avatarFallback(user.nome); }} />
              <input className="input" style={{ flex: 1, padding: '8px 14px', fontSize: '13px' }} placeholder="Adiciona um comentário..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleComment(); }} />
              <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '12px', flexShrink: 0 }} onClick={handleComment}>Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {storyViewer && (() => {
        const s = storyViewer.stories[storyViewer.index];
        const mid = s.midia_url || s.midiaUrl;
        const isVid = s.tipo === 'video' || (mid && /\.(mp4|webm|ogg)$/i.test(mid));
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'black', display: 'flex', flexDirection: 'column', animation: 'fade-in 0.3s' }}>
            <style>{`@keyframes story-prog { from{width:0} to{width:100%} }`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', gap: '4px', padding: '8px 10px' }}>
              {storyViewer.stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'white', width: i < storyViewer.index ? '100%' : '0%', animation: i === storyViewer.index ? 'story-prog 5000ms linear forwards' : 'none' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', top: '20px', left: '14px', right: '14px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={s.avatar} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} alt="" />
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>{s.nome}</div>
              </div>
              <button onClick={() => { if (storyTimerRef.current) clearTimeout(storyTimerRef.current); setStoryViewer(null); }} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
              {isVid ? <video src={mid} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} autoPlay playsInline onEnded={nextStory} /> : <img src={mid} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} alt="" />}
            </div>
            <div onClick={prevStory} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', zIndex: 9, cursor: 'pointer' }} />
            <div onClick={nextStory} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', zIndex: 9, cursor: 'pointer' }} />
          </div>
        );
      })()}
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase, notificar } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: post } = await supabase.from('posts').select('likes, email_autor, midia_url').eq('id', params.id).single();
    if (!post) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
    await supabase.from('posts').update({ likes: (post.likes || 0) + 1 }).eq('id', params.id);
    const body = await req.json();
    if (post.email_autor) notificar('like', { nome: body.quemDeuLikeNome, email: body.quemDeuLikeEmail, avatar: body.quemDeuLikeAvatar }, post.email_autor, 'curtiu o teu post.', post.midia_url);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

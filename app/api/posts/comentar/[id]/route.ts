import { NextRequest, NextResponse } from 'next/server';
import { supabase, notificar } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { data: post } = await supabase.from('posts').select('comentarios, email_autor').eq('id', params.id).single();
    if (!post) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
    const comentarios = [...(post.comentarios || []), { autor: body.autor, emailAutor: body.emailAutor, avatar: body.avatar, texto: body.texto }];
    await supabase.from('posts').update({ comentarios }).eq('id', params.id);
    if (post.email_autor) notificar('comment', { nome: body.autor, email: body.emailAutor, avatar: body.avatar }, post.email_autor, 'comentou no teu post.');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

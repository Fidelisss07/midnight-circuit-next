import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { data } = await supabase.from('sprints').select('comentarios').eq('id', params.id).single();
  if (!data) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
  const comentarios = [...(data.comentarios || []), { autor: body.autor, emailAutor: body.emailAutor, avatar: body.avatar, texto: body.texto }];
  await supabase.from('sprints').update({ comentarios }).eq('id', params.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}

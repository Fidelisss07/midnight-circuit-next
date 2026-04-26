import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const quinzeMin = new Date(Date.now() - 900000).toISOString();
  const { data } = await supabase.from('lives').select('*').gte('created_at', quinzeMin).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  await supabase.from('lives').insert({ titulo: body.titulo, email_autor: body.email_autor, nome_autor: body.nome_autor, avatar: body.avatar, viewers: 0 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

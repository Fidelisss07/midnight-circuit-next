import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const doisH = new Date(Date.now() - 7200000).toISOString();
  const { data } = await supabase.from('mapa_alertas').select('*').gte('created_at', doisH).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  await supabase.from('mapa_alertas').insert({ tipo: body.tipo, lat: body.lat, lng: body.lng, descricao: body.descricao || '', criador_email: body.criador_email, criador_nome: body.criador_nome, confirmacoes: 1, negacoes: 0 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

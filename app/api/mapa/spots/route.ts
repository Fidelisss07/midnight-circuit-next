import { NextRequest, NextResponse } from 'next/server';
import { supabase, ganharXP } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('mapa_spots').select('*').order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  await supabase.from('mapa_spots').insert({ nome: body.nome, tipo: body.tipo, descricao: body.descricao, lat: body.lat, lng: body.lng, criador_email: body.criador_email, criador_nome: body.criador_nome });
  ganharXP(body.criador_email, 40);
  return NextResponse.json({ ok: true }, { status: 201 });
}

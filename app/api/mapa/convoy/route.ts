import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  await supabase.from('mapa_convoy').insert({ email: body.email, nome: body.nome, avatar: body.avatar, lat: body.lat, lng: body.lng });
  return NextResponse.json({ ok: true }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase, calcDistance } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { lat, lng, email } = Object.fromEntries(req.nextUrl.searchParams);
  const cincoMin = new Date(Date.now() - 300000).toISOString();
  const { data } = await supabase.from('mapa_radar').select('*').neq('email', email).gte('updated_at', cincoMin);
  const result = (data || []).map(u => ({ ...u, distancia: calcDistance(parseFloat(lat), parseFloat(lng), u.lat, u.lng) / 1000 })).filter(u => u.distancia < 50).sort((a, b) => a.distancia - b.distancia);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  await supabase.from('mapa_radar').upsert({ email: body.email, lat: body.lat, lng: body.lng, updated_at: new Date().toISOString() }, { onConflict: 'email' });
  return NextResponse.json({ ok: true }, { status: 201 });
}

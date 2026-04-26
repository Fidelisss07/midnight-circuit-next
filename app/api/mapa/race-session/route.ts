import { NextRequest, NextResponse } from 'next/server';
import { supabase, ganharXP } from '@/lib/supabase';

export async function POST(req: Request) {
  const { session_id, email, nome, avatar, dest_lat, dest_lng, dest_nome, mode, tempo_segundos, finished } = await req.json();
  await supabase.from('mapa_race_sessions').upsert({ session_id, email, nome, avatar, dest_lat, dest_lng, dest_nome, mode, tempo_segundos, finished });
  if (finished) await ganharXP(email, mode === 'corsa' ? 80 : mode === 'treino' ? 50 : 20);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id');
  const { data } = await supabase.from('mapa_race_sessions').select('*').eq('session_id', session_id).order('tempo_segundos', { ascending: true });
  return NextResponse.json(data || []);
}

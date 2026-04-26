import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').toLowerCase().trim();
  if (!q) return NextResponse.json({ usuarios: [], carros: [] });
  const { data: usuarios } = await supabase.from('usuarios').select('nome, email, avatar, nivel, bio').ilike('nome', `%${q}%`).limit(20);
  const { data: carros } = await supabase.from('carros').select('id, marca, modelo, apelido, imagem_url, email_dono, dono, avatar, specs, votos').or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,apelido.ilike.%${q}%`).limit(20);
  return NextResponse.json({ usuarios: usuarios || [], carros: carros || [] });
}

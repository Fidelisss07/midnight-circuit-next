import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/perfil/username?u=fidelis07
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('u');
  if (!username) return NextResponse.json({ erro: 'Username obrigatório' }, { status: 400 });
  const { data, error } = await supabase.from('usuarios').select('*').eq('username', username.toLowerCase()).single();
  if (error || !data) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
  const { senha: _, ...usuario } = data as any;
  return NextResponse.json(usuario);
}

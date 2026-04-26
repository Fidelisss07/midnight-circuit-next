import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email || email === 'undefined') return NextResponse.json({ erro: 'Email inválido' }, { status: 400 });
  const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
  if (error || !data) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
  const { senha: _, ...usuario } = data;
  return NextResponse.json(usuario);
}

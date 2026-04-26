import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { email: string } }) {
  try {
    const email = decodeURIComponent(params.email);
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
    if (error || !data) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
    const { senha: _, ...usuario } = data as any;
    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json({ erro: 'Erro servidor' }, { status: 500 });
  }
}

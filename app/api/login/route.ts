import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();
    const { data: user, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
    if (error || !user || !(await bcrypt.compare(senha, user.senha)))
      return NextResponse.json({ erro: 'Credenciais inválidas' }, { status: 401 });
    const { senha: _, ...resultado } = user;
    return NextResponse.json(resultado);
  } catch { return NextResponse.json({ erro: 'Erro login' }, { status: 500 }); }
}

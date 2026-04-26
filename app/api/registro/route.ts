import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data: existente } = await supabase.from('usuarios').select('id').eq('email', body.email).maybeSingle();
    if (existente) return NextResponse.json({ erro: 'Email em uso' }, { status: 400 });
    const hash = await bcrypt.hash(body.senha, 10);
    const { data, error } = await supabase.from('usuarios').insert({
      nome: body.nome, email: body.email, senha: hash,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.nome)}&background=ef4444&color=fff`,
      capa: '', bio: 'Piloto iniciante',
    }).select().single();
    if (error) throw error;
    const { senha: _, ...novo } = data;
    return NextResponse.json(novo, { status: 201 });
  } catch (e) { return NextResponse.json({ erro: 'Erro registro' }, { status: 500 }); }
}

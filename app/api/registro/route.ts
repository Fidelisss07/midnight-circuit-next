import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

async function uniqueUsername(base: string): Promise<string> {
  const clean = slugify(base) || 'piloto';
  let candidate = clean;
  let attempt = 0;
  while (true) {
    const { data } = await supabase.from('usuarios').select('id').eq('username', candidate).maybeSingle();
    if (!data) return candidate;
    attempt++;
    candidate = `${clean}${Math.floor(Math.random() * 9000) + 1000}`;
    if (attempt > 10) candidate = `${clean}${Date.now()}`;
    if (attempt > 11) break;
  }
  return candidate;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data: existente } = await supabase.from('usuarios').select('id').eq('email', body.email).maybeSingle();
    if (existente) return NextResponse.json({ erro: 'Email em uso' }, { status: 400 });

    // username: use provided one or generate from name
    let username = body.username ? body.username.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
    if (username.length < 3) username = await uniqueUsername(body.nome);
    else {
      const { data: taken } = await supabase.from('usuarios').select('id').eq('username', username).maybeSingle();
      if (taken) return NextResponse.json({ erro: 'Username já em uso' }, { status: 400 });
    }

    const hash = await bcrypt.hash(body.senha, 10);
    const { data, error } = await supabase.from('usuarios').insert({
      nome: body.nome, email: body.email, senha: hash, username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.nome)}&background=ef4444&color=fff`,
      capa: '', bio: 'Piloto iniciante',
    }).select().single();
    if (error) throw error;
    const { senha: _, ...novo } = data;
    return NextResponse.json(novo, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro registro' }, { status: 500 }); }
}

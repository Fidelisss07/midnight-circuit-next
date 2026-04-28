import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const emailOriginal = form.get('emailOriginal') as string;
    const upd: Record<string, string> = {
      nome: form.get('nome') as string,
      bio: form.get('bio') as string,
    };

    const newUsername = (form.get('username') as string || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (newUsername.length >= 3) {
      const { data: taken } = await supabase.from('usuarios').select('email').eq('username', newUsername).neq('email', emailOriginal).maybeSingle();
      if (taken) return NextResponse.json({ erro: 'Username já em uso' }, { status: 400 });
      upd.username = newUsername;
    }

    const avatarFile = form.get('avatar') as File | null;
    const capaFile = form.get('capa') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      const buf = Buffer.from(await avatarFile.arrayBuffer());
      upd.avatar = await uploadFile('avatars', `${Date.now()}-${avatarFile.name}`, buf, avatarFile.type);
    }
    if (capaFile && capaFile.size > 0) {
      const buf = Buffer.from(await capaFile.arrayBuffer());
      upd.capa = await uploadFile('capas', `${Date.now()}-${capaFile.name}`, buf, capaFile.type);
    }

    const { data, error } = await supabase.from('usuarios').update(upd).eq('email', emailOriginal).select().single();
    if (error) throw error;
    const { senha: _, ...usuario } = data;
    return NextResponse.json(usuario);
  } catch { return NextResponse.json({ erro: 'Erro update' }, { status: 500 }); }
}

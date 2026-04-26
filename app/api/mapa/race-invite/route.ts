import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { de_email, de_nome, de_avatar, para_emails, dest_nome } = await req.json();
  if (!para_emails?.length) return NextResponse.json({ ok: true });
  for (const para of para_emails) {
    await supabase.from('notificacoes').insert({ tipo: 'race_invite', de: de_nome, avatar: de_avatar, para, texto: `convidou-te para uma corrida até ${dest_nome}` });
  }
  return NextResponse.json({ ok: true });
}

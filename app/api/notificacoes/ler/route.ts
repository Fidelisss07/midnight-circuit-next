import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { user } = await req.json();
  await supabase.from('notificacoes').update({ lida: true }).eq('para', user);
  return NextResponse.json({ ok: true });
}

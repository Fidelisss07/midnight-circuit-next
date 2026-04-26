import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { email } = await req.json();
  const { data: c } = await supabase.from('comunidades').select('membros').eq('id', params.id).single();
  if (!c) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
  await supabase.from('comunidades').update({ membros: (c.membros || []).filter((m: string) => m !== email) }).eq('id', params.id);
  return NextResponse.json({ ok: true });
}

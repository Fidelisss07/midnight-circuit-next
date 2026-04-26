import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase.from('mapa_alertas').select('confirmacoes').eq('id', params.id).single();
  if (!data) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 });
  await supabase.from('mapa_alertas').update({ confirmacoes: (data.confirmacoes || 0) + 1 }).eq('id', params.id);
  return NextResponse.json({ ok: true });
}

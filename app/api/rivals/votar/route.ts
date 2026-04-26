import { NextResponse } from 'next/server';
import { supabase, ganharXP } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { vencedorId, perdedorId } = await req.json();
    const { data: v } = await supabase.from('carros').select('votos, batalhas, email_dono').eq('id', vencedorId).single();
    const { data: p } = await supabase.from('carros').select('batalhas').eq('id', perdedorId).single();
    await supabase.from('carros').update({ votos: (v.votos || 0) + 1, batalhas: (v.batalhas || 0) + 1 }).eq('id', vencedorId);
    await supabase.from('carros').update({ batalhas: (p.batalhas || 0) + 1 }).eq('id', perdedorId);
    if (v?.email_dono) ganharXP(v.email_dono, 15);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

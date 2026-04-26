import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { count } = await supabase.from('carros').select('*', { count: 'exact', head: true });
    if (!count || count < 2) return NextResponse.json({ erro: 'Falta Carros' }, { status: 400 });
    const idx1 = Math.floor(Math.random() * count);
    let idx2 = Math.floor(Math.random() * (count - 1));
    if (idx2 >= idx1) idx2++;
    const { data: c1 } = await supabase.from('carros').select('*').range(idx1, idx1).single();
    const { data: c2 } = await supabase.from('carros').select('*').range(idx2, idx2).single();
    return NextResponse.json([c1, c2]);
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

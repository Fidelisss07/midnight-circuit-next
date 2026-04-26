import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json([]);
    const { data: me } = await supabase.from('usuarios').select('seguindo').eq('email', email).single();
    if (!me?.seguindo?.length) return NextResponse.json([]);
    const { data } = await supabase.from('usuarios').select('nome, email, avatar, nivel, xp').in('email', me.seguindo);
    return NextResponse.json(data || []);
  } catch { return NextResponse.json([]); }
}

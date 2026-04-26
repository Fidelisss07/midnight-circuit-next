import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('usuarios').select('nome, avatar, nivel, xp, xp_semanal, email').order('xp_semanal', { ascending: false }).limit(20);
  return NextResponse.json(data || []);
}

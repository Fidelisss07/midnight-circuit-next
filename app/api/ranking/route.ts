import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('usuarios').select('nome, avatar, nivel, xp, email').order('xp', { ascending: false }).limit(50);
  return NextResponse.json(data || []);
}

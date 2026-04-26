import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('usuarios').select('nome, email, avatar, nivel, seguindo');
  return NextResponse.json(data || []);
}

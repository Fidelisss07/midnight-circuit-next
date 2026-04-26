import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get('user');
  const { data } = await supabase.from('notificacoes').select('*').eq('para', user).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

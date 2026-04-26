import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const { data } = await supabase.from('carros').select('*').eq('email_dono', email).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

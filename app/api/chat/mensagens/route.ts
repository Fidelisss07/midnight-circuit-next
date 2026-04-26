import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const eu = req.nextUrl.searchParams.get('eu')!;
  const outro = req.nextUrl.searchParams.get('outro')!;
  const { data } = await supabase.from('chat').select('*')
    .or(`and(de.eq.${eu},para.eq.${outro}),and(de.eq.${outro},para.eq.${eu})`)
    .order('created_at', { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const { de, para, texto } = await req.json();
  await supabase.from('chat').insert({ de, para, texto });
  return NextResponse.json({ ok: true }, { status: 201 });
}

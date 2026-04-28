import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/perfil/check-username?u=fidelis07&exclude=email@email.com
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('u');
  const exclude = req.nextUrl.searchParams.get('exclude'); // current user's email
  if (!username) return NextResponse.json({ available: false });
  const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (clean.length < 3) return NextResponse.json({ available: false, reason: 'Mínimo 3 caracteres' });
  let query = supabase.from('usuarios').select('email').eq('username', clean);
  if (exclude) query = query.neq('email', exclude);
  const { data } = await query.maybeSingle();
  return NextResponse.json({ available: !data, clean });
}

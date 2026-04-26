import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile, ganharXP } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  let query = supabase.from('buildlog').select('*').order('created_at', { ascending: false });
  const email = req.nextUrl.searchParams.get('email');
  if (email) query = query.eq('email_autor', email) as any;
  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    let imagemUrl: string | null = null;
    const img = form.get('imagem') as File | null;
    if (img && img.size > 0) { const buf = Buffer.from(await img.arrayBuffer()); imagemUrl = await uploadFile('posts', `bl-${Date.now()}-${img.name}`, buf, img.type); }
    await supabase.from('buildlog').insert({ tipo: form.get('tipo'), titulo: form.get('titulo'), descricao: form.get('descricao'), custo: parseFloat(form.get('custo') as string) || 0, km: parseInt(form.get('km') as string) || 0, imagem_url: imagemUrl, email_autor: form.get('email_autor'), nome_autor: form.get('nome_autor'), avatar: form.get('avatar') });
    ganharXP(form.get('email_autor') as string, 50);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

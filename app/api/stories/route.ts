import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile } from '@/lib/supabase';

export async function GET() {
  const vinteEQuatroH = new Date(Date.now() - 86400000).toISOString();
  const { data } = await supabase.from('stories').select('*').gte('created_at', vinteEQuatroH).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const midia = form.get('midia') as File;
    if (!midia) return NextResponse.json({ erro: 'Sem ficheiro' }, { status: 400 });
    const buf = Buffer.from(await midia.arrayBuffer());
    const midiaUrl = await uploadFile('stories', `${Date.now()}-${midia.name}`, buf, midia.type);
    const tipo = midia.type.startsWith('video') ? 'video' : 'imagem';
    await supabase.from('stories').insert({ email_autor: form.get('emailAutor'), nome: form.get('nome'), avatar: form.get('avatar'), midia_url: midiaUrl, tipo });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

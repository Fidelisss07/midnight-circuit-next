import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile, ganharXP } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    let midiaUrl: string | null = null;
    let tipo = 'imagem';
    const midia = form.get('midia') as File | null;
    if (midia && midia.size > 0) {
      const buf = Buffer.from(await midia.arrayBuffer());
      midiaUrl = await uploadFile('posts', `${Date.now()}-${midia.name}`, buf, midia.type);
      tipo = midia.type.startsWith('video') ? 'video' : 'imagem';
    }
    const { error } = await supabase.from('posts').insert({
      email_autor: form.get('emailAutor'), nome: form.get('nome'),
      avatar: form.get('avatar'), conteudo: form.get('conteudo'), midia_url: midiaUrl, tipo,
    });
    if (error) throw error;
    ganharXP(form.get('emailAutor') as string, 50);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro post' }, { status: 500 }); }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('comunidades').select('*').order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    let imagemUrl: string | null = null;
    const img = form.get('imagem') as File | null;
    if (img && img.size > 0) {
      const buf = Buffer.from(await img.arrayBuffer());
      imagemUrl = await uploadFile('comunidades', `${Date.now()}-${img.name}`, buf, img.type);
    }
    const dono = form.get('dono') as string;
    await supabase.from('comunidades').insert({ nome: form.get('nome'), descricao: form.get('descricao'), dono, imagem: imagemUrl, membros: [dono], admins: [dono] });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

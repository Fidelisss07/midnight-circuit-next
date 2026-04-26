import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    let imagemUrl: string | null = null;
    const imagem = form.get('imagem') as File | null;
    if (imagem && imagem.size > 0) {
      const buf = Buffer.from(await imagem.arrayBuffer());
      imagemUrl = await uploadFile('carros', `garage-${Date.now()}-${imagem.name}`, buf, imagem.type);
    }
    const { error } = await supabase.from('carros').insert({
      email_dono: form.get('email'),
      dono: form.get('email'),
      marca: form.get('marca'),
      modelo: form.get('modelo'),
      specs: { ano: form.get('ano'), cor: form.get('cv') ? undefined : form.get('cor'), hp: form.get('cv') },
      descricao: form.get('descricao'),
      imagem_url: imagemUrl,
      imagens: imagemUrl ? [imagemUrl] : [],
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ erro: 'Erro garagem' }, { status: 500 });
  }
}

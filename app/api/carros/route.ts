import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile, ganharXP } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('carros').select('*').order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const imagensFiles = form.getAll('imagens') as File[];
    const audioFile = form.get('audio') as File | null;
    const imagensUrls: string[] = [];
    for (const f of imagensFiles) {
      if (f.size > 0) {
        const buf = Buffer.from(await f.arrayBuffer());
        imagensUrls.push(await uploadFile('carros', `${Date.now()}-${f.name}`, buf, f.type));
      }
    }
    let audioUrl: string | null = null;
    if (audioFile && audioFile.size > 0) {
      const buf = Buffer.from(await audioFile.arrayBuffer());
      audioUrl = await uploadFile('carros', `audio-${Date.now()}-${audioFile.name}`, buf, audioFile.type);
    }
    const { error } = await supabase.from('carros').insert({
      dono: form.get('dono'), email_dono: form.get('emailDono'),
      marca: form.get('marca'), modelo: form.get('modelo'), apelido: form.get('apelido'),
      descricao: form.get('descricao'),
      imagem_url: imagensUrls[0] || 'https://via.placeholder.com/600',
      imagens: imagensUrls, audio_url: audioUrl,
      mods: form.get('mods') ? String(form.get('mods')).split(',') : [],
      specs: { hp: form.get('potencia'), torque: form.get('torque'), zero_cem: form.get('zero_cem'), top_speed: form.get('top_speed'), cor: form.get('cor'), ano: form.get('ano'), motor: form.get('motor'), cambio: form.get('cambio'), tracao: form.get('tracao'), peso: form.get('peso') },
    });
    if (error) throw error;
    ganharXP(form.get('emailDono') as string, 100);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile, ganharXP } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase.from('sprints').select('*').order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const video = form.get('video') as File;
    if (!video) return NextResponse.json({ erro: 'Sem video' }, { status: 400 });
    const buf = Buffer.from(await video.arrayBuffer());
    const videoUrl = await uploadFile('sprints', `${Date.now()}-${video.name}`, buf, video.type);
    await supabase.from('sprints').insert({ autor: form.get('autor'), email_autor: form.get('emailAutor'), avatar: form.get('avatar'), descricao: form.get('descricao'), video_url: videoUrl });
    ganharXP(form.get('emailAutor') as string, 40);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

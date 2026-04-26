import { NextRequest, NextResponse } from 'next/server';
import { supabase, uploadFile, ganharXP } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  let query = supabase.from('marketplace').select('*').order('created_at', { ascending: false });
  const cat = req.nextUrl.searchParams.get('cat');
  const email = req.nextUrl.searchParams.get('email');
  const q = req.nextUrl.searchParams.get('q');
  if (cat && cat !== 'todos') query = query.eq('categoria', cat) as any;
  if (email) query = query.eq('vendedor_email', email) as any;
  if (q) query = query.ilike('titulo', `%${q}%`) as any;
  const { data } = await query.limit(60);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('imagens') as File[];
    const imagens: string[] = [];
    for (const f of files) {
      if (f.size > 0) { const buf = Buffer.from(await f.arrayBuffer()); imagens.push(await uploadFile('posts', `mkt-${Date.now()}-${f.name}`, buf, f.type)); }
    }
    await supabase.from('marketplace').insert({ titulo: form.get('titulo'), categoria: form.get('categoria'), preco: parseFloat(form.get('preco') as string) || 0, condicao: form.get('condicao'), descricao: form.get('descricao'), localizacao: form.get('localizacao'), vendedor_email: form.get('vendedor_email'), vendedor_nome: form.get('vendedor_nome'), vendedor_avatar: form.get('vendedor_avatar'), imagem_url: imagens[0] || null, imagens });
    ganharXP(form.get('vendedor_email') as string, 20);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

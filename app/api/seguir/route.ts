import { NextResponse } from 'next/server';
import { supabase, notificar } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { eu, ele } = await req.json();
    const { data: uEu } = await supabase.from('usuarios').select('seguindo, nome, avatar').eq('email', eu).single();
    const { data: uEle } = await supabase.from('usuarios').select('seguidores').eq('email', ele).single();
    if (!uEu || !uEle) return NextResponse.json({ erro: 'Not found' }, { status: 404 });
    const jaSeguindo = (uEu.seguindo || []).includes(ele);
    if (jaSeguindo) {
      await supabase.from('usuarios').update({ seguindo: uEu.seguindo.filter((e: string) => e !== ele) }).eq('email', eu);
      await supabase.from('usuarios').update({ seguidores: uEle.seguidores.filter((e: string) => e !== eu) }).eq('email', ele);
      return NextResponse.json({ aSeguir: false });
    } else {
      await supabase.from('usuarios').update({ seguindo: [...(uEu.seguindo || []), ele] }).eq('email', eu);
      await supabase.from('usuarios').update({ seguidores: [...(uEle.seguidores || []), eu] }).eq('email', ele);
      notificar('follow', { nome: uEu.nome, email: eu, avatar: uEu.avatar }, ele, 'começou a seguir-te.');
      return NextResponse.json({ aSeguir: true });
    }
  } catch { return NextResponse.json({ erro: 'Erro' }, { status: 500 }); }
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function uploadFile(bucket: string, filename: string, buffer: Buffer, mimetype: string): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, { contentType: mimetype, upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
  return publicUrl;
}

export async function ganharXP(email: string, qtd: number) {
  if (!email) return;
  try {
    const { data: user } = await supabase.from('usuarios').select('xp, nivel').eq('email', email).single();
    if (!user) return;
    const novoXp = (user.xp || 0) + qtd;
    const novoNivel = Math.floor(novoXp / 1000) + 1;
    await supabase.from('usuarios').update({ xp: novoXp, nivel: novoNivel, xp_semanal: novoXp }).eq('email', email);
  } catch {}
}

export async function notificar(tipo: string, deObj: { nome: string; email: string; avatar: string }, paraEmail: string, texto: string, img?: string | null) {
  if (!paraEmail || deObj.email === paraEmail) return;
  try {
    const cincoMinAtras = new Date(Date.now() - 300000).toISOString();
    const { data: recente } = await supabase.from('notificacoes')
      .select('id').eq('tipo', tipo).eq('de', deObj.nome).eq('para', paraEmail)
      .gte('created_at', cincoMinAtras).maybeSingle();
    if (!recente) {
      await supabase.from('notificacoes').insert({
        tipo, de: deObj.nome, avatar: deObj.avatar, para: paraEmail, texto, img_preview: img ?? null,
      });
    }
  } catch {}
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export { calcDistance };

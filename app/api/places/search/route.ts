import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { q, lat, lng } = Object.fromEntries(req.nextUrl.searchParams);
  if (!q) return NextResponse.json([]);
  const key = process.env.TOMTOM_API_KEY;
  const params = new URLSearchParams({ key: key!, limit: '8', language: 'pt-BR', ...(lat && lng ? { lat, lon: lng, radius: '50000' } : {}) });
  const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?${params}`;
  const r = await fetch(url);
  if (!r.ok) return NextResponse.json([]);
  const data = await r.json();
  return NextResponse.json((data.results || []).map((p: any) => ({ name: p.poi?.name || p.address?.freeformAddress || q, address: p.address?.freeformAddress || '', municipality: p.address?.municipality || '', category: p.poi?.categories?.[0] || '', lat: p.position?.lat, lon: p.position?.lon })));
}

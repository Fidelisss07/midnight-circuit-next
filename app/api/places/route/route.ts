import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { fromLat, fromLng, toLat, toLng } = Object.fromEntries(req.nextUrl.searchParams);
  if (!fromLat || !toLat) return NextResponse.json({ error: 'coords missing' }, { status: 400 });
  const key = process.env.TOMTOM_API_KEY;
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json?key=${key}&routeType=fastest&traffic=true&travelMode=car`;
  const r = await fetch(url);
  if (!r.ok) return NextResponse.json({}, { status: 500 });
  return NextResponse.json(await r.json());
}

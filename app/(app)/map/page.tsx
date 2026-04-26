'use client';
import { useEffect, useRef, useState } from 'react';
import { showToast } from '@/components/Toast';

function getUser() { try { return JSON.parse(localStorage.getItem('usuario_logado') || 'null'); } catch { return null; } }

const ALERT_TYPES: Record<string, { emoji: string; label: string; color: string }> = {
  radar_fixo:  { emoji: '📷', label: 'Radar Fixo',  color: '#ff4500' },
  radar_movel: { emoji: '🚔', label: 'Radar Móvel', color: '#ff7020' },
  policia:     { emoji: '🚨', label: 'Polícia',      color: '#3b82f6' },
  acidente:    { emoji: '💥', label: 'Acidente',     color: '#ef4444' },
  transito:    { emoji: '🚗', label: 'Trânsito',     color: '#f59e0b' },
  obras:       { emoji: '🚧', label: 'Obras',        color: '#f97316' },
  buraco:      { emoji: '🕳️', label: 'Buraco',       color: '#8b5cf6' },
  lombada:     { emoji: '🛑', label: 'Lombada',      color: '#fbbf24' },
  perigo:      { emoji: '⚠️', label: 'Perigo',       color: '#fbbf24' },
};

const SPOT_TYPES: Record<string, { emoji: string; color: string }> = {
  foto:     { emoji: '📷', color: '#3b82f6' },
  encontro: { emoji: '🤝', color: '#10b981' },
  estrada:  { emoji: '🛣️', color: '#f59e0b' },
  evento:   { emoji: '🏁', color: '#ef4444' },
  perigo:   { emoji: '⚠️', color: '#f97316' },
};

const RACE_MODES: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  comfort: { label: 'COMFORT', color: '#3b82f6', icon: 'directions_car',         desc: 'Mostra a rota sem pressão' },
  treino:  { label: 'TREINO',  color: '#10b981', icon: 'timer',                   desc: 'Mede o tempo da tua corrida' },
  corsa:   { label: 'CORSA',   color: '#ef4444', icon: 'local_fire_department',   desc: 'Conta-decrescente: chega a tempo!' },
};

function fmtTime(secs: number) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
  return (secs < 0 ? '-' : '') + m + ':' + s;
}

function dist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const user = getUser();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [activeMode, setActiveMode] = useState<'alertas' | 'spots' | 'radar'>('alertas');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selAlertType, setSelAlertType] = useState<string | null>(null);
  const [alertDesc, setAlertDesc] = useState('');
  const [spotForm, setSpotForm] = useState({ nome: '', tipo: 'encontro', descricao: '' });
  const [raceHud, setRaceHud] = useState<{ active: boolean; mode: string; display: string }>({ active: false, mode: '', display: '' });
  const [speedVisible, setSpeedVisible] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [showRouteBar, setShowRouteBar] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ dist: '', time: '', dest: '' });
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set());
  const [showRadarWarning, setShowRadarWarning] = useState<null | { text: string; icon: string; color: string }>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);

  const stateRef = useRef({
    userLat: -23.5505, userLng: -46.6333,
    lastPos: null as any,
    userMarker: null as any,
    destMarker: null as any,
    osmMarkers: [] as any[],
    alertMarkers: [] as any[],
    spotMarkers: [] as any[],
    routeLayer: null as any,
    raceActive: false,
    raceMode: 'comfort',
    raceStartTime: 0,
    raceDuration: 0,
    raceTimerInterval: null as any,
    raceDestLat: null as number | null,
    raceDestLng: null as number | null,
    raceDestName: '',
    lastWarnTime: 0,
    radarTimeout: null as any,
    osmLoaded: false,
    pendAlertLL: null as any,
    pendSpotLL: null as any,
    selectedInvites: new Set<string>(),
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    loadLeaflet().then(() => initMap());
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const s = stateRef.current;
      if (s.raceTimerInterval) clearInterval(s.raceTimerInterval);
      if (s.radarTimeout) clearTimeout(s.radarTimeout);
    };
  }, []);

  async function loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!(window as any).L) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => res(); s.onerror = rej;
        document.head.appendChild(s);
      });
    }
  }

  function makeIcon(emoji: string, color: string, size = 32) {
    const L = (window as any).L;
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px ${color}88"><span style="transform:rotate(45deg);font-size:${Math.round(size * 0.42)}px;line-height:1">${emoji}</span></div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size],
    });
  }

  function makeUserIcon(color = '#ff7020') {
    const L = (window as any).L;
    return L.divIcon({
      className: '',
      html: `<div style="position:relative;width:22px;height:22px"><div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.2;animation:pulse 2s infinite"></div><div style="width:14px;height:14px;background:${color};border-radius:50%;border:2.5px solid white;position:absolute;top:4px;left:4px;box-shadow:0 0 10px ${color}"></div></div>`,
      iconSize: [22, 22], iconAnchor: [11, 11],
    });
  }

  function makeDestIcon(color = '#00ccff') {
    const L = (window as any).L;
    return L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center"><div style="width:16px;height:16px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 0 16px ${color},0 0 32px ${color}88"></div></div>`,
      iconSize: [36, 36], iconAnchor: [18, 18],
    });
  }

  function beep() {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      [0, 0.22, 0.44].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 1050;
        g.gain.setValueAtTime(0.28, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15);
      });
    } catch {}
  }

  function triggerHazardWarning(tipo: string) {
    const MAP: Record<string, any> = {
      radar: { text: 'RADAR', icon: '📷', color: '#ff2200' },
      radar_fixo: { text: 'RADAR', icon: '📷', color: '#ff2200' },
      radar_movel: { text: 'RADAR', icon: '🚔', color: '#ff7020' },
      policia: { text: 'POLÍCIA', icon: '🚨', color: '#3b82f6' },
      lombada: { text: 'LOMBADA', icon: '🛑', color: '#fbbf24' },
      acidente: { text: 'ACIDENTE', icon: '💥', color: '#ef4444' },
    };
    const w = MAP[tipo] || MAP['radar'];
    setShowRadarWarning(w);
    beep();
    const s = stateRef.current;
    if (s.radarTimeout) clearTimeout(s.radarTimeout);
    s.radarTimeout = setTimeout(() => setShowRadarWarning(null), 4000);
  }

  function checkRadarNear(lat: number, lng: number) {
    const s = stateRef.current;
    const now = Date.now();
    if (now - s.lastWarnTime < 12000) return;
    for (const m of s.osmMarkers) {
      const p = m.getLatLng();
      if (dist(lat, lng, p.lat, p.lng) < 350) { triggerHazardWarning('radar'); s.lastWarnTime = now; return; }
    }
    for (const m of s.alertMarkers) {
      const p = m.getLatLng();
      if (dist(lat, lng, p.lat, p.lng) < 350) { triggerHazardWarning(m._alertTipo || 'radar_fixo'); s.lastWarnTime = now; return; }
    }
  }

  function setUserPos(lat: number, lng: number) {
    const s = stateRef.current;
    const map = mapInstance.current;
    s.userLat = lat; s.userLng = lng;
    if (s.userMarker) s.userMarker.setLatLng([lat, lng]);
    else s.userMarker = (window as any).L.marker([lat, lng], { icon: makeUserIcon(), zIndexOffset: 1000 })
      .bindPopup(`<b>${user?.nome}</b> — Tu estás aqui`).addTo(map);
    checkRadarNear(lat, lng);
    if (s.raceActive && s.raceDestLat && dist(lat, lng, s.raceDestLat, s.raceDestLng) < 80) finishRace();
  }

  async function loadOSMRadars(lat: number, lng: number) {
    const s = stateRef.current;
    if (s.osmLoaded) return;
    s.osmLoaded = true;
    const R = 0.12;
    const q = `[out:json][timeout:10];(node["highway"="speed_camera"](${lat-R},${lng-R},${lat+R},${lng+R});node["enforcement"="maxspeed"](${lat-R},${lng-R},${lat+R},${lng+R});node["traffic_calming"~"bump|hump"](${lat-R},${lng-R},${lat+R},${lng+R}););out 80;`;
    try {
      const data = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST', body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(12000),
      }).then(r => r.json());
      s.osmMarkers.forEach(m => m.remove()); s.osmMarkers = [];
      (data.elements || []).slice(0, 80).forEach((cam: any) => {
        const isLombada = cam.tags?.traffic_calming;
        const emoji = isLombada ? '🛑' : '📷';
        const color = isLombada ? '#fbbf24' : '#ff4500';
        const m = (window as any).L.marker([cam.lat, cam.lon], { icon: makeIcon(emoji, color, 26) }).addTo(mapInstance.current);
        m._alertTipo = isLombada ? 'lombada' : 'radar_fixo';
        m.bindPopup(`<b style="color:${color}">${emoji} ${isLombada ? 'Lombada' : 'Radar'}</b>`);
        s.osmMarkers.push(m);
      });
    } catch {}
  }

  async function loadAlertas() {
    const s = stateRef.current;
    s.alertMarkers.forEach(m => m.remove()); s.alertMarkers = [];
    try {
      const alerts = await fetch('/api/mapa/alertas').then(r => r.json());
      setAlertsList(alerts);
      alerts.forEach((a: any) => {
        const info = ALERT_TYPES[a.tipo] || { emoji: '⚠️', label: 'Alerta', color: '#fbbf24' };
        const m = (window as any).L.marker([a.lat, a.lng], { icon: makeIcon(info.emoji, info.color, 28) }).addTo(mapInstance.current);
        m._alertTipo = a.tipo;
        m.bindPopup(`<b style="color:${info.color}">${info.emoji} ${info.label}</b>${a.descricao ? `<br><small>${a.descricao}</small>` : ''}<br><small>${a.confirmacoes || 1} confirmações</small>`);
        s.alertMarkers.push(m);
      });
    } catch {}
  }

  async function loadSpots() {
    const s = stateRef.current;
    s.spotMarkers.forEach(m => m.remove()); s.spotMarkers = [];
    try {
      const spots = await fetch('/api/mapa/spots').then(r => r.json());
      spots.forEach((sp: any) => {
        const info = SPOT_TYPES[sp.tipo] || SPOT_TYPES.encontro;
        const m = (window as any).L.marker([sp.lat, sp.lng], { icon: makeIcon(info.emoji, info.color) }).addTo(mapInstance.current);
        m.bindPopup(`<b>${sp.nome}</b>${sp.descricao ? `<br><small>${sp.descricao}</small>` : ''}<br><small>por ${sp.criador_nome || 'Anónimo'}</small>`);
        s.spotMarkers.push(m);
      });
    } catch {}
  }

  async function calcRoute(toQuery: string, knownLat?: number, knownLng?: number) {
    const s = stateRef.current;
    const map = mapInstance.current;
    try {
      let toLat = knownLat, toLng = knownLng, destName = toQuery;
      if (!toLat || !toLng) {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(toQuery)}&format=json&limit=1`).then(r => r.json());
        if (!geo.length) { showToast('Destino não encontrado', 'error'); return; }
        toLat = +geo[0].lat; toLng = +geo[0].lon;
        destName = geo[0].display_name.split(',')[0];
      }
      s.raceDestLat = toLat!; s.raceDestLng = toLng!; s.raceDestName = destName;

      const params = new URLSearchParams({ fromLat: String(s.userLat), fromLng: String(s.userLng), toLat: String(toLat), toLng: String(toLng) });
      const routeData = await fetch(`/api/places/route?${params}`).then(r => r.json());
      const leg = routeData?.routes?.[0]?.legs?.[0];
      if (!leg) { showToast('Rota não disponível', 'error'); return; }

      const points = (leg.points || []).map((p: any) => [p.longitude, p.latitude]);
      const geom = { type: 'LineString', coordinates: points };

      if (s.routeLayer) {
        map.eachLayer((l: any) => {
          if (l !== s.userMarker && !(l instanceof (window as any).L.TileLayer) && !s.osmMarkers.includes(l) && !s.alertMarkers.includes(l) && !s.spotMarkers.includes(l) && l !== s.destMarker)
            try { map.removeLayer(l); } catch {}
        });
      }

      (window as any).L.geoJSON(geom, { style: { color: '#000', weight: 8, opacity: 0.6 } }).addTo(map);
      s.routeLayer = (window as any).L.geoJSON(geom, { style: { color: 'var(--c-fire,#ff4500)', weight: 4, opacity: 1 } }).addTo(map);

      if (s.destMarker) s.destMarker.remove();
      s.destMarker = (window as any).L.marker([toLat, toLng], { icon: makeDestIcon() }).bindPopup(`<b>${destName}</b>`).addTo(map);
      map.fitBounds(s.routeLayer.getBounds(), { padding: [60, 60] });

      const summary = routeData.routes[0].summary;
      s.raceDuration = summary.travelTimeInSeconds;
      const km = (summary.lengthInMeters / 1000).toFixed(1);
      const min = Math.round(summary.travelTimeInSeconds / 60);
      setRouteInfo({ dist: km, time: String(min), dest: destName });
      setShowRouteBar(true);
      showToast(`🏁 ${km} km · ${min} min → ${destName}`);
    } catch { showToast('Erro na rota', 'error'); }
  }

  function clearRoute() {
    const s = stateRef.current;
    const map = mapInstance.current;
    if (s.raceActive) stopRace();
    map.eachLayer((l: any) => {
      if (l !== s.userMarker && !(l instanceof (window as any).L.TileLayer) && !s.osmMarkers.includes(l) && !s.alertMarkers.includes(l) && !s.spotMarkers.includes(l) && l !== s.destMarker)
        try { map.removeLayer(l); } catch {}
    });
    s.routeLayer = null;
    if (s.destMarker) { s.destMarker.remove(); s.destMarker = null; }
    s.raceDestLat = s.raceDestLng = null;
    setShowRouteBar(false);
  }

  function openModeSelector() {
    if (!stateRef.current.raceDestLat) { showToast('Traça uma rota primeiro', 'error'); return; }
    setShowModeSelector(true);
  }

  function startCountdown(mode: string) {
    setShowModeSelector(false);
    stateRef.current.raceMode = mode;
    let i = 0;
    const steps = ['3', '2', '1', 'GO!'];
    function tick() {
      setRaceHud({ active: true, mode, display: steps[i] });
      if (i === 3) {
        setTimeout(() => beginRace(), 900);
      } else {
        i++;
        setTimeout(tick, 900);
      }
    }
    tick();
  }

  function beginRace() {
    const s = stateRef.current;
    s.raceActive = true;
    s.raceStartTime = Date.now();
    if (s.raceMode === 'comfort') { setRaceHud({ active: true, mode: s.raceMode, display: 'EM ROTA' }); return; }
    s.raceTimerInterval = setInterval(() => {
      if (!s.raceActive) return;
      const elapsed = Math.floor((Date.now() - s.raceStartTime) / 1000);
      if (s.raceMode === 'treino') setRaceHud(h => ({ ...h, display: fmtTime(elapsed) }));
      else {
        const remaining = s.raceDuration - elapsed;
        setRaceHud(h => ({ ...h, display: fmtTime(remaining) }));
        if (remaining <= 0) { stopRace(); showToast('⏱ Tempo esgotado!', 'error'); openLeaderboard(true); }
      }
    }, 500);
  }

  function stopRace() {
    const s = stateRef.current;
    s.raceActive = false;
    if (s.raceTimerInterval) { clearInterval(s.raceTimerInterval); s.raceTimerInterval = null; }
  }

  function finishRace() {
    const s = stateRef.current;
    if (!s.raceActive) return;
    const elapsed = Math.floor((Date.now() - s.raceStartTime) / 1000);
    stopRace();
    setRaceHud(h => ({ ...h, active: false }));
    showToast(`🏁 Chegaste! ${fmtTime(elapsed)}`);
    setTimeout(() => openLeaderboard(false, elapsed), 800);
  }

  function openLeaderboard(timeout: boolean, myTime?: number) {
    const s = stateRef.current;
    setLeaderboardEntries([{ nome: user?.nome, avatar: user?.avatar, time: myTime, mode: s.raceMode, me: true, finished: !timeout }]);
    setShowLeaderboard(true);
  }

  async function initMap() {
    const L = (window as any).L;
    if (!mapRef.current) return;
    const s = stateRef.current;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([s.userLat, s.userLng], 14);
    mapInstance.current = map;
    const ttKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || '';
    L.tileLayer(
      `https://api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key=${ttKey}&tileSize=256`,
      { maxZoom: 22, attribution: '© TomTom' }
    ).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: '© TomTom' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    loadSpots(); loadAlertas();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserPos(pos.coords.latitude, pos.coords.longitude);
        map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        loadOSMRadars(pos.coords.latitude, pos.coords.longitude);
      }, () => loadOSMRadars(s.userLat, s.userLng));
      navigator.geolocation.watchPosition(pos => {
        setUserPos(pos.coords.latitude, pos.coords.longitude);
        if (speedVisible) {
          let kmh = 0;
          if (pos.coords.speed != null && pos.coords.speed >= 0) kmh = pos.coords.speed * 3.6;
          else if (s.lastPos) {
            const dt = (pos.timestamp - s.lastPos.timestamp) / 1000;
            if (dt > 0) kmh = dist(s.lastPos.coords.latitude, s.lastPos.coords.longitude, pos.coords.latitude, pos.coords.longitude) / dt * 3.6;
          }
          setSpeed(kmh);
        }
        s.lastPos = pos;
      }, () => {}, { enableHighAccuracy: true });
    }
  }

  async function submitAlert() {
    const s = stateRef.current;
    if (!selAlertType) { showToast('Escolhe o tipo', 'error'); return; }
    if (!s.pendAlertLL) { showToast('Clica no mapa primeiro', 'error'); return; }
    await fetch('/api/mapa/alertas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: selAlertType, lat: s.pendAlertLL.lat, lng: s.pendAlertLL.lng, descricao: alertDesc, criador_email: user?.email, criador_nome: user?.nome })
    });
    setShowAlertModal(false); s.pendAlertLL = null; setSelAlertType(null); setAlertDesc('');
    showToast('Alerta reportado!'); loadAlertas();
  }

  async function submitSpot() {
    const s = stateRef.current;
    if (!s.pendSpotLL) { showToast('Clica no mapa primeiro', 'error'); return; }
    await fetch('/api/mapa/spots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...spotForm, lat: s.pendSpotLL.lat, lng: s.pendSpotLL.lng, criador_email: user?.email, criador_nome: user?.nome })
    });
    showToast('Spot adicionado!'); setShowSpotModal(false); s.pendSpotLL = null; loadSpots();
  }

  async function loadFriends() {
    if (!user) return;
    const data = await fetch(`/api/amigos?email=${encodeURIComponent(user.email)}`).then(r => r.json());
    setFriends(data);
  }

  function startMapClick(callback: (ll: any) => void) {
    const map = mapInstance.current;
    if (!map) return;
    showToast('Clica no mapa para marcar');
    map.once('click', (e: any) => callback(e.latlng));
  }

  const speedColor = speed > 130 ? '#ef4444' : speed > 80 ? '#f59e0b' : 'var(--c-fire2,#ff7020)';
  const speedArcFilled = Math.round(Math.min(speed / 200, 1) * 245);

  return (
    <div style={{ position: 'fixed', inset: 0, top: 'var(--topbar-h,56px)', zIndex: 50, background: '#05050d' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* Radar warning overlay */}
      {showRadarWarning && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', zIndex: 260, pointerEvents: 'none', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', marginBottom: '4px', textTransform: 'uppercase' }}>ATENÇÃO</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '54px', fontWeight: 900, fontStyle: 'italic', color: showRadarWarning.color, textShadow: `0 0 30px ${showRadarWarning.color}`, lineHeight: 1 }}>{showRadarWarning.text}</div>
          <div style={{ fontSize: '32px', marginTop: '2px' }}>{showRadarWarning.icon}</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>REDUZA A VELOCIDADE</div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 100, display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <SearchBar onRoute={(q, lat, lng) => calcRoute(q, lat, lng)} userLat={stateRef.current.userLat} userLng={stateRef.current.userLng} />
        <div style={{ background: 'rgba(4,4,10,0.93)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', display: 'flex', gap: '2px', padding: '4px' }}>
          {([['alertas', 'campaign'], ['spots', 'location_on'], ['radar', 'radar']] as const).map(([m, ic]) => (
            <button key={m} onClick={() => setActiveMode(m)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeMode === m ? 'var(--c-fire,#ff4500)' : 'rgba(255,255,255,0.05)', color: activeMode === m ? '#000' : 'rgba(255,255,255,0.45)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{ic}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Race HUD */}
      {raceHud.active && (
        <div style={{ position: 'absolute', top: '62px', left: '50%', transform: 'translateX(-50%)', zIndex: 110, pointerEvents: 'none', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '52px', color: 'var(--c-fire2,#ff7020)', textShadow: '0 0 30px rgba(255,112,32,0.6)', background: 'rgba(4,4,10,0.85)', border: '1px solid rgba(255,112,32,0.25)', borderRadius: '10px', padding: '8px 20px', lineHeight: 1 }}>{raceHud.display}</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', marginTop: '4px', textTransform: 'uppercase' }}>{RACE_MODES[raceHud.mode]?.label}</div>
        </div>
      )}

      {/* Speedometer */}
      {speedVisible && (
        <div style={{ position: 'absolute', bottom: '108px', left: '10px', zIndex: 100, width: '130px', height: '130px' }}>
          <svg viewBox="0 0 130 130" width="130" height="130" style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeDasharray="245 327" strokeDashoffset="-41" strokeLinecap="round" />
            <circle cx="65" cy="65" r="52" fill="none" stroke={speedColor} strokeWidth="7" strokeDasharray={`${speedArcFilled} 327`} strokeDashoffset="-41" strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '42px', color: speedColor, lineHeight: 1 }}>{Math.round(speed)}</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', fontFamily: 'monospace' }}>KM/H</div>
          </div>
        </div>
      )}

      {/* Route bar */}
      {showRouteBar && (
        <div style={{ position: 'absolute', bottom: '108px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <div style={{ background: 'rgba(4,4,10,0.93)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid var(--c-fire,#ff4500)', borderRadius: '10px', minWidth: '320px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[{ val: routeInfo.dist, unit: 'KM' }, { val: routeInfo.time, unit: 'MIN' }].map(({ val, unit }) => (
                <div key={unit} style={{ padding: '10px 18px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '28px', color: 'var(--c-fire2,#ff7020)' }}>{val}</div>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>{unit}</div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routeInfo.dest}</div>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={openModeSelector} style={{ flex: 1, padding: '11px 8px', background: 'var(--c-fire,#ff4500)', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', color: '#000', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span> COMEÇAR CORRIDA
              </button>
              <button onClick={() => { loadFriends(); setShowInviteModal(true); }} style={{ flex: '0 0 44px', padding: '11px 0', background: 'rgba(255,255,255,0.05)', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group_add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right buttons */}
      <div style={{ position: 'absolute', bottom: '108px', right: '10px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <button onClick={() => startMapClick(ll => { stateRef.current.pendAlertLL = ll; setShowAlertModal(true); })} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--c-fire,#ff4500)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(255,69,0,0.55)' }}>
          <span className="material-symbols-outlined" style={{ color: '#000', fontSize: '20px' }}>campaign</span>
        </button>
        <button onClick={() => startMapClick(ll => { stateRef.current.pendSpotLL = ll; setShowSpotModal(true); })} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(4,4,10,0.92)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#f2f2fa', fontSize: '18px' }}>add_location</span>
        </button>
        <button onClick={() => { const s = stateRef.current; mapInstance.current?.setView([s.userLat, s.userLng], 15); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(4,4,10,0.92)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#f2f2fa', fontSize: '18px' }}>my_location</span>
        </button>
        <button onClick={() => setSpeedVisible(v => !v)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(4,4,10,0.92)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#f2f2fa', fontSize: '18px' }}>speed</span>
        </button>
        {showRouteBar && (
          <button onClick={clearRoute} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(4,4,10,0.92)', border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '18px' }}>route_off</span>
          </button>
        )}
      </div>

      {/* Side panel */}
      {activeMode !== 'spots' && (
        <div style={{ position: 'absolute', top: '62px', right: '10px', bottom: '108px', width: '260px', zIndex: 100, overflowY: 'auto' }}>
          {activeMode === 'alertas' && (
            <div style={{ background: 'rgba(4,4,10,0.93)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--c-fire2,#ff7020)' }}>📡 ALERTAS ACTIVOS</div>
              {alertsList.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', textAlign: 'center', padding: '16px' }}>Sem alertas activos</div> :
                alertsList.map((a: any, i: number) => {
                  const info = ALERT_TYPES[a.tipo] || { emoji: '⚠️', label: 'Alerta', color: '#fbbf24' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '5px', borderLeft: `2px solid ${info.color}` }}>
                      <span style={{ fontSize: '18px' }}>{info.emoji}</span>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: info.color, textTransform: 'uppercase' }}>{info.label}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{a.confirmacoes || 1} confirmações</div>
                      </div>
                    </div>
                  );
                })}
              <button onClick={loadAlertas} style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit' }}>↺ Actualizar</button>
            </div>
          )}
          {activeMode === 'radar' && (
            <div style={{ background: 'rgba(4,4,10,0.93)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--c-fire2,#ff7020)' }}>📡 RADAR SOCIAL</div>
              <button onClick={async () => {
                const s = stateRef.current;
                await fetch('/api/mapa/radar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user?.email, lat: s.userLat, lng: s.userLng }) });
                const nearby = await fetch(`/api/mapa/radar?lat=${s.userLat}&lng=${s.userLng}&email=${encodeURIComponent(user?.email || '')}`).then(r => r.json());
                showToast(nearby.length ? `${nearby.length} piloto(s) por perto` : 'Nenhum piloto por perto');
              }} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--c-fire,#ff4500)', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '12px', color: '#000', textTransform: 'uppercase' }}>
                Activar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(4,4,10,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid var(--c-fire,#ff4500)', borderRadius: '10px', width: '100%', maxWidth: '340px', margin: '20px', padding: '22px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px' }}>📡 REPORTAR ALERTA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '12px' }}>
              {Object.entries(ALERT_TYPES).map(([id, a]) => (
                <button key={id} onClick={() => setSelAlertType(id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 10px', background: selAlertType === id ? a.color + '22' : 'rgba(255,255,255,0.04)', border: `1px solid ${selAlertType === id ? a.color : 'rgba(255,255,255,0.07)'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: selAlertType === id ? a.color : 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: '16px' }}>{a.emoji}</span>{a.label}
                </button>
              ))}
            </div>
            <textarea className="input" placeholder="Descrição (opcional)..." rows={2} value={alertDesc} onChange={e => setAlertDesc(e.target.value)} style={{ resize: 'none', marginBottom: '10px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '9px 12px', color: '#f2f2fa', fontSize: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowAlertModal(false); stateRef.current.pendAlertLL = null; }} style={{ flex: 1, padding: '11px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Cancelar</button>
              <button onClick={submitAlert} style={{ flex: 2, padding: '11px', borderRadius: '6px', background: 'var(--c-fire,#ff4500)', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', color: '#000', textTransform: 'uppercase' }}>Reportar</button>
            </div>
          </div>
        </div>
      )}

      {/* Spot Modal */}
      {showSpotModal && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(4,4,10,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid var(--c-fire2,#ff7020)', borderRadius: '10px', width: '100%', maxWidth: '340px', margin: '20px', padding: '22px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px' }}>📍 NOVO SPOT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <input className="input" placeholder="Nome do spot" value={spotForm.nome} onChange={e => setSpotForm(f => ({ ...f, nome: e.target.value }))} />
              <select className="input" value={spotForm.tipo} onChange={e => setSpotForm(f => ({ ...f, tipo: e.target.value }))}>
                {Object.entries(SPOT_TYPES).map(([id, s]) => <option key={id} value={id}>{s.emoji} {id.charAt(0).toUpperCase() + id.slice(1)}</option>)}
              </select>
              <textarea className="input" placeholder="Descrição..." rows={2} value={spotForm.descricao} onChange={e => setSpotForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowSpotModal(false); stateRef.current.pendSpotLL = null; }} style={{ flex: 1, padding: '11px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Cancelar</button>
                <button onClick={submitSpot} style={{ flex: 2, padding: '11px', borderRadius: '6px', background: 'var(--c-fire2,#ff7020)', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', color: '#000', textTransform: 'uppercase' }}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      {showModeSelector && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 350, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px', margin: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', textAlign: 'center', fontSize: '22px', color: 'var(--c-fire2,#ff7020)', textTransform: 'uppercase' }}>🏁 ESCOLHE O MODO</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {Object.entries(RACE_MODES).map(([id, m]) => (
                <div key={id} onClick={() => startCountdown(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', borderRadius: '12px', cursor: 'pointer', border: `2px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)', flex: 1, textAlign: 'center', gap: '8px', transition: 'all 0.15s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: m.color }}>{m.icon}</span>
                  <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '14px', color: m.color, textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModeSelector(false)} style={{ padding: '11px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 420, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '380px', margin: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', textAlign: 'center', fontSize: '24px', color: 'var(--c-fire2,#ff7020)', textTransform: 'uppercase' }}>🏆 CLASSIFICAÇÃO</div>
            {leaderboardEntries.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: e.me ? 'rgba(255,69,0,0.12)' : 'rgba(255,255,255,0.03)', border: e.me ? '1px solid rgba(255,69,0,0.3)' : 'none' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '22px', color: i === 0 ? '#fbbf24' : '#94a3b8', width: '28px' }}>{i === 0 ? '🥇' : '#' + (i + 1)}</div>
                <img src={e.avatar || ''} style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{e.nome}{e.me ? ' (tu)' : ''}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{RACE_MODES[e.mode]?.label}</div>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', color: e.finished ? 'var(--c-fire2,#ff7020)' : '#ef4444' }}>{e.finished ? fmtTime(e.time || 0) : 'DNF'}</div>
              </div>
            ))}
            <button onClick={() => { setShowLeaderboard(false); setRaceHud(h => ({ ...h, active: false })); }} style={{ padding: '12px', borderRadius: '8px', background: 'var(--c-fire,#ff4500)', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '14px', color: '#000', textTransform: 'uppercase' }}>FECHAR</button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(4,4,10,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #3b82f6', borderRadius: '10px', width: '100%', maxWidth: '340px', margin: '20px', padding: '22px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', textTransform: 'uppercase', marginBottom: '4px' }}>👥 CONVIDAR AMIGOS</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>Eles vão na mesma rota</div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
              {friends.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', textAlign: 'center', padding: '16px' }}>Sem amigos ainda</div> :
                friends.map((f: any) => {
                  const sel = selectedInvites.has(f.email);
                  return (
                    <div key={f.email} onClick={() => setSelectedInvites(prev => { const n = new Set(prev); sel ? n.delete(f.email) : n.add(f.email); return n; })} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '5px', cursor: 'pointer', border: `1px solid ${sel ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <img src={f.avatar || ''} style={{ width: '32px', height: '32px', borderRadius: '5px', objectFit: 'cover' }} alt="" />
                      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600 }}>{f.nome}</div>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${sel ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#22c55e' }}>{sel ? '✓' : ''}</div>
                    </div>
                  );
                })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Cancelar</button>
              <button onClick={async () => {
                if (!selectedInvites.size) { showToast('Seleciona pelo menos 1 amigo', 'error'); return; }
                const s = stateRef.current;
                await fetch('/api/mapa/race-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ de_email: user?.email, de_nome: user?.nome, de_avatar: user?.avatar, para_emails: [...selectedInvites], dest_nome: s.raceDestName }) });
                showToast(`Convite enviado para ${selectedInvites.size} amigo(s)!`);
                setShowInviteModal(false);
              }} style={{ flex: 2, padding: '11px', borderRadius: '6px', background: '#3b82f6', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', fontSize: '13px', color: '#fff', textTransform: 'uppercase' }}>Enviar convite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBar({ onRoute, userLat, userLng }: { onRoute: (q: string, lat?: number, lng?: number) => void; userLat: number; userLng: number }) {
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debounceRef = useRef<any>(null);

  async function fetchSuggestions(query: string) {
    if (query.length < 2) { setSuggestions([]); return; }
    try {
      const bbox = `${userLng - 0.3},${userLat - 0.3},${userLng + 0.3},${userLat + 0.3}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&viewbox=${bbox}&bounded=0`;
      const data = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt' } }).then(r => r.json());
      setSuggestions(data.map((r: any) => ({ display: r.display_name.split(', ')[0], sub: r.display_name.split(', ').slice(1, 3).join(', '), lat: +r.lat, lon: +r.lon })));
    } catch {}
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ background: 'rgba(4,4,10,0.93)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '44px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--c-fire,#ff4500)', fontSize: '18px', flexShrink: 0 }}>search</span>
        <input value={q} onChange={e => { setQ(e.target.value); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 320); }} onKeyDown={e => { if (e.key === 'Enter' && q.trim()) { setSuggestions([]); onRoute(q.trim()); } }} placeholder="Restaurante, posto, rua..." style={{ background: 'none', border: 'none', outline: 'none', color: '#f2f2fa', fontSize: '13px', flex: 1, minWidth: 0, fontFamily: 'inherit' }} />
        <button onClick={() => { setSuggestions([]); if (q.trim()) onRoute(q.trim()); }} style={{ background: 'var(--c-fire,#ff4500)', color: '#000', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', flexShrink: 0 }}>IR</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {suggestions.map((r, i) => (
            <div key={i} onMouseDown={e => { e.preventDefault(); setQ(r.display); setSuggestions([]); onRoute(r.display, r.lat, r.lon); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f2f2fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'rgba(255,69,0,0.5)', fontSize: '14px', flexShrink: 0 }}>arrow_forward</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

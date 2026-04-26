export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function avatarFallback(nome: string, bg = 'ef4444') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=${bg}&color=fff`;
}

export const TIERS = [
  { min: 50, label: 'DIAMOND', color: '#a78bfa', icon: '💎' },
  { min: 30, label: 'GOLD',    color: '#f59e0b', icon: '🥇' },
  { min: 15, label: 'SILVER',  color: '#94a3b8', icon: '🥈' },
  { min: 5,  label: 'BRONZE',  color: '#b45309', icon: '🥉' },
  { min: 0,  label: 'ROOKIE',  color: '#6b7280', icon: '🏁' },
];

export function getTier(nivel: number) {
  return TIERS.find(t => nivel >= t.min) || TIERS[TIERS.length - 1];
}

export const CAR_BRANDS = ['Todos','BMW','Mercedes','Audi','Volkswagen','Honda','Toyota','Ford','Opel','Renault','Peugeot','Seat','Fiat','Nissan','Mazda','Subaru','Mitsubishi','Porsche','Ferrari','Lamborghini'];

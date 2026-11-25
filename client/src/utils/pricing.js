export const SNACKS_MENU = [
  { id: 'popcorn', name: 'Caramel Popcorn', price: 180, emoji: '🍿' },
  { id: 'coke', name: 'Chilled Pepsi (Large)', price: 120, emoji: '🥤' },
  { id: 'nachos', name: 'Cheesy Jalapeño Nachos', price: 160, emoji: '🧀' },
  { id: 'burger', name: 'Crispy Veg Burger', price: 150, emoji: '🍔' },
];

export const CONVENIENCE_FEE = 30;

export function getSeatTier(seatLabel, basePrice = 200) {
  const row = String(seatLabel || '').charAt(0).toUpperCase();
  if (row === 'G' || row === 'H') {
    return { id: 'platinum', label: 'Platinum Recliner', surcharge: 120, price: basePrice + 120 };
  }
  if (['C', 'D', 'E', 'F'].includes(row)) {
    return { id: 'gold', label: 'Gold Executive', surcharge: 50, price: basePrice + 50 };
  }
  return { id: 'silver', label: 'Silver Classic', surcharge: 0, price: basePrice };
}

export function calculateSeatsTotal(seats, basePrice) {
  return (seats || []).reduce((sum, s) => sum + getSeatTier(s, basePrice).price, 0);
}

export function getCountdownInfo(releaseDate) {
  if (!releaseDate) return { label: 'Coming Soon', days: null };
  const target = new Date(releaseDate);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  const formatted = target.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  if (diffDays <= 0) return { label: `Releasing Now • ${formatted}`, days: 0, formatted };
  if (diffDays === 1) return { label: 'Releasing Tomorrow!', days: 1, formatted };
  return { label: `In ${diffDays} Days • ${formatted}`, days: diffDays, formatted };
}

export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let videoId = '';
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.replace('/', '');
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1];
      } else {
        videoId = u.searchParams.get('v') || '';
      }
    }
    videoId = videoId.split('?')[0].split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
  } catch {
    return null;
  }
}

const BASE = 'http://localhost:5000/api';

async function requestJson(url) {
  const res = await fetch(url);
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload?.error || 'Ошибка запроса');
  }

  return payload;
}

export async function searchStation(query) {
  const data = await requestJson(`${BASE}/search-station?query=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : [];
}

export async function getStationsInBounds(bounds) {
  const params = new URLSearchParams({
    minLat: String(bounds.minLat),
    minLng: String(bounds.minLng),
    maxLat: String(bounds.maxLat),
    maxLng: String(bounds.maxLng),
    zoom: String(bounds.zoom)
  });
  const data = await requestJson(`${BASE}/search-station?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

export async function getSchedule(code) {
  const data = await requestJson(`${BASE}/station-schedule?station=${encodeURIComponent(code)}`);
  return Array.isArray(data) ? data : [];
}

export async function getRoutes(from, to) {
  const data = await requestJson(
    `${BASE}/train-route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  return Array.isArray(data) ? data : [];
}
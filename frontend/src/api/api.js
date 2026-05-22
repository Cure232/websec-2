const BASE = import.meta.env.VITE_API_BASE_URL;
const STATION_CODE_PATTERN = new RegExp(import.meta.env.VITE_STATION_CODE_PATTERN);

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
}

function assertStationCode(code, fieldName) {
  assertNonEmptyString(code, fieldName);
  if (!STATION_CODE_PATTERN.test(code)) {
    throw new Error(`${fieldName} has invalid format`);
  }
}

function assertFiniteNumber(value, fieldName) {
  if (!Number.isFinite(Number(value))) {
    throw new Error(`${fieldName} must be a finite number`);
  }
}

async function requestJson({ path, params = {} }) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url);
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload?.error || 'Ошибка запроса');
  }

  return payload;
}

export async function searchStation(query) {
  assertNonEmptyString(query, 'query');
  const data = await requestJson({
    path: '/search-station',
    params: { query: query.trim() }
  });
  return Array.isArray(data) ? data : [];
}

export async function getStationsInBounds(bounds) {
  ['minLat', 'minLng', 'maxLat', 'maxLng', 'zoom'].forEach(fieldName => {
    assertFiniteNumber(bounds?.[fieldName], fieldName);
  });

  const data = await requestJson({
    path: '/search-station',
    params: bounds
  });
  return Array.isArray(data) ? data : [];
}

export async function getSchedule(code) {
  assertStationCode(code, 'station');
  const data = await requestJson({
    path: '/station-schedule',
    params: { station: code }
  });
  return Array.isArray(data) ? data : [];
}

export async function getRoutes(from, to) {
  assertStationCode(from, 'from');
  assertStationCode(to, 'to');
  const data = await requestJson({
    path: '/train-route',
    params: { from, to }
  });
  return Array.isArray(data) ? data : [];
}

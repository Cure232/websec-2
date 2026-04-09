const axios = require('axios');

const API_KEY = process.env.YANDEX_RASP_API_KEY;
const BASE_URL = 'https://api.rasp.yandex.net/v3.0/';
const STATIONS_CACHE_TTL_MS = 10 * 60 * 1000;
let stationsCache = {
  ts: 0,
  data: []
};

function normalizeText(value = '') {
  return value.toLowerCase().trim().replaceAll('ё', 'е');
}

function getStationCoords(station) {
  let lat = Number(station.latitude ?? station.lat ?? station.point?.lat);
  let lng = Number(station.longitude ?? station.lng ?? station.lon ?? station.point?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const swappedLat = lng;
    const swappedLng = lat;
    lat = swappedLat;
    lng = swappedLng;
  }

  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function scoreStationMatch(title, query) {
  const stationTitle = normalizeText(title);
  const q = normalizeText(query);

  if (stationTitle === q) return 100;
  if (stationTitle.startsWith(`${q} `) || stationTitle.startsWith(`${q}-`)) return 95;
  if (stationTitle.startsWith(q)) return 90;
  if (stationTitle.split(/[\s-]+/).some(word => word.startsWith(q))) return 75;
  if (stationTitle.includes(q)) return 50;
  return 0;
}

async function getFlatStations() {
  const cacheIsFresh = Date.now() - stationsCache.ts < STATIONS_CACHE_TTL_MS;
  if (cacheIsFresh && stationsCache.data.length > 0) {
    return stationsCache.data;
  }

  const url = `${BASE_URL}stations_list/?apikey=${API_KEY}&format=json&lang=ru_RU&transport_types=train`;
  const response = await axios.get(url);
  const uniqueStations = new Map();

  const addStation = ({ station, regionTitle, cityTitle }) => {
    if (!station || station.transport_type !== 'train' || !station.title) return;
    const code = station.codes?.yandex_code;
    if (!code) return;

    const { lat, lng } = getStationCoords(station);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const locationParts = [cityTitle, regionTitle].filter(Boolean);
    const location = locationParts.join(', ');
    const displayTitle = location ? `${station.title} (${location})` : station.title;

    if (!uniqueStations.has(code)) {
      uniqueStations.set(code, {
        title: station.title,
        displayTitle,
        location,
        code,
        lat,
        lng
      });
    }
  };

  (response.data.countries || []).forEach(country => {
    (country.regions || []).forEach(region => {
      (region.stations || []).forEach(station =>
        addStation({ station, regionTitle: region.title, cityTitle: '' })
      );
      (region.settlements || []).forEach(city => {
        (city.stations || []).forEach(station =>
          addStation({ station, regionTitle: region.title, cityTitle: city.title })
        );
      });
    });
  });

  stationsCache = {
    ts: Date.now(),
    data: Array.from(uniqueStations.values())
  };

  return stationsCache.data;
}

async function searchStations(query) {
  const stations = await getFlatStations();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return stations;
  }

  return stations
    .map(station => ({
      ...station,
      score: Math.max(
        scoreStationMatch(station.title, normalizedQuery),
        scoreStationMatch(station.displayTitle, normalizedQuery)
      )
    }))
    .filter(station => station.score > 0)
    .sort((a, b) => b.score - a.score || a.displayTitle.localeCompare(b.displayTitle, 'ru'))
    .slice(0, 40)
    .map(({ score, ...station }) => station);
}

async function getStationsInBounds({ minLat, minLng, maxLat, maxLng, limit = 600 }) {
  const stations = await getFlatStations();

  return stations
    .filter(
      station =>
        station.lat >= minLat &&
        station.lat <= maxLat &&
        station.lng >= minLng &&
        station.lng <= maxLng
    )
    .slice(0, limit);
}

async function getSchedule(stationCode) {
  const url = `${BASE_URL}schedule/?apikey=${API_KEY}&station=${stationCode}&lang=ru_RU&transport_types=train`;
  const response = await axios.get(url);
  return response.data.schedule;
}

async function getRoutes(from, to) {
  const url = `${BASE_URL}search/?apikey=${API_KEY}&from=${from}&to=${to}&lang=ru_RU&transport_types=train`;
  const response = await axios.get(url);
  return response.data.segments;
}

module.exports = {
  searchStations,
  getStationsInBounds,
  getSchedule,
  getRoutes
};
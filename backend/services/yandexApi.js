const axios = require('axios');

const API_KEY = process.env.YANDEX_RASP_API_KEY;
const BASE_URL = 'https://api.rasp.yandex.net/v3.0/';

async function searchStations(query) {
  const url = `${BASE_URL}stations_list/?apikey=${API_KEY}&format=json&lang=ru_RU&transport_types=train`;

  const response = await axios.get(url);

  const stations = [];

  response.data.countries.forEach(country => {
    country.regions.forEach(region => {
      region.settlements.forEach(city => {
        city.stations.forEach(station => {
          if (
            station.transport_type === 'train' &&
            station.title.toLowerCase().includes(query.toLowerCase())
          ) {
            stations.push({
              title: station.title,
              code: station.codes.yandex_code
            });
          }
        });
      });
    });
  });

  return stations.slice(0, 10);
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
  getSchedule,
  getRoutes
};
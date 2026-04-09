const express = require('express');
const router = express.Router();
const { searchStations, getStationsInBounds } = require('../services/yandexApi');

router.get('/', async (req, res) => {
  try {
    const query = req.query.query || '';
    const zoom = Number(req.query.zoom);
    const minLat = Number(req.query.minLat);
    const minLng = Number(req.query.minLng);
    const maxLat = Number(req.query.maxLat);
    const maxLng = Number(req.query.maxLng);

    const hasBounds =
      Number.isFinite(minLat) &&
      Number.isFinite(minLng) &&
      Number.isFinite(maxLat) &&
      Number.isFinite(maxLng);

    if (hasBounds) {
      if (!Number.isFinite(zoom) || zoom < 9) {
        return res.json([]);
      }
      const stations = await getStationsInBounds({ minLat, minLng, maxLat, maxLng });
      return res.json(stations);
    }

    const stations = await searchStations(query);
    return res.json(stations);
  } catch (error) {
    console.error('Ошибка поиска станции:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
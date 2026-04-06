const express = require('express');
const router = express.Router();
const { searchStations } = require('../services/yandexApi');

router.get('/', async (req, res) => {
  try {
    const query = req.query.query;
    const stations = await searchStations(query);
    res.json(stations);
  } catch (error) {
    console.error('Ошибка поиска станции:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
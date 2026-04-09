const express = require('express');
const router = express.Router();
const { getSchedule } = require('../services/yandexApi');
const { formatSchedule } = require('../utils/formatters');

router.get('/', async (req, res) => {
  try {
    const stationCode = req.query.station;
    if (!stationCode) {
      return res.status(400).json({ error: 'Параметр station обязателен' });
    }

    const schedule = await getSchedule(stationCode);
    const formatted = formatSchedule(schedule);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ошибка получения расписания' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getSchedule } = require('../services/yandexApi');
const { formatSchedule } = require('../utils/formatters');

router.get('/', async (req, res) => {
  try {
    const stationCode = req.query.station;
    const schedule = await getSchedule(stationCode);
    const formatted = formatSchedule(schedule);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения расписания' });
  }
});

module.exports = router;
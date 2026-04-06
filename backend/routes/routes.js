const express = require('express');
const router = express.Router();
const { getRoutes } = require('../services/yandexApi');

router.get('/', async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const routes = await getRoutes(from, to);
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения маршрута' });
  }
});

module.exports = router;
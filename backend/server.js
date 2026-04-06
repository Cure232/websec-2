require('dotenv').config();
const express = require('express');
const cors = require('cors');


const stationRoutes = require('./routes/stations');
const scheduleRoutes = require('./routes/schedule');
const routeRoutes = require('./routes/routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/search-station', stationRoutes);
app.use('/api/station-schedule', scheduleRoutes);
app.use('/api/train-route', routeRoutes);

app.get('/', (req, res) => {
  res.send('API Прибывалка.Электрички работает');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
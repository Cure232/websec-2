import { useEffect, useRef, useState } from 'react';
import { getRoutes, searchStation, getStationsInBounds } from '../api/api';
import Container from '../layout/Container';
import ScheduleCard from '../components/ScheduleCard';
import StationAutocomplete from '../components/StationAutocomplete';
import StationMap from '../components/StationMap';

export default function RoutePage() {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStations, setFromStations] = useState([]);
  const [toStations, setToStations] = useState([]);
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [routes, setRoutes] = useState([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mapTarget, setMapTarget] = useState('from');
  const [mapStations, setMapStations] = useState([]);
  const fromRequestId = useRef(0);
  const toRequestId = useRef(0);
  const viewportRequestId = useRef(0);

  const searchFromStations = value => {
    setFromQuery(value);
    setFromCode('');
    setRoutes([]);
  };

  const searchToStations = value => {
    setToQuery(value);
    setToCode('');
    setRoutes([]);
  };

  useEffect(() => {
    const value = fromQuery.trim();
    if (!value) {
      setFromStations([]);
      setFromLoading(false);
      return undefined;
    }

    const requestId = ++fromRequestId.current;
    setFromLoading(true);
    setMessage('');

    const timerId = setTimeout(async () => {
      try {
        const stations = await searchStation(value);
        if (requestId !== fromRequestId.current) return;
        setFromStations(stations);
        if (stations.length === 0) setMessage('Станция отправления не найдена.');
      } catch {
        if (requestId !== fromRequestId.current) return;
        setFromStations([]);
        setMessage('Ошибка поиска станции отправления.');
      } finally {
        if (requestId === fromRequestId.current) setFromLoading(false);
      }
    }, 350);

    return () => clearTimeout(timerId);
  }, [fromQuery]);

  useEffect(() => {
    const value = toQuery.trim();
    if (!value) {
      setToStations([]);
      setToLoading(false);
      return undefined;
    }

    const requestId = ++toRequestId.current;
    setToLoading(true);
    setMessage('');

    const timerId = setTimeout(async () => {
      try {
        const stations = await searchStation(value);
        if (requestId !== toRequestId.current) return;
        setToStations(stations);
        if (stations.length === 0) setMessage('Станция прибытия не найдена.');
      } catch {
        if (requestId !== toRequestId.current) return;
        setToStations([]);
        setMessage('Ошибка поиска станции прибытия.');
      } finally {
        if (requestId === toRequestId.current) setToLoading(false);
      }
    }, 350);

    return () => clearTimeout(timerId);
  }, [toQuery]);

  const search = async () => {
    if (!fromCode || !toCode) {
      setMessage('Выберите станции отправления и прибытия.');
      return;
    }

    setRoutesLoading(true);
    setMessage('');
    try {
      const data = await getRoutes(fromCode, toCode);
      setRoutes(data);
      if (data.length === 0) setMessage('Маршруты не найдены.');
    } catch {
      setMessage('Не удалось загрузить маршруты.');
    } finally {
      setRoutesLoading(false);
    }
  };

  const handlePickStation = station => {
    setMessage('');
    if (mapTarget === 'from') {
      setFromCode(station.code);
      setFromQuery(station.displayTitle || station.title);
      return;
    }

    setToCode(station.code);
    setToQuery(station.displayTitle || station.title);
  };

  const handleViewportChange = viewport => {
    const requestId = ++viewportRequestId.current;
    setTimeout(async () => {
      if (requestId !== viewportRequestId.current) return;
      try {
        const stations = await getStationsInBounds(viewport);
        if (requestId !== viewportRequestId.current) return;
        setMapStations(stations);
      } catch {
        if (requestId !== viewportRequestId.current) return;
        setMapStations([]);
      }
    }, 220);
  };

  return (
    <Container>
      <h2>Маршрут</h2>
      <p>Введите станции, выберите их из подсказок или на карте и посмотрите электрички между ними.</p>

      <div className="controls-row">
        <StationAutocomplete
          placeholder="Станция отправления, например Самара"
          value={fromQuery}
          suggestions={fromStations}
          loading={fromLoading}
          onInputChange={searchFromStations}
          onSelect={station => {
            setFromCode(station.code);
            setFromQuery(station.displayTitle || station.title);
          }}
        />
      </div>

      <div className="controls-row">
        <StationAutocomplete
          placeholder="Станция прибытия, например Уфа"
          value={toQuery}
          suggestions={toStations}
          loading={toLoading}
          onInputChange={searchToStations}
          onSelect={station => {
            setToCode(station.code);
            setToQuery(station.displayTitle || station.title);
          }}
        />
      </div>

      <div className="controls-row map-target-row">
        <div className="target-switch">
          <button
            type="button"
            className={mapTarget === 'from' ? 'target-option active' : 'target-option'}
            onClick={() => setMapTarget('from')}
          >
            Откуда
          </button>
          <button
            type="button"
            className={mapTarget === 'to' ? 'target-option active' : 'target-option'}
            onClick={() => setMapTarget('to')}
          >
            Куда
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (mapTarget === 'from') {
              setFromCode('');
              setFromQuery('');
            } else {
              setToCode('');
              setToQuery('');
            }
          }}
        >
          Снять выбор {mapTarget === 'from' ? 'откуда' : 'куда'}
        </button>
      </div>

      <StationMap
        stations={mapStations}
        onPickStation={handlePickStation}
        selectedFromCode={fromCode}
        selectedToCode={toCode}
        onViewportChange={handleViewportChange}
      />

      <div className="controls-row">
        <button onClick={search} disabled={routesLoading || !fromCode || !toCode}>
          Показать маршруты
        </button>
      </div>

      {message && <p>{message}</p>}

      {routes.map((route, i) => (
        <ScheduleCard
          key={`${route.thread?.uid || 'route'}-${i}`}
          train={{
            direction: route.thread?.title || 'Маршрут без названия',
            departure: route.departure || '—',
            train: route.thread?.number || route.thread?.title || '—',
            platform:
              route.departure_platform ||
              route.arrival_platform ||
              route.from?.platform ||
              route.to?.platform ||
              route.thread?.departure_platform ||
              route.thread?.arrival_platform ||
              '—'
          }}
        />
      ))}
    </Container>
  );
}
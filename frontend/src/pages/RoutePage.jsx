import { useEffect, useRef, useState } from 'react';
import { getRoutes, searchStation } from '../api/api';
import Container from '../layout/Container';
import ScheduleCard from '../components/ScheduleCard';
import StationAutocomplete from '../components/StationAutocomplete';
import StationMap from '../components/StationMap';
import { runDebouncedLatest } from '../utils/debouncedRequest';
import {
  requestStationsInBoundsDebounced,
  cancelStationsInBoundsRequest
} from '../utils/stationMapRequests';

const STATION_SEARCH_DEBOUNCE_MS = Number(import.meta.env.VITE_STATION_SEARCH_DEBOUNCE_MS);
const MAP_VIEWPORT_DEBOUNCE_MS = Number(import.meta.env.VITE_MAP_VIEWPORT_DEBOUNCE_MS);

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
  const viewportTimerId = useRef(null);

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

    setFromLoading(true);
    setMessage('');

    return runDebouncedLatest({
      requestRef: fromRequestId,
      delayMs: STATION_SEARCH_DEBOUNCE_MS,
      onRun: async ({ isLatest }) => {
      try {
        const stations = await searchStation(value);
        if (!isLatest()) return;
        setFromStations(stations);
        if (stations.length === 0) setMessage('Станция отправления не найдена.');
      } catch {
        if (!isLatest()) return;
        setFromStations([]);
        setMessage('Ошибка поиска станции отправления.');
      } finally {
        if (isLatest()) setFromLoading(false);
      }
      }
    });
  }, [fromQuery]);

  useEffect(() => {
    const value = toQuery.trim();
    if (!value) {
      setToStations([]);
      setToLoading(false);
      return undefined;
    }

    setToLoading(true);
    setMessage('');

    return runDebouncedLatest({
      requestRef: toRequestId,
      delayMs: STATION_SEARCH_DEBOUNCE_MS,
      onRun: async ({ isLatest }) => {
      try {
        const stations = await searchStation(value);
        if (!isLatest()) return;
        setToStations(stations);
        if (stations.length === 0) setMessage('Станция прибытия не найдена.');
      } catch {
        if (!isLatest()) return;
        setToStations([]);
        setMessage('Ошибка поиска станции прибытия.');
      } finally {
        if (isLatest()) setToLoading(false);
      }
      }
    });
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
    requestStationsInBoundsDebounced({
      viewport,
      requestRef: viewportRequestId,
      timerRef: viewportTimerId,
      delayMs: MAP_VIEWPORT_DEBOUNCE_MS,
      setStations: setMapStations
    });
  };

  useEffect(
    () => () => cancelStationsInBoundsRequest({
      requestRef: viewportRequestId,
      timerRef: viewportTimerId
    }),
    []
  );

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

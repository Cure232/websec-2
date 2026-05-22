import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContextInstance';
import { searchStation, getSchedule } from '../api/api';
import ScheduleCard from '../components/ScheduleCard';
import StationAutocomplete from '../components/StationAutocomplete';
import StationMap from '../components/StationMap';
import Container from '../layout/Container';
import { loadFavoritesFromStorage, saveFavoritesToStorage } from '../storage/favoritesStorage';
import { runDebouncedLatest } from '../utils/debouncedRequest';
import {
  requestStationsInBoundsDebounced,
  cancelStationsInBoundsRequest
} from '../utils/stationMapRequests';

const STATION_SEARCH_DEBOUNCE_MS = Number(import.meta.env.VITE_STATION_SEARCH_DEBOUNCE_MS);
const MAP_VIEWPORT_DEBOUNCE_MS = Number(import.meta.env.VITE_MAP_VIEWPORT_DEBOUNCE_MS);

export default function StationPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mapStations, setMapStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [favorites, setFavorites] = useState(loadFavoritesFromStorage);
  const { schedule, setSchedule } = useContext(AppContext);
  const searchRequestId = useRef(0);
  const viewportRequestId = useRef(0);
  const viewportTimerId = useRef(null);

  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  const handleSearch = value => {
    setQuery(value);
    if (!value) {
      setSelectedStation(null);
    }
    setSchedule([]);
  };

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    setSearchLoading(true);
    setMessage('');

    return runDebouncedLatest({
      requestRef: searchRequestId,
      delayMs: STATION_SEARCH_DEBOUNCE_MS,
      onRun: async ({ isLatest }) => {
      try {
        const foundStations = await searchStation(value);
        if (!isLatest()) return;
        setSuggestions(foundStations);
        if (foundStations.length === 0) {
          setMessage('Станции не найдены.');
        }
      } catch {
        if (!isLatest()) return;
        setSuggestions([]);
        setMessage('Не удалось выполнить поиск станции.');
      } finally {
        if (isLatest()) {
          setSearchLoading(false);
        }
      }
      }
    });
  }, [query]);

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

  const handlePickStation = station => {
    setSelectedStation(station);
    setQuery(station.displayTitle || station.title);
    setMessage('');
  };

  const handleLoadSchedule = async () => {
    if (!selectedStation?.code) {
      setMessage('Выберите станцию из выпадающего списка или на карте.');
      return;
    }

    setScheduleLoading(true);
    setMessage('');
    setSchedule([]);
    try {
      const data = await getSchedule(selectedStation.code);
      const safeData = Array.isArray(data) ? data : [];
      setSchedule(safeData);
      if (safeData.length === 0) {
        setMessage('Для выбранной станции расписание не найдено.');
      }
    } catch {
      setMessage('Не удалось загрузить расписание.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleShowFavorite = async favorite => {
    if (!favorite?.station?.code) {
      setMessage('Не удалось открыть избранную станцию.');
      return;
    }

    setSelectedStation(favorite.station);
    setQuery(favorite.station.displayTitle || favorite.station.title || favorite.station.code);
    setSuggestions([]);

    setScheduleLoading(true);
    setMessage('');
    setSchedule([]);
    try {
      const data = await getSchedule(favorite.station.code);
      const safeData = Array.isArray(data) ? data : [];
      setSchedule(safeData);
      if (safeData.length === 0) {
        setMessage('Для выбранной станции расписание не найдено.');
      }
    } catch {
      setMessage('Не удалось загрузить расписание.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveFavorite = () => {
    if (!selectedStation?.code) {
      setMessage('Сначала выберите станцию.');
      return;
    }

    const isUpdate = favorites.some(item => item.station.code === selectedStation.code);
    const stationToSave = {
      code: selectedStation.code,
      title: selectedStation.title || selectedStation.displayTitle || selectedStation.code,
      displayTitle: selectedStation.displayTitle || selectedStation.title || selectedStation.code,
      location: selectedStation.location || '',
      lat: selectedStation.lat ?? null,
      lng: selectedStation.lng ?? null
    };

    setFavorites(prev => {
      const withoutCurrent = prev.filter(item => item.station.code !== stationToSave.code);
      return [
        {
          station: stationToSave
        },
        ...withoutCurrent
      ];
    });

    setMessage(isUpdate ? 'Избранное обновлено.' : 'Станция добавлена в избранное.');
  };

  const handleRemoveFavorite = stationCode => {
    setFavorites(prev => prev.filter(item => item.station.code !== stationCode));
    setMessage('Станция удалена из избранного.');
  };

  return (
    <Container>
      <h2>Поиск станции</h2>
      <p>Введите станцию, выберите из подсказок или на карте и загрузите расписание электричек.</p>

      <div className="controls-row">
        <StationAutocomplete
          value={query}
          placeholder="Например: Самара"
          suggestions={suggestions}
          loading={searchLoading}
          onInputChange={handleSearch}
          onSelect={handlePickStation}
        />
        <button onClick={handleLoadSchedule} disabled={scheduleLoading || !selectedStation?.code}>
          Показать расписание
        </button>
        <button type="button" onClick={handleSaveFavorite} disabled={!selectedStation?.code}>
          Сохранить в избранное
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedStation(null);
            setQuery('');
            setSuggestions([]);
            setSchedule([]);
            setMessage('');
          }}
        >
          Сбросить выбор
        </button>
      </div>

      <section className="favorites-panel">
        <h3>Избранные станции</h3>
        {favorites.length === 0 ? (
          <p className="favorites-empty">Пока нет сохраненных станций.</p>
        ) : (
          <div className="favorites-list">
            {favorites.map(favorite => (
              <div className="favorite-item" key={favorite.station.code}>
                <div className="favorite-meta">
                  <strong>
                    {favorite.station.displayTitle || favorite.station.title || favorite.station.code}
                  </strong>
                  <span>Код станции: {favorite.station.code}</span>
                </div>
                <div className="favorite-actions">
                  <button
                    type="button"
                    disabled={scheduleLoading}
                    onClick={() => {
                      void handleShowFavorite(favorite);
                    }}
                  >
                    Показать
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleRemoveFavorite(favorite.station.code)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <StationMap
        stations={mapStations}
        onPickStation={handlePickStation}
        selectedFromCode={selectedStation?.code}
        selectedToCode=""
        onViewportChange={handleViewportChange}
      />

      {message && <p>{message}</p>}

      {(Array.isArray(schedule) ? schedule : []).map((train, i) => (
        <ScheduleCard key={i} train={train} />
      ))}
    </Container>
  );
}

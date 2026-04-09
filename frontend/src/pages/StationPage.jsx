import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContextInstance';
import { searchStation, getSchedule, getStationsInBounds } from '../api/api';
import ScheduleCard from '../components/ScheduleCard';
import StationAutocomplete from '../components/StationAutocomplete';
import StationMap from '../components/StationMap';
import Container from '../layout/Container';

const FAVORITES_STORAGE_KEY = 'favoriteStationSchedules';

function loadFavoritesFromStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        item =>
          item &&
          typeof item === 'object' &&
          item.station &&
          typeof item.station === 'object' &&
          typeof item.station.code === 'string'
      )
      .map(item => ({ station: item.station }));
  } catch {
    return [];
  }
}

function saveFavoritesToStorage(favorites) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage errors (private mode, quota, etc.) so schedule page stays usable.
  }
}

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

    const requestId = ++searchRequestId.current;
    setSearchLoading(true);
    setMessage('');

    const timerId = setTimeout(async () => {
      try {
        const foundStations = await searchStation(value);
        if (requestId !== searchRequestId.current) return;
        setSuggestions(foundStations);
        if (foundStations.length === 0) {
          setMessage('Станции не найдены.');
        }
      } catch {
        if (requestId !== searchRequestId.current) return;
        setSuggestions([]);
        setMessage('Не удалось выполнить поиск станции.');
      } finally {
        if (requestId === searchRequestId.current) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timerId);
  }, [query]);

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

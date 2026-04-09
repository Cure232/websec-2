import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [53.1959, 50.1008];
const DEFAULT_ZOOM = 10;

function ViewportEvents({ onViewportChange }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onViewportChange?.({
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
        zoom: map.getZoom()
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onViewportChange?.({
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
        zoom: map.getZoom()
      });
    }
  });

  useEffect(() => {
    const bounds = map.getBounds();
    onViewportChange?.({
      minLat: bounds.getSouth(),
      minLng: bounds.getWest(),
      maxLat: bounds.getNorth(),
      maxLng: bounds.getEast(),
      zoom: map.getZoom()
    });
  }, [map, onViewportChange]);

  return null;
}

export default function StationMap({
  stations,
  onPickStation,
  selectedFromCode,
  selectedToCode,
  onViewportChange
}) {
  const safeStations = Array.isArray(stations) ? stations : [];
  const uniqueByCode = new Map();

  const stationsWithCoords = safeStations
    .filter(station => station && typeof station === 'object')
    .map(station => {
      const lat = Number(station.lat);
      const lng = Number(station.lng);
      return {
        ...station,
        lat,
        lng
      };
    })
    .filter(
      station =>
        Number.isFinite(station.lat) &&
        Number.isFinite(station.lng) &&
        Math.abs(station.lat) <= 90 &&
        Math.abs(station.lng) <= 180
    )
    .filter(station => {
      const key = station.code || `${station.title}-${station.lat}-${station.lng}`;
      if (uniqueByCode.has(key)) return false;
      uniqueByCode.set(key, true);
      return true;
    });

  return (
    <div className="map-wrapper">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: 320, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewportEvents onViewportChange={onViewportChange} />
        {stationsWithCoords.map(station => {
          const isFrom = station.code === selectedFromCode;
          const isTo = station.code === selectedToCode;
          const color = isFrom ? '#2563eb' : isTo ? '#16a34a' : '#ef4444';
          const radius = isFrom || isTo ? 8 : 5;
          const position = { lat: station.lat, lng: station.lng };

          if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
            return null;
          }

          return (
            <CircleMarker
              key={station.code || `${station.title}-${station.lat}-${station.lng}`}
              center={position}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
              radius={radius}
              eventHandlers={{
                click: () => onPickStation(station)
              }}
            >
              <Popup>{station.displayTitle || station.title}</Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

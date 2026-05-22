import { getStationsInBounds } from '../api/api';
import { cancelDebouncedLatest } from './debouncedRequest';

export function requestStationsInBoundsDebounced({
  viewport,
  requestRef,
  timerRef,
  delayMs,
  setStations
}) {
  const requestId = ++requestRef.current;

  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }

  timerRef.current = setTimeout(async () => {
    if (requestId !== requestRef.current) return;

    try {
      const stations = await getStationsInBounds(viewport);
      if (requestId !== requestRef.current) return;
      setStations(stations);
    } catch {
      if (requestId !== requestRef.current) return;
      setStations([]);
    } finally {
      if (requestId === requestRef.current) {
        timerRef.current = null;
      }
    }
  }, delayMs);
}

export function cancelStationsInBoundsRequest({ requestRef, timerRef }) {
  cancelDebouncedLatest({ requestRef, timerRef });
}

export function runDebouncedLatest({ requestRef, delayMs, onRun }) {
  const requestId = ++requestRef.current;
  const timerId = setTimeout(() => {
    void onRun({
      requestId,
      isLatest: () => requestId === requestRef.current
    });
  }, delayMs);

  return () => clearTimeout(timerId);
}

export function cancelDebouncedLatest({ requestRef, timerRef }) {
  requestRef.current += 1;
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

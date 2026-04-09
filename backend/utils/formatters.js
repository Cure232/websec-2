function formatSchedule(schedule) {
  if (!Array.isArray(schedule)) {
    return [];
  }

  const seen = new Set();

  return schedule
    .map(item => {
      return {
        departure: item?.departure || '—',
        arrival: item?.arrival || '—',
        train: item?.thread?.title || '—',
        direction: item?.thread?.short_title || item?.thread?.title || '—',
        platform: item?.platform || '—',
        status: item?.except_days || ''
      };
    })
    .filter(item => {
      const key = [
        item.departure,
        item.arrival,
        item.train,
        item.direction,
        item.platform,
        item.status
      ].join('|');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

module.exports = {
  formatSchedule
};

function formatSchedule(schedule) {
  return schedule.map(item => {
    return {
      departure: item.departure,
      arrival: item.arrival,
      train: item.thread.title,
      direction: item.thread.short_title,
      platform: item.platform,
      status: item.except_days
    };
  });
}

module.exports = {
  formatSchedule
};
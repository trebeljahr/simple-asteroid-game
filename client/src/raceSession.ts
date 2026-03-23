let raceStartTime = Date.now();

export const resetRaceStartTime = () => {
  raceStartTime = Date.now();
};

export const getRaceDurationSeconds = () => {
  return Math.floor((Date.now() - raceStartTime) / 1000);
};

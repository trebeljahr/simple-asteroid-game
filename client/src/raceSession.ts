let raceStartTime = Date.now();

export const resetRaceStartTime = () => {
  raceStartTime = Date.now();
};

export const getRaceDurationMilliseconds = () => {
  return Date.now() - raceStartTime;
};

export const getRaceDurationSeconds = () => {
  return Math.floor(getRaceDurationMilliseconds() / 1000);
};

export const formatRaceDuration = (
  durationMilliseconds = getRaceDurationMilliseconds(),
  fractionalDigits = 1
) => {
  const totalMinutes = Math.floor(durationMilliseconds / 60000);
  const totalSeconds = Math.floor(durationMilliseconds / 1000) % 60;
  const minuteLabel = String(totalMinutes).padStart(2, "0");
  const secondLabel = String(totalSeconds).padStart(2, "0");

  if (fractionalDigits <= 0) {
    return `${minuteLabel}:${secondLabel}`;
  }

  const fractionalScale = 10 ** fractionalDigits;
  const fractionalValue = Math.floor(
    (durationMilliseconds % 1000) / (1000 / fractionalScale)
  );
  const fractionalLabel = String(fractionalValue).padStart(fractionalDigits, "0");

  return `${minuteLabel}:${secondLabel}.${fractionalLabel}`;
};

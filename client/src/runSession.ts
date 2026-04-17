let runStartTime = Date.now();
let runTookDamage = false;

export const resetRunStartTime = () => {
  runStartTime = Date.now();
  runTookDamage = false;
};

export const markRunDamageTaken = () => {
  runTookDamage = true;
};

export const didTakeDamageInCurrentRun = () => runTookDamage;

export const getRunDurationMilliseconds = () => {
  return Date.now() - runStartTime;
};

export const getRunDurationSeconds = () => {
  return Math.floor(getRunDurationMilliseconds() / 1000);
};

export const formatRunDuration = (
  durationMilliseconds = getRunDurationMilliseconds(),
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

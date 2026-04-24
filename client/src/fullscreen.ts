interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

const getFullscreenRoot = () => {
  return document.documentElement as FullscreenElement;
};

export const isFullscreenAvailable = () => {
  const root = getFullscreenRoot();
  return (
    typeof root.requestFullscreen === "function" ||
    typeof root.webkitRequestFullscreen === "function"
  );
};

export const isFullscreenActive = () => {
  const fullscreenDocument = document as FullscreenDocument;
  return document.fullscreenElement !== null || fullscreenDocument.webkitFullscreenElement != null;
};

const requestFullscreen = async () => {
  const root = getFullscreenRoot();
  if (typeof root.requestFullscreen === "function") {
    await root.requestFullscreen();
    return;
  }
  if (typeof root.webkitRequestFullscreen === "function") {
    await root.webkitRequestFullscreen();
  }
};

const exitFullscreen = async () => {
  const fullscreenDocument = document as FullscreenDocument;
  if (typeof document.exitFullscreen === "function") {
    await document.exitFullscreen();
    return;
  }
  if (typeof fullscreenDocument.webkitExitFullscreen === "function") {
    await fullscreenDocument.webkitExitFullscreen();
  }
};

export const toggleFullscreenMode = async () => {
  if (!isFullscreenAvailable()) {
    return false;
  }

  try {
    if (isFullscreenActive()) {
      await exitFullscreen();
      return false;
    }

    await requestFullscreen();
    return true;
  } catch (_error) {
    return isFullscreenActive();
  }
};

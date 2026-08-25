let deferredInstallPrompt = null;

const INSTALL_AVAILABLE_EVENT = "progmes-install-available";
const APP_INSTALLED_EVENT = "progmes-app-installed";

function getWindow() {
  return typeof window === "undefined" ? null : window;
}

export function isPwaInstalled() {
  const currentWindow = getWindow();
  if (!currentWindow) return false;

  return Boolean(
    currentWindow.matchMedia?.("(display-mode: standalone)")?.matches ||
      currentWindow.navigator.standalone === true,
  );
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  getWindow()?.dispatchEvent(new Event(INSTALL_AVAILABLE_EVENT));
}

function handleAppInstalled() {
  deferredInstallPrompt = null;
  getWindow()?.dispatchEvent(new Event(APP_INSTALLED_EVENT));
}

const currentWindow = getWindow();
if (currentWindow) {
  currentWindow.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  currentWindow.addEventListener("appinstalled", handleAppInstalled);
}

export function hasInstallPrompt() {
  return Boolean(deferredInstallPrompt);
}

export function subscribeInstallState(callback) {
  const currentWindow = getWindow();
  if (!currentWindow) return () => {};

  const notify = (event) => callback({
    canInstall: hasInstallPrompt(),
    installed: event?.type === APP_INSTALLED_EVENT || isPwaInstalled(),
  });

  currentWindow.addEventListener(INSTALL_AVAILABLE_EVENT, notify);
  currentWindow.addEventListener(APP_INSTALLED_EVENT, notify);

  return () => {
    currentWindow.removeEventListener(INSTALL_AVAILABLE_EVENT, notify);
    currentWindow.removeEventListener(APP_INSTALLED_EVENT, notify);
  };
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return { outcome: "unavailable" };

  const installEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await installEvent.prompt();

  const choice = await installEvent.userChoice;
  return choice || { outcome: "dismissed" };
}

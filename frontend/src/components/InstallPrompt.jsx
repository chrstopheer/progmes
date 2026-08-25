import { useEffect, useState } from "react";

const DISMISSED_KEY = "progmes_install_prompt_dismissed_v1";
const DISMISS_DAYS = 7;

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function wasRecentlyDismissed() {
  try {
    const value = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(value) && Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (!isStandalone() && !wasRecentlyDismissed()) {
        setInstallEvent(event);
        setVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; the prompt can still be dismissed for this session.
    }
    setInstallEvent(null);
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    const promptEvent = installEvent;
    setInstallEvent(null);
    setVisible(false);
    await promptEvent.prompt();
    await promptEvent.userChoice;
  };

  if (!visible || !installEvent || isStandalone()) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5" role="dialog" aria-modal="true" aria-labelledby="install-progmes-title">
      <section className="w-full max-w-sm rounded-[2rem] bg-white border shadow-xl px-6 py-6 text-center" style={{ borderColor: "var(--hairline)" }}>
        <h2 id="install-progmes-title" className="font-display text-2xl leading-tight" style={{ color: "var(--ink)" }}>
          Instale o Progmes no seu celular
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-soft)" }}>
          Tenha acesso fácil à programação pelo ícone do aplicativo, sem precisar instalar manualmente.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={install} className="w-full h-11 rounded-md font-medium" style={{ background: "var(--brand-red)", color: "white" }}>
            Instalar
          </button>
          <button type="button" onClick={dismiss} className="w-full h-11 rounded-md font-medium" style={{ color: "var(--brand-blue)" }}>
            Agora não
          </button>
        </div>
      </section>
    </div>
  );
}

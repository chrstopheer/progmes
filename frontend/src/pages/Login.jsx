import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

function isPwaStandalone() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true,
  );
}

export default function Login() {
  const { configured, user, loading, authError, signInWithGoogle, enterLocalAccess } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(isPwaStandalone);

  useEffect(() => {
    if (authError) {
      setErrorDetail(`${authError.code || "firebase/error"}: ${authError.message || "erro desconhecido"}`);
    }
  }, [authError]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const updateStandaloneState = () => setIsStandalone(isPwaStandalone());
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallGuide(false);
      setIsStandalone(true);
      toast.success("Aplicativo instalado com sucesso.");
    };

    updateStandaloneState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery?.addEventListener?.("change", updateStandaloneState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery?.removeEventListener?.("change", updateStandaloneState);
    };
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  const handleLogin = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Login realizado com sucesso.");
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error?.code === "auth/popup-closed-by-user"
          ? "A janela de login foi fechada."
          : error?.code === "auth/unauthorized-domain"
            ? "Este domínio do Preview ainda não foi autorizado no Firebase."
            : error?.code === "auth/popup-blocked"
              ? "O navegador bloqueou a janela do Google. Tente novamente ou permita popups para este site."
              : "Não foi possível entrar com o Google. Tente novamente.";
      setErrorDetail(`${error?.code || "firebase/error"}: ${error?.message || message}`);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleLocalAccess = () => {
    enterLocalAccess();
    navigate("/", { replace: true });
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstallGuide(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice?.outcome === "accepted") {
      toast.success("Siga a confirmação do navegador para instalar o app.");
    } else {
      setShowInstallGuide(true);
    }
  };

  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-5 py-4 sm:p-6">
      <section
        className="w-full max-w-sm rounded-[2rem] bg-white border shadow-sm px-7 py-6 sm:px-9 sm:py-8 text-center"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="flex flex-col items-center">
          <div
            className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-sm mb-5"
            style={{ background: "var(--brand-yellow)" }}
          >
            <CalendarDays className="h-10 w-10" style={{ color: "var(--brand-red)" }} />
          </div>
          <h1 className="font-display text-4xl leading-tight" style={{ color: "var(--ink)" }}>
            Programação
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--ink-soft)" }}>
            Crie e compartilhe.
          </p>
        </div>

        {!configured && (
          <div
            className="rounded-xl border p-4 mt-5 text-sm leading-6 text-left"
            style={{ borderColor: "#f0c36d", background: "#fff8e7", color: "#7a4e00" }}
          >
            O Firebase ainda não foi configurado. Adicione as variáveis `REACT_APP_FIREBASE_*` antes de iniciar o app.
          </div>
        )}

        {errorDetail && (
          <div
            className="rounded-xl border p-4 mt-5 text-xs leading-5 break-words text-left"
            style={{ borderColor: "#e2a3a3", background: "#fff1f1", color: "#8a1c1c" }}
            data-testid="firebase-error-detail"
          >
            <strong>Detalhe técnico:</strong>
            <br />
            {errorDetail}
          </div>
        )}

        <Button
          className="w-full h-12 mt-5 rounded-md border bg-white hover:bg-[#f8fafd] text-[#1f1f1f] font-medium text-sm"
          onClick={handleLogin}
          disabled={!configured || busy}
          data-testid="login-submit-button"
          aria-label="Entrar com o Google"
          style={{ borderColor: "#747775", fontFamily: "Google Sans, Arial, sans-serif" }}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <svg className="h-5 w-5 mr-3" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path fill="#EA4335" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
              <path fill="#4285F4" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.835.858-3.048.858-2.344 0-4.328-1.584-5.036-3.714H.958v2.331A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.963H.958A9 9 0 0 0 0 9c0 1.453.348 2.827.958 4.037l3.006-2.331Z" />
              <path fill="#34A853" d="M9 3.58c1.322 0 2.508.454 3.44 1.345l2.581-2.581C13.463.89 11.426 0 9 0A9 9 0 0 0 .958 4.963l3.006 2.331C4.672 5.164 6.656 3.58 9 3.58Z" />
            </svg>
          )}
          {busy ? "Entrando..." : "Entrar com o Google"}
        </Button>

        {!isStandalone && (
          <div
            className="mt-5 rounded-xl border p-4 text-left"
            style={{ borderColor: "#d9c98a", background: "#fffdf3" }}
            data-testid="install-pwa-card"
          >
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--brand-blue)" }} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Instale o app no celular
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: "var(--ink-soft)" }}>
                  Tenha acesso rápido à Programação, inclusive quando estiver sem internet.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleInstall}
              className="w-full h-10 mt-3 rounded-md text-sm font-semibold"
              style={{ background: "var(--brand-blue)", color: "white" }}
              data-testid="install-pwa-button"
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              {installPrompt ? "Instalar aplicativo" : "Ver como instalar"}
            </Button>
            {showInstallGuide && (
              <p
                className="mt-3 text-xs leading-5"
                style={{ color: "var(--ink-soft)" }}
                role="status"
                data-testid="install-pwa-guide"
              >
                {isIos
                  ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início."
                  : "No Chrome, toque no menu ⋮ e escolha Instalar aplicativo ou Adicionar à tela inicial."}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
          <button
            type="button"
            onClick={handleLocalAccess}
            className="text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--brand-blue)" }}
            data-testid="login-without-google-btn"
          >
            Entrar sem conta Google
          </button>
          <p className="mt-1 text-xs leading-4" style={{ color: "var(--ink-soft)" }}>
            Sem o login, os dados ficam apenas neste dispositivo e poderão ser perdidos.
          </p>
        </div>
      </section>
    </main>
  );
}

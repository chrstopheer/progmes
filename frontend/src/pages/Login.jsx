import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { configured, user, loading, authError, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    if (authError) {
      setErrorDetail(`${authError.code || "firebase/error"}: ${authError.message || "erro desconhecido"}`);
    }
  }, [authError]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleLogin = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Login realizado com sucesso.");
      navigate("/");
    } catch (error) {
      const message = error?.code === "auth/popup-closed-by-user"
        ? "A janela de login foi fechada."
        : error?.code === "auth/unauthorized-domain"
          ? "Este domínio do Preview ainda não foi autorizado no Firebase."
          : error?.code === "auth/popup-blocked"
            ? "O navegador bloqueou a janela do Google. Tente novamente ou permita popups para este site."
            : "Não foi possível entrar com o Google. Tente novamente.";
      setErrorDetail(`${error?.code || "firebase/error"}: ${error?.message || message}`);
      toast.error(message);
    } finally {
      if (!user) setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-5 py-8 sm:p-6">
      <section
        className="w-full max-w-sm rounded-[2rem] bg-white border shadow-sm px-7 py-9 sm:px-9 sm:py-10 text-center"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="flex flex-col items-center">
          <div
            className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-sm mb-6"
            style={{ background: "var(--brand-yellow)" }}
          >
            <CalendarDays className="h-10 w-10" style={{ color: "var(--brand-red)" }} />
          </div>
          <h1 className="font-display text-4xl leading-tight" style={{ color: "var(--ink)" }}>
            Programação
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--ink-soft)" }}>
            Crie e compartilhe.
          </p>
        </div>

        {!configured && (
          <div
            className="rounded-xl border p-4 mt-8 text-sm leading-6 text-left"
            style={{ borderColor: "#f0c36d", background: "#fff8e7", color: "#7a4e00" }}
          >
            O Firebase ainda não foi configurado. Adicione as variáveis `REACT_APP_FIREBASE_*` antes de iniciar o app.
          </div>
        )}

        {errorDetail && (
          <div
            className="rounded-xl border p-4 mt-6 text-xs leading-5 break-words text-left"
            style={{ borderColor: "#e2a3a3", background: "#fff1f1", color: "#8a1c1c" }}
            data-testid="firebase-error-detail"
          >
            <strong>Detalhe técnico:</strong><br />{errorDetail}
          </div>
        )}

        <Button
          className="w-full h-12 mt-8 rounded-md border bg-white hover:bg-[#f8fafd] text-[#1f1f1f] font-medium text-sm"
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
      </section>
    </main>
  );
}

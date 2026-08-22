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
          className="w-full h-12 mt-8 border bg-white hover:bg-stone-50"
          onClick={handleLogin}
          disabled={!configured || busy}
          data-testid="login-submit-button"
          style={{ borderColor: "var(--hairline)", color: "var(--ink)" }}
        >
          {busy ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <span className="text-xl font-semibold mr-3" style={{ color: "#4285F4" }}>G</span>}
          {busy ? "Entrando..." : "Entrar com Google"}
        </Button>
      </section>
    </main>
  );
}

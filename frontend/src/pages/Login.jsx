import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { configured, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl bg-white border shadow-sm p-8 sm:p-10" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-3 mb-9">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--brand-yellow)" }}>
            <CalendarDays className="h-6 w-6" style={{ color: "var(--brand-red)" }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--brand-red)" }}>Progmes</p>
            <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Programação</h1>
          </div>
        </div>
        <div className="space-y-3 mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--brand-blue)" }}>Área privada</p>
          <h2 className="font-display text-3xl leading-tight">Entre para continuar</h2>
          <p className="text-sm leading-6" style={{ color: "var(--ink-soft)" }}>Suas atividades e configurações ficam salvas na sua conta, disponíveis em qualquer dispositivo.</p>
        </div>
        {!configured && <div className="rounded-xl border p-4 mb-5 text-sm leading-6" style={{ borderColor: "#f0c36d", background: "#fff8e7", color: "#7a4e00" }}>O Firebase ainda não foi configurado. Adicione as variáveis `REACT_APP_FIREBASE_*` antes de iniciar o app.</div>}
        <Button className="w-full h-12" onClick={handleLogin} disabled={!configured || busy} data-testid="login-submit-button" style={{ background: "var(--brand-red)", color: "white" }}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
          {busy ? "Entrando..." : "Entrar com Google"}
        </Button>
        <p className="mt-6 text-xs text-center leading-5" style={{ color: "var(--ink-soft)" }}>Ao entrar, você concorda em manter seus dados de programação privados na sua conta.</p>
      </section>
    </main>
  );
}

import React from "react";
import { CalendarDays, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export function AppHeader({ right }) {
  const { user, logout } = useAuth();
  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div className="brand-bar h-1.5 w-full" />
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "var(--brand-yellow)" }}
          >
            <CalendarDays
              className="h-5 w-5"
              style={{ color: "var(--brand-red)" }}
            />
          </div>
          <div>
            <div
              className="font-display text-lg leading-tight whitespace-nowrap"
              style={{ color: "var(--ink)" }}
            >
              Programação
            </div>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
          <div className="shrink-0">{right}</div>
          {user && <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-button" className="shrink-0" title={`Sair de ${user.email || "sua conta"}`}><LogOut className="h-4 w-4 mr-1" /> Sair</Button>}
        </div>
      </div>
    </header>
  );
}

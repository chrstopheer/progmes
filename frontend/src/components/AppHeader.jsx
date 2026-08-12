import React, { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { loadSettings } from "../lib/storage";

export function AppHeader({ right, subtitle }) {
  const [community, setCommunity] = useState(
    () => subtitle ?? loadSettings().header.community,
  );

  useEffect(() => {
    if (subtitle !== undefined) setCommunity(subtitle);
  }, [subtitle]);

  // Listen for cross-tab / dialog updates
  useEffect(() => {
    const handler = () => setCommunity(loadSettings().header.community);
    window.addEventListener("prog-ong:settings-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("prog-ong:settings-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div className="brand-bar h-1.5 w-full" />
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
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
              className="font-display text-lg leading-tight"
              style={{ color: "var(--ink)" }}
            >
              Programação
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--ink-soft)" }}
              data-testid="app-header-community"
            >
              {community || "Comunidade"}
            </div>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}

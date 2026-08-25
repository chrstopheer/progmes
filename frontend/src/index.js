import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const PWA_INSTALLED_KEY = "progmes-pwa-installed";
const PWA_INSTALLABLE_KEY = "progmes-pwa-installable";
const PWA_INSTALL_STATE_EVENT = "progmes-pwa-install-state";

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", () => {
    try {
      window.localStorage.setItem(PWA_INSTALLABLE_KEY, "true");
      window.localStorage.removeItem(PWA_INSTALLED_KEY);
    } catch {}
    window.dispatchEvent(new Event(PWA_INSTALL_STATE_EVENT));
  });

  window.addEventListener("appinstalled", () => {
    try {
      window.localStorage.setItem(PWA_INSTALLED_KEY, "true");
      window.localStorage.removeItem(PWA_INSTALLABLE_KEY);
    } catch {}
    window.dispatchEvent(new Event(PWA_INSTALL_STATE_EVENT));
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

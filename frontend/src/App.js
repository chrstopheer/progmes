import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ActivityForm from "./pages/ActivityForm";
import Schedule from "./pages/Schedule";
import HistorySuggestions from "./components/HistorySuggestions";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function ProtectedRoutes() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen bg-paper flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand-red)" }} /></div>;
  if (!configured) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/atividade/:year/:month/:day" element={<ActivityForm />} />
        <Route path="/programacao/:year/:month" element={<Schedule />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <HistorySuggestions />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;

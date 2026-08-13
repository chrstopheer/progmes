import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import ActivityForm from "./pages/ActivityForm";
import Schedule from "./pages/Schedule";
import HistorySuggestions from "./components/HistorySuggestions";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/atividade/:year/:month/:day" element={<ActivityForm />} />
          <Route path="/programacao/:year/:month" element={<Schedule />} />
        </Routes>
        <HistorySuggestions />
      </BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ duration: 3000 }}
      />
    </div>
  );
}

export default App;

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import SetupProfile from "./pages/SetupProfile";
import DashboardPage from "./pages/DashboardPage";
import Settings from "./pages/Settings/Settings";
import Reports from "./pages/Reports/Reports";
import { initializeAppearance } from "./utils/appearance";
import "./styles/globals.css";

export default function App() {
  useEffect(() => {
    initializeAppearance();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => initializeAppearance();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-profile" element={<SetupProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </BrowserRouter>
  );
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SetupProfile from "./pages/SetupProfile";
import DashboardPage from "./pages/DashboardPage";
import Settings from "./SettingPages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-profile" element={<SetupProfile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

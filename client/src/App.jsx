import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/landing/LandingPage";
import AuthGatePage from "./components/AuthGatePage";
import DashboardPage from "./components/DashboardPage";
import MentorDashboardPage from "./components/MentorDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthGatePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mentor" element={<MentorDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

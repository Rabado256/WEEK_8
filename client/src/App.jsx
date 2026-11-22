import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/landing/LandingPage";
import AuthGatePage from "./components/AuthGatePage";
import DashboardPage from "./components/DashboardPage";
import MentorDashboardPage from "./components/MentorDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthGatePage />} />
        <Route path="/dashboard" element={<ProtectedRoute role="MENTEE"><DashboardPage /></ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute role="MENTOR"><MentorDashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

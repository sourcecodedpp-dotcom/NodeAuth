import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Splash } from "./pages/Splash";
import { SupervisorLogin } from "./pages/SupervisorLogin";
import { Dashboard } from "./pages/Dashboard";
import { FaceScan } from "./pages/FaceScan";
import { Liveness } from "./pages/Liveness";
import { Settings } from "./pages/Settings";
import { Register } from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/supervisor-login" element={<SupervisorLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/face-scan" element={<FaceScan />} />
        <Route path="/liveness" element={<Liveness />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/register" element={<Register />} />
        
        {/* Redirect legacy links */}
        <Route path="/login" element={<Navigate to="/supervisor-login" replace />} />
        <Route path="/sync" element={<Navigate to="/settings" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

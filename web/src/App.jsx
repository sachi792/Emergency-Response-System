import { BrowserRouter, Routes, Route } from "react-router-dom";

import EmergencyRequest from "./components/EmergencyRequest";
import AmbulanceManagement from "./components/AmbulanceManagement";
import DispatcherDashboard from "./components/DispatcherDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Existing pages */}
        <Route
          path="/emergency"
          element={<EmergencyRequest />}
        />

        <Route
          path="/ambulance"
          element={<AmbulanceManagement />}
        />

        {/* Dispatcher */}
        <Route
          path="/dispatcher"
          element={
            <ProtectedRoute allowedRole="dispatcher">
              <DispatcherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Hospital */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRole="hospital">
              <HospitalDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
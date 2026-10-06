import { BrowserRouter, Routes, Route } from "react-router-dom";

import EmergencyRequest from "./components/EmergencyRequest";
import AmbulanceManagement from "./components/AmbulanceManagement";
import DispatcherDashboard from "./components/DispatcherDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/emergency"
          element={<EmergencyRequest />}
        />

        <Route
          path="/ambulance"
          element={<AmbulanceManagement />}
        />

        <Route
          path="/dispatcher"
          element={<DispatcherDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
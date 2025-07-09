import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register";
import PrivateRoute from "./components/PrivateRoute";
import StudentDashboard from "./pages/Estudiantes/StudentDashboard.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import SuperAdminDashboard from "./pages/Superadmin/SuperAdminDashboard.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
// Importar el componente de gestión de portafolios
import PortfolioManager from "./pages/Admin/PortfolioManager";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Rutas protegidas por rol */}
      <Route
        path="/estudiante"
        element={
          <PrivateRoute allowedRoles={["estudiante"]}>
            <StudentDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["administrador"]}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/superadmin"
        element={
          <PrivateRoute allowedRoles={["superadministrador"]}>
            <SuperAdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/portafolios"
        element={
          <PrivateRoute allowedRoles={["administrador"]}>
            <PortfolioManager />
          </PrivateRoute>
        }
      />
 
    </Routes>
  );
}

export default App;

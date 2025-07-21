import React, { useState } from "react";
import authService from "../../services/authService";
import PortfolioManager from "./PortfolioManager";
import ProgramasManager from "./ProgramasManager";
import ProyectosManager from "./ProyectosManager";
import "../Superadmin/Superadmin.css";
import Sidebar from "./Sidebar";

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState("bienvenida");

  return (
    <div className="admin-dashboard-container">
      <Sidebar vista={vista} setVista={setVista} />
      <main className="admin-main">
        {vista === "bienvenida" && (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <div>
                <h1>Panel de Control</h1>
                <p className="dashboard-subtitle">
                  Bienvenido, {user?.nombre} {user?.apellido}
                </p>
              </div>
              <div className="user-info-card">
                <div className="user-avatar">
                  {user?.nombre?.charAt(0)}
                  {user?.apellido?.charAt(0)}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user?.nombre} {user?.apellido}
                  </span>
                  <span className="user-role">{user?.rol}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "portafolios" && <PortfolioManager />}

        {vista === "programas" && <ProgramasManager />}

        {vista === "proyectos" && <ProyectosManager />}

        {vista === "reportes" && (
          <div className="coming-soon">
            <h1>Reportes y Estadísticas</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}

        {vista === "configuracion" && (
          <div className="coming-soon">
            <h1>Configuración del Sistema</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}
      </main>
    </div>
  );
}
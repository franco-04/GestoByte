import React, { useState } from "react";
import authService from "../../services/authService";
import PortfolioManager from "./PortfolioManager";
import ProgramasManager from "./ProgramasManager";
import ProyectosManager from "./ProyectosManager";
import ReunionesManager from "./ReunionesManager";
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

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Total Portafolios</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Reuniones Programadas</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Estudiantes Activos</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">🏫</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Programas Activos</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Acciones Rápidas</h3>
                </div>
                <div className="card-content">
                  <div className="quick-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => setVista('portafolios')}
                    >
                      <div className="action-icon">📚</div>
                      Gestionar Portafolios
                    </button>
                    <button 
                      className="action-btn info"
                      onClick={() => setVista('reuniones')}
                    >
                      <div className="action-icon">📅</div>
                      Programar Reunión
                    </button>
                    <button 
                      className="action-btn success"
                      onClick={() => setVista('programas')}
                    >
                      <div className="action-icon">🏫</div>
                      Gestionar Programas
                    </button>
                    <button 
                      className="action-btn warning"
                      onClick={() => setVista('proyectos')}
                    >
                      <div className="action-icon">📊</div>
                      Gestionar Proyectos
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Sistema</h3>
                </div>
                <div className="card-content">
                  <div className="activity-list">
                    <div className="activity-item success">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-message">Sistema funcionando correctamente</p>
                        <span className="activity-time">Ahora</span>
                      </div>
                    </div>
                    <div className="activity-item info">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-message">Acceso como Administrador</p>
                        <span className="activity-time">Sesión activa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "portafolios" && <PortfolioManager />}

        {vista === "programas" && <ProgramasManager />}

        {vista === "proyectos" && <ProyectosManager />}

        {/* 🔥 NUEVA SECCIÓN PARA REUNIONES */}
        {vista === "reuniones" && <ReunionesManager />}

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
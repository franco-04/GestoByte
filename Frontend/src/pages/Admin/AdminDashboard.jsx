import React, { useState } from 'react';
import {
  AiFillDashboard,
  AiFillFolder,
  AiOutlineUsergroupAdd,
  AiOutlineLineChart,
  AiFillSetting
} from 'react-icons/ai';
import authService from '../../services/authService';
// import PortfolioManager from './PortfolioManager';
import '../Admin/Admin.css';
import logo from "../../assets/log.png";


export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState('bienvenida');

  return (
<div className="admin-dashboard-container">
  <aside className="sidebar">
    <div className="sidebar-header">
       <img src={logo} alt="Logo" className="sidebar-logo" />
      <h2>Panel de Profesores</h2>
    </div>
    <nav className="sidebar-nav">
          <button
            className={`sidebar-button${vista === 'bienvenida' ? ' active' : ''}`}
            onClick={() => setVista('bienvenida')}
          >
            <AiFillDashboard className="sidebar-icon" /> Dashboard
          </button>
          <button
            className={`sidebar-button${vista === 'portafolios' ? ' active' : ''}`}
            onClick={() => setVista('portafolios')}
          >
            <AiFillFolder className="sidebar-icon" /> Gestionar Portafolios
          </button>
          <button
            className={`sidebar-button${vista === 'estudiantes' ? ' active' : ''}`}
            onClick={() => setVista('estudiantes')}
          >
            <AiOutlineUsergroupAdd className="sidebar-icon" /> Estudiantes
          </button>
          <button
            className={`sidebar-button${vista === 'reportes' ? ' active' : ''}`}
            onClick={() => setVista('reportes')}
          >
            <AiOutlineLineChart className="sidebar-icon" /> Reportes
          </button>
          <button
            className={`sidebar-button${vista === 'configuracion' ? ' active' : ''}`}
            onClick={() => setVista('configuracion')}
          >
            <AiFillSetting className="sidebar-icon" /> Configuración
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {vista === 'bienvenida' && (
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
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.nombre} {user?.apellido}</span>
                  <span className="user-role">{user?.rol}</span>
                </div>
              </div>
            </div>
            </div>
        )}

        {vista === 'portafolios' &&  (
          <div className="coming-soon">
            <h1>Gestion pendiente</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}

        {vista === 'estudiantes' && (
          <div className="coming-soon">
            <h1>Gestión de Estudiantes</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}

        {vista === 'reportes' && (
          <div className="coming-soon">
            <h1>Reportes y Estadísticas</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}

        {vista === 'configuracion' && (
          <div className="coming-soon">
            <h1>Configuración del Sistema</h1>
            <p>Esta sección estará disponible próximamente</p>
          </div>
        )}
      </main>
    </div>
  );
}

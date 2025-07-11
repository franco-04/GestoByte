import React, { useState, useEffect } from 'react';
import {
  AiFillDashboard,
  AiFillFolder
} from 'react-icons/ai';
import authService from '../../services/authService';
import api from '../../api/api';
import '../Admin/Admin.css';
import logo from "../../assets/log.png";

export default function StudentDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState('bienvenida');
  
  // Estados para el dashboard
  const [stats, setStats] = useState({
    totalPortafolios: 0,
    portafoliosActivos: 0,
    proximasEntregas: 0
  });
  
  // Estados para portafolios
  const [portafolios, setPortafolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar estadísticas cuando se monta el componente
  useEffect(() => {
    fetchStudentStats();
  }, []);

  // Cargar portafolios cuando se cambia a esa vista
  useEffect(() => {
    if (vista === 'portafolios') {
      fetchPortafolios();
    }
  }, [vista]);

  const fetchStudentStats = async () => {
    try {
      const res = await api.get("/auth/student/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      setError("Error al cargar estadísticas");
    }
  };

  const fetchPortafolios = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/auth/student/portafolios");
      setPortafolios(res.data);
    } catch (error) {
      console.error("Error al obtener portafolios:", error);
      setError("Error al cargar portafolios");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <h2>Panel de Estudiantes</h2>
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
            <AiFillFolder className="sidebar-icon" /> Mis Portafolios
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
                  <span className="user-role">{user?.carrera}</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
              </div>
            )}
            
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalPortafolios}</div>
                  <div className="stat-label">Portafolios Totales</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.portafoliosActivos}</div>
                  <div className="stat-label">Portafolios Activos</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.proximasEntregas}</div>
                  <div className="stat-label">Próximas Entregas</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Actividad Reciente</h3>
                </div>
                <div className="card-content">
                  <div className="activity-list">
                    <div className="activity-item success">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-message">Tienes {stats.totalPortafolios} portafolio(s) asignado(s)</p>
                        <span className="activity-time">Información actualizada</span>
                      </div>
                    </div>
                    {stats.proximasEntregas > 0 && (
                      <div className="activity-item warning">
                        <div className="activity-dot"></div>
                        <div className="activity-content">
                          <p className="activity-message">Tienes {stats.proximasEntregas} entrega(s) próxima(s)</p>
                          <span className="activity-time">En los próximos 7 días</span>
                        </div>
                      </div>
                    )}
                    <div className="activity-item info">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-message">Dashboard actualizado</p>
                        <span className="activity-time">Hace un momento</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Progreso General</h3>
                </div>
                <div className="card-content">
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-value">
                        {stats.totalPortafolios > 0 ? Math.round((stats.portafoliosActivos / stats.totalPortafolios) * 100) : 0}%
                      </div>
                      <div className="metric-label">Portafolios Activos</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{stats.portafoliosActivos}</div>
                      <div className="metric-label">En Progreso</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === 'portafolios' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mis Portafolios</h1>
              <p className="admin-subtitle">
                Portafolios en los que estás inscrito
              </p>
            </div>

            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="admin-content">
              {loading ? (
                <div className="loading-container">
                  <p>Cargando portafolios...</p>
                </div>
              ) : portafolios.length === 0 ? (
                <div className="admin-card">
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No tienes portafolios asignados</h3>
                    <p>Cuando tu coordinador te asigne a un portafolio, aparecerá aquí.</p>
                  </div>
                </div>
              ) : (
                <div className="portfolio-grid">
                  {portafolios.map((portafolio) => (
                    <div className="portfolio-card" key={portafolio.id_portafolio}>
                      <div className="portfolio-card-header">
                        <span className="portfolio-name">{portafolio.nombre}</span>
                        <span className="portfolio-career">{portafolio.carrera}</span>
                      </div>
                      <div className="portfolio-card-body">
                        <p className="portfolio-description">{portafolio.descripcion}</p>
                        <div className="portfolio-dates">
                          <div>
                            <span className="portfolio-label">Inicio:</span>{" "}
                            <span>{formatDate(portafolio.fecha_inicio)}</span>
                          </div>
                          <div>
                            <span className="portfolio-label">Fin:</span>{" "}
                            <span>{formatDate(portafolio.fecha_fin)}</span>
                          </div>
                        </div>
                        <div className="portfolio-coordinator">
                          <span className="portfolio-label">Coordinador:</span>{" "}
                          <span>
                            {portafolio.coordinador_nombre} {portafolio.coordinador_apellido}
                          </span>
                        </div>
                      </div>
                      <div className="portfolio-card-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            // Aquí puedes agregar navegación a los detalles del portafolio
                            console.log("Ver detalles del portafolio:", portafolio.id_portafolio);
                            // navigate(`/student/portfolio/${portafolio.id_portafolio}`);
                          }}
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
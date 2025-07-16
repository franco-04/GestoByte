import React, { useState, useEffect } from 'react';
import {
  AiFillDashboard,
  AiFillProject,
  AiOutlineUser,
  AiOutlineBell,
  AiOutlineFileText,
  AiOutlineArrowLeft,
  AiOutlineTeam,
  AiOutlineTrophy,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineClockCircle
} from 'react-icons/ai';
import authService from '../../services/authService';
import api from '../../api/api';
import EvidenceManager from '../../components/EvidenceManager';
import KanbanBoard from '../../components/KanbanBoard';
import './Estudent.css';
import './evidence_styles.css';
import logo from "../../assets/log.png";

export default function StudentDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState('dashboard');
  
  // Estados para el dashboard
  const [stats, setStats] = useState({
    totalProyectos: 0,
    actividadesTotales: 0,
    actividadesCompletadas: 0,
    totalEvidencias: 0,
    evidenciasAprobadas: 0,
    evidenciasPendientes: 0,
    alertasActivas: 0
  });
  
  // Estados para datos
  const [misProyectos, setMisProyectos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [evidenceStats, setEvidenceStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para navegación
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchMisProyectos();
    fetchAlertas();
    fetchEvidenceStats();
  }, []);

  const fetchMisProyectos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/student/my-projects");
      setMisProyectos(res.data);
      
      // Calcular estadísticas
      const totalActividades = res.data.reduce((sum, p) => sum + (p.total_actividades || 0), 0);
      const actividadesCompletadas = res.data.reduce((sum, p) => sum + (p.actividades_completadas || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalProyectos: res.data.length,
        actividadesTotales: totalActividades,
        actividadesCompletadas: actividadesCompletadas
      }));
    } catch (error) {
      console.error("Error al obtener mis proyectos:", error);
      setError("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidenceStats = async () => {
    try {
      const res = await api.get("/auth/student/evidencias/stats");
      setEvidenceStats(res.data);
      setStats(prev => ({
        ...prev,
        totalEvidencias: res.data.estadisticas.total_evidencias,
        evidenciasAprobadas: res.data.estadisticas.aprobadas,
        evidenciasPendientes: res.data.estadisticas.pendientes
      }));
    } catch (error) {
      console.error("Error al obtener estadísticas de evidencias:", error);
    }
  };

  const fetchAlertas = async () => {
    try {
      const res = await api.get("/auth/student/alertas");
      setAlertas(res.data);
      setStats(prev => ({
        ...prev,
        alertasActivas: res.data.length
      }));
    } catch (error) {
      console.error("Error al obtener alertas:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getRoleIcon = (rol) => {
    return rol === 'lider' ? <AiOutlineTrophy /> : <AiOutlineTeam />;
  };

  const getRoleColor = (rol) => {
    return rol === 'lider' ? '#f59e0b' : '#3b82f6';
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setVista('kanban');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setVista('proyectos');
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <h2>Panel Estudiante</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-button${vista === 'dashboard' ? ' active' : ''}`}
            onClick={() => {
              setVista('dashboard');
              setSelectedProject(null);
              clearMessages();
            }}
          >
            <AiFillDashboard className="sidebar-icon" /> Dashboard
          </button>
          <button
            className={`sidebar-button${vista === 'proyectos' || vista === 'kanban' ? ' active' : ''}`}
            onClick={() => {
              setVista('proyectos');
              setSelectedProject(null);
              clearMessages();
            }}
          >
            <AiFillProject className="sidebar-icon" /> Mis Proyectos
          </button>
          <button
            className={`sidebar-button${vista === 'evidencias' ? ' active' : ''}`}
            onClick={() => {
              setVista('evidencias');
              setSelectedProject(null);
              clearMessages();
            }}
          >
            <AiOutlineFileText className="sidebar-icon" /> Mis Evidencias
          </button>
          <button
            className={`sidebar-button${vista === 'perfil' ? ' active' : ''}`}
            onClick={() => {
              setVista('perfil');
              setSelectedProject(null);
              clearMessages();
            }}
          >
            <AiOutlineUser className="sidebar-icon" /> Mi Perfil
          </button>
          <button
            className={`sidebar-button${vista === 'alertas' ? ' active' : ''}`}
            onClick={() => {
              setVista('alertas');
              setSelectedProject(null);
              clearMessages();
            }}
          >
            <AiOutlineBell className="sidebar-icon" /> 
            Alertas 
            {alertas.length > 0 && <span className="alert-badge">{alertas.length}</span>}
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {/* Dashboard Principal */}
        {vista === 'dashboard' && (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <div>
                <h1>Dashboard</h1>
                <p className="dashboard-subtitle">
                  Bienvenido, {user?.nombre} {user?.apellido} - {user?.carrera}
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
            
            {/* Alertas globales */}
            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
                <button onClick={clearMessages} className="alert-close">×</button>
              </div>
            )}

            {success && (
              <div className="admin-alert admin-alert-success">
                <span>{success}</span>
                <button onClick={clearMessages} className="alert-close">×</button>
              </div>
            )}
            
            {/* Estadísticas principales */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalProyectos}</div>
                  <div className="stat-label">Proyectos Asignados</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.actividadesCompletadas}</div>
                  <div className="stat-label">Actividades Completadas</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📄</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalEvidencias}</div>
                  <div className="stat-label">Evidencias Subidas</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.actividadesTotales}</div>
                  <div className="stat-label">Actividades Totales</div>
                </div>
              </div>
            </div>

            {/* Contenido principal del dashboard */}
            <div className="dashboard-grid">
              {/* Mis Proyectos Activos */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Mis Proyectos Activos</h3>
                </div>
                <div className="card-content">
                  {loading ? (
                    <div className="loading-container">
                      <p>Cargando proyectos...</p>
                    </div>
                  ) : misProyectos.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <h4>No tienes proyectos asignados</h4>
                      <p>Cuando te asignen a un proyecto, aparecerá aquí.</p>
                    </div>
                  ) : (
                    <div className="activity-list">
                      {misProyectos.slice(0, 5).map((proyecto, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-icon" style={{ color: getRoleColor(proyecto.rol_usuario) }}>
                            {getRoleIcon(proyecto.rol_usuario)}
                          </div>
                          <div className="activity-content">
                            <p className="activity-message">
                              <strong>{proyecto.titulo}</strong>
                              <span className="project-role" style={{ color: getRoleColor(proyecto.rol_usuario) }}>
                                ({proyecto.rol_usuario})
                              </span>
                            </p>
                            <span className="activity-time">
                              {proyecto.programa_nombre} • {proyecto.total_actividades || 0} actividades
                            </span>
                          </div>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleProjectClick(proyecto)}
                          >
                            Ver Tablero
                          </button>
                        </div>
                      ))}
                      {misProyectos.length > 5 && (
                        <div className="view-all-projects">
                          <button 
                            className="btn btn-secondary"
                            onClick={() => setVista('proyectos')}
                          >
                            Ver todos los proyectos ({misProyectos.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de Evidencias */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Estado de Evidencias</h3>
                </div>
                <div className="card-content">
                  {evidenceStats ? (
                    <div className="evidence-stats">
                      <div className="stat-row">
                        <span className="stat-label">Aprobadas:</span>
                        <span className="stat-value success">{evidenceStats.estadisticas.aprobadas}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Pendientes:</span>
                        <span className="stat-value warning">{evidenceStats.estadisticas.pendientes}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Requieren cambios:</span>
                        <span className="stat-value error">{evidenceStats.estadisticas.requieren_cambios}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Próximas a vencer:</span>
                        <span className="stat-value warning">{evidenceStats.estadisticas.proximas_vencer}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Cargando estadísticas de evidencias...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas Recientes */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Alertas Recientes</h3>
                </div>
                <div className="card-content">
                  {alertas.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🔔</div>
                      <h4>No tienes alertas</h4>
                      <p>¡Todo al día!</p>
                    </div>
                  ) : (
                    <div className="alerts-preview">
                      {alertas.slice(0, 3).map((alerta, index) => (
                        <div key={index} className={`alert-preview-item ${alerta.tipo}`}>
                          <div className="alert-preview-content">
                            <h5>{alerta.titulo}</h5>
                            <p>{alerta.mensaje}</p>
                            <small>{formatDate(alerta.fecha_creacion)}</small>
                          </div>
                        </div>
                      ))}
                      {alertas.length > 3 && (
                        <div className="view-all-alerts">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setVista('alertas')}
                          >
                            Ver todas las alertas ({alertas.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Mis Proyectos */}
        {vista === 'proyectos' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mis Proyectos</h1>
              <p className="admin-subtitle">
                Proyectos donde estás asignado como líder o miembro del equipo
              </p>
            </div>

            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
                <button onClick={clearMessages} className="alert-close">×</button>
              </div>
            )}

            <div className="admin-content">
              {loading ? (
                <div className="loading-container">
                  <p>Cargando proyectos...</p>
                </div>
              ) : misProyectos.length === 0 ? (
                <div className="admin-card">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No tienes proyectos asignados</h3>
                    <p>Cuando te asignen a un proyecto, aparecerá aquí para que puedas gestionar las actividades.</p>
                  </div>
                </div>
              ) : (
                <div className="projects-grid">
                  {misProyectos.map((proyecto) => (
                    <div className="project-card" key={proyecto.id_proyecto}>
                      <div className="project-card-header">
                        <h3 className="project-title">{proyecto.titulo}</h3>
                        <div 
                          className="project-role-badge" 
                          style={{ backgroundColor: getRoleColor(proyecto.rol_usuario) }}
                        >
                          {getRoleIcon(proyecto.rol_usuario)}
                          {proyecto.rol_usuario}
                        </div>
                      </div>
                      <div className="project-card-body">
                        <p className="project-description">{proyecto.descripcion}</p>
                        <div className="project-meta">
                          <div className="meta-item">
                            <AiOutlineFlag />
                            <span>Programa: {proyecto.programa_nombre}</span>
                          </div>
                          <div className="meta-item">
                            <AiOutlineCalendar />
                            <span>Creado: {formatDate(proyecto.fecha_creacion)}</span>
                          </div>
                          <div className="meta-item">
                            <AiOutlineClockCircle />
                            <span>Actividades: {proyecto.total_actividades || 0}</span>
                          </div>
                        </div>
                        <div className="project-progress">
                          <div className="progress-label">
                            <span>Progreso de actividades</span>
                            <span>{proyecto.actividades_completadas || 0}/{proyecto.total_actividades || 0}</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${proyecto.total_actividades > 0 ? 
                                  ((proyecto.actividades_completadas || 0) / proyecto.total_actividades) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="project-card-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleProjectClick(proyecto)}
                        >
                          Abrir Tablero Kanban
                        </button>
                        {proyecto.rol_usuario === 'lider' && (
                          <span className="leader-badge">👑 Líder del proyecto</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista del Tablero Kanban */}
        {vista === 'kanban' && selectedProject && (
          <div className="admin-section">
            <div className="admin-header">
              <div className="header-with-back">
                <button 
                  className="btn btn-secondary"
                  onClick={handleBackToProjects}
                >
                  <AiOutlineArrowLeft /> Volver a Proyectos
                </button>
                <div>
                  <h1>{selectedProject.titulo}</h1>
                  <p className="admin-subtitle">
                    {selectedProject.programa_nombre} • Tu rol: <strong>{selectedProject.rol_usuario}</strong>
                  </p>
                </div>
              </div>
            </div>

            <KanbanBoard 
              projectId={selectedProject.id_proyecto} 
              userRole={selectedProject.rol_usuario}
            />
          </div>
        )}

        {/* Vista de Evidencias */}
        {vista === 'evidencias' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mis Evidencias</h1>
              <p className="admin-subtitle">
                Gestiona todas tus evidencias académicas
              </p>
            </div>
            <EvidenceManager selectedProject={selectedProject} />
          </div>
        )}

        {/* Vista de Perfil */}
        {vista === 'perfil' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mi Perfil</h1>
              <p className="admin-subtitle">
                Información personal y resumen de actividades académicas
              </p>
            </div>

            <div className="admin-content">
              <div className="profile-grid">
                <div className="admin-card">
                  <div className="card-header">
                    <h3>Información Personal</h3>
                  </div>
                  <div className="card-content">
                    <div className="profile-info">
                      <div className="profile-avatar-large">
                        {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                      </div>
                      <div className="profile-details">
                        <h2>{user?.nombre} {user?.apellido}</h2>
                        <p className="profile-email">{user?.email}</p>
                        <p className="profile-career">{user?.carrera}</p>
                        <p className="profile-role">Estudiante</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="card-header">
                    <h3>Mis Proyectos Activos</h3>
                  </div>
                  <div className="card-content">
                    <div className="profile-projects">
                      {misProyectos.slice(0, 4).map((proyecto, index) => (
                        <div key={index} className="profile-project-item">
                          <div className="project-info">
                            <h4>{proyecto.titulo}</h4>
                            <p>{proyecto.programa_nombre}</p>
                          </div>
                          <div 
                            className="project-badge" 
                            style={{ backgroundColor: getRoleColor(proyecto.rol_usuario) }}
                          >
                            {proyecto.rol_usuario}
                          </div>
                        </div>
                      ))}
                      {misProyectos.length === 0 && (
                        <p className="empty-text">No tienes proyectos asignados</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="card-header">
                    <h3>Estadísticas Académicas</h3>
                  </div>
                  <div className="card-content">
                    <div className="stats-summary">
                      <div className="stat-item">
                        <span className="stat-number">{stats.totalProyectos}</span>
                        <span className="stat-label">Proyectos Asignados</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.actividadesCompletadas}</span>
                        <span className="stat-label">Actividades Completadas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.evidenciasAprobadas}</span>
                        <span className="stat-label">Evidencias Aprobadas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.alertasActivas}</span>
                        <span className="stat-label">Alertas Activas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Alertas */}
        {vista === 'alertas' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Alertas</h1>
              <p className="admin-subtitle">
                Notificaciones importantes sobre tus proyectos y actividades
              </p>
            </div>

            <div className="admin-content">
              <div className="admin-card">
                <div className="card-content">
                  <div className="alerts-list">
                    {alertas.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <h3>No tienes alertas</h3>
                        <p>Cuando tengas notificaciones importantes sobre tus proyectos, aparecerán aquí.</p>
                      </div>
                    ) : (
                      alertas.map((alerta, index) => (
                        <div key={index} className={`alert-item ${alerta.tipo}`}>
                          <div className="alert-icon">
                            <AiOutlineBell />
                          </div>
                          <div className="alert-content">
                            <h4>{alerta.titulo}</h4>
                            <p>{alerta.mensaje}</p>
                            <div className="alert-time">
                              {formatDate(alerta.fecha_creacion)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
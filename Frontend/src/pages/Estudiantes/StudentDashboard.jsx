import React, { useState, useEffect } from 'react';
import {
  AiFillDashboard,
  AiFillFolder,
  AiFillProject,
  AiOutlineUser,
  AiOutlineBell,
  AiOutlineSearch,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineClockCircle,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineWarning
} from 'react-icons/ai';
import authService from '../../services/authService';
import api from '../../api/api';
import '../Admin/Admin.css';
import logo from "../../assets/log.png";

export default function StudentDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState('bienvenida');
  
  const [stats, setStats] = useState({
    totalPortafolios: 0,
    portafoliosActivos: 0,
    proximasEntregas: 0,
    totalProyectos: 0,
    proyectosEnProceso: 0,
    proyectosCompletados: 0,
    alertasActivas: 0
  });
  

  const [portafolios, setPortafolios] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  useEffect(() => {
    fetchStudentStats();
    fetchAlertas();
  }, []);

  useEffect(() => {
    if (vista === 'portafolios') {
      fetchPortafolios();
    } else if (vista === 'proyectos') {
      fetchProyectos();
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

  const fetchProyectos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/auth/student/proyectos");
      setProyectos(res.data);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
      setError("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertas = async () => {
    try {
      const res = await api.get("/auth/student/alertas");
      setAlertas(res.data);
    } catch (error) {
      console.error("Error al obtener alertas:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'borrador': return 'secondary';
      case 'revision': return 'warning';
      case 'observaciones': return 'error';
      case 'pre-aprobado': return 'info';
      case 'aprobado final': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'borrador': return <AiOutlineClockCircle />;
      case 'revision': return <AiOutlineExclamationCircle />;
      case 'observaciones': return <AiOutlineWarning />;
      case 'pre-aprobado': return <AiOutlineFlag />;
      case 'aprobado final': return <AiOutlineCheckCircle />;
      default: return <AiOutlineClockCircle />;
    }
  };

  const handlePortfolioClick = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setBreadcrumb([
      { name: 'Portafolios', action: () => { setSelectedPortfolio(null); setSelectedProgram(null); } },
      { name: portfolio.nombre, action: null }
    ]);
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setBreadcrumb([
      { name: 'Portafolios', action: () => { setSelectedPortfolio(null); setSelectedProgram(null); } },
      { name: selectedPortfolio.nombre, action: () => setSelectedProgram(null) },
      { name: program.nombre, action: null }
    ]);
  };

  const filteredProyectos = proyectos.filter(proyecto => {
    const matchesSearch = proyecto.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proyecto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || proyecto.estado?.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderBreadcrumb = () => {
    if (breadcrumb.length === 0) return null;
    
    return (
      <div className="breadcrumb">
        {breadcrumb.map((item, index) => (
          <span key={index} className="breadcrumb-item">
            {item.action ? (
              <button onClick={item.action} className="breadcrumb-link">
                {item.name}
              </button>
            ) : (
              <span className="breadcrumb-current">{item.name}</span>
            )}
            {index < breadcrumb.length - 1 && <span className="breadcrumb-separator"> / </span>}
          </span>
        ))}
      </div>
    );
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
          <button
            className={`sidebar-button${vista === 'proyectos' ? ' active' : ''}`}
            onClick={() => setVista('proyectos')}
          >
            <AiFillProject className="sidebar-icon" /> Mis Proyectos
          </button>
          <button
            className={`sidebar-button${vista === 'perfil' ? ' active' : ''}`}
            onClick={() => setVista('perfil')}
          >
            <AiOutlineUser className="sidebar-icon" /> Mi Perfil
          </button>
          <button
            className={`sidebar-button${vista === 'alertas' ? ' active' : ''}`}
            onClick={() => setVista('alertas')}
          >
            <AiOutlineBell className="sidebar-icon" /> 
            Alertas 
            {alertas.length > 0 && <span className="alert-badge">{alertas.length}</span>}
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
                  <div className="stat-label">Portafolios Asignados</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalProyectos}</div>
                  <div className="stat-label">Proyectos Totales</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.proyectosEnProceso}</div>
                  <div className="stat-label">En Progreso</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.alertasActivas}</div>
                  <div className="stat-label">Alertas Activas</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Proyectos Recientes</h3>
                </div>
                <div className="card-content">
                  <div className="activity-list">
                    {proyectos.slice(0, 5).map((proyecto, index) => (
                      <div key={index} className={`activity-item ${getStatusColor(proyecto.estado)}`}>
                        <div className="activity-dot"></div>
                        <div className="activity-content">
                          <p className="activity-message">{proyecto.titulo}</p>
                          <span className="activity-time">
                            Estado: {proyecto.estado} - {formatDate(proyecto.fecha_actualizacion)}
                          </span>
                        </div>
                        <div className="activity-status">
                          {getStatusIcon(proyecto.estado)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Alertas Recientes</h3>
                </div>
                <div className="card-content">
                  <div className="activity-list">
                    {alertas.slice(0, 5).map((alerta, index) => (
                      <div key={index} className={`activity-item ${alerta.tipo}`}>
                        <div className="activity-dot"></div>
                        <div className="activity-content">
                          <p className="activity-message">{alerta.mensaje}</p>
                          <span className="activity-time">{formatDate(alerta.fecha_creacion)}</span>
                        </div>
                      </div>
                    ))}
                    {alertas.length === 0 && (
                      <div className="empty-state">
                        <p>No tienes alertas pendientes</p>
                      </div>
                    )}
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
                Historial de portafolios por año académico
              </p>
            </div>

            {renderBreadcrumb()}

            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="admin-content">
              {!selectedPortfolio ? (
         
                <>
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
                        <div 
                          className="portfolio-card" 
                          key={portafolio.id_portafolio}
                          onClick={() => handlePortfolioClick(portafolio)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="portfolio-card-header">
                            <span className="portfolio-name">{portafolio.nombre}</span>
                            <span className="portfolio-career">{portafolio.carrera}</span>
                          </div>
                          <div className="portfolio-card-body">
                            <p className="portfolio-description">{portafolio.descripcion}</p>
                            <div className="portfolio-dates">
                              <div>
                                <span className="portfolio-label">Año:</span>{" "}
                                <span>{new Date(portafolio.fecha_inicio).getFullYear()}</span>
                              </div>
                              <div>
                                <span className="portfolio-label">Programas:</span>{" "}
                                <span>{portafolio.total_programas || 0}</span>
                              </div>
                            </div>
                            <div className="portfolio-coordinator">
                              <span className="portfolio-label">Coordinador:</span>{" "}
                              <span>
                                {portafolio.coordinador_nombre} {portafolio.coordinador_apellido}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : !selectedProgram ? (

                <div className="programs-view">
                  <div className="admin-card">
                    <div className="card-header">
                      <h3>Programas en {selectedPortfolio.nombre}</h3>
                    </div>
                    <div className="card-content">
                      <div className="portfolio-grid">
                        {selectedPortfolio.programas?.map((programa) => (
                          <div 
                            key={programa.id_programa} 
                            className="portfolio-card"
                            onClick={() => handleProgramClick(programa)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="portfolio-card-header">
                              <span className="portfolio-name">{programa.nombre}</span>
                              <span className="portfolio-career">Programa</span>
                            </div>
                            <div className="portfolio-card-body">
                              <p className="portfolio-description">{programa.descripcion}</p>
                              <div className="portfolio-dates">
                                <div>
                                  <span className="portfolio-label">Proyectos:</span>{" "}
                                  <span>{programa.total_proyectos || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="empty-state">
                            <h3>No hay programas en este portafolio</h3>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="projects-view">
                  <div className="admin-card">
                    <div className="card-header">
                      <h3>Proyectos en {selectedProgram.nombre}</h3>
                    </div>
                    <div className="card-content">
                      <div className="projects-list">
                        {selectedProgram.proyectos?.map((proyecto) => (
                          <div key={proyecto.id_proyecto} className="project-item">
                            <div className="project-header">
                              <h4>{proyecto.titulo}</h4>
                              <span className={`project-status ${getStatusColor(proyecto.estado)}`}>
                                {getStatusIcon(proyecto.estado)}
                                {proyecto.estado}
                              </span>
                            </div>
                            <p className="project-description">{proyecto.descripcion}</p>
                            <div className="project-meta">
                              <span>Inicio: {formatDate(proyecto.fecha_inicio)}</span>
                              <span>Entrega: {formatDate(proyecto.fecha_fin)}</span>
                            </div>
                          </div>
                        )) || (
                          <div className="empty-state">
                            <h3>No hay proyectos en este programa</h3>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {vista === 'proyectos' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mis Proyectos</h1>
              <p className="admin-subtitle">
                Todas las actividades y proyectos en los que participas
              </p>
            </div>


            <div className="admin-card" style={{ marginBottom: '1rem' }}>
              <div className="card-content">
                <div className="filters-section">
                  <div className="search-box">
                    <AiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar proyectos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="filter-select">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="borrador">Borrador</option>
                      <option value="revision">En Revisión</option>
                      <option value="observaciones">Con Observaciones</option>
                      <option value="pre-aprobado">Pre-aprobado</option>
                      <option value="aprobado final">Aprobado Final</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="admin-alert admin-alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="admin-content">
              {loading ? (
                <div className="loading-container">
                  <p>Cargando proyectos...</p>
                </div>
              ) : filteredProyectos.length === 0 ? (
                <div className="admin-card">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No tienes proyectos</h3>
                    <p>Cuando participes en proyectos, aparecerán aquí.</p>
                  </div>
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredProyectos.map((proyecto) => (
                    <div className="project-card" key={proyecto.id_proyecto}>
                      <div className="project-card-header">
                        <h3 className="project-title">{proyecto.titulo}</h3>
                        <span className={`project-status ${getStatusColor(proyecto.estado)}`}>
                          {getStatusIcon(proyecto.estado)}
                          {proyecto.estado}
                        </span>
                      </div>
                      <div className="project-card-body">
                        <p className="project-description">{proyecto.descripcion}</p>
                        <div className="project-meta">
                          <div className="meta-item">
                            <AiOutlineCalendar />
                            <span>Inicio: {formatDate(proyecto.fecha_inicio)}</span>
                          </div>
                          <div className="meta-item">
                            <AiOutlineFlag />
                            <span>Entrega: {formatDate(proyecto.fecha_fin)}</span>
                          </div>
                          <div className="meta-item">
                            <AiFillFolder />
                            <span>Programa: {proyecto.programa_nombre}</span>
                          </div>
                        </div>
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${proyecto.progreso || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{proyecto.progreso || 0}%</span>
                        </div>
                      </div>
                      <div className="project-card-actions">
                        <button className="btn btn-primary">
                          Ver Detalles
                        </button>
                        {proyecto.estado === 'borrador' && (
                          <button className="btn btn-secondary">
                            Continuar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {vista === 'perfil' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Mi Perfil</h1>
              <p className="admin-subtitle">
                Información personal y resumen de actividades
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
                    <h3>Mis Proyectos en Perfil</h3>
                  </div>
                  <div className="card-content">
                    <div className="profile-projects">
                      {proyectos.slice(0, 3).map((proyecto, index) => (
                        <div key={index} className="profile-project-item">
                          <div className="project-info">
                            <h4>{proyecto.titulo}</h4>
                            <p>{proyecto.programa_nombre}</p>
                          </div>
                          <div className={`project-badge ${getStatusColor(proyecto.estado)}`}>
                            {proyecto.estado}
                          </div>
                        </div>
                      ))}
                      {proyectos.length === 0 && (
                        <p className="empty-text">No tienes proyectos asignados</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="card-header">
                    <h3>Estadísticas</h3>
                  </div>
                  <div className="card-content">
                    <div className="stats-summary">
                      <div className="stat-item">
                        <span className="stat-number">{stats.totalProyectos}</span>
                        <span className="stat-label">Proyectos Totales</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.proyectosCompletados}</span>
                        <span className="stat-label">Completados</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.proyectosEnProceso}</span>
                        <span className="stat-label">En Proceso</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {vista === 'alertas' && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>Sistema de Alertas</h1>
              <p className="admin-subtitle">
                Notificaciones y alertas de tus proyectos
              </p>
            </div>

            <div className="admin-content">
              <div className="admin-card">
                <div className="card-header">
                  <h3>Alertas Activas</h3>
                </div>
                <div className="card-content">
                  <div className="alerts-list">
                    {alertas.map((alerta, index) => (
                      <div key={index} className={`alert-item ${alerta.tipo}`}>
                        <div className="alert-icon">
                          {alerta.tipo === 'warning' && <AiOutlineWarning />}
                          {alerta.tipo === 'info' && <AiOutlineExclamationCircle />}
                          {alerta.tipo === 'error' && <AiOutlineClockCircle />}
                        </div>
                        <div className="alert-content">
                          <h4>{alerta.titulo}</h4>
                          <p>{alerta.mensaje}</p>
                          <span className="alert-time">
                            {formatDate(alerta.fecha_creacion)}
                          </span>
                        </div>
                        <div className="alert-actions">
                          <button className="btn btn-sm btn-primary">
                            Ver Proyecto
                          </button>
                        </div>
                      </div>
                    ))}
                    {alertas.length === 0 && (
                      <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <h3>No tienes alertas</h3>
                        <p>Cuando haya notificaciones importantes, aparecerán aquí.</p>
                      </div>
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
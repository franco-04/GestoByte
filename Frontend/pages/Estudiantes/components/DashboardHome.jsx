import React from 'react';
import {
  AiOutlineTrophy,
  AiOutlineTeam,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineClockCircle
} from 'react-icons/ai';

const DashboardHome = ({ 
  user, 
  stats, 
  misProyectos, 
  evidenceStats, 
  alertas, 
  loading, 
  onProjectClick, 
  onViewProjects, 
  onViewAlertas,
  formatDate 
}) => {
  
  const getRoleIcon = (rol) => {
    return rol === 'lider' ? <AiOutlineTrophy /> : <AiOutlineTeam />;
  };

  const getRoleColor = (rol) => {
    return rol === 'lider' ? '#f59e0b' : '#3b82f6';
  };

  return (
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
                      onClick={() => onProjectClick(proyecto)}
                    >
                      Ver Tablero
                    </button>
                  </div>
                ))}
                {misProyectos.length > 5 && (
                  <div className="view-all-projects">
                    <button 
                      className="btn btn-secondary"
                      onClick={onViewProjects}
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
                        <span className="stat-value success">
                        {evidenceStats.estadisticas.aprobadas}
                        <small> (Gen: {evidenceStats.estadisticas.por_tipo.generales.aprobadas}, Act: {evidenceStats.estadisticas.por_tipo.actividades.aprobadas})</small>
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Pendientes:</span>
                        <span className="stat-value warning">
                        {evidenceStats.estadisticas.pendientes}
                        <small> (Gen: {evidenceStats.estadisticas.por_tipo.generales.pendientes}, Act: {evidenceStats.estadisticas.por_tipo.actividades.pendientes})</small>
                        </span>
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
                      onClick={onViewAlertas}
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
  );
};

export default DashboardHome;
import React from 'react';
import {
  AiOutlineTrophy,
  AiOutlineTeam,
  AiOutlineFlag,
  AiOutlineCalendar,
  AiOutlineClockCircle
} from 'react-icons/ai';

const ProjectsList = ({ 
  misProyectos, 
  loading, 
  onProjectClick, 
  formatDate 
}) => {
  
  const getRoleIcon = (rol) => {
    return rol === 'lider' ? <AiOutlineTrophy /> : <AiOutlineTeam />;
  };

  const getRoleColor = (rol) => {
    return rol === 'lider' ? '#f59e0b' : '#3b82f6';
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Mis Proyectos</h1>
        <p className="admin-subtitle">
          Proyectos donde estás asignado como líder o miembro del equipo
        </p>
      </div>

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
                    onClick={() => onProjectClick(proyecto)}
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
  );
};

export default ProjectsList;
import React, { useState, useEffect } from 'react';
import {
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineFile,
  AiOutlineLink,
  AiOutlineDownload,
  AiOutlineUpload,
  AiOutlineComment,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineEye,
  AiOutlineClockCircle,
  AiOutlineWarning
} from 'react-icons/ai';
import api from '../api/api';

const KanbanBoard = ({ projectId, userRole }) => {
  const [activities, setActivities] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEvidenceListModal, setShowEvidenceListModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [evidences, setEvidences] = useState([]);

  // Estados para formularios
  const [newActivity, setNewActivity] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fecha_inicio: '',
    fecha_limite: '',
    asignados: []
  });

  const [newEvidence, setNewEvidence] = useState({
    titulo: '',
    descripcion: '',
    archivo: null,
    url_externa: ''
  });

  const estados = [
    { key: 'pendiente', label: 'Por Hacer', color: '#f59e0b' },
    { key: 'en_progreso', label: 'En Progreso', color: '#3b82f6' },
    { key: 'revision', label: 'En Revisión', color: '#8b5cf6' },
    { key: 'completado', label: 'Completado', color: '#10b981' }
  ];

  const prioridades = {
    'baja': { color: '#6b7280', icon: '🔵' },
    'media': { color: '#f59e0b', icon: '🟡' },
    'alta': { color: '#ef4444', icon: '🔴' },
    'critica': { color: '#dc2626', icon: '🚨' }
  };

  useEffect(() => {
    if (projectId) {
      fetchActivities();
      if (userRole === 'lider') {
        fetchProjectMembers();
      }
    }
  }, [projectId, userRole]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/activities/project/${projectId}`);
      setActivities(res.data.actividades || []);
    } catch (error) {
      setError("Error al cargar actividades");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const res = await api.get(`/auth/activities/project/${projectId}/members`);
      setProjectMembers(res.data);
    } catch (error) {
      console.error("Error al cargar miembros:", error);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/auth/activities/project/${projectId}`, newActivity);
      setSuccess("Actividad creada correctamente");
      setShowCreateModal(false);
      resetNewActivity();
      fetchActivities();
    } catch (error) {
      setError(error.response?.data?.error || "Error al crear actividad");
    }
  };

  const handleStatusChange = async (activityId, newStatus, comment = "") => {
    try {
      await api.put(`/auth/activities/${activityId}/status`, {
        estado: newStatus,
        comentario: comment
      });
      setSuccess("Estado actualizado correctamente");
      fetchActivities();
    } catch (error) {
      setError(error.response?.data?.error || "Error al actualizar estado");
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const formData = new FormData();
    formData.append('titulo', newEvidence.titulo);
    formData.append('descripcion', newEvidence.descripcion);
    
    if (newEvidence.archivo) {
      formData.append('archivo', newEvidence.archivo);
    } else if (newEvidence.url_externa) {
      formData.append('url_externa', newEvidence.url_externa);
    } else {
      setError("Debe proporcionar un archivo o una URL");
      return;
    }

    try {
      await api.post(`/auth/activities/${selectedActivity.id_actividad}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess("Evidencia subida correctamente");
      setShowEvidenceModal(false);
      resetNewEvidence();
      fetchActivities();
    } catch (error) {
      setError(error.response?.data?.error || "Error al subir evidencia");
    }
  };

  const handleViewEvidences = async (activity) => {
    try {
      const res = await api.get(`/auth/activities/${activity.id_actividad}/evidences`);
      setEvidences(res.data);
      setSelectedActivity(activity);
      setShowEvidenceListModal(true);
    } catch (error) {
      setError("Error al cargar evidencias");
    }
  };

  const handleDownloadEvidence = async (evidenceId, fileName) => {
    try {
      const response = await api.get(`/auth/activities/evidence/${evidenceId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError("Error al descargar archivo");
    }
  };

  const resetNewActivity = () => {
    setNewActivity({
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fecha_inicio: '',
      fecha_limite: '',
      asignados: []
    });
  };

  const resetNewEvidence = () => {
    setNewEvidence({
      titulo: '',
      descripcion: '',
      archivo: null,
      url_externa: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getActivityColorByState = (estado) => {
    const estadoObj = estados.find(e => e.key === estado);
    return estadoObj ? estadoObj.color : '#6b7280';
  };

  const canEditActivity = (activity) => {
    return userRole === 'lider' || activity.puede_editar;
  };

  const canUploadEvidence = (activity) => {
    return activity.puede_subir_evidencia;
  };

  const groupedActivities = estados.reduce((acc, estado) => {
    acc[estado.key] = activities.filter(activity => activity.estado === estado.key);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-kanban">
        <p>Cargando tablero Kanban...</p>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {/* Header */}
      <div className="kanban-header">
        <div className="kanban-title">
          <h2>Tablero de Actividades</h2>
          <p>Gestiona las tareas y actividades del proyecto</p>
        </div>
        {userRole === 'lider' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <AiOutlinePlus /> Nueva Actividad
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="alert-close">×</button>
        </div>
      )}

      {/* Tablero Kanban */}
      <div className="kanban-columns">
        {estados.map((estado) => (
          <div key={estado.key} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: estado.color }}>
              <h3>{estado.label}</h3>
              <span className="activity-count">
                {groupedActivities[estado.key]?.length || 0}
              </span>
            </div>
            
            <div className="column-content">
              {groupedActivities[estado.key]?.map((activity) => (
                <div key={activity.id_actividad} className="activity-card" data-priority={activity.prioridad}>
                  <div className="activity-header">
                    <h4 className="activity-title">{activity.titulo}</h4>
                    <div className="activity-priority" title={`Prioridad: ${activity.prioridad}`}>
                      {prioridades[activity.prioridad]?.icon}
                    </div>
                  </div>
                  
                  {activity.descripcion && (
                    <p className="activity-description">{activity.descripcion}</p>
                  )}
                  
                  <div className="activity-meta">
                    {activity.fecha_limite && (
                      <div className={`meta-item ${isOverdue(activity.fecha_limite) ? 'overdue' : ''}`}>
                        <AiOutlineCalendar />
                        <span>{formatDate(activity.fecha_limite)}</span>
                      </div>
                    )}
                    
                    {activity.asignados && activity.asignados.length > 0 && (
                      <div className="meta-item">
                        <AiOutlineUser />
                        <span>{activity.asignados.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="activity-stats">
                    {activity.total_evidencias > 0 && (
                      <span className="stat-badge evidences" title="Evidencias">
                        <AiOutlineFile /> {activity.total_evidencias}
                      </span>
                    )}
                    {activity.total_comentarios > 0 && (
                      <span className="stat-badge comments" title="Comentarios">
                        <AiOutlineComment /> {activity.total_comentarios}
                      </span>
                    )}
                  </div>
                  
                  <div className="activity-actions">
                    <div className="action-buttons">
                      {canUploadEvidence(activity) && (
                        <button 
                          className="btn-icon btn-primary"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowEvidenceModal(true);
                          }}
                          title="Subir evidencia"
                        >
                          <AiOutlineUpload />
                        </button>
                      )}
                      
                      {activity.total_evidencias > 0 && (
                        <button 
                          className="btn-icon btn-secondary"
                          onClick={() => handleViewEvidences(activity)}
                          title="Ver evidencias"
                        >
                          <AiOutlineEye />
                        </button>
                      )}
                    </div>
                    
                    {canEditActivity(activity) && activity.estado !== 'completado' && (
                      <div className="status-controls">
                        {activity.estado === 'pendiente' && (
                          <button 
                            className="btn-icon btn-info"
                            onClick={() => handleStatusChange(activity.id_actividad, 'en_progreso')}
                            title="Iniciar"
                          >
                            <AiOutlineFlag />
                          </button>
                        )}
                        
                        {activity.estado === 'en_progreso' && (
                          <button 
                            className="btn-icon btn-warning"
                            onClick={() => handleStatusChange(activity.id_actividad, 'revision')}
                            title="Enviar a revisión"
                          >
                            <AiOutlineEye />
                          </button>
                        )}
                        
                        {(activity.estado === 'revision' && userRole === 'lider') && (
                          <>
                            <button 
                              className="btn-icon btn-success"
                              onClick={() => handleStatusChange(activity.id_actividad, 'completado')}
                              title="Aprobar"
                            >
                              <AiOutlineCheck />
                            </button>
                            <button 
                              className="btn-icon btn-danger"
                              onClick={() => handleStatusChange(activity.id_actividad, 'en_progreso', 'Requiere correcciones')}
                              title="Rechazar"
                            >
                              <AiOutlineClose />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {activity.estado === 'completado' && (
                    <div className="completion-badge">
                      <AiOutlineCheck /> Completado
                    </div>
                  )}
                </div>
              ))}
              
              {groupedActivities[estado.key]?.length === 0 && (
                <div className="empty-column">
                  <p>No hay actividades en {estado.label.toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear actividad */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Nueva Actividad</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateActivity} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newActivity.titulo}
                    onChange={(e) => setNewActivity({...newActivity, titulo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select
                    className="form-select"
                    value={newActivity.prioridad}
                    onChange={(e) => setNewActivity({...newActivity, prioridad: e.target.value})}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={newActivity.descripcion}
                    onChange={(e) => setNewActivity({...newActivity, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha de inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newActivity.fecha_inicio}
                    onChange={(e) => setNewActivity({...newActivity, fecha_inicio: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newActivity.fecha_limite}
                    onChange={(e) => setNewActivity({...newActivity, fecha_limite: e.target.value})}
                  />
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Asignar a</label>
                  <select
                    multiple
                    className="form-select form-select-multiple"
                    value={newActivity.asignados}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setNewActivity({...newActivity, asignados: values});
                    }}
                  >
                    {projectMembers.map(member => (
                      <option key={member.id_usuario} value={member.id_usuario}>
                        {member.nombre} {member.apellido} ({member.rol})
                      </option>
                    ))}
                  </select>
                  <div className="form-help-text">
                    Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <AiOutlinePlus /> Crear Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para subir evidencia */}
      {showEvidenceModal && selectedActivity && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Subir Evidencia - {selectedActivity.titulo}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEvidenceModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUploadEvidence} className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEvidence.titulo}
                    onChange={(e) => setNewEvidence({...newEvidence, titulo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={newEvidence.descripcion}
                    onChange={(e) => setNewEvidence({...newEvidence, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Archivo</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setNewEvidence({...newEvidence, archivo: e.target.files[0], url_externa: ''})}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.txt"
                  />
                  <div className="form-help-text">
                    O ingresa una URL externa (GitHub, Drive, etc.)
                  </div>
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">URL Externa</label>
                  <input
                    type="url"
                    className="form-input"
                    value={newEvidence.url_externa}
                    onChange={(e) => setNewEvidence({...newEvidence, url_externa: e.target.value, archivo: null})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEvidenceModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <AiOutlineUpload /> Subir Evidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver evidencias */}
      {showEvidenceListModal && selectedActivity && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Evidencias - {selectedActivity.titulo}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEvidenceListModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {evidences.length === 0 ? (
                <div className="empty-state">
                  <p>No hay evidencias para esta actividad</p>
                </div>
              ) : (
                <div className="evidences-list">
                  {evidences.map((evidence) => (
                    <div key={evidence.id_evidencia} className="evidence-item">
                      <div className="evidence-header">
                        <div className="evidence-info">
                          <h4>{evidence.titulo}</h4>
                          <p>Por: {evidence.usuario_nombre} {evidence.usuario_apellido}</p>
                        </div>
                        <div className={`evidence-status ${evidence.estado_revision}`}>
                          {evidence.estado_revision}
                        </div>
                      </div>
                      
                      {evidence.descripcion && (
                        <p className="evidence-description">{evidence.descripcion}</p>
                      )}
                      
                      <div className="evidence-actions">
                        {evidence.tipo_archivo !== 'link' && (
                          <button 
                            className="btn-icon"
                            onClick={() => handleDownloadEvidence(evidence.id_evidencia, evidence.nombre_archivo)}
                            title="Descargar"
                          >
                            <AiOutlineDownload />
                          </button>
                        )}
                        
                        {evidence.tipo_archivo === 'link' && (
                          <a 
                            href={evidence.url_externa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon"
                            title="Abrir link"
                          >
                            <AiOutlineLink />
                          </a>
                        )}
                      </div>
                      
                      <div className="evidence-meta">
                        <small>Subido: {formatDate(evidence.fecha_subida)}</small>
                        {evidence.fecha_revision && (
                          <small>Revisado: {formatDate(evidence.fecha_revision)}</small>
                        )}
                      </div>
                      
                      {evidence.comentarios_revision && (
                        <div className="evidence-comments">
                          <strong>Comentarios del revisor:</strong>
                          <p>{evidence.comentarios_revision}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
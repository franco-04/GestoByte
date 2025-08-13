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
  AiOutlineWarning,
  AiOutlineTrophy
} from 'react-icons/ai';
import api from '../api/api';

import EvidenceReviewModal from '../components/Evidence/EvidenceReviewModal';
import EvidenceReturnsHistory from '../components/Evidence/EvidenceReturnsHistory';

import './KanbanBoard.css';

const KanbanBoard = ({
  projectId,
  userRole = 'estudiante',
  apiEndpoint = null // Nueva prop para endpoint personalizado
}) => {
  const [activities, setActivities] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEvidenceListModal, setShowEvidenceListModal] = useState(false);
  const [showActivityDetailModal, setShowActivityDetailModal] = useState(false); // Nuevo modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [evidences, setEvidences] = useState([]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReturnsHistory, setShowReturnsHistory] = useState(false);
  const [selectedEvidenceForReview, setSelectedEvidenceForReview] = useState(null);
  const [selectedEvidenceForHistory, setSelectedEvidenceForHistory] = useState(null);
  // Agregar estos estados
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState(null);


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

const downloadActivityEvidence = async (id_evidencia) => {
  try {
    const response = await api.get(`/auth/activities/evidence/${id_evidencia}/download`, {
      responseType: 'blob'
    });
    
    // Obtener el nombre del archivo del header Content-Disposition si existe
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'evidencia.pdf';
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }
    
    // Crear blob y descargar
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error al descargar evidencia original:', error);
    setError('Error al descargar el archivo original');
  }
};

  useEffect(() => {
    if (projectId) {
      fetchActivities();
      // Cargar miembros si es líder o coordinador
      if (userRole === 'lider' || userRole === 'coordinador') {
        fetchProjectMembers();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userRole]);

  // MODIFICADO: Usar endpoint personalizado si existe
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const endpoint = apiEndpoint || `/auth/activities/project/${projectId}`;
      console.log('🔍 Fetching activities from:', endpoint);
      const res = await api.get(endpoint);
      setActivities(res.data.actividades || []);
    } catch (error) {
      setError("Error al cargar actividades");
      console.error('Error fetching activities:', error);
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
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError("Error al cargar evidencias");
    }
  };

  // NUEVA FUNCIÓN: Ver detalles completos de la actividad
  const handleViewActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setShowActivityDetailModal(true);
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
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setError("Error al descargar archivo");
    }
  };


  const handleViewApprovalSignature = async (evidencia) => {
    try {
      const response = await api.get(`/auth/activities/evidence/${evidencia.id_evidencia}/signature`);
      setSelectedSignature(response.data);
      setShowSignatureModal(true);
    } catch (error) {
      console.error('Error al obtener firma:', error);
      setError('Error al cargar la firma de aprobación');
    }
  };

  // FUNCIÓN MODIFICADA con logs para debug
  const _handleChangeEvidenceStatus = async (id_evidencia, nuevoEstado) => {
    try {
      setLoading(true);
      await api.put(`/auth/activities/evidence/${id_evidencia}/status`, {
        estado: nuevoEstado
      });

      setSuccess("Estado de evidencia actualizado correctamente");
      fetchActivities(); // Recargar actividades
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setError("Error al cambiar estado de evidencia: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('es-ES');
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // MODIFICADO: Permisos mejorados según el rol
  const canEditActivity = (activity) => {
    if (userRole === 'coordinador') return true; // Coordinadores pueden editar todo
    if (userRole === 'lider') return true; // Líderes pueden editar todo
    return activity.puede_editar; // Estudiantes según su asignación
  };

  const canCreateActivities = () => {
    return userRole === 'coordinador' || userRole === 'lider';
  };

  const canUploadEvidence = (activity) => {
    if (userRole === 'coordinador') return false; // Coordinadores no suben evidencias
    return activity.puede_subir_evidencia;
  };



  // Verificar si puede aprobar evidencias

  const canApproveActivities = () => {
    return userRole === 'coordinador' || userRole === 'lider';
  };

  // NUEVA FUNCIÓN: Obtener el icono del rol
  const getRoleIcon = (rol) => {
    return rol === 'lider' ? <AiOutlineTrophy style={{ color: '#f59e0b' }} /> : <AiOutlineUser />;
  };

  const handleReviewEvidence = (evidencia) => {
    console.log('📋 Evidencia seleccionada para revisar:', evidencia);
    setSelectedEvidenceForReview(evidencia);
    setShowReviewModal(true);
  };

  // Función para ver historial de devoluciones (estudiantes)
  const handleViewReturnsHistory = (evidencia) => {
    setSelectedEvidenceForHistory(evidencia);
    setShowReturnsHistory(true);
  };

  // Función para cerrar modales
  const handleCloseModals = () => {
    setShowReviewModal(false);
    setShowReturnsHistory(false);
    setSelectedEvidenceForReview(null);
    setSelectedEvidenceForHistory(null);
  };

  // Función para completar revisión y recargar datos
  const handleReviewComplete = () => {
    fetchActivities(); // Recargar actividades
    setSuccess('Evidencia revisada correctamente');
  };

  const downloadSignedDocument = async (id_evidencia) => {
    try {
      console.log('🔽 Descargando documento firmado:', id_evidencia);
      
      const response = await api.get(`/auth/activities/evidence/${id_evidencia}/download-signed`, {
        responseType: 'blob'
      });
  
      // Extraer el nombre del archivo del header Content-Disposition
      let fileName = 'documento_firmado.pdf'; // fallback
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }
  
      console.log('📄 Descargando documento firmado como:', fileName);
  
      // Crear blob y descargar con el nombre correcto
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Usar el nombre del servidor
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
  
    } catch (error) {
      console.error('Error al descargar documento firmado:', error);
      setError('Error al descargar el documento firmado');
    }
  };

  const renderEvidenceActions = (evidencia) => {
    if (userRole === 'coordinador') {
      return (
        <div className="evidence-actions">
          <button
            className="btn-review"
            onClick={() => handleReviewEvidence(evidencia)}
            title="Revisar evidencia"
          >
            👁️ Revisar
          </button>
          {evidencia.archivo_firmado_ruta && (
            <button
              className="btn-download-signed"
              onClick={() => downloadSignedDocument(evidencia.id_evidencia)}
              title="Descargar documento firmado"
            >
              📄 Firmado
            </button>
          )}
        </div>
      );
    } else {
      // Vista para estudiantes
      return (
        <div className="evidence-actions">
          <button
            className="btn-download"
            onClick={() => downloadActivityEvidence(evidencia.id_evidencia)}
            title="Descargar mi evidencia"
          >
            📥 Descargar
          </button>

          {/* Botón para ver historial siempre disponible */}
          <button
            className="btn-history"
            onClick={() => handleViewReturnsHistory(evidencia)}
            title="Ver historial de revisiones"
          >
            📋 Historial {evidencia.numero_devoluciones > 0 ? `(${evidencia.numero_devoluciones})` : ''}
          </button>

          {/* Mostrar firma si está aprobado */}
          {evidencia.estado_revision === 'aprobado' && (
            <button
              className="btn-view-signature"
              onClick={() => handleViewApprovalSignature(evidencia)}
              title="Ver firma de aprobación"
            >
              ✍️ Ver Firma
            </button>
          )}

        </div>
      );
    }
  };

  const getEstadoBadge = (estado, devoluciones) => {
    switch (estado) {
      case 'aprobado':
        return <span className="status-badge approved">✅ Aprobado</span>;
      case 'devuelto':
        return <span className="status-badge returned">↩️ Devuelto ({devoluciones})</span>;
      case 'rechazado_final':
        return <span className="status-badge rejected">❌ Rechazado</span>;
      case 'revision':
        return <span className="status-badge reviewing">👀 En Revisión</span>;
      default:
        return <span className="status-badge pending">⏳ Pendiente</span>;
    }
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
      {/* Header mejorado */}
      <div className="kanban-header">
        <div className="kanban-title">
          <h2>
            Tablero de Actividades
            {userRole === 'coordinador' && <span className="coordinator-badge">👑 Vista Coordinador</span>}
          </h2>
          <p>
            {userRole === 'coordinador'
              ? 'Supervisión y gestión de actividades del proyecto'
              : 'Gestiona las tareas y actividades del proyecto'
            }
          </p>
        </div>
        {canCreateActivities() && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <AiOutlinePlus /> Nueva Actividad
          </button>
        )}
      </div>

      {/* Estadísticas rápidas para coordinadores */}
      {userRole === 'coordinador' && activities.length > 0 && (
        <div className="kanban-stats">
          <div className="stat-item">
            <span className="stat-number">{activities.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{activities.filter(a => a.estado === 'completado').length}</span>
            <span className="stat-label">Completadas</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{activities.filter(a => a.estado === 'en_progreso').length}</span>
            <span className="stat-label">En Progreso</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{activities.filter(a => a.fecha_limite && isOverdue(a.fecha_limite)).length}</span>
            <span className="stat-label">Vencidas</span>
          </div>
        </div>
      )}

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
                        {isOverdue(activity.fecha_limite) && <AiOutlineWarning style={{ color: '#ef4444' }} />}
                      </div>
                    )}

                    {activity.asignados && activity.asignados.length > 0 && (
                      <div className="meta-item">
                        <AiOutlineUser />
                        <span title={activity.asignados.join(', ')}>
                          {activity.asignados.length > 1
                            ? `${activity.asignados[0]} +${activity.asignados.length - 1}`
                            : activity.asignados[0]
                          }
                        </span>
                      </div>
                    )}

                    {/* NUEVO: Mostrar creador para coordinadores */}
                    {userRole === 'coordinador' && activity.creador_nombre && (
                      <div className="meta-item creator">
                        <span className="creator-label">Creado por:</span>
                        <span>{activity.creador_nombre} {activity.creador_apellido}</span>
                      </div>
                    )}
                  </div>

                  <div className="activity-stats">
                    {activity.total_evidencias > 0 && (
                      <span className="stat-badge evidences" title="Evidencias">
                        <AiOutlineFile /> {activity.evidencias_aprobadas || 0}/{activity.total_evidencias}
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
                      {/* NUEVO: Botón de detalle para coordinadores */}
                      {userRole === 'coordinador' && (
                        <button
                          className="btn-icon btn-info"
                          onClick={() => handleViewActivityDetail(activity)}
                          title="Ver detalles completos"
                        >
                          <AiOutlineEye />
                        </button>
                      )}

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
                          <AiOutlineFile />
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

                        {(activity.estado === 'revision' && canApproveActivities()) && (
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

      {/* NUEVO: Modal de detalle de actividad para coordinadores */}
      {showActivityDetailModal && selectedActivity && userRole === 'coordinador' && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Detalles de Actividad - {selectedActivity.titulo}</h3>
              <button
                className="modal-close"
                onClick={() => setShowActivityDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="activity-detail-content">
                <div className="detail-section">
                  <h4>Información General</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Estado:</label>
                      <span className={`status-badge ${selectedActivity.estado}`}>
                        {estados.find(e => e.key === selectedActivity.estado)?.label}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Prioridad:</label>
                      <span style={{ color: prioridades[selectedActivity.prioridad]?.color }}>
                        {prioridades[selectedActivity.prioridad]?.icon} {selectedActivity.prioridad.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Creado por:</label>
                      <span>{selectedActivity.creador_nombre} {selectedActivity.creador_apellido}</span>
                    </div>
                    <div className="detail-item">
                      <label>Fecha creación:</label>
                      <span>{formatDateTime(selectedActivity.fecha_creacion)}</span>
                    </div>
                    {selectedActivity.fecha_inicio && (
                      <div className="detail-item">
                        <label>Fecha inicio:</label>
                        <span>{formatDate(selectedActivity.fecha_inicio)}</span>
                      </div>
                    )}
                    {selectedActivity.fecha_limite && (
                      <div className="detail-item">
                        <label>Fecha límite:</label>
                        <span className={isOverdue(selectedActivity.fecha_limite) ? 'overdue' : ''}>
                          {formatDate(selectedActivity.fecha_limite)}
                          {isOverdue(selectedActivity.fecha_limite) && ' (VENCIDA)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedActivity.descripcion && (
                  <div className="detail-section">
                    <h4>Descripción</h4>
                    <p>{selectedActivity.descripcion}</p>
                  </div>
                )}

                {selectedActivity.asignados && selectedActivity.asignados.length > 0 && (
                  <div className="detail-section">
                    <h4>Asignados ({selectedActivity.asignados.length})</h4>
                    <div className="assignees-list">
                      {selectedActivity.asignados.map((asignado, index) => (
                        <div key={index} className="assignee-item">
                          <AiOutlineUser />
                          <span>{asignado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Estadísticas</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{selectedActivity.total_evidencias || 0}</span>
                      <span className="stat-label">Evidencias</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{selectedActivity.evidencias_aprobadas || 0}</span>
                      <span className="stat-label">Aprobadas</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{selectedActivity.total_comentarios || 0}</span>
                      <span className="stat-label">Comentarios</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                {selectedActivity.total_evidencias > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowActivityDetailModal(false);
                      handleViewEvidences(selectedActivity);
                    }}
                  >
                    Ver Evidencias
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => setShowActivityDetailModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear actividad - Sin cambios */}
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
                    onChange={(e) => setNewActivity({ ...newActivity, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select
                    className="form-select"
                    value={newActivity.prioridad}
                    onChange={(e) => setNewActivity({ ...newActivity, prioridad: e.target.value })}
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
                    onChange={(e) => setNewActivity({ ...newActivity, descripcion: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newActivity.fecha_inicio}
                    onChange={(e) => setNewActivity({ ...newActivity, fecha_inicio: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newActivity.fecha_limite}
                    onChange={(e) => setNewActivity({ ...newActivity, fecha_limite: e.target.value })}
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
                      setNewActivity({ ...newActivity, asignados: values });
                    }}
                  >
                    {projectMembers.map(member => (
                      <option key={member.id_usuario} value={member.id_usuario}>
                        {getRoleIcon(member.rol)} {member.nombre} {member.apellido} ({member.rol})
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

      {/* Resto de modales sin cambios... */}
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
                    onChange={(e) => setNewEvidence({ ...newEvidence, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={newEvidence.descripcion}
                    onChange={(e) => setNewEvidence({ ...newEvidence, descripcion: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Archivo</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setNewEvidence({ ...newEvidence, archivo: e.target.files[0], url_externa: '' })}
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
                    onChange={(e) => setNewEvidence({ ...newEvidence, url_externa: e.target.value, archivo: null })}
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
                          <div className="evidence-meta">
                            <span className="evidence-date">
                              📅 {new Date(evidence.fecha_subida).toLocaleDateString('es-ES')}
                            </span>
                            {evidence.numero_devoluciones > 0 && (
                              <span className="return-count">
                                ↩️ Devoluciones: {evidence.numero_devoluciones}
                              </span>
                            )}
                          </div>
                        </div>
                        {getEstadoBadge(evidence.estado_revision, evidence.numero_devoluciones)}
                      </div>

                      {evidence.descripcion && (
                        <p className="evidence-description">{evidence.descripcion}</p>
                      )}

                      {evidence.comentarios_revision && (
                        <div className="evidence-comments">
                          <strong>Comentarios del coordinador:</strong>
                          <p>{evidence.comentarios_revision}</p>
                          {evidence.revisor_nombre && (
                            <small>- {evidence.revisor_nombre} {evidence.revisor_apellido}</small>
                          )}
                        </div>
                      )}

                      {/* USAR LA NUEVA FUNCIÓN DE ACCIONES */}
                      {renderEvidenceActions(evidence)}

                      <div className="evidence-meta">
                        <small>Subido: {formatDate(evidence.fecha_subida)}</small>
                        {evidence.fecha_revision && (
                          <small>Revisado: {formatDate(evidence.fecha_revision)}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      )}

      {/* Modales de Evidencias */}
      {showReviewModal && selectedEvidenceForReview && (
        <EvidenceReviewModal
          evidencia={selectedEvidenceForReview}
          onClose={handleCloseModals}
          onReviewComplete={handleReviewComplete}
        />
      )}

      {showReturnsHistory && selectedEvidenceForHistory && (
        <EvidenceReturnsHistory
          evidencia={selectedEvidenceForHistory}
          onClose={handleCloseModals}
        />
      )}
      {showSignatureModal && selectedSignature && (
        <SignatureViewModal
          signature={selectedSignature}
          onClose={() => {
            setShowSignatureModal(false);
            setSelectedSignature(null);
          }}
        />
      )}

    </div>

  );

};



const SignatureViewModal = ({ signature, onClose }) => {
  if (!signature) return null;

  return (
    <div className="signature-view-overlay">
      <div className="signature-view-modal">
        <div className="modal-header">
          <h3>Firma de Aprobación</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="signature-content">
          <img
            src={signature.firma_coordinador}
            alt="Firma del coordinador"
            className="signature-image"
          />
          <div className="signature-info">
            <p><strong>Coordinador:</strong> {signature.coordinador_nombre} {signature.coordinador_apellido}</p>
            <p><strong>Fecha:</strong> {new Date(signature.fecha_firma).toLocaleString('es-ES')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
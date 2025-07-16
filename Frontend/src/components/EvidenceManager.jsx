
import React, { useState, useEffect } from 'react';
import {
  AiOutlineUpload,
  AiOutlineFile,
  AiOutlineLink,
  AiOutlineDownload,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineEye,
  AiOutlineHistory,
  AiOutlineComment,
  AiOutlineCalendar,
  AiOutlineCheck,
  AiOutlineWarning,
  AiOutlineClose,
  AiOutlinePlus,
  AiOutlineSearch,
  AiOutlineFilter
} from 'react-icons/ai';
import api from '../api/api';

const EvidenceManager = ({ selectedProject = null }) => {
  const [evidencias, setEvidencias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Estados para formularios
  const [uploadForm, setUploadForm] = useState({
    titulo: '',
    descripcion: '',
    categoria_evidencia: '',
    fecha_limite: '',
    es_entrega_final: false,
    archivo: null
  });
  
  const [linkForm, setLinkForm] = useState({
    titulo: '',
    descripcion: '',
    url_externa: '',
    categoria_evidencia: '',
    fecha_limite: '',
    es_entrega_final: false
  });
  
  // Estados para vista de detalles
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("fecha_subida");

  useEffect(() => {
    fetchEvidencias();
    fetchCategorias();
  }, [selectedProject]);

  const fetchEvidencias = async () => {
    setLoading(true);
    try {
      const url = selectedProject 
        ? `/auth/student/evidencias/proyecto/${selectedProject.id_proyecto}`
        : '/auth/student/evidencias/todas';
      const res = await api.get(url);
      setEvidencias(res.data);
    } catch (error) {
      setError("Error al cargar evidencias");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/auth/student/evidencias/categorias');
      setCategorias(res.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.archivo || !selectedProject) {
      setError("Selecciona un archivo y proyecto");
      return;
    }

    const formData = new FormData();
    formData.append('archivo', uploadForm.archivo);
    formData.append('id_proyecto', selectedProject.id_proyecto);
    formData.append('titulo', uploadForm.titulo);
    formData.append('descripcion', uploadForm.descripcion);
    formData.append('categoria_evidencia', uploadForm.categoria_evidencia);
    formData.append('fecha_limite', uploadForm.fecha_limite);
    formData.append('es_entrega_final', uploadForm.es_entrega_final);

    try {
      await api.post('/auth/student/evidencias/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess("Evidencia subida correctamente");
      setShowUploadModal(false);
      resetUploadForm();
      fetchEvidencias();
    } catch (error) {
      setError(error.response?.data?.error || "Error al subir evidencia");
    }
  };

  const handleLinkUpload = async (e) => {
    e.preventDefault();
    if (!linkForm.url_externa || !selectedProject) {
      setError("Ingresa una URL válida y selecciona un proyecto");
      return;
    }

    try {
      await api.post('/auth/student/evidencias/upload-link', {
        ...linkForm,
        id_proyecto: selectedProject.id_proyecto
      });
      setSuccess("Link subido correctamente");
      setShowLinkModal(false);
      resetLinkForm();
      fetchEvidencias();
    } catch (error) {
      setError(error.response?.data?.error || "Error al subir link");
    }
  };

  const handleDownload = async (evidencia) => {
    try {
      const response = await api.get(`/auth/student/evidencias/${evidencia.id_evidencia}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', evidencia.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError("Error al descargar archivo");
    }
  };

  const handleDelete = async (id_evidencia) => {
    if (!window.confirm("¿Estás seguro de eliminar esta evidencia?")) return;
    
    try {
      await api.delete(`/auth/student/evidencias/${id_evidencia}`);
      setSuccess("Evidencia eliminada correctamente");
      fetchEvidencias();
    } catch (error) {
      setError("Error al eliminar evidencia");
    }
  };

  const openComments = async (evidencia) => {
    try {
      const res = await api.get(`/auth/student/evidencias/${evidencia.id_evidencia}/comentarios`);
      setComments(res.data);
      setSelectedEvidence(evidencia);
      setShowCommentsModal(true);
    } catch (error) {
      setError("Error al cargar comentarios");
    }
  };

  const openHistory = async (evidencia) => {
    try {
      const res = await api.get(`/auth/student/evidencias/${evidencia.id_evidencia}/historial`);
      setHistory(res.data);
      setSelectedEvidence(evidencia);
      setShowHistoryModal(true);
    } catch (error) {
      setError("Error al cargar historial");
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      titulo: '',
      descripcion: '',
      categoria_evidencia: '',
      fecha_limite: '',
      es_entrega_final: false,
      archivo: null
    });
  };

  const resetLinkForm = () => {
    setLinkForm({
      titulo: '',
      descripcion: '',
      url_externa: '',
      categoria_evidencia: '',
      fecha_limite: '',
      es_entrega_final: false
    });
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'error';
      case 'requiere_cambios': return 'warning';
      case 'revisando': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'aprobado': return <AiOutlineCheck />;
      case 'rechazado': return <AiOutlineClose />;
      case 'requiere_cambios': return <AiOutlineWarning />;
      case 'revisando': return <AiOutlineEye />;
      default: return <AiOutlineCalendar />;
    }
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'link': return <AiOutlineLink />;
      default: return <AiOutlineFile />;
    }
  };

  const filteredEvidencias = evidencias.filter(evidencia => {
    const matchesSearch = evidencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evidencia.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || evidencia.categoria_evidencia == filterCategory;
    const matchesStatus = !filterStatus || evidencia.estado_validacion === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'titulo':
        return a.titulo.localeCompare(b.titulo);
      case 'estado':
        return a.estado_validacion.localeCompare(b.estado_validacion);
      case 'fecha_limite':
        return new Date(a.fecha_limite || '9999-12-31') - new Date(b.fecha_limite || '9999-12-31');
      default:
        return new Date(b.fecha_subida) - new Date(a.fecha_subida);
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="evidence-manager">
      {/* Header con controles */}
      <div className="evidence-header">
        <div className="evidence-title">
          <h2>
            {selectedProject 
              ? `Evidencias - ${selectedProject.titulo}` 
              : 'Todas mis Evidencias'
            }
          </h2>
          <p className="evidence-subtitle">
            Gestiona tus archivos y entregas académicas
          </p>
        </div>
        
        {selectedProject && (
          <div className="evidence-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              <AiOutlineUpload /> Subir Archivo
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowLinkModal(true)}
            >
              <AiOutlineLink /> Agregar Link
            </button>
          </div>
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

      {/* Filtros y búsqueda */}
      <div className="evidence-filters">
        <div className="search-box">
          <AiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar evidencias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-select"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="revisando">En Revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="requiere_cambios">Requiere Cambios</option>
            <option value="rechazado">Rechazado</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-select"
          >
            <option value="fecha_subida">Fecha de subida</option>
            <option value="titulo">Título</option>
            <option value="estado">Estado</option>
            <option value="fecha_limite">Fecha límite</option>
          </select>
        </div>
      </div>

      {/* Lista de evidencias */}
      {loading ? (
        <div className="loading-container">
          <p>Cargando evidencias...</p>
        </div>
      ) : filteredEvidencias.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No hay evidencias</h3>
          <p>
            {selectedProject 
              ? 'Sube tu primera evidencia para este proyecto'
              : 'No tienes evidencias en ningún proyecto'
            }
          </p>
        </div>
      ) : (
        <div className="evidence-grid">
          {filteredEvidencias.map((evidencia) => (
            <div key={evidencia.id_evidencia} className="evidence-card">
              <div className="evidence-card-header">
                <div className="evidence-icon">
                  {getFileIcon(evidencia.tipo_archivo)}
                </div>
                <div className="evidence-info">
                  <h4 className="evidence-title">{evidencia.titulo}</h4>
                  <p className="evidence-project">
                    {evidencia.proyecto_titulo && `Proyecto: ${evidencia.proyecto_titulo}`}
                  </p>
                </div>
                <div className={`evidence-status ${getStatusColor(evidencia.estado_validacion)}`}>
                  {getStatusIcon(evidencia.estado_validacion)}
                  <span>{evidencia.estado_validacion}</span>
                </div>
              </div>
              
              <div className="evidence-card-body">
                {evidencia.descripcion && (
                  <p className="evidence-description">{evidencia.descripcion}</p>
                )}
                
                <div className="evidence-meta">
                  <div className="meta-item">
                    <span className="meta-label">Categoría:</span>
                    <span className="meta-value" style={{color: evidencia.color_hex}}>
                      {evidencia.nombre_categoria}
                    </span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="meta-label">Subida:</span>
                    <span className="meta-value">{formatDate(evidencia.fecha_subida)}</span>
                  </div>
                  
                  {evidencia.fecha_limite && (
                    <div className="meta-item">
                      <span className="meta-label">Fecha límite:</span>
                      <span className={`meta-value ${new Date(evidencia.fecha_limite) < new Date() ? 'overdue' : ''}`}>
                        {formatDate(evidencia.fecha_limite)}
                      </span>
                    </div>
                  )}
                  
                  {evidencia.tamaño_archivo && (
                    <div className="meta-item">
                      <span className="meta-label">Tamaño:</span>
                      <span className="meta-value">{formatFileSize(evidencia.tamaño_archivo)}</span>
                    </div>
                  )}
                  
                  {evidencia.total_comentarios > 0 && (
                    <div className="meta-item">
                      <span className="meta-label">Comentarios:</span>
                      <span className="meta-value">{evidencia.total_comentarios}</span>
                    </div>
                  )}
                </div>
                
                {evidencia.es_entrega_final && (
                  <div className="final-delivery-badge">
                    Entrega Final
                  </div>
                )}
              </div>
              
              <div className="evidence-card-actions">
                {evidencia.tipo_archivo !== 'link' && (
                  <button 
                    className="btn-icon"
                    onClick={() => handleDownload(evidencia)}
                    title="Descargar"
                  >
                    <AiOutlineDownload />
                  </button>
                )}
                
                {evidencia.tipo_archivo === 'link' && (
                  <a 
                    href={evidencia.url_externa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                    title="Abrir link"
                  >
                    <AiOutlineLink />
                  </a>
                )}
                
                {evidencia.total_comentarios > 0 && (
                  <button 
                    className="btn-icon"
                    onClick={() => openComments(evidencia)}
                    title="Ver comentarios"
                  >
                    <AiOutlineComment />
                  </button>
                )}
                
                <button 
                  className="btn-icon"
                  onClick={() => openHistory(evidencia)}
                  title="Ver historial"
                >
                  <AiOutlineHistory />
                </button>
                
                {evidencia.estado_validacion !== 'aprobado' && (
                  <button 
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(evidencia.id_evidencia)}
                    title="Eliminar"
                  >
                    <AiOutlineDelete />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de subida de archivo */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Subir Archivo</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleFileUpload} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={uploadForm.titulo}
                    onChange={(e) => setUploadForm({...uploadForm, titulo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select
                    className="form-select"
                    value={uploadForm.categoria_evidencia}
                    onChange={(e) => setUploadForm({...uploadForm, categoria_evidencia: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={uploadForm.descripcion}
                    onChange={(e) => setUploadForm({...uploadForm, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Archivo *</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setUploadForm({...uploadForm, archivo: e.target.files[0]})}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar,.txt"
                    required
                  />
                  <div className="form-help-text">
                    Máximo 10MB. Formatos: PDF, Word, Excel, PowerPoint, imágenes, videos, audios, ZIP
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input
                    type="date"
                    className="form-input"
                    value={uploadForm.fecha_limite}
                    onChange={(e) => setUploadForm({...uploadForm, fecha_limite: e.target.value})}
                  />
                </div>
                
                <div className="form-group form-group-full">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={uploadForm.es_entrega_final}
                      onChange={(e) => setUploadForm({...uploadForm, es_entrega_final: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    Marcar como entrega final
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <AiOutlineUpload /> Subir Archivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de link externo */}
      {showLinkModal && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Agregar Link Externo</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLinkModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleLinkUpload} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={linkForm.titulo}
                    onChange={(e) => setLinkForm({...linkForm, titulo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select
                    className="form-select"
                    value={linkForm.categoria_evidencia}
                    onChange={(e) => setLinkForm({...linkForm, categoria_evidencia: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={linkForm.url_externa}
                    onChange={(e) => setLinkForm({...linkForm, url_externa: e.target.value})}
                    placeholder="https://..."
                    required
                  />
                </div>
                
                <div className="form-group form-group-full">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={linkForm.descripcion}
                    onChange={(e) => setLinkForm({...linkForm, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input
                    type="date"
                    className="form-input"
                    value={linkForm.fecha_limite}
                    onChange={(e) => setLinkForm({...linkForm, fecha_limite: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={linkForm.es_entrega_final}
                      onChange={(e) => setLinkForm({...linkForm, es_entrega_final: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    Marcar como entrega final
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowLinkModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <AiOutlineLink /> Agregar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de comentarios */}
      {showCommentsModal && selectedEvidence && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Comentarios - {selectedEvidence.titulo}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCommentsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {comments.length === 0 ? (
                <div className="empty-state">
                  <p>No hay comentarios aún</p>
                </div>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <div key={comment.id_comentario} className={`comment-item ${comment.tipo_comentario}`}>
                      <div className="comment-header">
                        <div className="comment-author">
                          <strong>{comment.nombre} {comment.apellido}</strong>
                          <span className="comment-role">({comment.rol})</span>
                        </div>
                        <div className="comment-date">
                          {formatDate(comment.fecha_comentario)}
                        </div>
                      </div>
                      
                      <div className="comment-body">
                        {comment.tipo_comentario !== 'general' && (
                          <div className={`comment-type-badge ${comment.tipo_comentario}`}>
                            {comment.tipo_comentario.replace('_', ' ')}
                          </div>
                        )}
                        <p>{comment.comentario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial */}
      {showHistoryModal && selectedEvidence && (
        <div className="modal-backdrop">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Historial - {selectedEvidence.titulo}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>No hay historial disponible</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {history.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-action">{item.accion}</span>
                          <span className="timeline-date">{formatDate(item.fecha_cambio)}</span>
                        </div>
                        
                        {item.estado_anterior && item.estado_nuevo && (
                          <div className="timeline-status-change">
                            <span className={`status-badge ${getStatusColor(item.estado_anterior)}`}>
                              {item.estado_anterior}
                            </span>
                            <span className="status-arrow">→</span>
                            <span className={`status-badge ${getStatusColor(item.estado_nuevo)}`}>
                              {item.estado_nuevo}
                            </span>
                          </div>
                        )}
                        
                        {item.descripcion_cambio && (
                          <p className="timeline-description">{item.descripcion_cambio}</p>
                        )}
                        
                        {item.nombre && (
                          <div className="timeline-user">
                            Por: {item.nombre} {item.apellido} ({item.rol})
                          </div>
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
    </div>
  );
};

export default EvidenceManager;
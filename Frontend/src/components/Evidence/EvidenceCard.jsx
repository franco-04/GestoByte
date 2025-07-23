import React from 'react';
import {
  AiOutlineFile,
  AiOutlineLink,
  AiOutlineDownload,
  AiOutlineDelete,
  AiOutlineComment,
  AiOutlineHistory,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineWarning,
  AiOutlineEye,
  AiOutlineCalendar,
  AiOutlineFlag
} from 'react-icons/ai';

const EvidenceCard = ({ 
  evidencia, 
  onDownload, 
  onDelete, 
  onOpenComments, 
  onOpenHistory 
}) => {
  
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'error';
      case 'requiere_cambios': return 'warning';
      case 'revisando':
      case 'revision': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'aprobado': return <AiOutlineCheck />;
      case 'rechazado': return <AiOutlineClose />;
      case 'requiere_cambios': return <AiOutlineWarning />;
      case 'revisando':
      case 'revision': return <AiOutlineEye />;
      default: return <AiOutlineCalendar />;
    }
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'link': return <AiOutlineLink />;
      default: return <AiOutlineFile />;
    }
  };

  const getTypeIcon = (tipo_evidencia) => {
    switch (tipo_evidencia) {
      case 'actividad': return <AiOutlineFlag />;
      case 'general': return <AiOutlineFile />;
      default: return <AiOutlineFile />;
    }
  };

  const getTypeColor = (tipo_evidencia) => {
    switch (tipo_evidencia) {
      case 'actividad': return '#3b82f6';
      case 'general': return '#10b981';
      default: return '#6b7280';
    }
  };

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
    <div className="evidence-card">
      <div className="evidence-card-header">
        <div className="evidence-icon">
          {getFileIcon(evidencia.tipo_archivo)}
        </div>
        <div className="evidence-info">
          <h4 className="evidence-title">{evidencia.titulo}</h4>
          <p className="evidence-project">
            {evidencia.proyecto_titulo && `Proyecto: ${evidencia.proyecto_titulo}`}
            {evidencia.actividad_titulo && (
              <span className="activity-badge" style={{color: getTypeColor(evidencia.tipo_evidencia)}}>
                <AiOutlineFlag /> Actividad: {evidencia.actividad_titulo}
              </span>
            )}
          </p>
        </div>
        <div className="evidence-type-badges">
          <div 
            className="evidence-type-badge" 
            style={{backgroundColor: getTypeColor(evidencia.tipo_evidencia)}}
            title={evidencia.tipo_evidencia === 'actividad' ? 'Evidencia de Actividad' : 'Evidencia General'}
          >
            {getTypeIcon(evidencia.tipo_evidencia)}
            {evidencia.tipo_evidencia === 'actividad' ? 'ACT' : 'GEN'}
          </div>
          <div className={`evidence-status ${getStatusColor(evidencia.estado_validacion)}`}>
            {getStatusIcon(evidencia.estado_validacion)}
            <span>{evidencia.estado_validacion}</span>
          </div>
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
            onClick={() => onDownload(evidencia)}
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
        
        {evidencia.total_comentarios > 0 && evidencia.tipo_evidencia === 'general' && (
          <button 
            className="btn-icon"
            onClick={() => onOpenComments(evidencia)}
            title="Ver comentarios"
          >
            <AiOutlineComment />
          </button>
        )}
        
        {evidencia.tipo_evidencia === 'general' && (
          <button 
            className="btn-icon"
            onClick={() => onOpenHistory(evidencia)}
            title="Ver historial"
          >
            <AiOutlineHistory />
          </button>
        )}
        
        {evidencia.estado_validacion !== 'aprobado' && evidencia.tipo_evidencia === 'general' && (
          <button 
            className="btn-icon btn-danger"
            onClick={() => onDelete(evidencia)}
            title="Eliminar"
          >
            <AiOutlineDelete />
          </button>
        )}
      </div>
    </div>
  );
};

export default EvidenceCard;
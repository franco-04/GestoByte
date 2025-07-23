import React from 'react';

const HistoryModal = ({ isOpen, onClose, evidence, history }) => {
  
  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-large">
        <div className="modal-header">
          <h3>Historial - {evidence?.titulo}</h3>
          <button className="modal-close" onClick={onClose}>
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
              {history.map((historyItem, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-action">{historyItem.accion}</span>
                      <span className="timeline-date">{formatDate(historyItem.fecha_cambio)}</span>
                    </div>
                    
                    {historyItem.estado_anterior && historyItem.estado_nuevo && (
                      <div className="timeline-status-change">
                        <span className={`status-badge ${getStatusColor(historyItem.estado_anterior)}`}>
                          {historyItem.estado_anterior}
                        </span>
                        <span className="status-arrow">→</span>
                        <span className={`status-badge ${getStatusColor(historyItem.estado_nuevo)}`}>
                          {historyItem.estado_nuevo}
                        </span>
                      </div>
                    )}
                    
                    {historyItem.descripcion_cambio && (
                      <p className="timeline-description">{historyItem.descripcion_cambio}</p>
                    )}
                    
                    {historyItem.nombre && (
                      <div className="timeline-user">
                        Por: {historyItem.nombre} {historyItem.apellido} ({historyItem.rol})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
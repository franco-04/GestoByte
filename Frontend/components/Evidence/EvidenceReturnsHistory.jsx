import React, { useState, useEffect } from 'react';
import api from '../../api/api';

const EvidenceReturnsHistory = ({ evidencia, onClose }) => {
  const [historialData, setHistorialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturnsHistory();
  }, [evidencia.id_evidencia]);

  const fetchReturnsHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/activities/evidence/${evidencia.id_evidencia}/returns`);
      setHistorialData(response.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('Error al cargar el historial de devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const downloadSignedDocument = async () => {
    try {
      const response = await api.get(`/auth/activities/evidence/${evidencia.id_evidencia}/download-signed`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FIRMADO_${evidencia.nombre_archivo}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error al descargar documento firmado:', error);
      alert('No hay documento firmado disponible o error al descargar');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobado': return '#10b981';
      case 'devuelto': return '#f59e0b';
      case 'rechazado_final': return '#ef4444';
      case 'pendiente': return '#6b7280';
      case 'revision': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'aprobado': return '✅ Aprobado';
      case 'devuelto': return '↩️ Devuelto';
      case 'rechazado_final': return '❌ Rechazado';
      case 'pendiente': return '⏳ Pendiente';
      case 'revision': return '👀 En Revisión';
      default: return estado;
    }
  };

  const getMotivoTexto = (motivo) => {
    const motivos = {
      'formato_incorrecto': 'Formato de documento incorrecto',
      'contenido_incompleto': 'Contenido incompleto',
      'calidad_insuficiente': 'Calidad insuficiente',
      'no_cumple_requisitos': 'No cumple con los requisitos',
      'informacion_faltante': 'Información faltante',
      'otro': 'Otro motivo'
    };
    return motivos[motivo] || motivo;
  };

  if (loading) {
    return (
      <div className="returns-modal-overlay">
        <div className="returns-modal">
          <div className="loading-content">
            <p>Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="returns-modal-overlay">
        <div className="returns-modal">
          <div className="error-content">
            <p>{error}</p>
            <button onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  const { evidencia: evidenciaInfo, historial_devoluciones } = historialData;

  return (
    <div className="returns-modal-overlay">
      <div className="returns-modal">
        <div className="modal-header">
          <h3>Historial de Revisiones - {evidencia.titulo}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Estado actual */}
          <div className="current-status">
            <h4>Estado Actual</h4>
            <div className="status-card">
              <div className="status-info">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getEstadoColor(evidenciaInfo.estado_revision),
                    color: 'white'
                  }}
                >
                  {getEstadoTexto(evidenciaInfo.estado_revision)}
                </span>
                <div className="status-details">
                  <p><strong>Total de devoluciones:</strong> {evidenciaInfo.numero_devoluciones}</p>
                  {evidenciaInfo.fecha_primera_devolucion && (
                    <p><strong>Primera devolución:</strong> {new Date(evidenciaInfo.fecha_primera_devolucion).toLocaleString('es-ES')}</p>
                  )}
                  {evidenciaInfo.fecha_ultima_devolucion && (
                    <p><strong>Última devolución:</strong> {new Date(evidenciaInfo.fecha_ultima_devolucion).toLocaleString('es-ES')}</p>
                  )}
                </div>
              </div>
              
              {evidenciaInfo.estado_revision === 'aprobado' && (
                <button 
                  className="btn-download-signed"
                  onClick={downloadSignedDocument}
                >
                  📄 Descargar Documento Firmado
                </button>
              )}
            </div>
          </div>

          {/* Historial de devoluciones */}
          {historial_devoluciones.length > 0 && (
            <div className="returns-history">
              <h4>Historial de Devoluciones</h4>
              <div className="timeline">
                {historial_devoluciones.map((devolucion) => (
                  <div key={devolucion.numero_devolucion} className="timeline-item">
                    <div className="timeline-marker">
                      <span className="return-number">#{devolucion.numero_devolucion}</span>
                    </div>
                    <div className="timeline-content">
                      <div className="return-header">
                        <h5>Devolución #{devolucion.numero_devolucion}</h5>
                        <span className="return-date">
                          {new Date(devolucion.fecha_devolucion).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="return-details">
                        <div className="return-reason">
                          <strong>Motivo:</strong> {getMotivoTexto(devolucion.motivo_devolucion)}
                        </div>
                        {devolucion.comentarios_adicionales && (
                          <div className="return-comments">
                            <strong>Comentarios del coordinador:</strong>
                            <p>{devolucion.comentarios_adicionales}</p>
                          </div>
                        )}
                        <div className="coordinator-info">
                          <strong>Revisado por:</strong> {devolucion.coordinador_nombre} {devolucion.coordinador_apellido}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consejos para el estudiante */}
          <div className="tips-section">
            <h4>💡 Consejos para Evitar Devoluciones</h4>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">📋</span>
                <span>Revisa cuidadosamente los requisitos antes de subir tu evidencia</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📄</span>
                <span>Asegúrate de que el formato del archivo sea el solicitado</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">✅</span>
                <span>Verifica que toda la información requerida esté completa</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💬</span>
                <span>Lee atentamente los comentarios de devoluciones anteriores</span>
              </div>
            </div>
          </div>

          {/* Botón de cerrar */}
          <div className="modal-actions">
            <button className="btn-close" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .returns-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .returns-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.2rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f1f1f1;
        }

        .modal-content {
          padding: 1.5rem;
        }

        .current-status h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
        }

        .status-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .status-info {
          flex: 1;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .status-details p {
          margin: 0.25rem 0;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .btn-download-signed {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-download-signed:hover {
          background: #059669;
        }

        .returns-history {
          margin: 2rem 0;
        }

        .returns-history h4 {
          margin: 0 0 1.5rem 0;
          color: #2d3748;
        }

        .timeline {
          position: relative;
          padding-left: 2rem;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 1rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 2rem;
        }

        .timeline-marker {
          position: absolute;
          left: -2rem;
          top: 0;
          width: 2rem;
          height: 2rem;
          background: #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.75rem;
        }

        .return-number {
          font-size: 0.7rem;
        }

        .timeline-content {
          background: white;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .return-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .return-header h5 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .return-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .return-details > div {
          margin-bottom: 1rem;
        }

        .return-details > div:last-child {
          margin-bottom: 0;
        }

        .return-reason {
          color: #dc2626;
          font-weight: 500;
        }

        .return-comments {
          background: #fef3c7;
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #f59e0b;
        }

        .return-comments p {
          margin: 0.5rem 0 0 0;
          color: #92400e;
          font-style: italic;
        }

        .coordinator-info {
          color: #4b5563;
          font-size: 0.9rem;
        }

        .tips-section {
          margin: 2rem 0;
          background: #f0f9ff;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }

        .tips-section h4 {
          margin: 0 0 1rem 0;
          color: #0c4a6e;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #0c4a6e;
        }

        .tip-icon {
          font-size: 1.2rem;
          width: 1.5rem;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-close {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: #2563eb;
        }

        .loading-content, .error-content {
          padding: 2rem;
          text-align: center;
        }

        .error-content button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .returns-modal {
            width: 95%;
            margin: 1rem;
          }

          .modal-content {
            padding: 1rem;
          }

          .status-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .return-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .timeline {
            padding-left: 1.5rem;
          }

          .timeline-marker {
            left: -1.5rem;
            width: 1.5rem;
            height: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EvidenceReturnsHistory;
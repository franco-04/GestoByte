import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/api';

const EvidenceReviewModal = ({ evidencia, onClose, onReviewComplete }) => {
  const [reviewAction, setReviewAction] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signedDocument, setSignedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState(null);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 150;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, [showSignaturePad]);

  const handleActionChange = (action) => {
    setReviewAction(action);
    if (action === 'aprobar_con_firma') {
      setShowSignaturePad(true);
    } else {
      setShowSignaturePad(false);
      setSignature(null);
    }
  };

  // Funciones para firma digital
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const signatureBase64 = canvas.toDataURL();
      setSignature({
        firma_base64: signatureBase64,
        coordenadas: getSignatureCoordinates(),
        timestamp: new Date().toISOString(),
        hash_documento: generateDocumentHash(),
        metadatos: {
          evidencia: evidencia.titulo,
          navegador: navigator.userAgent,
          resolucion: `${canvas.width}x${canvas.height}`
        }
      });
    }
  };

  const getSignatureCoordinates = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  };

  const generateDocumentHash = () => {
    const data = `${evidencia.titulo}-${evidencia.id_evidencia}-${Date.now()}`;
    return btoa(data).substring(0, 32);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignedDocument(file);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewAction) {
      alert('Por favor selecciona una acción');
      return;
    }

    if (reviewAction === 'devolver' && !motivoDevolucion) {
      alert('Por favor especifica el motivo de la devolución');
      return;
    }

    if (reviewAction === 'aprobar_con_firma' && !signature) {
      alert('Por favor proporciona tu firma digital');
      return;
    }

    setLoading(true);

    try {
      if (reviewAction === 'subir_firmado' && signedDocument) {
        // Subir documento ya firmado
        const formData = new FormData();
        formData.append('documento_firmado', signedDocument);
        formData.append('comentarios_aprobacion', comentarios);

        await api.post(`/auth/activities/evidence/${evidencia.id_evidencia}/upload-signed`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        
      } else {
        // Revisar con firma digital o devolver
        const reviewData = {
          estado_revision: reviewAction === 'devolver' ? 'devuelto' : 
                          reviewAction === 'aprobar_con_firma' ? 'aprobado' : 
                          reviewAction === 'rechazar' ? 'rechazado_final' : 'pendiente',
          comentarios_revision: comentarios,
          motivo_devolucion: motivoDevolucion,
          firma_digital: reviewAction === 'aprobar_con_firma' ? signature : null
        };

        await api.put(`/auth/activities/evidence/${evidencia.id_evidencia}/review`, reviewData);
      }

      onReviewComplete();
      onClose();
      
    } catch (error) {
        console.error('Error al revisar evidencia:', error);
        alert('Error al procesar la revisión: ' + (error.response?.data?.error || error.message));
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 Evidencia recibida en modal:', evidencia);
    console.log('📄 Nombre archivo:', evidencia?.nombre_archivo);
    console.log('📁 Tipo archivo:', evidencia?.tipo_archivo);
  }, [evidencia]);

  const downloadOriginal = async () => {
    try {
      console.log('🔽 Descargando archivo original:', evidencia.nombre_archivo);
      
      const response = await api.get(`/auth/activities/evidence/${evidencia.id_evidencia}/download`, {
        responseType: 'blob'
      });
      
      // Usar el nombre exacto del archivo de la base de datos
      const fileName = evidencia.nombre_archivo || 'evidencia.pdf';
      
      console.log('📄 Archivo a descargar:', fileName);
      console.log('📦 Tamaño del blob:', response.data.size);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar archivo original:', error);
      alert('Error al descargar el archivo: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="evidence-review-overlay">
      <div className="evidence-review-modal">
        <div className="modal-header">
          <h3>Revisar Evidencia</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Información de la evidencia */}
          <div className="evidence-info">
            <h4>{evidencia.titulo}</h4>
            <p><strong>Descripción:</strong> {evidencia.descripcion}</p>
            <p><strong>Estudiante:</strong> {evidencia.usuario_nombre} {evidencia.usuario_apellido}</p>
            <p><strong>Fecha de subida:</strong> {new Date(evidencia.fecha_subida).toLocaleString('es-ES')}</p>
            {evidencia.numero_devoluciones > 0 && (
              <div className="return-info">
                <p><strong>⚠️ Devoluciones previas:</strong> {evidencia.numero_devoluciones}</p>
              </div>
            )}
          </div>

          {/* Botón para descargar documento original */}
          <div className="download-section">
            <button className="btn-download" onClick={downloadOriginal}>
              📥 Descargar Documento Original
            </button>
          </div>

          {/* Opciones de revisión */}
          <div className="review-actions">
            <h4>Acción a realizar:</h4>
            
            <div className="action-options">
              <label className="action-option">
                <input 
                  type="radio" 
                  name="reviewAction" 
                  value="aprobar_simple"
                  onChange={(e) => handleActionChange(e.target.value)}
                />
                <span>✅ Aprobar (sin firma)</span>
              </label>

              <label className="action-option">
                <input 
                  type="radio" 
                  name="reviewAction" 
                  value="aprobar_con_firma"
                  onChange={(e) => handleActionChange(e.target.value)}
                />
                <span>✍️ Aprobar con Firma Digital</span>
              </label>

              <label className="action-option">
                <input 
                  type="radio" 
                  name="reviewAction" 
                  value="subir_firmado"
                  onChange={(e) => handleActionChange(e.target.value)}
                />
                <span>📄 Subir Documento Ya Firmado</span>
              </label>

              <label className="action-option">
                <input 
                  type="radio" 
                  name="reviewAction" 
                  value="devolver"
                  onChange={(e) => handleActionChange(e.target.value)}
                />
                <span>↩️ Devolver para Correcciones</span>
              </label>

              <label className="action-option">
                <input 
                  type="radio" 
                  name="reviewAction" 
                  value="rechazar"
                  onChange={(e) => handleActionChange(e.target.value)}
                />
                <span>❌ Rechazar Definitivamente</span>
              </label>
            </div>
          </div>

          {/* Área de firma digital */}
          {showSignaturePad && (
            <div className="signature-section">
              <h4>Firma Digital</h4>
              <p>Firma en el recuadro para aprobar oficialmente la evidencia:</p>
              <canvas
                ref={canvasRef}
                className="signature-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="signature-controls">
                <button 
                  type="button" 
                  className="btn-clear"
                  onClick={clearSignature}
                >
                  Limpiar
                </button>
                {signature && <span className="signature-status">✅ Firma capturada</span>}
              </div>
            </div>
          )}

          {/* Subir documento firmado */}
          {reviewAction === 'subir_firmado' && (
            <div className="upload-section">
              <h4>Subir Documento Firmado</h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="file-input"
              />
              {signedDocument && (
                <p className="file-selected">✅ Archivo seleccionado: {signedDocument.name}</p>
              )}
            </div>
          )}

          {/* Motivo de devolución */}
          {reviewAction === 'devolver' && (
            <div className="return-reason">
              <label>
                <strong>Motivo de la devolución:</strong>
                <select 
                  value={motivoDevolucion} 
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  required
                >
                  <option value="">Selecciona un motivo...</option>
                  <option value="formato_incorrecto">Formato de documento incorrecto</option>
                  <option value="contenido_incompleto">Contenido incompleto</option>
                  <option value="calidad_insuficiente">Calidad insuficiente</option>
                  <option value="no_cumple_requisitos">No cumple con los requisitos</option>
                  <option value="informacion_faltante">Información faltante</option>
                  <option value="otro">Otro (especificar en comentarios)</option>
                </select>
              </label>
            </div>
          )}

          {/* Comentarios */}
          <div className="comments-section">
            <label>
              <strong>Comentarios {reviewAction === 'devolver' ? '(obligatorio)' : '(opcional)'}:</strong>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder={reviewAction === 'devolver' ? 
                  'Explica detalladamente qué debe corregir el estudiante...' :
                  'Comentarios adicionales sobre la evidencia...'
                }
                rows={4}
                required={reviewAction === 'devolver'}
              />
            </label>
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button 
              className="btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className="btn-submit" 
              onClick={handleSubmitReview}
              disabled={loading || !reviewAction}
            >
              {loading ? 'Procesando...' : 'Confirmar Revisión'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .evidence-review-overlay {
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

        .evidence-review-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
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

        .evidence-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #3b82f6;
        }

        .evidence-info h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }

        .evidence-info p {
          margin: 0.25rem 0;
          color: #4a5568;
        }

        .return-info {
          background: #fff3cd;
          padding: 0.5rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          border: 1px solid #ffeaa7;
        }

        .download-section {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .btn-download {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-download:hover {
          background: #2563eb;
        }

        .review-actions h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
        }

        .action-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-option {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-option:hover {
          border-color: #3b82f6;
          background: #f7fafc;
        }

        .action-option input[type="radio"] {
          margin-right: 0.75rem;
          transform: scale(1.2);
        }

        .action-option input[type="radio"]:checked + span {
          color: #3b82f6;
          font-weight: 600;
        }

        .signature-section {
          margin: 1.5rem 0;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .signature-section h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }

        .signature-canvas {
          border: 2px solid #cbd5e0;
          border-radius: 6px;
          cursor: crosshair;
          background: white;
          width: 100%;
          max-width: 400px;
          height: 150px;
          display: block;
          margin: 0.5rem auto;
        }

        .signature-canvas:hover {
          border-color: #3b82f6;
        }

        .signature-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          align-items: center;
          margin-top: 0.5rem;
        }

        .btn-clear {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-clear:hover {
          background: #4b5563;
        }

        .signature-status {
          color: #10b981;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .upload-section {
          margin: 1.5rem 0;
          padding: 1rem;
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          text-align: center;
        }

        .upload-section h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
        }

        .file-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          background: white;
        }

        .file-selected {
          margin-top: 0.5rem;
          color: #10b981;
          font-weight: 500;
        }

        .return-reason {
          margin: 1.5rem 0;
        }

        .return-reason label {
          display: block;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .return-reason select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          background: white;
          font-size: 1rem;
        }

        .return-reason select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .comments-section {
          margin: 1.5rem 0;
        }

        .comments-section label {
          display: block;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .comments-section textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          resize: vertical;
          font-family: inherit;
          font-size: 1rem;
        }

        .comments-section textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-cancel, .btn-submit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-submit {
          background: #3b82f6;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-submit:disabled, .btn-cancel:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .evidence-review-modal {
            width: 95%;
            margin: 1rem;
          }

          .modal-content {
            padding: 1rem;
          }

          .action-options {
            gap: 0.5rem;
          }

          .action-option {
            padding: 0.5rem;
          }

          .modal-actions {
            flex-direction: column;
          }

          .btn-cancel, .btn-submit {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EvidenceReviewModal;
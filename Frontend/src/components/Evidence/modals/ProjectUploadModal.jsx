import React, { useState } from 'react';
import { AiOutlineUpload } from 'react-icons/ai';
import api from '../../../api/api';

const ProjectUploadModal = ({ 
  isOpen, 
  onClose, 
  selectedProject, 
  categorias, 
  onSuccess, 
  onError 
}) => {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria_evidencia: '',
    fecha_limite: '',
    es_entrega_final: false,
    archivo: null
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.archivo || !selectedProject) {
      onError("Selecciona un archivo");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('archivo', form.archivo);
    formData.append('id_proyecto', selectedProject.id_proyecto);
    formData.append('titulo', form.titulo);
    formData.append('descripcion', form.descripcion);
    formData.append('categoria_evidencia', form.categoria_evidencia);
    formData.append('fecha_limite', form.fecha_limite);
    formData.append('es_entrega_final', form.es_entrega_final);

    try {
      await api.post('/auth/student/evidencias/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      onError(error.response?.data?.error || "Error al subir evidencia");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      descripcion: '',
      categoria_evidencia: '',
      fecha_limite: '',
      es_entrega_final: false,
      archivo: null
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-large">
        <div className="modal-header">
          <h3>Subir Archivo - {selectedProject?.titulo}</h3>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                type="text"
                className="form-input"
                value={form.titulo}
                onChange={(e) => setForm({...form, titulo: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select
                className="form-select"
                value={form.categoria_evidencia}
                onChange={(e) => setForm({...form, categoria_evidencia: e.target.value})}
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
            
            <div className="form-group">
              <label className="form-label">Fecha límite</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_limite}
                onChange={(e) => setForm({...form, fecha_limite: e.target.value})}
              />
            </div>
            
            <div className="form-group form-group-full">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                value={form.descripcion}
                onChange={(e) => setForm({...form, descripcion: e.target.value})}
                rows="3"
              />
            </div>
            
            <div className="form-group form-group-full">
              <label className="form-label">Archivo *</label>
              <input
                type="file"
                className="form-input"
                onChange={(e) => setForm({...form, archivo: e.target.files[0]})}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar,.txt"
                required
              />
              <div className="form-help-text">
                Máximo 10MB. Formatos: PDF, Word, Excel, PowerPoint, imágenes, videos, audios, ZIP
              </div>
            </div>
            
            <div className="form-group form-group-full">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.es_entrega_final}
                  onChange={(e) => setForm({...form, es_entrega_final: e.target.checked})}
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
              onClick={handleClose}
              disabled={uploading}
            >
              
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                'Subiendo...'
              ) : (
                <>
                  <AiOutlineUpload /> Subir Archivo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectUploadModal;
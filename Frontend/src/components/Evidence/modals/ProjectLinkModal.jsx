import React, { useState } from 'react';
import { AiOutlineLink } from 'react-icons/ai';
import api from '../../../api/api';

const ProjectLinkModal = ({ 
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
    url_externa: '',
    categoria_evidencia: '',
    fecha_limite: '',
    es_entrega_final: false
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url_externa || !selectedProject) {
      onError("Ingresa una URL válida");
      return;
    }

    setUploading(true);
    try {
      await api.post('/auth/student/evidencias/upload-link', {
        ...form,
        id_proyecto: selectedProject.id_proyecto
      });
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      onError(error.response?.data?.error || "Error al subir link");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      descripcion: '',
      url_externa: '',
      categoria_evidencia: '',
      fecha_limite: '',
      es_entrega_final: false
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
          <h3>Agregar Link - {selectedProject?.titulo}</h3>
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
              <label className="form-label">URL *</label>
              <input
                type="url"
                className="form-input"
                value={form.url_externa}
                onChange={(e) => setForm({...form, url_externa: e.target.value})}
                placeholder="https://..."
                required
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
                  <AiOutlineLink /> Agregar Link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectLinkModal;
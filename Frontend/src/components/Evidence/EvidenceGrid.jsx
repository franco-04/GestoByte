import React from 'react';
import EvidenceCard from './EvidenceCard';

const EvidenceGrid = ({ 
  evidencias,
  searchTerm,
  filterCategory,
  filterStatus,
  filterType,
  sortBy,
  selectedProject,
  loading,
  onDownload,
  onDelete,
  onOpenComments,
  onOpenHistory
}) => {

  // Filtrado de evidencias
  const filteredEvidencias = evidencias.filter(evidencia => {
    const matchesSearch = evidencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evidencia.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || evidencia.categoria_evidencia == filterCategory;
    const matchesStatus = !filterStatus || evidencia.estado_validacion === filterStatus;
    const matchesType = !filterType || evidencia.tipo_evidencia === filterType;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'titulo':
        return a.titulo.localeCompare(b.titulo);
      case 'estado':
        return a.estado_validacion.localeCompare(b.estado_validacion);
      case 'tipo':
        return a.tipo_evidencia.localeCompare(b.tipo_evidencia);
      case 'fecha_limite':
        return new Date(a.fecha_limite || '9999-12-31') - new Date(b.fecha_limite || '9999-12-31');
      default:
        return new Date(b.fecha_subida) - new Date(a.fecha_subida);
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando evidencias...</p>
      </div>
    );
  }

  if (filteredEvidencias.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <h3>No hay evidencias</h3>
        <p>
          {selectedProject 
            ? 'Sube tu primera evidencia para este proyecto'
            : 'No tienes evidencias. Usa los botones de arriba para subir tu primera evidencia.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="evidence-grid">
      {filteredEvidencias.map((evidencia) => (
        <EvidenceCard
          key={`${evidencia.tipo_evidencia}-${evidencia.id_evidencia}`}
          evidencia={evidencia}
          onDownload={onDownload}
          onDelete={onDelete}
          onOpenComments={onOpenComments}
          onOpenHistory={onOpenHistory}
        />
      ))}
    </div>
  );
};

export default EvidenceGrid;
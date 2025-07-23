import React from 'react';
import { AiOutlineSearch } from 'react-icons/ai';

const EvidenceFilters = ({ 
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  categorias,
  selectedProject
}) => {
  return (
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
        {!selectedProject && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select"
          >
            <option value="">Todos los tipos</option>
            <option value="general">Evidencias Generales</option>
            <option value="actividad">Evidencias de Actividades</option>
          </select>
        )}
        
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
          <option value="tipo">Tipo</option>
          <option value="fecha_limite">Fecha límite</option>
        </select>
      </div>
    </div>
  );
};

export default EvidenceFilters;
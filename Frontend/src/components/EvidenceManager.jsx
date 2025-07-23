import React, { useState, useEffect } from 'react';
import api from '../api/api';

// Componentes modularizados
import EvidenceHeader from './Evidence/EvidenceHeader';
import EvidenceFilters from './Evidence/EvidenceFilters';
import EvidenceGrid from './Evidence/EvidenceGrid';

// Modales modularizados
import GeneralUploadModal from './Evidence/modals/GeneralUploadModal';
import GeneralLinkModal from './Evidence/modals/GeneralLinkModal';
import ProjectUploadModal from './Evidence/modals/ProjectUploadModal';
import ProjectLinkModal from './Evidence/modals/ProjectLinkModal';
import CommentsModal from './Evidence/modals/CommentsModal';
import HistoryModal from './Evidence/modals/HistoryModal';

const EvidenceManager = ({ selectedProject = null }) => {
  // Estados principales
  const [evidencias, setEvidencias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showGeneralUploadModal, setShowGeneralUploadModal] = useState(false);
  const [showGeneralLinkModal, setShowGeneralLinkModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Estados para vista de detalles
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("fecha_subida");

  useEffect(() => {
    fetchEvidencias();
    fetchCategorias();
    if (!selectedProject) {
      fetchUserProjects();
    }
  }, [selectedProject]);

  // Funciones de datos
  const fetchEvidencias = async () => {
    setLoading(true);
    try {
      const url = selectedProject 
        ? `/auth/student/evidencias/proyecto/${selectedProject.id_proyecto}`
        : '/auth/student/evidencias/todas-unificadas';
      const res = await api.get(url);
      setEvidencias(res.data);
    } catch (error) {
      setError("Error al cargar evidencias: " + error.message);
      console.error("Error fetching evidences:", error);
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

  const fetchUserProjects = async () => {
    try {
      const res = await api.get('/auth/student/my-projects');
      setUserProjects(res.data);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
    }
  };

  // Funciones de manejo
  const handleDownload = async (evidencia) => {
    try {
      const endpoint = evidencia.tipo_evidencia === 'actividad' 
        ? `/auth/activities/evidence/${evidencia.id_evidencia}/download`
        : `/auth/student/evidencias/${evidencia.id_evidencia}/download`;
        
      const response = await api.get(endpoint, {
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

  const handleDelete = async (evidencia) => {
    if (!window.confirm("¿Estás seguro de eliminar esta evidencia?")) return;
    
    try {
      if (evidencia.tipo_evidencia === 'actividad') {
        setError("Las evidencias de actividades no se pueden eliminar desde aquí");
        return;
      }
      
      await api.delete(`/auth/student/evidencias/${evidencia.id_evidencia}`);
      setSuccess("Evidencia eliminada correctamente");
      fetchEvidencias();
    } catch (error) {
      setError("Error al eliminar evidencia");
    }
  };

  const handleOpenComments = async (evidencia) => {
    try {
      if (evidencia.tipo_evidencia === 'actividad') {
        setError("Las evidencias de actividades no tienen sistema de comentarios aquí");
        return;
      }
      
      const res = await api.get(`/auth/student/evidencias/${evidencia.id_evidencia}/comentarios`);
      setComments(res.data);
      setSelectedEvidence(evidencia);
      setShowCommentsModal(true);
    } catch (error) {
      setError("Error al cargar comentarios");
    }
  };

  const handleOpenHistory = async (evidencia) => {
    try {
      if (evidencia.tipo_evidencia === 'actividad') {
        setError("Las evidencias de actividades no tienen historial aquí");
        return;
      }
      
      const res = await api.get(`/auth/student/evidencias/${evidencia.id_evidencia}/historial`);
      setHistory(res.data);
      setSelectedEvidence(evidencia);
      setShowHistoryModal(true);
    } catch (error) {
      setError("Error al cargar historial");
    }
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    fetchEvidencias();
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Debug: Log para verificar que todo se renderiza
  console.log("EvidenceManager render - evidencias:", evidencias.length);
  console.log("EvidenceManager render - categorias:", categorias.length);
  console.log("EvidenceManager render - userProjects:", userProjects.length);

  return (
    <div className="evidence-manager">
      {/* Header con botones */}
      <EvidenceHeader
        selectedProject={selectedProject}
        onShowUploadModal={() => setShowUploadModal(true)}
        onShowLinkModal={() => setShowLinkModal(true)}
        onShowGeneralUploadModal={() => setShowGeneralUploadModal(true)}
        onShowGeneralLinkModal={() => setShowGeneralLinkModal(true)}
      />

      {/* Alertas */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span>{success}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {/* Filtros */}
      <EvidenceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categorias={categorias}
        selectedProject={selectedProject}
      />

      {/* Grid de evidencias */}
      <EvidenceGrid
        evidencias={evidencias}
        searchTerm={searchTerm}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        filterType={filterType}
        sortBy={sortBy}
        selectedProject={selectedProject}
        loading={loading}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onOpenComments={handleOpenComments}
        onOpenHistory={handleOpenHistory}
      />

      {/* Modales para proyecto específico */}
      <ProjectUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        selectedProject={selectedProject}
        categorias={categorias}
        onSuccess={() => handleSuccess("Evidencia subida correctamente")}
        onError={setError}
      />

      <ProjectLinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        selectedProject={selectedProject}
        categorias={categorias}
        onSuccess={() => handleSuccess("Link subido correctamente")}
        onError={setError}
      />

      {/* Modales para evidencias generales */}
      <GeneralUploadModal
        isOpen={showGeneralUploadModal}
        onClose={() => setShowGeneralUploadModal(false)}
        userProjects={userProjects}
        categorias={categorias}
        onSuccess={() => handleSuccess("Evidencia general subida correctamente")}
        onError={setError}
      />

      <GeneralLinkModal
        isOpen={showGeneralLinkModal}
        onClose={() => setShowGeneralLinkModal(false)}
        userProjects={userProjects}
        categorias={categorias}
        onSuccess={() => handleSuccess("Link general subido correctamente")}
        onError={setError}
      />

      {/* Modales de información */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        evidence={selectedEvidence}
        comments={comments}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        evidence={selectedEvidence}
        history={history}
      />
    </div>
  );
};

export default EvidenceManager;
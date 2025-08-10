import React from 'react';
import { AiOutlineUpload, AiOutlineLink } from 'react-icons/ai';

const EvidenceHeader = ({ 
  selectedProject,
  onShowUploadModal,
  onShowLinkModal,
  onShowGeneralUploadModal,
  onShowGeneralLinkModal
}) => {
  return (
    <div className="evidence-header">
      <div className="evidence-title">
        <h2>
          {selectedProject 
            ? `Evidencias - ${selectedProject.titulo}` 
            : 'Todas mis Evidencias'
          }
        </h2>
        <p className="evidence-subtitle">
          {selectedProject 
            ? 'Evidencias generales del proyecto seleccionado'
            : 'Gestiona todas tus evidencias académicas (generales y de actividades)'
          }
        </p>
      </div>
      
      <div className="evidence-actions">
        {selectedProject ? (
          // Botones para evidencias del proyecto seleccionado
          <>
            <button 
              className="btn btn-primary"
              onClick={onShowUploadModal}
            >
              <AiOutlineUpload /> Subir Archivo al Proyecto
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onShowLinkModal}
            >
              <AiOutlineLink /> Agregar Link al Proyecto
            </button>
          </>
        ) : (
          // Botones para evidencias generales
          <>
            <button 
              className="btn btn-primary"
              onClick={onShowGeneralUploadModal}
            >
              <AiOutlineUpload /> Subir Evidencia General
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={onShowGeneralLinkModal}
            >
              <AiOutlineLink /> Agregar Link General
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EvidenceHeader;
import React from 'react';

const CommentsModal = ({ isOpen, onClose, evidence, comments }) => {
  
  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-large">
        <div className="modal-header">
          <h3>Comentarios - {evidence?.titulo}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {comments.length === 0 ? (
            <div className="empty-state">
              <p>No hay comentarios aún</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id_comentario} className={`comment-item ${comment.tipo_comentario}`}>
                  <div className="comment-header">
                    <div className="comment-author">
                      <strong>{comment.nombre} {comment.apellido}</strong>
                      <span className="comment-role">({comment.rol})</span>
                    </div>
                    <div className="comment-date">
                      {formatDate(comment.fecha_comentario)}
                    </div>
                  </div>
                  
                  <div className="comment-body">
                    {comment.tipo_comentario !== 'general' && (
                      <div className={`comment-type-badge ${comment.tipo_comentario}`}>
                        {comment.tipo_comentario.replace('_', ' ')}
                      </div>
                    )}
                    <p>{comment.comentario}</p>
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

export default CommentsModal;
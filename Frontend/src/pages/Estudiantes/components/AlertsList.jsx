import React from 'react';
import { AiOutlineBell } from 'react-icons/ai';

const AlertsList = ({ alertas, formatDate }) => {
  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Alertas</h1>
        <p className="admin-subtitle">
          Notificaciones importantes sobre tus proyectos y actividades
        </p>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="card-content">
            <div className="alerts-list">
              {alertas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔔</div>
                  <h3>No tienes alertas</h3>
                  <p>Cuando tengas notificaciones importantes sobre tus proyectos, aparecerán aquí.</p>
                </div>
              ) : (
                alertas.map((alerta, index) => (
                  <div key={index} className={`alert-item ${alerta.tipo}`}>
                    <div className="alert-icon">
                      <AiOutlineBell />
                    </div>
                    <div className="alert-content">
                      <h4>{alerta.titulo}</h4>
                      <p>{alerta.mensaje}</p>
                      <div className="alert-time">
                        {formatDate(alerta.fecha_creacion)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsList;
import React from "react";

export default function Bienvenida({ user }) {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="dashboard-subtitle">
            Bienvenido, {user?.nombre} {user?.apellido}
          </p>
        </div>
        <div className="user-info-card">
          <div className="user-avatar">
            {user?.nombre?.charAt(0)}
            {user?.apellido?.charAt(0)}
          </div>
          <div className="user-details">
            <span className="user-name">
              {user?.nombre} {user?.apellido}
            </span>
            <span className="user-role">{user?.rol}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

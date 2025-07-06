// src/pages/SuperAdminDashboard.jsx
import React from 'react';
import authService from '../../services/authService';

export default function SuperAdminDashboard() {
  const user = authService.getCurrentUser();
  
  return (
    <div>
      <h1>Panel de Super Administrador</h1>
      <p>Bienvenido, {user?.nombre} {user?.apellido}</p>
      <p>Carrera: {user?.carrera}</p>
      <p>Rol: {user?.rol}</p>
      {/* Contenido específico para super administradores */}
    </div>
  );
}
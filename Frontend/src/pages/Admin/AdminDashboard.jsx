// src/pages/AdminDashboard.jsx
import React from 'react';
import authService from '../../services/authService';

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  
  return (
    <div>
      <h1>Panel de Maestro</h1>
      <p>Bienvenido, {user?.nombre} {user?.apellido}</p>
      <p>Carrera: {user?.carrera}</p>
      <p>Rol: {user?.rol}</p>
      {/* Contenido específico para administradores */}
    </div>
  );
}
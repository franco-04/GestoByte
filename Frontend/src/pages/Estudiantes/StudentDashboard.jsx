// src/pages/StudentDashboard.jsx
import React from 'react';
import authService from '../../services/authService';

export default function StudentDashboard() {
  const user = authService.getCurrentUser();
  
  return (
    <div>
      <h1>Panel de estudiante</h1>
      <p>Bienvenido, {user?.nombre} {user?.apellido}</p>
      <p>Carrera: {user?.carrera}</p>
      <p>Rol: {user?.rol}</p>
      {/* Contenido específico para estudiantes */}
    </div>
  );
}
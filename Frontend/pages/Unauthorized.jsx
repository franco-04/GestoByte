// src/pages/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div>
      <h1>Acceso no autorizado</h1>
      <p>No tienes permiso para acceder a esta página.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
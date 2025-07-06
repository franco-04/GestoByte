import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar">
      <h1 className="navbar-brand">MiProyectoEscuela</h1>
      <ul className="nav-links">
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Registro</Link></li>
      </ul>
    </nav>
  );
}

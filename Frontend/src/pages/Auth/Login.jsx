// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../../assets/log.png";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import "./Auth.css";
import authService from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('authToken', response.token);
      
      // Redirigir según el rol del usuario
      switch (response.user.rol) {
        case 'estudiante':
          navigate('/estudiante');
          break;
        case 'administrador':
          navigate('/admin');
          break;
        case 'superadministrador':
          navigate('/superadmin');
          break;
        default:
          navigate('/'); // Página por defecto
          break;
      }
    } catch (err) {
      setError(err.message || "Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-image">
        <img src={loginImage} alt="Login visual" />
      </div>
      <div className="divider-line"></div>
      <div className="auth-form">
        <div className="form-header">
          <h2>Iniciar Sesión</h2>
          <p>Bienvenido de vuelta</p>
        </div>

        {error && (
          <div className="error-message global-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-body">
          <div className="input-group">
            <div className="input-container">
              <FiMail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-container">
              <FiLock className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            <FiLogIn className="button-icon" />
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            ¿No tienes cuenta?
            <Link to="/register" className="switch-link">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../../assets/log.png";
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from "react-icons/fi";
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
      localStorage.setItem("authToken", response.token);

      // Redirigir según el rol del usuario
      switch (response.user.rol) {
        case "estudiante":
          navigate("/estudiante");
          break;
        case "administrador":
          navigate("/admin");
          break;
        case "superadministrador":
          navigate("/superadmin");
          break;
        default:
          navigate("/"); // Página por defecto
          break;
      }
    } catch (err) {
      console.error("Error completo en login:", err);
      console.error("Respuesta del servidor:", err.response?.data);
      
      // 🔥 MANEJO ESPECÍFICO DE ERRORES DEL BACKEND
      let errorMessage = "Error inesperado. Inténtalo de nuevo.";
      
      if (err.response?.data?.error) {
        // Error específico del backend
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 400) {
        // Error 400 genérico
        errorMessage = "Credenciales incorrectas o cuenta inactiva.";
      } else if (err.response?.status === 500) {
        // Error del servidor
        errorMessage = "Error del servidor. Inténtalo más tarde.";
      } else if (err.message) {
        // Error de la librería o red
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validar formato de email en tiempo real
  const isValidEmail = (email) => {
    return email.endsWith('@uteq.edu.mx') || email === '';
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
            <FiAlertCircle style={{ marginRight: "8px", flexShrink: 0 }} />
            <span>{error}</span>
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
                placeholder="usuario@uteq.edu.mx"
                className={`input-field ${email && !isValidEmail(email) ? 'input-error' : ''}`}
              />
            </div>
            {email && !isValidEmail(email) && (
              <span className="error-message">Solo correos @uteq.edu.mx</span>
            )}
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
            disabled={isSubmitting || (email && !isValidEmail(email))}
          >
            <FiLogIn className="button-icon" />
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <div className="form-footer">
          <p>
            ¿Olvidaste tu contraseña?
            <Link to="/recuperar" className="switch-link">
              Restablécela aquí
            </Link>
          </p>
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
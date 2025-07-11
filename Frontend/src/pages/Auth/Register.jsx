  import React, { useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import registerImage from "../../assets/inicio.jpg";
  import { FiUser, FiMail, FiLock, FiBook, FiUserPlus } from "react-icons/fi";
  import "./Auth.css";
  import authService from "../../services/authService";

  export default function Register() {
    const [formData, setFormData] = useState({
      name: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      career: "",
    });

    const [passwordMatch, setPasswordMatch] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "password" || name === "confirmPassword") {
        setPasswordMatch(
          name === "password"
            ? value === formData.confirmPassword
            : value === formData.password
        );
      }
    };
    const isPasswordSecure = (password) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      return regex.test(password);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);

      if (!passwordMatch) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (!isPasswordSecure(formData.password)) {
        setError(
          "La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y un carácter especial."
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const userData = {
          firstName: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          career: formData.career,
        };

        const response = await authService.register(userData);
        localStorage.setItem("authToken", response.token);
        navigate("/");
      } catch (err) {
        setError(
          err.message || "Error al registrar. Por favor, inténtalo de nuevo."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="auth-container">
        <div className="auth-image">
          <img src={registerImage} alt="Registro visual" />
        </div>
        <div className="divider-line"></div>
        <div className="auth-form">
          <div className="form-header">
            <h2>Crear Cuenta</h2>
            <p>Comienza tu journey académico</p>
          </div>

          {error && <div className="error-message global-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form-body">
            <div className="input-row">
              <div className="input-group">
                <div className="input-container">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-container">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Apellido"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-container">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@email.com"
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <div className="input-container">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Contraseña"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-container">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirmar"
                    className={`input-field ${
                      !passwordMatch ? "input-error" : ""
                    }`}
                  />
                  {!passwordMatch && (
                    <p className="error-message">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-container">
                <FiBook className="input-icon" />
                <select
                  name="career"
                  value={formData.career}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Selecciona tu carrera</option>
                  <option value="Mecatrónica">Mecatrónica</option>
                  <option value="Desarrollo de Software">
                    Desarrollo de Software
                  </option>
                  <option value="Redes Inteligentes">Redes Inteligentes</option>
                </select>
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={isSubmitting}>
              <FiUserPlus className="button-icon" />
              {isSubmitting ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <div className="form-footer">
            <p>
              ¿Ya tienes cuenta?
              <Link to="/login" className="switch-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiLock, FiBook, FiUserPlus, FiUsers, FiToggleLeft, FiToggleRight, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../../api/api";

export default function CoordinatorsManager() {
  const [coordinators, setCoordinators] = useState([]);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    carrera: "",
  });

  useEffect(() => {
    fetchCoordinators();
    fetchStats();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const response = await api.get("/auth/coordinators");
      setCoordinators(response.data.coordinators);
    } catch (err) {
      setError("Error al cargar coordinadores");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/auth/users/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email) => {
    return email.endsWith('@uteq.edu.mx');
  };

  const isPasswordSecure = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (!isValidEmail(formData.email)) {
      setError("Solo se aceptan correos institucionales @uteq.edu.mx");
      return;
    }

    if (!isPasswordSecure(formData.password)) {
      setError("La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/coordinators", formData);
      setSuccess("Coordinador creado exitosamente");
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        carrera: "",
      });
      setShowCreateForm(false);
      fetchCoordinators();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear coordinador");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCoordinatorStatus = async (id, currentStatus) => {
    try {
      await api.put(`/auth/coordinators/${id}/toggle-status`, {
        activo: !currentStatus
      });
      setSuccess(`Coordinador ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      fetchCoordinators();
      fetchStats();
    } catch (err) {
      setError("Error al cambiar estado del coordinador");
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando coordinadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>
          <FiUsers className="header-icon" />
          Gestión de Coordinadores
        </h1>
        <p className="admin-subtitle">
          Administra los coordinadores del sistema y sus permisos
        </p>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <FiUserPlus />
          {showCreateForm ? "Cancelar" : "Crear Coordinador"}
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span>{success}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.generalStats.total_coordinators}</div>
              <div className="stat-label">Total Coordinadores</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">
                {coordinators.filter(c => c.activo).length}
              </div>
              <div className="stat-label">Activos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-number">
                {coordinators.filter(c => !c.activo).length}
              </div>
              <div className="stat-label">Inactivos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <div className="stat-number">{stats.generalStats.total_students}</div>
              <div className="stat-label">Estudiantes</div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="admin-card">
          <div className="card-header">
            <h3>Crear Nuevo Coordinador</h3>
          </div>
          <form onSubmit={handleCreateCoordinator} className="admin-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <FiUser className="label-icon" />
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Nombre del coordinador"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiUser className="label-icon" />
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Apellido del coordinador"
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">
                  <FiMail className="label-icon" />
                  Email Institucional
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${formData.email && !isValidEmail(formData.email) ? 'input-error' : ''}`}
                  placeholder="coordinador@uteq.edu.mx"
                />
                {formData.email && !isValidEmail(formData.email) && (
                  <small className="error-message">Solo correos @uteq.edu.mx</small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiLock className="label-icon" />
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${formData.password && !isPasswordSecure(formData.password) ? 'input-error' : ''}`}
                  placeholder="Contraseña segura"
                />
                {formData.password && !isPasswordSecure(formData.password) && (
                  <small className="error-message">
                    8+ caracteres, mayúsculas, minúsculas, números y símbolos
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiBook className="label-icon" />
                  Carrera
                </label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">Seleccionar carrera</option>
                  <option value="Mecatrónica">Mecatrónica</option>
                  <option value="Desarrollo de Software">Desarrollo de Software</option>
                  <option value="Redes Inteligentes">Redes Inteligentes</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creando..." : "Crear Coordinador"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de coordinadores */}
      <div className="admin-card">
        <div className="card-header">
          <h3>Coordinadores Registrados</h3>
        </div>
        <div className="coordinators-list">
          {coordinators.length === 0 ? (
            <div className="empty-state">
              <FiUsers size={48} />
              <h3>No hay coordinadores registrados</h3>
              <p>Crea el primer coordinador usando el botón superior</p>
            </div>
          ) : (
            <div className="coordinators-grid">
              {coordinators.map((coordinator) => (
                <div key={coordinator.id_usuario} className="coordinator-card">
                  <div className="coordinator-header">
                    <div className="coordinator-avatar">
                      {coordinator.nombre.charAt(0)}{coordinator.apellido.charAt(0)}
                    </div>
                    <div className="coordinator-info">
                      <h4>{coordinator.nombre} {coordinator.apellido}</h4>
                      <p className="coordinator-email">{coordinator.email}</p>
                      <span className="coordinator-career">{coordinator.carrera}</span>
                    </div>
                  </div>
                  
                  <div className="coordinator-meta">
                    <span className="coordinator-date">
                      Registrado: {new Date(coordinator.fecha_creacion).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  <div className="coordinator-actions">
                    <span className={`status-badge ${coordinator.activo ? 'active' : 'inactive'}`}>
                      {coordinator.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      className={`toggle-btn ${coordinator.activo ? 'active' : 'inactive'}`}
                      onClick={() => toggleCoordinatorStatus(coordinator.id_usuario, coordinator.activo)}
                      title={coordinator.activo ? 'Desactivar' : 'Activar'}
                    >
                      {coordinator.activo ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas por carrera */}
      {stats && stats.careerStats && (
        <div className="admin-card">
          <div className="card-header">
            <h3>Distribución por Carrera</h3>
          </div>
          <div className="career-stats">
            {stats.careerStats.map((career) => (
              <div key={career.carrera} className="career-stat-item">
                <div className="career-name">{career.carrera}</div>
                <div className="career-numbers">
                  <span className="career-coordinators">
                    {career.coordinators} coordinador{career.coordinators !== 1 ? 'es' : ''}
                  </span>
                  <span className="career-students">
                    {career.students} estudiante{career.students !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4e73df;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .header-icon {
          margin-right: 0.5rem;
        }

        .label-icon {
          margin-right: 0.5rem;
          font-size: 0.875rem;
        }

        .input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .coordinators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .coordinator-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .coordinator-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .coordinator-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .coordinator-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4e73df, #224abe);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .coordinator-info h4 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          font-size: 1.125rem;
        }

        .coordinator-email {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .coordinator-career {
          background: #f3f4f6;
          color: #4e73df;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .coordinator-meta {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .coordinator-date {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .coordinator-actions {
          display: flex;
          justify-content: between;
          align-items: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          color: #6b7280;
          transition: color 0.2s;
        }

        .toggle-btn:hover {
          color: #374151;
        }

        .toggle-btn.active {
          color: #059669;
        }

        .toggle-btn.inactive {
          color: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem 0;
          color: #374151;
        }

        .career-stats {
          padding: 1.5rem;
        }

        .career-stat-item {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }

        .career-name {
          font-weight: 600;
          color: #1f2937;
        }

        .career-numbers {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .career-coordinators {
          color: #4e73df;
          font-weight: 500;
        }

        .career-students {
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .coordinators-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .coordinator-actions {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }

          .career-stat-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
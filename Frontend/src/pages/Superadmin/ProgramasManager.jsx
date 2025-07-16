import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "../Superadmin/Superadmin.css";

export default function ProgramasManager() {
  const [misPortafolios, setMisPortafolios] = useState([]);
  const [portafolioSeleccionado, setPortafolioSeleccionado] = useState(null);
  const [programas, setProgramas] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asesoresSeleccionados, setAsesoresSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMisPortafolios();
  }, []);

  const fetchMisPortafolios = async () => {
    try {
      const res = await api.get("/auth/mis-portafolios");
      setMisPortafolios(res.data);
    } catch (error) {
      setMisPortafolios([]);
    }
  };

  const seleccionarPortafolio = async (portafolio) => {
    setPortafolioSeleccionado(portafolio);
    setError("");
    setSuccess("");
    setNombre("");
    setDescripcion("");
    setAsesoresSeleccionados([]);
    // Cargar programas y asesores asignados a este portafolio
    try {
      const resProgramas = await api.get(`/auth/portafolios/${portafolio.id_portafolio}/programas`);
      setProgramas(resProgramas.data);
      const resAsesores = await api.get(`/auth/portafolios/${portafolio.id_portafolio}/asesores`);
      setAsesores(resAsesores.data);
    } catch (error) {
      setError("Error al cargar datos del portafolio");
      setProgramas([]);
      setAsesores([]);
    }
  };

  const handleCrearPrograma = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/auth/portafolios/${portafolioSeleccionado.id_portafolio}/programas`, {
        nombre,
        descripcion,
        asesores: asesoresSeleccionados,
      });
      setSuccess("Programa creado correctamente");
      setNombre("");
      setDescripcion("");
      setAsesoresSeleccionados([]);
      // Recargar programas
      const resProgramas = await api.get(`/auth/portafolios/${portafolioSeleccionado.id_portafolio}/programas`);
      setProgramas(resProgramas.data);
    } catch (error) {
      setError("Error al crear el programa");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Gestión de Programas</h1>
        <p className="admin-subtitle">
          Visualiza tus portafolios y crea programas asignando asesores.
        </p>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button onClick={clearMessages} className="alert-close">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span>{success}</span>
          <button onClick={clearMessages} className="alert-close">
            ×
          </button>
        </div>
      )}

      <div className="admin-content">
        <div className="admin-card">
          <div className="card-header">
            <h3>Mis Portafolios</h3>
          </div>
          {misPortafolios.length === 0 ? (
            <p className="no-portfolios">No has creado portafolios aún.</p>
          ) : (
            <div className="portfolio-grid">
              {misPortafolios.map((p) => (
                <div
                  className={`portfolio-card${portafolioSeleccionado && portafolioSeleccionado.id_portafolio === p.id_portafolio ? " selected" : ""}`}
                  key={p.id_portafolio}
                  onClick={() => seleccionarPortafolio(p)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="portfolio-card-header">
                    <span className="portfolio-name">{p.nombre}</span>
                    <span className="portfolio-career">{p.carrera}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {portafolioSeleccionado && (
          <div className="admin-card" style={{ marginTop: "2rem" }}>
            <div className="card-header">
              <h3>
                Programas de {portafolioSeleccionado.nombre} ({portafolioSeleccionado.carrera})
              </h3>
            </div>
            <ul>
              {programas.length === 0 ? (
                <li>No hay programas registrados para este portafolio.</li>
              ) : (
                programas.map((prog) => (
                  <li key={prog.id_programa}>
                    <strong>{prog.nombre}</strong> - {prog.descripcion}
                  </li>
                ))
              )}
            </ul>
            <div style={{ marginTop: "2rem" }}>
              <h4>Crear nuevo programa</h4>
              <form onSubmit={handleCrearPrograma} className="admin-form">
                <div className="form-group">
                  <label className="form-label">Nombre del programa</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Asesores</label>
                  <select
                    multiple
                    className="form-select"
                    value={asesoresSeleccionados}
                    onChange={e =>
                      setAsesoresSeleccionados(
                        Array.from(e.target.selectedOptions, option => option.value)
                      )
                    }
                    required
                  >
                    {asesores.map((a) => (
                      <option key={a.id_usuario} value={a.id_usuario}>
                        {a.nombre} {a.apellido}
                      </option>
                    ))}
                  </select>
                  <small>
                    {asesores.length === 0
                      ? "No hay asesores asignados a este portafolio"
                      : "Puedes seleccionar uno o varios asesores"}
                  </small>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear programa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
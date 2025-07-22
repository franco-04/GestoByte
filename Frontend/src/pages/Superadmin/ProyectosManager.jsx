import React, { useState, useEffect } from "react";
import proyectosService from "../../services/proyectosService";
import "../Superadmin/Superadmin.css";

export default function ProyectosManager() {
  const [misPortafolios, setMisPortafolios] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [lider, setLider] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMisPortafolios();
  }, []);

  const fetchMisPortafolios = async () => {
    try {
      const res = await proyectosService.getMisPortafolios();
      setMisPortafolios(res);
    } catch {
      setMisPortafolios([]);
    }
  };

  const seleccionarPortafolio = async (portafolio) => {
    setProgramaSeleccionado(null);
    setProyectos([]);
    setEstudiantes([]);
    setEstudiantesSeleccionados([]);
    setLider("");
    setNombre("");
    setDescripcion("");
    try {
      const res = await proyectosService.getProgramasByPortafolio(portafolio.id_portafolio);
      setProgramas(res);
    } catch {
      setProgramas([]);
    }
  };

  const seleccionarPrograma = async (programa) => {
    setProgramaSeleccionado(programa);
    setProyectos([]);
    setEstudiantes([]);
    setEstudiantesSeleccionados([]);
    setLider("");
    setNombre("");
    setDescripcion("");
    try {
      const resProyectos = await proyectosService.getProyectosByPrograma(programa.id_programa);
      setProyectos(resProyectos);
      const resEstudiantes = await proyectosService.getEstudiantesByPrograma(programa.id_programa);
      setEstudiantes(resEstudiantes);
    } catch {
      setProyectos([]);
      setEstudiantes([]);
    }
  };

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await proyectosService.crearProyecto(programaSeleccionado.id_programa, {
        nombre,
        descripcion,
        estudiantes: estudiantesSeleccionados,
        lider,
      });
      setSuccess("Proyecto creado correctamente");
      setNombre("");
      setDescripcion("");
      setEstudiantesSeleccionados([]);
      setLider("");
      const resProyectos = await proyectosService.getProyectosByPrograma(programaSeleccionado.id_programa);
      setProyectos(resProyectos);
    } catch {
      setError("Error al crear el proyecto");
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
        <h1>Gestión de Proyectos</h1>
        <p className="admin-subtitle">
          Crea proyectos dentro de los programas y asigna estudiantes y líder.
        </p>
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

      <div className="admin-content">
        <div className="admin-card">
          <div className="card-header">
            <h3>Mis Portafolios</h3>
          </div>
          <div className="portfolio-grid">
            {misPortafolios.map((p) => (
              <div
                className="portfolio-card"
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
        </div>

        {programas.length > 0 && (
          <div className="admin-card" style={{ marginTop: "2rem" }}>
            <div className="card-header">
              <h3>Programas del Portafolio</h3>
            </div>
            <div className="portfolio-grid">
              {programas.map((prog) => (
                <div
                  className={`portfolio-card${programaSeleccionado && programaSeleccionado.id_programa === prog.id_programa ? " selected" : ""}`}
                  key={prog.id_programa}
                  onClick={() => seleccionarPrograma(prog)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="portfolio-card-header">
                    <span className="portfolio-name">{prog.nombre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {programaSeleccionado && (
          <div className="admin-card" style={{ marginTop: "2rem" }}>
            <div className="card-header">
              <h3>Proyectos de {programaSeleccionado.nombre}</h3>
            </div>
            <ul>
              {proyectos.length === 0 ? (
                <li>No hay proyectos registrados para este programa.</li>
              ) : (
                proyectos.map((proy) => (
                  <li key={proy.id_proyecto}>
                    <strong>{proy.nombre}</strong> - {proy.descripcion}
                  </li>
                ))
              )}
            </ul>
            <div style={{ marginTop: "2rem" }}>
              <h4>Crear nuevo proyecto</h4>
              <form onSubmit={handleCrearProyecto} className="admin-form">
                <div className="form-group">
                  <label className="form-label">Nombre del proyecto</label>
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
                  <label className="form-label">Estudiantes</label>
                  <select
                    multiple
                    className="form-select"
                    value={estudiantesSeleccionados}
                    onChange={e =>
                      setEstudiantesSeleccionados(
                        Array.from(e.target.selectedOptions, option => option.value)
                      )
                    }
                    required
                  >
                    {estudiantes.map((est) => (
                      <option key={est.id_usuario} value={est.id_usuario}>
                        {est.nombre} {est.apellido}
                      </option>
                    ))}
                  </select>
                  <small>
                    {estudiantes.length === 0
                      ? "No hay estudiantes disponibles para esta carrera"
                      : "Selecciona uno o varios estudiantes"}
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Líder del proyecto</label>
                  <select
                    className="form-select"
                    value={lider}
                    onChange={e => setLider(e.target.value)}
                    required
                  >
                    <option value="">Selecciona el líder</option>
                    {estudiantes
                      .filter(est => estudiantesSeleccionados.includes(est.id_usuario.toString()))
                      .map(est => (
                        <option key={est.id_usuario} value={est.id_usuario}>
                          {est.nombre} {est.apellido}
                        </option>
                      ))}
                  </select>
                  <small>
                    El líder debe ser uno de los estudiantes seleccionados.
                  </small>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear proyecto"}
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
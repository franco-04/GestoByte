// src/components/ProyectosManager/ProyectosManager.jsx
import React, { useState, useEffect } from "react";
import proyectosService from "../../../services/proyectosService";
import "./ProyectosManager.css";

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

  // Estados nuevos para crear programa
  const [showCreateProg, setShowCreateProg] = useState(false);
  const [newProgNombre, setNewProgNombre] = useState("");
  const [newProgDesc, setNewProgDesc] = useState("");

  useEffect(() => {
    fetchMisPortafolios();
  }, []);

  const fetchMisPortafolios = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    let data = [];
    if (user.rol === "administrador") {
      data = await proyectosService.getPortafoliosAsignados();
    } else {
      data = await proyectosService.getMisPortafolios();
    }
    setMisPortafolios(data);
  } catch {
    setMisPortafolios([]);
  }
};
  const resetForm = () => {
    setProgramas([]);
    setProyectos([]);
    setEstudiantes([]);
    setEstudiantesSeleccionados([]);
    setLider("");
    setNombre("");
    setDescripcion("");
    setShowCreateProg(false);
    setNewProgNombre("");
    setNewProgDesc("");
  };

  const seleccionarPortafolio = async (portafolio) => {
    resetForm();
    try {
      const data = await proyectosService.getProgramasByPortafolio(
        portafolio.id_portafolio
      );
      setProgramas(data);
      setProgramaSeleccionado({
        ...portafolio,
        id_portafolio: portafolio.id_portafolio,
      });
    } catch {
      setProgramas([]);
    }
  };

  const seleccionarPrograma = async (prog) => {
    resetForm();
    setProgramaSeleccionado(prog);
    try {
      const proys = await proyectosService.getProyectosByPrograma(
        prog.id_programa
      );
      setProyectos(proys);
      const ests = await proyectosService.getEstudiantesByPrograma(
        prog.id_programa
      );
      setEstudiantes(ests);
    } catch {
      setProyectos([]);
      setEstudiantes([]);
    }
  };

  const handleCrearPrograma = async () => {
    if (!newProgNombre.trim()) return;
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    setLoading(true);
    try {
      await proyectosService.createPrograma(
        programaSeleccionado.id_portafolio,
        {
          nombre: newProgNombre,
          descripcion: newProgDesc,
          asesores: [user.id],
        }
      );
      const updated = await proyectosService.getProgramasByPortafolio(
        programaSeleccionado.id_portafolio
      );
      setProgramas(updated);
      setShowCreateProg(false);
      setNewProgNombre("");
      setNewProgDesc("");
    } catch {
      setError("Error al crear programa");
    } finally {
      setLoading(false);
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
      resetForm();
      const updated = await proyectosService.getProyectosByPrograma(
        programaSeleccionado.id_programa
      );
      setProyectos(updated);
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
        {/* Mis Portafolios */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Mis Portafolios</h3>
          </div>
          <div className="portfolio-grid">
            {misPortafolios.map((p) => (
              <div
                key={p.id_portafolio}
                className="portfolio-card"
                onClick={() => seleccionarPortafolio(p)}
              >
                <div className="portfolio-card-header">
                  <span className="portfolio-name">{p.nombre}</span>
                  <span className="portfolio-career">{p.carrera}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Programas + crear programa */}
        {programas.length > 0 && (
          <div className="admin-card" style={{ marginTop: "2rem" }}>
            <div
              className="card-header"
              style={{ display: "flex", alignItems: "center" }}
            >
              <h3>Programas del Portafolio</h3>
              <button
                className="btn btn-sm"
                style={{ marginLeft: "auto" }}
                onClick={() => setShowCreateProg(!showCreateProg)}
              >
                {showCreateProg ? "Cancelar" : "Crear Programa"}
              </button>
            </div>
            {showCreateProg && (
              <div className="create-program-form">
                <div className="form-group">
                  <label className="form-label">Nombre del Programa</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Programa de Innovación"
                    value={newProgNombre}
                    onChange={(e) => setNewProgNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe brevemente el programa (opcional)"
                    value={newProgDesc}
                    onChange={(e) => setNewProgDesc(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCrearPrograma}
                    disabled={loading}
                  >
                    {loading ? "Creando…" : "Guardar Programa"}
                  </button>
                </div>
              </div>
            )}

            <div className="portfolio-grid">
              {programas.map((prog) => (
                <div
                  key={prog.id_programa}
                  className={`portfolio-card${
                    programaSeleccionado?.id_programa === prog.id_programa
                      ? " selected"
                      : ""
                  }`}
                  onClick={() => seleccionarPrograma(prog)}
                >
                  <div className="portfolio-card-header">
                    <span className="portfolio-name">{prog.nombre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proyectos y creación de proyecto */}
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
                  <div className="estudiantes-list">
                    {estudiantes.map((est) => {
                      const id = est.id_usuario.toString();
                      const isSel = estudiantesSeleccionados.includes(id);
                      return (
                        <div
                          key={id}
                          className={`estudiante-item${
                            isSel ? " selected" : ""
                          }`}
                          onClick={() => {
                            if (isSel) {
                              setEstudiantesSeleccionados(
                                estudiantesSeleccionados.filter(
                                  (eid) => eid !== id
                                )
                              );
                              if (lider === id) setLider("");
                            } else {
                              setEstudiantesSeleccionados([
                                ...estudiantesSeleccionados,
                                id,
                              ]);
                            }
                          }}
                        >
                          {est.nombre} {est.apellido}
                        </div>
                      );
                    })}
                  </div>
                  <small>
                    {estudiantes.length === 0
                      ? "No hay estudiantes disponibles"
                      : "Haz clic para seleccionar/deseleccionar"}
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Líder del proyecto</label>
                  <select
                    className="form-select"
                    value={lider}
                    onChange={(e) => setLider(e.target.value)}
                    required
                  >
                    <option value="">Selecciona el líder</option>
                    {estudiantes
                      .filter((est) =>
                        estudiantesSeleccionados.includes(
                          est.id_usuario.toString()
                        )
                      )
                      .map((est) => (
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

import React, { useState, useEffect } from "react";
import { AiOutlineArrowLeft, AiOutlineTeam, AiOutlineTrophy, AiOutlineCalendar, AiOutlineFlag, AiOutlineEye, AiOutlineUser } from "react-icons/ai";
import proyectosService from "../../services/proyectosService";
import "../Admin/Admin.css";

export default function ProgramasManager() {
  // Estados principales
  const [vista, setVista] = useState("portafolios"); // portafolios -> programas -> detalle
  const [portafolioSeleccionado, setPortafolioSeleccionado] = useState(null);
  const [programaSeleccionado, setProgramaSeleccionado] = useState(null);

  // Estados de datos
  const [portafolios, setPortafolios] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [programaDetalle, setProgramaDetalle] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estados para crear programa
  const [nombrePrograma, setNombrePrograma] = useState("");
  const [descripcionPrograma, setDescripcionPrograma] = useState("");
  const [categoriaPrograma, setCategoriaPrograma] = useState("Social");
  const [asesoresSeleccionados, setAsesoresSeleccionados] = useState([]);

  useEffect(() => {
    if (vista === "portafolios") {
      fetchPortafolios();
    } else if (vista === "programas" && portafolioSeleccionado) {
      fetchProgramas(portafolioSeleccionado.id_portafolio);
      fetchAsesores(portafolioSeleccionado.id_portafolio);
    } else if (vista === "detalle" && programaSeleccionado) {
      fetchProgramaDetalle(programaSeleccionado.id_programa);
    }
  }, [vista, portafolioSeleccionado, programaSeleccionado]);

  const fetchPortafolios = async () => {
    setLoading(true);
    try {
      const data = await proyectosService.getMisPortafolios();
      setPortafolios(data);
    } catch (error) {
      setError("Error al cargar portafolios");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramas = async (idPortafolio) => {
    setLoading(true);
    try {
      const data = await proyectosService.getProgramasByPortafolio(idPortafolio);
      setProgramas(data);
    } catch (error) {
      setError("Error al cargar programas");
    } finally {
      setLoading(false);
    }
  };

  const fetchAsesores = async (idPortafolio) => {
    try {
      const data = await proyectosService.getAsesoresPortafolio(idPortafolio);
      setAsesores(data);
    } catch (error) {
      console.error("Error al cargar asesores:", error);
    }
  };

  const fetchProgramaDetalle = async (idPrograma) => {
    setLoading(true);
    try {
      // Obtener proyectos del programa
      const proyectosData = await proyectosService.getProyectosByPrograma(idPrograma);
      setProyectos(proyectosData);

      // Simular datos de detalle del programa (hasta que tengas el endpoint)
      const programaInfo = programas.find(p => p.id_programa === idPrograma);
      
      const detalle = {
        programa: {
          ...programaInfo,
          total_proyectos: proyectosData.length,
          proyectos_activos: proyectosData.filter(p => p.activo).length,
          total_estudiantes: 0, // Se calculará cuando tengamos los datos de estudiantes por proyecto
          portafolio_nombre: portafolioSeleccionado?.nombre,
          carrera: portafolioSeleccionado?.carrera
        },
        proyectos: proyectosData,
        asesores: asesores.filter(a => 
          programaInfo?.asesores?.includes(a.id_usuario) || 
          programaInfo?.id_coordinador === a.id_usuario
        )
      };

      // Calcular total de estudiantes únicos
      let estudiantesUnicos = new Set();
      for (const proyecto of proyectosData) {
        try {
          const estudiantes = await proyectosService.getEstudiantesProyecto(idPrograma, proyecto.id_proyecto);
          estudiantes.forEach(e => estudiantesUnicos.add(e.id_usuario));
        } catch (error) {
          console.error("Error al obtener estudiantes del proyecto:", error);
        }
      }
      detalle.programa.total_estudiantes = estudiantesUnicos.size;

      setProgramaDetalle(detalle);
    } catch (error) {
      console.error("Error al cargar detalle del programa:", error);
      setError("Error al cargar detalles del programa");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPortafolio = (portafolio) => {
    setPortafolioSeleccionado(portafolio);
    setProgramaSeleccionado(null);
    setVista("programas");
  };

  const seleccionarPrograma = (programa) => {
    setProgramaSeleccionado(programa);
    setVista("detalle");
  };

  const volver = () => {
    if (vista === "detalle") {
      setVista("programas");
    } else if (vista === "programas") {
      setVista("portafolios");
    }
  };

  const crearPrograma = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await proyectosService.createPrograma(portafolioSeleccionado.id_portafolio, {
        nombre: nombrePrograma,
        descripcion: descripcionPrograma,
        categoria: categoriaPrograma,
        asesores: asesoresSeleccionados
      });
      
      setSuccess("Programa creado exitosamente");
      setShowCreateModal(false);
      limpiarFormulario();
      fetchProgramas(portafolioSeleccionado.id_portafolio);
    } catch (error) {
      setError("Error al crear el programa");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNombrePrograma("");
    setDescripcionPrograma("");
    setCategoriaPrograma("Social");
    setAsesoresSeleccionados([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      'Social': '#10b981',
      'Estrategico': '#3b82f6',
      'Operativo': '#f59e0b',
      'Investigacion': '#8b5cf6',
      'Personal': '#ef4444'
    };
    return colores[categoria] || '#6b7280';
  };

  const getCategoriaIcon = (categoria) => {
    const iconos = {
      'Social': '🤝',
      'Estrategico': '🎯',
      'Operativo': '⚙️',
      'Investigacion': '🔬',
      'Personal': '👤'
    };
    return iconos[categoria] || '📁';
  };

  return (
    <div className="admin-section">
      {/* Header con navegación */}
      <div className="admin-header">
        <div className="header-with-back">
          {vista !== "portafolios" && (
            <button className="btn btn-secondary" onClick={volver}>
              <AiOutlineArrowLeft /> Volver
            </button>
          )}
          <div>
            <h1>
              {vista === "portafolios" && "Gestión de Programas"}
              {vista === "programas" && `Programas - ${portafolioSeleccionado?.nombre}`}
              {vista === "detalle" && `Detalles - ${programaSeleccionado?.nombre}`}
            </h1>
            <p className="admin-subtitle">
              {vista === "portafolios" && "Selecciona un portafolio para gestionar sus programas"}
              {vista === "programas" && "Lista de programas del portafolio"}
              {vista === "detalle" && "Información detallada del programa y sus proyectos"}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
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
        {loading && (
          <div className="loading-container">
            <p>Cargando...</p>
          </div>
        )}

        {/* Vista: Lista de Portafolios */}
        {vista === "portafolios" && !loading && (
          <div className="admin-card">
            {portafolios.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No tienes portafolios</h3>
                <p>Crea un portafolio primero para poder gestionar programas.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {portafolios.map((portafolio) => (
                  <div className="portfolio-card" key={portafolio.id_portafolio}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{portafolio.nombre}</span>
                      <span className="portfolio-career">{portafolio.carrera}</span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{portafolio.descripcion}</p>
                      <div>
                        <span className="portfolio-label">Fecha creación:</span>{" "}
                        <span>{formatDate(portafolio.fecha_creacion)}</span>
                      </div>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => seleccionarPortafolio(portafolio)}
                      >
                        Ver Programas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Lista de Programas */}
        {vista === "programas" && !loading && (
          <div className="admin-card">
            <div className="card-header">
              <h3>Programas del portafolio</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Crear Programa
              </button>
            </div>
            
            {programas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                <h3>No hay programas</h3>
                <p>Crea el primer programa en este portafolio.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {programas.map((programa) => (
                  <div className="portfolio-card" key={programa.id_programa}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">
                        {getCategoriaIcon(programa.categoria)} {programa.nombre}
                      </span>
                      <span 
                        className="portfolio-career"
                        style={{ 
                          backgroundColor: getCategoriaColor(programa.categoria),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8em'
                        }}
                      >
                        {programa.categoria}
                      </span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{programa.descripcion}</p>
                      <div>
                        <span className="portfolio-label">Creado:</span>{" "}
                        <span>{formatDate(programa.fecha_creacion)}</span>
                      </div>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => seleccionarPrograma(programa)}
                      >
                        <AiOutlineEye /> Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Detalle del Programa */}
        {vista === "detalle" && !loading && programaDetalle && (
          <div className="admin-content">
            {/* Estadísticas del programa */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="stat-card primary">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-number">{programaDetalle.programa.total_proyectos}</div>
                  <div className="stat-label">Proyectos</div>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{programaDetalle.programa.proyectos_activos}</div>
                  <div className="stat-label">Activos</div>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{programaDetalle.programa.total_estudiantes}</div>
                  <div className="stat-label">Estudiantes</div>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">👨‍🏫</div>
                <div className="stat-content">
                  <div className="stat-number">{programaDetalle.asesores.length}</div>
                  <div className="stat-label">Asesores</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Información del programa */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Información del Programa</h3>
                  <span 
                    className="category-badge"
                    style={{ 
                      backgroundColor: getCategoriaColor(programaDetalle.programa.categoria),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.85em',
                      fontWeight: 'bold'
                    }}
                  >
                    {getCategoriaIcon(programaDetalle.programa.categoria)} {programaDetalle.programa.categoria}
                  </span>
                </div>
                <div className="card-content">
                  <div className="project-info">
                    <div className="info-row">
                      <strong>Descripción:</strong>
                      <p>{programaDetalle.programa.descripcion}</p>
                    </div>
                    <div className="info-row">
                      <strong>Portafolio:</strong>
                      <span>{programaDetalle.programa.portafolio_nombre}</span>
                    </div>
                    <div className="info-row">
                      <strong>Carrera:</strong>
                      <span>{programaDetalle.programa.carrera}</span>
                    </div>
                    <div className="info-row">
                      <strong>Fecha de creación:</strong>
                      <span>{formatDate(programaDetalle.programa.fecha_creacion)}</span>
                    </div>
                    <div className="info-row">
                      <strong>Estado:</strong>
                      <span className={`status-badge ${programaDetalle.programa.activo ? 'active' : 'inactive'}`}>
                        {programaDetalle.programa.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asesores del programa */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Asesores Asignados ({programaDetalle.asesores.length})</h3>
                </div>
                <div className="card-content">
                  <div className="members-list">
                    {programaDetalle.asesores.length === 0 ? (
                      <div className="empty-state">
                        <p>No hay asesores asignados a este programa</p>
                      </div>
                    ) : (
                      programaDetalle.asesores.map((asesor) => (
                        <div key={asesor.id_usuario} className="member-item">
                          <div className="member-info">
                            <div className="member-name">
                              <AiOutlineUser style={{ color: '#3b82f6' }} />
                              <strong>{asesor.nombre} {asesor.apellido}</strong>
                            </div>
                            <div className="member-details">
                              <small>{asesor.email}</small>
                              <br />
                              <small>Carrera: {asesor.carrera}</small>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Proyectos del programa */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Proyectos del Programa</h3>
                  <span className="count-badge">{programaDetalle.proyectos.length} proyectos</span>
                </div>
                <div className="card-content">
                  {programaDetalle.proyectos.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay proyectos en este programa</p>
                      <small>Los proyectos se crean desde la gestión de proyectos</small>
                    </div>
                  ) : (
                    <div className="activities-list">
                      {programaDetalle.proyectos.map((proyecto) => (
                        <div key={proyecto.id_proyecto} className="activity-item">
                          <div className="activity-info">
                            <div className="activity-header">
                              <h4>{proyecto.nombre}</h4>
                              <div className="activity-badges">
                                <span className={`status-badge ${proyecto.activo ? 'active' : 'inactive'}`}>
                                  {proyecto.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </div>
                            <div className="activity-details">
                              <div>
                                <strong>Descripción:</strong> {proyecto.descripcion}
                              </div>
                              <div>
                                <strong>Líder:</strong> ID {proyecto.id_lider}
                              </div>
                              <div>
                                <strong>Creado:</strong> {formatDate(proyecto.fecha_creacion)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Resumen Estadístico</h3>
                </div>
                <div className="card-content">
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-value">{programaDetalle.programa.total_proyectos}</div>
                      <div className="metric-label">Total Proyectos</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{programaDetalle.programa.proyectos_activos}</div>
                      <div className="metric-label">Proyectos Activos</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">
                        {programaDetalle.programa.total_proyectos > 0 
                          ? ((programaDetalle.programa.proyectos_activos / programaDetalle.programa.total_proyectos) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="metric-label">Tasa de Actividad</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{programaDetalle.programa.total_estudiantes}</div>
                      <div className="metric-label">Estudiantes Únicos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear programa */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3>Crear Nuevo Programa</h3>
            <form onSubmit={crearPrograma} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nombre del programa</label>
                <input
                  className="form-input"
                  value={nombrePrograma}
                  onChange={(e) => setNombrePrograma(e.target.value)}
                  placeholder="Ej: Programa de Innovación Tecnológica"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={descripcionPrograma}
                  onChange={(e) => setDescripcionPrograma(e.target.value)}
                  placeholder="Describe los objetivos y alcance del programa"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría del programa</label>
                <select
                  className="form-select"
                  value={categoriaPrograma}
                  onChange={(e) => setCategoriaPrograma(e.target.value)}
                  required
                >
                  <option value="Social">🤝 Social</option>
                  <option value="Estrategico">🎯 Estratégico</option>
                  <option value="Operativo">⚙️ Operativo</option>
                  <option value="Investigacion">🔬 Investigación</option>
                  <option value="Personal">👤 Personal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Asesores asignados</label>
                <div className="students-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {asesores.length === 0 ? (
                    <p className="form-help">No hay asesores disponibles en este portafolio</p>
                  ) : (
                    asesores.map((asesor) => (
                      <label key={asesor.id_usuario} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={asesoresSeleccionados.includes(asesor.id_usuario)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAsesoresSeleccionados([...asesoresSeleccionados, asesor.id_usuario]);
                            } else {
                              setAsesoresSeleccionados(
                                asesoresSeleccionados.filter(id => id !== asesor.id_usuario)
                              );
                            }
                          }}
                        />
                        <span>{asesor.nombre} {asesor.apellido}</span>
                        <small> - {asesor.carrera}</small>
                      </label>
                    ))
                  )}
                </div>
                <small className="form-help">
                  Selecciona los asesores que supervisarán este programa
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    limpiarFormulario();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || asesoresSeleccionados.length === 0}
                >
                  {loading ? "Creando..." : "Crear Programa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
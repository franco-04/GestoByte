import React, { useState, useEffect } from "react";
import {
  AiOutlineArrowLeft,
  AiOutlineTeam,
  AiOutlineTrophy,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineEye,
  AiOutlineFileText,
  AiOutlineProject,
  AiOutlineBarChart,
  AiOutlinePlus,
} from "react-icons/ai";
import proyectosService from "../../../services/proyectosService";
import KanbanBoard from "../../../components/KanbanBoard";

export default function Portafolios() {
  // Estados principales
  const [vista, setVista] = useState("portafolios"); // portafolios -> programas -> proyectos -> detalle
  const [portafolioSeleccionado, setPortafolioSeleccionado] = useState(null);
  const [programaSeleccionado, setProgramaSeleccionado] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // Estados de datos
  const [portafolios, setPortafolios] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateProgModal, setShowCreateProgModal] = useState(false);

  // Estados para crear proyecto
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [descripcionProyecto, setDescripcionProyecto] = useState("");
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [liderSeleccionado, setLiderSeleccionado] = useState("");

  // Estados para crear programa
  const [nombrePrograma, setNombrePrograma] = useState("");
  const [descripcionPrograma, setDescripcionPrograma] = useState("");
  const [categoriaPrograma, setCategoriaPrograma] = useState("Social");

  useEffect(() => {
    if (vista === "portafolios") {
      fetchPortafolios();
    } else if (vista === "programas" && portafolioSeleccionado) {
      fetchProgramas(portafolioSeleccionado.id_portafolio);
    } else if (vista === "proyectos" && programaSeleccionado) {
      fetchProyectos(programaSeleccionado.id_programa);
      fetchEstudiantes(programaSeleccionado.id_programa);
    } else if (vista === "detalle" && proyectoSeleccionado) {
      fetchProyectoDetalle(proyectoSeleccionado.id_proyecto);
    }
  }, [
    vista,
    portafolioSeleccionado,
    programaSeleccionado,
    proyectoSeleccionado,
  ]);

  const fetchPortafolios = async () => {
    setLoading(true);
    try {
      const data = await proyectosService.getPortafoliosAsignados();
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
      const data = await proyectosService.getProgramasByPortafolio(
        idPortafolio
      );
      setProgramas(data);
    } catch (error) {
      setError("Error al cargar programas");
    } finally {
      setLoading(false);
    }
  };

  const fetchProyectos = async (idPrograma) => {
    setLoading(true);
    try {
      const data = await proyectosService.getProyectosByPrograma(idPrograma);
      setProyectos(data);
    } catch (error) {
      setError("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstudiantes = async (idPrograma) => {
    try {
      const data = await proyectosService.getEstudiantesByPrograma(idPrograma);
      setEstudiantes(data);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    }
  };

  const fetchProyectoDetalle = async (idProyecto) => {
    setLoading(true);
    try {
      // Simular respuesta del detalle del proyecto hasta que esté implementada la API
      const detalleSimulado = {
        proyecto: {
          id_proyecto: idProyecto,
          nombre: proyectoSeleccionado.nombre,
          descripcion: proyectoSeleccionado.descripcion,
          fecha_creacion: proyectoSeleccionado.fecha_creacion,
          programa_nombre: programaSeleccionado.nombre,
          portafolio_nombre: portafolioSeleccionado.nombre,
          carrera: "Ingeniería en Sistemas",
          lider_nombre: "Juan",
          lider_apellido: "Pérez",
          lider_email: "juan.perez@email.com",
          total_miembros: 4,
          total_actividades: 12,
          actividades_completadas: 8,
          total_evidencias: 15,
          evidencias_aprobadas: 10,
        },
        miembros: [
          {
            id_usuario: 1,
            nombre: "Juan",
            apellido: "Pérez",
            email: "juan.perez@email.com",
            rol: "lider",
            actividades_asignadas: 5,
            actividades_completadas: 3,
          },
          {
            id_usuario: 2,
            nombre: "María",
            apellido: "González",
            email: "maria.gonzalez@email.com",
            rol: "miembro",
            actividades_asignadas: 4,
            actividades_completadas: 3,
          },
        ],
        actividades_recientes: [
          {
            id_actividad: 1,
            titulo: "Diseñar interfaz de usuario",
            estado: "en_progreso",
            prioridad: "alta",
            fecha_limite: "2024-12-15",
            asignados: "Juan Pérez",
            creador_nombre: "María",
            creador_apellido: "González",
          },
        ],
        reuniones: [
          {
            id_reunion: 1,
            titulo: "Revisión semanal",
            fecha_reunion: "2024-12-10",
            estado: "programada",
            total_participantes: 4,
            confirmados: 3,
          },
        ],
      };
      setProyectoDetalle(detalleSimulado);
    } catch (error) {
      console.error("Error al cargar detalle del proyecto:", error);
      setError("Error al cargar detalles del proyecto");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPortafolio = (portafolio) => {
    setPortafolioSeleccionado(portafolio);
    setProgramaSeleccionado(null);
    setProyectoSeleccionado(null);
    setVista("programas");
  };

  const seleccionarPrograma = (programa) => {
    setProgramaSeleccionado(programa);
    setProyectoSeleccionado(null);
    setVista("proyectos");
  };

  const seleccionarProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setVista("detalle");
  };

  const verKanban = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setVista("kanban");
  };

  const volver = () => {
    if (vista === "kanban") {
      setVista("detalle");
    } else if (vista === "detalle") {
      setVista("proyectos");
    } else if (vista === "proyectos") {
      setVista("programas");
    } else if (vista === "programas") {
      setVista("portafolios");
    }
  };

  const crearPrograma = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "{}");
      await proyectosService.createPrograma(
        portafolioSeleccionado.id_portafolio,
        {
          nombre: nombrePrograma,
          descripcion: descripcionPrograma,
          categoria: categoriaPrograma,
          asesores: [user.id],
        }
      );

      setSuccess("Programa creado exitosamente");
      setShowCreateProgModal(false);
      limpiarFormularioPrograma();
      fetchProgramas(portafolioSeleccionado.id_portafolio);
    } catch (error) {
      setError("Error al crear el programa");
    } finally {
      setLoading(false);
    }
  };

  const crearProyecto = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await proyectosService.crearProyecto(programaSeleccionado.id_programa, {
        nombre: nombreProyecto,
        descripcion: descripcionProyecto,
        estudiantes: estudiantesSeleccionados,
        lider: liderSeleccionado,
      });

      setSuccess("Proyecto creado exitosamente");
      setShowCreateModal(false);
      limpiarFormulario();
      fetchProyectos(programaSeleccionado.id_programa);
    } catch (error) {
      setError("Error al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNombreProyecto("");
    setDescripcionProyecto("");
    setEstudiantesSeleccionados([]);
    setLiderSeleccionado("");
  };

  const limpiarFormularioPrograma = () => {
    setNombrePrograma("");
    setDescripcionPrograma("");
    setCategoriaPrograma("Social");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getRoleIcon = (rol) => {
    return rol === "lider" ? (
      <AiOutlineTrophy style={{ color: "#f59e0b" }} />
    ) : (
      <AiOutlineTeam style={{ color: "#3b82f6" }} />
    );
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: "#6b7280",
      en_progreso: "#f59e0b",
      revision: "#8b5cf6",
      completado: "#10b981",
    };
    return colores[estado] || "#6b7280";
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      baja: "#10b981",
      media: "#f59e0b",
      alta: "#ef4444",
      critica: "#dc2626",
    };
    return colores[prioridad] || "#6b7280";
  };

  const handleLiderChange = (e) => {
    const liderId = parseInt(e.target.value);
    setLiderSeleccionado(liderId);

    if (liderId && !estudiantesSeleccionados.includes(liderId)) {
      setEstudiantesSeleccionados([...estudiantesSeleccionados, liderId]);
    }
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
              {vista === "portafolios" && "Gestión de Portafolios"}
              {vista === "programas" &&
                `Programas - ${portafolioSeleccionado?.nombre}`}
              {vista === "proyectos" &&
                `Proyectos - ${programaSeleccionado?.nombre}`}
              {vista === "detalle" &&
                `Detalles - ${proyectoSeleccionado?.nombre}`}
              {vista === "kanban" &&
                `Tablero Kanban - ${proyectoSeleccionado?.nombre}`}
            </h1>
            <p className="admin-subtitle">
              {vista === "portafolios" &&
                "Selecciona un portafolio para gestionar sus programas y proyectos"}
              {vista === "programas" && "Gestiona los programas del portafolio"}
              {vista === "proyectos" && "Lista de proyectos del programa"}
              {vista === "detalle" && "Información detallada del proyecto"}
              {vista === "kanban" && "Tablero de actividades del proyecto"}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
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
        {loading && (
          <div className="loading-container">
            <p>Cargando...</p>
          </div>
        )}

        {/* Vista: Lista de Portafolios */}
        {vista === "portafolios" && !loading && (
          <div className="admin-card">
            <div className="card-header">
              <h3>Mis Portafolios</h3>
            </div>
            {portafolios.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No tienes portafolios</h3>
                <p>Contacta al administrador para que te asigne portafolios.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {portafolios.map((portafolio) => (
                  <div
                    className="portfolio-card"
                    key={portafolio.id_portafolio}
                  >
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">
                        {portafolio.nombre}
                      </span>
                      <span className="portfolio-career">
                        {portafolio.carrera}
                      </span>
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
                        <AiOutlineProject /> Ver Programas
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
              <h3>Programas del Portafolio</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateProgModal(true)}
              >
                <AiOutlinePlus /> Crear Programa
              </button>
            </div>
            {programas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                <h3>No hay programas</h3>
                <p>
                  Crea el primer programa en este portafolio para organizar
                  proyectos.
                </p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {programas.map((programa) => (
                  <div className="portfolio-card" key={programa.id_programa}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{programa.nombre}</span>
                      <span className="portfolio-career">
                        {programa.categoria}
                      </span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{programa.descripcion}</p>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => seleccionarPrograma(programa)}
                      >
                        <AiOutlineBarChart /> Ver Proyectos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Lista de Proyectos */}
        {vista === "proyectos" && !loading && (
          <div className="admin-card">
            <div className="card-header">
              <h3>Proyectos del programa</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <AiOutlinePlus /> Crear Proyecto
              </button>
            </div>

            {proyectos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No hay proyectos</h3>
                <p>Crea el primer proyecto en este programa.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {proyectos.map((proyecto) => (
                  <div className="portfolio-card" key={proyecto.id_proyecto}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{proyecto.nombre}</span>
                      <span className="portfolio-career">
                        {formatDate(proyecto.fecha_creacion)}
                      </span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{proyecto.descripcion}</p>
                      <div>
                        <span className="portfolio-label">Líder:</span>{" "}
                        <span>ID {proyecto.id_lider}</span>
                      </div>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => seleccionarProyecto(proyecto)}
                        style={{ marginRight: "0.5rem" }}
                      >
                        <AiOutlineEye /> Ver Detalles
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => verKanban(proyecto)}
                      >
                        Tablero
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista: Detalle del Proyecto */}
        {vista === "detalle" && !loading && proyectoDetalle && (
          <div className="admin-content">
            {/* Estadísticas del proyecto */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="stat-card primary">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {proyectoDetalle.proyecto.total_miembros}
                  </div>
                  <div className="stat-label">Miembros</div>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {proyectoDetalle.proyecto.total_actividades}
                  </div>
                  <div className="stat-label">Actividades</div>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {proyectoDetalle.proyecto.actividades_completadas}
                  </div>
                  <div className="stat-label">Completadas</div>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">📄</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {proyectoDetalle.proyecto.evidencias_aprobadas}/
                    {proyectoDetalle.proyecto.total_evidencias}
                  </div>
                  <div className="stat-label">Evidencias</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Información del proyecto */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Información del Proyecto</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => verKanban(proyectoSeleccionado)}
                  >
                    Ver Tablero Kanban
                  </button>
                </div>
                <div className="card-content">
                  <div className="project-info">
                    <div className="info-row">
                      <strong>Descripción:</strong>
                      <p>{proyectoDetalle.proyecto.descripcion}</p>
                    </div>
                    <div className="info-row">
                      <strong>Programa:</strong>
                      <span>{proyectoDetalle.proyecto.programa_nombre}</span>
                    </div>
                    <div className="info-row">
                      <strong>Portafolio:</strong>
                      <span>{proyectoDetalle.proyecto.portafolio_nombre}</span>
                    </div>
                    <div className="info-row">
                      <strong>Carrera:</strong>
                      <span>{proyectoDetalle.proyecto.carrera}</span>
                    </div>
                    <div className="info-row">
                      <strong>Líder del proyecto:</strong>
                      <span>
                        {proyectoDetalle.proyecto.lider_nombre}{" "}
                        {proyectoDetalle.proyecto.lider_apellido}
                        <br />
                        <small>{proyectoDetalle.proyecto.lider_email}</small>
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Creado:</strong>
                      <span>
                        {formatDate(proyectoDetalle.proyecto.fecha_creacion)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Miembros del equipo */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>
                    Miembros del Equipo ({proyectoDetalle.miembros.length})
                  </h3>
                </div>
                <div className="card-content">
                  <div className="members-list">
                    {proyectoDetalle.miembros.map((miembro) => (
                      <div key={miembro.id_usuario} className="member-item">
                        <div className="member-info">
                          <div className="member-name">
                            {getRoleIcon(miembro.rol)}
                            <strong>
                              {miembro.nombre} {miembro.apellido}
                            </strong>
                            {miembro.rol === "lider" && (
                              <span className="role-badge leader">Líder</span>
                            )}
                          </div>
                          <div className="member-details">
                            <small>{miembro.email}</small>
                          </div>
                          <div className="member-stats">
                            <span className="stat">
                              {miembro.actividades_completadas}/
                              {miembro.actividades_asignadas} actividades
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actividades recientes */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Actividades Recientes</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => verKanban(proyectoSeleccionado)}
                  >
                    Ver Todas
                  </button>
                </div>
                <div className="card-content">
                  {proyectoDetalle.actividades_recientes.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay actividades registradas</p>
                    </div>
                  ) : (
                    <div className="activities-list">
                      {proyectoDetalle.actividades_recientes.map(
                        (actividad) => (
                          <div
                            key={actividad.id_actividad}
                            className="activity-item"
                          >
                            <div className="activity-info">
                              <div className="activity-header">
                                <h4>{actividad.titulo}</h4>
                                <div className="activity-badges">
                                  <span
                                    className="status-badge"
                                    style={{
                                      backgroundColor: getEstadoColor(
                                        actividad.estado
                                      ),
                                    }}
                                  >
                                    {actividad.estado}
                                  </span>
                                  <span
                                    className="priority-badge"
                                    style={{
                                      backgroundColor: getPrioridadColor(
                                        actividad.prioridad
                                      ),
                                    }}
                                  >
                                    {actividad.prioridad}
                                  </span>
                                </div>
                              </div>
                              <div className="activity-details">
                                <div>
                                  <strong>Asignados:</strong>{" "}
                                  {actividad.asignados || "Sin asignar"}
                                </div>
                                {actividad.fecha_limite && (
                                  <div>
                                    <strong>Fecha límite:</strong>{" "}
                                    {formatDate(actividad.fecha_limite)}
                                  </div>
                                )}
                                <div>
                                  <strong>Creado por:</strong>{" "}
                                  {actividad.creador_nombre}{" "}
                                  {actividad.creador_apellido}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reuniones del proyecto */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>Reuniones Recientes</h3>
                </div>
                <div className="card-content">
                  {proyectoDetalle.reuniones.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay reuniones programadas</p>
                    </div>
                  ) : (
                    <div className="meetings-list">
                      {proyectoDetalle.reuniones.map((reunion) => (
                        <div key={reunion.id_reunion} className="meeting-item">
                          <div className="meeting-info">
                            <h4>{reunion.titulo}</h4>
                            <div className="meeting-details">
                              <div>
                                <AiOutlineCalendar />
                                <span>{formatDate(reunion.fecha_reunion)}</span>
                              </div>
                              <div>
                                <AiOutlineTeam />
                                <span>
                                  {reunion.confirmados}/
                                  {reunion.total_participantes} confirmados
                                </span>
                              </div>
                              <div>
                                <AiOutlineFlag />
                                <span className={`status-${reunion.estado}`}>
                                  {reunion.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista: Tablero Kanban */}
        {vista === "kanban" && proyectoSeleccionado && (
          <div className="kanban-container">
            <KanbanBoard
              projectId={proyectoSeleccionado.id_proyecto}
              userRole="coordinador"
              apiEndpoint={`/auth/proyectos/${proyectoSeleccionado.id_proyecto}/actividades`}
            />
          </div>
        )}
      </div>

      {/* Modal para crear programa */}
      {showCreateProgModal && (
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
                  <option value="Social">Social</option>
                  <option value="Estrategico">Estratégico</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Investigacion">Investigación</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateProgModal(false);
                    limpiarFormularioPrograma();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Programa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear proyecto */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3>Crear Nuevo Proyecto</h3>
            <form onSubmit={crearProyecto} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nombre del proyecto</label>
                <input
                  className="form-input"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  placeholder="Ej: Sistema de gestión académica"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={descripcionProyecto}
                  onChange={(e) => setDescripcionProyecto(e.target.value)}
                  placeholder="Describe los objetivos y alcance del proyecto"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Líder del proyecto</label>
                <select
                  className="form-select"
                  value={liderSeleccionado}
                  onChange={handleLiderChange}
                  required
                >
                  <option value="">Seleccione el líder</option>
                  {estudiantes.map((estudiante) => (
                    <option
                      key={estudiante.id_usuario}
                      value={estudiante.id_usuario}
                    >
                      {estudiante.nombre} {estudiante.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Miembros del equipo (incluyendo el líder)
                </label>
                <div
                  className="students-grid"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {estudiantes.map((estudiante) => (
                    <label
                      key={estudiante.id_usuario}
                      className="checkbox-label"
                    >
                      <input
                        type="checkbox"
                        checked={estudiantesSeleccionados.includes(
                          estudiante.id_usuario
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEstudiantesSeleccionados([
                              ...estudiantesSeleccionados,
                              estudiante.id_usuario,
                            ]);
                          } else {
                            setEstudiantesSeleccionados(
                              estudiantesSeleccionados.filter(
                                (id) => id !== estudiante.id_usuario
                              )
                            );
                          }
                        }}
                      />
                      <span>
                        {estudiante.nombre} {estudiante.apellido}
                      </span>
                    </label>
                  ))}
                </div>
                <small className="form-help">
                  Selecciona todos los estudiantes que participarán en el
                  proyecto
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
                  disabled={loading || estudiantesSeleccionados.length === 0}
                >
                  {loading ? "Creando..." : "Crear Proyecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

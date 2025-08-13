import React, { useState, useEffect } from "react";
import { AiOutlineArrowLeft, AiOutlineTeam, AiOutlineTrophy, AiOutlineCalendar, AiOutlineFlag, AiOutlineEye } from "react-icons/ai";
import api from "../../api/api";
import proyectosService from "../../services/proyectosService";
import KanbanBoard from "../../components/KanbanBoard";
import "../Admin/Admin.css";

export default function ProyectosManager() {
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
  
  // Estados para crear proyecto
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [descripcionProyecto, setDescripcionProyecto] = useState("");
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [liderSeleccionado, setLiderSeleccionado] = useState("");

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
  }, [vista, portafolioSeleccionado, programaSeleccionado, proyectoSeleccionado]);

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


// ✅ FUNCIÓN CORREGIDA (reemplazar por esta):
const fetchProyectoDetalle = async (idProyecto) => {
  setLoading(true);
  try {
    console.log(`📋 [SUPERADMIN] Cargando detalles del proyecto ${idProyecto}`);
    
    // 🔥 USAR EL MISMO SERVICIO que el coordinador
    const data = await proyectosService.getProyectoCompleto(idProyecto);
    console.log("✅ Datos del proyecto obtenidos:", data);
    
    setProyectoDetalle(data);
  } catch (error) {
    console.error("❌ Error al cargar detalle del proyecto:", error);
    setError("Error al cargar detalles del proyecto");
    
    // Si falla la API, intentar construir datos básicos
    try {
      const datosBasicos = {
        proyecto: {
          id_proyecto: idProyecto,
          proyecto_nombre: proyectoSeleccionado?.nombre || "Proyecto sin nombre",
          proyecto_descripcion: proyectoSeleccionado?.descripcion || "Sin descripción",
          fecha_creacion: proyectoSeleccionado?.fecha_creacion,
          programa_nombre: programaSeleccionado?.nombre || "Programa sin nombre",
          portafolio_nombre: portafolioSeleccionado?.nombre || "Portafolio sin nombre",
          carrera: portafolioSeleccionado?.carrera || "Sin carrera",
          lider_nombre: "Sin asignar",
          lider_apellido: "",
          total_actividades: 0,
          actividades_completadas: 0,
          actividades_en_progreso: 0,
          actividades_pendientes: 0,
          actividades_vencidas: 0,
          total_evidencias: 0,
          evidencias_aprobadas: 0,
          total_estudiantes: 0
        },
        actividades: [],
        miembros: [],
        reuniones: []
      };
      setProyectoDetalle(datosBasicos);
    } catch (fallbackError) {
      console.error("Error en datos de respaldo:", fallbackError);
    }
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

  // NUEVA FUNCIÓN: Seleccionar proyecto para ver detalles
  const seleccionarProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setVista("detalle");
  };

  // NUEVA FUNCIÓN: Ver tablero Kanban
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

  const crearProyecto = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await proyectosService.crearProyecto(programaSeleccionado.id_programa, {
        nombre: nombreProyecto,
        descripcion: descripcionProyecto,
        estudiantes: estudiantesSeleccionados,
        lider: liderSeleccionado
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

  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getRoleIcon = (rol) => {
    return rol === 'lider' ? <AiOutlineTrophy style={{ color: '#f59e0b' }} /> : <AiOutlineTeam style={{ color: '#3b82f6' }} />;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#6b7280',
      'en_progreso': '#f59e0b', 
      'revision': '#8b5cf6',
      'completado': '#10b981'
    };
    return colores[estado] || '#6b7280';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      'baja': '#10b981',
      'media': '#f59e0b',
      'alta': '#ef4444',
      'critica': '#dc2626'
    };
    return colores[prioridad] || '#6b7280';
  };


  const handleLiderChange = (e) => {
  const liderId = parseInt(e.target.value);
  setLiderSeleccionado(liderId);
  
  // Automáticamente agregar el líder a los miembros si no está incluido
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
              {vista === "portafolios" && "Gestión de Proyectos"}
              {vista === "programas" && `Programas - ${portafolioSeleccionado?.nombre}`}
              {vista === "proyectos" && `Proyectos - ${programaSeleccionado?.nombre}`}
              {vista === "detalle" && `Detalles - ${proyectoSeleccionado?.nombre}`}
              {vista === "kanban" && `Tablero Kanban - ${proyectoSeleccionado?.nombre}`}
            </h1>
            <p className="admin-subtitle">
              {vista === "portafolios" && "Selecciona un portafolio para gestionar sus proyectos"}
              {vista === "programas" && "Selecciona un programa para ver sus proyectos"}
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
                <p>Crea un portafolio primero para poder gestionar proyectos.</p>
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
            {programas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                <h3>No hay programas</h3>
                <p>Crea programas en este portafolio para organizar proyectos.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {programas.map((programa) => (
                  <div className="portfolio-card" key={programa.id_programa}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{programa.nombre}</span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{programa.descripcion}</p>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => seleccionarPrograma(programa)}
                      >
                        Ver Proyectos
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
                Crear Proyecto
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
                        Creado: {formatDate(proyecto.fecha_creacion)}
                      </span>
                    </div>
                    <div className="portfolio-card-body">
                      <p>{proyecto.descripcion}</p>
                      <div>
                        <span className="portfolio-label">ID Líder:</span>{" "}
                        <span>{proyecto.id_lider}</span>
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
                        Tablero Kanban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

       {/* Vista: Detalle del Proyecto - CORREGIDA */}
{vista === "detalle" && !loading && proyectoDetalle && (
  <div className="admin-content">
    {/* Estadísticas del proyecto */}
    <div className="stats-grid" style={{ marginBottom: "2rem" }}>
      <div className="stat-card primary">
        <div className="stat-icon">👥</div>
        <div className="stat-content">
          <div className="stat-number">
            {proyectoDetalle.proyecto?.total_estudiantes || 0}
          </div>
          <div className="stat-label">Miembros</div>
        </div>
      </div>
      <div className="stat-card info">
        <div className="stat-icon">📋</div>
        <div className="stat-content">
          <div className="stat-number">
            {proyectoDetalle.proyecto?.total_actividades || 0}
          </div>
          <div className="stat-label">Actividades</div>
        </div>
      </div>
      <div className="stat-card success">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <div className="stat-number">
            {proyectoDetalle.proyecto?.actividades_completadas || 0}
          </div>
          <div className="stat-label">Completadas</div>
        </div>
      </div>
      <div className="stat-card warning">
        <div className="stat-icon">📄</div>
        <div className="stat-content">
          <div className="stat-number">
            {proyectoDetalle.proyecto?.evidencias_aprobadas || 0}/
            {proyectoDetalle.proyecto?.total_evidencias || 0}
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
              <p>{proyectoDetalle.proyecto?.proyecto_descripcion || proyectoSeleccionado?.descripcion || "Sin descripción"}</p>
            </div>
            <div className="info-row">
              <strong>Programa:</strong>
              <span>{proyectoDetalle.proyecto?.programa_nombre || programaSeleccionado?.nombre || "Sin programa"}</span>
            </div>
            <div className="info-row">
              <strong>Portafolio:</strong>
              <span>{proyectoDetalle.proyecto?.portafolio_nombre || portafolioSeleccionado?.nombre || "Sin portafolio"}</span>
            </div>
            <div className="info-row">
              <strong>Carrera:</strong>
              <span>{proyectoDetalle.proyecto?.carrera || portafolioSeleccionado?.carrera || "Sin carrera"}</span>
            </div>
            <div className="info-row">
              <strong>Líder del proyecto:</strong>
              <span>
                {proyectoDetalle.proyecto?.lider_nombre || "Sin asignar"} {proyectoDetalle.proyecto?.lider_apellido || ""}
                {proyectoDetalle.proyecto?.lider_email && (
                  <>
                    <br />
                    <small>{proyectoDetalle.proyecto.lider_email}</small>
                  </>
                )}
              </span>
            </div>
            <div className="info-row">
              <strong>Creado:</strong>
              <span>{formatDate(proyectoDetalle.proyecto?.fecha_creacion)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Miembros del equipo */}
      {proyectoDetalle.miembros && proyectoDetalle.miembros.length > 0 && (
        <div className="admin-card">
          <div className="card-header">
            <h3>Miembros del Equipo ({proyectoDetalle.miembros.length})</h3>
          </div>
          <div className="card-content">
            <div className="members-list">
              {proyectoDetalle.miembros.map((miembro) => (
                <div key={miembro.id_usuario} className="member-item">
                  <div className="member-info">
                    <div className="member-name">
                      {getRoleIcon(miembro.rol)}
                      <strong>{miembro.nombre} {miembro.apellido}</strong>
                      {miembro.rol === 'lider' && (
                        <span className="role-badge leader">Líder</span>
                      )}
                    </div>
                    <div className="member-details">
                      <small>{miembro.email}</small>
                    </div>
                    <div className="member-stats">
                      <span className="stat">
                        {miembro.actividades_completadas || 0}/{miembro.actividades_asignadas || 0} actividades
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {!proyectoDetalle.actividades || proyectoDetalle.actividades.length === 0 ? (
            <div className="empty-state">
              <p>No hay actividades registradas</p>
            </div>
          ) : (
            <div className="activities-list">
              {proyectoDetalle.actividades.slice(0, 5).map((actividad) => (
                <div key={actividad.id_actividad} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-header">
                      <h4>{actividad.titulo}</h4>
                      <div className="activity-badges">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getEstadoColor(actividad.estado) }}
                        >
                          {actividad.estado}
                        </span>
                        {actividad.prioridad && (
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPrioridadColor(actividad.prioridad) }}
                          >
                            {actividad.prioridad}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="activity-details">
                      <div>
                        <strong>Asignados:</strong> {actividad.asignados || "Sin asignar"}
                      </div>
                      {actividad.fecha_limite && (
                        <div>
                          <strong>Fecha límite:</strong> {formatDate(actividad.fecha_limite)}
                        </div>
                      )}
                      <div>
                        <strong>Creado por:</strong> {actividad.creador_nombre} {actividad.creador_apellido}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reuniones del proyecto */}
      {proyectoDetalle.reuniones && proyectoDetalle.reuniones.length > 0 && (
        <div className="admin-card">
          <div className="card-header">
            <h3>Reuniones Recientes</h3>
          </div>
          <div className="card-content">
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
                        <span>{reunion.confirmados || 0}/{reunion.total_participantes || 0} confirmados</span>
                      </div>
                      <div>
                        <AiOutlineFlag />
                        <span className={`status-${reunion.estado}`}>{reunion.estado}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
                  onChange={handleLiderChange} // Cambiar esta línea
                  required
                >
                  <option value="">Seleccione el líder</option>
                  {estudiantes.map((estudiante) => (
                    <option key={estudiante.id_usuario} value={estudiante.id_usuario}>
                      {estudiante.nombre} {estudiante.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Miembros del equipo (incluyendo el líder)
                </label>
                <div className="students-grid" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {estudiantes.map((estudiante) => (
                    <label key={estudiante.id_usuario} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={estudiantesSeleccionados.includes(estudiante.id_usuario)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEstudiantesSeleccionados([...estudiantesSeleccionados, estudiante.id_usuario]);
                          } else {
                            setEstudiantesSeleccionados(
                              estudiantesSeleccionados.filter(id => id !== estudiante.id_usuario)
                            );
                          }
                        }}
                      />
                      <span>{estudiante.nombre} {estudiante.apellido}</span>
                    </label>
                  ))}
                </div>
                <small className="form-help">
                  Selecciona todos los estudiantes que participarán en el proyecto
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
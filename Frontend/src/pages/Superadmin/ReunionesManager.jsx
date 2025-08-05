import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "../Admin/Admin.css";

export default function ReunionesManager() {
  // Estados para crear reunión
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaReunion, setFechaReunion] = useState("");
  const [horaReunion, setHoraReunion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState(60);
  const [ubicacion, setUbicacion] = useState("");
  const [portafolioSeleccionado, setPortafolioSeleccionado] = useState("");
  
  // NUEVOS ESTADOS para selección de participantes
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  
  // Estados para datos
  const [misPortafolios, setMisPortafolios] = useState([]);
  const [misReuniones, setMisReuniones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    proximas: 0,
    vencidas: 0,
    completadas: 0,
    total: 0
  });
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [reunionEditando, setReunionEditando] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reunionDetalle, setReunionDetalle] = useState(null);

  useEffect(() => {
    fetchPortafolios();
    fetchReuniones();
    fetchEstadisticas();
  }, []);

  const fetchPortafolios = async () => {
    try {
      const res = await api.get("/auth/mis-portafolios");
      setMisPortafolios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener portafolios:", error);
      setMisPortafolios([]);
      if (error.response?.status === 403) {
        setError("No tienes permisos para acceder a los portafolios. Verifica tu rol de usuario.");
      }
    }
  };

  const fetchReuniones = async () => {
    try {
      const res = await api.get("/auth/reuniones/coordinador");
      setMisReuniones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener reuniones:", error);
      setMisReuniones([]);
      if (error.response?.status === 403) {
        setError("No tienes permisos para ver las reuniones. Verifica tu rol de usuario.");
      }
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const res = await api.get("/auth/reuniones/stats");
      setEstadisticas(res.data || {
        proximas: 0,
        vencidas: 0,
        completadas: 0,
        total: 0
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      // No mostrar error para estadísticas ya que no es crítico
    }
  };

  // NUEVA FUNCIÓN: Cargar estudiantes cuando se selecciona un portafolio
  const fetchEstudiantesPortafolio = async (idPortafolio) => {
    if (!idPortafolio) {
      setEstudiantesDisponibles([]);
      setParticipantesSeleccionados([]);
      return;
    }

    setLoadingEstudiantes(true);
    try {
      const res = await api.get(`/auth/portafolios/${idPortafolio}/estudiantes`);
      console.log("Estudiantes recibidos:", res.data);
      setEstudiantesDisponibles(Array.isArray(res.data) ? res.data : []);
      setParticipantesSeleccionados([]); // Limpiar selección anterior
    } catch (error) {
      console.error("Error al obtener estudiantes:", error);
      setEstudiantesDisponibles([]);
      if (error.response?.status !== 403) {
        setError("Error al cargar estudiantes del portafolio");
      }
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  // NUEVA FUNCIÓN: Manejar cambio de portafolio
  const handlePortafolioChange = (e) => {
    const idPortafolio = e.target.value;
    console.log("Portafolio seleccionado:", idPortafolio);
    setPortafolioSeleccionado(idPortafolio);
    if (idPortafolio) {
      fetchEstudiantesPortafolio(idPortafolio);
    } else {
      setEstudiantesDisponibles([]);
      setParticipantesSeleccionados([]);
    }
  };

  // NUEVA FUNCIÓN: Toggle participante
  const toggleParticipante = (estudiante) => {
    const existe = participantesSeleccionados.find(p => p.id_usuario === estudiante.id_usuario);
    
    if (existe) {
      setParticipantesSeleccionados(
        participantesSeleccionados.filter(p => p.id_usuario !== estudiante.id_usuario)
      );
    } else {
      setParticipantesSeleccionados([...participantesSeleccionados, estudiante]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // VALIDACIÓN: Verificar que hay participantes seleccionados
    if (participantesSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un participante para la reunión");
      setLoading(false);
      return;
    }

    try {
      const fechaCompleta = `${fechaReunion} ${horaReunion}:00`;
      
      const data = {
        titulo,
        descripcion,
        fecha_reunion: fechaCompleta,
        duracion_minutos: parseInt(duracionMinutos),
        ubicacion,
        id_portafolio: parseInt(portafolioSeleccionado),
        participantes: participantesSeleccionados.map(p => p.id_usuario) // NUEVA: Lista de participantes
      };

      console.log("Datos enviados:", data); // Debug

      await api.post("/auth/reuniones", data);
      setSuccess("Reunión creada exitosamente");
      
      // Limpiar formulario
      limpiarFormulario();
      
      // Refrescar datos
      fetchReuniones();
      fetchEstadisticas();
    } catch (error) {
      console.error("Error completo:", error);
      if (error.response?.status === 403) {
        setError("No tienes permisos para crear reuniones. Verifica tu rol de usuario.");
      } else {
        setError(error.response?.data?.error || "Error al crear la reunión");
      }
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalleReunion = async (reunion) => {
    try {
      const res = await api.get(`/auth/reuniones/${reunion.id_reunion}`);
      setReunionDetalle(res.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error al obtener detalles de la reunión:", error);
      setError("Error al cargar detalles de la reunión");
    }
  };

  const abrirEditarReunion = (reunion) => {
    const fechaObj = new Date(reunion.fecha_reunion);
    const fecha = fechaObj.toISOString().split('T')[0];
    const hora = fechaObj.toTimeString().slice(0, 5);

    setReunionEditando({
      ...reunion,
      fecha: fecha,
      hora: hora
    });
    setShowEditModal(true);
  };

  const actualizarReunion = async (e) => {
    e.preventDefault();
    try {
      const fechaCompleta = `${reunionEditando.fecha} ${reunionEditando.hora}:00`;
      
      await api.put(`/auth/reuniones/${reunionEditando.id_reunion}`, {
        titulo: reunionEditando.titulo,
        descripcion: reunionEditando.descripcion,
        fecha_reunion: fechaCompleta,
        duracion_minutos: parseInt(reunionEditando.duracion_minutos),
        ubicacion: reunionEditando.ubicacion,
        estado: reunionEditando.estado
      });

      setSuccess("Reunión actualizada exitosamente");
      setShowEditModal(false);
      fetchReuniones();
      fetchEstadisticas();
    } catch (error) { 
      console.error("Error al actualizar reunión:", error);
      setError("Error al actualizar la reunión");
    }
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // NUEVA FUNCIÓN: Limpiar formulario completo
  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
    setFechaReunion("");
    setHoraReunion("");
    setDuracionMinutos(60);
    setUbicacion("");
    setPortafolioSeleccionado("");
    setParticipantesSeleccionados([]);
    setEstudiantesDisponibles([]);
    clearMessages();
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Gestión de Reuniones</h1>
        <p className="admin-subtitle">
          Programa y administra reuniones con tus estudiantes
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

      {/* Estadísticas */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{estadisticas.proximas || 0}</div>
            <div className="stat-label">Próximas Reuniones</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{estadisticas.vencidas || 0}</div>
            <div className="stat-label">Reuniones Vencidas</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{estadisticas.completadas || 0}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{estadisticas.total || 0}</div>
            <div className="stat-label">Total Reuniones</div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="card-header">
            <h3>Programar Nueva Reunión</h3>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Título de la reunión</label>
                <input
                  type="text"
                  className="form-input"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Revisión de avances del proyecto"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Portafolio</label>
                <select
                  className="form-select"
                  value={portafolioSeleccionado}
                  onChange={handlePortafolioChange} // MODIFICADO: usar nueva función
                  required
                >
                  <option value="">Seleccione un portafolio</option>
                  {misPortafolios.map((p) => (
                    <option key={p.id_portafolio} value={p.id_portafolio}>
                      {p.nombre} - {p.carrera}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el objetivo y temas a tratar en la reunión"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaReunion}
                  onChange={(e) => setFechaReunion(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora</label>
                <input
                  type="time"
                  className="form-input"
                  value={horaReunion}
                  onChange={(e) => setHoraReunion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duración (minutos)</label>
                <select
                  className="form-select"
                  value={duracionMinutos}
                  onChange={(e) => setDuracionMinutos(e.target.value)}
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Aula 201, Edificio A"
                  required
                />
              </div>
            </div>

            {/* NUEVA SECCIÓN: Selección de participantes */}
            {portafolioSeleccionado && (
              <div className="form-group form-group-full" style={{ marginTop: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem" }}>
                <label className="form-label" style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem" }}>
                  👥 Seleccionar Participantes ({participantesSeleccionados.length} seleccionados)
                </label>
                
                {loadingEstudiantes ? (
                  <div style={{ padding: "2rem", textAlign: "center", background: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p>Cargando estudiantes del portafolio...</p>
                  </div>
                ) : estudiantesDisponibles.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", background: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
                    <p>No hay estudiantes en este portafolio</p>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      border: "1px solid #d1d5db", 
                      borderRadius: "8px", 
                      padding: "0.5rem", 
                      maxHeight: "250px", 
                      overflowY: "auto",
                      backgroundColor: "#fff"
                    }}>
                      {estudiantesDisponibles.map((estudiante) => {
                        const isSelected = participantesSeleccionados.some(p => p.id_usuario === estudiante.id_usuario);
                        return (
                          <div
                            key={estudiante.id_usuario}
                            onClick={() => toggleParticipante(estudiante)}
                            style={{
                              padding: "0.75rem",
                              margin: "0.25rem",
                              border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor: isSelected ? "#eff6ff" : "#f9fafb",
                              color: isSelected ? "#1e40af" : "#374151",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              fontWeight: isSelected ? "600" : "normal"
                            }}
                          >
                            <div style={{
                              width: "20px",
                              height: "20px",
                              border: "2px solid",
                              borderColor: isSelected ? "#3b82f6" : "#d1d5db",
                              borderRadius: "4px",
                              backgroundColor: isSelected ? "#3b82f6" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}>
                              {isSelected && "✓"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600" }}>
                                {estudiante.nombre} {estudiante.apellido}
                              </div>
                              <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                                {estudiante.email}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {participantesSeleccionados.length > 0 && (
                      <div style={{ 
                        marginTop: "1rem", 
                        padding: "0.75rem", 
                        backgroundColor: "#f0f9ff", 
                        borderRadius: "6px",
                        border: "1px solid #bae6fd"
                      }}>
                        <strong style={{ color: "#0369a1" }}>Participantes seleccionados:</strong>
                        <div style={{ marginTop: "0.5rem" }}>
                          {participantesSeleccionados.map((p, index) => (
                            <span key={p.id_usuario} style={{ color: "#0369a1" }}>
                              {p.nombre} {p.apellido}
                              {index < participantesSeleccionados.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "2rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={limpiarFormulario}
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (portafolioSeleccionado && participantesSeleccionados.length === 0)}
              >
                {loading ? "Programando..." : "Programar Reunión"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de reuniones */}
        <div className="admin-card" style={{ marginTop: "2rem" }}>
          <div className="card-header">
            <h3>Mis Reuniones</h3>
          </div>
          {misReuniones.length === 0 ? (
            <p className="no-portfolios">No has programado reuniones aún.</p>
          ) : (
            <div className="portfolio-grid">
              {misReuniones.map((reunion) => (
                <div className="portfolio-card" key={reunion.id_reunion}>
                  <div className="portfolio-card-header">
                    <span className="portfolio-name">{reunion.titulo}</span>
                    <span className={`portfolio-career ${reunion.estado === 'programada' ? 'bg-blue' : reunion.estado === 'completada' ? 'bg-green' : 'bg-gray'}`}>
                      {reunion.estado}
                    </span>
                  </div>
                  <div className="portfolio-card-body">
                    <div>
                      <span className="portfolio-label">Portafolio:</span>{" "}
                      <span>{reunion.nombre_portafolio}</span>
                    </div>
                    <div>
                      <span className="portfolio-label">Fecha:</span>{" "}
                      <span>{formatearFecha(reunion.fecha_reunion)}</span>
                    </div>
                    <div>
                      <span className="portfolio-label">Ubicación:</span>{" "}
                      <span>{reunion.ubicacion}</span>
                    </div>
                    <div>
                      <span className="portfolio-label">Participantes:</span>{" "}
                      <span>{reunion.confirmados || 0}/{reunion.total_participantes || 0} confirmados</span>
                    </div>
                  </div>
                  <div className="portfolio-card-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => abrirDetalleReunion(reunion)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Ver Detalles
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => abrirEditarReunion(reunion)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && reunionDetalle && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3>{reunionDetalle.reunion.titulo}</h3>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Portafolio:</strong> {reunionDetalle.reunion.nombre_portafolio}</p>
              <p><strong>Fecha:</strong> {formatearFecha(reunionDetalle.reunion.fecha_reunion)}</p>
              <p><strong>Duración:</strong> {reunionDetalle.reunion.duracion_minutos} minutos</p>
              <p><strong>Ubicación:</strong> {reunionDetalle.reunion.ubicacion}</p>
              <p><strong>Estado:</strong> {reunionDetalle.reunion.estado}</p>
              {reunionDetalle.reunion.descripcion && (
                <p><strong>Descripción:</strong> {reunionDetalle.reunion.descripcion}</p>
              )}
            </div>
            
            <h4>Participantes ({reunionDetalle.participantes ? reunionDetalle.participantes.length : 0})</h4>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {reunionDetalle.participantes && reunionDetalle.participantes.map((participante) => (
                <div key={participante.id_usuario} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "0.5rem",
                  borderBottom: "1px solid #eee"
                }}>
                  <span>{participante.nombre} {participante.apellido}</span>
                  <span style={{ 
                    color: participante.confirmado ? "green" : "orange",
                    fontWeight: "bold"
                  }}>
                    {participante.confirmado ? "✓ Confirmado" : "⏳ Pendiente"}
                  </span>
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDetailModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar */}
      {showEditModal && reunionEditando && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "500px" }}>
            <h3>Editar Reunión</h3>
            <form onSubmit={actualizarReunion} className="admin-form">
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  className="form-input"
                  value={reunionEditando.titulo}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    titulo: e.target.value 
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={reunionEditando.descripcion || ""}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    descripcion: e.target.value 
                  })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={reunionEditando.fecha}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    fecha: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora</label>
                <input
                  type="time"
                  className="form-input"
                  value={reunionEditando.hora}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    hora: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duración (minutos)</label>
                <select
                  className="form-select"
                  value={reunionEditando.duracion_minutos}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    duracion_minutos: e.target.value 
                  })}
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input
                  className="form-input"
                  value={reunionEditando.ubicacion}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    ubicacion: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={reunionEditando.estado}
                  onChange={e => setReunionEditando({ 
                    ...reunionEditando, 
                    estado: e.target.value 
                  })}
                >
                  <option value="programada">Programada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
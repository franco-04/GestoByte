import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "../Admin/Admin.css";

export default function ReunionesEstudiante() {
  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reunionDetalle, setReunionDetalle] = useState(null);

  useEffect(() => {
    fetchReuniones();
  }, []);

  const fetchReuniones = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/reuniones/estudiante");
      setReuniones(res.data);
    } catch (_) {
      console.error("Error al obtener reuniones:", _);
      setError("Error al cargar las reuniones");
    } finally {
      setLoading(false);
    }
  };

  const confirmarAsistencia = async (idReunion) => {
    try {
      await api.post(`/auth/reuniones/${idReunion}/confirmar`);
      setSuccess("Asistencia confirmada exitosamente");
      fetchReuniones(); // Refrescar la lista
    } catch ( error ) {
        console.error("Error al confirmar asistencia:", error);
      setError("Error al confirmar asistencia");
    }
  };

  const abrirDetalleReunion = async (reunion) => {
    try {
      const res = await api.get(`/auth/reuniones/${reunion.id_reunion}`);
      setReunionDetalle(res.data);
      setShowDetailModal(true);
    } catch (_) {
        console.error("Error al obtener detalles de la reunión:", _);
      setError("Error al cargar detalles de la reunión");
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

  const esReunionProxima = (fechaReunion) => {
    const ahora = new Date();
    const fechaReu = new Date(fechaReunion);
    return fechaReu > ahora;
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const reunionesProximas = reuniones.filter(r => esReunionProxima(r.fecha_reunion));
  const reunionesPasadas = reuniones.filter(r => !esReunionProxima(r.fecha_reunion));

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Mis Reuniones</h1>
        <p className="admin-subtitle">
          Reuniones programadas con tus coordinadores
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

      {loading ? (
        <div className="loading-container">
          <p>Cargando reuniones...</p>
        </div>
      ) : (
        <>
          {/* Reuniones Próximas */}
          <div className="admin-card" style={{ marginBottom: "2rem" }}>
            <div className="card-header">
              <h3>Próximas Reuniones ({reunionesProximas.length})</h3>
            </div>
            {reunionesProximas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No tienes reuniones próximas</h3>
                <p>Cuando tu coordinador programe una reunión, aparecerá aquí.</p>
              </div>
            ) : (
              <div className="portfolio-grid">
                {reunionesProximas.map((reunion) => (
                  <div className="portfolio-card" key={reunion.id_reunion}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{reunion.titulo}</span>
                      <span className={`portfolio-career ${reunion.confirmado ? 'bg-green' : 'bg-orange'}`}>
                        {reunion.confirmado ? "Confirmado" : "Pendiente"}
                      </span>
                    </div>
                    <div className="portfolio-card-body">
                      <div>
                      <span className="portfolio-label">Proyecto:</span>{" "}
                      <span>{reunion.proyecto_nombre || reunion.nombre_portafolio}</span>
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
                        <span className="portfolio-label">Duración:</span>{" "}
                        <span>{reunion.duracion_minutos} minutos</span>
                      </div>
                      <div>
                        <span className="portfolio-label">Coordinador:</span>{" "}
                        <span>{reunion.coordinador_nombre} {reunion.coordinador_apellido}</span>
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
                      {!reunion.confirmado && (
                        <button
                          className="btn btn-success"
                          onClick={() => confirmarAsistencia(reunion.id_reunion)}
                        >
                          Confirmar Asistencia
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reuniones Pasadas */}
          {reunionesPasadas.length > 0 && (
            <div className="admin-card">
              <div className="card-header">
                <h3>Reuniones Anteriores ({reunionesPasadas.length})</h3>
              </div>
              <div className="portfolio-grid">
                {reunionesPasadas.map((reunion) => (
                  <div className="portfolio-card" key={reunion.id_reunion} style={{ opacity: 0.8 }}>
                    <div className="portfolio-card-header">
                      <span className="portfolio-name">{reunion.titulo}</span>
                      <span className="portfolio-career bg-gray">
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
                        <span className="portfolio-label">Asistencia:</span>{" "}
                        <span style={{ color: reunion.confirmado ? "green" : "red" }}>
                          {reunion.confirmado ? "Confirmada" : "No confirmada"}
                        </span>
                      </div>
                    </div>
                    <div className="portfolio-card-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => abrirDetalleReunion(reunion)}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles */}
      {showDetailModal && reunionDetalle && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3>{reunionDetalle.reunion.titulo}</h3>
            <div style={{ marginBottom: "1rem" }}>
            <p><strong>Proyecto:</strong> {reunionDetalle.reunion.proyecto_nombre || reunionDetalle.reunion.nombre_portafolio}</p>
              <p><strong>Coordinador:</strong> {reunionDetalle.reunion.coordinador_nombre} {reunionDetalle.reunion.coordinador_apellido}</p>
              <p><strong>Fecha:</strong> {formatearFecha(reunionDetalle.reunion.fecha_reunion)}</p>
              <p><strong>Duración:</strong> {reunionDetalle.reunion.duracion_minutos} minutos</p>
              <p><strong>Ubicación:</strong> {reunionDetalle.reunion.ubicacion}</p>
              <p><strong>Estado:</strong> {reunionDetalle.reunion.estado}</p>
              {reunionDetalle.reunion.descripcion && (
                <p><strong>Descripción:</strong> {reunionDetalle.reunion.descripcion}</p>
              )}
            </div>
            
            <h4>Otros Participantes ({reunionDetalle.participantes.length - 1})</h4>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {reunionDetalle.participantes
                .filter(p => p.id_usuario !== JSON.parse(localStorage.getItem('userData'))?.id)
                .map((participante) => (
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
    </div>
  );
}
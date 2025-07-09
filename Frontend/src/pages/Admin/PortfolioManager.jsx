import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "../Admin/Admin.css";

export default function PortfolioManager() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [carrera, setCarrera] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [carreras, setCarreras] = useState([
    "Mecatrónica",
    "Desarrollo de Software",
    "Redes Inteligentes",
  ]);
  const [misPortafolios, setMisPortafolios] = useState([]);

  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    id_portafolio: null,
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const res = await api.get("/auth/usuarios");
        setEstudiantes(res.data);
      } catch (error) {
        setEstudiantes([]);
      }
    };
    fetchEstudiantes();
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

  // Filtrar estudiantes por carrera seleccionada
  const estudiantesFiltrados = estudiantes.filter((e) => e.carrera === carrera);

  const createPortafolio = async (data) => {
    try {
      const res = await api.post("/auth/portafolios", data);
      return res.data;
    } catch (error) {
      throw error.res?.data?.error || "Error al crear portafolio";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = {
        nombre,
        descripcion,
        carrera,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activo: 1,
        estudiantes: seleccionados,
      };
      await createPortafolio(data);
      setSuccess("Portafolio creado correctamente");
      setNombre("");
      setDescripcion("");
      setCarrera("");
      setFechaInicio("");
      setFechaFin("");
      setSeleccionados([]);
      fetchMisPortafolios();
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Eliminar portafolio (eliminación lógica)
  const eliminarPortafolio = async (id_portafolio) => {
    if (!window.confirm("¿Seguro que deseas eliminar este portafolio?")) return;
    try {
      await api.put(`/auth/${id_portafolio}/eliminar-portafolio`);
      setSuccess("Portafolio eliminado correctamente");
      fetchMisPortafolios();
    } catch (error) {
      setError("Error al eliminar el portafolio");
    }
  };

  // Abrir modal de edición
  const abrirModalEdicion = (p) => {
    setEditData({
      id_portafolio: p.id_portafolio,
      nombre: p.nombre,
      descripcion: p.descripcion,
      fecha_inicio: p.fecha_inicio?.slice(0, 10),
      fecha_fin: p.fecha_fin?.slice(0, 10)
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const editarPortafolio = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/${editData.id_portafolio}`, {
        nombre: editData.nombre,
        descripcion: editData.descripcion,
        fecha_inicio: editData.fecha_inicio,
        fecha_fin: editData.fecha_fin
      });
      setSuccess("Portafolio actualizado correctamente");
      setShowEditModal(false);
      fetchMisPortafolios();
    } catch (error) {
      setError("Error al actualizar el portafolio");
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h1>Gestión de Portafolios</h1>
        <p className="admin-subtitle">
          Crear y administrar portafolios de estudiantes
        </p>
      </div>

      {/* Mensajes de estado */}
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
            <h3>Crear Nuevo Portafolio</h3>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre del portafolio</label>
                <input
                  type="text"
                  className="form-input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingrese el nombre del portafolio"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Carrera</label>
                <select
                  className="form-select"
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                  required
                >
                  <option value="">Seleccione una carrera</option>
                  {carreras.map((c) => (
                    <option key={c} value={c}>
                      {c}
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
                  placeholder="Describe el portafolio y sus objetivos"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de inicio</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de fin</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">
                  Estudiantes{" "}
                  {carrera && `(${estudiantesFiltrados.length} disponibles)`}
                </label>
                {!carrera ? (
                  <div className="form-help-text">
                    Seleccione una carrera para ver los estudiantes disponibles
                  </div>
                ) : estudiantesFiltrados.length === 0 ? (
                  <div className="form-help-text">
                    No hay estudiantes disponibles para esta carrera
                  </div>
                ) : (
                  <div className="students-selector">
                    <select
                      multiple
                      className="form-select form-select-multiple"
                      value={seleccionados}
                      onChange={(e) =>
                        setSeleccionados(
                          Array.from(e.target.selectedOptions, (o) => o.value)
                        )
                      }
                      required
                    >
                      {estudiantesFiltrados.map((e) => (
                        <option key={e.id_usuario} value={e.id_usuario}>
                          {e.nombre} {e.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setNombre("");
                  setDescripcion("");
                  setCarrera("");
                  setFechaInicio("");
                  setFechaFin("");
                  setSeleccionados([]);
                  clearMessages();
                }}
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear portafolio"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de portafolios del coordinador */}
        <div className="admin-card" style={{ marginTop: "2rem" }}>
          <div className="card-header">
            <h3>Mis Portafolios</h3>
          </div>
          {misPortafolios.length === 0 ? (
            <p className="no-portfolios">No has creado portafolios aún.</p>
          ) : (
            <div className="portfolio-grid">
              {misPortafolios.map((p) => (
                <div className="portfolio-card" key={p.id_portafolio}>
                  <div className="portfolio-card-header">
                    <span className="portfolio-name">{p.nombre}</span>
                    <span className="portfolio-career">{p.carrera}</span>
                  </div>
                  <div className="portfolio-card-body">
                    <div>
                      <span className="portfolio-label">Inicio:</span>{" "}
                      <span>{p.fecha_inicio?.slice(0, 10)}</span>
                    </div>
                    <div>
                      <span className="portfolio-label">Fin:</span>{" "}
                      <span>{p.fecha_fin?.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="portfolio-card-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => abrirModalEdicion(p)}
                      title="Editar portafolio"
                      style={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => eliminarPortafolio(p.id_portafolio)}
                      title="Eliminar portafolio"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Editar Portafolio</h3>
            <form onSubmit={editarPortafolio} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={editData.nombre}
                  onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={editData.descripcion}
                  onChange={e => setEditData({ ...editData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de inicio</label>
                <input
                  type="date"
                  className="form-input"
                  value={editData.fecha_inicio}
                  onChange={e => setEditData({ ...editData, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de fin</label>
                <input
                  type="date"
                  className="form-input"
                  value={editData.fecha_fin}
                  onChange={e => setEditData({ ...editData, fecha_fin: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
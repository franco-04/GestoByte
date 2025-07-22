import React, { useState, useEffect } from "react";
import "../Superadmin/Superadmin.css";
import proyectosService from "../../services/proyectosService";

export default function PortfolioManager() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [carrera, setCarrera] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [asesoresSeleccionados, setAsesoresSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [carreras, setCarreras] = useState([
    "Mecatrónica",
    "Desarrollo de Software",
    "Redes Inteligentes",
  ]);
  const [misPortafolios, setMisPortafolios] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    id_portafolio: null,
    nombre: "",
    descripcion: "",
    carrera: "",
  });

  useEffect(() => {
    const fetchAsesores = async () => {
      try {
        const asesoresData = await proyectosService.getProfesores();
        setAsesores(asesoresData);
      } catch (error) {
        setAsesores([]);
      }
    };
    const fetchMisPortafolios = async () => {
      try {
        const portafolios = await proyectosService.getMisPortafolios();
        setMisPortafolios(portafolios);
      } catch (error) {
        setMisPortafolios([]);
      }
    };
    fetchAsesores();
    fetchMisPortafolios();
  }, []);

  const createPortafolio = async (data) => {
    try {
      await proyectosService.createPortfolio(data);
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
        activo: 1,
        asesores: asesoresSeleccionados,
      };
      await createPortafolio(data);
      setSuccess("Portafolio creado correctamente");
      setNombre("");
      setDescripcion("");
      setCarrera("");
      setAsesoresSeleccionados([]);
      // Actualiza la lista de portafolios
      const portafolios = await proyectosService.getMisPortafolios();
      setMisPortafolios(portafolios);
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

  const eliminarPortafolio = async (id_portafolio) => {
    if (!window.confirm("¿Seguro que deseas eliminar este portafolio?")) return;
    try {
      await proyectosService.eliminarPortafolio(id_portafolio);
      setSuccess("Portafolio eliminado correctamente");
      const portafolios = await proyectosService.getMisPortafolios();
      setMisPortafolios(portafolios);
    } catch (error) {
      setError("Error al eliminar el portafolio");
    }
  };

  const abrirModalEdicion = async (p) => {
    setEditData({
      id_portafolio: p.id_portafolio,
      nombre: p.nombre,
      descripcion: p.descripcion,
      carrera: p.carrera,
    });
    setShowEditModal(true);
  };

  const editarPortafolio = async (e) => {
    e.preventDefault();
    try {
      await proyectosService.editarPortafolio(editData.id_portafolio, {
        nombre: editData.nombre,
        descripcion: editData.descripcion,
      });
      setSuccess("Portafolio actualizado correctamente");
      setShowEditModal(false);
      const portafolios = await proyectosService.getMisPortafolios();
      setMisPortafolios(portafolios);
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

              <div className="form-group form-group-full">
                <label className="form-label">Asesores</label>
                <select
                  multiple
                  className="form-select"
                  value={asesoresSeleccionados}
                  onChange={(e) =>
                    setAsesoresSeleccionados(
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  required
                  disabled={!carrera}
                >
                  {asesores
                    .filter((a) => a.carrera === carrera)
                    .map((a) => (
                      <option key={a.id_usuario} value={a.id_usuario}>
                        {a.nombre} {a.apellido}
                      </option>
                    ))}
                </select>
                <small>
                  {carrera
                    ? "Puedes seleccionar uno o varios asesores"
                    : "Selecciona primero una carrera"}
                </small>
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
                  setAsesoresSeleccionados([]);
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
                  <div className="portfolio-card-body"></div>
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
                  onChange={(e) =>
                    setEditData({ ...editData, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={editData.descripcion}
                  onChange={(e) =>
                    setEditData({ ...editData, descripcion: e.target.value })
                  }
                  required
                />
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
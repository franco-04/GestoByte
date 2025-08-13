import React, { useEffect, useState } from "react";
import { 
  AiOutlineSearch, 
  AiOutlineFilter, 
  AiOutlineUser, 
  AiOutlineMail, 
  AiOutlineIdcard,
  AiOutlineTeam,
  AiOutlineProject,
  AiOutlineDownload,
  AiOutlineEye
} from "react-icons/ai";
import proyectosService from "../../../services/proyectosService";

export default function Estudiantes() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const carrera = userData?.carrera || "";

  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    conProyectos: 0,
    sinProyectos: 0,
    lideres: 0
  });

  useEffect(() => {
    fetchEstudiantes();
  }, [carrera]);

  useEffect(() => {
    filtrarYOrdenarEstudiantes();
  }, [estudiantes, searchTerm, sortBy, sortOrder]);

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const data = await proyectosService.getEstudiantesByCarrera(carrera);
      
      // Enriquecer datos de estudiantes con información adicional
      const estudiantesEnriquecidos = await Promise.all(
        data.map(async (estudiante) => {
          try {
            // Aquí podrías hacer llamadas adicionales para obtener proyectos, etc.
            // Por ahora simulamos algunos datos
            return {
              ...estudiante,
              proyectos_activos: Math.floor(Math.random() * 3),
              es_lider: Math.random() > 0.8,
              ultimo_acceso: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              estado: Math.random() > 0.1 ? "activo" : "inactivo"
            };
          } catch {
            return estudiante;
          }
        })
      );

      setEstudiantes(estudiantesEnriquecidos);
      
      // Calcular estadísticas
      const statsData = {
        total: estudiantesEnriquecidos.length,
        conProyectos: estudiantesEnriquecidos.filter(e => e.proyectos_activos > 0).length,
        sinProyectos: estudiantesEnriquecidos.filter(e => e.proyectos_activos === 0).length,
        lideres: estudiantesEnriquecidos.filter(e => e.es_lider).length
      };
      setStats(statsData);

    } catch (err) {
      setError("Error al cargar estudiantes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarYOrdenarEstudiantes = () => {
    let resultado = [...estudiantes];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      resultado = resultado.filter(estudiante =>
        `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.id_usuario.toString().includes(searchTerm)
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "nombre":
          aValue = `${a.nombre} ${a.apellido}`.toLowerCase();
          bValue = `${b.nombre} ${b.apellido}`.toLowerCase();
          break;
        case "id":
          aValue = a.id_usuario;
          bValue = b.id_usuario;
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "proyectos":
          aValue = a.proyectos_activos || 0;
          bValue = b.proyectos_activos || 0;
          break;
        case "ultimo_acceso":
          aValue = new Date(a.ultimo_acceso);
          bValue = new Date(b.ultimo_acceso);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setEstudiantesFiltrados(resultado);
    setCurrentPage(1); // Reset página al filtrar
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('es-ES');
  };

  const exportarEstudiantes = () => {
    const csvContent = [
      ["ID", "Nombre", "Apellido", "Email", "Proyectos Activos", "Es Líder", "Estado"].join(","),
      ...estudiantesFiltrados.map(e => [
        e.id_usuario,
        e.nombre,
        e.apellido,
        e.email,
        e.proyectos_activos || 0,
        e.es_lider ? "Sí" : "No",
        e.estado || "activo"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `estudiantes_${carrera}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = estudiantesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage);

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading-container">
          <p>Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Estudiantes de {carrera}</h1>
          <p className="admin-subtitle">
            Gestión y seguimiento de estudiantes de la carrera
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={exportarEstudiantes}
        >
          <AiOutlineDownload /> Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <AiOutlineTeam />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Estudiantes</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <AiOutlineProject />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.conProyectos}</div>
            <div className="stat-label">Con Proyectos</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AiOutlineUser />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.sinProyectos}</div>
            <div className="stat-label">Sin Proyectos</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <AiOutlineUser />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.lideres}</div>
            <div className="stat-label">Líderes</div>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="admin-card">
        <div className="card-header">
          <h3>Lista de Estudiantes</h3>
        </div>
        
        <div className="table-controls">
          <div className="search-box">
            <AiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="nombre">Ordenar por Nombre</option>
              <option value="id">Ordenar por ID</option>
              <option value="email">Ordenar por Email</option>
              <option value="proyectos">Ordenar por Proyectos</option>
              <option value="ultimo_acceso">Ordenar por Último Acceso</option>
            </select>
            
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Tabla de estudiantes */}
        <div className="table-responsive">
          <table className="estudiantes-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>
                  ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("nombre")}>
                  Estudiante {sortBy === "nombre" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("email")}>
                  Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("proyectos")}>
                  Proyectos {sortBy === "proyectos" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th>Rol</th>
                <th onClick={() => handleSort("ultimo_acceso")}>
                  Último Acceso {sortBy === "ultimo_acceso" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((estudiante) => (
                <tr key={estudiante.id_usuario}>
                  <td>
                    <span className="student-id">#{estudiante.id_usuario}</span>
                  </td>
                  <td>
                    <div className="student-info">
                      <div className="student-avatar">
                        {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                      </div>
                      <div className="student-details">
                        <div className="student-name">
                          {estudiante.nombre} {estudiante.apellido}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="student-email">{estudiante.email}</span>
                  </td>
                  <td>
                    <div className="projects-info">
                      <span className="projects-count">
                        {estudiante.proyectos_activos || 0}
                      </span>
                      {estudiante.proyectos_activos > 0 && (
                        <span className="projects-label">proyectos</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {estudiante.es_lider ? (
                      <span className="role-badge leader">
                        <AiOutlineUser /> Líder
                      </span>
                    ) : (
                      <span className="role-badge member">
                        <AiOutlineTeam /> Miembro
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="last-access">
                      {formatDate(estudiante.ultimo_acceso)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${estudiante.estado || 'activo'}`}>
                      {estudiante.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-secondary"
                        title="Ver detalles"
                      >
                        <AiOutlineEye />
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        title="Enviar mensaje"
                      >
                        <AiOutlineMail />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, estudiantesFiltrados.length)} de {estudiantesFiltrados.length} estudiantes
            </div>
            <div className="pagination-controls">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="pagination-dots">...</span>;
                }
                return null;
              })}
              
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {estudiantesFiltrados.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron estudiantes</h3>
            <p>
              {searchTerm 
                ? `No hay estudiantes que coincidan con "${searchTerm}"`
                : "No hay estudiantes registrados en esta carrera"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
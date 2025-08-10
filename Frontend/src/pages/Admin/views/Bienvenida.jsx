import React, { useState, useEffect } from "react";
import { 
  AiOutlineTeam, 
  AiOutlineProject, 
  AiOutlineFileText, 
  AiOutlineCalendar,
  AiOutlineTrophy,
  AiOutlineBarChart,
  AiOutlineUser,
  AiOutlineCheckCircle
} from "react-icons/ai";
import proyectosService from "../../../services/proyectosService";

export default function Bienvenida({ user }) {
  const [stats, setStats] = useState({
    totalPortafolios: 0,
    totalProgramas: 0,
    totalProyectos: 0,
    totalEstudiantes: 0,
    proyectosActivos: 0,
    proyectosCompletados: 0,
    actividadesPendientes: 0,
    reunionesProgramadas: 0
  });
  
  const [actividadesRecientes, setActividadesRecientes] = useState([]);
  const [proyectosPorPrograma, setProyectosPorPrograma] = useState([]);
  const [actividadesPorEstado, setActividadesPorEstado] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Obtener datos básicos
      const [portafolios, estudiantes] = await Promise.all([
        proyectosService.getPortafoliosAsignados(),
        proyectosService.getEstudiantesByCarrera(user?.carrera)
      ]);

      // Calcular estadísticas de programas y proyectos
      let totalProgramas = 0;
      let totalProyectos = 0;
      let proyectosActivos = 0;
      let proyectosCompletados = 0;
      let proyectosPorProgramaData = [];

      for (const portafolio of portafolios) {
        const programas = await proyectosService.getProgramasByPortafolio(portafolio.id_portafolio);
        totalProgramas += programas.length;

        for (const programa of programas) {
          const proyectos = await proyectosService.getProyectosByPrograma(programa.id_programa);
          totalProyectos += proyectos.length;
          
          proyectosPorProgramaData.push({
            nombre: programa.nombre,
            proyectos: proyectos.length,
            categoria: programa.categoria
          });

          // Simular estados de proyectos (esto debería venir del backend)
          proyectosActivos += Math.floor(proyectos.length * 0.7);
          proyectosCompletados += Math.floor(proyectos.length * 0.3);
        }
      }

      // Simular datos de actividades (esto debería venir del backend)
      const actividadesRecientesData = [
        { id: 1, titulo: "Revisión de documentación", proyecto: "Sistema Web", tiempo: "hace 2 horas", tipo: "info" },
        { id: 2, titulo: "Entrega de prototipo", proyecto: "App Móvil", tiempo: "hace 4 horas", tipo: "success" },
        { id: 3, titulo: "Reunión de seguimiento", proyecto: "Base de Datos", tiempo: "hace 1 día", tipo: "warning" },
        { id: 4, titulo: "Evaluación de avances", proyecto: "Sistema Web", tiempo: "hace 2 días", tipo: "info" }
      ];

      const actividadesPorEstadoData = [
        { estado: "Pendientes", cantidad: 45, porcentaje: 35 },
        { estado: "En Progreso", cantidad: 52, porcentaje: 40 },
        { estado: "En Revisión", cantidad: 20, porcentaje: 15 },
        { estado: "Completadas", cantidad: 13, porcentaje: 10 }
      ];

      setStats({
        totalPortafolios: portafolios.length,
        totalProgramas,
        totalProyectos,
        totalEstudiantes: estudiantes.length,
        proyectosActivos,
        proyectosCompletados,
        actividadesPendientes: 45,
        reunionesProgramadas: 8
      });

      setActividadesRecientes(actividadesRecientesData);
      setProyectosPorPrograma(proyectosPorProgramaData.slice(0, 5)); // Top 5
      setActividadesPorEstado(actividadesPorEstadoData);

    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Header del Dashboard */}
      <div className="dashboard-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="dashboard-subtitle">
            Bienvenido, {user?.nombre} {user?.apellido} - {formatDate()}
          </p>
        </div>
        <div className="user-info-card">
          <div className="user-avatar">
            {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.nombre} {user?.apellido}</div>
            <div className="user-role">Coordinador - {user?.carrera}</div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <AiOutlineFileText />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalPortafolios}</div>
            <div className="stat-label">Portafolios</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <AiOutlineBarChart />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalProgramas}</div>
            <div className="stat-label">Programas</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <AiOutlineProject />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalProyectos}</div>
            <div className="stat-label">Proyectos</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AiOutlineTeam />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalEstudiantes}</div>
            <div className="stat-label">Estudiantes</div>
          </div>
        </div>
      </div>

      {/* Grid principal del dashboard */}
      <div className="dashboard-grid">
        {/* Estado de Proyectos */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Estado de Proyectos</h3>
          </div>
          <div className="card-content">
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#10b981' }}>
                  {stats.proyectosActivos}
                </div>
                <div className="metric-label">Activos</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#3b82f6' }}>
                  {stats.proyectosCompletados}
                </div>
                <div className="metric-label">Completados</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#f59e0b' }}>
                  {stats.actividadesPendientes}
                </div>
                <div className="metric-label">Pendientes</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#8b5cf6' }}>
                  {stats.reunionesProgramadas}
                </div>
                <div className="metric-label">Reuniones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Proyectos por Programa */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Proyectos por Programa</h3>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {proyectosPorPrograma.map((programa, index) => {
                const maxProyectos = Math.max(...proyectosPorPrograma.map(p => p.proyectos));
                const porcentaje = (programa.proyectos / maxProyectos) * 100;
                
                return (
                  <div key={index} className="chart-item">
                    <div className="chart-label">
                      <div className="chart-name">{programa.nombre}</div>
                      <div className="chart-count">{programa.categoria}</div>
                    </div>
                    <div className="chart-bar">
                      <div 
                        className="chart-fill" 
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <div className="chart-percentage">{programa.proyectos}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actividades Recientes */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Actividades Recientes</h3>
          </div>
          <div className="card-content">
            <div className="activity-list">
              {actividadesRecientes.map((actividad) => (
                <div key={actividad.id} className={`activity-item ${actividad.tipo}`}>
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <div className="activity-message">
                      <strong>{actividad.titulo}</strong>
                      <br />
                      <span>Proyecto: {actividad.proyecto}</span>
                    </div>
                    <div className="activity-time">{actividad.tiempo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribución de Actividades */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Estado de Actividades</h3>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {actividadesPorEstado.map((item, index) => (
                <div key={index} className="chart-item">
                  <div className="chart-label">
                    <div className="chart-name">{item.estado}</div>
                    <div className="chart-count">{item.cantidad} actividades</div>
                  </div>
                  <div className="chart-bar">
                    <div 
                      className="chart-fill" 
                      style={{ 
                        width: `${item.porcentaje}%`,
                        background: index === 0 ? '#f59e0b' : 
                                   index === 1 ? '#3b82f6' : 
                                   index === 2 ? '#8b5cf6' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="chart-percentage">{item.porcentaje}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div className="card-content">
            <div className="quick-actions">
              <button className="action-btn primary">
                <AiOutlineProject className="action-icon" />
                <span>Crear Proyecto</span>
              </button>
              <button className="action-btn success">
                <AiOutlineCalendar className="action-icon" />
                <span>Programar Reunión</span>
              </button>
              <button className="action-btn info">
                <AiOutlineFileText className="action-icon" />
                <span>Generar Reporte</span>
              </button>
              <button className="action-btn warning">
                <AiOutlineTeam className="action-icon" />
                <span>Ver Estudiantes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Carrera */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Resumen de {user?.carrera}</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Total Estudiantes</div>
                <div className="info-value">{stats.totalEstudiantes}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Proyectos Activos</div>
                <div className="info-value">{stats.proyectosActivos}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Programas</div>
                <div className="info-value">{stats.totalProgramas}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Portafolios</div>
                <div className="info-value">{stats.totalPortafolios}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
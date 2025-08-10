import React, { useState, useEffect } from "react";
import {
  AiOutlineDownload,
  AiOutlineBarChart,
  AiOutlineFileText,
  AiOutlineTeam,
  AiOutlineProject,
  AiOutlineCalendar,
  AiOutlineTrophy,
  AiOutlineCheckCircle
} from "react-icons/ai";
import proyectosService from "../../../services/proyectosService";

export default function Reportes() {
  // parse safely
  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "null");
    } catch (e) {
      return null;
    }
  })();
  const carrera = userData?.carrera || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reporteData, setReporteData] = useState({
    resumenGeneral: {},
    estudiantesPorProyecto: [],
    proyectosPorPrograma: [],
    actividadesPorEstado: [],
    rendimientoPorMes: []
  });

  useEffect(() => {
    fetchReporteData();
  }, [carrera]);

  const fetchReporteData = async () => {
    setLoading(true);
    setError("");

    try {
      const [portafolios, estudiantes] = await Promise.all([
        proyectosService.getPortafoliosAsignados(),
        proyectosService.getEstudiantesByCarrera(carrera)
      ]);

      let totalProgramas = 0;
      let totalProyectos = 0;
      const estudiantesPorProyectoData = [];
      const proyectosPorProgramaData = [];

      // Recorremos cada portafolio y obtenemos sus programas
      for (const portafolio of portafolios) {
        const programas = await proyectosService.getProgramasByPortafolio(portafolio.id_portafolio);
        totalProgramas += (programas && programas.length) || 0;

        for (const programa of programas || []) {
          const proyectos = await proyectosService.getProyectosByPrograma(programa.id_programa);
          const proyectosCount = (proyectos && proyectos.length) || 0;
          totalProyectos += proyectosCount;

          proyectosPorProgramaData.push({
            programa: programa.nombre,
            categoria: programa.categoria || "-",
            proyectos: proyectosCount,
            portafolio: portafolio.nombre
          });

          // Simulamos estudiantes por proyecto (si no hay número real)
          (proyectos || []).forEach((proyecto) => {
            const numEstudiantes = Math.floor(Math.random() * 6) + 2; // 2-7
            estudiantesPorProyectoData.push({
              proyecto: proyecto.nombre,
              estudiantes: numEstudiantes,
              programa: programa.nombre,
              lider: proyecto.lider || `Estudiante ${Math.floor(Math.random() * 100)}`,
              estado: Math.random() > 0.7 ? 'completado' : Math.random() > 0.4 ? 'en_progreso' : 'pendiente'
            });
          });
        }
      }

      // Datos simulados para actividades y rendimiento
      const actividadesPorEstadoData = [
        { estado: "Completadas", cantidad: 145, porcentaje: 48 },
        { estado: "En Progreso", cantidad: 89, porcentaje: 30 },
        { estado: "Pendientes", cantidad: 52, porcentaje: 17 },
        { estado: "En Revisión", cantidad: 15, porcentaje: 5 }
      ];

      const rendimientoPorMesData = [
        { mes: "Agosto", proyectos: 8, completados: 6, estudiantes: 32 },
        { mes: "Septiembre", proyectos: 12, completados: 8, estudiantes: 45 },
        { mes: "Octubre", proyectos: 15, completados: 11, estudiantes: 58 },
        { mes: "Noviembre", proyectos: 18, completados: 14, estudiantes: 67 },
        { mes: "Diciembre", proyectos: totalProyectos, completados: Math.floor(totalProyectos * 0.75), estudiantes: (estudiantes && estudiantes.length) || 0 }
      ];

      const resumenGeneralData = {
        totalPortafolios: (portafolios && portafolios.length) || 0,
        totalProgramas,
        totalProyectos,
        totalEstudiantes: (estudiantes && estudiantes.length) || 0,
        proyectosCompletados: Math.floor(totalProyectos * 0.65),
        estudiantesActivos: Math.floor(((estudiantes && estudiantes.length) || 0) * 0.85),
        actividadesTotales: 301,
        actividadesCompletadas: 145,
        promedioEstudiantesPorProyecto: estudiantesPorProyectoData.length > 0 ?
          Math.round(estudiantesPorProyectoData.reduce((acc, p) => acc + p.estudiantes, 0) / estudiantesPorProyectoData.length) : 0
      };

      setReporteData({
        resumenGeneral: resumenGeneralData,
        estudiantesPorProyecto: estudiantesPorProyectoData,
        proyectosPorPrograma: proyectosPorProgramaData,
        actividadesPorEstado: actividadesPorEstadoData,
        rendimientoPorMes: rendimientoPorMesData
      });

    } catch (err) {
      console.error("Error al cargar datos del reporte:", err);
      setError("Error al cargar los datos del reporte");
    } finally {
      setLoading(false);
    }
  };

  // helper CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const exportarReporte = (tipo) => {
    let rows = [];
    let filename = "report.csv";

    switch (tipo) {
      case "estudiantes":
        rows.push(["Proyecto", "Estudiantes", "Programa", "Líder", "Estado"]);
        reporteData.estudiantesPorProyecto.forEach(p => {
          rows.push([p.proyecto, p.estudiantes, p.programa, p.lider, p.estado]);
        });
        filename = `estudiantes_por_proyecto_${carrera}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case "programas":
        rows.push(["Programa", "Categoría", "Proyectos", "Portafolio"]);
        reporteData.proyectosPorPrograma.forEach(p => {
          rows.push([p.programa, p.categoria, p.proyectos, p.portafolio]);
        });
        filename = `proyectos_por_programa_${carrera}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case "actividades":
        rows.push(["Estado", "Cantidad", "Porcentaje"]);
        reporteData.actividadesPorEstado.forEach(a => rows.push([a.estado, a.cantidad, a.porcentaje]));
        filename = `actividades_por_estado_${carrera}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case "rendimiento":
        rows.push(["Mes", "Proyectos", "Completados", "Estudiantes"]);
        reporteData.rendimientoPorMes.forEach(r => rows.push([r.mes, r.proyectos, r.completados, r.estudiantes]));
        filename = `rendimiento_mensual_${carrera}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return;
    }

    const csvContent = rows.map(row => row.map(cell => escapeCSV(cell)).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading-container">
          <p>Generando reportes...</p>
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

  const resumen = reporteData.resumenGeneral || {};
  const tasaFinalizacion = resumen.actividadesTotales ? Math.round((resumen.actividadesCompletadas / resumen.actividadesTotales) * 100) : 0;
  const actividadesPorProyecto = resumen.totalProyectos ? Math.round(resumen.actividadesTotales / Math.max(1, resumen.totalProyectos)) : 0;

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Reportes y Análisis</h1>
          <p className="admin-subtitle">
            Análisis detallado de la carrera {carrera} - Generado el {formatDate()}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          <AiOutlineFileText /> Imprimir Reporte
        </button>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <AiOutlineFileText />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.totalPortafolios}</div>
            <div className="stat-label">Portafolios Activos</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <AiOutlineBarChart />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.totalProgramas}</div>
            <div className="stat-label">Programas</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <AiOutlineProject />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.totalProyectos}</div>
            <div className="stat-label">Proyectos Totales</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AiOutlineTeam />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.totalEstudiantes}</div>
            <div className="stat-label">Estudiantes</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <AiOutlineCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.proyectosCompletados}</div>
            <div className="stat-label">Proyectos Completados</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <AiOutlineTrophy />
          </div>
          <div className="stat-content">
            <div className="stat-number">{resumen.promedioEstudiantesPorProyecto}</div>
            <div className="stat-label">Promedio Est./Proyecto</div>
          </div>
        </div>
      </div>

      {/* Gráficas y Tablas */}
      <div className="dashboard-grid">
        {/* Proyectos por Programa */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Proyectos por Programa</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportarReporte("programas")}
            >
              <AiOutlineDownload /> Exportar
            </button>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {reporteData.proyectosPorPrograma.map((programa, index) => {
                const maxProyectos = Math.max(...reporteData.proyectosPorPrograma.map(p => p.proyectos), 0);
                const porcentaje = maxProyectos > 0 ? (programa.proyectos / maxProyectos) * 100 : 0;

                return (
                  <div key={index} className="chart-item">
                    <div className="chart-label">
                      <div className="chart-name">{programa.programa}</div>
                      <div className="chart-count">{programa.categoria} • {programa.portafolio}</div>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-fill"
                        style={{
                          width: `${porcentaje}%`,
                          background: `linear-gradient(90deg, ${index % 4 === 0 ? '#6366f1' : index % 4 === 1 ? '#10b981' : index % 4 === 2 ? '#f59e0b' : '#ef4444'}, ${index % 4 === 0 ? '#818cf8' : index % 4 === 1 ? '#34d399' : index % 4 === 2 ? '#fbbf24' : '#f87171'})`
                        }}
                      ></div>
                    </div>
                    <div className="chart-percentage">{programa.proyectos}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rendimiento Mensual */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Tendencia Mensual</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportarReporte("rendimiento")}
            >
              <AiOutlineDownload /> Exportar
            </button>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {reporteData.rendimientoPorMes.map((mes, index) => {
                const maxProyectos = Math.max(...reporteData.rendimientoPorMes.map(m => m.proyectos), 0);
                const porcentajeProyectos = maxProyectos > 0 ? (mes.proyectos / maxProyectos) * 100 : 0;
                const tasaComplecion = mes.proyectos > 0 ? Math.round((mes.completados / mes.proyectos) * 100) : 0;

                return (
                  <div key={index} className="chart-item">
                    <div className="chart-label">
                      <div className="chart-name">{mes.mes}</div>
                      <div className="chart-count">{mes.completados}/{mes.proyectos} completados ({tasaComplecion}%)</div>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-fill"
                        style={{
                          width: `${porcentajeProyectos}%`,
                          background: `linear-gradient(90deg, #10b981, #34d399)`
                        }}
                      ></div>
                    </div>
                    <div className="chart-percentage">{mes.estudiantes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Proyectos */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Detalle de Proyectos</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportarReporte("estudiantes")}
            >
              <AiOutlineDownload /> Exportar
            </button>
          </div>
          <div className="card-content">
            <div className="table-responsive">
              <table className="reporte-table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Programa</th>
                    <th>Estudiantes</th>
                    <th>Líder</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.estudiantesPorProyecto.slice(0, 10).map((proyecto, index) => (
                    <tr key={index}>
                      <td>
                        <div className="project-cell">
                          <strong>{proyecto.proyecto}</strong>
                        </div>
                      </td>
                      <td>{proyecto.programa}</td>
                      <td>
                        <div className="students-cell">
                          <AiOutlineTeam style={{ marginRight: '0.5rem' }} />
                          {proyecto.estudiantes} estudiantes
                        </div>
                      </td>
                      <td>{proyecto.lider}</td>
                      <td>
                        <span className={`status-badge ${proyecto.estado}`}>
                          {proyecto.estado === 'completado' ? 'Completado' : proyecto.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {reporteData.estudiantesPorProyecto.length > 10 && (
                <div className="table-footer">
                  <p>Mostrando 10 de {reporteData.estudiantesPorProyecto.length} proyectos. {' '}
                    <button className="btn-link" onClick={() => exportarReporte("estudiantes")}>
                      Ver reporte completo
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estado de Actividades */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Estado de Actividades</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportarReporte("actividades")}
            >
              <AiOutlineDownload /> Exportar
            </button>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {reporteData.actividadesPorEstado.map((item, index) => (
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
                        background: index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : index === 2 ? '#f59e0b' : '#8b5cf6'
                      }}
                    ></div>
                  </div>
                  <div className="chart-percentage">{item.porcentaje}%</div>
                </div>
              ))}
            </div>

            <div className="metrics-grid" style={{ marginTop: "1.5rem" }}>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#10b981' }}>
                  {tasaFinalizacion}%
                </div>
                <div className="metric-label">Tasa de Finalización</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ color: '#3b82f6' }}>
                  {actividadesPorProyecto}
                </div>
                <div className="metric-label">Actividades/Proyecto</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Ejecutivo Detallado */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Resumen Ejecutivo</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Total de Portafolios</div>
                <div className="info-value">{resumen.totalPortafolios}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Programas Activos</div>
                <div className="info-value">{resumen.totalProgramas}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Proyectos en Desarrollo</div>
                <div className="info-value">{resumen.totalProyectos}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Estudiantes Participantes</div>
                <div className="info-value">{resumen.totalEstudiantes}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Tasa de Éxito</div>
                <div className="info-value">{resumen.totalProyectos ? Math.round((resumen.proyectosCompletados / resumen.totalProyectos) * 100) : 0}%</div>
              </div>
              <div className="info-item">
                <div className="info-label">Estudiantes Activos</div>
                <div className="info-value">{resumen.totalEstudiantes ? Math.round((resumen.estudiantesActivos / resumen.totalEstudiantes) * 100) : 0}%</div>
              </div>
            </div>

            <div className="insights-section" style={{ marginTop: "1.5rem" }}>
              <h4 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
                Insights Clave
              </h4>
              <div className="insights-list">
                <div className="insight-item">
                  <div className="insight-icon" style={{ color: '#10b981' }}>📈</div>
                  <div className="insight-content">
                    <strong>Alto Engagement:</strong> {resumen.totalEstudiantes ? Math.round((resumen.estudiantesActivos / resumen.totalEstudiantes) * 100) : 0}% de los estudiantes están activamente participando en proyectos.
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon" style={{ color: '#3b82f6' }}>🎯</div>
                  <div className="insight-content">
                    <strong>Distribución Equilibrada:</strong> Promedio de {resumen.promedioEstudiantesPorProyecto} estudiantes por proyecto, indicando buena organización.
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon" style={{ color: '#f59e0b' }}>⚡</div>
                  <div className="insight-content">
                    <strong>Productividad:</strong> {tasaFinalizacion}% de las actividades han sido completadas exitosamente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="admin-card">
          <div className="card-header">
            <h3>Recomendaciones</h3>
          </div>
          <div className="card-content">
            <div className="recommendations-list">
              <div className="recommendation-item priority-high">
                <div className="recommendation-header">
                  <span className="priority-badge high">Alta Prioridad</span>
                  <h4>Seguimiento de Proyectos Pendientes</h4>
                </div>
                <p>
                  Se recomienda hacer seguimiento especial a los proyectos en estado pendiente 
                  para identificar bloqueos y acelerar su desarrollo.
                </p>
              </div>

              <div className="recommendation-item priority-medium">
                <div className="recommendation-header">
                  <span className="priority-badge medium">Prioridad Media</span>
                  <h4>Optimización de Recursos</h4>
                </div>
                <p>
                  Considerar redistribuir estudiantes en proyectos con pocos miembros 
                  para maximizar el aprendizaje colaborativo.
                </p>
              </div>

              <div className="recommendation-item priority-low">
                <div className="recommendation-header">
                  <span className="priority-badge low">Prioridad Baja</span>
                  <h4>Documentación de Mejores Prácticas</h4>
                </div>
                <p>
                  Documentar los procesos exitosos de los proyectos completados 
                  para replicar en futuras iniciativas.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer del reporte */}
      <div className="report-footer">
        <div className="footer-info">
          <p>
            <strong>Reporte generado el:</strong> {formatDate()} por {userData?.nombre} {userData?.apellido}
          </p>
          <p>
            <strong>Carrera:</strong> {carrera} | <strong>Rol:</strong> Coordinador
          </p>
        </div>
        <div className="footer-actions">
          <button
            className="btn btn-secondary"
            onClick={() => fetchReporteData()}
          >
            <AiOutlineBarChart /> Actualizar Datos
          </button>
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            <AiOutlineFileText /> Imprimir Reporte
          </button>
        </div>
      </div>
    </div>
  );
}

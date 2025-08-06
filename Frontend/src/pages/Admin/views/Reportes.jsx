import React, { useEffect, useState } from "react";
import proyectosService from "../../../services/proyectosService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FileText, Users, BookOpen, FolderOpen, TrendingUp, Award, Clock, AlertCircle, Download, Printer } from "lucide-react";
import "./ProyectosManager.css";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reportes() {
  const [portafolios, setPortafolios] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Obtener portafolios
        const portafoliosData = await proyectosService.getPortafoliosAsignados();
        setPortafolios(portafoliosData);

        let allProgramas = [];
        let allProyectos = [];
        let evidenciasData = [];

        // Obtener programas y proyectos
        for (const p of portafoliosData) {
          const programas = await proyectosService.getProgramasByPortafolio(p.id_portafolio);
          const programasConPortafolio = programas.map(pr => ({
            ...pr,
            nombre_portafolio: p.nombre
          }));
          allProgramas = allProgramas.concat(programasConPortafolio);
          
          for (const prog of programas) {
            const proyectos = await proyectosService.getProyectosByPrograma(prog.id_programa);
            const proyectosConInfo = proyectos.map(proy => ({
              ...proy,
              nombre_programa: prog.nombre,
              nombre_portafolio: p.nombre
            }));
            allProyectos = allProyectos.concat(proyectosConInfo);

            // Para cada proyecto, obtener estadísticas de evidencias
            for (const proyecto of proyectos) {
              try {
                // Aquí necesitarías agregar una función al service para obtener evidencias por proyecto
                // Por ahora simularemos algunos datos básicos
                evidenciasData.push({
                  proyecto: proyecto.nombre,
                  id_proyecto: proyecto.id_proyecto,
                  programa: prog.nombre,
                  portafolio: p.nombre,
                  // Estos datos los obtendrías de una función específica
                  total_evidencias: Math.floor(Math.random() * 20) + 5,
                  evidencias_aprobadas: Math.floor(Math.random() * 15) + 3,
                  evidencias_pendientes: Math.floor(Math.random() * 5) + 1,
                  evidencias_rechazadas: Math.floor(Math.random() * 3)
                });
              } catch (error) {
                console.error("Error obteniendo evidencias:", error);
              }
            }
          }
        }

        setProgramas(allProgramas);
        setProyectos(allProyectos);
        setEvidencias(evidenciasData);

        // Obtener estudiantes por carrera
        const carreras = ["Desarrollo de Software", "Mecatrónica", "Redes Inteligentes"];
        let allEstudiantes = [];
        for (const carrera of carreras) {
          const estudiantesCarrera = await proyectosService.getEstudiantesByCarrera(carrera);
          const estudiantesConCarrera = estudiantesCarrera.map(e => ({
            ...e,
            carrera
          }));
          allEstudiantes = allEstudiantes.concat(estudiantesConCarrera);
        }
        setEstudiantes(allEstudiantes);

        // Calcular estadísticas generales
        const totalEvidencias = evidenciasData.reduce((sum, p) => sum + p.total_evidencias, 0);
        const totalAprobadas = evidenciasData.reduce((sum, p) => sum + p.evidencias_aprobadas, 0);
        const totalPendientes = evidenciasData.reduce((sum, p) => sum + p.evidencias_pendientes, 0);
        const totalRechazadas = evidenciasData.reduce((sum, p) => sum + p.evidencias_rechazadas, 0);

        setEstadisticasGenerales({
          totalPortafolios: portafoliosData.length,
          totalProgramas: allProgramas.length,
          totalProyectos: allProyectos.length,
          totalEstudiantes: allEstudiantes.length,
          totalEvidencias,
          totalAprobadas,
          totalPendientes,
          totalRechazadas,
          promedioEvidenciasPorProyecto: allProyectos.length > 0 ? (totalEvidencias / allProyectos.length).toFixed(1) : 0
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

const exportarPDF = () => {
  const doc = new jsPDF();
  const leftMargin = 20;
  let yPos = 30;

  const addHeader = (title = " REPORTE INTEGRAL DEL SISTEMA") => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 37, 41);
    doc.text(title, leftMargin, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, leftMargin, 22);
  };

  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Página ${pageCount}`, leftMargin, 290);
  };

  const addSectionTitle = (title) => {
    doc.setDrawColor(200);
    doc.line(leftMargin, yPos + 2, 190, yPos + 2); // línea divisoria
    yPos += 5;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(title, leftMargin, yPos);
    yPos += 8;
  };

  // 📘 Portada
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 73, 94);
  doc.text(" Reporte General del Sistema", 35, 80);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.text("Generado automáticamente por el sistema de gestión", 35, 90);
  doc.setFont("helvetica", "italic");
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 35, 100);
  doc.addPage();

  // 📈 Estadísticas Generales
  addHeader();
  addFooter();
  addSectionTitle(" ESTADÍSTICAS GENERALES");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34);
  const stats = estadisticasGenerales;
  const estadisticasTexto = [
    `Total de Portafolios: ${stats.totalPortafolios}`,
    `Total de Programas: ${stats.totalProgramas}`,
    `Total de Proyectos: ${stats.totalProyectos}`,
    `Total de Estudiantes: ${stats.totalEstudiantes}`,
    `Total de Evidencias: ${stats.totalEvidencias}`,
    `Promedio Evidencias/Proyecto: ${stats.promedioEvidenciasPorProyecto}`
  ];
  estadisticasTexto.forEach(line => {
    doc.text(line, leftMargin, yPos);
    yPos += 7;
  });

  yPos += 12;

  // 📁 Portafolios
  addSectionTitle("PORTAFOLIOS");
  autoTable(doc, {
    startY: yPos,
    head: [["Nombre", "Carrera", "Programas", "Proyectos"]],
    body: portafolios.map(p => [
      p.nombre,
      p.carrera,
      programas.filter(pr => pr.nombre_portafolio === p.nombre).length,
      proyectos.filter(proy => proy.nombre_portafolio === p.nombre).length
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 250] }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 30;
    addHeader();
    addFooter();
  }

  // 📚 Programas
  addSectionTitle(" PROGRAMAS");
  autoTable(doc, {
    startY: yPos,
    head: [["Nombre", "Descripción", "Portafolio", "Proyectos"]],
    body: programas.map(pr => [
      pr.nombre,
      pr.descripcion?.substring(0, 40) + "..." || "Sin descripción",
      pr.nombre_portafolio,
      proyectos.filter(proy => proy.nombre_programa === pr.nombre).length
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 250] }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 30;
    addHeader();
    addFooter();
  }

  // 🚀 Proyectos y Evidencias
  addSectionTitle(" PROYECTOS Y EVIDENCIAS");
  autoTable(doc, {
    startY: yPos,
    head: [["Proyecto", "Programa", "Total Evid.", "Aprobadas", "Pendientes", "Rechazadas"]],
    body: evidencias.map(e => [
      e.proyecto,
      e.programa,
      e.total_evidencias,
      e.evidencias_aprobadas,
      e.evidencias_pendientes,
      e.evidencias_rechazadas
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [155, 89, 182], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 250] }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 30;
    addHeader();
    addFooter();
  }

  // 👥 Estudiantes
  addSectionTitle("ESTUDIANTES");
  autoTable(doc, {
    startY: yPos,
    head: [["Nombre", "Apellido", "Email", "Carrera"]],
    body: estudiantes.map(e => [
      e.nombre,
      e.apellido,
      e.email,
      e.carrera
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [230, 126, 34], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 250] }
  });

  // Guardar PDF
  doc.save(`reporte-integral-${new Date().toLocaleDateString("es-ES")}.pdf`);
};



  // Datos para gráficos
  const datosEstadisticas = [
    { name: 'Portafolios', value: estadisticasGenerales.totalPortafolios, color: '#8884d8' },
    { name: 'Programas', value: estadisticasGenerales.totalProgramas, color: '#82ca9d' },
    { name: 'Proyectos', value: estadisticasGenerales.totalProyectos, color: '#ffc658' },
    { name: 'Estudiantes', value: estadisticasGenerales.totalEstudiantes, color: '#ff7300' }
  ];

  const datosEvidencias = [
    { name: 'Aprobadas', value: estadisticasGenerales.totalAprobadas },
    { name: 'Pendientes', value: estadisticasGenerales.totalPendientes },
    { name: 'Rechazadas', value: estadisticasGenerales.totalRechazadas }
  ];

  const datosCarreras = estudiantes.reduce((acc, estudiante) => {
    const carrera = acc.find(c => c.name === estudiante.carrera);
    if (carrera) {
      carrera.value += 1;
    } else {
      acc.push({ name: estudiante.carrera, value: 1 });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="admin-section reportes-section">
        <div className="loader">
          <div className="spinner"></div>
          <p>Cargando datos del reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section reportes-section">
      <div className="admin-header reportes-header">
        <h1>📊 Reportes Integrales del Sistema</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimir
          </button>
          <button className="btn btn-primary" onClick={exportarPDF}>
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Panel de estadísticas generales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FolderOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.totalPortafolios}</h3>
            <p>Portafolios Activos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.totalProgramas}</h3>
            <p>Programas</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.totalProyectos}</h3>
            <p>Proyectos</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.totalEstudiantes}</h3>
            <p>Estudiantes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.totalEvidencias}</h3>
            <p>Total Evidencias</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{estadisticasGenerales.promedioEvidenciasPorProyecto}</h3>
            <p>Promedio Evid./Proyecto</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="admin-card">
          <h3 className="card-header">📈 Distribución General</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosEstadisticas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h3 className="card-header">📊 Estado de Evidencias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosEvidencias}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {datosEvidencias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h3 className="card-header">🎓 Estudiantes por Carrera</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosCarreras}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="reportes-content">
        {/* Tabla de Portafolios */}
        <div className="admin-card">
          <h2 className="card-header">
            <FolderOpen size={20} />
            Portafolios Detallados
          </h2>
          <div className="table-responsive">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Carrera</th>
                  <th>Programas</th>
                  <th>Proyectos</th>
                  <th>Total Evidencias</th>
                </tr>
              </thead>
              <tbody>
                {portafolios.map((p) => {
                  const programasPortafolio = programas.filter(pr => pr.nombre_portafolio === p.nombre);
                  const proyectosPortafolio = proyectos.filter(proy => proy.nombre_portafolio === p.nombre);
                  const evidenciasPortafolio = evidencias.filter(e => e.portafolio === p.nombre);
                  const totalEvidencias = evidenciasPortafolio.reduce((sum, e) => sum + e.total_evidencias, 0);

                  return (
                    <tr key={p.id_portafolio}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge">{p.carrera}</span></td>
                      <td><span className="counter">{programasPortafolio.length}</span></td>
                      <td><span className="counter">{proyectosPortafolio.length}</span></td>
                      <td><span className="counter success">{totalEvidencias}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Programas */}
        <div className="admin-card">
          <h2 className="card-header">
            <BookOpen size={20} />
            Programas y Proyectos
          </h2>
          <div className="table-responsive">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Programa</th>
                  <th>Descripción</th>
                  <th>Portafolio</th>
                  <th>Proyectos</th>
                </tr>
              </thead>
              <tbody>
                {programas.map((pr) => {
                  const proyectosPrograma = proyectos.filter(proy => proy.nombre_programa === pr.nombre);
                  
                  return (
                    <tr key={pr.id_programa}>
                      <td><strong>{pr.nombre}</strong></td>
                      <td>{pr.descripcion || "Sin descripción"}</td>
                      <td><span className="badge secondary">{pr.nombre_portafolio}</span></td>
                      <td><span className="counter">{proyectosPrograma.length}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Proyectos con Evidencias */}
        <div className="admin-card">
          <h2 className="card-header">
            <TrendingUp size={20} />
            Proyectos y Estado de Evidencias
          </h2>
          <div className="table-responsive">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Programa</th>
                  <th>Total</th>
                  <th>Aprobadas</th>
                  <th>Pendientes</th>
                  <th>Rechazadas</th>
                  <th>% Aprobación</th>
                </tr>
              </thead>
              <tbody>
                {evidencias.map((e, index) => {
                  const porcentajeAprobacion = e.total_evidencias > 0 ? 
                    ((e.evidencias_aprobadas / e.total_evidencias) * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={index}>
                      <td><strong>{e.proyecto}</strong></td>
                      <td><span className="badge">{e.programa}</span></td>
                      <td><span className="counter">{e.total_evidencias}</span></td>
                      <td><span className="counter success">{e.evidencias_aprobadas}</span></td>
                      <td><span className="counter warning">{e.evidencias_pendientes}</span></td>
                      <td><span className="counter danger">{e.evidencias_rechazadas}</span></td>
                      <td>
                        <span className={`percentage ${porcentajeAprobacion >= 80 ? 'high' : porcentajeAprobacion >= 60 ? 'medium' : 'low'}`}>
                          {porcentajeAprobacion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Estudiantes */}
        <div className="admin-card">
          <h2 className="card-header">
            <Users size={20} />
            Registro de Estudiantes
          </h2>
          <div className="table-responsive">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Carrera</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((e) => (
                  <tr key={e.id_usuario}>
                    <td><strong>{e.nombre} {e.apellido}</strong></td>
                    <td>{e.email}</td>
                    <td><span className="badge">{e.carrera}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.8rem;
          border-radius: 8px;
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
        }

        .stat-content p {
          font-size: 0.9rem;
          margin: 0;
          opacity: 0.9;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .badge.secondary {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .counter {
          background: #f5f5f5;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-weight: bold;
        }

        .counter.success {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .counter.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        .counter.danger {
          background: #ffebee;
          color: #d32f2f;
        }

        .percentage {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: bold;
        }

        .percentage.high {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .percentage.medium {
          background: #fff3e0;
          color: #f57c00;
        }

        .percentage.low {
          background: #ffebee;
          color: #d32f2f;
        }

        .loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
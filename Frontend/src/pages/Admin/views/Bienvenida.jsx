import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import proyectosService from "../../../services/proyectosService";
import "./ProyectosManager.css";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale, ArcElement);

const CARRERAS = [
  "Desarrollo de Software",
  "Mecatrónica",
  "Redes Inteligentes",
];

export default function Bienvenida({ user }) {
  const [proyectosPorPrograma, setProyectosPorPrograma] = useState({
    labels: [],
    data: [],
  });
  const [estudiantesPorCarrera, setEstudiantesPorCarrera] = useState({
    labels: [],
    data: [],
  });
  const [programasPorPortafolio, setProgramasPorPortafolio] = useState({
    labels: [],
    data: [],
  });
  const [ultimosEstudiantes, setUltimosEstudiantes] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const userData =
        user || JSON.parse(localStorage.getItem("userData") || "{}");
      let portafolios = [];

      if (userData.rol === "administrador") {
        portafolios = await proyectosService.getPortafoliosAsignados();
      } else {
        portafolios = await proyectosService.getMisPortafolios();
      }

      // Gráfica 1: Proyectos por Programa
      let labels = [];
      let dataArr = [];
      for (const portafolio of portafolios) {
        const programas = await proyectosService.getProgramasByPortafolio(
          portafolio.id_portafolio
        );
        for (const prog of programas) {
          const proyectos = await proyectosService.getProyectosByPrograma(
            prog.id_programa
          );
          labels.push(`${prog.nombre} (${portafolio.nombre})`);
          dataArr.push(proyectos.length);
        }
      }
      setProyectosPorPrograma({ labels, data: dataArr });

      // Gráfica 2: Estudiantes por carrera
      const labelsCarrera = [];
      const dataCarrera = [];
      let estudiantesTotales = [];
      for (const carrera of CARRERAS) {
        const estudiantes = await proyectosService.getEstudiantesByCarrera(
          carrera
        );
        labelsCarrera.push(carrera);
        dataCarrera.push(estudiantes.length);
        estudiantesTotales = estudiantesTotales.concat(estudiantes);
      }
      setEstudiantesPorCarrera({ labels: labelsCarrera, data: dataCarrera });

      // Guardar últimos estudiantes (opcional)
      setUltimosEstudiantes(estudiantesTotales.slice(-5).reverse());

      // Gráfica 3: Programas por Portafolio
      let labelsPP = [];
      let dataPP = [];
      for (const portafolio of portafolios) {
        const programas = await proyectosService.getProgramasByPortafolio(
          portafolio.id_portafolio
        );
        labelsPP.push(portafolio.nombre);
        dataPP.push(programas.length);
      }
      setProgramasPorPortafolio({ labels: labelsPP, data: dataPP });
    }
    fetchData();
  }, [user]);

  // Estadísticas rápidas
  const totalPortafolios = programasPorPortafolio.labels.length;
  const totalProgramas = proyectosPorPrograma.labels.length;
  const totalEstudiantes = estudiantesPorCarrera.data.reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="dashboard-content">
      {/* Header principal */}
      <div className="dashboard-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="dashboard-subtitle">
            Bienvenido,{" "}
            <strong>
              {user?.nombre} {user?.apellido}
            </strong>
          </p>
        </div>
        <div className="user-info-card">
          <div className="user-avatar">
            {user?.nombre?.charAt(0)}
            {user?.apellido?.charAt(0)}
          </div>
          <div className="user-details">
            <span className="user-name">
              {user?.nombre} {user?.apellido}
            </span>
            <span className="user-role">{user?.rol}</span>
          </div>
        </div>
      </div>
      {/* Tarjetas de estadísticas rápidas */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">Portafolios</span>
          <span className="stat-value">{totalPortafolios}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Programas</span>
          <span className="stat-value">{totalProgramas}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Estudiantes</span>
          <span className="stat-value">{totalEstudiantes}</span>
        </div>
      </div>
      {/* Grid de gráficas */}
      <div className="graficas-grid">
        <div className="grafica-card">
          <h3>Proyectos por Programa</h3>
          <Bar
            data={{
              labels: proyectosPorPrograma.labels,
              datasets: [
                {
                  label: "Proyectos",
                  data: proyectosPorPrograma.data,
                  backgroundColor: "#4e73df",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
            height={180}
          />
        </div>
        <div className="grafica-card">
          <h3>Programas por Portafolio</h3>
          <Bar
            data={{
              labels: programasPorPortafolio.labels,
              datasets: [
                {
                  label: "Programas",
                  data: programasPorPortafolio.data,
                  backgroundColor: "#1cc88a",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
            height={180}
          />
        </div>
        <div className="grafica-card">
          <h3>Estudiantes por Carrera</h3>
          <Pie
            data={{
              labels: estudiantesPorCarrera.labels,
              datasets: [
                {
                  label: "Estudiantes",
                  data: estudiantesPorCarrera.data,
                  backgroundColor: ["#4e73df", "#1cc88a", "#f6c23e"],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
            }}
            height={180}
          />
        </div>
      </div>
      {/* Últimos estudiantes registrados */}
      <div className="admin-card ultimos-estudiantes">
        <h4>Últimos Estudiantes Registrados</h4>
        <ul>
          {ultimosEstudiantes.map((e) => (
            <li key={e.id_usuario}>
              <span className="estudiante-nombre">
                {e.nombre} {e.apellido}
              </span>
              <span className="estudiante-carrera">{e.carrera}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* CSS extra para la vista */}
      <style>{`
        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem 1rem;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          gap: 2rem;
        }
        .dashboard-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.2rem;
          color: #4e73df;
        }
        .dashboard-subtitle {
          margin: 0;
          color: #555;
          font-size: 1.1rem;
        }
        .user-info-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f4f6fb;
          padding: 0.7rem 1.2rem;
          border-radius: 10px;
        }
        .user-avatar {
          background: #4e73df;
          color: #fff;
          font-weight: bold;
          font-size: 1.3rem;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .user-role {
          font-size: 0.95rem;
          color: #4e73df;
        }
        .stats-grid {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
          justify-content: center;
        }
        .stat-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px #0001;
          padding: 1.2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 140px;
        }
        .stat-title {
          color: #4e73df;
          font-weight: 600;
          font-size: 1rem;
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: bold;
          margin-top: 0.5rem;
        }
        .graficas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
          margin-bottom: 2.5rem;
        }
        .grafica-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px #0001;
          padding: 1.5rem 1rem;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .grafica-card h3 {
          color: #4e73df;
          margin-bottom: 1.2rem;
          font-weight: 600;
          text-align: center;
        }
        .admin-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px #0001;
          padding: 1.5rem 1rem;
          margin-bottom: 2rem;
        }
        .ultimos-estudiantes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .ultimos-estudiantes li {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 1rem;
        }
        .ultimos-estudiantes li:last-child {
          border-bottom: none;
        }
        .estudiante-nombre {
          font-weight: 500;
        }
        .estudiante-carrera {
          color: #4e73df;
          font-size: 0.95rem;
        }
        @media (max-width: 900px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .stats-grid {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
         
    </div>
  );
}

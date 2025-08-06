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
      for (const carrera of CARRERAS) {
        const estudiantes = await proyectosService.getEstudiantesByCarrera(
          carrera
        );
        labelsCarrera.push(carrera);
        dataCarrera.push(estudiantes.length);
      }
      setEstudiantesPorCarrera({ labels: labelsCarrera, data: dataCarrera });

      // Gráfica 3: Programas por Portafolio (NUEVA)
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

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="dashboard-subtitle">
            Bienvenido, {user?.nombre} {user?.apellido}
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

      {/* Gráfica de Proyectos por Programa */}
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
          />
        </div>

          {/* Gráfica de Programas por Portafolio (NUEVA) */}
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
          />
        </div>

        {/* Gráfica de Estudiantes por Carrera */}
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
          />
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import authService from "../../services/authService";
import PortfolioManager from "./PortfolioManager";
import ProgramasManager from "./ProgramasManager";
import ProyectosManager from "./ProyectosManager";
import ReunionesManager from "./ReunionesManager";
import "../Superadmin/Superadmin.css";
import Sidebar from "./Sidebar";
import proyectosService from "../../services/proyectosService";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale);

const CARRERAS = [
  "Desarrollo de Software",
  "Mecatrónica",
  "Redes Inteligentes",
];

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState("bienvenida");
  const [stats, setStats] = useState({
    totalPortafolios: "-",
    totalProgramas: "-",
    totalEstudiantes: "-",
    totalReuniones: "-",
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Portafolios
        const portafolios = await proyectosService.getMisPortafolios();

        // 2. Programas (sumar todos los programas de todos los portafolios)
        let totalProgramas = 0;
        for (const p of portafolios) {
          const programas = await proyectosService.getProgramasByPortafolio(
            p.id_portafolio
          );
          totalProgramas += Array.isArray(programas) ? programas.length : 0;
        }

        // 3. Estudiantes activos por carrera
        let totalEstudiantes = 0;
        for (const carrera of CARRERAS) {
          const estudiantes = await proyectosService.getEstudiantesByCarrera(
            carrera
          );
          totalEstudiantes += Array.isArray(estudiantes)
            ? estudiantes.length
            : 0;
        }

        // 4. Reuniones programadas
        let totalReuniones = 0;
        if (proyectosService.getReunionesCoordinador) {
          const reuniones = await proyectosService.getReunionesCoordinador();
          totalReuniones = Array.isArray(reuniones) ? reuniones.length : 0;
        }

        setStats({
          totalPortafolios: portafolios.length,
          totalProgramas,
          totalEstudiantes,
          totalReuniones,
        });
      } catch (e) {
        setStats({
          totalPortafolios: "-",
          totalProgramas: "-",
          totalEstudiantes: "-",
          totalReuniones: "-",
        });
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <Sidebar vista={vista} setVista={setVista} />
      <main className="admin-main">
        {vista === "bienvenida" && (
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

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalPortafolios}</div>
                  <div className="stat-label">Total Portafolios</div>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalReuniones}</div>
                  <div className="stat-label">Reuniones Programadas</div>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalEstudiantes}</div>
                  <div className="stat-label">Estudiantes Activos</div>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🏫</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalProgramas}</div>
                  <div className="stat-label">Programas Activos</div>
                </div>
              </div>
            </div>

            {/* Gráfico de barras */}
            <div style={{ maxWidth: 500, margin: "2rem auto" }}>
              <Bar
                data={{
                  labels: [
                    "Portafolios",
                    "Programas",
                    "Estudiantes",
                    "Reuniones",
                  ],
                  datasets: [
                    {
                      label: "Totales",
                      data: [
                        stats.totalPortafolios === "-"
                          ? 0
                          : stats.totalPortafolios,
                        stats.totalProgramas === "-" ? 0 : stats.totalProgramas,
                        stats.totalEstudiantes === "-"
                          ? 0
                          : stats.totalEstudiantes,
                        stats.totalReuniones === "-" ? 0 : stats.totalReuniones,
                      ],
                      backgroundColor: [
                        "#4e73df",
                        "#1cc88a",
                        "#36b9cc",
                        "#f6c23e",
                      ],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="dashboard-grid">
            </div>
          </div>
        )}

        {vista === "portafolios" && <PortfolioManager />}
        {vista === "programas" && <ProgramasManager />}
        {vista === "proyectos" && <ProyectosManager />}
        {vista === "reuniones" && <ReunionesManager />}
      </main>
    </div>
  );
}

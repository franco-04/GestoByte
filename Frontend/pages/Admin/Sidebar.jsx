import React from "react";
import {
  AiFillDashboard,
  AiFillFolder,
  AiOutlineUsergroupAdd,
  AiOutlineLineChart,
  AiFillSetting,
} from "react-icons/ai";
import logo from "../../assets/log.png";

export default function Sidebar({ vista, setVista }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <h2>Panel de Profesores</h2>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`sidebar-button${vista === "bienvenida" ? " active" : ""}`}
          onClick={() => setVista("bienvenida")}
        >
          <AiFillDashboard className="sidebar-icon" /> Dashboard
        </button>
        <button
          className={`sidebar-button${
            vista === "portafolios" ? " active" : ""
          }`}
          onClick={() => setVista("portafolios")}
        >
          <AiFillFolder className="sidebar-icon" /> Gestionar Portafolios
        </button>
        <button
          className={`sidebar-button${
            vista === "estudiantes" ? " active" : ""
          }`}
          onClick={() => setVista("estudiantes")}
        >
          <AiOutlineUsergroupAdd className="sidebar-icon" /> Estudiantes
        </button>
        <button
          className={`sidebar-button${vista === "reportes" ? " active" : ""}`}
          onClick={() => setVista("reportes")}
        >
          <AiOutlineLineChart className="sidebar-icon" /> Reportes
        </button>
        <button
          className="sidebar-button logout"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            localStorage.removeItem("userRole");
            window.location.href = "/login";
          }}
        >
          <AiFillSetting className="sidebar-icon" /> Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}

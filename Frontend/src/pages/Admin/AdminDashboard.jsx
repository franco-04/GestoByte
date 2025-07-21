import React, { useState } from "react";
import authService from "../../services/authService";
import Sidebar from "./Sidebar";
import Bienvenida from "./views/Bienvenida";
import Portafolios from "./views/Portafolios.jsx/";
import Estudiantes from "./views/Estudiantes.jsx/";
import Reportes from "./views/Reportes.jsx";
import Configuracion from "./views/Configuracion.jsx/";
import "../Admin/Admin.css";

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [vista, setVista] = useState("bienvenida");

  return (
    <div className="admin-dashboard-container">
      <Sidebar vista={vista} setVista={setVista} />
      <main className="admin-main">
        {vista === "bienvenida" && <Bienvenida user={user} />}
        {vista === "portafolios" && <Portafolios />}
        {vista === "estudiantes" && <Estudiantes />}
        {vista === "reportes" && <Reportes />}
        {vista === "configuracion" && <Configuracion />}
      </main>
    </div>
  );
}

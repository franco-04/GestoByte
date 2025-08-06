import React, { useEffect, useState } from "react";
import proyectosService from "../../../services/proyectosService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./ProyectosManager.css";

export default function Reportes() {
  const [portafolios, setPortafolios] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const portafoliosData = await proyectosService.getPortafoliosAsignados();
      setPortafolios(portafoliosData);

      let allProgramas = [];
      let allProyectos = [];
      for (const p of portafoliosData) {
        const programas = await proyectosService.getProgramasByPortafolio(
          p.id_portafolio
        );
        // Agrega el nombre del portafolio a cada programa
        const programasConPortafolio = programas.map(pr => ({
          ...pr,
          nombre_portafolio: p.nombre
        }));
        allProgramas = allProgramas.concat(programasConPortafolio);
        for (const prog of programas) {
          const proyectos = await proyectosService.getProyectosByPrograma(
            prog.id_programa
          );
          allProyectos = allProyectos.concat(proyectos);
        }
      }
      setProgramas(allProgramas);
      setProyectos(allProyectos);

      const carreras = [
        "Desarrollo de Software",
        "Mecatrónica",
        "Redes Inteligentes",
      ];
      let allEstudiantes = [];
      for (const carrera of carreras) {
        const estudiantesCarrera =
          await proyectosService.getEstudiantesByCarrera(carrera);
        const estudiantesConCarrera = estudiantesCarrera.map(e => ({
          ...e,
          carrera
        }));
        allEstudiantes = allEstudiantes.concat(estudiantesConCarrera);
      }
      setEstudiantes(allEstudiantes);

      setLoading(false);
    }
    fetchData();
  }, []);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Portafolios", 10, 10);
    autoTable(doc, {
      head: [["ID", "Nombre", "Carrera"]],
      body: portafolios.map((p) => [p.id_portafolio, p.nombre, p.carrera]),
    });
    doc.text("Reporte de Programas", 10, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["ID", "Nombre", "Descripción", "Portafolio"]],
      body: programas.map((pr) => [
        pr.id_programa,
        pr.nombre,
        pr.descripcion,
        pr.nombre_portafolio
      ]),
    });
    doc.text("Reporte de Estudiantes", 10, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["ID", "Nombre", "Apellido", "Email", "Carrera"]],
      body: estudiantes.map((e) => [
        e.id_usuario,
        e.nombre,
        e.apellido,
        e.email,
        e.carrera
      ]),
    });
    doc.save("reporte.pdf");
  };

  return (
    <div className="admin-section reportes-section">
      <div className="admin-header reportes-header">
        <h1>📊 Reportes del Sistema</h1>
        <button className="btn btn-primary" onClick={exportarPDF}>
          📄 Exportar PDF
        </button>
      </div>
      {loading ? (
        <div className="loader">Cargando datos...</div>
      ) : (
        <div className="reportes-content">
          <div className="admin-card">
            <h2 className="card-header">Portafolios</h2>
            <div className="table-responsive">
              <table className="reporte-table">
                <thead>
                  <tr>
                    {/* <th>ID</th> */}
                    <th>Nombre</th>
                    <th>Carrera</th>
                  </tr>
                </thead>
                <tbody>
                  {portafolios.map((p) => (
                    <tr key={p.id_portafolio}>
                      {/* <td>{p.id_portafolio}</td> */}
                      <td>{p.nombre}</td>
                      <td>{p.carrera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-card">
            <h2 className="card-header">Programas</h2>
            <div className="table-responsive">
              <table className="reporte-table">
                <thead>
                  <tr>
                    {/* <th>ID</th> */}
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Portafolio</th>
                  </tr>
                </thead>
                <tbody>
                  {programas.map((pr) => (
                    <tr key={pr.id_programa}>
                      {/* <td>{pr.id_programa}</td> */}
                      <td>{pr.nombre}</td>
                      <td>{pr.descripcion}</td>
                      <td>{pr.nombre_portafolio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-card">
            <h2 className="card-header">Estudiantes</h2>
            <div className="table-responsive">
              <table className="reporte-table">
                <thead>
                  <tr>
                    {/* <th>ID</th> */}
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Carrera</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((e) => (
                    <tr key={e.id_usuario}>
                      {/* <td>{e.id_usuario}</td> */}
                      <td>{e.nombre}</td>
                      <td>{e.apellido}</td>
                      <td>{e.email}</td>
                      <td>{e.carrera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
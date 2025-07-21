import React, { useEffect, useState } from "react";
import proyectosService from "../../../services/proyectosService";
import "./admin.css";

export default function Estudiantes() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const carrera = userData?.carrera || "";

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const data = await proyectosService.getEstudiantesByCarrera(carrera);
        setEstudiantes(data);
      } catch (err) {
        setError("Error al cargar estudiantes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (carrera) {
      fetchEstudiantes();
    } else {
      setError("No se encontró la carrera del coordinador");
      setLoading(false);
    }
  }, [carrera]);

  if (loading) return <p>Cargando estudiantes...</p>;
  if (error) return <p>{error}</p>;
  if (estudiantes.length === 0)
    return <p>No hay estudiantes en esta carrera.</p>;

  return (
    <div className="estudiantes-container">
      <h1 className="estudiantes-title">Estudiantes de la carrera {carrera}</h1>
      <ul className="estudiantes-list">
        {estudiantes.map(e => (
          <li key={e.id_usuario} className="estudiante-card">
            <p className="estudiante-nombre">{e.nombre} {e.apellido}</p>
            <p className="estudiante-id">ID: {e.id_usuario}</p>
            <p className="estudiante-id">{e.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
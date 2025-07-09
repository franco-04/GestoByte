import pool from "../config/db.js";

export const createPortfolio = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      nombre,
      descripcion,
      carrera,
      fecha_inicio,
      fecha_fin,
      activo,
      estudiantes,
    } = req.body;

    const id_coordinador = req.user.id;
    const fecha_creacion = new Date();

    await connection.beginTransaction();

    // 1. Crear el portafolio
    const [result] = await connection.query(
      "INSERT INTO portafolios (nombre, descripcion, carrera, id_coordinador, fecha_inicio, fecha_fin, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        descripcion,
        carrera,
        id_coordinador,
        fecha_inicio,
        fecha_fin,
        activo,
        fecha_creacion,
      ]
    );

    const id_portafolio = result.insertId;

    // 2. Asignar alumnos al portafolio
    if (Array.isArray(estudiantes) && estudiantes.length > 0) {
      const values = estudiantes.map((id_usuario) => [
        id_portafolio,
        id_usuario,
      ]);
      await connection.query(
        "INSERT INTO portafolio_alumnos (id_portafolio, id_usuario) VALUES ?",
        [values]
      );
    }

    await connection.commit();

    res
      .status(201)
      .json({ message: "Portafolio creado y alumnos asignados correctamente" });
  } catch (error) {
    await connection.rollback();
    res
      .status(500)
      .json({ error: "Error al crear portafolio o asignar alumnos" });
  } finally {
    connection.release();
  }
};

export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE rol = ?", [
      "Estudiante",
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const getPortafoliosByProfesor = async (req, res) => {
  try {
    const id_coordinador = req.user.id;
    const [rows] = await pool.query(
      "SELECT * FROM portafolios WHERE id_coordinador = ? AND activo = 1",
      [id_coordinador]
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener portafolios del coordinador" });
  }
};

export const eliminarPortafolio = async (req, res) => {
  try {
    const id_portafolio = req.params.id;
    const id_coordinador = req.user.id; 

    // Solo permite que el coordinador dueño lo elimine
    const [result] = await pool.query(
      "UPDATE portafolios SET activo = 0 WHERE id_portafolio = ? AND id_coordinador = ?",
      [id_portafolio, id_coordinador]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Portafolio no encontrado o no autorizado" });
    }

    res.json({ message: "Portafolio eliminado lógicamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar portafolio" });
  }
};

export const editarPortafolio = async (req, res) => {
  try {
    const id_portafolio = req.params.id;
    const id_coordinador = req.user.id; 
    const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;

    // Solo permite que el coordinador dueño lo edite
    const [result] = await pool.query(
      `UPDATE portafolios 
       SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?
       WHERE id_portafolio = ? AND id_coordinador = ? AND activo = 1`,
      [nombre, descripcion, fecha_inicio, fecha_fin, id_portafolio, id_coordinador]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Portafolio no encontrado o no autorizado" });
    }

    res.json({ message: "Portafolio actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar portafolio" });
  }
};

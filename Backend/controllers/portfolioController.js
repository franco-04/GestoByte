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

export const getEstudiantesPortafolio = async (req, res) => {
  try {
    const id_portafolio = req.params.id;
    const id_coordinador = req.user.id;


    const [portafolio] = await pool.query(
      "SELECT carrera FROM portafolios WHERE id_portafolio = ? AND id_coordinador = ? AND activo = 1",
      [id_portafolio, id_coordinador]
    );

    if (portafolio.length === 0) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }


    const [estudiantesActuales] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.carrera 
       FROM usuarios u 
       INNER JOIN portafolio_alumnos pa ON u.id_usuario = pa.id_usuario 
       WHERE pa.id_portafolio = ?`,
      [id_portafolio]
    );

    res.json({
      carrera: portafolio[0].carrera,
      estudiantes: estudiantesActuales
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estudiantes del portafolio" });
  }
};

export const editarPortafolio = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id_portafolio = req.params.id;
    const id_coordinador = req.user.id;

    const { nombre, descripcion, fecha_inicio, fecha_fin, estudiantes } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE portafolios 
       SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?
       WHERE id_portafolio = ? AND id_coordinador = ? AND activo = 1`,
      [nombre, descripcion, fecha_inicio, fecha_fin, id_portafolio, id_coordinador]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Portafolio no encontrado o no autorizado" });
    }


    if (Array.isArray(estudiantes)) {

      await connection.query(
        "DELETE FROM portafolio_alumnos WHERE id_portafolio = ?",
        [id_portafolio]
      );

  
      if (estudiantes.length > 0) {
        const values = estudiantes.map((id_usuario) => [
          id_portafolio,
          id_usuario,
        ]);
        await connection.query(
          "INSERT INTO portafolio_alumnos (id_portafolio, id_usuario) VALUES ?",
          [values]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Portafolio actualizado correctamente" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Error al actualizar portafolio" });
  } finally {
    connection.release();
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const id_usuario = req.user.id;


    const [totalPortafolios] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM portafolio_alumnos pa 
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio 
       WHERE pa.id_usuario = ? AND p.activo = 1`,
      [id_usuario]
    );

    const [portafoliosActivos] = await pool.query(
      `SELECT COUNT(*) as activos 
       FROM portafolio_alumnos pa 
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio 
       WHERE pa.id_usuario = ? AND p.activo = 1 AND p.fecha_fin >= CURDATE()`,
      [id_usuario]
    );


    const [proximasEntregas] = await pool.query(
      `SELECT COUNT(*) as proximas 
       FROM portafolio_alumnos pa 
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio 
       WHERE pa.id_usuario = ? AND p.activo = 1 
       AND p.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [id_usuario]
    );

    res.json({
      totalPortafolios: totalPortafolios[0].total,
      portafoliosActivos: portafoliosActivos[0].activos,
      proximasEntregas: proximasEntregas[0].proximas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del estudiante:', error);
    res.status(500).json({ error: "Error al obtener estadísticas del estudiante" });
  }
};

export const getStudentPortafolios = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    const [portafolios] = await pool.query(
      `SELECT 
        p.id_portafolio,
        p.nombre,
        p.descripcion,
        p.carrera,
        p.fecha_inicio,
        p.fecha_fin,
        p.fecha_creacion,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido,
        u.email as coordinador_email
       FROM portafolio_alumnos pa
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio
       INNER JOIN usuarios u ON p.id_coordinador = u.id_usuario
       WHERE pa.id_usuario = ? AND p.activo = 1
       ORDER BY p.fecha_creacion DESC`,
      [id_usuario]
    );

    res.json(portafolios);
  } catch (error) {
    console.error('Error al obtener portafolios del estudiante:', error);
    res.status(500).json({ error: "Error al obtener portafolios del estudiante" });
  }
};

export const getStudentPortfolioDetails = async (req, res) => {
  try {
    const id_portafolio = req.params.id;
    const id_usuario = req.user.id;

    const [access] = await pool.query(
      `SELECT pa.id_usuario 
       FROM portafolio_alumnos pa 
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio
       WHERE pa.id_portafolio = ? AND pa.id_usuario = ? AND p.activo = 1`,
      [id_portafolio, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este portafolio" });
    }


    const [portafolio] = await pool.query(
      `SELECT 
        p.id_portafolio,
        p.nombre,
        p.descripcion,
        p.carrera,
        p.fecha_inicio,
        p.fecha_fin,
        p.fecha_creacion,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido,
        u.email as coordinador_email
       FROM portafolios p
       INNER JOIN usuarios u ON p.id_coordinador = u.id_usuario
       WHERE p.id_portafolio = ? AND p.activo = 1`,
      [id_portafolio]
    );

    if (portafolio.length === 0) {
      return res.status(404).json({ error: "Portafolio no encontrado" });
    }

    const [compañeros] = await pool.query(
      `SELECT u.nombre, u.apellido, u.email
       FROM portafolio_alumnos pa
       INNER JOIN usuarios u ON pa.id_usuario = u.id_usuario
       WHERE pa.id_portafolio = ? AND pa.id_usuario != ?
       ORDER BY u.nombre, u.apellido`,
      [id_portafolio, id_usuario]
    );

    res.json({
      portafolio: portafolio[0],
      compañeros: compañeros
    });
  } catch (error) {
    console.error('Error al obtener detalles del portafolio:', error);
    res.status(500).json({ error: "Error al obtener detalles del portafolio" });
  }
};
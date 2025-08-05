import pool from "../config/db.js";

// Crear nueva reunión (solo coordinadores/superadmin)
export const crearReunion = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      titulo,
      descripcion,
      fecha_reunion,
      duracion_minutos = 60,
      ubicacion,
      id_portafolio
    } = req.body;

    const id_coordinador = req.user.id;

    // Verificar que el coordinador sea dueño del portafolio
    const [portafolio] = await connection.query(
      "SELECT * FROM portafolios WHERE id_portafolio = ? AND id_coordinador = ?",
      [id_portafolio, id_coordinador]
    );

    if (portafolio.length === 0) {
      return res.status(403).json({ error: "No tienes permisos para crear reuniones en este portafolio" });
    }

    await connection.beginTransaction();

    // Crear la reunión
    const [result] = await connection.query(
      `INSERT INTO reuniones 
       (titulo, descripcion, fecha_reunion, duracion_minutos, ubicacion, id_portafolio, id_coordinador) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, fecha_reunion, duracion_minutos, ubicacion, id_portafolio, id_coordinador]
    );

    const id_reunion = result.insertId;

    // Agregar automáticamente todos los estudiantes del portafolio como participantes
    const [estudiantes] = await connection.query(
      "SELECT id_usuario FROM portafolio_alumnos WHERE id_portafolio = ?",
      [id_portafolio]
    );

    if (estudiantes.length > 0) {
      const participantes = estudiantes.map(est => [id_reunion, est.id_usuario]);
      await connection.query(
        "INSERT INTO reunion_participantes (id_reunion, id_usuario) VALUES ?",
        [participantes]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Reunión creada exitosamente",
      id_reunion: id_reunion
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear reunión:', error);
    res.status(500).json({ error: "Error al crear la reunión" });
  } finally {
    connection.release();
  }
};

// Obtener reuniones del coordinador
export const getReunionesCoordinador = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    const [reuniones] = await pool.query(
      `SELECT 
        r.*,
        p.nombre as nombre_portafolio,
        p.carrera,
        COUNT(rp.id_usuario) as total_participantes,
        COUNT(CASE WHEN rp.confirmado = 1 THEN 1 END) as confirmados
       FROM reuniones r
       INNER JOIN portafolios p ON r.id_portafolio = p.id_portafolio
       LEFT JOIN reunion_participantes rp ON r.id_reunion = rp.id_reunion
       WHERE r.id_coordinador = ? AND r.estado != 'cancelada'
       GROUP BY r.id_reunion
       ORDER BY r.fecha_reunion ASC`,
      [id_coordinador]
    );

    res.json(reuniones);
  } catch (error) {
    console.error('Error al obtener reuniones del coordinador:', error);
    res.status(500).json({ error: "Error al obtener las reuniones" });
  }
};

// Obtener reuniones de un estudiante
export const getReunionesEstudiante = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    const [reuniones] = await pool.query(
      `SELECT 
        r.*,
        p.nombre as nombre_portafolio,
        p.carrera,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido,
        rp.confirmado,
        rp.fecha_confirmacion
       FROM reunion_participantes rp
       INNER JOIN reuniones r ON rp.id_reunion = r.id_reunion
       INNER JOIN portafolios p ON r.id_portafolio = p.id_portafolio
       INNER JOIN usuarios u ON r.id_coordinador = u.id_usuario
       WHERE rp.id_usuario = ? AND r.estado != 'cancelada'
       ORDER BY r.fecha_reunion ASC`,
      [id_estudiante]
    );

    res.json(reuniones);
  } catch (error) {
    console.error('Error al obtener reuniones del estudiante:', error);
    res.status(500).json({ error: "Error al obtener las reuniones" });
  }
};

// Confirmar asistencia a reunión (estudiantes)
export const confirmarAsistencia = async (req, res) => {
  try {
    const { id_reunion } = req.params;
    const id_estudiante = req.user.id;

    // Verificar que el estudiante esté invitado a la reunión
    const [participante] = await pool.query(
      "SELECT * FROM reunion_participantes WHERE id_reunion = ? AND id_usuario = ?",
      [id_reunion, id_estudiante]
    );

    if (participante.length === 0) {
      return res.status(404).json({ error: "No estás invitado a esta reunión" });
    }

    // Actualizar confirmación
    await pool.query(
      "UPDATE reunion_participantes SET confirmado = 1, fecha_confirmacion = NOW() WHERE id_reunion = ? AND id_usuario = ?",
      [id_reunion, id_estudiante]
    );

    res.json({ success: true, message: "Asistencia confirmada" });
  } catch (error) {
    console.error('Error al confirmar asistencia:', error);
    res.status(500).json({ error: "Error al confirmar asistencia" });
  }
};

// Actualizar reunión (solo coordinadores)
export const actualizarReunion = async (req, res) => {
  try {
    const { id_reunion } = req.params;
    const id_coordinador = req.user.id;
    const {
      titulo,
      descripcion,
      fecha_reunion,
      duracion_minutos,
      ubicacion,
      estado
    } = req.body;

    // Verificar que el coordinador sea dueño de la reunión
    const [reunion] = await pool.query(
      "SELECT * FROM reuniones WHERE id_reunion = ? AND id_coordinador = ?",
      [id_reunion, id_coordinador]
    );

    if (reunion.length === 0) {
      return res.status(403).json({ error: "No tienes permisos para editar esta reunión" });
    }

    await pool.query(
      `UPDATE reuniones 
       SET titulo = ?, descripcion = ?, fecha_reunion = ?, duracion_minutos = ?, ubicacion = ?, estado = ?
       WHERE id_reunion = ?`,
      [titulo, descripcion, fecha_reunion, duracion_minutos, ubicacion, estado, id_reunion]
    );

    res.json({ success: true, message: "Reunión actualizada exitosamente" });
  } catch (error) {
    console.error('Error al actualizar reunión:', error);
    res.status(500).json({ error: "Error al actualizar la reunión" });
  }
};

// Obtener detalles de una reunión específica
export const getDetalleReunion = async (req, res) => {
  try {
    const { id_reunion } = req.params;
    const id_usuario = req.user.id;

    // Obtener información de la reunión
    const [reunion] = await pool.query(
      `SELECT 
        r.*,
        p.nombre as nombre_portafolio,
        p.carrera,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido
       FROM reuniones r
       INNER JOIN portafolios p ON r.id_portafolio = p.id_portafolio
       INNER JOIN usuarios u ON r.id_coordinador = u.id_usuario
       WHERE r.id_reunion = ?`,
      [id_reunion]
    );

    if (reunion.length === 0) {
      return res.status(404).json({ error: "Reunión no encontrada" });
    }

    // Verificar que el usuario tenga acceso a esta reunión
    const [acceso] = await pool.query(
      `SELECT 1 FROM reunion_participantes WHERE id_reunion = ? AND id_usuario = ? 
       UNION 
       SELECT 1 FROM reuniones WHERE id_reunion = ? AND id_coordinador = ?`,
      [id_reunion, id_usuario, id_reunion, id_usuario]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta reunión" });
    }

    // Obtener participantes
    const [participantes] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        rp.confirmado,
        rp.fecha_confirmacion
       FROM reunion_participantes rp
       INNER JOIN usuarios u ON rp.id_usuario = u.id_usuario
       WHERE rp.id_reunion = ?
       ORDER BY u.nombre, u.apellido`,
      [id_reunion]
    );

    res.json({
      reunion: reunion[0],
      participantes: participantes
    });
  } catch (error) {
    console.error('Error al obtener detalles de reunión:', error);
    res.status(500).json({ error: "Error al obtener los detalles de la reunión" });
  }
};

// Estadísticas de reuniones para coordinador
export const getEstadisticasReuniones = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(CASE WHEN estado = 'programada' AND fecha_reunion > NOW() THEN 1 END) as proximas,
        COUNT(CASE WHEN estado = 'programada' AND fecha_reunion < NOW() THEN 1 END) as vencidas,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
        COUNT(*) as total
       FROM reuniones 
       WHERE id_coordinador = ? AND estado != 'cancelada'`,
      [id_coordinador]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};
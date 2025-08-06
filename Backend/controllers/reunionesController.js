import pool from "../config/db.js";

// Crear nueva reunión (solo coordinadores/superadmin) - MODIFICADO PARA PROYECTOS
export const crearReunion = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      titulo,
      descripcion,
      fecha_reunion,
      duracion_minutos = 60,
      ubicacion,
      id_proyecto, // CAMBIO: Ahora recibimos id_proyecto en lugar de id_portafolio
      participantes = [] // CAMBIO: Lista específica de participantes
    } = req.body;

    const id_coordinador = req.user.id;

    // CAMBIO: Verificar que el coordinador tenga acceso al proyecto
    const [proyecto] = await connection.query(
      `SELECT p.*, port.id_coordinador 
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE p.id_proyecto = ? AND port.id_coordinador = ? AND p.activo = 1`,
      [id_proyecto, id_coordinador]
    );

    if (proyecto.length === 0) {
      return res.status(403).json({ error: "No tienes permisos para crear reuniones para este proyecto" });
    }

    await connection.beginTransaction();

    // CAMBIO: Crear la reunión con id_proyecto
    const [result] = await connection.query(
      `INSERT INTO reuniones 
       (titulo, descripcion, fecha_reunion, duracion_minutos, ubicacion, id_proyecto, id_coordinador) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, fecha_reunion, duracion_minutos, ubicacion, id_proyecto, id_coordinador]
    );

    const id_reunion = result.insertId;

    // CAMBIO: Agregar participantes específicos en lugar de todos los estudiantes del portafolio
    if (participantes.length > 0) {
      const participantesValues = participantes.map(id_usuario => [id_reunion, id_usuario]);
      await connection.query(
        "INSERT INTO reunion_participantes (id_reunion, id_usuario) VALUES ?",
        [participantesValues]
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

// CAMBIO: Obtener proyectos del coordinador para reuniones
export const getProyectosParaReuniones = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    const [proyectos] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as proyecto_nombre,
        p.descripcion as proyecto_descripcion,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        port.carrera,
        COUNT(pe.id_estudiante) as total_estudiantes
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       WHERE port.id_coordinador = ? AND p.activo = 1
       GROUP BY p.id_proyecto
       ORDER BY p.fecha_creacion DESC`,
      [id_coordinador]
    );

    res.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos del coordinador:', error);
    res.status(500).json({ error: "Error al obtener los proyectos" });
  }
};

// CAMBIO: Obtener estudiantes de un proyecto específico para reuniones
export const getEstudiantesProyectoReunion = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_coordinador = req.user.id;

    // Verificar que el coordinador tenga acceso al proyecto
    const [acceso] = await pool.query(
      `SELECT p.id_proyecto
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE p.id_proyecto = ? AND port.id_coordinador = ? AND p.activo = 1`,
      [id_proyecto, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    // Obtener estudiantes del proyecto
    const [estudiantes] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        pe.rol
       FROM proyecto_estudiantes pe
       INNER JOIN usuarios u ON pe.id_estudiante = u.id_usuario
       WHERE pe.id_proyecto = ?
       ORDER BY pe.rol DESC, u.nombre ASC`,
      [id_proyecto]
    );

    res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes del proyecto:', error);
    res.status(500).json({ error: "Error al obtener estudiantes del proyecto" });
  }
};

// MODIFICADO: Obtener reuniones del coordinador
export const getReunionesCoordinador = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    const [reuniones] = await pool.query(
      `SELECT 
        r.*,
        COALESCE(p.nombre, 'Proyecto eliminado') as proyecto_nombre,
        COALESCE(prog.nombre, 'Programa eliminado') as programa_nombre,
        COALESCE(port.nombre, 'Portafolio eliminado') as portafolio_nombre,
        COALESCE(port.carrera, 'Sin carrera') as carrera,
        COUNT(rp.id_usuario) as total_participantes,
        COUNT(CASE WHEN rp.confirmado = 1 THEN 1 END) as confirmados
       FROM reuniones r
       LEFT JOIN proyectos p ON r.id_proyecto = p.id_proyecto
       LEFT JOIN programas prog ON p.id_programa = prog.id_programa
       LEFT JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
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

// MODIFICADO: Obtener reuniones de un estudiante
export const getReunionesEstudiante = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    const [reuniones] = await pool.query(
      `SELECT 
        r.*,
        COALESCE(p.nombre, 'Proyecto eliminado') as proyecto_nombre,
        COALESCE(prog.nombre, 'Programa eliminado') as programa_nombre,
        COALESCE(port.nombre, 'Portafolio eliminado') as portafolio_nombre,
        COALESCE(port.carrera, 'Sin carrera') as carrera,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido,
        rp.confirmado,
        rp.fecha_confirmacion
       FROM reunion_participantes rp
       INNER JOIN reuniones r ON rp.id_reunion = r.id_reunion
       LEFT JOIN proyectos p ON r.id_proyecto = p.id_proyecto
       LEFT JOIN programas prog ON p.id_programa = prog.id_programa
       LEFT JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
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

// Confirmar asistencia a reunión (estudiantes) - SIN CAMBIOS
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

// Actualizar reunión (solo coordinadores) - SIN CAMBIOS
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

// MODIFICADO: Obtener detalles de una reunión específica
export const getDetalleReunion = async (req, res) => {
  try {
    const { id_reunion } = req.params;
    const id_usuario = req.user.id;

    // Obtener información de la reunión
    const [reunion] = await pool.query(
      `SELECT 
        r.*,
        COALESCE(p.nombre, 'Proyecto eliminado') as proyecto_nombre,
        COALESCE(prog.nombre, 'Programa eliminado') as programa_nombre,
        COALESCE(port.nombre, 'Portafolio eliminado') as portafolio_nombre,
        COALESCE(port.carrera, 'Sin carrera') as carrera,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido
       FROM reuniones r
       LEFT JOIN proyectos p ON r.id_proyecto = p.id_proyecto
       LEFT JOIN programas prog ON p.id_programa = prog.id_programa
       LEFT JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
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

// Estadísticas de reuniones para coordinador - SIN CAMBIOS
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



// Obtener detalles completos de un proyecto para coordinadores
export const getDetalleProyectoCoordinador = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_coordinador = req.user.id;

    // Verificar que el coordinador tenga acceso al proyecto
    const [acceso] = await pool.query(
      `SELECT p.id_proyecto
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE p.id_proyecto = ? AND port.id_coordinador = ? AND p.activo = 1`,
      [id_proyecto, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    // Obtener información completa del proyecto
    const [proyecto] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as titulo,
        p.descripcion,
        p.fecha_creacion,
        p.id_lider,
        prog.nombre as programa_nombre,
        prog.descripcion as programa_descripcion,
        port.nombre as portafolio_nombre,
        port.carrera,
        u_lider.nombre as lider_nombre,
        u_lider.apellido as lider_apellido,
        u_lider.email as lider_email,
        COUNT(DISTINCT pe.id_estudiante) as total_miembros,
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_aprobadas
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       INNER JOIN usuarios u_lider ON p.id_lider = u_lider.id_usuario
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       WHERE p.id_proyecto = ? AND p.activo = 1
       GROUP BY p.id_proyecto`,
      [id_proyecto]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Obtener miembros del equipo
    const [miembros] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        pe.rol,
        COUNT(DISTINCT aa.id_actividad) as actividades_asignadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN aa.id_actividad END) as actividades_completadas
       FROM proyecto_estudiantes pe
       INNER JOIN usuarios u ON pe.id_estudiante = u.id_usuario
       LEFT JOIN actividad_asignaciones aa ON u.id_usuario = aa.id_usuario AND aa.activo = 1
       LEFT JOIN actividades_proyecto ap ON aa.id_actividad = ap.id_actividad AND ap.activo = 1 AND ap.id_proyecto = ?
       WHERE pe.id_proyecto = ?
       GROUP BY u.id_usuario
       ORDER BY pe.rol DESC, u.nombre ASC`,
      [id_proyecto, id_proyecto]
    );

    // Obtener actividades recientes
    const [actividadesRecientes] = await pool.query(
      `SELECT 
        ap.id_actividad,
        ap.titulo,
        ap.estado,
        ap.prioridad,
        ap.fecha_limite,
        ap.fecha_actualizacion,
        u_creador.nombre as creador_nombre,
        u_creador.apellido as creador_apellido,
        GROUP_CONCAT(CONCAT(u_asignado.nombre, ' ', u_asignado.apellido) SEPARATOR ', ') as asignados
       FROM actividades_proyecto ap
       LEFT JOIN usuarios u_creador ON ap.id_creador = u_creador.id_usuario
       LEFT JOIN actividad_asignaciones aa ON ap.id_actividad = aa.id_actividad AND aa.activo = 1
       LEFT JOIN usuarios u_asignado ON aa.id_usuario = u_asignado.id_usuario
       WHERE ap.id_proyecto = ? AND ap.activo = 1
       GROUP BY ap.id_actividad
       ORDER BY ap.fecha_actualizacion DESC
       LIMIT 5`,
      [id_proyecto]
    );

    // Obtener reuniones del proyecto
    const [reuniones] = await pool.query(
      `SELECT 
        r.id_reunion,
        r.titulo,
        r.fecha_reunion,
        r.estado,
        COUNT(rp.id_usuario) as total_participantes,
        COUNT(CASE WHEN rp.confirmado = 1 THEN 1 END) as confirmados
       FROM reuniones r
       LEFT JOIN reunion_participantes rp ON r.id_reunion = rp.id_reunion
       WHERE r.id_proyecto = ? AND r.estado != 'cancelada'
       GROUP BY r.id_reunion
       ORDER BY r.fecha_reunion DESC
       LIMIT 3`,
      [id_proyecto]
    );

    res.json({
      proyecto: proyecto[0],
      miembros: miembros,
      actividades_recientes: actividadesRecientes,
      reuniones: reuniones
    });

  } catch (error) {
    console.error('Error al obtener detalles del proyecto:', error);
    res.status(500).json({ error: "Error al obtener detalles del proyecto" });
  }
};

// Obtener actividades del proyecto para coordinadores (similar a estudiantes pero con más permisos)
export const getProyectoActividadesCoordinador = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_coordinador = req.user.id;

    // Verificar acceso
    const [acceso] = await pool.query(
      `SELECT p.id_proyecto
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE p.id_proyecto = ? AND port.id_coordinador = ? AND p.activo = 1`,
      [id_proyecto, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    // Obtener actividades con información completa
    const [actividades] = await pool.query(
      `SELECT 
        ap.id_actividad,
        ap.titulo,
        ap.descripcion,
        ap.estado,
        ap.prioridad,
        ap.fecha_inicio,
        ap.fecha_limite,
        ap.orden_kanban,
        ap.fecha_creacion,
        ap.fecha_actualizacion,
        u_creador.nombre as creador_nombre,
        u_creador.apellido as creador_apellido,
        GROUP_CONCAT(CONCAT(u_asignado.nombre, ' ', u_asignado.apellido) SEPARATOR ', ') as asignados,
        GROUP_CONCAT(u_asignado.id_usuario SEPARATOR ',') as ids_asignados,
        (SELECT COUNT(*) FROM evidencias_actividad ea WHERE ea.id_actividad = ap.id_actividad AND ea.activo = 1) as total_evidencias,
        (SELECT COUNT(*) FROM evidencias_actividad ea WHERE ea.id_actividad = ap.id_actividad AND ea.estado_revision = 'aprobado' AND ea.activo = 1) as evidencias_aprobadas,
        (SELECT COUNT(*) FROM comentarios_actividad ca WHERE ca.id_actividad = ap.id_actividad AND ca.activo = 1) as total_comentarios
       FROM actividades_proyecto ap
       LEFT JOIN usuarios u_creador ON ap.id_creador = u_creador.id_usuario
       LEFT JOIN actividad_asignaciones aa ON ap.id_actividad = aa.id_actividad AND aa.activo = 1
       LEFT JOIN usuarios u_asignado ON aa.id_usuario = u_asignado.id_usuario
       WHERE ap.id_proyecto = ? AND ap.activo = 1
       GROUP BY ap.id_actividad
       ORDER BY ap.orden_kanban ASC, ap.fecha_creacion ASC`,
      [id_proyecto]
    );

    // Procesar los datos para el frontend
    const actividadesProcesadas = actividades.map(actividad => ({
      ...actividad,
      asignados: actividad.asignados ? actividad.asignados.split(', ') : [],
      ids_asignados: actividad.ids_asignados ? actividad.ids_asignados.split(',').map(id => parseInt(id)) : [],
      puede_editar: true, // Coordinadores pueden editar todo
      puede_subir_evidencia: false, // Coordinadores no suben evidencias directamente
      puede_comentar: true,
      puede_cambiar_estado: true
    }));

    res.json({
      actividades: actividadesProcesadas,
      user_role: 'coordinador'
    });

  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: "Error al obtener actividades del proyecto" });
  }
};
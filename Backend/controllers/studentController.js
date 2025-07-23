import pool from "../config/db.js";

export const getStudentProjects = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    const [proyectos] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as titulo,
        p.descripcion,
        p.fecha_creacion,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        pe.rol as rol_usuario,
        (SELECT COUNT(*) FROM actividades_proyecto ap WHERE ap.id_proyecto = p.id_proyecto AND ap.activo = 1) as total_actividades,
        (SELECT COUNT(*) FROM actividades_proyecto ap WHERE ap.id_proyecto = p.id_proyecto AND ap.estado = 'completado' AND ap.activo = 1) as actividades_completadas
       FROM proyecto_estudiantes pe
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE pe.id_estudiante = ? AND p.activo = 1
       ORDER BY p.fecha_creacion DESC`,
      [id_usuario]
    );

    res.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos del estudiante:', error);
    res.status(500).json({ error: "Error al obtener proyectos del estudiante" });
  }
};

export const getEnhancedStudentStats = async (req, res) => {
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
       FROM proyecto_estudiantes pe
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_estudiante = ? AND p.activo = 1 
       AND p.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [id_usuario]
    );

    const [totalProyectos] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM proyecto_estudiantes pe
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_estudiante = ? AND p.activo = 1`,
      [id_usuario]
    );

    const [proyectosEnProceso] = await pool.query(
      `SELECT COUNT(*) as en_proceso 
       FROM proyecto_estudiantes pe
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_estudiante = ? AND p.activo = 1 
       AND p.estado IN ('borrador', 'revision', 'observaciones', 'pre-aprobado')`,
      [id_usuario]
    );

    const [proyectosCompletados] = await pool.query(
      `SELECT COUNT(*) as completados 
       FROM proyecto_estudiantes pe
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_estudiante = ? AND p.activo = 1 
       AND p.estado = 'aprobado final'`,
      [id_usuario]
    );

    const [alertasActivas] = await pool.query(
      `SELECT COUNT(*) as alertas 
       FROM alertas_estudiante 
       WHERE id_usuario = ? AND activa = 1`,
      [id_usuario]
    );

    res.json({
      totalPortafolios: totalPortafolios[0].total,
      portafoliosActivos: portafoliosActivos[0].activos,
      proximasEntregas: proximasEntregas[0].proximas,
      totalProyectos: totalProyectos[0].total,
      proyectosEnProceso: proyectosEnProceso[0].en_proceso,
      proyectosCompletados: proyectosCompletados[0].completados,
      alertasActivas: alertasActivas[0].alertas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del estudiante:', error);
    res.status(500).json({ error: "Error al obtener estadísticas del estudiante" });
  }
};

export const getStudentPortfoliosWithHierarchy = async (req, res) => {
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
        u.email as coordinador_email,
        COUNT(DISTINCT prog.id_programa) as total_programas
       FROM portafolio_alumnos pa
       INNER JOIN portafolios p ON pa.id_portafolio = p.id_portafolio
       INNER JOIN usuarios u ON p.id_coordinador = u.id_usuario
       LEFT JOIN programas prog ON p.id_portafolio = prog.id_portafolio AND prog.activo = 1
       WHERE pa.id_usuario = ? AND p.activo = 1
       GROUP BY p.id_portafolio
       ORDER BY p.fecha_creacion DESC`,
      [id_usuario]
    );

    for (let portafolio of portafolios) {
      const [programas] = await pool.query(
        `SELECT 
          prog.id_programa,
          prog.nombre,
          prog.descripcion,
          prog.objetivos,
          COUNT(DISTINCT proy.id_proyecto) as total_proyectos
         FROM programas prog
         LEFT JOIN proyectos proy ON prog.id_programa = proy.id_programa AND proy.activo = 1
         WHERE prog.id_portafolio = ? AND prog.activo = 1
         GROUP BY prog.id_programa
         ORDER BY prog.fecha_creacion DESC`,
        [portafolio.id_portafolio]
      );

      for (let programa of programas) {
        const [proyectos] = await pool.query(
          `SELECT 
            p.id_proyecto,
            p.nombre as titulo,
            p.descripcion,
            p.fecha_inicio,
            p.fecha_fin,
            p.estado,
            p.progreso,
            pe.rol
           FROM proyectos p
           INNER JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
           WHERE p.id_programa = ? AND pe.id_estudiante = ? AND p.activo = 1
           ORDER BY p.fecha_creacion DESC`,
          [programa.id_programa, id_usuario]
        );

        programa.proyectos = proyectos;
      }

      portafolio.programas = programas;
    }

    res.json(portafolios);
  } catch (error) {
    console.error('Error al obtener portafolios con jerarquía:', error);
    res.status(500).json({ error: "Error al obtener portafolios con jerarquía" });
  }
};

export const getStudentAlerts = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    const [alertas] = await pool.query(
      `SELECT 
        a.id_alerta,
        a.titulo,
        a.mensaje,
        a.tipo,
        a.fecha_creacion,
        a.activa,
        p.nombre as proyecto_titulo,
        p.id_proyecto
       FROM alertas_estudiante a
       LEFT JOIN proyectos p ON a.id_proyecto = p.id_proyecto
       WHERE a.id_usuario = ?
       ORDER BY a.fecha_creacion DESC
       LIMIT 50`,
      [id_usuario]
    );

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas del estudiante:', error);
    res.status(500).json({ error: "Error al obtener alertas del estudiante" });
  }
};

export const markAlertAsRead = async (req, res) => {
  try {
    const { id_alerta } = req.params;
    const id_usuario = req.user.id;

    const [result] = await pool.query(
      `UPDATE alertas_estudiante 
       SET activa = 0, fecha_lectura = NOW() 
       WHERE id_alerta = ? AND id_usuario = ?`,
      [id_alerta, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    res.json({ message: "Alerta marcada como leída" });
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    res.status(500).json({ error: "Error al marcar alerta como leída" });
  }
};

export const getProjectDetails = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_usuario = req.user.id;

    const [access] = await pool.query(
      `SELECT pe.id_estudiante 
       FROM proyecto_estudiantes pe 
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_proyecto = ? AND pe.id_estudiante = ? AND p.activo = 1`,
      [id_proyecto, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    const [proyecto] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as titulo,
        p.descripcion,
        p.fecha_inicio,
        p.fecha_fin,
        p.estado,
        p.progreso,
        p.fecha_creacion,
        p.fecha_actualizacion,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       INNER JOIN usuarios u ON port.id_coordinador = u.id_usuario
       WHERE p.id_proyecto = ? AND p.activo = 1`,
      [id_proyecto]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const [historial] = await pool.query(
      `SELECT 
        h.estado_anterior,
        h.estado_nuevo,
        h.fecha_cambio,
        h.comentario,
        u.nombre,
        u.apellido
       FROM historial_estados h
       LEFT JOIN usuarios u ON h.id_usuario = u.id_usuario
       WHERE h.id_proyecto = ?
       ORDER BY h.fecha_cambio DESC`,
      [id_proyecto]
    );

    const [companeros] = await pool.query(
      `SELECT u.nombre, u.apellido, u.email, pe.rol
       FROM proyecto_estudiantes pe
       INNER JOIN usuarios u ON pe.id_estudiante = u.id_usuario
       WHERE pe.id_proyecto = ? AND pe.id_estudiante != ?`,
      [id_proyecto, id_usuario]
    );

    res.json({
      proyecto: proyecto[0],
      historial: historial,
      companeros: companeros
    });
  } catch (error) {
    console.error('Error al obtener detalles del proyecto:', error);
    res.status(500).json({ error: "Error al obtener detalles del proyecto" });
  }
};

export const updateProjectProgress = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const { progreso, comentario } = req.body;
    const id_usuario = req.user.id;

    const [access] = await pool.query(
      `SELECT pe.id_estudiante 
       FROM proyecto_estudiantes pe 
       INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
       WHERE pe.id_proyecto = ? AND pe.id_estudiante = ? AND p.activo = 1`,
      [id_proyecto, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    if (progreso < 0 || progreso > 100) {
      return res.status(400).json({ error: "El progreso debe estar entre 0 y 100" });
    }

    const [result] = await pool.query(
      `UPDATE proyectos 
       SET progreso = ?, fecha_actualizacion = NOW() 
       WHERE id_proyecto = ?`,
      [progreso, id_proyecto]
    );

    if (comentario) {
      await pool.query(
        `INSERT INTO historial_actividad (id_proyecto, id_usuario, accion, comentario, fecha_accion)
         VALUES (?, ?, 'actualizar_progreso', ?, NOW())`,
        [id_proyecto, id_usuario, comentario]
      );
    }

    res.json({ message: "Progreso actualizado correctamente" });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ error: "Error al actualizar progreso" });
  }
};

export const getEstudiantesByCarrera = async (req, res) => {
  try {
    const carrera = req.params.carrera;
    const [estudiantes] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.email
       FROM usuarios u
       WHERE u.carrera = ? AND u.rol = 'estudiante'`,
      [carrera]
    );
    res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes por carrera:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes por carrera' });
  }
};
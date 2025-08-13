import pool from "../config/db.js";

export const createPortfolio = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nombre, descripcion, carrera, activo, asesores } = req.body;
    const id_coordinador = req.user.id;
    const fecha_creacion = new Date();

    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO portafolios (nombre, descripcion, carrera, id_coordinador, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, carrera, id_coordinador, activo, fecha_creacion]
    );

    const id_portafolio = result.insertId;

    // Insertar asesores seleccionados en portafolio_profesores
    if (Array.isArray(asesores) && asesores.length > 0) {
      const values = asesores.map((id_asesor) => [id_portafolio, id_asesor]);
      await connection.query(
        "INSERT INTO portafolio_profesores (id_portafolio, id_asesores) VALUES ?",
        [values]
      );
    }

    await connection.commit();

    res.status(201).json({ message: "Portafolio creado correctamente" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Error al crear portafolio" });
  } finally {
    connection.release();
  }
};

export const getProfesores = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE rol = ?", [
      "Coordinador",
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const getPortafoliosByCoordinador = async (req, res) => {
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
      estudiantes: estudiantesActuales,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener estudiantes del portafolio" });
  }
};

export const editarPortafolio = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id_portafolio = req.params.id;
    const id_coordinador = req.user.id;

    const { nombre, descripcion } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE portafolios 
       SET nombre = ?, descripcion = ?
       WHERE id_portafolio = ? AND id_coordinador = ? AND activo = 1`,
      [nombre, descripcion, id_portafolio, id_coordinador]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Portafolio no encontrado o no autorizado" });
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
      proximasEntregas: proximasEntregas[0].proximas,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del estudiante:", error);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas del estudiante" });
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
    console.error("Error al obtener portafolios del estudiante:", error);
    res
      .status(500)
      .json({ error: "Error al obtener portafolios del estudiante" });
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
      return res
        .status(403)
        .json({ error: "No tienes acceso a este portafolio" });
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
      compañeros: compañeros,
    });
  } catch (error) {
    console.error("Error al obtener detalles del portafolio:", error);
    res.status(500).json({ error: "Error al obtener detalles del portafolio" });
  }
};

// Funciones del controlador de proyectos del estudiante
export const getProgramasPortafolio = async (req, res) => {
  const { id_portafolio } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id_programa, nombre, descripcion FROM programas WHERE id_portafolio = ?",
      [id_portafolio]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener programas" });
  }
};

export const getAsesoresPortafolio = async (req, res) => {
  const { id_portafolio } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT pp.id_asesores AS id_usuario, u.nombre, u.apellido, u.email, u.carrera
       FROM portafolio_profesores pp
       INNER JOIN usuarios u ON pp.id_asesores = u.id_usuario
       WHERE pp.id_portafolio = ?`,
      [id_portafolio]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asesores" });
  }
};

export const createPrograma = async (req, res) => {
  const { id_portafolio } = req.params;
  const { nombre, descripcion, categoria, asesores } = req.body;

  try {
    // Crear el programa
    const [result] = await pool.query(
      "INSERT INTO programas (id_portafolio, nombre, descripcion, categoria) VALUES (?, ?, ?, ?)",
      [id_portafolio, nombre, descripcion, categoria]
    );

    const id_programa = result.insertId;

    // Insertar asesores en la tabla programa_asesores
    if (Array.isArray(asesores) && asesores.length > 0) {
      const values = asesores.map((id_asesor) => [id_programa, id_asesor]);
      await pool.query(
        "INSERT INTO programa_asesores (id_programa, id_asesor) VALUES ?",
        [values]
      );
    }

    res.status(201).json({ message: "Programa creado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al crear programa" });
  }
};

//Funciones del controlador de proyectos del estudiante
export const getProyectosPrograma = async (req, res) => {
  const { id_programa } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id_proyecto, nombre, descripcion, fecha_creacion, id_lider FROM proyectos WHERE id_programa = ?",
      [id_programa]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
};

export const getEstudiantesPrograma = async (req, res) => {
  const { id_programa } = req.params;
  try {
    // Obtener la carrera del portafolio al que pertenece el programa
    const [portafolio] = await pool.query(
      `SELECT p.carrera
       FROM programas pr
       INNER JOIN portafolios p ON pr.id_portafolio = p.id_portafolio
       WHERE pr.id_programa = ?`,
      [id_programa]
    );
    if (portafolio.length === 0) {
      return res
        .status(404)
        .json({ error: "Programa o portafolio no encontrado" });
    }
    const carrera = portafolio[0].carrera;
    // Traer estudiantes de esa carrera
    const [estudiantes] = await pool.query(
      "SELECT id_usuario, nombre, apellido FROM usuarios WHERE rol = 'Estudiante' AND carrera = ?",
      [carrera]
    );
    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
};

export const createProyecto = async (req, res) => {
  const { id_programa } = req.params;
  const { nombre, descripcion, estudiantes, lider } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insertar el proyecto
    const [result] = await connection.query(
      "INSERT INTO proyectos (id_programa, nombre, descripcion, fecha_creacion, id_lider) VALUES (?, ?, ?, NOW(), ?)",
      [id_programa, nombre, descripcion, lider]
    );
    const id_proyecto = result.insertId;

    // CORRECCIÓN: Insertar estudiantes con los roles correctos
    if (Array.isArray(estudiantes) && estudiantes.length > 0) {
      const values = estudiantes.map((id_estudiante) => {
        // Si el estudiante es el líder, asignar rol 'lider', sino 'miembro'
        const rol = id_estudiante === parseInt(lider) ? "lider" : "miembro";
        return [id_proyecto, id_estudiante, rol];
      });

      // IMPORTANTE: Agregar la columna 'rol' en la query
      await connection.query(
        "INSERT INTO proyecto_estudiantes (id_proyecto, id_estudiante, rol) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Proyecto creado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear proyecto:", error);
    res.status(500).json({ error: "Error al crear proyecto" });
  } finally {
    connection.release();
  }
};
export const getEstudiantesProyecto = async (req, res) => {
  const { id_proyecto } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.apellido
       FROM proyecto_estudiantes pe
       INNER JOIN usuarios u ON pe.id_estudiante = u.id_usuario
       WHERE pe.id_proyecto = ?`,
      [id_proyecto]
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener estudiantes del proyecto" });
  }
};

//Funcion nueva para arreglalo lo de los portafolios de los profes
export const getPortafoliosAsignados = async (req, res) => {
  const id_profesor = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT p.* 
       FROM portafolios p
       INNER JOIN portafolio_profesores pp ON p.id_portafolio = pp.id_portafolio
       WHERE pp.id_asesores = ? AND p.activo = 1`,
      [id_profesor]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener portafolios asignados" });
  }
};

// Funcionn para traer las evidencias de un proyecto
export const getEvidenciasByProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
         id_evidencia,
         id_proyecto,
         id_estudiante,
         titulo,
         descripcion,
         tipo_archivo,
         nombre_archivo,
         ruta_archivo,
         url_externa,
         tamaño_archivo,
         categoria_evidencia,
         estado_validacion,
         es_entrega_final,
         fecha_limite,
         activo,
         fecha_subida,
         fecha_actualizacion
       FROM evidencias_portafolio
       WHERE id_proyecto = ?`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener evidencias del proyecto" });
  }
};

export const getEstudiantesPortafolioANDPROYECTS = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT
        e.id_estudiante,
        u.nombre,
        u.apellido,
        u.email,
        u.carrera
      FROM portafolios p
      JOIN programas pr ON pr.id_portafolio = p.id_portafolio
      JOIN proyectos proy ON proy.id_programa = pr.id_programa
      JOIN proyecto_estudiante e ON e.id_proyecto = proy.id_proyecto
      JOIN usuarios u ON u.id_usuario = e.id_estudiante
      WHERE p.id_portafolio = ?`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estudiantes del portafolio" });
  }
};

// Obtener estadísticas completas de un proyecto incluyendo actividades
export const getProyectoCompletStats = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_coordinador = req.user.id;

    // Verificar acceso
    const [acceso] = await pool.query(
      `SELECT p.id_proyecto FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE p.id_proyecto = ? AND port.id_coordinador = ? AND p.activo = 1`,
      [id_proyecto, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    // Obtener estadísticas completas del proyecto
    const [proyectoStats] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as proyecto_nombre,
        p.descripcion as proyecto_descripcion,
        p.fecha_creacion,
        p.fecha_limite,
        p.prioridad,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        port.carrera,
        u_lider.nombre as lider_nombre,
        u_lider.apellido as lider_apellido,
        
        -- Estadísticas de actividades
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'revision' THEN ap.id_actividad END) as actividades_en_revision,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        
        -- Actividades por prioridad
        COUNT(DISTINCT CASE WHEN ap.prioridad = 'critica' THEN ap.id_actividad END) as actividades_criticas,
        COUNT(DISTINCT CASE WHEN ap.prioridad = 'alta' THEN ap.id_actividad END) as actividades_altas,
        COUNT(DISTINCT CASE WHEN ap.prioridad = 'media' THEN ap.id_actividad END) as actividades_medias,
        COUNT(DISTINCT CASE WHEN ap.prioridad = 'baja' THEN ap.id_actividad END) as actividades_bajas,
        
        -- Actividades vencidas y próximas a vencer
        COUNT(DISTINCT CASE WHEN ap.fecha_limite < CURDATE() AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_vencidas,
        COUNT(DISTINCT CASE WHEN ap.fecha_limite BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_proximas_vencer,
        
        -- Estadísticas de evidencias
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias_actividades,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_aprobadas,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'pendiente' THEN ea.id_evidencia END) as evidencias_pendientes,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'rechazado' THEN ea.id_evidencia END) as evidencias_rechazadas,
        
        -- Estadísticas de evidencias de portafolio
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias_portafolio,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_portafolio_aprobadas,
        
        -- Participantes
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes,
        
        -- Reuniones
        COUNT(DISTINCT r.id_reunion) as total_reuniones,
        COUNT(DISTINCT CASE WHEN r.estado = 'completada' THEN r.id_reunion END) as reuniones_completadas
        
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       INNER JOIN usuarios u_lider ON p.id_lider = u_lider.id_usuario
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       LEFT JOIN reuniones r ON p.id_proyecto = r.id_proyecto
       WHERE p.id_proyecto = ? AND p.activo = 1
       GROUP BY p.id_proyecto`,
      [id_proyecto]
    );

    // Obtener actividades detalladas
    const [actividades] = await pool.query(
      `SELECT 
        ap.id_actividad,
        ap.titulo,
        ap.descripcion,
        ap.estado,
        ap.prioridad,
        ap.fecha_inicio,
        ap.fecha_limite,
        ap.fecha_creacion,
        ap.fecha_actualizacion,
        DATEDIFF(COALESCE(ap.fecha_actualizacion, NOW()), ap.fecha_creacion) as dias_en_actividad,
        GROUP_CONCAT(CONCAT(u.nombre, ' ', u.apellido) SEPARATOR ', ') as asignados,
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_aprobadas
       FROM actividades_proyecto ap
       LEFT JOIN actividad_asignaciones aa ON ap.id_actividad = aa.id_actividad AND aa.activo = 1
       LEFT JOIN usuarios u ON aa.id_usuario = u.id_usuario
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       WHERE ap.id_proyecto = ? AND ap.activo = 1
       GROUP BY ap.id_actividad
       ORDER BY ap.fecha_creacion DESC`,
      [id_proyecto]
    );

    res.json({
      proyecto: proyectoStats[0],
      actividades: actividades
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del proyecto:', error);
    res.status(500).json({ error: "Error al obtener estadísticas del proyecto" });
  }
};

// Obtener estadísticas de un programa incluyendo todos sus proyectos
export const getProgramaCompletStats = async (req, res) => {
  try {
    const { id_programa } = req.params;
    const id_coordinador = req.user.id;

    // Verificar acceso
    const [acceso] = await pool.query(
      `SELECT prog.id_programa FROM programas prog
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE prog.id_programa = ? AND port.id_coordinador = ?`,
      [id_programa, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este programa" });
    }

    // Estadísticas del programa
    const [programaStats] = await pool.query(
      `SELECT 
        prog.id_programa,
        prog.nombre as programa_nombre,
        prog.descripcion as programa_descripcion,
        prog.categoria,
        port.nombre as portafolio_nombre,
        port.carrera,
        
        -- Estadísticas de proyectos
        COUNT(DISTINCT p.id_proyecto) as total_proyectos,
        COUNT(DISTINCT CASE WHEN p.validado = 1 THEN p.id_proyecto END) as proyectos_validados,
        
        -- Estadísticas consolidadas de actividades
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        COUNT(DISTINCT CASE WHEN ap.fecha_limite < CURDATE() AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_vencidas,
        
        -- Estadísticas de evidencias
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias_actividades,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias_portafolio,
        
        -- Estudiantes únicos
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes
        
       FROM programas prog
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN proyectos p ON prog.id_programa = p.id_programa AND p.activo = 1
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       WHERE prog.id_programa = ?
       GROUP BY prog.id_programa`,
      [id_programa]
    );

    // Proyectos con sus estadísticas
    const [proyectos] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as proyecto_nombre,
        p.descripcion,
        p.fecha_creacion,
        p.fecha_limite,
        p.prioridad,
        p.validado,
        
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes,
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias,
        
        CASE 
          WHEN COUNT(DISTINCT ap.id_actividad) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) / COUNT(DISTINCT ap.id_actividad)) * 100, 1)
        END as porcentaje_completado
        
       FROM proyectos p
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       WHERE p.id_programa = ? AND p.activo = 1
       GROUP BY p.id_proyecto
       ORDER BY p.fecha_creacion DESC`,
      [id_programa]
    );

    res.json({
      programa: programaStats[0],
      proyectos: proyectos
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del programa:', error);
    res.status(500).json({ error: "Error al obtener estadísticas del programa" });
  }
};

// Obtener estadísticas completas de un portafolio
export const getPortafolioCompletStats = async (req, res) => {
  try {
    const { id_portafolio } = req.params;
    const id_coordinador = req.user.id;

    // Verificar acceso
    const [acceso] = await pool.query(
      `SELECT id_portafolio FROM portafolios 
       WHERE id_portafolio = ? AND id_coordinador = ? AND activo = 1`,
      [id_portafolio, id_coordinador]
    );

    if (acceso.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este portafolio" });
    }

    // Estadísticas del portafolio
    const [portafolioStats] = await pool.query(
      `SELECT 
        port.id_portafolio,
        port.nombre as portafolio_nombre,
        port.descripcion as portafolio_descripcion,
        port.carrera,
        port.fecha_creacion,
        
        -- Estadísticas de programas y proyectos
        COUNT(DISTINCT prog.id_programa) as total_programas,
        COUNT(DISTINCT p.id_proyecto) as total_proyectos,
        COUNT(DISTINCT CASE WHEN p.validado = 1 THEN p.id_proyecto END) as proyectos_validados,
        
        -- Estadísticas de actividades
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        COUNT(DISTINCT CASE WHEN ap.fecha_limite < CURDATE() AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_vencidas,
        
        -- Estadísticas de evidencias
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias_actividades,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias_portafolio,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_actividades_aprobadas,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_portafolio_aprobadas,
        
        -- Estudiantes únicos
        COUNT(DISTINCT pa.id_usuario) as total_estudiantes_asignados,
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes_activos,
        
        -- Reuniones
        COUNT(DISTINCT r.id_reunion) as total_reuniones
        
       FROM portafolios port
       LEFT JOIN portafolio_alumnos pa ON port.id_portafolio = pa.id_portafolio
       LEFT JOIN programas prog ON port.id_portafolio = prog.id_portafolio
       LEFT JOIN proyectos p ON prog.id_programa = p.id_programa AND p.activo = 1
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       LEFT JOIN reuniones r ON p.id_proyecto = r.id_proyecto
       WHERE port.id_portafolio = ? AND port.activo = 1
       GROUP BY port.id_portafolio`,
      [id_portafolio]
    );

    // Programas con estadísticas
    const [programas] = await pool.query(
      `SELECT 
        prog.id_programa,
        prog.nombre as programa_nombre,
        prog.descripcion,
        prog.categoria,
        
        COUNT(DISTINCT p.id_proyecto) as total_proyectos,
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes,
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        
        CASE 
          WHEN COUNT(DISTINCT ap.id_actividad) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) / COUNT(DISTINCT ap.id_actividad)) * 100, 1)
        END as porcentaje_completado
        
       FROM programas prog
       LEFT JOIN proyectos p ON prog.id_programa = p.id_programa AND p.activo = 1
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       WHERE prog.id_portafolio = ?
       GROUP BY prog.id_programa
       ORDER BY prog.fecha_creacion DESC`,
      [id_portafolio]
    );

    res.json({
      portafolio: portafolioStats[0],
      programas: programas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del portafolio:', error);
    res.status(500).json({ error: "Error al obtener estadísticas del portafolio" });
  }
};

// Obtener estadísticas globales mejoradas
export const getEstadisticasGlobalesReales = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    // Estadísticas globales del coordinador
    const [statsGlobales] = await pool.query(
      `SELECT 
        COUNT(DISTINCT port.id_portafolio) as total_portafolios,
        COUNT(DISTINCT prog.id_programa) as total_programas,
        COUNT(DISTINCT p.id_proyecto) as total_proyectos,
        COUNT(DISTINCT pa.id_usuario) as total_estudiantes_asignados,
        
        -- Actividades globales
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        COUNT(DISTINCT CASE WHEN ap.fecha_limite < CURDATE() AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_vencidas,
        
        -- Evidencias globales
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias_actividades,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias_portafolio,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_actividades_aprobadas,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_portafolio_aprobadas,
        
        -- Porcentajes calculados
        CASE 
          WHEN COUNT(DISTINCT ap.id_actividad) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) / COUNT(DISTINCT ap.id_actividad)) * 100, 1)
        END as porcentaje_actividades_completadas,
        
        CASE 
          WHEN (COUNT(DISTINCT ea.id_evidencia) + COUNT(DISTINCT ep.id_evidencia)) = 0 THEN 0
          ELSE ROUND(((COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) + COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END)) / (COUNT(DISTINCT ea.id_evidencia) + COUNT(DISTINCT ep.id_evidencia))) * 100, 1)
        END as porcentaje_evidencias_aprobadas
        
       FROM portafolios port
       LEFT JOIN portafolio_alumnos pa ON port.id_portafolio = pa.id_portafolio
       LEFT JOIN programas prog ON port.id_portafolio = prog.id_portafolio
       LEFT JOIN proyectos p ON prog.id_programa = p.id_programa AND p.activo = 1
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       WHERE port.id_coordinador = ? AND port.activo = 1`,
      [id_coordinador]
    );

    // Distribución por carrera
    const [distribucionCarreras] = await pool.query(
      `SELECT 
        port.carrera,
        COUNT(DISTINCT port.id_portafolio) as portafolios,
        COUNT(DISTINCT prog.id_programa) as programas,
        COUNT(DISTINCT p.id_proyecto) as proyectos,
        COUNT(DISTINCT pa.id_usuario) as estudiantes
       FROM portafolios port
       LEFT JOIN portafolio_alumnos pa ON port.id_portafolio = pa.id_portafolio
       LEFT JOIN programas prog ON port.id_portafolio = prog.id_portafolio
       LEFT JOIN proyectos p ON prog.id_programa = p.id_programa AND p.activo = 1
       WHERE port.id_coordinador = ? AND port.activo = 1
       GROUP BY port.carrera
       ORDER BY port.carrera`,
      [id_coordinador]
    );

    // Top proyectos por completitud
    const [topProyectos] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as proyecto_nombre,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        CASE 
          WHEN COUNT(DISTINCT ap.id_actividad) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) / COUNT(DISTINCT ap.id_actividad)) * 100, 1)
        END as porcentaje_completado
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       WHERE port.id_coordinador = ? AND p.activo = 1
       GROUP BY p.id_proyecto
       ORDER BY porcentaje_completado DESC, total_actividades DESC
       LIMIT 10`,
      [id_coordinador]
    );

    res.json({
      estadisticas_globales: statsGlobales[0],
      distribucion_carreras: distribucionCarreras,
      top_proyectos: topProyectos
    });

  } catch (error) {
    console.error('Error al obtener estadísticas globales:', error);
    res.status(500).json({ error: "Error al obtener estadísticas globales" });
  }
};

export const getProyectoDetalleCompleto = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_coordinador = req.user.id;
    const rol_usuario = req.user.rol;

    console.log(`🔍 Verificando acceso al proyecto ${id_proyecto} para usuario ${id_coordinador} (${rol_usuario})`);

    // 🔥 CONSULTA CORREGIDA basada en tus datos
    const [acceso] = await pool.query(
      `SELECT DISTINCT 
              p.id_proyecto,
              'acceso_concedido' as acceso,
              CASE 
                WHEN port.id_coordinador = ? THEN 'creador_portafolio'
                WHEN pp.id_asesores = ? THEN 'asesor_asignado'  
                WHEN ? = 'Administrador' THEN 'superadministrador'
                ELSE 'sin_acceso'
              END as tipo_acceso,
              port.nombre as portafolio_nombre,
              port.id_coordinador as coordinador_original,
              pp.id_asesores as asesor_asignado
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN portafolio_profesores pp ON port.id_portafolio = pp.id_portafolio
       WHERE p.id_proyecto = ? 
       AND p.activo = 1
       AND (
         -- Es el coordinador original del portafolio
         port.id_coordinador = ? 
         OR 
         -- Es un asesor asignado al portafolio
         pp.id_asesores = ?
         OR 
         -- Es superadministrador
         ? = 'Administrador'
       )`,
      [
        id_coordinador, id_coordinador, rol_usuario, // Para el CASE
        id_proyecto, // Para el WHERE
        id_coordinador, id_coordinador, rol_usuario // Para las condiciones OR
      ]
    );

    console.log(`📊 Resultado de verificación de acceso:`, {
      tiene_acceso: acceso.length > 0,
      detalles: acceso.length > 0 ? acceso[0] : 'Sin acceso'
    });

    if (acceso.length === 0) {
      console.log(`❌ Acceso denegado al proyecto ${id_proyecto} para usuario ${id_coordinador}`);
      return res.status(403).json({ 
        error: "No tienes acceso a este proyecto",
        debug_info: {
          proyecto_id: id_proyecto,
          usuario_id: id_coordinador,
          rol: rol_usuario
        }
      });
    }

    console.log(`✅ Acceso concedido como: ${acceso[0].tipo_acceso}`);

    // Obtener información completa del proyecto
    const [proyectoInfo] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.nombre as proyecto_nombre,
        p.descripcion as proyecto_descripcion,
        p.fecha_creacion,
        p.fecha_limite,
        p.prioridad,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        port.carrera,
        u_lider.nombre as lider_nombre,
        u_lider.apellido as lider_apellido,
        u_lider.email as lider_email,
        
        -- Estadísticas de actividades
        COUNT(DISTINCT ap.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' THEN ap.id_actividad END) as actividades_completadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'en_progreso' THEN ap.id_actividad END) as actividades_en_progreso,
        COUNT(DISTINCT CASE WHEN ap.estado = 'revision' THEN ap.id_actividad END) as actividades_en_revision,
        COUNT(DISTINCT CASE WHEN ap.estado = 'pendiente' THEN ap.id_actividad END) as actividades_pendientes,
        COUNT(DISTINCT CASE WHEN ap.fecha_limite < CURDATE() AND ap.estado != 'completado' THEN ap.id_actividad END) as actividades_vencidas,
        
        -- Estadísticas de evidencias
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias_actividades,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias_portafolio,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_actividades_aprobadas,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_portafolio_aprobadas,
        
        -- Total de evidencias
        (COUNT(DISTINCT ea.id_evidencia) + COUNT(DISTINCT ep.id_evidencia)) as total_evidencias,
        (COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) + 
         COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END)) as evidencias_aprobadas,
        
        -- Participantes
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes
        
       FROM proyectos p
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       INNER JOIN usuarios u_lider ON p.id_lider = u_lider.id_usuario
       LEFT JOIN proyecto_estudiantes pe ON p.id_proyecto = pe.id_proyecto
       LEFT JOIN actividades_proyecto ap ON p.id_proyecto = ap.id_proyecto AND ap.activo = 1
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       LEFT JOIN evidencias_portafolio ep ON p.id_proyecto = ep.id_proyecto AND ep.activo = 1
       WHERE p.id_proyecto = ? AND p.activo = 1
       GROUP BY p.id_proyecto`,
      [id_proyecto]
    );

    if (proyectoInfo.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Obtener actividades recientes del proyecto
    const [actividades] = await pool.query(
      `SELECT 
        ap.id_actividad,
        ap.titulo,
        ap.descripcion,
        ap.estado,
        ap.prioridad,
        ap.fecha_inicio,
        ap.fecha_limite,
        ap.fecha_creacion,
        ap.fecha_actualizacion,
        GROUP_CONCAT(CONCAT(u.nombre, ' ', u.apellido) SEPARATOR ', ') as asignados,
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as evidencias_aprobadas
       FROM actividades_proyecto ap
       LEFT JOIN actividad_asignaciones aa ON ap.id_actividad = aa.id_actividad AND aa.activo = 1
       LEFT JOIN usuarios u ON aa.id_usuario = u.id_usuario
       LEFT JOIN evidencias_actividad ea ON ap.id_actividad = ea.id_actividad AND ea.activo = 1
       WHERE ap.id_proyecto = ? AND ap.activo = 1
       GROUP BY ap.id_actividad
       ORDER BY ap.fecha_creacion DESC
       LIMIT 10`,
      [id_proyecto]
    );

    // Obtener miembros del equipo
    const [miembros] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        pe.rol,
        COUNT(DISTINCT aa.id_actividad) as actividades_asignadas,
        COUNT(DISTINCT CASE WHEN ap.estado = 'completado' AND aa.id_actividad IS NOT NULL THEN ap.id_actividad END) as actividades_completadas
       FROM proyecto_estudiantes pe
       INNER JOIN usuarios u ON pe.id_estudiante = u.id_usuario
       LEFT JOIN actividad_asignaciones aa ON u.id_usuario = aa.id_usuario AND aa.activo = 1
       LEFT JOIN actividades_proyecto ap ON aa.id_actividad = ap.id_actividad AND ap.id_proyecto = pe.id_proyecto
       WHERE pe.id_proyecto = ?
       GROUP BY u.id_usuario
       ORDER BY pe.rol DESC, u.nombre`,
      [id_proyecto]
    );

    // Obtener reuniones recientes del proyecto
    const [reuniones] = await pool.query(
      `SELECT 
        r.id_reunion,
        r.titulo,
        r.fecha_reunion,
        r.estado,
        COUNT(DISTINCT rp.id_usuario) as total_participantes,
        COUNT(DISTINCT CASE WHEN rp.confirmado = 1 THEN rp.id_usuario END) as confirmados
       FROM reuniones r
       LEFT JOIN reunion_participantes rp ON r.id_reunion = rp.id_reunion
       WHERE r.id_proyecto = ?
       GROUP BY r.id_reunion
       ORDER BY r.fecha_reunion DESC
       LIMIT 5`,
      [id_proyecto]
    );

    const response = {
      proyecto: proyectoInfo[0],
      actividades: actividades,
      miembros: miembros,
      reuniones: reuniones
    };

    console.log(`✅ Datos del proyecto ${id_proyecto} enviados correctamente`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error al obtener detalles del proyecto:', error);
    res.status(500).json({ error: "Error al obtener detalles del proyecto" });
  }
};
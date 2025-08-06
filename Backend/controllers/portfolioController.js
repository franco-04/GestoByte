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
      const values = asesores.map(id_asesor => [id_portafolio, id_asesor]);
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
  const { nombre, descripcion, asesores } = req.body;

  try {
    // Crear el programa
    const [result] = await pool.query(
      "INSERT INTO programas (id_portafolio, nombre, descripcion) VALUES (?, ?, ?)",
      [id_portafolio, nombre, descripcion]
    );

    const id_programa = result.insertId;

    // Insertar asesores en la tabla programa_asesores
    if (Array.isArray(asesores) && asesores.length > 0) {
      const values = asesores.map(id_asesor => [id_programa, id_asesor]);
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
      return res.status(404).json({ error: "Programa o portafolio no encontrado" });
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
      const values = estudiantes.map(id_estudiante => {
        // Si el estudiante es el líder, asignar rol 'lider', sino 'miembro'
        const rol = (id_estudiante === parseInt(lider)) ? 'lider' : 'miembro';
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
    console.error('Error al crear proyecto:', error);
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
    res.status(500).json({ error: "Error al obtener estudiantes del proyecto" });
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
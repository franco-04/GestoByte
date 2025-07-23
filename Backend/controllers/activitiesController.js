// Backend/controllers/activitiesController.js
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer para evidencias de actividades
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/evidencias-actividades');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `evidencia-actividad-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'video/mp4', 'audio/mp3', 'audio/mpeg',
    'application/zip', 'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB límite
});

// Obtener proyectos asignados al estudiante
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

// Obtener actividades del proyecto (Kanban)
export const getProjectActivities = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso al proyecto usando proyecto_estudiantes
    const [access] = await pool.query(
      `SELECT pe.rol FROM proyecto_estudiantes pe 
       WHERE pe.id_proyecto = ? AND pe.id_estudiante = ?`,
      [id_proyecto, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    const userRole = access[0].rol;

    // Obtener actividades con información de asignaciones
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
      puede_editar: userRole === 'lider' || actividad.ids_asignados?.includes(id_usuario.toString()),
      puede_subir_evidencia: actividad.ids_asignados?.includes(id_usuario.toString())
    }));

    res.json({
      actividades: actividadesProcesadas,
      user_role: userRole
    });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: "Error al obtener actividades" });
  }
};

// Crear nueva actividad (solo líderes)
export const createActivity = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const { titulo, descripcion, prioridad, fecha_inicio, fecha_limite, asignados } = req.body;
    const id_usuario = req.user.id;

    // Verificar que el usuario es líder del proyecto
    const [access] = await pool.query(
      `SELECT rol FROM proyecto_estudiantes 
       WHERE id_proyecto = ? AND id_estudiante = ? AND rol = 'lider'`,
      [id_proyecto, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "Solo los líderes pueden crear actividades" });
    }

    // Obtener el siguiente orden kanban
    const [maxOrder] = await pool.query(
      `SELECT COALESCE(MAX(orden_kanban), 0) + 1 as next_order 
       FROM actividades_proyecto WHERE id_proyecto = ?`,
      [id_proyecto]
    );

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Crear la actividad
      const [result] = await connection.query(
        `INSERT INTO actividades_proyecto 
         (id_proyecto, titulo, descripcion, prioridad, fecha_inicio, fecha_limite, id_creador, orden_kanban)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_proyecto, titulo, descripcion, prioridad, fecha_inicio || null, fecha_limite || null, id_usuario, maxOrder[0].next_order]
      );

      const id_actividad = result.insertId;

      // Asignar usuarios a la actividad
      if (Array.isArray(asignados) && asignados.length > 0) {
        const asignacionesValues = asignados.map(id_asignado => [id_actividad, id_asignado]);
        await connection.query(
          `INSERT INTO actividad_asignaciones (id_actividad, id_usuario) VALUES ?`,
          [asignacionesValues]
        );
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Actividad creada correctamente",
        id_actividad: id_actividad
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: "Error al crear actividad" });
  }
};

// Actualizar estado de actividad
export const updateActivityStatus = async (req, res) => {
  try {
    const { id_actividad } = req.params;
    const { estado, comentario } = req.body;
    const id_usuario = req.user.id;

    // Verificar acceso a la actividad
    const [access] = await pool.query(
      `SELECT ap.id_proyecto, pe.rol, 
              CASE WHEN aa.id_usuario IS NOT NULL THEN 1 ELSE 0 END as is_assigned
       FROM actividades_proyecto ap
       INNER JOIN proyecto_estudiantes pe ON ap.id_proyecto = pe.id_proyecto
       LEFT JOIN actividad_asignaciones aa ON ap.id_actividad = aa.id_actividad AND aa.id_usuario = ? AND aa.activo = 1
       WHERE ap.id_actividad = ? AND pe.id_estudiante = ? AND ap.activo = 1`,
      [id_usuario, id_actividad, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta actividad" });
    }

    const { rol, is_assigned } = access[0];

    // Solo líderes o usuarios asignados pueden actualizar el estado
    if (rol !== 'lider' && !is_assigned) {
      return res.status(403).json({ error: "No tienes permisos para actualizar esta actividad" });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Actualizar el estado de la actividad
      await connection.query(
        `UPDATE actividades_proyecto SET estado = ?, fecha_actualizacion = NOW() WHERE id_actividad = ?`,
        [estado, id_actividad]
      );

      // Agregar comentario si se proporciona
      if (comentario) {
        await connection.query(
          `INSERT INTO comentarios_actividad (id_actividad, id_usuario, comentario, tipo_comentario)
           VALUES (?, ?, ?, ?)`,
          [id_actividad, id_usuario, comentario, 'progreso']
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Estado de actividad actualizado correctamente"
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: "Error al actualizar estado de actividad" });
  }
};

// Subir evidencia a actividad
export const uploadActivityEvidence = async (req, res) => {
  try {
    const { id_actividad } = req.params;
    const { titulo, descripcion, url_externa } = req.body;
    const id_usuario = req.user.id;

    // Verificar que el usuario está asignado a la actividad
    const [access] = await pool.query(
      `SELECT aa.id_asignacion FROM actividad_asignaciones aa
       INNER JOIN actividades_proyecto ap ON aa.id_actividad = ap.id_actividad
       WHERE aa.id_actividad = ? AND aa.id_usuario = ? AND aa.activo = 1 AND ap.activo = 1`,
      [id_actividad, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No estás asignado a esta actividad" });
    }

    let evidenceData = {
      id_actividad: parseInt(id_actividad),
      id_usuario,
      titulo,
      descripcion: descripcion || null
    };

    if (req.file) {
      // Archivo subido
      const getFileType = (mimetype, filename) => {
        const mimeToType = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'video/mp4': 'mp4',
          'audio/mp3': 'mp3'
        };
        return mimeToType[mimetype] || path.extname(filename).slice(1).toLowerCase();
      };

      evidenceData = {
        ...evidenceData,
        tipo_archivo: getFileType(req.file.mimetype, req.file.originalname),
        nombre_archivo: req.file.originalname,
        ruta_archivo: req.file.path,
        tamaño_archivo: req.file.size
      };
    } else if (url_externa) {
      // URL externa
      try {
        new URL(url_externa);
        evidenceData = {
          ...evidenceData,
          tipo_archivo: 'link',
          url_externa
        };
      } catch {
        return res.status(400).json({ error: "URL inválida" });
      }
    } else {
      return res.status(400).json({ error: "Debe proporcionar un archivo o una URL" });
    }

    // Insertar evidencia
    const [result] = await pool.query(
      `INSERT INTO evidencias_actividad 
       (id_actividad, id_usuario, titulo, descripcion, tipo_archivo, nombre_archivo, 
        ruta_archivo, url_externa, tamaño_archivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evidenceData.id_actividad,
        evidenceData.id_usuario,
        evidenceData.titulo,
        evidenceData.descripcion,
        evidenceData.tipo_archivo,
        evidenceData.nombre_archivo || null,
        evidenceData.ruta_archivo || null,
        evidenceData.url_externa || null,
        evidenceData.tamaño_archivo || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Evidencia subida correctamente",
      id_evidencia: result.insertId
    });

  } catch (error) {
    console.error('Error al subir evidencia:', error);
    res.status(500).json({ error: "Error al subir evidencia" });
  }
};

// Obtener evidencias de una actividad
export const getActivityEvidences = async (req, res) => {
  try {
    const { id_actividad } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso a la actividad
    const [access] = await pool.query(
      `SELECT ap.id_proyecto FROM actividades_proyecto ap
       INNER JOIN proyecto_estudiantes pe ON ap.id_proyecto = pe.id_proyecto
       WHERE ap.id_actividad = ? AND pe.id_estudiante = ? AND ap.activo = 1`,
      [id_actividad, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta actividad" });
    }

    const [evidencias] = await pool.query(
      `SELECT 
        ea.id_evidencia,
        ea.titulo,
        ea.descripcion,
        ea.tipo_archivo,
        ea.nombre_archivo,
        ea.url_externa,
        ea.tamaño_archivo,
        ea.estado_revision,
        ea.comentarios_revision,
        ea.fecha_subida,
        ea.fecha_revision,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        r.nombre as revisor_nombre,
        r.apellido as revisor_apellido
       FROM evidencias_actividad ea
       INNER JOIN usuarios u ON ea.id_usuario = u.id_usuario
       LEFT JOIN usuarios r ON ea.id_revisor = r.id_usuario
       WHERE ea.id_actividad = ? AND ea.activo = 1
       ORDER BY ea.fecha_subida DESC`,
      [id_actividad]
    );

    res.json(evidencias);
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    res.status(500).json({ error: "Error al obtener evidencias" });
  }
};

// Obtener miembros del proyecto para asignación
export const getProjectMembers = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_usuario = req.user.id;

    // Verificar que el usuario es líder
    const [access] = await pool.query(
      `SELECT rol FROM proyecto_estudiantes 
       WHERE id_proyecto = ? AND id_estudiante = ? AND rol = 'lider'`,
      [id_proyecto, id_usuario]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "Solo los líderes pueden ver los miembros" });
    }

    // Obtener miembros del proyecto
    const [miembros] = await pool.query(
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

    res.json(miembros);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ error: "Error al obtener miembros del proyecto" });
  }
};

// Descargar evidencia
export const downloadEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso
    const [evidencia] = await pool.query(
      `SELECT ea.ruta_archivo, ea.nombre_archivo
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyecto_estudiantes pe ON ap.id_proyecto = pe.id_proyecto
       WHERE ea.id_evidencia = ? AND pe.id_estudiante = ? AND ea.activo = 1`,
      [id_evidencia, id_usuario]
    );

    if (evidencia.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    const { ruta_archivo, nombre_archivo } = evidencia[0];

    if (!ruta_archivo) {
      return res.status(400).json({ error: "Esta evidencia es un link externo" });
    }

    try {
      await fs.access(ruta_archivo);
      res.download(ruta_archivo, nombre_archivo);
    } catch {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

  } catch (error) {
    console.error('Error al descargar evidencia:', error);
    res.status(500).json({ error: "Error al descargar evidencia" });
  }
};
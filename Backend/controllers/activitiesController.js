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
// Modificar la función getActivityEvidences en activitiesController.js
export const getActivityEvidences = async (req, res) => {
  try {
    const { id_actividad } = req.params;
    const id_usuario = req.user.id;

    // MODIFICADO: Verificar acceso tanto para estudiantes como coordinadores
    const [accessStudent] = await pool.query(
      `SELECT ap.id_proyecto FROM actividades_proyecto ap
       INNER JOIN proyecto_estudiantes pe ON ap.id_proyecto = pe.id_proyecto
       WHERE ap.id_actividad = ? AND pe.id_estudiante = ? AND ap.activo = 1`,
      [id_actividad, id_usuario]
    );

    // NUEVO: Verificar acceso para coordinadores
    const [accessCoordinator] = await pool.query(
      `SELECT ap.id_proyecto FROM actividades_proyecto ap
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ap.id_actividad = ? AND port.id_coordinador = ? AND ap.activo = 1`,
      [id_actividad, id_usuario]
    );

    // Si no tiene acceso ni como estudiante ni como coordinador
    if (accessStudent.length === 0 && accessCoordinator.length === 0) {
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
          ea.numero_devoluciones, 
  ea.archivo_firmado_ruta, 
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

// Modificar la función downloadEvidence en activitiesController.js
export const downloadEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // MODIFICADO: Verificar acceso para estudiantes
    const [accessStudent] = await pool.query(
      `SELECT ea.ruta_archivo, ea.nombre_archivo
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyecto_estudiantes pe ON ap.id_proyecto = pe.id_proyecto
       WHERE ea.id_evidencia = ? AND pe.id_estudiante = ? AND ea.activo = 1`,
      [id_evidencia, id_usuario]
    );

    // NUEVO: Verificar acceso para coordinadores
    const [accessCoordinator] = await pool.query(
      `SELECT ea.ruta_archivo, ea.nombre_archivo
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND port.id_coordinador = ? AND ea.activo = 1`,
      [id_evidencia, id_usuario]
    );

    // Tomar el resultado que tenga datos
    const evidencia = accessStudent.length > 0 ? accessStudent[0] : 
                     accessCoordinator.length > 0 ? accessCoordinator[0] : null;

    if (!evidencia) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    const { ruta_archivo, nombre_archivo } = evidencia;

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

// NUEVA FUNCIÓN: Permitir que coordinadores revisen evidencias
export const reviewEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const { estado_revision, comentarios_revision, motivo_devolucion, firma_digital } = req.body;
    const id_coordinador = req.user.id;

    // Verificar que el coordinador tenga acceso
    const [access] = await pool.query(
      `SELECT ea.id_evidencia, ea.estado_revision, ea.numero_devoluciones, ea.id_usuario as id_estudiante
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND port.id_coordinador = ? AND ea.activo = 1`,
      [id_evidencia, id_coordinador]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    const evidencia = access[0];
    const estado_anterior = evidencia.estado_revision;
    let numero_devoluciones = evidencia.numero_devoluciones;

    // Iniciar transacción
    await pool.query('START TRANSACTION');

    try {
      // Si es una devolución, incrementar contador
      if (estado_revision === 'devuelto') {
        numero_devoluciones += 1;
        
        // Registrar en historial de devoluciones
        await pool.query(
          `INSERT INTO historial_devoluciones_evidencia 
           (id_evidencia, numero_devolucion, motivo_devolucion, comentarios_adicionales, id_coordinador, estado_anterior)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_evidencia, numero_devoluciones, motivo_devolucion, comentarios_revision, id_coordinador, estado_anterior]
        );

        // Actualizar evidencia con contadores de devolución
        await pool.query(
          `UPDATE evidencias_actividad 
           SET estado_revision = ?, comentarios_revision = ?, id_revisor = ?, fecha_revision = NOW(),
               numero_devoluciones = ?, 
               fecha_ultima_devolucion = NOW(),
               fecha_primera_devolucion = CASE 
                 WHEN fecha_primera_devolucion IS NULL THEN NOW() 
                 ELSE fecha_primera_devolucion 
               END
           WHERE id_evidencia = ?`,
          [estado_revision, comentarios_revision, id_coordinador, numero_devoluciones, id_evidencia]
        );

        // Crear notificación de devolución
        await pool.query(
          `INSERT INTO notificaciones_devoluciones 
           (id_evidencia, id_estudiante, id_coordinador, tipo_notificacion, titulo, mensaje, numero_devolucion)
           VALUES (?, ?, ?, 'devolucion', ?, ?, ?)`,
          [
            id_evidencia, 
            evidencia.id_estudiante, 
            id_coordinador,
            `Evidencia devuelta (Intento #${numero_devoluciones})`,
            `Tu evidencia ha sido devuelta por ${numero_devoluciones}ª vez. Motivo: ${motivo_devolucion}`,
            numero_devoluciones
          ]
        );

      } else if (estado_revision === 'aprobado') {
        // Si se aprueba con firma digital en línea
        if (firma_digital) {
          await pool.query(
            `INSERT INTO firmas_digitales 
             (id_evidencia, tipo_documento, hash_documento, firma_coordinador, coordenadas_firma, id_coordinador, ruta_documento_firmado, metadatos_firma)
             VALUES (?, 'documento_aprobacion', ?, ?, ?, ?, ?, ?)`,
            [
              id_evidencia,
              firma_digital.hash_documento,
              firma_digital.firma_base64,
              JSON.stringify(firma_digital.coordenadas),
              id_coordinador,
              firma_digital.ruta_documento || '',
              JSON.stringify(firma_digital.metadatos || {})
            ]
          );
        }

        // Actualizar evidencia como aprobada
        await pool.query(
          `UPDATE evidencias_actividad 
           SET estado_revision = ?, comentarios_revision = ?, id_revisor = ?, fecha_revision = NOW()
           WHERE id_evidencia = ?`,
          [estado_revision, comentarios_revision, id_coordinador, id_evidencia]
        );

        // Crear notificación de aprobación
        await pool.query(
          `INSERT INTO notificaciones_devoluciones 
           (id_evidencia, id_estudiante, id_coordinador, tipo_notificacion, titulo, mensaje)
           VALUES (?, ?, ?, 'aprobacion', ?, ?)`,
          [
            id_evidencia, 
            evidencia.id_estudiante, 
            id_coordinador,
            'Evidencia Aprobada ✅',
            firma_digital ? 
              'Tu evidencia ha sido aprobada con firma digital del coordinador.' :
              'Tu evidencia ha sido aprobada por el coordinador.'
          ]
        );

      } else if (estado_revision === 'rechazado_final') {
        // Rechazo definitivo
        await pool.query(
          `UPDATE evidencias_actividad 
           SET estado_revision = ?, comentarios_revision = ?, id_revisor = ?, fecha_revision = NOW()
           WHERE id_evidencia = ?`,
          [estado_revision, comentarios_revision, id_coordinador, id_evidencia]
        );

        // Crear notificación de rechazo final
        await pool.query(
          `INSERT INTO notificaciones_devoluciones 
           (id_evidencia, id_estudiante, id_coordinador, tipo_notificacion, titulo, mensaje)
           VALUES (?, ?, ?, 'rechazo_final', ?, ?)`,
          [
            id_evidencia, 
            evidencia.id_estudiante, 
            id_coordinador,
            'Evidencia Rechazada Definitivamente ❌',
            'Tu evidencia ha sido rechazada definitivamente. Contacta al coordinador para más información.'
          ]
        );
      }

      await pool.query('COMMIT');

      res.json({ 
        success: true, 
        message: "Evidencia revisada correctamente",
        numero_devoluciones: numero_devoluciones,
        estado_nuevo: estado_revision
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error al revisar evidencia:', error);
    res.status(500).json({ error: "Error al revisar evidencia" });
  }
};

// Agregar esta función al activitiesController.js
export const uploadSignedEvidenceByCoordinator = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_coordinador = req.user.id;
    const archivo = req.file;
    const { comentarios_aprobacion } = req.body;

    // Verificar que el coordinador tenga acceso
    const [access] = await pool.query(
      `SELECT ea.id_evidencia, ea.id_usuario as id_estudiante, ea.titulo
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND port.id_coordinador = ? AND ea.activo = 1`,
      [id_evidencia, id_coordinador]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    const evidencia = access[0];
    const archivoFirmadoRuta = archivo.path;
    
    // Actualizar evidencia con documento firmado y aprobación
    await pool.query(
      `UPDATE evidencias_actividad 
       SET estado_revision = 'aprobado', 
           comentarios_revision = ?, 
           id_revisor = ?, 
           fecha_revision = NOW(),
           archivo_firmado_ruta = ?
       WHERE id_evidencia = ?`,
      [comentarios_aprobacion || 'Evidencia aprobada con documento firmado', id_coordinador, archivoFirmadoRuta, id_evidencia]
    );

    res.json({ 
      success: true, 
      message: "Documento firmado subido y evidencia aprobada correctamente"
    });

  } catch (error) {
    console.error('Error al subir documento firmado:', error);
    res.status(500).json({ error: "Error al subir documento firmado" });
  }
};

// NUEVA FUNCIÓN: Obtener historial de devoluciones
// Agregar estas funciones al activitiesController.js

export const getEvidenceReturns = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso
    const [access] = await pool.query(
      `SELECT ea.id_usuario as id_estudiante, port.id_coordinador
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND ea.activo = 1`,
      [id_evidencia]
    );

    if (access.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    const { id_estudiante, id_coordinador } = access[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    // Obtener información general de la evidencia
    const [evidenciaInfo] = await pool.query(
      `SELECT numero_devoluciones, fecha_primera_devolucion, fecha_ultima_devolucion, estado_revision
       FROM evidencias_actividad
       WHERE id_evidencia = ?`,
      [id_evidencia]
    );

    res.json({
      evidencia: evidenciaInfo[0] || {},
      historial_devoluciones: []
    });

  } catch (error) {
    console.error('Error al obtener historial de devoluciones:', error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};

export const downloadSignedDocument = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso y obtener ruta del archivo firmado
    const [evidencia] = await pool.query(
      `SELECT ea.archivo_firmado_ruta, ea.nombre_archivo, ea.id_usuario as id_estudiante, port.id_coordinador
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND ea.activo = 1`,
      [id_evidencia]
    );

    if (evidencia.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    const { archivo_firmado_ruta, nombre_archivo, id_estudiante, id_coordinador } = evidencia[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    if (!archivo_firmado_ruta) {
      return res.status(404).json({ error: "No hay archivo firmado disponible" });
    }

    // Descargar archivo firmado
    try {
      await fs.access(archivo_firmado_ruta);
      const nombreFirmado = `FIRMADO_${nombre_archivo}`;
      res.download(archivo_firmado_ruta, nombreFirmado);
    } catch {
      return res.status(404).json({ error: "Archivo firmado no encontrado en el servidor" });
    }

  } catch (error) {
    console.error('Error al descargar documento firmado:', error);
    res.status(500).json({ error: "Error al descargar documento firmado" });
  }
};

export const getEvidenceSignature = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // Verificar acceso
    const [access] = await pool.query(
      `SELECT ea.id_usuario as id_estudiante, port.id_coordinador
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_evidencia = ? AND ea.activo = 1`,
      [id_evidencia]
    );

    if (access.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    const { id_estudiante, id_coordinador } = access[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    // Obtener firma digital
    const [firma] = await pool.query(
      `SELECT 
        fd.firma_coordinador,
        fd.fecha_firma,
        fd.metadatos_firma,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido
       FROM firmas_digitales fd
       INNER JOIN usuarios u ON fd.id_coordinador = u.id_usuario
       WHERE fd.id_evidencia = ?
       ORDER BY fd.fecha_firma DESC
       LIMIT 1`,
      [id_evidencia]
    );

    if (firma.length === 0) {
      return res.status(404).json({ error: "No hay firma digital disponible" });
    }

    res.json(firma[0]);

  } catch (error) {
    console.error('Error al obtener firma:', error);
    res.status(500).json({ error: "Error al obtener firma" });
  }
};

export const getStudentEvidenceNotifications = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    const [notificaciones] = await pool.query(
      `SELECT 
        nd.id_notificacion,
        nd.tipo_notificacion,
        nd.titulo,
        nd.mensaje,
        nd.numero_devolucion,
        nd.leida,
        nd.fecha_creacion,
        ea.titulo as evidencia_titulo,
        ea.id_evidencia,
        ap.titulo as actividad_titulo,
        u.nombre as coordinador_nombre,
        u.apellido as coordinador_apellido
       FROM notificaciones_devoluciones nd
       INNER JOIN evidencias_actividad ea ON nd.id_evidencia = ea.id_evidencia
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN usuarios u ON nd.id_coordinador = u.id_usuario
       WHERE nd.id_estudiante = ?
       ORDER BY nd.fecha_creacion DESC
       LIMIT 50`,
      [id_estudiante]
    );

    res.json(notificaciones);

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

// NUEVA FUNCIÓN: Marcar notificación como leída
export const markEvidenceNotificationAsRead = async (req, res) => {
  try {
    const { id_notificacion } = req.params;
    const id_estudiante = req.user.id;

    // Verificar que la notificación pertenece al estudiante
    const [notificacion] = await pool.query(
      `SELECT id_notificacion FROM notificaciones_devoluciones 
       WHERE id_notificacion = ? AND id_estudiante = ?`,
      [id_notificacion, id_estudiante]
    );

    if (notificacion.length === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    // Marcar como leída
    await pool.query(
      `UPDATE notificaciones_devoluciones 
       SET leida = TRUE 
       WHERE id_notificacion = ?`,
      [id_notificacion]
    );

    res.json({ success: true, message: "Notificación marcada como leída" });

  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: "Error al marcar notificación como leída" });
  }
};

// NUEVA FUNCIÓN: Obtener estadísticas de devoluciones para coordinador
export const getReturnsStatistics = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    // Estadísticas generales
    const [statsGenerales] = await pool.query(
      `SELECT 
        COUNT(DISTINCT ea.id_evidencia) as total_evidencias,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'aprobado' THEN ea.id_evidencia END) as aprobadas,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'devuelto' THEN ea.id_evidencia END) as devueltas,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'rechazado_final' THEN ea.id_evidencia END) as rechazadas,
        COUNT(DISTINCT CASE WHEN ea.estado_revision = 'pendiente' THEN ea.id_evidencia END) as pendientes,
        AVG(ea.numero_devoluciones) as promedio_devoluciones,
        MAX(ea.numero_devoluciones) as max_devoluciones
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ? AND ea.activo = 1`,
      [id_coordinador]
    );

    // Top motivos de devolución
    const [motivosTop] = await pool.query(
      `SELECT 
        hd.motivo_devolucion,
        COUNT(*) as cantidad,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM historial_devoluciones_evidencia hd2 
                                   INNER JOIN evidencias_actividad ea2 ON hd2.id_evidencia = ea2.id_evidencia
                                   INNER JOIN actividades_proyecto ap2 ON ea2.id_actividad = ap2.id_actividad
                                   INNER JOIN proyectos p2 ON ap2.id_proyecto = p2.id_proyecto
                                   INNER JOIN programas prog2 ON p2.id_programa = prog2.id_programa
                                   INNER JOIN portafolios port2 ON prog2.id_portafolio = port2.id_portafolio
                                   WHERE port2.id_coordinador = ?)), 1) as porcentaje
       FROM historial_devoluciones_evidencia hd
       INNER JOIN evidencias_actividad ea ON hd.id_evidencia = ea.id_evidencia
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ?
       GROUP BY hd.motivo_devolucion
       ORDER BY cantidad DESC
       LIMIT 10`,
      [id_coordinador, id_coordinador]
    );

    // Estudiantes con más devoluciones
    const [estudiantesProblematicos] = await pool.query(
      `SELECT 
        u.nombre,
        u.apellido,
        u.id_usuario,
        COUNT(DISTINCT ea.id_evidencia) as evidencias_subidas,
        SUM(ea.numero_devoluciones) as total_devoluciones,
        AVG(ea.numero_devoluciones) as promedio_devoluciones
       FROM usuarios u
       INNER JOIN evidencias_actividad ea ON u.id_usuario = ea.id_usuario
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ? AND ea.activo = 1 AND ea.numero_devoluciones > 0
       GROUP BY u.id_usuario, u.nombre, u.apellido
       HAVING total_devoluciones > 2
       ORDER BY promedio_devoluciones DESC, total_devoluciones DESC
       LIMIT 10`,
      [id_coordinador]
    );

    // Tendencia de devoluciones por mes
    const [tendenciaMensual] = await pool.query(
      `SELECT 
        DATE_FORMAT(hd.fecha_devolucion, '%Y-%m') as mes,
        COUNT(*) as devoluciones,
        COUNT(DISTINCT hd.id_evidencia) as evidencias_devueltas,
        COUNT(DISTINCT ea.id_usuario) as estudiantes_afectados
       FROM historial_devoluciones_evidencia hd
       INNER JOIN evidencias_actividad ea ON hd.id_evidencia = ea.id_evidencia
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ? AND hd.fecha_devolucion >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(hd.fecha_devolucion, '%Y-%m')
       ORDER BY mes ASC`,
      [id_coordinador]
    );

    res.json({
      estadisticas_generales: statsGenerales[0],
      motivos_principales: motivosTop,
      estudiantes_con_mas_devoluciones: estudiantesProblematicos,
      tendencia_mensual: tendenciaMensual
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de devoluciones:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

// NUEVA FUNCIÓN: Obtener alertas de evidencias para coordinador
export const getCoordinatorEvidenceAlerts = async (req, res) => {
  try {
    const id_coordinador = req.user.id;

    // Evidencias pendientes de revisión
    const [evidenciasPendientes] = await pool.query(
      `SELECT 
        ea.id_evidencia,
        ea.titulo,
        ea.fecha_subida,
        ea.numero_devoluciones,
        ap.titulo as actividad_titulo,
        u.nombre as estudiante_nombre,
        u.apellido as estudiante_apellido,
        DATEDIFF(NOW(), ea.fecha_subida) as dias_pendiente
       FROM evidencias_actividad ea
       INNER JOIN usuarios u ON ea.id_usuario = u.id_usuario
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ? 
       AND ea.estado_revision IN ('pendiente', 'revision')
       AND ea.activo = 1
       ORDER BY ea.fecha_subida ASC
       LIMIT 20`,
      [id_coordinador]
    );

    // Evidencias con múltiples devoluciones
    const [evidenciasProblematicas] = await pool.query(
      `SELECT 
        ea.id_evidencia,
        ea.titulo,
        ea.numero_devoluciones,
        ea.fecha_ultima_devolucion,
        ap.titulo as actividad_titulo,
        u.nombre as estudiante_nombre,
        u.apellido as estudiante_apellido,
        DATEDIFF(NOW(), ea.fecha_ultima_devolucion) as dias_desde_devolucion
       FROM evidencias_actividad ea
       INNER JOIN usuarios u ON ea.id_usuario = u.id_usuario
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE port.id_coordinador = ? 
       AND ea.numero_devoluciones >= 3
       AND ea.estado_revision != 'aprobado'
       AND ea.activo = 1
       ORDER BY ea.numero_devoluciones DESC, ea.fecha_ultima_devolucion ASC
       LIMIT 15`,
      [id_coordinador]
    );

    res.json({
      evidencias_pendientes: evidenciasPendientes,
      evidencias_problematicas: evidenciasProblematicas
    });

  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: "Error al obtener alertas" });
  }
};
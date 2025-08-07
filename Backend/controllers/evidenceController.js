// Backend/controllers/evidenceController.js
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/evidencias');
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
    cb(null, `evidencia-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mp3',
    'audio/mpeg',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain'
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Función para determinar tipo de archivo
const getFileType = (mimetype, filename) => {
  const mimeToType = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'text/plain': 'txt'
  };

  return mimeToType[mimetype] || path.extname(filename).slice(1).toLowerCase();
};

// Subir evidencia (archivo)
export const uploadEvidence = async (req, res) => {
  try {
    const { id_proyecto, titulo, descripcion, categoria_evidencia, fecha_limite, es_entrega_final } = req.body;
    const id_estudiante = req.user.id;

   
    const [access] = await pool.query(
  `SELECT pe.id_estudiante 
   FROM proyecto_estudiantes pe 
   INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
   WHERE pe.id_proyecto = ? AND pe.id_estudiante = ? AND p.activo = 1`, 
  [id_proyecto, id_estudiante]
);

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo" });
    }

    const tipoArchivo = getFileType(req.file.mimetype, req.file.originalname);
    const rutaArchivo = req.file.path;
    const tamañoArchivo = req.file.size;

    const [result] = await pool.query(
      `INSERT INTO evidencias_portafolio 
       (id_proyecto, id_estudiante, titulo, descripcion, tipo_archivo, nombre_archivo, ruta_archivo, 
        tamaño_archivo, categoria_evidencia, fecha_limite, es_entrega_final)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_proyecto, id_estudiante, titulo, descripcion, tipoArchivo, req.file.originalname, 
       rutaArchivo, tamañoArchivo, categoria_evidencia, fecha_limite || null, es_entrega_final || 0]
    );

  
/* await pool.query(
  `INSERT INTO notificaciones_evidencia (id_evidencia, id_usuario_destino, id_usuario_origen, tipo_notificacion, titulo, mensaje)
   SELECT ?, p.id_asesor, ?, 'nueva_evidencia', 'Nueva evidencia subida', ?
   FROM proyectos p WHERE p.id_proyecto = ? AND p.id_asesor IS NOT NULL`,
  [result.insertId, id_estudiante, `El estudiante ha subido: ${titulo}`, id_proyecto]
); */

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

// Subir evidencia (link externo)
export const uploadEvidenceLink = async (req, res) => {
  try {
    const { id_proyecto, titulo, descripcion, url_externa, categoria_evidencia, fecha_limite, es_entrega_final } = req.body;
    const id_estudiante = req.user.id;

    // Verificar acceso al proyecto
   const [access] = await pool.query(
  `SELECT pe.id_estudiante 
   FROM proyecto_estudiantes pe 
   INNER JOIN proyectos p ON pe.id_proyecto = p.id_proyecto
   WHERE pe.id_proyecto = ? AND pe.id_estudiante = ? AND p.activo = 1`, // CAMBIO: id_estudiante
  [id_proyecto, id_estudiante]
);

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    // Validar URL
    try {
      new URL(url_externa);
    } catch {
      return res.status(400).json({ error: "URL inválida" });
    }

    const [result] = await pool.query(
      `INSERT INTO evidencias_portafolio 
       (id_proyecto, id_estudiante, titulo, descripcion, tipo_archivo, url_externa, 
        categoria_evidencia, fecha_limite, es_entrega_final)
       VALUES (?, ?, ?, ?, 'link', ?, ?, ?, ?)`,
      [id_proyecto, id_estudiante, titulo, descripcion, url_externa, 
       categoria_evidencia, fecha_limite || null, es_entrega_final || 0]
    );

    res.status(201).json({
      success: true,
      message: "Link subido correctamente",
      id_evidencia: result.insertId
    });

  } catch (error) {
    console.error('Error al subir link:', error);
    res.status(500).json({ error: "Error al subir link" });
  }
};

// Obtener evidencias del estudiante por proyecto
export const getStudentEvidences = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const id_estudiante = req.user.id;

    // Verificar acceso
   const [access] = await pool.query(
  `SELECT pe.id_estudiante 
   FROM proyecto_estudiantes pe 
   WHERE pe.id_proyecto = ? AND pe.id_estudiante = ?`, // CAMBIO: id_estudiante
  [id_proyecto, id_estudiante]
);

    if (access.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a este proyecto" });
    }

    const [evidencias] = await pool.query(
      `SELECT 
        ep.id_evidencia,
        ep.titulo,
        ep.descripcion,
        ep.tipo_archivo,
        ep.nombre_archivo,
        ep.url_externa,
        ep.tamaño_archivo,
        ep.categoria_evidencia,
        ep.estado_validacion,
        ep.es_entrega_final,
        ep.fecha_subida,
        ep.fecha_limite,
        ce.nombre_categoria,
        ce.color_hex,
        ce.icono,
        COUNT(cm.id_comentario) as total_comentarios,
        COUNT(CASE WHEN cm.tipo_comentario = 'solicitud_cambio' THEN 1 END) as solicitudes_cambio
       FROM evidencias_portafolio ep
       LEFT JOIN categorias_evidencia ce ON ep.categoria_evidencia = ce.id_categoria
       LEFT JOIN comentarios_evidencia cm ON ep.id_evidencia = cm.id_evidencia
       WHERE ep.id_proyecto = ? AND ep.id_estudiante = ? AND ep.activo = 1
       GROUP BY ep.id_evidencia
       ORDER BY ep.fecha_subida DESC`,
      [id_proyecto, id_estudiante]
    );

    res.json(evidencias);

  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    res.status(500).json({ error: "Error al obtener evidencias" });
  }
};

export const getAllStudentEvidences = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    const [evidencias] = await pool.query(
      `SELECT 
        ep.id_evidencia,
        ep.titulo,
        ep.descripcion,
        ep.tipo_archivo,
        ep.estado_validacion,
        ep.fecha_subida,
        ep.fecha_limite,
        ep.es_entrega_final,
        p.nombre as proyecto_titulo,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        ce.nombre_categoria,
        ce.color_hex,
        COALESCE(cm.total_comentarios, 0) as total_comentarios
       FROM evidencias_portafolio ep
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN categorias_evidencia ce ON ep.categoria_evidencia = ce.id_categoria
       LEFT JOIN (
         SELECT id_evidencia, COUNT(*) as total_comentarios 
         FROM comentarios_evidencia 
         WHERE activo = 1 
         GROUP BY id_evidencia
       ) cm ON ep.id_evidencia = cm.id_evidencia
       WHERE ep.id_estudiante = ? AND ep.activo = 1
       ORDER BY ep.fecha_subida DESC`,
      [id_estudiante]
    );

    res.json(evidencias);

  } catch (error) {
    console.error('Error al obtener todas las evidencias:', error);
    res.status(500).json({ error: "Error al obtener evidencias" });
  }
};

// En evidenceController.js, corregir getEvidenceComments
export const getEvidenceComments = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // CORREGIDO: Verificar acceso sin id_asesor
    const [access] = await pool.query(
      `SELECT ep.id_estudiante, port.id_coordinador
       FROM evidencias_portafolio ep
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ep.id_evidencia = ? AND ep.activo = 1`,
      [id_evidencia]
    );

    if (access.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    // CORREGIDO: Solo verificar estudiante y coordinador
    const { id_estudiante, id_coordinador } = access[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    const [comentarios] = await pool.query(
      `SELECT 
        cm.id_comentario,
        cm.comentario,
        cm.tipo_comentario,
        cm.es_privado,
        cm.fecha_comentario,
        u.nombre,
        u.apellido,
        u.rol
       FROM comentarios_evidencia cm
       INNER JOIN usuarios u ON cm.id_usuario = u.id_usuario
       WHERE cm.id_evidencia = ? 
       AND (cm.es_privado = 0 OR ? = ? OR ? = ?) 
       ORDER BY cm.fecha_comentario ASC`,
      [id_evidencia, id_usuario, id_coordinador, id_usuario, id_coordinador]
    );

    res.json(comentarios);

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
};
// En evidenceController.js, corregir la función downloadEvidence
export const downloadEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // CORREGIDO: Verificar acceso sin usar id_asesor
    const [evidencia] = await pool.query(
      `SELECT ep.ruta_archivo, ep.nombre_archivo, ep.id_estudiante, port.id_coordinador
       FROM evidencias_portafolio ep
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ep.id_evidencia = ? AND ep.activo = 1`,
      [id_evidencia]
    );

    if (evidencia.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    // CORREGIDO: Solo verificar estudiante y coordinador por ahora
    const { ruta_archivo, nombre_archivo, id_estudiante, id_coordinador } = evidencia[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    if (!ruta_archivo) {
      return res.status(400).json({ error: "Esta evidencia es un link externo" });
    }

    // Verificar que el archivo existe
    try {
      await fs.access(ruta_archivo);
    } catch {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    res.download(ruta_archivo, nombre_archivo);

  } catch (error) {
    console.error('Error al descargar evidencia:', error);
    res.status(500).json({ error: "Error al descargar evidencia" });
  }
};
// Eliminar evidencia (solo estudiante propietario)
export const deleteEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_estudiante = req.user.id;

    // Verificar propiedad
    const [evidencia] = await pool.query(
      `SELECT ruta_archivo FROM evidencias_portafolio 
       WHERE id_evidencia = ? AND id_estudiante = ? AND activo = 1`,
      [id_evidencia, id_estudiante]
    );

    if (evidencia.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada o no autorizada" });
    }

    // Marcar como inactiva (eliminación lógica)
    await pool.query(
      `UPDATE evidencias_portafolio SET activo = 0 WHERE id_evidencia = ?`,
      [id_evidencia]
    );

    // Opcional: eliminar archivo físico después de un tiempo
    // if (evidencia[0].ruta_archivo) {
    //   await fs.unlink(evidencia[0].ruta_archivo);
    // }

    res.json({ success: true, message: "Evidencia eliminada correctamente" });

  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    res.status(500).json({ error: "Error al eliminar evidencia" });
  }
};

// Obtener categorías disponibles
export const getEvidenceCategories = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      `SELECT id_categoria, nombre_categoria, descripcion, color_hex, icono
       FROM categorias_evidencia 
       WHERE activa = 1 
       ORDER BY orden_visualizacion`
    );

    res.json(categorias);

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// Actualizar evidencia (solo descripción y categoría)
export const updateEvidence = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const { titulo, descripcion, categoria_evidencia, fecha_limite } = req.body;
    const id_estudiante = req.user.id;

    // Verificar propiedad y que no esté aprobada
    const [evidencia] = await pool.query(
      `SELECT estado_validacion FROM evidencias_portafolio 
       WHERE id_evidencia = ? AND id_estudiante = ? AND activo = 1`,
      [id_evidencia, id_estudiante]
    );

    if (evidencia.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada o no autorizada" });
    }

    if (evidencia[0].estado_validacion === 'aprobado') {
      return res.status(400).json({ error: "No se puede modificar una evidencia aprobada" });
    }

    await pool.query(
      `UPDATE evidencias_portafolio 
       SET titulo = ?, descripcion = ?, categoria_evidencia = ?, fecha_limite = ?
       WHERE id_evidencia = ?`,
      [titulo, descripcion, categoria_evidencia, fecha_limite, id_evidencia]
    );

    res.json({ success: true, message: "Evidencia actualizada correctamente" });

  } catch (error) {
    console.error('Error al actualizar evidencia:', error);
    res.status(500).json({ error: "Error al actualizar evidencia" });
  }
};

// En evidenceController.js, corregir getEvidenceHistory
export const getEvidenceHistory = async (req, res) => {
  try {
    const { id_evidencia } = req.params;
    const id_usuario = req.user.id;

    // CORREGIDO: Verificar acceso sin id_asesor
    const [access] = await pool.query(
      `SELECT ep.id_estudiante, port.id_coordinador
       FROM evidencias_portafolio ep
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ep.id_evidencia = ?`,
      [id_evidencia]
    );

    if (access.length === 0) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    // CORREGIDO: Solo verificar estudiante y coordinador
    const { id_estudiante, id_coordinador } = access[0];
    const hasAccess = id_usuario === id_estudiante || id_usuario === id_coordinador;

    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a esta evidencia" });
    }

    const [historial] = await pool.query(
      `SELECT 
        he.accion,
        he.estado_anterior,
        he.estado_nuevo,
        he.descripcion_cambio,
        he.fecha_cambio,
        u.nombre,
        u.apellido,
        u.rol
       FROM historial_evidencias he
       LEFT JOIN usuarios u ON he.id_usuario = u.id_usuario
       WHERE he.id_evidencia = ?
       ORDER BY he.fecha_cambio DESC`,
      [id_evidencia]
    );

    res.json(historial);

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};
// Obtener estadísticas de evidencias del estudiante
export const getStudentEvidenceStats = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_evidencias,
        COUNT(CASE WHEN estado_validacion = 'aprobado' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN estado_validacion = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado_validacion = 'requiere_cambios' THEN 1 END) as requieren_cambios,
        COUNT(CASE WHEN estado_validacion = 'rechazado' THEN 1 END) as rechazadas,
        COUNT(CASE WHEN es_entrega_final = 1 THEN 1 END) as entregas_finales,
        COUNT(CASE WHEN fecha_limite < CURDATE() AND estado_validacion != 'aprobado' THEN 1 END) as vencidas,
        COUNT(CASE WHEN fecha_limite BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) 
                   AND estado_validacion != 'aprobado' THEN 1 END) as proximas_vencer
       FROM evidencias_portafolio 
       WHERE id_estudiante = ? AND activo = 1`,
      [id_estudiante]
    );

    const [categorias] = await pool.query(
      `SELECT 
        ce.nombre_categoria,
        ce.color_hex,
        COUNT(ep.id_evidencia) as cantidad
       FROM categorias_evidencia ce
       LEFT JOIN evidencias_portafolio ep ON ce.id_categoria = ep.categoria_evidencia 
                                          AND ep.id_estudiante = ? AND ep.activo = 1
       WHERE ce.activa = 1
       GROUP BY ce.id_categoria, ce.nombre_categoria, ce.color_hex
       ORDER BY cantidad DESC`,
      [id_estudiante]
    );

    res.json({
      estadisticas: stats[0],
      por_categoria: categorias
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

// Obtener notificaciones de evidencias
export const getEvidenceNotifications = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    const [notificaciones] = await pool.query(
      `SELECT 
        ne.id_notificacion,
        ne.tipo_notificacion,
        ne.titulo,
        ne.mensaje,
        ne.leida,
        ne.fecha_creacion,
        ep.titulo as evidencia_titulo,
        p.titulo as proyecto_titulo
       FROM notificaciones_evidencia ne
       INNER JOIN evidencias_portafolio ep ON ne.id_evidencia = ep.id_evidencia
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       WHERE ne.id_usuario_destino = ?
       ORDER BY ne.fecha_creacion DESC
       LIMIT 50`,
      [id_usuario]
    );

    res.json(notificaciones);

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id_notificacion } = req.params;
    const id_usuario = req.user.id;

    const [result] = await pool.query(
      `UPDATE notificaciones_evidencia 
       SET leida = 1, fecha_lectura = NOW() 
       WHERE id_notificacion = ? AND id_usuario_destino = ?`,
      [id_notificacion, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ success: true, message: "Notificación marcada como leída" });

  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: "Error al marcar notificación" });
  }






};


export const getAllStudentEvidencesUnified = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    // Obtener evidencias generales
    const [evidenciasGenerales] = await pool.query(
      `SELECT 
        ep.id_evidencia,
        ep.titulo,
        ep.descripcion,
        ep.tipo_archivo,
        ep.nombre_archivo,
        ep.url_externa,
        ep.tamaño_archivo,
        ep.estado_validacion,
        ep.fecha_subida,
        ep.fecha_limite,
        ep.es_entrega_final,
        'general' as tipo_evidencia,
        p.nombre as proyecto_titulo,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        ce.nombre_categoria,
        ce.color_hex,
        NULL as actividad_titulo,
        COALESCE(cm.total_comentarios, 0) as total_comentarios
       FROM evidencias_portafolio ep
       INNER JOIN proyectos p ON ep.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       LEFT JOIN categorias_evidencia ce ON ep.categoria_evidencia = ce.id_categoria
       LEFT JOIN (
         SELECT id_evidencia, COUNT(*) as total_comentarios 
         FROM comentarios_evidencia 
         WHERE activo = 1 
         GROUP BY id_evidencia
       ) cm ON ep.id_evidencia = cm.id_evidencia
       WHERE ep.id_estudiante = ? AND ep.activo = 1`,
      [id_estudiante]
    );

    // Obtener evidencias de actividades
    const [evidenciasActividades] = await pool.query(
      `SELECT 
        ea.id_evidencia,
        ea.titulo,
        ea.descripcion,
        ea.tipo_archivo,
        ea.nombre_archivo,
        ea.url_externa,
        ea.tamaño_archivo,
        ea.estado_revision as estado_validacion,
        ea.fecha_subida,
        NULL as fecha_limite,
        0 as es_entrega_final,
        'actividad' as tipo_evidencia,
        p.nombre as proyecto_titulo,
        prog.nombre as programa_nombre,
        port.nombre as portafolio_nombre,
        'Evidencia de Actividad' as nombre_categoria,
        '#3b82f6' as color_hex,
        ap.titulo as actividad_titulo,
        0 as total_comentarios
       FROM evidencias_actividad ea
       INNER JOIN actividades_proyecto ap ON ea.id_actividad = ap.id_actividad
       INNER JOIN proyectos p ON ap.id_proyecto = p.id_proyecto
       INNER JOIN programas prog ON p.id_programa = prog.id_programa
       INNER JOIN portafolios port ON prog.id_portafolio = port.id_portafolio
       WHERE ea.id_usuario = ? AND ea.activo = 1`,
      [id_estudiante]
    );

    // Combinar ambos tipos de evidencias
    const todasLasEvidencias = [
      ...evidenciasGenerales,
      ...evidenciasActividades
    ].sort((a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida));

    res.json(todasLasEvidencias);

  } catch (error) {
    console.error('Error al obtener todas las evidencias:', error);
    res.status(500).json({ error: "Error al obtener evidencias" });
  }
};

export const getUnifiedEvidenceStats = async (req, res) => {
  try {
    const id_estudiante = req.user.id;

    // Estadísticas de evidencias generales (portafolio)
    const [statsGenerales] = await pool.query(
      `SELECT 
        COUNT(*) as total_evidencias_generales,
        COUNT(CASE WHEN estado_validacion = 'aprobado' THEN 1 END) as aprobadas_generales,
        COUNT(CASE WHEN estado_validacion = 'pendiente' THEN 1 END) as pendientes_generales,
        COUNT(CASE WHEN estado_validacion = 'requiere_cambios' THEN 1 END) as requieren_cambios_generales,
        COUNT(CASE WHEN estado_validacion = 'rechazado' THEN 1 END) as rechazadas_generales,
        COUNT(CASE WHEN es_entrega_final = 1 THEN 1 END) as entregas_finales_generales,
        COUNT(CASE WHEN fecha_limite < CURDATE() AND estado_validacion != 'aprobado' THEN 1 END) as vencidas_generales,
        COUNT(CASE WHEN fecha_limite BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) 
                   AND estado_validacion != 'aprobado' THEN 1 END) as proximas_vencer_generales
       FROM evidencias_portafolio 
       WHERE id_estudiante = ? AND activo = 1`,
      [id_estudiante]
    );

    // Estadísticas de evidencias de actividades
    const [statsActividades] = await pool.query(
      `SELECT 
        COUNT(*) as total_evidencias_actividades,
        COUNT(CASE WHEN estado_revision = 'aprobado' THEN 1 END) as aprobadas_actividades,
        COUNT(CASE WHEN estado_revision = 'pendiente' THEN 1 END) as pendientes_actividades,
        COUNT(CASE WHEN estado_revision = 'revision' THEN 1 END) as requieren_cambios_actividades,
        COUNT(CASE WHEN estado_revision = 'rechazado' THEN 1 END) as rechazadas_actividades
       FROM evidencias_actividad 
       WHERE id_usuario = ? AND activo = 1`,
      [id_estudiante]
    );

    // Combinar estadísticas
    const statsUnificadas = {
      // Totales combinados
      total_evidencias: statsGenerales[0].total_evidencias_generales + statsActividades[0].total_evidencias_actividades,
      aprobadas: statsGenerales[0].aprobadas_generales + statsActividades[0].aprobadas_actividades,
      pendientes: statsGenerales[0].pendientes_generales + statsActividades[0].pendientes_actividades,
      requieren_cambios: statsGenerales[0].requieren_cambios_generales + statsActividades[0].requieren_cambios_actividades,
      rechazadas: statsGenerales[0].rechazadas_generales + statsActividades[0].rechazadas_actividades,
      
      // Solo de evidencias generales (las de actividades no tienen fecha límite)
      entregas_finales: statsGenerales[0].entregas_finales_generales,
      vencidas: statsGenerales[0].vencidas_generales,
      proximas_vencer: statsGenerales[0].proximas_vencer_generales,
      
      // Desglose por tipo
      por_tipo: {
        generales: {
          total: statsGenerales[0].total_evidencias_generales,
          aprobadas: statsGenerales[0].aprobadas_generales,
          pendientes: statsGenerales[0].pendientes_generales,
          requieren_cambios: statsGenerales[0].requieren_cambios_generales,
          rechazadas: statsGenerales[0].rechazadas_generales
        },
        actividades: {
          total: statsActividades[0].total_evidencias_actividades,
          aprobadas: statsActividades[0].aprobadas_actividades,
          pendientes: statsActividades[0].pendientes_actividades,
          requieren_cambios: statsActividades[0].requieren_cambios_actividades,
          rechazadas: statsActividades[0].rechazadas_actividades
        }
      }
    };


    const [categorias] = await pool.query(
      `SELECT 
        ce.nombre_categoria,
        ce.color_hex,
        COUNT(ep.id_evidencia) as cantidad
       FROM categorias_evidencia ce
       LEFT JOIN evidencias_portafolio ep ON ce.id_categoria = ep.categoria_evidencia 
                                          AND ep.id_estudiante = ? AND ep.activo = 1
       WHERE ce.activa = 1
       GROUP BY ce.id_categoria, ce.nombre_categoria, ce.color_hex
       ORDER BY cantidad DESC`,
      [id_estudiante]
    );

    res.json({
      estadisticas: statsUnificadas,
      por_categoria: categorias
    });

  } catch (error) {
    console.error('Error al obtener estadísticas unificadas:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};
export const getEstadisticasGenerales = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id_portafolio) as total_portafolios,
        COUNT(DISTINCT pr.id_programa) as total_programas,
        COUNT(DISTINCT py.id_proyecto) as total_proyectos,
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias,
        AVG(ev_proyecto.total_ev) as promedio_evidencias_por_proyecto,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_aprobadas,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'pendiente' THEN ep.id_evidencia END) as evidencias_pendientes,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'rechazado' THEN ep.id_evidencia END) as evidencias_rechazadas
      FROM portafolios p
      LEFT JOIN programas pr ON p.id_portafolio = pr.id_portafolio
      LEFT JOIN proyectos py ON pr.id_programa = py.id_programa
      LEFT JOIN proyecto_estudiantes pe ON py.id_proyecto = pe.id_proyecto
      LEFT JOIN evidencias_portafolio ep ON py.id_proyecto = ep.id_proyecto AND ep.activo = 1
      LEFT JOIN (
        SELECT id_proyecto, COUNT(*) as total_ev 
        FROM evidencias_portafolio 
        WHERE activo = 1 
        GROUP BY id_proyecto
      ) ev_proyecto ON py.id_proyecto = ev_proyecto.id_proyecto
      WHERE p.activo = 1 AND pr.activo = 1 AND py.activo = 1
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

// Obtener proyectos con estadísticas de evidencias
export const getProyectosConEvidencias = async (req, res) => {
  try {
    const [proyectos] = await pool.query(`
      SELECT 
        py.id_proyecto,
        py.nombre as proyecto,
        pr.nombre as programa,
        p.nombre as portafolio,
        COUNT(DISTINCT ep.id_evidencia) as total_evidencias,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'aprobado' THEN ep.id_evidencia END) as evidencias_aprobadas,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'pendiente' THEN ep.id_evidencia END) as evidencias_pendientes,
        COUNT(DISTINCT CASE WHEN ep.estado_validacion = 'rechazado' THEN ep.id_evidencia END) as evidencias_rechazadas,
        COUNT(DISTINCT pe.id_estudiante) as total_estudiantes
      FROM proyectos py
      INNER JOIN programas pr ON py.id_programa = pr.id_programa
      INNER JOIN portafolios p ON pr.id_portafolio = p.id_portafolio
      LEFT JOIN proyecto_estudiantes pe ON py.id_proyecto = pe.id_proyecto
      LEFT JOIN evidencias_portafolio ep ON py.id_proyecto = ep.id_proyecto AND ep.activo = 1
      WHERE py.activo = 1
      GROUP BY py.id_proyecto, py.nombre, pr.nombre, p.nombre
      ORDER BY p.nombre, pr.nombre, py.nombre
    `);

    res.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos con evidencias:', error);
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
};

// Obtener estudiantes por carrera
export const getEstudiantesPorCarrera = async (req, res) => {
  try {
    const [estudiantes] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.carrera
      FROM usuarios u
      WHERE u.rol = 'estudiante' AND u.activo = 1
      ORDER BY u.carrera, u.apellido, u.nombre
    `);

    res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
};

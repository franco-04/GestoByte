import express from 'express';
import path from 'path';
import multer from 'multer';
import {
  register,
  login,
  getProfile,
  sendRecoveryCode,
  verificarCodigo,
  resetPassword,
  activarCuenta,
  logout
} from '../controllers/authController.js';

import { 
  uploadSignedEvidenceByCoordinator,  
  getEvidenceReturns,
  downloadSignedDocument,
  getStudentEvidenceNotifications,
  markEvidenceNotificationAsRead
} from '../controllers/activitiesController.js';

import {
  createCoordinator,
  getCoordinators,
  toggleCoordinatorStatus,
  getUserStats
} from '../controllers/userManagementController.js';

import {
  createPortfolio,
  getProfesores,
  getPortafoliosByCoordinador,
  eliminarPortafolio,
  editarPortafolio,
  getEstudiantesPortafolio,
  getStudentStats,
  getStudentPortafolios,
  getStudentPortfolioDetails,
  getProgramasPortafolio,
  getAsesoresPortafolio,
  createPrograma,
  getProyectosPrograma,
  getEstudiantesPrograma,
  createProyecto,
  getEstudiantesProyecto,
  getPortafoliosAsignados,
  getEvidenciasByProyecto,
  getEstudiantesPortafolioANDPROYECTS
} from '../controllers/portfolioController.js';

import {
  getStudentProjects as getStudentProjectsOld,
  getEnhancedStudentStats,
  getStudentPortfoliosWithHierarchy,
  getStudentAlerts,
  markAlertAsRead,
  getProjectDetails,
  updateProjectProgress
} from '../controllers/studentController.js';

import {
  upload,
  uploadEvidence,
  uploadEvidenceLink,
  getStudentEvidences,
  getAllStudentEvidences,
  getEvidenceComments,
  downloadEvidence as downloadEvidenceGeneral,
  deleteEvidence,
  getEvidenceCategories,
  updateEvidence,
  getEvidenceHistory,
  getStudentEvidenceStats,
  getEvidenceNotifications,
  markNotificationAsRead,
  getAllStudentEvidencesUnified,
  getUnifiedEvidenceStats
} from '../controllers/evidenceController.js';

import {
  getStudentProjects,
  getProjectActivities,
  createActivity,
  updateActivityStatus,
  uploadActivityEvidence,
  getActivityEvidences,
  getProjectMembers,
  reviewEvidence,
  downloadEvidence as downloadActivityEvidence,
  upload as uploadActivity,
  getEvidenceSignature
} from '../controllers/activitiesController.js';

import {
  crearReunion,
  getReunionesCoordinador,
  getReunionesEstudiante,
  confirmarAsistencia,
  actualizarReunion,
  getDetalleReunion,
  getEstadisticasReuniones,
  getProyectosParaReuniones,       
  getEstudiantesProyectoReunion,
  getDetalleProyectoCoordinador,
  getProyectoActividadesCoordinador    
} from '../controllers/reunionesController.js';

import { getEstudiantesByCarrera } from '../controllers/studentController.js';
import { authenticate, canCreateMeetings, isStudent } from '../middlewares/auth.js';

// 🔥 MIDDLEWARE PARA SUPERADMINISTRADORES
const isSuperAdmin = (req, res, next) => {
  if (req.user.rol !== 'Administrador') {
    return res.status(403).json({
      error: 'Esta función es solo para superadministradores'
    });
  }
  next();
};

// 🔥 CONFIGURACIÓN MULTER PARA DOCUMENTOS FIRMADOS
const signedDocsStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/documentos_firmados');
    try {
      // Crear directorio si no existe
      const fs = await import('fs/promises');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `firmado_${timestamp}_${safeName}${extension}`);
  }
});

const uploadSignedDocs = multer({ 
  storage: signedDocsStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB como las evidencias normales
  fileFilter: (req, file, cb) => {
    // Usar los mismos tipos permitidos que las evidencias normales
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif',
      'video/mp4', 
      'audio/mp3', 
      'audio/mpeg',
      'application/zip', 
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

const router = express.Router();

// ===== RUTAS DE AUTENTICACIÓN =====
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/send-code', sendRecoveryCode);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reset-password', resetPassword);
router.get('/activar/:token', activarCuenta);
router.post('/logout', authenticate, logout);

// ===== RUTAS PARA GESTIÓN DE USUARIOS (Solo superadministradores) =====
router.post('/coordinators', authenticate, isSuperAdmin, createCoordinator);
router.get('/coordinators', authenticate, isSuperAdmin, getCoordinators);
router.put('/coordinators/:id/toggle-status', authenticate, isSuperAdmin, toggleCoordinatorStatus);
router.get('/users/stats', authenticate, isSuperAdmin, getUserStats);

// ===== RUTAS DE PORTAFOLIOS =====
router.post('/portafolios', authenticate, createPortfolio);
router.get('/profesores', authenticate, getProfesores);
router.get('/mis-portafolios', authenticate, getPortafoliosByCoordinador);
router.put('/:id/eliminar-portafolio', authenticate, eliminarPortafolio);
router.put('/:id', authenticate, editarPortafolio);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolio);
router.get('/portafolios/:id_portafolio/programas', authenticate, getProgramasPortafolio);
router.get('/portafolios/:id_portafolio/asesores', authenticate, getAsesoresPortafolio);
router.post('/portafolios/:id_portafolio/programas', authenticate, createPrograma);
router.get('/portafolios/asignados', authenticate, getPortafoliosAsignados);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolioANDPROYECTS);

// ===== RUTAS DE PROGRAMAS Y PROYECTOS =====
router.get('/programas/:id_programa/proyectos', authenticate, getProyectosPrograma);
router.get('/programas/:id_programa/estudiantes', authenticate, getEstudiantesPrograma);
router.post('/programas/:id_programa/proyectos', authenticate, createProyecto); 
router.get('/programas/:id_programa/proyectos/:id_proyecto/estudiantes', authenticate, getEstudiantesProyecto);

// ===== RUTAS PARA ESTUDIANTES =====
router.get('/student/stats', authenticate, getStudentStats);
router.get('/student/stats-enhanced', authenticate, getEnhancedStudentStats);
router.get('/student/portafolios', authenticate, getStudentPortafolios);
router.get('/student/portafolios/:id', authenticate, getStudentPortfolioDetails);
router.get('/student/portafolios-hierarchy', authenticate, getStudentPortfoliosWithHierarchy);
router.get('/student/proyectos', authenticate, getStudentProjectsOld);
router.get('/student/proyectos/:id_proyecto', authenticate, getProjectDetails);
router.put('/student/proyectos/:id_proyecto/progress', authenticate, updateProjectProgress);
router.get('/student/my-projects', authenticate, getStudentProjects);
router.get('/student/alertas', authenticate, getStudentAlerts);
router.put('/student/alertas/:id_alerta/read', authenticate, markAlertAsRead);

// ===== RUTAS DE EVIDENCIAS GENERALES =====
router.post('/student/evidencias/upload', authenticate, upload.single('archivo'), uploadEvidence);
router.post('/student/evidencias/upload-link', authenticate, uploadEvidenceLink);
router.get('/student/evidencias/proyecto/:id_proyecto', authenticate, getStudentEvidences);
router.get('/student/evidencias/todas', authenticate, getAllStudentEvidences);
router.get('/student/evidencias/:id_evidencia/comentarios', authenticate, getEvidenceComments);
router.get('/student/evidencias/:id_evidencia/download', authenticate, downloadEvidenceGeneral);
router.delete('/student/evidencias/:id_evidencia', authenticate, deleteEvidence);
router.put('/student/evidencias/:id_evidencia', authenticate, updateEvidence);
router.get('/student/evidencias/:id_evidencia/historial', authenticate, getEvidenceHistory);
router.get('/student/evidencias/categorias', authenticate, getEvidenceCategories);
router.get('/student/evidencias/stats', authenticate, getStudentEvidenceStats);
router.get('/student/evidencias/notificaciones', authenticate, getEvidenceNotifications);
router.put('/student/evidencias/notificaciones/:id_notificacion/read', authenticate, markNotificationAsRead);
router.get('/student/evidencias/todas-unificadas', authenticate, getAllStudentEvidencesUnified);
router.get('/student/evidencias/stats-unificadas', authenticate, getUnifiedEvidenceStats);

// ===== RUTAS DE ACTIVIDADES Y EVIDENCIAS DE ACTIVIDADES =====
router.get('/activities/project/:id_proyecto', authenticate, getProjectActivities);
router.post('/activities/project/:id_proyecto', authenticate, createActivity);
router.put('/activities/:id_actividad/status', authenticate, updateActivityStatus);
router.post('/activities/:id_actividad/evidence', authenticate, uploadActivity.single('archivo'), uploadActivityEvidence);
router.get('/activities/:id_actividad/evidences', authenticate, getActivityEvidences);
router.get('/activities/evidence/:id_evidencia/download', authenticate, downloadActivityEvidence);
router.get('/activities/project/:id_proyecto/members', authenticate, getProjectMembers);

// ===== RUTAS DE REVISIÓN Y FIRMA DE EVIDENCIAS =====
router.put('/activities/evidence/:id_evidencia/review', authenticate, canCreateMeetings, reviewEvidence);

// Subir documento firmado por coordinador
router.post('/activities/evidence/:id_evidencia/upload-signed', 
  authenticate, 
  canCreateMeetings, 
  uploadSignedDocs.single('documento_firmado'), 
  uploadSignedEvidenceByCoordinator
);

// Obtener historial de devoluciones
router.get('/activities/evidence/:id_evidencia/returns', authenticate, getEvidenceReturns);

// Descargar documento firmado
router.get('/activities/evidence/:id_evidencia/download-signed', authenticate, downloadSignedDocument);

// Obtener firma digital
router.get('/activities/evidence/:id_evidencia/signature', authenticate, getEvidenceSignature);

// Notificaciones de devoluciones para estudiantes
router.get('/student/evidence/notifications', authenticate, isStudent, getStudentEvidenceNotifications);
router.put('/student/evidence/notifications/:id_notificacion/read', authenticate, isStudent, markEvidenceNotificationAsRead);

// ===== RUTAS DE REUNIONES =====
router.post('/reuniones', authenticate, canCreateMeetings, crearReunion);
router.get('/reuniones/coordinador', authenticate, canCreateMeetings, getReunionesCoordinador);
router.get('/reuniones/estudiante', authenticate, isStudent, getReunionesEstudiante);
router.get('/reuniones/stats', authenticate, canCreateMeetings, getEstadisticasReuniones);
router.get('/reuniones/proyectos', authenticate, canCreateMeetings, getProyectosParaReuniones);
router.get('/reuniones/proyectos/:id_proyecto/estudiantes', authenticate, canCreateMeetings, getEstudiantesProyectoReunion);
router.get('/reuniones/:id_reunion', authenticate, getDetalleReunion);
router.put('/reuniones/:id_reunion', authenticate, canCreateMeetings, actualizarReunion);
router.post('/reuniones/:id_reunion/confirmar', authenticate, isStudent, confirmarAsistencia);

// ===== RUTAS DE PROYECTOS PARA COORDINADORES =====
router.get('/proyectos/:id_proyecto/detalle', authenticate, canCreateMeetings, getDetalleProyectoCoordinador);
router.get('/proyectos/:id_proyecto/actividades', authenticate, canCreateMeetings, getProyectoActividadesCoordinador);
router.get('/proyectos/:id_proyecto/evidencias', authenticate, getEvidenciasByProyecto);

// ===== RUTAS MISCELÁNEAS =====
router.get('/estudiantes/carrera/:carrera', authenticate, getEstudiantesByCarrera);

export default router;
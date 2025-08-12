import express from 'express';
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

import path from 'path';


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
  uploadSignedEvidenceByCoordinator,
  getEvidenceReturns,
  downloadSignedDocument,
  getStudentEvidenceNotifications,
  markEvidenceNotificationAsRead,
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
import multer from 'multer';


// 🔥 NUEVO MIDDLEWARE PARA SUPERADMINISTRADORES
const isSuperAdmin = (req, res, next) => {
  if (req.user.rol !== 'Administrador') {
    return res.status(403).json({
      error: 'Esta función es solo para superadministradores'
    });
  }
  next();
};

const signedDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documentos_firmados/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `firmado_${timestamp}_${originalName}`);
  }
});

const uploadSignedDocs = multer({ 
  storage: signedDocsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX o imágenes'));
    }
  }
});

const router = express.Router();

// Rutas de autenticación básicas
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/send-code', sendRecoveryCode);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reset-password', resetPassword);
router.get('/activar/:token', activarCuenta);
router.post('/logout', authenticate, logout);

// 🔥 NUEVAS RUTAS PARA GESTIÓN DE USUARIOS (Solo superadministradores)
router.post('/coordinators', authenticate, isSuperAdmin, createCoordinator);
router.get('/coordinators', authenticate, isSuperAdmin, getCoordinators);
router.put('/coordinators/:id/toggle-status', authenticate, isSuperAdmin, toggleCoordinatorStatus);
router.get('/users/stats', authenticate, isSuperAdmin, getUserStats);

// Rutas existentes de portafolios
router.post('/portafolios', authenticate, createPortfolio);
router.get('/profesores', authenticate, getProfesores);
router.get('/mis-portafolios', authenticate, getPortafoliosByCoordinador);
router.put('/:id/eliminar-portafolio', authenticate, eliminarPortafolio);
router.put('/:id', authenticate, editarPortafolio);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolio);

router.get('/portafolios/:id_portafolio/programas', authenticate, getProgramasPortafolio);
router.get('/portafolios/:id_portafolio/asesores', authenticate, getAsesoresPortafolio);
router.post('/portafolios/:id_portafolio/programas', authenticate, createPrograma);

// Nuevas rutas para portafolios asignados y gestión de proyectos
router.get('/portafolios/asignados', authenticate, getPortafoliosAsignados);

router.get('/programas/:id_programa/proyectos', authenticate, getProyectosPrograma);
router.get('/programas/:id_programa/estudiantes', authenticate, getEstudiantesPrograma);
router.post('/programas/:id_programa/proyectos', authenticate, createProyecto); 
router.get('/programas/:id_programa/proyectos/:id_proyecto/estudiantes', authenticate, getEstudiantesProyecto);

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

router.get('/activities/project/:id_proyecto', authenticate, getProjectActivities);
router.post('/activities/project/:id_proyecto', authenticate, createActivity);
router.put('/activities/:id_actividad/status', authenticate, updateActivityStatus);

router.post('/activities/:id_actividad/evidence', authenticate, uploadActivity.single('archivo'), uploadActivityEvidence);
router.get('/activities/:id_actividad/evidences', authenticate, getActivityEvidences);
router.get('/activities/evidence/:id_evidencia/download', authenticate, downloadActivityEvidence);

router.get('/activities/project/:id_proyecto/members', authenticate, getProjectMembers);

router.get('/estudiantes/carrera/:carrera', authenticate, getEstudiantesByCarrera);
router.get('/student/evidencias/todas-unificadas', authenticate, getAllStudentEvidencesUnified);
router.get('/student/evidencias/stats-unificadas', authenticate, getUnifiedEvidenceStats);

router.post('/reuniones', authenticate, canCreateMeetings, crearReunion);
router.get('/reuniones/coordinador', authenticate, canCreateMeetings, getReunionesCoordinador);
router.get('/reuniones/estudiante', authenticate, isStudent, getReunionesEstudiante);
router.get('/reuniones/stats', authenticate, canCreateMeetings, getEstadisticasReuniones);

router.get('/reuniones/proyectos', authenticate, canCreateMeetings, getProyectosParaReuniones);
router.get('/reuniones/proyectos/:id_proyecto/estudiantes', authenticate, canCreateMeetings, getEstudiantesProyectoReunion);

router.get('/reuniones/:id_reunion', authenticate, getDetalleReunion);
router.put('/reuniones/:id_reunion', authenticate, canCreateMeetings, actualizarReunion);
router.post('/reuniones/:id_reunion/confirmar', authenticate, isStudent, confirmarAsistencia);

router.get('/proyectos/:id_proyecto/detalle', authenticate, canCreateMeetings, getDetalleProyectoCoordinador);
router.get('/proyectos/:id_proyecto/actividades', authenticate, canCreateMeetings, getProyectoActividadesCoordinador);
router.get('/proyectos/:id_proyecto/evidencias', authenticate, getEvidenciasByProyecto);

router.put('/activities/evidence/:id_evidencia/review', authenticate, canCreateMeetings, reviewEvidence);

router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolioANDPROYECTS);

router.put('/activities/evidence/:id_evidencia/review', authenticate, canCreateMeetings, reviewEvidence);

// NUEVA: Subir documento firmado por coordinador
router.post('/activities/evidence/:id_evidencia/upload-signed', 
  authenticate, 
  canCreateMeetings, 
  uploadSignedDocs.single('documento_firmado'), 
  uploadSignedEvidenceByCoordinator
);

// NUEVA: Obtener historial de devoluciones
router.get('/activities/evidence/:id_evidencia/returns', authenticate, getEvidenceReturns);

// NUEVA: Descargar documento firmado
router.get('/activities/evidence/:id_evidencia/download-signed', authenticate, downloadSignedDocument);

// NUEVA: Obtener notificaciones de devoluciones para estudiantes
router.get('/student/evidence/notifications', authenticate, isStudent, getStudentEvidenceNotifications);

// NUEVA: Marcar notificación como leída
router.put('/student/evidence/notifications/:id_notificacion/read', authenticate, isStudent, markEvidenceNotificationAsRead);

router.get('/activities/evidence/:id_evidencia/signature', authenticate, getEvidenceSignature);

export default router;
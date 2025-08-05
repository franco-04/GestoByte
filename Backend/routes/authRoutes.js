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
  getEstudiantesProyecto
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
  downloadEvidence as downloadActivityEvidence,
  upload as uploadActivity
} from '../controllers/activitiesController.js';

import {
  crearReunion,
  getReunionesCoordinador,
  getReunionesEstudiante,
  confirmarAsistencia,
  actualizarReunion,
  getDetalleReunion,
  getEstadisticasReuniones
} from '../controllers/reunionesController.js';

import { getEstudiantesByCarrera } from '../controllers/studentController.js';
import { authenticate, canCreateMeetings, isStudent } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/send-code', sendRecoveryCode);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reset-password', resetPassword);
router.get('/activar/:token', activarCuenta);
router.post('/logout', authenticate, logout);

router.post('/portafolios', authenticate, createPortfolio);
router.get('/profesores', authenticate, getProfesores);
router.get('/mis-portafolios', authenticate, getPortafoliosByCoordinador);
router.put('/:id/eliminar-portafolio', authenticate, eliminarPortafolio);
router.put('/:id', authenticate, editarPortafolio);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolio);

router.get('/portafolios/:id_portafolio/programas', authenticate, getProgramasPortafolio);
router.get('/portafolios/:id_portafolio/asesores', authenticate, getAsesoresPortafolio);
router.post('/portafolios/:id_portafolio/programas', authenticate, createPrograma);

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
router.get('/reuniones/:id_reunion', authenticate, getDetalleReunion);
router.put('/reuniones/:id_reunion', authenticate, canCreateMeetings, actualizarReunion);
router.post('/reuniones/:id_reunion/confirmar', authenticate, isStudent, confirmarAsistencia);

export default router;
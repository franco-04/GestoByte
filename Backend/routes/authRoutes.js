import express from 'express';
import {
  register,
  login,
  getProfile,
  sendRecoveryCode,
  verificarCodigo,
  resetPassword,
  activarCuenta
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
  getStudentProjects,
  getEnhancedStudentStats,
  getStudentPortfoliosWithHierarchy,
  getStudentAlerts,
  markAlertAsRead,
  getProjectDetails,
  updateProjectProgress
} from '../controllers/studentController.js';

import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/send-code', sendRecoveryCode);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reset-password', resetPassword);
router.get('/activar/:token', activarCuenta);

// Rutas de portafolios
router.post('/portafolios', authenticate, createPortfolio);
router.get('/profesores', authenticate, getProfesores);
router.get('/mis-portafolios', authenticate, getPortafoliosByCoordinador);

router.put('/:id/eliminar-portafolio', authenticate, eliminarPortafolio);
router.put('/:id', authenticate, editarPortafolio);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolio);
router.get('/student/stats', authenticate, getStudentStats);
router.get('/student/portafolios', authenticate, getStudentPortafolios);
router.get('/student/portafolios/:id', authenticate, getStudentPortfolioDetails);


//Rutas de programas con los portafolios
router.get('/portafolios/:id_portafolio/programas', authenticate, getProgramasPortafolio);
router.get('/portafolios/:id_portafolio/asesores', authenticate, getAsesoresPortafolio);
router.post('/portafolios/:id_portafolio/programas', authenticate, createPrograma);


// Rutas de proyectos con los programas
router.get('/programas/:id_programa/proyectos', authenticate, getProyectosPrograma);
router.get('/programas/:id_programa/estudiantes', authenticate, getEstudiantesPrograma);
router.post('/programas/:id_programa/proyectos', authenticate, createProyecto); 
router.get('/programas/:id_programa/proyectos/:id_proyecto/estudiantes', authenticate, getEstudiantesProyecto); 


router.get('/student/proyectos', authenticate, getStudentProjects);
router.get('/student/stats-enhanced', authenticate, getEnhancedStudentStats);
router.get('/student/portafolios-hierarchy', authenticate, getStudentPortfoliosWithHierarchy);
router.get('/student/alertas', authenticate, getStudentAlerts);
router.put('/student/alertas/:id_alerta/read', authenticate, markAlertAsRead);
router.get('/student/proyectos/:id_proyecto', authenticate, getProjectDetails);
router.put('/student/proyectos/:id_proyecto/progress', authenticate, updateProjectProgress);

export default router;

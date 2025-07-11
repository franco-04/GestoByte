import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { createPortfolio, getUsuarios, getPortafoliosByProfesor, eliminarPortafolio, editarPortafolio, getEstudiantesPortafolio, getStudentStats, getStudentPortafolios, getStudentPortfolioDetails   } from '../controllers/portfolioController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

// Rutas para portafolios
router.post('/portafolios', authenticate, createPortfolio);
router.get('/usuarios', authenticate, getUsuarios);
router.get('/mis-portafolios', authenticate, getPortafoliosByProfesor);
router.put('/:id/eliminar-portafolio', authenticate, eliminarPortafolio);
router.put('/:id', authenticate, editarPortafolio);
router.get('/portafolios/:id/estudiantes', authenticate, getEstudiantesPortafolio);
router.get('/student/stats', authenticate, getStudentStats);
router.get('/student/portafolios', authenticate, getStudentPortafolios);
router.get('/student/portafolios/:id', authenticate, getStudentPortfolioDetails);


export default router;
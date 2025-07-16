
import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  upload,
  uploadEvidence,
  uploadEvidenceLink,
  getStudentEvidences,
  getAllStudentEvidences,
  getEvidenceComments,
  downloadEvidence,
  deleteEvidence,
  getEvidenceCategories,
  updateEvidence,
  getEvidenceHistory,
  getStudentEvidenceStats,
  getEvidenceNotifications,
  markNotificationAsRead
} from '../controllers/evidenceController.js';

const router = express.Router();

router.post('/evidencias/upload', authenticate, upload.single('archivo'), uploadEvidence);
router.post('/evidencias/upload-link', authenticate, uploadEvidenceLink);
router.get('/evidencias/proyecto/:id_proyecto', authenticate, getStudentEvidences);
router.get('/evidencias/todas', authenticate, getAllStudentEvidences);
router.get('/evidencias/:id_evidencia/comentarios', authenticate, getEvidenceComments);
router.get('/evidencias/:id_evidencia/download', authenticate, downloadEvidence);
router.delete('/evidencias/:id_evidencia', authenticate, deleteEvidence);
router.put('/evidencias/:id_evidencia', authenticate, updateEvidence);
router.get('/evidencias/:id_evidencia/historial', authenticate, getEvidenceHistory);

// Rutas para categorías y estadísticas
router.get('/evidencias/categorias', authenticate, getEvidenceCategories);
router.get('/evidencias/stats', authenticate, getStudentEvidenceStats);

// Rutas para notificaciones
router.get('/evidencias/notificaciones', authenticate, getEvidenceNotifications);
router.put('/evidencias/notificaciones/:id_notificacion/read', authenticate, markNotificationAsRead);

export default router;

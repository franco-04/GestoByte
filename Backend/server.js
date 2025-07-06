import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import pool from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

// Ruta de prueba de conexión a DB
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS current_time');
    res.json({ 
      success: true, 
      message: 'Conexión a MySQL exitosa', 
      time: rows[0].current_time 
    });
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al conectar a la base de datos' 
    });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});
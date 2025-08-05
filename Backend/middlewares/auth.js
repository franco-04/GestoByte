import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secretouniversitario';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario aún existe y obtener su información completa
    const [rows] = await pool.query(
      'SELECT id_usuario, rol, nombre, apellido, email, carrera FROM usuarios WHERE id_usuario = ?', 
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Establecer información completa del usuario en req.user
    req.user = {
      id: decoded.id,
      rol: rows[0].rol,
      nombre: rows[0].nombre,
      apellido: rows[0].apellido,
      email: rows[0].email,
      carrera: rows[0].carrera
    };
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar que el usuario puede crear reuniones
export const canCreateMeetings = (req, res, next) => {
  const allowedRoles = ['Coordinador', 'Administrador'];
  
  console.log('=== DEBUG MIDDLEWARE ===');
  console.log('User from request:', req.user);
  console.log('User role:', req.user?.rol);
  console.log('Allowed roles:', allowedRoles);
  console.log('Is allowed:', allowedRoles.includes(req.user?.rol));
  console.log('=== END DEBUG ===');
  
  if (!allowedRoles.includes(req.user?.rol)) {
    return res.status(403).json({
      error: 'No tienes permisos para realizar esta acción',
      userRole: req.user?.rol,
      allowedRoles: allowedRoles
    });
  }
  
  next();
};

export const isStudent = (req, res, next) => {
  if (req.user.rol !== 'Estudiante') {
    return res.status(403).json({
      error: 'Esta función es solo para estudiantes'
    });
  }
  
  next();
};
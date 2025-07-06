  import pool from '../config/db.js';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';

  const JWT_SECRET = process.env.JWT_SECRET || 'secretouniversitario';

  // controllers/authController.js
  export const register = async (req, res) => {
    try {
      const { email, password, nombre, apellido, carrera } = req.body;

      // Validar campos requeridos
      if (!nombre || !apellido || !carrera) {
        return res.status(400).json({ 
          error: 'Nombre, apellido y carrera son campos obligatorios' 
        });
      }

      // Resto del código de registro...
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ?', 
        [email]
      );

      if (rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        `INSERT INTO usuarios 
        (email, password_hash, nombre, apellido, rol, carrera, activo, fecha_creacion) 
        VALUES (?, ?, ?, ?, 'estudiante', ?, 1, NOW())`,
        [email, hashedPassword, nombre, apellido, carrera]
      );

      const token = jwt.sign(
        { id: result.insertId, email, rol: 'estudiante' }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: result.insertId,
          email,
          nombre,
          apellido,
          carrera,
          rol: 'estudiante'
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ 
        error: 'Error en el servidor',
        details: error.message 
      });
    }
  };
  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ?', 
        [email]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: 'Credenciales incorrectas' });
      }

      const user = rows[0];

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Credenciales incorrectas' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id_usuario, email: user.email, rol: user.rol }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id_usuario,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          carrera: user.carrera,
          rol: user.rol
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  };

  export const getProfile = async (req, res) => {
    try {
      const userId = req.user.id;

      const [rows] = await pool.query(
        `SELECT id_usuario, email, nombre, apellido, rol, carrera 
        FROM usuarios WHERE id_usuario = ?`, 
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ success: true, user: rows[0] });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  };
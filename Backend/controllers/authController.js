  import pool from '../config/db.js';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import nodemailer from 'nodemailer';
import crypto from 'crypto';


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
  export const sendRecoveryCode = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?', 
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Correo no encontrado' });
    }

    // Generar código de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar el código temporalmente (ideal: en DB o caché con expiración)
    await pool.query(
      'UPDATE usuarios SET codigo_recuperacion = ?, codigo_expiracion = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?',
      [code, email]
    );

    // Configurar nodemailer (puedes usar Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: '"BlueByte-Recuperacion de contraseña" <no-reply@upt.edu>',
      to: email,
      subject: 'Código de recuperación de contraseña', 
      html: `<p>Tu código de recuperación es: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`
    });

    res.json({ success: true, message: 'Código enviado al correo' });
  } catch (error) {
    console.error('Error al enviar código:', error);
    res.status(500).json({ success: false, error: 'Error al enviar código' });
  }
};
export const verificarCodigo = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ success: false, error: 'Faltan datos' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT codigo_recuperacion, codigo_expiracion 
       FROM usuarios WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Correo no encontrado' });
    }

    const usuario = rows[0];
    const ahora = new Date();
    const expiracion = new Date(usuario.codigo_expiracion);

    if (usuario.codigo_recuperacion !== codigo) {
      return res.status(401).json({ success: false, error: 'Código incorrecto' });
    }

    if (ahora > expiracion) {
      return res.status(410).json({ success: false, error: 'Código expirado' });
    }

    res.json({ success: true, message: 'Código válido' });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};
export const resetPassword = async (req, res) => {
  const { email, nuevaContrasena } = req.body;

  if (!email || !nuevaContrasena) {
    return res.status(400).json({ success: false, error: 'Faltan datos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    const [result] = await pool.query(
      `UPDATE usuarios SET password_hash = ?, codigo_recuperacion = NULL, codigo_expiracion = NULL WHERE email = ?`,
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

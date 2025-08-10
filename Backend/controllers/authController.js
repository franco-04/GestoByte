import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "secretouniversitario";

// 🔥 FUNCIÓN HELPER PARA ENVÍO SEGURO DE EMAILS
const sendEmailSafely = async (transporter, mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado exitosamente:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn("⚠️ Error al enviar email (continuando sin fallo):", error.message);
    return { success: false, error: error.message };
  }
};

// 🔥 VERIFICAR SI EMAIL ESTÁ CONFIGURADO
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

export const register = async (req, res) => {
  try {
    const { email, password, nombre, apellido, carrera } = req.body;

    if (!nombre || !apellido || !carrera) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    if (!email.endsWith('@uteq.edu.mx')) {
      return res.status(400).json({ 
        error: "Solo se aceptan correos institucionales con terminación @uteq.edu.mx" 
      });
    }

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const [userCount] = await pool.query("SELECT COUNT(*) as total FROM usuarios");
    const isFirstUser = userCount[0].total === 0;
    
    // Determinar el rol basado en si es el primer usuario
    const userRole = isFirstUser ? 'Administrador' : 'Estudiante';
    
    // Si es el primer usuario, activar automáticamente
    const isActive = isFirstUser ? 1 : 0;

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`📝 Registrando usuario: ${email} como ${userRole}`);

    const [result] = await pool.query(
      `INSERT INTO usuarios 
        (email, password_hash, nombre, apellido, rol, carrera, activo, fecha_creacion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [email, hashedPassword, nombre, apellido, userRole, carrera, isActive]
    );

    console.log(`✅ Usuario creado con ID: ${result.insertId}`);

    if (isFirstUser) {
      // Primer usuario - Superadministrador activado automáticamente
      const token = jwt.sign(
        { id: result.insertId, email, rol: userRole },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      console.log("🎉 Primer superadministrador creado exitosamente");

      res.json({
        success: true,
        message: "¡Felicidades! Te has convertido en el primer Superadministrador del sistema.",
        isFirstUser: true,
        token,
        user: {
          id: result.insertId,
          email,
          nombre,
          apellido,
          carrera,
          rol: userRole,
        },
      });
    } else {
      // Usuario normal - Estudiante (requiere activación)
      const activationToken = jwt.sign(
        { id: result.insertId, email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/activar-cuenta/${activationToken}`;
      
      let emailResult = { success: false };
      let responseMessage = "Registro exitoso.";

      // 🔥 INTENTAR ENVÍO DE EMAIL SOLO SI ESTÁ CONFIGURADO
      if (isEmailConfigured()) {
        console.log("📧 Enviando email de activación...");
        
        try {
          const transporter = nodemailer.createTransporter({
            service: "Gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const mailOptions = {
            from: '"BlueByte - Activación de cuenta" <no-reply@uteq.edu.mx>',
            to: email,
            subject: "Activa tu cuenta",
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px;">
                <div style="background: #4e73df; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0;">¡Bienvenido a BlueByte!</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                  <h2 style="color: #333;">Hola ${nombre},</h2>
                  <p>Gracias por registrarte en nuestro sistema académico. Para activar tu cuenta, haz clic en el siguiente botón:</p>
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${activationLink}" style="background-color:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Activar Cuenta</a>
                  </div>
                  <p><strong>Importante:</strong> Este enlace expirará en 24 horas.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                  <p style="font-size: 12px; color: #666;">Si no puedes hacer clic en el botón, copia este enlace: ${activationLink}</p>
                </div>
              </div>
            `,
          };

          emailResult = await sendEmailSafely(transporter, mailOptions);
          
          if (emailResult.success) {
            responseMessage = "Registro exitoso. Revisa tu correo para activar tu cuenta.";
          } else {
            responseMessage = "Registro exitoso. El email de activación no pudo enviarse, pero tu cuenta fue creada.";
          }

        } catch (emailError) {
          console.warn("⚠️ Error en configuración de email:", emailError.message);
          responseMessage = "Registro exitoso. Email no configurado, cuenta creada sin activación automática.";
        }
      } else {
        console.log("📧 Email no configurado, saltando envío");
        responseMessage = "Registro exitoso. Email no configurado en el servidor.";
      }

      // 🔥 RESPUESTA EXITOSA INDEPENDIENTEMENTE DEL EMAIL
      res.json({
        success: true,
        message: responseMessage,
        isFirstUser: false,
        emailSent: emailResult.success,
        // En desarrollo, incluir el link de activación
        ...(process.env.NODE_ENV === 'development' && { 
          activationLink,
          debug: {
            emailConfigured: isEmailConfigured(),
            emailResult: emailResult
          }
        })
      });
    }
  } catch (error) {
    console.error("💥 Error en registro:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Credenciales incorrectas" });
    }

    const user = rows[0];

    // Verificar si la cuenta está activa
    if (!user.activo) {
      return res.status(400).json({ 
        error: "Tu cuenta no está activada. Revisa tu correo electrónico o contacta al administrador." 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Credenciales incorrectas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id_usuario, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`✅ Login exitoso: ${user.email} (${user.rol})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id_usuario,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        carrera: user.carrera,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
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
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const sendRecoveryCode = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Correo no encontrado" });
    }

    // Generar código de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar el código temporalmente
    await pool.query(
      "UPDATE usuarios SET codigo_recuperacion = ?, codigo_expiracion = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?",
      [code, email]
    );

    console.log(`🔐 Código de recuperación generado para ${email}: ${code}`);

    let emailResult = { success: false };
    let responseMessage = "Código generado.";

    // 🔥 INTENTAR ENVÍO DE EMAIL SOLO SI ESTÁ CONFIGURADO
    if (isEmailConfigured()) {
      try {
        const transporter = nodemailer.createTransporter({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: '"BlueByte - Recuperación de contraseña" <no-reply@uteq.edu.mx>',
          to: email,
          subject: "Código de recuperación de contraseña",
          html: `
            <div style="max-width: 500px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #4e73df; text-align: center;">Recuperación de Contraseña</h2>
              <p>Has solicitado restablecer tu contraseña.</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; border: 2px solid #4e73df; padding: 20px; border-radius: 10px; display: inline-block;">
                  <h1 style="margin: 0; color: #4e73df; font-size: 2.5em; letter-spacing: 8px;">${code}</h1>
                </div>
              </div>
              <p><strong>Este código es válido por 10 minutos.</strong></p>
              <p style="color: #6c757d; font-size: 12px;">Si no solicitaste este código, ignora este mensaje.</p>
            </div>
          `,
        };

        emailResult = await sendEmailSafely(transporter, mailOptions);
        responseMessage = emailResult.success 
          ? "Código enviado al correo" 
          : "Código generado pero no pudo enviarse por email";

      } catch (emailError) {
        console.warn("⚠️ Error en configuración de email:", emailError.message);
        responseMessage = "Código generado pero email no configurado";
      }
    } else {
      console.log("📧 Email no configurado para recuperación");
      responseMessage = "Código generado (email no configurado)";
    }

    res.json({ 
      success: true, 
      message: responseMessage,
      emailSent: emailResult.success,
      // En desarrollo, mostrar el código
      ...(process.env.NODE_ENV === 'development' && { 
        debugCode: code,
        emailConfigured: isEmailConfigured()
      })
    });

  } catch (error) {
    console.error("Error al enviar código:", error);
    res.status(500).json({ success: false, error: "Error al enviar código" });
  }
};

export const verificarCodigo = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT codigo_recuperacion, codigo_expiracion 
       FROM usuarios WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Correo no encontrado" });
    }

    const usuario = rows[0];
    const ahora = new Date();
    const expiracion = new Date(usuario.codigo_expiracion);

    if (usuario.codigo_recuperacion !== codigo) {
      return res
        .status(401)
        .json({ success: false, error: "Código incorrecto" });
    }

    if (ahora > expiracion) {
      return res.status(410).json({ success: false, error: "Código expirado" });
    }

    console.log(`✅ Código verificado correctamente para ${email}`);
    res.json({ success: true, message: "Código válido" });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({ success: false, error: "Error en el servidor" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, nuevaContrasena } = req.body;

  if (!email || !nuevaContrasena) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    const [result] = await pool.query(
      `UPDATE usuarios SET password_hash = ?, codigo_recuperacion = NULL, codigo_expiracion = NULL WHERE email = ?`,
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });
    }

    console.log(`✅ Contraseña restablecida para ${email}`);

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ success: false, error: "Error en el servidor" });
  }
};

export const activarCuenta = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = decoded;

    const [result] = await pool.query(
      'UPDATE usuarios SET activo = 1 WHERE id_usuario = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, error: 'Usuario no encontrado o ya activado' });
    }

    console.log(`✅ Cuenta activada para usuario ID: ${id}`);
    res.json({ success: true, message: 'Cuenta activada correctamente' });

  } catch (error) {
    console.error('Error al activar cuenta:', error);
    res.status(400).json({ success: false, error: 'Token inválido o expirado' });
  }
};

export const logout = (req, res) => {
  console.log("👋 Usuario cerró sesión");
  res.json({ success: true, message: "Sesión cerrada correctamente." });
};
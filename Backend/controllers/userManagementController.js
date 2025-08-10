import pool from "../config/db.js";
import bcrypt from "bcryptjs";

// Crear coordinador (solo para superadministradores)
export const createCoordinator = async (req, res) => {
  try {
    const { email, password, nombre, apellido, carrera } = req.body;

    // Validar que el usuario que hace la petición sea Administrador (superadmin)
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ 
        error: "Solo los superadministradores pueden crear coordinadores" 
      });
    }

    if (!nombre || !apellido || !carrera || !email || !password) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Validar email institucional
    if (!email.endsWith('@uteq.edu.mx')) {
      return res.status(400).json({ 
        error: "Solo se aceptan correos institucionales con terminación @uteq.edu.mx" 
      });
    }

    // Verificar si el email ya existe
    const [existingUser] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?", 
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear coordinador (activo por defecto)
    const [result] = await pool.query(
      `INSERT INTO usuarios 
        (email, password_hash, nombre, apellido, rol, carrera, activo, fecha_creacion) 
        VALUES (?, ?, ?, ?, 'Coordinador', ?, 1, NOW())`,
      [email, hashedPassword, nombre, apellido, carrera]
    );

    res.json({
      success: true,
      message: "Coordinador creado exitosamente",
      coordinator: {
        id: result.insertId,
        email,
        nombre,
        apellido,
        carrera,
        rol: 'Coordinador'
      }
    });

  } catch (error) {
    console.error("Error al crear coordinador:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Obtener todos los coordinadores
export const getCoordinators = async (req, res) => {
  try {
    // Validar que el usuario sea superadministrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ 
        error: "Solo los superadministradores pueden ver esta información" 
      });
    }

    const [coordinators] = await pool.query(
      `SELECT id_usuario, email, nombre, apellido, carrera, activo, fecha_creacion
       FROM usuarios 
       WHERE rol = 'Coordinador'
       ORDER BY fecha_creacion DESC`
    );

    res.json({
      success: true,
      coordinators
    });

  } catch (error) {
    console.error("Error al obtener coordinadores:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Activar/Desactivar coordinador
export const toggleCoordinatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    // Validar que el usuario sea superadministrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ 
        error: "Solo los superadministradores pueden realizar esta acción" 
      });
    }

    // Verificar que el coordinador existe
    const [coordinator] = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = ? AND rol = 'Coordinador'",
      [id]
    );

    if (coordinator.length === 0) {
      return res.status(404).json({ error: "Coordinador no encontrado" });
    }

    // Actualizar estado
    const [result] = await pool.query(
      "UPDATE usuarios SET activo = ? WHERE id_usuario = ?",
      [activo ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No se pudo actualizar el coordinador" });
    }

    res.json({
      success: true,
      message: `Coordinador ${activo ? 'activado' : 'desactivado'} correctamente`
    });

  } catch (error) {
    console.error("Error al cambiar estado del coordinador:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Obtener estadísticas de usuarios
export const getUserStats = async (req, res) => {
  try {
    // Validar que el usuario sea superadministrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ 
        error: "Solo los superadministradores pueden ver esta información" 
      });
    }

    const [stats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN rol = 'Administrador' THEN 1 END) as total_superadmins,
        COUNT(CASE WHEN rol = 'Coordinador' THEN 1 END) as total_coordinators,
        COUNT(CASE WHEN rol = 'Estudiante' THEN 1 END) as total_students,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as total_active,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as total_inactive,
        COUNT(*) as total_users
      FROM usuarios
    `);

    const [careerStats] = await pool.query(`
      SELECT 
        carrera,
        COUNT(*) as total,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as active,
        COUNT(CASE WHEN rol = 'Coordinador' THEN 1 END) as coordinators,
        COUNT(CASE WHEN rol = 'Estudiante' THEN 1 END) as students
      FROM usuarios
      GROUP BY carrera
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      generalStats: stats[0],
      careerStats
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
// src/services/authService.js
import api from "../api/api";
import errorHandler from "../utils/errorHandler";

// 🔁 Mapeo de roles de BD a roles de frontend
const roleMap = {
  estudiante: "estudiante",
  coordinador: "administrador",
  administrador: "superadministrador",
};

const authService = {
  register: async (userData) => {
    try {
      const formattedData = {
        email: userData.email,
        password: userData.password,
        nombre: userData.firstName,
        apellido: userData.lastName,
        carrera: userData.career,
      };

      const response = await api.post("/auth/register", formattedData);
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw errorHandler(error);
    }
  },

  login: async (credentials) => {
    try {
      console.log("🔑 Intentando login con:", credentials.email);
      
      const response = await api.post("/auth/login", credentials);
      
      console.log("✅ Respuesta del servidor:", response.data);

      const rawRole = response.data.user.rol.toLowerCase();
      const mappedRole = roleMap[rawRole] || "estudiante"; // Valor por defecto

      const normalizedUser = {
        ...response.data.user,
        rol: mappedRole,
      };

      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("userRole", mappedRole);
      localStorage.setItem("userData", JSON.stringify(normalizedUser));

      console.log("✅ Login exitoso, rol mapeado:", mappedRole);

      return {
        ...response.data,
        user: normalizedUser,
      };
    } catch (error) {
      console.error("❌ Error en login:", error);
      console.error("❌ Respuesta de error:", error.response?.data);
      
      // 🔥 MANEJO ESPECÍFICO DE ERRORES DE LOGIN
      if (error.response?.data?.error) {
        // El backend envió un mensaje de error específico
        const backendError = new Error(error.response.data.error);
        backendError.response = error.response;
        throw backendError;
      } else {
        // Error genérico o de red
        throw errorHandler(error);
      }
    }
  },

  logout: () => {
    console.log("👋 Cerrando sesión");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  },

  getUserRole: () => {
    return localStorage.getItem("userRole");
  },

  activarCuenta: async (token) => {
    try {
      console.log("🔓 Activando cuenta con token:", token);
      const response = await api.get(`/auth/activar/${token}`);
      console.log("✅ Cuenta activada:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error al activar cuenta:", error);
      throw errorHandler(error);
    }
  },

  // 🔥 NUEVA FUNCIÓN PARA VERIFICAR ESTADO DE CUENTA
  checkAccountStatus: async (email) => {
    try {
      const response = await api.post("/auth/check-status", { email });
      return response.data;
    } catch (error) {
      console.error("Error al verificar estado de cuenta:", error);
      return { active: false, exists: false };
    }
  },

  // 🔥 NUEVA FUNCIÓN PARA REENVIAR EMAIL DE ACTIVACIÓN
  resendActivationEmail: async (email) => {
    try {
      const response = await api.post("/auth/resend-activation", { email });
      return response.data;
    } catch (error) {
      console.error("Error al reenviar email:", error);
      throw errorHandler(error);
    }
  }
};

export default authService;
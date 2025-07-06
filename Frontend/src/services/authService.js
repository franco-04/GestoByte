// src/services/authService.js
import api from '../api/api';
import errorHandler from '../utils/errorHandler';

// 🔁 Mapeo de roles de BD a roles de frontend
const roleMap = {
  estudiante: 'estudiante',
  coordinador: 'administrador',
  administrador: 'superadministrador'
};

const authService = {
  register: async (userData) => {
    try {
      const formattedData = {
        email: userData.email,
        password: userData.password,
        nombre: userData.firstName,
        apellido: userData.lastName,
        carrera: userData.career
      };

      const response = await api.post('/auth/register', formattedData);
      return response.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);

      const rawRole = response.data.user.rol.toLowerCase();
      const mappedRole = roleMap[rawRole] || 'estudiante'; // Valor por defecto

      const normalizedUser = {
        ...response.data.user,
        rol: mappedRole
      };

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', mappedRole);
      localStorage.setItem('userData', JSON.stringify(normalizedUser));

      return {
        ...response.data,
        user: normalizedUser
      };
    } catch (error) {
      throw errorHandler(error);
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  getUserRole: () => {
    return localStorage.getItem('userRole');
  },
};

export default authService;

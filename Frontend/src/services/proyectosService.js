// src/services/proyectosService.js
import api from "../api/api";
import errorHandler from "../utils/errorHandler";

const proyectosService = {
  getMisPortafolios: async () => {
    try {
      const res = await api.get("/auth/mis-portafolios");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  getProgramasByPortafolio: async (id) => {
    try {
      const res = await api.get(`/auth/portafolios/${id}/programas`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  createPrograma: async (id, data) => {
    try {
      const res = await api.post(`/auth/portafolios/${id}/programas`, data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  getProyectosByPrograma: async (id) => {
    try {
      const res = await api.get(`/auth/programas/${id}/proyectos`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  getEstudiantesByPrograma: async (id) => {
    try {
      const res = await api.get(`/auth/programas/${id}/estudiantes`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  crearProyecto: async (id, data) => {
    try {
      const res = await api.post(`/auth/programas/${id}/proyectos`, data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

    getEstudiantesByCarrera: async (carrera) => {
    try {
      const res = await api.get(`/auth/estudiantes/carrera/${encodeURIComponent(carrera)}`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
};

export default proyectosService;

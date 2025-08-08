import api from "../api/api";
import errorHandler from "../utils/errorHandler";

const proyectosService = {
  // 1. Crear portafolio
  createPortfolio: async (data) => {
    try {
      const res = await api.post("/auth/portafolios", data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 2. Obtener profesores
  getProfesores: async () => {
    try {
      const res = await api.get("/auth/profesores");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 3. Obtener portafolios del coordinador
  getMisPortafolios: async () => {
    try {
      const res = await api.get("/auth/mis-portafolios");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 4. Eliminar portafolio
  eliminarPortafolio: async (id) => {
    try {
      const res = await api.put(`/auth/${id}/eliminar-portafolio`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 5. Editar portafolio
  editarPortafolio: async (id, data) => {
    try {
      const res = await api.put(`/auth/${id}`, data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 6. Obtener estudiantes de un portafolio
  getEstudiantesPortafolio: async (id) => {
    try {
      const res = await api.get(`/auth/portafolios/${id}/estudiantes`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 7. Obtener programas por portafolio
  getProgramasByPortafolio: async (id) => {
    try {
      const res = await api.get(`/auth/portafolios/${id}/programas`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 8. Obtener asesores por portafolio
  getAsesoresPortafolio: async (id) => {
    try {
      const res = await api.get(`/auth/portafolios/${id}/asesores`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 9. Crear programa en portafolio
  createPrograma: async (id, data) => {
    try {
      const res = await api.post(`/auth/portafolios/${id}/programas`, data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 10. Obtener proyectos por programa
  getProyectosByPrograma: async (id) => {
    try {
      const res = await api.get(`/auth/programas/${id}/proyectos`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 11. Obtener estudiantes por programa
  getEstudiantesByPrograma: async (id) => {
    try {
      const res = await api.get(`/auth/programas/${id}/estudiantes`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 12. Crear proyecto en programa
  crearProyecto: async (id, data) => {
    try {
      const res = await api.post(`/auth/programas/${id}/proyectos`, data);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 13. Obtener estudiantes por proyecto
  getEstudiantesProyecto: async (idPrograma, idProyecto) => {
    try {
      const res = await api.get(
        `/auth/programas/${idPrograma}/proyectos/${idProyecto}/estudiantes`
      );
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // 14. Obtener estudiantes por carrera
  getEstudiantesByCarrera: async (carrera) => {
    try {
      const res = await api.get(
        `/auth/estudiantes/carrera/${encodeURIComponent(carrera)}`
      );
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
  // 15. Obtener reuniones del coordinador
  getReunionesCoordinador: async () => {
    try {
      const res = await api.get("/auth/reuniones/coordinador");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
  // 16. Obtener portafolios asignados a los profes
  getPortafoliosAsignados: async () => {
    try {
      const res = await api.get("/auth/portafolios/asignados");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
  // Obtener proyectos con estadísticas de evidencias
  getProyectosConEvidencias: async () => {
    try {
      const res = await api.get("/reportes/proyectos-evidencias");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // Obtener estadísticas generales
  getEstadisticasGenerales: async () => {
    try {
      const res = await api.get("/reportes/estadisticas-generales");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  getEvidenciasByProyecto: async (idProyecto) => {
    try {
      const res = await api.get(`/auth/proyectos/${idProyecto}/evidencias`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },

  // Obtener estudiantes por carrera (todos)
  getEstudiantesPorCarrera: async () => {
    try {
      const res = await api.get("/reportes/estudiantes");
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
  getEstudiantesPortafolioANDPROYECTS: async (id) => {
    try {
      const res = await api.get(`/auth/portafolios/${id}/estudiantes`);
      return res.data;
    } catch (error) {
      throw errorHandler(error);
    }
  },
};

export default proyectosService;

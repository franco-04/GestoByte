import axiosInstance from './axiosConfig';

const setupInterceptors = (store) => {
  // Interceptor de solicitudes
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de respuestas
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // Manejar token expirado o no válido
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            break;
          case 403:
            // Acceso prohibido
            console.error('Acceso denegado:', error);
            break;
          default:
            console.error('Error de servidor:', error);
        }
      } else if (error.request) {
        console.error('Sin respuesta del servidor:', error);
      } else {
        console.error('Error en la solicitud:', error);
      }
      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;
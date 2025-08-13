const errorHandler = (error) => {
  if (error.response) {
    // Respuesta del servidor con código de estado fuera de 2xx
    const { status, data } = error.response;
    
    const customError = new Error(data.message || 'Error del servidor');
    customError.status = status;
    customError.details = data.errors || null;
    
    return customError;
  } else if (error.request) {
    // La solicitud fue hecha pero no se recibió respuesta
    const networkError = new Error('Error de red: No se pudo conectar al servidor');
    networkError.status = 0;
    return networkError;
  } else {
    // Error al configurar la solicitud
    const configError = new Error('Error de configuración: ' + error.message);
    configError.status = 500;
    return configError;
  }
};

export default errorHandler;
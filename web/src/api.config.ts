const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
    veterinarias: {
        registro: `${API_BASE_URL}/api/web/veterinarias/registro`,
        
    },
    pacientes: {
       
    },
    profesionales: {
       
    }
    // Otros módulos de API
};

export default API_BASE_URL;
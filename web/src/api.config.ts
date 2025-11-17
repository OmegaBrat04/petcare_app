// src/api.config.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
    veterinarias: {
        registro: `${API_BASE_URL}/api/web/veterinarias/registro`,
    },
    auth: { // Nuevo módulo de autenticación
        login: `${API_BASE_URL}/api/web/auth/login`,
        register: `${API_BASE_URL}/api/web/auth/register`, // <--- AGREGADO
    },
    pacientes: {

    },
    profesionales: {

    }

};

export default API_BASE_URL;
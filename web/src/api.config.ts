// Usamos tu IP y Puerto (3001)
const API_BASE_URL = "http://127.0.0.1:3001/api";

export const API_ENDPOINTS = {
  // --- TUS ENDPOINTS DE VETERINARIAS ---
  veterinarias: {
    registro: `${API_BASE_URL}/veterinarias/registro`,
    listarPendientes: `${API_BASE_URL}/veterinarias/pendientes`,
    obtenerDetalle: (id: number) => `${API_BASE_URL}/veterinarias/detalle/${id}`,
    actualizarEstado: (id: number) => `${API_BASE_URL}/veterinarias/estado/${id}`,
    obtenerUltima: `${API_BASE_URL}/veterinarias/ultima`,
    listarPropias: (id: string) => `${API_BASE_URL}/veterinarias/propias/${id}`,
  },

  // --- ENDPOINTS DE AUTH ---
  auth: { 
    login: `${API_BASE_URL}/web/auth/login`,
    register: `${API_BASE_URL}/web/auth/register`,
  },

  // ... dentro de API_ENDPOINTS
  citas: {
    obtenerPorVeterinaria: (id: number) => `${API_BASE_URL}/citas/${id}`, // La vieja (opcional)
    obtenerPorPropietario: (id: string) => `${API_BASE_URL}/citas-propietario/${id}`, // <--- LA NUEVA
    actualizarEstado: (id: string) => `${API_BASE_URL}/citas/estado/${id}`,
    eliminar: (id: string) => `${API_BASE_URL}/citas/${id}`,
  },
  // ...
  // ... dentro de API_ENDPOINTS
  dashboard: {
    obtenerStats: (id: string) => `${API_BASE_URL}/dashboard/stats/${id}`,
  },
// ...
  // Placeholders
  pacientes: {},
  profesionales: {}
};

export default API_BASE_URL;
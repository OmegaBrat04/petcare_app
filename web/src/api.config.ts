// CAMBIO: Ahora usamos el puerto 3000 (servidor unificado)
const API_BASE_URL = "http://127.0.0.1:3000/api"; // ⚠️ CAMBIO DE 3001 A 3000

export const API_ENDPOINTS = {
  // --- ENDPOINTS DE VETERINARIAS ---
  veterinarias: {
    registro: `${API_BASE_URL}/web/veterinarias/registro`, // ⚠️ Cambia la ruta base
    listarPendientes: `${API_BASE_URL}/veterinarias/pendientes`,
    obtenerDetalle: (id: number) => `${API_BASE_URL}/veterinarias/detalle/${id}`,
    actualizarEstado: (id: number) => `${API_BASE_URL}/veterinarias/estado/${id}`,
    obtenerUltima: `${API_BASE_URL}/veterinarias/ultima`,
    listarPropias: (id: string) => `${API_BASE_URL}/veterinarias/propias/${id}`,
    actualizarRegistro: (id: number) => `${API_BASE_URL}/veterinarias/registro/${id}`, // ⚠️ FALTABA ESTE
  },

  // --- ENDPOINTS DE AUTH ---
  auth: { 
    login: `${API_BASE_URL}/web/auth/login`,
    register: `${API_BASE_URL}/web/auth/register`,
  },

  // --- ENDPOINTS DE CITAS ---
  citas: {
    obtenerPorVeterinaria: (id: number) => `${API_BASE_URL}/citas/${id}`,
    obtenerPorPropietario: (id: string) => `${API_BASE_URL}/citas/propietario/${id}`, // ⚠️ Cambia "citas-propietario" a "citas/propietario"
    actualizarEstado: (id: string) => `${API_BASE_URL}/citas/estado/${id}`,
    eliminar: (id: string) => `${API_BASE_URL}/citas/${id}`,
  },

  // --- ENDPOINTS DE DASHBOARD ---
  dashboard: {
    obtenerStats: (id: string) => `${API_BASE_URL}/dashboard/stats/${id}`,
  },

  // Placeholders
  pacientes: {},
  profesionales: {}
};

export default API_BASE_URL;
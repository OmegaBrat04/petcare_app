// Usamos tu IP y Puerto (3001) que ya sabemos que funcionan
const API_BASE_URL = "http://127.0.0.1:3001/api";

export const API_ENDPOINTS = {
  // --- TUS ENDPOINTS DE VETERINARIAS ---
  // (Coinciden con app.post('/api/veterinarias/...') en tu server)
  veterinarias: {
    registro: `${API_BASE_URL}/veterinarias/registro`,
    listarPendientes: `${API_BASE_URL}/veterinarias/pendientes`,
    obtenerDetalle: (id: number) => `${API_BASE_URL}/veterinarias/detalle/${id}`,
    actualizarEstado: (id: number) => `${API_BASE_URL}/veterinarias/estado/${id}`,
    obtenerUltima: `${API_BASE_URL}/veterinarias/ultima`,
    listarPropias: (id: string) => `${API_BASE_URL}/veterinarias/propias/${id}`,
  },

  // --- ENDPOINTS DE TU COMPAÑERO (Auth) ---
  // (Coinciden con app.post('/api/web/auth/...') en tu server)
  auth: { 
    login: `${API_BASE_URL}/web/auth/login`,
    register: `${API_BASE_URL}/web/auth/register`,
  },

  // --- ENDPOINT DE CITAS (Nuevo) ---
  citas: {
    getAll: `${API_BASE_URL}/citas`,
  },

  // Placeholders
  pacientes: {},
  profesionales: {}
};

export default API_BASE_URL;
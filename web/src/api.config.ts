const API_BASE_URL = "http://127.0.0.1:3001/api";

export const API_ENDPOINTS = {
  veterinarias: {
    registro: `${API_BASE_URL}/veterinarias/registro`,
    listarPendientes: `${API_BASE_URL}/veterinarias/pendientes`,
    obtenerDetalle: (id: number) => `${API_BASE_URL}/veterinarias/detalle/${id}`,
    actualizarEstado: (id: number) => `${API_BASE_URL}/veterinarias/estado/${id}`,
    obtenerUltima: `${API_BASE_URL}/veterinarias/ultima`,
    listarPropias: `${API_BASE_URL}/veterinarias/propias`, // <--- NUEVA
  },
};
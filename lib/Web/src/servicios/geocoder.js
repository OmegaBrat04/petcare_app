const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const NodeGeocoder = require('node-geocoder');

const provider = process.env.GEOCODER_PROVIDER || 'locationiq';
const apiKey = process.env.GEOCODER_API_KEY || '';
const userAgent = process.env.GEOCODER_USER_AGENT || 'PetCareManagerApp/1.0';

// Fallback seguro si no hay apiKey: usa openstreetmap para no romper el server
const effectiveProvider = apiKey ? provider : 'openstreetmap';

if (!apiKey && provider !== 'openstreetmap') {
  console.warn('GEOCODER_API_KEY no encontrado. Usando openstreetmap como fallback.');
}

// Si quieres forzar la key temporalmente, descomenta la siguiente línea:
// const apiKeyForced = 'pk.TU_API_KEY_AQUI';

const geocoder = NodeGeocoder({
  provider: effectiveProvider,
  apiKey: /* apiKeyForced || */ apiKey || undefined,
  httpAdapter: 'https',
  formatter: null,
  timeout: 8000,
  userAgent
});

module.exports = geocoder;
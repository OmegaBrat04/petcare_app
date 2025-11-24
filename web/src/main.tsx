import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 👇👇 ESTILOS GLOBALES (TAILWIND) 👇👇
import './index.css' 

// --- TUS COMPONENTES (Manteniendo tu estructura) ---
import Inicio from './Inicio'
import RegistroVeterinariaConexion from './RegistroVeterinariaConexion'
import InicioAdmin from './InicioAdmin' 
import DetalleSolicitud from './DetalleSolicitud'

// --- COMPONENTES DE TU COMPAÑERO (Nueva funcionalidad) ---
import Login from './Login';
import RegistroUsuario from './RegistroUsuario'; 

// --- NUEVO: IMPORTAR PANTALLA DE CITAS ---
// ⚠️ IMPORTANTE: Verifica si guardaste Citas.tsx en una carpeta "components" o en la raíz.
// Si está en src/components/Citas.tsx usa esta línea:
import Citas from './Citas'; 
import EditarVet from './EditarVet'; // Importar el componente
import Agenda from './Agenda'; // Importar el componente
import Historial from './Historial'; // Importar
import SolicitudesCitasUI from './SolicitudesCitas'
// Si está en la misma carpeta que este archivo, usa: import Citas from './Citas';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. LOGIN */}
        <Route path="/" element={<Login/>} />

        {/* Ruta de Registro de Usuario */}
        <Route path="/register" element={<RegistroUsuario />} />

        {/* 2. INICIO / DASHBOARD */}
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/dashboard" element={<Inicio />} />

        {/* Ruta de Registro de Veterinaria */}
        <Route path="/registro-veterinaria" element={<RegistroVeterinariaConexion />} />

        {/* 3. RUTAS DE ADMIN */}
        <Route path="/admin" element={<InicioAdmin />} />

        <Route path="/admin/solicitud/:id" element={<DetalleSolicitud />} />
        

        {/* 4. RUTA DE CITAS (NUEVA) */}
        <Route path="/citas" element={<Citas />} />
        <Route path="/editar-veterinaria/:id" element={<EditarVet />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/historial" element={<Historial />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
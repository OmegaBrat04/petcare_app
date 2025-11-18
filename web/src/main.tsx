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
import PacientesUI from './Pacientes'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. CAMBIO PRINCIPAL: 
            La ruta raíz "/" ahora carga el Login.
            Esto es necesario para que la funcionalidad de autenticación sirva.
        */}
        <Route path="/" element={<Login/>} />

        {/* Ruta de Registro de Usuario (Nueva funcionalidad) */}
        <Route path="/register" element={<RegistroUsuario />} />

        {/* 2. TUS RUTAS DE SIEMPRE:
            Mantenemos /inicio para que puedas acceder a tu dashboard.
            Agregamos /dashboard también porque tu compañero lo usará así.
        */}
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/dashboard" element={<Inicio />} />

        {/* Ruta de Registro de Veterinaria (Compartida) */}
        <Route path="/registro-veterinaria" element={<RegistroVeterinariaConexion />} />

        {/* 3. RUTAS DE ADMIN (Tuyas Exclusivas):
            Estas no las tenía tu compañero, pero son vitales para tu parte.
        */}
        <Route path="/admin" element={<InicioAdmin />} />
        <Route path="/admin/solicitud/:id" element={<DetalleSolicitud />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
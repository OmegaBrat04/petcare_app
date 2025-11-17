// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import Inicio from './Inicio'
import RegistroVeterinariaConexion from './RegistroVeterinariaConexion'
import Login from './Login';
import RegistroUsuario from './RegistroUsuario'; // <--- IMPORTAR NUEVO COMPONENTE

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Login */}
        <Route path="/" element={<Login />} />

        {/* RUTA DE REGISTRO */}
        <Route path="/register" element={<RegistroUsuario />} />

        {/* Mueve tu dashboard a una ruta protegida, por ejemplo /dashboard */}
        <Route path="/dashboard" element={<Inicio />} />

        {/* Ruta para el registro de veterinaria */}
        <Route path="/registro-veterinaria" element={<RegistroVeterinariaConexion />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
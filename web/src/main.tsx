import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 👇👇 ¡ESTA ES LA LÍNEA QUE FALTA! AGREGALA AQUÍ 👇👇
import './index.css' 
// 👆👆 Sin esto, Tailwind no carga 👆👆

import Inicio from './Inicio'
import RegistroVeterinariaConexion from './RegistroVeterinariaConexion'
import InicioAdmin from './InicioAdmin' 
import DetalleSolicitud from './DetalleSolicitud'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio/>} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/registro-veterinaria" element={<RegistroVeterinariaConexion />} />
        <Route path="/admin" element={<InicioAdmin />} />
        <Route path="/admin/solicitud/:id" element={<DetalleSolicitud />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
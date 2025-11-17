import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom' // Importamos el enrutador
import './index.css' // Tus estilos globales (si los tienes)

// Importamos tus componentes
import Inicio from './Inicio'
import RegistroVeterinariaConexion from './RegistroVeterinariaConexion'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Cuando la ruta es "/" (la principal), mostramos Inicio */}
        <Route path="/" element={<Inicio />} />
        
        {/* Cuando la ruta es "/registro-veterinaria", mostramos tu otro archivo */}
        <Route path="/registro-veterinaria" element={<RegistroVeterinariaConexion />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
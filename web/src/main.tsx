import React from "react";
import ReactDOM from "react-dom/client";
import App from "./SolicitudesCitas.js"; // Dejamos el componente aquí
import "./index.css"; // <<-- ¡CAMBIA ESTO! Usamos el CSS principal de Tailwind.

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
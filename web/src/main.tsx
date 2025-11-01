import React from "react";
import ReactDOM from "react-dom/client";
import App from "./ProfecionalesUI"; // Aqui ponen la vista que quieren cargar
import "./profecionales.css"; // Y aqui va el CSS correspondiente
import "./index.css"; // 👈 AÑADE ESTA LÍNEA (o el nombre de tu CSS principal) (ESTE NO LO CAMBIEN)

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
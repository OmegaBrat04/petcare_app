import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Importar useNavigate
import "./InicioAdmin.css";
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from "./api.config";

// 🚨 INTERFAZ CORREGIDA: Usamos minúsculas para que coincida con el JSON del backend
interface Solicitud {
  id: number; // Antes: ID
  nombre_comercial: string; // Antes: NombreComercial
  Responsable: string; // Este SÍ es mayúscula porque lo creamos con 'AS' en el SQL
  ciudad: string; // Antes: Ciudad
  FechaSolicitud: string; // Este SÍ es mayúscula (del 'AS')
  estado_verificacion: string;
}

const InicioAdmin: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const navigate = useNavigate(); // Hook para navegar

  useEffect(() => {
    fetch(API_ENDPOINTS.veterinarias.listarPendientes)
      .then((res) => res.json())
      .then((data: Solicitud[]) => setSolicitudes(data)) // Tipamos la data
      .catch((err) => console.error("Error cargando pendientes:", err));
  }, []);

  return (
    <div className="admin-container">
      <header className="navbar-admin">
        <div className="navbar-left">
          <img
            src={PETCARE_ICON_URL}
            alt="Logo"
            className="navbar-logo-icon"
            style={{ height: "32px", width: "auto" }}
          />
          <div className="brand-text">
            <span className="brand-main">PetCare</span>
            <span className="brand-sub">Manager</span>
          </div>
          <span className="admin-badge">Administrador</span>
        </div>
        <div className="navbar-right">
          <span className="admin-user">Hola, Admin</span>
          <Link to="/" className="logout-button">
            Cerrar Sesión
          </Link>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-header-section">
          <h2>Panel de Verificación</h2>
          <p>Gestiona las solicitudes de registro de nuevas veterinarias.</p>
        </div>

        <div className="card admin-card">
          <h3>Solicitudes Pendientes ({solicitudes.length})</h3>

          {solicitudes.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Veterinaria</th>
                    <th>Responsable</th>
                    <th>Ciudad</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((sol) => (
                    <tr key={sol.id}>
                      <td>#{sol.id}</td>
                      <td className="font-bold">{sol.nombre_comercial}</td>
                      <td>{sol.Responsable}</td>
                      <td>{sol.ciudad}</td>
                      <td>{sol.FechaSolicitud}</td>
                      <td>
                        <span className="status-badge pending">
                          {sol.estado_verificacion}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-revisar"
                          onClick={() => navigate(`/admin/solicitud/${sol.id}`)}
                        >
                          Revisar Datos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InicioAdmin;

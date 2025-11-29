// Cambios marcados con 🟢 CORREGIDO
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './InicioAdmin.css';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from "./api.config";

interface Solicitud {
    id: number; // 🟢 CORREGIDO: de ID a id
    nombre_comercial: string; // 🟢 CORREGIDO: Asumiendo el naming del backend SQL
    Responsable: string;
    Ciudad: string;
    FechaSolicitud: string;
}

const InicioAdmin: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(API_ENDPOINTS.veterinarias.listarPendientes)
            .then(res => res.json())
            .then(data => setSolicitudes(data))
            .catch(err => console.error("Error:", err));
    }, []);

    return (
        <div className="admin-container">
            {/* ... Código del Header sin cambios ... */}
            <header className="navbar-admin">
                <div className="navbar-left">
                    <img src={PETCARE_ICON_URL} alt="Logo" className="navbar-logo-icon" style={{ height: '32px', width: 'auto' }} />
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                    <span className="admin-badge">Administrador</span>
                </div>
                <div className="navbar-right">
                    <span className="admin-user">Hola, Admin</span>
                    <Link to="/" className="logout-button">Cerrar Sesión</Link>
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
                        <div className="empty-state"><p>🎉 No hay solicitudes pendientes.</p></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="requests-table">
                                <thead>
                                    <tr><th>ID</th><th>Veterinaria</th><th>Responsable</th><th>Ciudad</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    {solicitudes.map((sol) => (
                                        <tr key={sol.id}>
                                            <td>#{sol.id}</td>
                                            <td className="font-bold">{sol.nombre_comercial}</td>
                                            <td>{sol.Responsable}</td>
                                            <td>{sol.Ciudad}</td>
                                            <td>{sol.FechaSolicitud}</td>
                                            <td><span className="status-badge pending">Pendiente</span></td>
                                            <td>
                                                {/* BOTÓN QUE LLEVA AL DETALLE */}
                                                <button
                                                    className="btn-revisar"
                                                    onClick={() => navigate(`/admin/solicitud/${sol.id}`)} // 🟢 CORREGIDO: sol.ID -> sol.id
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
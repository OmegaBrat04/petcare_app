import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Importamos useNavigate
import './Citas.css'; 
import { API_ENDPOINTS } from './api.config';

interface Cita {
    id: string;
    mascota: string;
    servicio: string;
    fechaPreferida: string;
    estado: 'Pendiente' | 'Confirmada' | 'Rechazada';
    solicitada: string;
    detalles: {
        telefono: string;
        motivo: string;
    };
}

const Citas: React.FC = () => {
    const [citas, setCitas] = useState<Cita[]>([]);
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos los estados');
    const [busqueda, setBusqueda] = useState<string>('');

    const navigate = useNavigate(); // <--- 2. Inicializamos el hook
    
    // 🔴 RECUERDA: Este ID sigue siendo temporal hasta que conectes el login real
    const VETERINARIA_ID_ACTUAL = 1; 

    useEffect(() => {
        const fetchCitas = async () => {
            try {
                const url = API_ENDPOINTS.citas.obtenerPorVeterinaria(VETERINARIA_ID_ACTUAL);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Error al cargar citas');
                const data = await response.json();
                setCitas(data);
            } catch (error) {
                console.error("Error:", error);
            }
        };
        fetchCitas();
    }, []); 

    const handleCitaClick = (cita: Cita) => {
        setCitaSeleccionada(cita);
    };

    const cambiarEstadoCita = async (nuevoEstado: 'Confirmada' | 'Rechazada') => {
        if (!citaSeleccionada) return;
        try {
            const url = API_ENDPOINTS.citas.actualizarEstado(citaSeleccionada.id);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (!response.ok) throw new Error('Error al actualizar');

            const updatedCitas = citas.map(c => 
                c.id === citaSeleccionada.id ? { ...c, estado: nuevoEstado } : c
            );
            setCitas(updatedCitas);
            setCitaSeleccionada({ ...citaSeleccionada, estado: nuevoEstado });
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            alert("No se pudo actualizar la cita");
        }
    };

    const handleContactar = () => {
        if (citaSeleccionada) {
            window.open(`https://wa.me/${citaSeleccionada.detalles.telefono.replace(/\D/g,'')}`, '_blank');
        }
    };

    const citasFiltradas = citas.filter(cita => {
        const coincideEstado = filtroEstado === 'Todos los estados' || cita.estado === filtroEstado;
        const coincideBusqueda = cita.mascota.toLowerCase().includes(busqueda.toLowerCase()) ||
                                 cita.servicio.toLowerCase().includes(busqueda.toLowerCase());
        return coincideEstado && coincideBusqueda;
    });

    return (
        <div className="citas-container">
            <div className="citas-header">
                {/* --- 3. BLOQUE DEL BOTÓN DE REGRESO Y TÍTULO --- */}
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/inicio')} title="Volver al inicio">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <h2>Solicitudes de Cita</h2>
                </div>
                
                <div className="filtro-estado">
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="Todos los estados">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Rechazada">Rechazada</option>
                    </select>
                </div>
            </div>

            {/* ... El resto del contenido sigue igual ... */}
            <div className="citas-content">
                <div className="citas-list">
                    <input
                        type="text"
                        placeholder="Buscar por mascota..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="search-input"
                    />
                    <table>
                        <thead>
                            <tr>
                                <th>Mascota</th>
                                <th>Servicio</th>
                                <th>Fecha Preferida</th>
                                <th>Estado</th>
                                <th>Solicitada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citasFiltradas.map((cita) => (
                                <tr
                                    key={cita.id}
                                    onClick={() => handleCitaClick(cita)}
                                    className={citaSeleccionada?.id === cita.id ? 'selected-row' : ''}
                                >
                                    <td>{cita.mascota}</td>
                                    <td>{cita.servicio}</td>
                                    <td>{cita.fechaPreferida}</td>
                                    <td>
                                        <span className={`estado-badge ${cita.estado.toLowerCase()}`}>
                                            {cita.estado}
                                        </span>
                                    </td>
                                    <td>{cita.solicitada}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="cita-details">
                    {citaSeleccionada ? (
                        <>
                            <div className="details-header">
                                <h3>{citaSeleccionada.mascota}</h3>
                                <span className={`estado-badge ${citaSeleccionada.estado.toLowerCase()}`}>{citaSeleccionada.estado}</span>
                            </div>
                            <p className="sub-header">{citaSeleccionada.servicio}</p>

                            <div className="details-actions">
                                <button
                                    className="confirm-button"
                                    onClick={() => cambiarEstadoCita('Confirmada')}
                                    disabled={citaSeleccionada.estado === 'Confirmada'}
                                >
                                    Confirmar Cita
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => cambiarEstadoCita('Rechazada')}
                                    disabled={citaSeleccionada.estado === 'Rechazada'}
                                >
                                    Rechazar
                                </button>
                                <button className="contact-button" onClick={handleContactar}>Contactar</button>
                            </div>

                            <div className="details-info">
                                <div className="info-row">
                                    <p><strong>Fecha Preferida</strong></p>
                                    <p>{citaSeleccionada.fechaPreferida}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Teléfono</strong></p>
                                    <p>{citaSeleccionada.detalles.telefono}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Solicitada el</strong></p>
                                    <p>{citaSeleccionada.solicitada}</p>
                                </div>
                            </div>

                            <div className="details-motivo">
                                <p>Motivo de la consulta:</p>
                                <p>{citaSeleccionada.detalles.motivo}</p>
                            </div>
                        </>
                    ) : (
                        <p className="no-cita-selected">Selecciona una cita para ver los detalles.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Citas;
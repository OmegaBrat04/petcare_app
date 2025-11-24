import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_LOGO_URL from "./assets/PetCare Manager.png";

// Estilos en línea originales (se mantienen igual)
const styles = {
    container: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e0e0e0' },
    sectionTitle: { color: '#002D62', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '0', fontSize: '16px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    field: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold' as 'bold', marginBottom: '4px', textTransform: 'uppercase' as 'uppercase' },
    value: { fontSize: '15px', color: '#333' },
    tag: { display: 'inline-block', background: '#e3f2fd', color: '#007bff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', marginRight: '8px', marginBottom: '8px', border: '1px solid #b3d7ff' },
    btnBack: { textDecoration: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', fontWeight: 'bold' },
    logoImage: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' as 'cover', border: '2px solid #eee', backgroundColor: 'white' },
    logoPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: '#999' }
};

const DetalleSolicitud: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);

    // --- NUEVOS ESTADOS PARA EL MODAL ---
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 🚨 CORRECCIÓN: Validar que 'id' no sea "undefined" ni NaN
        if (!id || isNaN(Number(id))) {
            console.error("ID inválido:", id);
            return; // No hacer fetch si el ID no es un número válido
        }

        const fetchData = async () => {
            try {
                const url = API_ENDPOINTS.veterinarias.obtenerDetalle(Number(id));
                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
                }

                const jsonData = await res.json();
                setData(jsonData);

            } catch (error) {
                console.error("Error cargando detalle:", error);
                alert("Error al cargar los datos. Revisa la consola.");
            }
        };

        fetchData();
    }, [id]);

    // --- LÓGICA CENTRALIZADA PARA ENVIAR A LA API ---
    const enviarActualizacion = async (nuevoEstado: 'Aprobada' | 'Rechazada', motivo: string = "") => {
        setIsSubmitting(true);
        try {
            const response = await fetch(API_ENDPOINTS.veterinarias.actualizarEstado(Number(id)), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nuevoEstado,
                    motivo // Se envía el motivo (estará vacío si es Aprobada)
                })
            });

            if (response.ok) {
                alert(`Solicitud ${nuevoEstado} correctamente.`);
                navigate('/admin');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.mensaje || 'No se pudo actualizar el estado.'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor.');
        } finally {
            setIsSubmitting(false);
            setIsRejectModalOpen(false); // Cerrar modal si estaba abierto
        }
    };

    // Handler para el botón "Aprobar"
    const handleAprobar = () => {
        if (confirm(`¿Estás seguro de APROBAR esta solicitud?`)) {
            enviarActualizacion('Aprobada');
        }
    };

    // Handler para el botón "Confirmar Rechazo" (dentro del modal)
    const handleConfirmarRechazo = () => {
        if (!rejectReason.trim()) return;
        enviarActualizacion('Rechazada', rejectReason);
    };

    if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;

    // --- RENDERIZADO (TRADUCIDO A MINÚSCULAS) ---
    // 🚨 CORRECCIÓN: Cambiamos todas las 'Mayusculas' por 'minusculas_con_guion_bajo'
    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', position: 'relative' }}>
            {/* Navbar */}
            <div style={{ background: 'white', padding: '12px 30px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={PETCARE_LOGO_URL} alt="Logo" style={{ height: '32px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                    <span style={{ fontWeight: '900', color: '#002D62', fontSize: '18px' }}>PetCare</span>
                    <span style={{ fontWeight: 'bold', color: '#33CCFF', fontSize: '15px' }}>Manager</span>
                </div>
                <span style={{ background: '#e3f2fd', color: '#007bff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', marginLeft: '10px', border: '1px solid #bbdefb', fontWeight: 'bold' }}>ADMIN</span>
            </div>

            <div style={styles.container}>
                <Link to="/admin" style={styles.btnBack}>← Volver al listado</Link>

                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        {data.logo ? (
                            <img src={data.logo} alt="Logo Vet" style={styles.logoImage} />
                        ) : (
                            <div style={styles.logoPlaceholder}>🏥</div>
                        )}
                        <div>
                            <h1 style={{ margin: 0, color: '#333' }}>{data.NombreComercial}</h1>
                            <p style={{ margin: '5px 0 0', color: '#666' }}>
                                Solicitud #{data.ID} • {data.Ciudad} •
                                <strong style={{ color: '#f0ad4e', marginLeft: '5px' }}>
                                    {data.EstadoVerificacion}
                                </strong>
                            </p>
                        </div>
                    </div>

                    {data.EstadoVerificacion === 'Pendiente' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* BOTÓN RECHAZAR: Ahora abre el modal */}
                            <button
                                onClick={() => setIsRejectModalOpen(true)}
                                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #dc3545', background: 'white', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Rechazar
                            </button>
                            {/* BOTÓN APROBAR: Ejecuta lógica directa */}
                            <button
                                onClick={handleAprobar}
                                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#28a745', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Aprobar Registro
                            </button>
                        </div>
                    )}
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>👤 Responsable</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Nombre Completo</span><div style={styles.value}>{data.nombre_responsable} {data.apellidos_responsable}</div></div>
                        <div style={styles.field}><span style={styles.label}>Puesto</span><div style={styles.value}>{data.puesto}</div></div>
                        <div style={styles.field}><span style={styles.label}>Email</span><div style={styles.value}>{data.email_responsable}</div></div>
                        <div style={styles.field}><span style={styles.label}>Teléfono</span><div style={styles.value}>{data.telefono_responsable}</div></div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>🏥 Datos de la Veterinaria</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Razón Social</span><div style={styles.value}>{data.razon_social || 'N/A'}</div></div>
                        <div style={styles.field}><span style={styles.label}>RFC</span><div style={styles.value}>{data.rfc || 'N/A'}</div></div>
                        <div style={styles.field}><span style={styles.label}>Categorías</span><div style={styles.value}>{data.categorias}</div></div>
                        <div style={styles.field}><span style={styles.label}>Descripción</span><div style={styles.value}>{data.descripcion}</div></div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>📍 Ubicación y Contacto</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Dirección</span><div style={styles.value}>{data.calle} #{data.numero_exterior}, {data.colonia}</div></div>
                        <div style={styles.field}><span style={styles.label}>Ubicación</span><div style={styles.value}>{data.ciudad}, {data.estado} (CP: {data.codigo_postal})</div></div>
                        <div style={styles.field}><span style={styles.label}>Teléfono Clínica</span><div style={styles.value}>{data.telefono_clinica}</div></div>
                        <div style={styles.field}><span style={styles.label}>Email Clínica</span><div style={styles.value}>{data.email_clinica}</div></div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>🛠️ Servicios</h3>
                        <div>
                            {data.servicios?.length > 0 ? data.servicios.map((s: any) => (
                                <span key={s.id} style={styles.tag}>{s.nombre} (${s.precio})</span>
                            )) : <span style={{ color: '#999', fontStyle: 'italic' }}>Sin servicios</span>}
                        </div>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>🕒 Horarios</h3>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {data.horarios?.length > 0 ? data.horarios.map((h: any) => (
                                <li key={h.id} style={{ fontSize: '14px', marginBottom: '5px', color: '#555' }}>
                                    <strong>{h.dia}:</strong> {h.apertura} - {h.cierre}
                                </li>
                            )) : <span style={{ color: '#999', fontStyle: 'italic' }}>Sin horarios</span>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- MODAL EMERGENTE DE RECHAZO --- */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">

                        {/* Header Modal */}
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Rechazar Solicitud</h3>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Por favor, indica el motivo del rechazo. Esta información es importante para el solicitante.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo del rechazo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                placeholder="Ej: La documentación del RFC no es legible, favor registrar la veterinaria nuevamente..."
                                className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition shadow-sm"
                            />
                        </div>

                        {/* Footer Modal */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setRejectReason("");
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarRechazo}
                                disabled={!rejectReason.trim() || isSubmitting}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors
                                    ${(!rejectReason.trim() || isSubmitting)
                                        ? 'bg-red-300 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {isSubmitting ? 'Enviando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleSolicitud;
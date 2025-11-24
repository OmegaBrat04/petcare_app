import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Inicio.css';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from "./api.config";

interface Veterinaria {
    ID: number;
    NombreComercial: string;
    Ciudad: string;
    Logo: string;
    EstadoVerificacion: string;
    MotivoRechazo?: string;
}

const Inicio: React.FC = () => {
    const [misVeterinarias, setMisVeterinarias] = useState<Veterinaria[]>([]);
    const [stats, setStats] = useState({ citasHoy: 0, citasPendientes: 0, ingresos: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const navigate = useNavigate();
    
    const usuarioId = localStorage.getItem('idUsuario'); 
    const usuarioNombre = localStorage.getItem('nombreUsuario') || 'Usuario';

    useEffect(() => {
        if (!usuarioId) {
            navigate('/'); 
            return;
        }

        const fetchDatosIniciales = async () => {
            // 1. Cargar estadísticas
            try {
                const statsResponse = await fetch(API_ENDPOINTS.dashboard.obtenerStats(usuarioId));
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }
            } catch (error) {
                console.error("Error cargando estadísticas:", error);
            } finally {
                setIsLoadingStats(false);
            }

            // 2. Cargar mis veterinarias
            try {
                const vetsResponse = await fetch(API_ENDPOINTS.veterinarias.listarPropias(usuarioId));
                if (vetsResponse.ok) {
                    const vetsData = await vetsResponse.json();
                    setMisVeterinarias(vetsData);
                }
            } catch (error) {
                console.error("Error cargando lista de veterinarias:", error);
            }
        };

        fetchDatosIniciales();
    }, [usuarioId, navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleClickMenuCitas = () => {
        navigate('/citas');
    };

    const getEstadoColor = (estado: string) => {
        switch(estado) {
            case 'Aprobada': return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' };
            case 'Rechazada': return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' };
            default: return { bg: '#fff3cd', text: '#856404', border: '#ffeeba' };
        }
    };

    // --- CAMBIO 1: Incluir 'Pendiente' en el filtro ---
    const notificacionesImportantes = misVeterinarias.filter(v => 
        v.EstadoVerificacion === 'Rechazada' || 
        v.EstadoVerificacion === 'Aprobada' || 
        v.EstadoVerificacion === 'Pendiente'
    );

    return (
        <div className="inicio-container">
            <header className="navbar">
                <div className="navbar-left">
                    <img src={PETCARE_ICON_URL} alt="Logo" className="navbar-logo-icon" style={{ height: '32px', width: 'auto' }} />
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                </div>

                <nav className="navbar-menu">
                    <Link to="/inicio" className="menu-item active">Inicio</Link>
                    <span onClick={handleClickMenuCitas} className="menu-item" style={{cursor: 'pointer'}}>Citas</span>                    
                    <Link to="/agenda" className="menu-item">Agenda</Link>
                    <Link to="/historial" className="menu-item">Historial</Link>

                </nav>

                <div className="navbar-right" style={{gap: '15px'}}>
                    <span style={{fontSize: '14px', color: '#666'}}>Hola, <b>{usuarioNombre}</b></span>
                    <button onClick={handleLogout} style={{padding: '6px 12px', border: '1px solid #dc3545', color: '#dc3545', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="paw-print left-top"></div>

                <div className="dashboard-row">
                    {/* --- PANEL RESUMEN GLOBAL --- */}
                    <div className="card citas-hoy">
                        <h3>Resumen Global</h3>
                        <div className="citas-stats">
                            {isLoadingStats ? (
                                <p style={{color:'#999', textAlign:'center'}}>Cargando...</p>
                            ) : (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-number primary">{stats.citasHoy}</span>
                                        <span className="stat-label">Citas Hoy</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number danger">{stats.citasPendientes}</span>
                                        <span className="stat-label">Pendientes</span>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', textAlign: 'center'}}>
                            <p style={{fontSize: '13px', color: '#002D62', margin: 0, lineHeight: '1.5'}}>
                                Bienvenido a <strong>PetCare Manager</strong>.<br/>
                                {stats.citasPendientes > 0 
                                    ? <span>Tienes <strong style={{color: '#dc3545'}}>{stats.citasPendientes}</strong> citas pendientes de aprobación.</span>
                                    : <span>No tienes citas pendientes por el momento.</span>
                                }
                            </p>
                        </div>
                    </div>

                    {/* --- MIS SUCURSALES --- */}
                    <div className="card veterinarios" style={{flex: 1.5}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}>
                            <h3 style={{border:'none', padding:0, margin:0}}>Mis Sucursales</h3>
                            <Link to="/registro-veterinaria" style={{fontSize:'12px', color:'#007bff', textDecoration:'none', fontWeight:'bold'}}>+ Agregar</Link>
                        </div>

                        <div className="veterinarios-list" style={{maxHeight:'300px', overflowY:'auto'}}>
                            {misVeterinarias.length === 0 ? (
                                <div style={{textAlign:'center', padding:'30px', color:'#999'}}>
                                    <div style={{fontSize:'40px', marginBottom:'10px'}}>🏥</div>
                                    <p>No tienes veterinarias registradas.</p>
                                    <Link to="/registro-veterinaria" className="btn-primary" style={{display:'inline-block', marginTop:'10px', textDecoration:'none'}}>Registrar mi primera clínica</Link>
                                </div>
                            ) : (
                                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                    {misVeterinarias.map((vet) => {
                                        const colores = getEstadoColor(vet.EstadoVerificacion);
                                        // Solo dejamos editar si NO está pendiente (o puedes dejarlo siempre, a tu gusto)
                                        // Aquí lo dejé siempre visible.
                                        
                                        return (
                                            <div 
                                                key={vet.ID} 
                                                style={{
                                                    display:'flex', alignItems:'center', gap:'15px', 
                                                    padding:'15px', borderRadius:'10px', border:'1px solid #eee',
                                                    backgroundColor: '#fff', boxShadow:'0 2px 5px rgba(0,0,0,0.02)',
                                                }}
                                            >
                                                {vet.Logo ? (
                                                    <img src={vet.Logo} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:'1px solid #eee'}} alt="Logo" />
                                                ) : (
                                                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#f0f2f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>🏥</div>
                                                )}

                                                <div style={{flex: 1}}>
                                                    <h4 style={{margin:0, color:'#333', fontSize:'15px'}}>{vet.NombreComercial}</h4>
                                                    <p style={{margin:'2px 0 0', fontSize:'12px', color:'#888'}}>{vet.Ciudad} • ID: {vet.ID}</p>
                                                </div>

                                                <div style={{display:'flex', flexDirection:'column', alignItems:'end', gap:'5px'}}>
                                                    <span style={{
                                                        fontSize:'11px', fontWeight:'bold', padding:'4px 10px', borderRadius:'15px',
                                                        backgroundColor: colores.bg, color: colores.text, border:`1px solid ${colores.border}`
                                                    }}>
                                                        {vet.EstadoVerificacion}
                                                    </span>
                                                    
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/editar-veterinaria/${vet.ID}`);
                                                        }}
                                                        style={{
                                                            fontSize: '12px', 
                                                            color: '#007bff', 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            textDecoration: 'underline',
                                                            marginTop: '2px'
                                                        }}
                                                    >
                                                         Gestionar Veterinaria
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- NOTIFICACIONES DEL SISTEMA (DINÁMICAS) --- */}
                <div className="dashboard-row" style={{marginTop:'20px'}}>
                    <div className="card alertas">
                         <h3 style={{fontSize:'16px', marginBottom: '15px'}}>Notificaciones del Sistema</h3>
                         
                         <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            
                            {notificacionesImportantes.length === 0 && (
                                <div style={{padding:'20px', textAlign:'center', color:'#999', fontSize:'13px', fontStyle: 'italic'}}>
                                    No hay alertas de validación nuevas.
                                </div>
                            )}

                            {notificacionesImportantes.map(vet => {
                                // 1. CASO RECHAZADA
                                if (vet.EstadoVerificacion === 'Rechazada') {
                                    return (
                                        <div key={vet.ID} style={{
                                            display: 'flex', gap: '15px', padding: '15px', 
                                            backgroundColor: '#fff5f5', borderLeft: '4px solid #dc3545', borderRadius: '4px',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div style={{color: '#dc3545', fontSize: '20px'}}>⚠️</div>
                                            <div>
                                                <h4 style={{margin: '0 0 5px 0', color: '#721c24', fontSize: '14px'}}>Solicitud Rechazada: {vet.NombreComercial}</h4>
                                                <p style={{margin: 0, fontSize: '13px', color: '#555'}}>
                                                    <strong>Motivo:</strong> {vet.MotivoRechazo || 'No se especificó un motivo.'}
                                                </p>
                                                <Link to={`/editar-veterinaria/${vet.ID}`} style={{fontSize:'12px', color:'#dc3545', textDecoration:'underline', marginTop:'5px', display:'inline-block'}}>
                                                    Corregir información
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                } 
                                // 2. CASO APROBADA
                                else if (vet.EstadoVerificacion === 'Aprobada') {
                                    return (
                                        <div key={vet.ID} style={{
                                            display: 'flex', gap: '15px', padding: '15px', 
                                            backgroundColor: '#f0fff4', borderLeft: '4px solid #28a745', borderRadius: '4px',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div style={{color: '#28a745', fontSize: '20px'}}>✅</div>
                                            <div>
                                                <h4 style={{margin: '0 0 5px 0', color: '#155724', fontSize: '14px'}}>¡Felicidades! {vet.NombreComercial} ha sido aprobada.</h4>
                                                <p style={{margin: 0, fontSize: '13px', color: '#555'}}>
                                                    Tu clínica ya está visible. Configura tus horarios para comenzar.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                // 3. CASO PENDIENTE (NUEVO)
                                else if (vet.EstadoVerificacion === 'Pendiente') {
                                    return (
                                        <div key={vet.ID} style={{
                                            display: 'flex', gap: '15px', padding: '15px', 
                                            backgroundColor: '#fffbf0', borderLeft: '4px solid #ffc107', borderRadius: '4px',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div style={{color: '#ffc107', fontSize: '20px'}}>⏳</div>
                                            <div>
                                                <h4 style={{margin: '0 0 5px 0', color: '#856404', fontSize: '14px'}}>Solicitud en Revisión: {vet.NombreComercial}</h4>
                                                <p style={{margin: 0, fontSize: '13px', color: '#666'}}>
                                                    Estamos validando la información de tu veterinaria. Te notificaremos pronto.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                         </div>
                    </div>
                </div>

                <div className="paw-print right-top"></div>
            </main>
        </div>
    );
};

export default Inicio;
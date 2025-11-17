import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Inicio.css';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from "./api.config";

// --- ESTADO INICIAL DE ESTADÍSTICAS ---
const statsCitas = {
    hoy: 0, week: 0, pending: 0, confirmed: 0, cancelled: 0
};

const Inicio: React.FC = () => {
    // Ahora guardamos una LISTA de veterinarias, no solo una
    const [misVeterinarias, setMisVeterinarias] = useState<any[]>([]);

    useEffect(() => {
        const fetchMisVeterinarias = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.veterinarias.listarPropias);
                if (response.ok) {
                    const data = await response.json();
                    setMisVeterinarias(data);
                }
            } catch (error) {
                console.error("Error cargando lista:", error);
            }
        };
        fetchMisVeterinarias();
    }, []);

    const getEstadoColor = (estado: string) => {
        switch(estado) {
            case 'Aprobada': return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' }; // Verde suave
            case 'Rechazada': return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }; // Rojo suave
            default: return { bg: '#fff3cd', text: '#856404', border: '#ffeeba' }; // Amarillo suave
        }
    };

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
                    <a href="#menu" className="menu-item active">Dashboard</a>
                    {/* Botón directo para agregar otra sucursal */}
                    <Link to="/registro-veterinaria" className="menu-item" style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <span style={{fontSize:'18px', lineHeight:0}}>+</span> Nueva Sucursal
                    </Link>
                </nav>
                <div className="navbar-right">
                    <span className="icon-phone">📞</span>
                    <span className="phone-number">81236587</span>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="paw-print left-top"></div>

                <div className="dashboard-row">
                    {/* TARJETA: RESUMEN GENERAL (Placeholder) */}
                    <div className="card citas-hoy">
                        <h3>Resumen Global</h3>
                        <div className="citas-stats">
                            <div className="stat-item">
                                <span className="stat-number primary">0</span>
                                <span className="stat-label">Citas Hoy</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">0</span>
                                <span className="stat-label">Ingresos</span>
                            </div>
                        </div>
                        <p style={{textAlign:'center', color:'#999', fontSize:'13px', fontStyle:'italic', marginTop:'20px'}}>
                            Selecciona una sucursal aprobada para ver detalles.
                        </p>
                    </div>

                    {/* --- NUEVA TARJETA: MIS SUCURSALES --- */}
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
                                        const esAprobada = vet.EstadoVerificacion === 'Aprobada';

                                        return (
                                            <div key={vet.ID} style={{
                                                display:'flex', alignItems:'center', gap:'15px', 
                                                padding:'15px', borderRadius:'10px', border:'1px solid #eee',
                                                backgroundColor: '#fff', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'
                                            }}>
                                                {/* Logo */}
                                                {vet.Logo ? (
                                                    <img src={vet.Logo} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:'1px solid #eee'}} />
                                                ) : (
                                                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#f0f2f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>🏥</div>
                                                )}

                                                {/* Info */}
                                                <div style={{flex: 1}}>
                                                    <h4 style={{margin:0, color:'#333', fontSize:'15px'}}>{vet.NombreComercial}</h4>
                                                    <p style={{margin:'2px 0 0', fontSize:'12px', color:'#888'}}>{vet.Ciudad} • ID: {vet.ID}</p>
                                                </div>

                                                {/* Estado y Acción */}
                                                <div style={{display:'flex', flexDirection:'column', alignItems:'end', gap:'5px'}}>
                                                    <span style={{
                                                        fontSize:'11px', fontWeight:'bold', padding:'4px 10px', borderRadius:'15px',
                                                        backgroundColor: colores.bg, color: colores.text, border:`1px solid ${colores.border}`
                                                    }}>
                                                        {vet.EstadoVerificacion}
                                                    </span>
                                                    
                                                    {esAprobada && (
                                                        <button style={{
                                                            background:'none', border:'none', color:'#007bff', 
                                                            fontSize:'12px', cursor:'pointer', fontWeight:'bold', padding:0
                                                        }}>
                                                            Gestionar →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sección inferior decorativa o para futuros widgets */}
                <div className="dashboard-row" style={{marginTop:'20px'}}>
                    <div className="card alertas">
                         <h3 style={{fontSize:'16px'}}>Notificaciones del Sistema</h3>
                         <div style={{padding:'20px', textAlign:'center', color:'#999', fontSize:'13px'}}>
                             <p>Bienvenido a PetCare Manager.</p>
                             <p>Registra tus sucursales para comenzar a administrar citas.</p>
                         </div>
                    </div>
                </div>

                <div className="paw-print right-top"></div>
            </main>
        </div>
    );
};

export default Inicio;
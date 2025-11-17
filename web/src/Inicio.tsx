import React from 'react';
import { Link } from 'react-router-dom'; 
import './Inicio.css';  /* <--- ¡ESTA LÍNEA ES LA CLAVE! TIENE QUE ESTAR AQUÍ */
import PETCARE_ICON_URL from "./assets/PetCare Manager.png"; 

// ... el resto del código ...

const Inicio: React.FC = () => {
    return (
        <div className="inicio-container">
            <header className="navbar">
                <div className="navbar-left">
                    {/* Logo Icono */}
                    <img src={PETCARE_ICON_URL} alt="Logo Icono" className="navbar-logo-icon" />
                    
                    {/* CAMBIO 1: Logo en Texto CSS en lugar de imagen */}
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                </div>
                
                <nav className="navbar-menu">
                    <a href="#menu" className="menu-item active">Menu</a>
                    
                    {/* CAMBIO 3: Enlace a la ruta de Registro */}
                    {/* Esto buscará la ruta definida en tu App.tsx */}
                    <Link to="/registro-veterinaria" className="menu-item">
                        Agregar veterinaria
                    </Link>
                </nav>

                <div className="navbar-right">
                    {/* CAMBIO 2: Icono a la izquierda, Número a la derecha */}
                    <span className="icon-phone">📞</span>
                    <span className="phone-number">81236587</span>
                    
                    <span className="schedule"> | Lunes - Sabado 8:00 AM - 8:00 PM</span>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="paw-print left-top"></div>
                <div className="paw-print left-bottom"></div>

                <div className="dashboard-row">
                    <div className="card citas-hoy">
                        <h3>Citas de hoy</h3>
                        <div className="citas-stats">
                            <div className="stat-item">
                                <span className="stat-number primary">8</span>
                                <span className="stat-label">para hoy</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">25</span>
                                <span className="stat-label">esta semana</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">7</span>
                                <span className="stat-label">Pendientes</span>
                            </div>
                        </div>
                        <div className="citas-summary">
                            <div className="summary-item">
                                <span className="summary-number confirmed">5</span>
                                <span className="summary-label">Confirmadas</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-number cancelled">2</span>
                                <span className="summary-label">Canceladas</span>
                            </div>
                        </div>
                    </div>

                    <div className="card veterinarios">
                        <h3>Veterinarios</h3>
                        <div className="veterinarios-list">
                            <div className="veterinario-item">
                                <span>López</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="veterinario-item">
                                <span>López</span>
                                <span className="status occupied">Ocupado</span>
                            </div>
                            <div className="veterinario-item">
                                <span>López</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="veterinario-item">
                                <span>López</span>
                                <span className="status occupied">Ocupado</span>
                            </div>
                            <div className="veterinario-item">
                                <span>López</span>
                                <span className="status available">Disponible</span>
                            </div>
                        </div>
                    </div>

                    <div className="card clinicas-registradas">
                        <h3>Clinicas Registradas</h3>
                        <div className="clinicas-list">
                            <div className="clinica-item">
                                <span>Veterinaria</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="clinica-item">
                                <span>Veterinaria</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="clinica-item">
                                <span>Veterinaria</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="clinica-item">
                                <span>Veterinaria</span>
                                <span className="status available">Disponible</span>
                            </div>
                            <div className="clinica-item">
                                <span>Veterinaria</span>
                                <span className="status available">Disponible</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-row">
                    <div className="card proximos-recordatorios">
                        <h3>Próximos recordatorios</h3>
                        
                        <div className="recordatorios-header">
                            <span className="recordatorio-fecha-header">Fecha</span>
                            <span className="recordatorio-desc-header">Descripción</span>
                        </div>
                        <div className="recordatorios-list">
                            <div className="recordatorio-item">
                                <span className="recordatorio-date">30 Octubre</span>
                                <span className="recordatorio-description">Vacuna</span>
                            </div>
                            <div className="recordatorio-item">
                                <span className="recordatorio-date">02 Noviembre</span>
                                <span className="recordatorio-description">Consulta</span>
                            </div>
                            <div className="recordatorio-item">
                                <span className="recordatorio-date">10 Noviembre</span>
                                <span className="recordatorio-description">Cirugia</span>
                            </div>
                        </div>

                    </div>

                    <div className="card alertas">
                        <h3>Alertas</h3>
                        <div className="alertas-list">
                            <div className="alerta-item">Vacuna para Luna pendiente</div>
                            <div className="alerta-item">Desparasitación para Lola pendiente</div>
                            <div className="alerta-item">Vacuna para Firulais pendiente</div>
                        </div>
                        <div className="paw-print right-bottom-card"></div>
                    </div>
                </div>
                <div className="paw-print right-top"></div>
            </main>
        </div>
    );
};

export default Inicio;
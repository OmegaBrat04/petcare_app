import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_LOGO_URL from "./assets/PetCare Manager.png"; 

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

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                console.log("Iniciando fetch para ID:", id); // LOG 1
                const url = API_ENDPOINTS.veterinarias.obtenerDetalle(Number(id));
                console.log("URL:", url); // LOG 2

                const res = await fetch(url);
                
                if (!res.ok) {
                    throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
                }

                const jsonData = await res.json();
                console.log("Datos recibidos:", jsonData); // LOG 3
                setData(jsonData);

            } catch (error) {
                console.error("Error cargando detalle:", error);
                alert("Error al cargar los datos. Revisa la consola.");
            }
        };

        fetchData();
    }, [id]);

    // FUNCIÓN PARA APROBAR O RECHAZAR
    const handleEstado = async (nuevoEstado: 'Aprobada' | 'Rechazada') => {
        if(!confirm(`¿Estás seguro de marcar esta solicitud como ${nuevoEstado}?`)) return;

        try {
            const response = await fetch(API_ENDPOINTS.veterinarias.actualizarEstado(Number(id)), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoEstado })
            });

            if (response.ok) {
                alert(`Veterinaria ${nuevoEstado} con éxito.`);
                navigate('/admin'); 
            } else {
                alert('Error al actualizar el estado.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    };

    if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>Cargando...</div>;

    return (
        <div style={{backgroundColor: '#f0f2f5', minHeight: '100vh'}}>
            <div style={{background: 'white', padding: '12px 30px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src={PETCARE_LOGO_URL} alt="Logo" style={{height: '32px'}} />
                <div style={{display:'flex', flexDirection:'column', lineHeight:'1.1'}}>
                     <span style={{fontWeight: '900', color: '#002D62', fontSize:'18px'}}>PetCare</span>
                     <span style={{fontWeight: 'bold', color: '#33CCFF', fontSize:'15px'}}>Manager</span>
                </div>
                <span style={{background: '#e3f2fd', color: '#007bff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', marginLeft: '10px', border:'1px solid #bbdefb', fontWeight:'bold'}}>ADMIN</span>
            </div>

            <div style={styles.container}>
                <Link to="/admin" style={styles.btnBack}>← Volver al listado</Link>

                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        {data.Logo ? (
                            <img src={data.Logo} alt="Logo Vet" style={styles.logoImage} />
                        ) : (
                            <div style={styles.logoPlaceholder}>🏥</div>
                        )}
                        <div>
                            <h1 style={{margin: 0, color: '#333'}}>{data.NombreComercial}</h1>
                            <p style={{margin: '5px 0 0', color: '#666'}}>
                                Solicitud #{data.ID} • {data.Ciudad} • 
                                {/* CORRECCIÓN AQUÍ: Usar EstadoVerificacion */}
                                <strong style={{color: '#f0ad4e', marginLeft: '5px'}}>
                                    {data.EstadoVerificacion}
                                </strong>
                            </p>
                        </div>
                    </div>
                    
                    {/* CORRECCIÓN AQUÍ: Validar contra EstadoVerificacion */}
                    {data.EstadoVerificacion === 'Pendiente' && (
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button 
                                onClick={() => handleEstado('Rechazada')}
                                style={{padding: '10px 20px', borderRadius: '6px', border: '1px solid #dc3545', background: 'white', color: '#dc3545', cursor: 'pointer', fontWeight:'bold'}}
                            >
                                Rechazar
                            </button>
                            <button 
                                onClick={() => handleEstado('Aprobada')}
                                style={{padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#28a745', color: 'white', cursor: 'pointer', fontWeight:'bold'}}
                            >
                                Aprobar Registro
                            </button>
                        </div>
                    )}
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>👤 Responsable</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Nombre Completo</span><div style={styles.value}>{data.NombreResponsable} {data.ApellidosResponsable}</div></div>
                        <div style={styles.field}><span style={styles.label}>Puesto</span><div style={styles.value}>{data.Puesto}</div></div>
                        <div style={styles.field}><span style={styles.label}>Email</span><div style={styles.value}>{data.EmailResponsable}</div></div>
                        <div style={styles.field}><span style={styles.label}>Teléfono</span><div style={styles.value}>{data.TelefonoResponsable}</div></div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>🏥 Datos de la Veterinaria</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Razón Social</span><div style={styles.value}>{data.RazonSocial || 'N/A'}</div></div>
                        <div style={styles.field}><span style={styles.label}>RFC</span><div style={styles.value}>{data.RFC || 'N/A'}</div></div>
                        <div style={styles.field}><span style={styles.label}>Categorías</span><div style={styles.value}>{data.Categorias}</div></div>
                        <div style={styles.field}><span style={styles.label}>Descripción</span><div style={styles.value}>{data.Descripcion}</div></div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>📍 Ubicación y Contacto</h3>
                    <div style={styles.grid}>
                        <div style={styles.field}><span style={styles.label}>Dirección</span><div style={styles.value}>{data.Calle} #{data.NumeroExterior}, {data.Colonia}</div></div>
                        <div style={styles.field}><span style={styles.label}>Ubicación</span><div style={styles.value}>{data.Ciudad}, {data.Estado} (CP: {data.CodigoPostal})</div></div>
                        <div style={styles.field}><span style={styles.label}>Teléfono Clínica</span><div style={styles.value}>{data.TelefonoClinica}</div></div>
                        <div style={styles.field}><span style={styles.label}>Email Clínica</span><div style={styles.value}>{data.EmailClinica}</div></div>
                    </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>🛠️ Servicios</h3>
                        <div>
                            {data.servicios?.length > 0 ? data.servicios.map((s: any) => (
                                <span key={s.ID} style={styles.tag}>{s.Nombre} (${s.Precio})</span>
                            )) : <span style={{color:'#999', fontStyle:'italic'}}>Sin servicios</span>}
                        </div>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>🕒 Horarios</h3>
                        <ul style={{paddingLeft: '20px', margin: 0}}>
                            {data.horarios?.length > 0 ? data.horarios.map((h: any) => (
                                <li key={h.ID} style={{fontSize: '14px', marginBottom: '5px', color:'#555'}}>
                                    <strong>{h.Dia}:</strong> {h.Apertura} - {h.Cierre}
                                </li>
                            )) : <span style={{color:'#999', fontStyle:'italic'}}>Sin horarios</span>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalleSolicitud;
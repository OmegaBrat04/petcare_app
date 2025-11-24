import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png"; // <--- IMPORTAMOS EL LOGO

// --- INTERFACES ---
interface SolicitudCitaDB {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled'; 
  estado: 'Pendiente' | 'Confirmada' | 'Rechazada';
  notas: string | null;
  telefono_contacto: string | null;
  fecha_preferida: string;
  horario_confirmado: string | null;
  created_at: string;
  mascota_nombre: string;
  mascota_raza: string;
  mascota_edad: string;
  mascota_peso: string;
  servicio_nombre: string;
  sucursal?: string;
}

// --- HELPERS ---
const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: 'UTC' });
};

const formatToDateTimeLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset(); 
  const adjustedDate = new Date(date.getTime() - (offset*60*1000)); 
  return adjustedDate.toISOString().slice(0, 16);
};

const getStatusChip = (estado: string) => {
  switch (estado) {
    case "Pendiente": return { text: "Pendiente", class: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case "Confirmada": return { text: "Confirmada", class: "bg-green-100 text-green-800 border-green-200" };
    case "Rechazada": return { text: "Rechazada", class: "bg-red-100 text-red-800 border-red-200" };
    default: return { text: estado, class: "bg-gray-100 text-gray-800" };
  }
};

// --- COMPONENTE PRINCIPAL ---
const Citas: React.FC = () => {
  const [query, setQuery] = useState("");
  const [solicitudes, setSolicitudes] = useState<SolicitudCitaDB[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<"Todas" | "Pendiente" | "Confirmada" | "Rechazada">("Todas");
  const [filtroSucursal, setFiltroSucursal] = useState<string>("Todas"); // <--- NUEVO FILTRO

  const [horarioConfirmadoInput, setHorarioConfirmadoInput] = useState<string>("");
  const navigate = useNavigate();
  const USUARIO_ID = localStorage.getItem('idUsuario');

  // 1. CARGA DE DATOS
  useEffect(() => {
    if (!USUARIO_ID) {
        navigate('/');
        return;
    }

    const fetchCitas = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.citas.obtenerPorPropietario(USUARIO_ID));
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const rawData = await response.json();

        const data: SolicitudCitaDB[] = rawData.map((item: any) => ({
             id: item.id,
             mascota_nombre: item.mascota, 
             servicio_nombre: item.servicio,
             sucursal: item.sucursal, 
             fecha_preferida: item.fechaPreferidaRaw || item.fechaPreferida, 
             telefono_contacto: item.detalles.telefono,
             notas: item.detalles.motivo,
             status: item.status || 'pending',
             estado: item.estado, 
             horario_confirmado: item.horario_confirmado || null,
             created_at: item.solicitada,
             mascota_raza: "", mascota_edad: "", mascota_peso: "" 
        }));
        
        setSolicitudes(data);
        if (data.length > 0) setSelectedId(data[0].id);

      } catch (error) {
        console.error("Error al cargar citas:", error);
      }
    };
    fetchCitas();
  }, [USUARIO_ID, navigate]);

  // --- OBTENER SUCURSALES ÚNICAS PARA EL FILTRO ---
  const sucursalesUnicas = useMemo(() => {
      // Extraemos los nombres de sucursales únicos de las solicitudes cargadas
      const nombres = solicitudes.map(s => s.sucursal).filter((v): v is string => !!v);
      return Array.from(new Set(nombres));
  }, [solicitudes]);

  // 2. LÓGICA DE FILTRADO (ACTUALIZADA)
  const listaFiltrada = useMemo(() => {
    let data = solicitudes;

    // Filtro por Estado
    if (filtroEstado !== "Todas") {
      data = data.filter((s) => s.estado === filtroEstado);
    }

    // Filtro por Sucursal (NUEVO)
    if (filtroSucursal !== "Todas") {
      data = data.filter((s) => s.sucursal === filtroSucursal);
    }

    // Búsqueda de texto
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((s) =>
          s.mascota_nombre.toLowerCase().includes(q) ||
          s.servicio_nombre.toLowerCase().includes(q) ||
          (s.sucursal && s.sucursal.toLowerCase().includes(q))
      );
    }
    return data;
  }, [query, filtroEstado, filtroSucursal, solicitudes]);

  // 3. SELECCIÓN
  const seleccionado = useMemo(
    () => listaFiltrada.find((s) => s.id === selectedId) || null,
    [selectedId, listaFiltrada]
  );

  // 4. EFECTO FECHA
  useEffect(() => {
    if (seleccionado) {
      if (seleccionado.horario_confirmado) {
        setHorarioConfirmadoInput(formatToDateTimeLocal(seleccionado.horario_confirmado));
      } else {
        const fechaISO = seleccionado.fecha_preferida.split('T')[0]; 
        const fechaBase = fechaISO.includes('-') ? fechaISO : new Date().toISOString().slice(0, 10);
        setHorarioConfirmadoInput(`${fechaBase}T09:00`);
      }
    }
  }, [seleccionado]);

  // 5. ACCIONES
  const handleConfirmarCita = async () => {
    if (!seleccionado) return;
    if (!horarioConfirmadoInput) {
        alert("Por favor selecciona una fecha y hora.");
        return;
    }
    try {
      const url = API_ENDPOINTS.citas.actualizarEstado(seleccionado.id);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            estado: 'Confirmada',
            horario_confirmado: horarioConfirmadoInput 
        }),
      });
      if (!response.ok) throw new Error('Error al actualizar');
      const updatedCitas = solicitudes.map(s => 
        s.id === seleccionado.id ? { ...s, estado: 'Confirmada' as const, horario_confirmado: horarioConfirmadoInput } : s
      );
      setSolicitudes(updatedCitas);
      alert(`Cita confirmada correctamente.`);
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo confirmar la cita.");
    }
  };
  
  const handleRechazar = async () => {
      if (!seleccionado) return;
      try {
        const url = API_ENDPOINTS.citas.actualizarEstado(seleccionado.id);
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'Rechazada' }),
        });
        if (!response.ok) throw new Error('Error');
        const updatedCitas = solicitudes.map(s => 
            s.id === seleccionado.id ? { ...s, estado: 'Rechazada' as const } : s
        );
        setSolicitudes(updatedCitas);
      } catch(e) { console.error(e); }
  };

  const handleContactar = () => {
    if (seleccionado?.telefono_contacto) {
        window.open(`https://wa.me/${seleccionado.telefono_contacto.replace(/\D/g,'')}`, '_blank');
    }
  };

  const InfoItem = ({ label, value }: { label: string, value: string | null }) => (
      <div>
          <p className="text-xs text-gray-500 font-bold uppercase">{label}</p>
          <p className="text-gray-900 font-medium">{value || "—"}</p>
      </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] text-gray-900 font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-white shadow-sm z-10 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo y Título */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/inicio')} className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Volver al inicio">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            
            {/* LOGO AQUÍ */}
            <img src={PETCARE_ICON_URL} alt="Logo" className="h-8 w-auto" />

            <h1 className="text-xl font-bold text-gray-800">Solicitudes de Cita</h1>
          </div>

          {/* Contenedor de Filtros (Derecha) */}
          <div className="flex items-center gap-3">
            
            {/* Filtro Sucursal */}
            <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroSucursal} 
                onChange={(e) => setFiltroSucursal(e.target.value)}
            >
                <option value="Todas">Todas las Sucursales</option>
                {sucursalesUnicas.map(sucursal => (
                    <option key={sucursal} value={sucursal}>{sucursal}</option>
                ))}
            </select>

            {/* Filtro Estado */}
            <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value as any)}
            >
                <option value="Todas">Todos los estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Confirmada">Confirmadas</option>
                <option value="Rechazada">Rechazadas</option>
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 lg:p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* LISTA */}
        <section className="w-full lg:w-6/12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
             <input className="w-full border rounded p-2 text-sm" placeholder="Buscar por mascota, servicio o sucursal..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50 sticky top-0 border-b">
                <tr>
                    <th className="px-4 py-3 font-semibold">Mascota</th>
                    <th className="px-4 py-3 font-semibold">Servicio</th>
                    {/* NUEVA COLUMNA DE SUCURSAL */}
                    <th className="px-4 py-3 font-semibold">Sucursal</th>
                    <th className="px-4 py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listaFiltrada.map((s) => (
                  <tr key={s.id} onClick={() => setSelectedId(s.id)} className={`cursor-pointer transition-colors ${seleccionado?.id === s.id ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                        {s.mascota_nombre}
                        <div className="text-xs text-gray-400 font-normal mt-0.5">{s.created_at}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.servicio_nombre}</td>
                    
                    {/* DATO DE SUCURSAL EN LA TABLA */}
                    <td className="px-4 py-3 text-gray-500 text-xs uppercase font-bold">{s.sucursal}</td>
                    
                    <td className="px-4 py-3 text-right"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusChip(s.estado).class}`}>{s.estado}</span></td>
                  </tr>
                ))}
                {listaFiltrada.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay citas disponibles.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* DETALLE */}
        <section className="w-full lg:w-6/12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {seleccionado ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex justify-between items-start bg-gray-50/30">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{seleccionado.mascota_nombre}</h2>
                  <p className="text-gray-600 text-sm font-medium">{seleccionado.servicio_nombre}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusChip(seleccionado.estado).class}`}>{seleccionado.estado}</span>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mb-8">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Confirmar Fecha y Hora</label>
                    <div className="flex gap-3 flex-wrap">
                        <input 
                            type="datetime-local" 
                            className="flex-1 border border-blue-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={horarioConfirmadoInput}
                            onChange={(e) => setHorarioConfirmadoInput(e.target.value)}
                        />
                        <button 
                            onClick={handleConfirmarCita}
                            disabled={seleccionado.estado === 'Confirmada'}
                            className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            {seleccionado.estado === 'Confirmada' ? 'Cita Agendada' : 'Agendar Cita'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                   <InfoItem label="FECHA PREFERIDA" value={formatShortDate(seleccionado.fecha_preferida)} />
                   <InfoItem label="TELÉFONO" value={seleccionado.telefono_contacto} />
                   <InfoItem label="SUCURSAL" value={seleccionado.sucursal || 'General'} />
                   <InfoItem label="SOLICITADA EL" value={seleccionado.created_at} />
                </div>

                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">MOTIVO DE LA CONSULTA</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 leading-relaxed">
                        {seleccionado.notas || "Sin detalles adicionales."}
                    </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                 <button 
                    onClick={handleRechazar} 
                    disabled={seleccionado.estado === 'Rechazada'}
                    className="border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
                 >
                    Rechazar
                 </button>
                 <button onClick={handleContactar} className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors shadow-sm">
                    Contactar
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
               <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
               <p>Selecciona una cita para ver los detalles</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Citas;
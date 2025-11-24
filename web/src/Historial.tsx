import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";

// Interfaces
interface CitaHistorial {
  id: string;
  mascota: string;
  servicio: string;
  sucursal: string;
  fecha: Date;
  hora: string;
  cliente: string;
  estado: 'Terminada' | 'Cancelada';
  motivoCancelacion?: string;
}

const Historial: React.FC = () => {
  const navigate = useNavigate();
  const USUARIO_ID = localStorage.getItem('idUsuario');

  const [registros, setRegistros] = useState<CitaHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  
  // Fechas por defecto
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(today.getDate() - 30);
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const toLocalISO = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };

  const [fechaInicio, setFechaInicio] = useState(toLocalISO(lastMonth));
  const [fechaFin, setFechaFin] = useState(toLocalISO(nextYear));

  useEffect(() => {
    if (!USUARIO_ID) { navigate('/'); return; }

    const fetchData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.citas.obtenerPorPropietario(USUARIO_ID));
        if (!response.ok) throw new Error("Error al cargar historial");
        const rawData = await response.json();

        const historialData = rawData
          .filter((c: any) => {
             return c.estado === 'Terminada' || c.estado === 'Cancelada' || c.estado === 'Rechazada' || 
                    c.status === 'completed' || c.status === 'cancelled';
          })
          .map((c: any) => {
             let fechaObj = new Date();
             if (c.horario_confirmado) {
                 fechaObj = new Date(c.horario_confirmado);
             } else if (c.fecha_preferida) {
                 fechaObj = new Date(c.fecha_preferida);
             } else if (c.solicitada) {
                 const parsed = new Date(c.solicitada);
                 if (!isNaN(parsed.getTime())) fechaObj = parsed;
             }

             let estadoFinal: 'Terminada' | 'Cancelada' = 'Cancelada';
             const esTerminada = 
                c.estado === 'Terminada' || 
                c.status === 'completed' || 
                (c.detalles?.motivo && c.detalles.motivo.includes('#COMPLETED'));

             if (esTerminada) {
                 estadoFinal = 'Terminada';
             }

             return {
                id: c.id,
                mascota: c.mascota,
                servicio: c.servicio,
                sucursal: c.sucursal || 'Matriz',
                fecha: fechaObj,
                hora: fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
                cliente: c.detalles.telefono,
                estado: estadoFinal,
                motivoCancelacion: c.detalles.motivo ? c.detalles.motivo.replace(' #COMPLETED', '') : ''
             };
          });

        setRegistros(historialData.sort((a: any, b: any) => b.fecha.getTime() - a.fecha.getTime()));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [USUARIO_ID, navigate]);

  const datosFiltrados = useMemo(() => {
    return registros.filter(item => {
        let itemFechaString = "";
        try { itemFechaString = item.fecha.toISOString().split('T')[0]; } catch (e) { return false; }
        
        const cumpleFecha = itemFechaString >= fechaInicio && itemFechaString <= fechaFin;
        const cumpleSucursal = filtroSucursal === "Todas" || item.sucursal === filtroSucursal;
        const cumpleEstado = filtroEstado === "Todos" || item.estado === filtroEstado;
        const cumpleTexto = 
            item.mascota.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            item.servicio.toLowerCase().includes(filtroTexto.toLowerCase());

        return cumpleFecha && cumpleSucursal && cumpleEstado && cumpleTexto;
    });
  }, [registros, fechaInicio, fechaFin, filtroSucursal, filtroEstado, filtroTexto]);

  const stats = useMemo(() => {
      const terminadas = datosFiltrados.filter(r => r.estado === 'Terminada').length;
      const canceladas = datosFiltrados.filter(r => r.estado === 'Cancelada').length;
      return { terminadas, canceladas, total: datosFiltrados.length };
  }, [datosFiltrados]);

  const sucursalesUnicas = Array.from(new Set(registros.map(r => r.sucursal)));

  // --- NUEVA FUNCIÓN DE EXPORTAR ---
  const handleExportarExcel = () => {
    if (datosFiltrados.length === 0) return alert("No hay datos para exportar");

    // 1. Definir encabezados
    const headers = ["Fecha", "Hora", "Mascota", "Cliente/Tel", "Servicio", "Sucursal", "Estado", "Detalle/Motivo"];

    // 2. Convertir datos a formato CSV (Array de Arrays)
    const rows = datosFiltrados.map(item => [
        item.fecha.toLocaleDateString('es-MX'),
        item.hora,
        item.mascota,
        item.cliente || "Sin datos",
        item.servicio,
        item.sucursal,
        item.estado,
        item.motivoCancelacion || ""
    ]);

    // 3. Unir todo en un string separado por comas
    const csvContent = [
        headers.join(","), 
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")) // Comillas para manejar comas internas
    ].join("\n");

    // 4. Crear Blob con BOM para que Excel reconozca acentos (UTF-8)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Historial_Citas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm z-20 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Link to="/inicio" className="p-2 rounded-full hover:bg-gray-100 text-gray-500">←</Link>
            <img src={PETCARE_ICON_URL} alt="Logo" className="h-8 w-auto" />
            <div>
                <h1 className="text-xl font-bold text-gray-800 leading-none">Historial de Citas</h1>
                <p className="text-xs text-gray-500 mt-1">Consulta tus registros pasados</p>
            </div>
        </div>
        <div className="flex gap-3">
            {/* BOTÓN DE EXPORTAR YA FUNCIONAL */}
            <button 
                onClick={handleExportarExcel}
                disabled={datosFiltrados.length === 0}
                className="px-4 py-2 bg-green-600 text-white border border-transparent rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <span>📥</span> Exportar Excel
            </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Registros</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 text-xl">📂</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Citas Terminadas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.terminadas}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-full text-green-600 text-xl">✅</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Canceladas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-full text-red-600 text-xl">🚫</div>
            </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Buscar</label>
                <input 
                    type="text" 
                    placeholder="Mascota o servicio..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={filtroTexto}
                    onChange={e => setFiltroTexto(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Desde</label>
                    <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta</label>
                    <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>
            </div>

            <div className="w-full md:w-48">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Sucursal</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={filtroSucursal} onChange={e => setFiltroSucursal(e.target.value)}>
                    <option value="Todas">Todas</option>
                    {sucursalesUnicas.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="w-full md:w-40">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Estado</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="Todos">Todos</option>
                    <option value="Terminada">Terminadas</option>
                    <option value="Cancelada">Canceladas</option>
                </select>
            </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Mascota / Cliente</th>
                        <th className="px-6 py-4">Servicio</th>
                        <th className="px-6 py-4">Sucursal</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando historial...</td></tr>
                    ) : datosFiltrados.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">No se encontraron registros en este periodo.</td></tr>
                    ) : (
                        datosFiltrados.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="font-bold text-gray-800">{item.fecha.toLocaleDateString()}</div>
                                    <div className="text-xs">{item.hora}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-blue-900">{item.mascota}</div>
                                    <div className="text-xs text-gray-500">Tel: {item.cliente || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                    {item.servicio}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {item.sucursal}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.estado === 'Terminada' ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                            Completada
                                        </span>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                Cancelada
                                            </span>
                                            {item.motivoCancelacion && (
                                                <span className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={item.motivoCancelacion}>
                                                    {item.motivoCancelacion}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

      </main>
    </div>
  );
};

export default Historial;
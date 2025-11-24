import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";

// --- INTERFACES ---
interface CitaAgenda {
  id: string;
  mascota: string;
  servicio: string;
  sucursal: string;
  fecha: Date; 
  hora: string; 
  duracionMin: number; 
  cliente: string; 
  notas: string;
  estado: string;
  colIndex?: number;
  maxCols?: number;
}

// --- PALETA DE COLORES ---
const BRANCH_THEMES = [
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', activeRing: 'ring-blue-500' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900', activeRing: 'ring-orange-500' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900', activeRing: 'ring-purple-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-900', activeRing: 'ring-emerald-500' },
  { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-900', activeRing: 'ring-rose-500' },
  { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-900', activeRing: 'ring-amber-500' },
];

// --- HELPERS ---
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); 
  const diff = d.getDate() - day; 
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatTime = (date: Date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

const processOverlaps = (citas: CitaAgenda[]) => {
    const sorted = [...citas].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const result: CitaAgenda[] = sorted.map(c => ({ ...c, colIndex: 0, maxCols: 1 }));

    for (let i = 0; i < result.length; i++) {
        let overlaps = [i];
        const currentA = result[i];
        const endA = new Date(currentA.fecha.getTime() + currentA.duracionMin * 60000);

        for (let j = 0; j < result.length; j++) {
            if (i === j) continue;
            const currentB = result[j];
            const endB = new Date(currentB.fecha.getTime() + currentB.duracionMin * 60000);

            if (
                currentA.fecha < endB && 
                endA > currentB.fecha &&
                currentA.fecha.getDate() === currentB.fecha.getDate()
            ) {
                overlaps.push(j);
            }
        }

        if (overlaps.length > 1) {
            overlaps.sort((a, b) => result[a].fecha.getTime() - result[b].fecha.getTime() || a - b);
            const myPosition = overlaps.indexOf(i);
            result[i].colIndex = myPosition;
            result[i].maxCols = overlaps.length;
        }
    }
    return result;
};

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const USUARIO_ID = localStorage.getItem('idUsuario');
  
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCita, setSelectedCita] = useState<CitaAgenda | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDateInput, setNewDateInput] = useState("");
  
  // Filtros
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Cargar citas
  const fetchCitas = async () => {
    if (!USUARIO_ID) return;
    try {
      const response = await fetch(API_ENDPOINTS.citas.obtenerPorPropietario(USUARIO_ID));
      if (!response.ok) throw new Error("Error al cargar citas");
      const rawData = await response.json();

      const citasConfirmadas = rawData
        .filter((c: any) => c.estado === 'Confirmada' && c.horario_confirmado)
        .map((c: any) => {
            const fechaObj = new Date(c.horario_confirmado);
            return {
                id: c.id,
                mascota: c.mascota,
                servicio: c.servicio,
                sucursal: c.sucursal || 'Matriz',
                fecha: fechaObj,
                hora: formatTime(fechaObj),
                duracionMin: 60, 
                cliente: c.detalles.telefono,
                notas: c.detalles.motivo,
                estado: c.estado
            };
        });

      setCitas(citasConfirmadas);
    } catch (error) {
      console.error("Error cargando agenda:", error);
    }
  };

  useEffect(() => {
    if (!USUARIO_ID) { navigate('/'); return; }
    fetchCitas();
  }, [USUARIO_ID, navigate]);

  // --- LÓGICA DE SUCURSALES ---
  const uniqueBranches = useMemo(() => {
      const branches = Array.from(new Set(citas.map(c => c.sucursal)));
      return branches.sort();
  }, [citas]);

  useEffect(() => {
      if (uniqueBranches.length > 0 && selectedBranches.length === 0) {
          setSelectedBranches(uniqueBranches);
      }
  }, [uniqueBranches]);

  const toggleBranchFilter = (branch: string) => {
      if (selectedBranches.includes(branch)) {
          setSelectedBranches(selectedBranches.filter(b => b !== branch));
      } else {
          setSelectedBranches([...selectedBranches, branch]);
      }
  };

  const getBranchColor = (branchName: string) => {
      const index = uniqueBranches.indexOf(branchName);
      if (index === -1) return BRANCH_THEMES[0];
      return BRANCH_THEMES[index % BRANCH_THEMES.length];
  };

  // --- LÓGICA VISUAL CALENDARIO ---
  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek, i)); 
  const hours = Array.from({ length: 24 }).map((_, i) => i); 
  const HOUR_HEIGHT = 36; 

  const processedCitas = useMemo(() => {
    const visibles = citas.filter(c => {
        const cDate = new Date(c.fecha);
        cDate.setHours(0,0,0,0);
        const firstDay = new Date(startOfWeek);
        firstDay.setHours(0,0,0,0);
        const lastDay = addDays(startOfWeek, 6);
        lastDay.setHours(23,59,59,999);
        
        const inDateRange = c.fecha >= firstDay && c.fecha <= lastDay;
        const inBranchFilter = selectedBranches.includes(c.sucursal);

        return inDateRange && inBranchFilter;
    });
    return processOverlaps(visibles);
  }, [citas, startOfWeek, selectedBranches]);

  // --- ACCIONES ---
  
  // 1. Marcar como TERMINADA o CANCELADA (Con corrección de fecha)
  const handleUpdateStatus = async (newStatus: 'Terminada' | 'Cancelada') => {
    if (!selectedCita) return;
    if (!confirm(`¿Marcar cita como ${newStatus}? Desaparecerá de la agenda.`)) return;

    // --- HACK DE SEGURIDAD: REENVIAR LA FECHA ---
    // Tomamos la fecha que ya tiene la cita y la convertimos a formato ISO Local
    // Esto asegura que el servidor reciba la fecha y no la borre.
    const fechaObj = new Date(selectedCita.fecha);
    const offset = fechaObj.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(fechaObj.getTime() - offset).toISOString().slice(0, 16);

    try {
        const response = await fetch(API_ENDPOINTS.citas.actualizarEstado(selectedCita.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                estado: newStatus,
                horario_confirmado: fechaLocal // <--- LA CLAVE
            }) 
        });

        if (response.ok) {
            setSelectedCita(null);
            fetchCitas(); 
        } else {
            alert("Error al actualizar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión.");
    }
  };

  // 2. REAGENDAR
  const handleReagendar = async () => {
      if(!selectedCita || !newDateInput) return;
      try {
          const response = await fetch(API_ENDPOINTS.citas.actualizarEstado(selectedCita.id), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  estado: 'Confirmada', 
                  horario_confirmado: newDateInput 
              }) 
          });
          if (response.ok) {
              alert("Cita reagendada.");
              setIsRescheduling(false);
              setSelectedCita(null);
              fetchCitas();
          }
      } catch (error) { console.error(error); alert("Error al reagendar."); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa] font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm z-30 border-b border-gray-200 px-4 py-2 flex flex-col gap-2 h-auto shrink-0">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Link to="/inicio" className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">←</Link>
                <img src={PETCARE_ICON_URL} alt="Logo" className="h-6 w-auto" />
                <h1 className="text-base font-bold text-gray-800">Agenda</h1>
            </div>
            <div className="flex items-center bg-white border rounded-md shadow-sm p-0.5">
                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-2 py-1 hover:bg-gray-50 text-gray-600 border-r text-xs">‹</button>
                <span className="px-3 text-xs font-bold text-gray-700">
                    {startOfWeek.toLocaleDateString('es-MX', { month:'short', day:'numeric' })} - {addDays(startOfWeek, 6).toLocaleDateString('es-MX', { month:'short', day:'numeric' })}
                </span>
                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-2 py-1 hover:bg-gray-50 text-gray-600 border-l text-xs">›</button>
                <button onClick={() => setCurrentDate(new Date())} className="ml-2 text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded uppercase tracking-wider hover:bg-blue-100">Hoy</button>
            </div>
        </div>

        {/* BOTONES DE FILTRO */}
        {uniqueBranches.length > 0 && (
            <div className="flex flex-wrap gap-2 text-[10px] pt-1 pb-1 border-t border-gray-100">
                {uniqueBranches.map((branch) => {
                    const theme = getBranchColor(branch);
                    const isSelected = selectedBranches.includes(branch);

                    return (
                        <button 
                            key={branch} 
                            onClick={() => toggleBranchFilter(branch)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all duration-200 ${
                                isSelected 
                                    ? `${theme.bg} ${theme.border} shadow-sm` 
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isSelected ? theme.text.replace('text-', 'bg-').replace('900', '500') : 'bg-gray-300'}`}></div>
                            <span className={`font-bold ${isSelected ? theme.text : 'text-gray-500'}`}>
                                {branch}
                            </span>
                        </button>
                    );
                })}
            </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- CALENDARIO --- */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col relative scrollbar-thin">
            {/* Cabecera de Días */}
            <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b sticky top-0 bg-white z-20 shadow-sm">
                <div className="border-r bg-gray-50"></div>
                {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`py-1.5 text-center border-r border-gray-100 ${isToday ? 'bg-blue-50/80' : ''}`}>
                            <div className={`text-[10px] uppercase ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
                                {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                            </div>
                            <div className={`text-sm leading-none ${isToday ? 'text-blue-700 font-black' : 'text-gray-700 font-bold'}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid de 24 Horas */}
            <div className="relative grid grid-cols-[40px_repeat(7,1fr)]" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
                <div className="bg-gray-50 border-r z-10 relative">
                    {hours.map(hour => (
                        <div key={hour} className="text-[9px] text-gray-400 text-right pr-1 border-b border-transparent font-mono" 
                             style={{ height: `${HOUR_HEIGHT}px`, transform: 'translateY(-50%)', paddingTop: '2px' }}>
                            {hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`}
                        </div>
                    ))}
                </div>

                {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`border-r border-gray-100 relative ${isToday ? 'bg-blue-50/20' : ''}`}>
                            {hours.map(hour => (
                                <div key={hour} className="border-b border-gray-100 w-full" style={{ height: `${HOUR_HEIGHT}px` }}></div>
                            ))}
                        </div>
                    );
                })}

                {/* Citas Renderizadas */}
                {processedCitas.map(cita => {
                    const dayIndex = cita.fecha.getDay(); 
                    const startHour = cita.fecha.getHours();
                    const startMin = cita.fecha.getMinutes();
                    
                    const top = startHour * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT; 
                    const height = (cita.duracionMin / 60) * HOUR_HEIGHT;
                    
                    const theme = getBranchColor(cita.sucursal);
                    const widthPercent = 100 / (cita.maxCols || 1);
                    const leftPercent = widthPercent * (cita.colIndex || 0);

                    return (
                        <div 
                            key={cita.id}
                            onClick={() => { setSelectedCita(cita); setIsRescheduling(false); }}
                            className={`absolute m-[1px] px-1.5 py-0.5 rounded-[3px] border-l-[3px] shadow-sm cursor-pointer hover:brightness-95 hover:z-50 transition-all z-10 overflow-hidden ${theme.bg} ${theme.border} ${theme.text}`}
                            style={{
                                top: `${top}px`,
                                height: `${height - 2}px`,
                                left: `calc(40px + ${dayIndex * (100/7)}% + ${leftPercent/7}%)`, 
                                width: `calc(${widthPercent/7}% - 2px)`,
                                fontSize: '10px',
                                lineHeight: '1.1'
                            }}
                        >
                            <div className="font-bold truncate">{cita.hora} {cita.mascota}</div>
                            <div className="truncate opacity-80 text-[9px]">{cita.servicio}</div>
                        </div>
                    );
                })}
            </div>
        </main>

        {/* --- PANEL LATERAL DERECHO --- */}
        <aside className={`w-80 bg-white border-l shadow-2xl z-40 flex flex-col absolute right-0 top-0 bottom-0 transition-transform duration-300 ${selectedCita ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedCita && (
                <>
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="text-base font-bold text-gray-800 truncate w-56">{selectedCita.mascota}</h2>
                        <button onClick={() => setSelectedCita(null)} className="text-gray-400 hover:text-red-500 text-lg font-bold">✕</button>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto text-sm space-y-5">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Servicio</label>
                            <p className="font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{selectedCita.servicio}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Fecha</label>
                                <p className="font-medium">{selectedCita.fecha.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hora</label>
                                <p className="font-medium">{selectedCita.hora}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sucursal</label>
                            <div className={`flex items-center gap-2 p-2 rounded border ${getBranchColor(selectedCita.sucursal).bg} ${getBranchColor(selectedCita.sucursal).border}`}>
                                <div className={`w-2 h-2 rounded-full bg-current ${getBranchColor(selectedCita.sucursal).text}`}></div>
                                <p className={`font-bold ${getBranchColor(selectedCita.sucursal).text}`}>{selectedCita.sucursal}</p>
                            </div>
                        </div>
                        {selectedCita.notas && (
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800">
                                <strong>Nota:</strong> {selectedCita.notas}
                            </div>
                        )}

                        {isRescheduling && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-4 animate-fade-in">
                                <label className="block text-xs font-bold text-blue-800 mb-2">Selecciona nueva fecha:</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-blue-300 rounded p-1.5 text-xs bg-white mb-2 outline-none focus:ring-1 focus:ring-blue-500"
                                    onChange={(e) => setNewDateInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleReagendar} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-bold hover:bg-blue-700">Guardar</button>
                                    <button onClick={() => setIsRescheduling(false)} className="bg-white border border-gray-300 px-3 rounded text-xs hover:bg-gray-50">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isRescheduling && (
                        <div className="p-4 border-t bg-gray-50 space-y-2">
                            <button onClick={() => handleUpdateStatus('Terminada')} className="w-full py-2.5 rounded bg-green-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-green-700 shadow-sm">
                                ✓ Cita Terminada
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => setIsRescheduling(true)} className="flex-1 py-2 rounded border border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50">
                                    ↻ Reagendar
                                </button>
                                <button onClick={() => handleUpdateStatus('Cancelada')} className="flex-1 py-2 rounded border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50">
                                    ✕ Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </aside>
      </div>
    </div>
  );
};

export default Agenda;
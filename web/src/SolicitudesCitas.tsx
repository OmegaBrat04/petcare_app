import React, { useMemo, useState, useEffect } from "react";

// --- 1. INTERFAZ (BASADA EN LOS QUERIES) ---
// Representa el objeto JSON que esperamos de la API
interface SolicitudCitaDB {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notas: string | null;
  telefono_contacto: string | null;
  fecha_preferida: string;
  horario_confirmado: string | null;
  created_at: string;
  
  // --- Campos de JOINs ---
  mascota_nombre: string;
  mascota_raza: string;
  mascota_edad: string;
  mascota_peso: string;
  servicio_nombre: string;
}

// --- HELPERS DE FORMATO ---

/** Formatea un string ISO (Date o DateTime) a "10 nov 2025" */
const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Formatea un string ISO (Date o DateTime) para el input <input type="datetime-local"> */
const formatToDateTimeLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

// --- COMPONENTE PRINCIPAL ---

const SolicitudesCitasUI: React.FC = () => {
  const [query, setQuery] = useState("");
  const [solicitudes, setSolicitudes] = useState<SolicitudCitaDB[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"Todas" | "pending" | "confirmed" | "cancelled">("Todas");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [horarioConfirmadoInput, setHorarioConfirmadoInput] = useState<string>("");

  // --- 2. CARGA DE DATOS REAL (API FETCH) ---
  useEffect(() => {
    // Aquí es donde hacemos el fetch a tu API de backend
    const fetchCitas = async () => {
      try {
        // ¡ACTUALIZACIÓN AQUÍ! Puerto 3000 y ruta /api/web/citas
        const response = await fetch('http://localhost:3000/api/web/citas'); 
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data: SolicitudCitaDB[] = await response.json();
        
        setSolicitudes(data); // <-- Cargamos datos reales de la API
        
        // Seleccionar el primer elemento por defecto
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (error) {
        console.error("Error al cargar citas:", error);
        // Aquí podrías poner un estado de error para mostrar al usuario
      }
    };
    
    fetchCitas();

  }, []); // El array vacío asegura que solo se ejecute una vez

  // Lógica de filtrado
  const listaFiltrada = useMemo(() => {
    let data = solicitudes;
    if (filtroEstado !== "Todas") {
      data = data.filter((s) => s.status === filtroEstado);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (s) =>
          s.mascota_nombre.toLowerCase().includes(q) ||
          s.servicio_nombre.toLowerCase().includes(q) ||
          s.telefono_contacto?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, filtroEstado, solicitudes]);

  // Lógica de selección
  const seleccionado = useMemo(
    () => listaFiltrada.find((s) => s.id === selectedId) || listaFiltrada[0] || null,
    [selectedId, listaFiltrada]
  );

  // Efecto para actualizar el input de fecha cuando cambia la selección
  useEffect(() => {
    if (seleccionado) {
      if (seleccionado.horario_confirmado) {
        setHorarioConfirmadoInput(formatToDateTimeLocal(seleccionado.horario_confirmado));
      } else {
        // Usamos la fecha preferida pero sin hora, para que el input muestre la fecha
        // y el usuario elija la hora. "T09:00" era una suposición, es mejor dejarlo vacío.
        const fechaBase = seleccionado.fecha_preferida.split('T')[0]; // Asegura que solo sea AAAA-MM-DD
        setHorarioConfirmadoInput(`${fechaBase}T09:00`); // Sugerimos las 9:00 AM
      }
    }
  }, [seleccionado]);


  // Helper para los chips de estado
  const getStatusChip = (status: SolicitudCitaDB["status"]) => {
    switch (status) {
      case "pending": return { text: "Pendiente", class: "bg-yellow-100 text-yellow-800" };
      case "confirmed": return { text: "Confirmada", class: "bg-green-100 text-green-800" };
      case "cancelled": return { text: "Rechazada", class: "bg-red-100 text-red-800" };
    }
  };

  // Handlers para el Modal
  const handleOpenModal = () => {
    setContactMessage("");
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSendMessage = () => {
    console.log("Enviando mensaje:", contactMessage);
    handleCloseModal();
  };

  // Handler para confirmar cita
  const handleConfirmarCita = () => {
    console.log(`Cita confirmada para ${seleccionado?.mascota_nombre} en la fecha: ${horarioConfirmadoInput}`);
    // Aquí es donde harías el `fetch` a tu API para actualizar la cita (ej. PUT /api/citas/:id)
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-white via-blue-50/60 to-blue-100/30 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Solicitudes de Cita</h1>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as "Todas" | "pending" | "confirmed" | "cancelled")}
              aria-label="Filtrar por estado"
            >
              <option value="Todas">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Rechazada</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl w-full px-4 py-4 flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden min-h-0">
        
        {/* Tabla (Maestro) */}
        <section className="w-full lg:w-1/2 rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-100/50 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <input
              className="w-full rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50 transition-colors duration-150 ease-in-out"
              placeholder="Buscar por mascota, servicio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-50/80">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Mascota</th>
                  <th className="px-4 py-2 font-medium">Servicio</th>
                  <th className="px-4 py-2 font-medium">Fecha Pref.</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((s) => {
                  const statusChip = getStatusChip(s.status);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`cursor-pointer border-t border-blue-50 hover:bg-blue-50/60 transition-colors duration-150 ease-in-out ${
                        seleccionado?.id === s.id
                          ? "bg-blue-50/90 border-l-4 border-blue-600"
                          : "bg-white border-l-4 border-transparent"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{s.mascota_nombre}</td>
                      <td className="px-4 py-3 text-gray-700">{s.servicio_nombre}</td>
                      <td className="px-4 py-3">{formatShortDate(s.fecha_preferida)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusChip.class}`}>
                          {statusChip.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {listaFiltrada.length === 0 && (
              <div className="p-4">
                <EmptyState>No se encontraron solicitudes.</EmptyState>
              </div>
            )}
          </div>
        </section>

        {/* Detalle */}
        <section className="w-full lg:w-1/2 rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-100/50 flex flex-col overflow-hidden">
          {seleccionado ? (
            <>
              {/* Encabezado detalle (FIJO) */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{seleccionado.mascota_nombre}</h2>
                    <p className="text-sm text-gray-600">{seleccionado.servicio_nombre}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {seleccionado.mascota_raza} • {seleccionado.mascota_edad} • {seleccionado.mascota_peso}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusChip(seleccionado.status).class}`}>
                    {getStatusChip(seleccionado.status).text}
                  </span>
                </div>
                {/* Botones de Acción (FIJOS) */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleConfirmarCita}
                    className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm shadow-sm hover:bg-blue-700 transition-colors duration-150 ease-in-out"
                  >
                    Confirmar Cita
                  </button>
                  <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                    Rechazar
                  </button>
                  <button
                    onClick={handleOpenModal}
                    className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50 transition-colors duration-150 ease-in-out"
                  >
                    Contactar
                  </button>
                </div>
              </div>

              {/* Panel de Información (SCROLL) */}
              <div className="flex-1 overflow-auto p-4 min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Columna 1 */}
                  <div className="space-y-4">
                    <Info label="Fecha Preferida (Cliente)" value={formatShortDate(seleccionado.fecha_preferida)} />
                    
                    <div className="text-sm">
                      <label className="text-gray-500" htmlFor="fechaConfirmadaInput">
                        Confirmar Fecha y Hora
                      </label>
                      <input
                        id="fechaConfirmadaInput"
                        type="datetime-local"
                        value={horarioConfirmadoInput}
                        onChange={(e) => setHorarioConfirmadoInput(e.target.value)}
                        className="w-full rounded-lg border border-blue-200 text-blue-700 px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <Info label="Teléfono de Contacto" value={seleccionado.telefono_contacto} />
                  </div>

                  {/* Columna 2 */}
                  <div className="space-y-4">
                    <Info label="Servicio Solicitado" value={seleccionado.servicio_nombre} />
                    <Info label="Fecha de Solicitud" value={formatShortDate(seleccionado.created_at)} />
                  </div>
                </div>

                {/* Motivo */}
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Motivo de la consulta</div>
                  <p className="text-sm font-medium p-3 bg-blue-50/60 rounded-lg border border-blue-100 mt-1 min-h-[80px] whitespace-pre-wrap break-words">
                    {seleccionado.notas || "—"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState>Cargando solicitudes...</EmptyState>
            </div>
          )}
        </section>
      </main>

      {/* --- RENDERIZADO DEL MODAL --- */}
      {isModalOpen && (
        <ContactModal
          message={contactMessage}
          setMessage={setContactMessage}
          onClose={handleCloseModal}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

interface InfoProps { label: string; value?: string | null; }
const Info: React.FC<InfoProps> = ({ label, value }) => (
  <div className="text-sm">
    <div className="text-gray-500">{label}</div>
    <div className="font-medium">{value || "—"}</div>
  </div>
);

interface EmptyStateProps { children: React.ReactNode; }
const EmptyState: React.FC<EmptyStateProps> = ({ children }) => (
  <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center text-blue-600 text-sm">
    {children}
  </div>
);

// --- MODAL DE CONTACTO ---

interface ContactModalProps {
  message: string;
  setMessage: (msg: string) => void;
  onClose: () => void;
  onSend: () => void;
}
const ContactModal: React.FC<ContactModalProps> = ({ message, setMessage, onClose, onSend }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Contactar al Cliente</h3>
        <p className="text-sm text-gray-600 mt-1">Escribe un mensaje para el propietario.</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50 mt-4 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors duration-150 ease-in-out"
          placeholder="Escribe tu mensaje aquí..."
        />
      </div>
      <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 ease-in-out"
        >
          Cancelar
        </button>
        <button
          onClick={onSend}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm shadow-sm hover:bg-blue-700 transition-colors duration-150 ease-in-out"
        >
          Enviar Mensaje
        </button>
      </div>
    </div>
  </div>
);

export default SolicitudesCitasUI;
import React, { useMemo, useState, ChangeEvent, MouseEventHandler, ReactNode } from "react";

// --- Definiciones de Tipos ---

// Tipos literales para estados específicos (mejora la autocompletación y seguridad)
type EstadoComunicacion = "Consentido" | "No consiente" | "Pendiente";
type EstadoFiltro = "Todos" | EstadoComunicacion;
type RolUsuario = "Recepción" | "Admin";
type TabActiva = "datos" | "mascotas" | "citas" | "facturacion";

// Interfaces para la estructura de los datos
interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
}

interface Cita {
  id: string;
  fecha: string;
  motivo: string;
  sucursal: string;
  estado: string;
}

interface Factura {
  id: string;
  folio: string;
  fecha: string;
  total: number;
  estatus: "Pagada" | string; // Se puede expandir si hay más estatus
}

// Interface principal que define un Propietario
interface Propietario {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  mascotas: Mascota[];
  ultimaCita: string;
  estadoCom: EstadoComunicacion;
  historialCitas: Cita[];
  facturas: Factura[];
}

// --- Datos de ejemplo (Ahora tipados) ---
const propietarios: Propietario[] = [
  {
    id: 1,
    nombre: "Ana López",
    telefono: "555-123-4567",
    email: "ana.lopez@email.com",
    direccion: "456 Calle B, Ciudad",
    mascotas: [
      { id: "m1", nombre: "Luna", especie: "Felino", raza: "Siames" },
      // ===================================
      // AQUÍ ESTABA EL ERROR (FALTABAN COMILLAS EN "m2")
      // ===================================
      { id: "m2", nombre: "Toby", especie: "Canino", raza: "Pug" },
    ],
    ultimaCita: "15 abr 2024",
    estadoCom: "Consentido",
    historialCitas: [
      { id: "c1", fecha: "15 abr 2024", motivo: "Control anual", sucursal: "Central", estado: "Completada" },
      { id: "c2", fecha: "05 feb 2024", motivo: "Vacuna", sucursal: "Central", estado: "Completada" },
    ],
    facturas: [
      { id: "f1", folio: "A-00123", fecha: "15 abr 2024", total: 820.0, estatus: "Pagada" },
    ],
  },
  {
    id: 2,
    nombre: "Carlos Gómez",
    telefono: "—",
    email: "ana.lopez@email.com",
    direccion: "Av. Alameda 120",
    mascotas: [{ id: "m3", nombre: "Thor", especie: "Canino", raza: "Golden Retriever" }],
    ultimaCita: "No consiente",
    estadoCom: "No consiente",
    historialCitas: [
      { id: "c3", fecha: "20 mar 2024", motivo: "Baño y estética", sucursal: "Oeste", estado: "Completada" },
    ],
    facturas: [],
  },
  {
    id: 3,
    nombre: "María Torres",
    telefono: "456 Calle B, Ciudad",
    email: "—",
    direccion: "456 Calle B, Ciudad",
    mascotas: [{ id: "m4", nombre: "Momo", especie: "Felino", raza: "Doméstico" }],
    ultimaCita: "28 mar 2024",
    estadoCom: "Pendiente",
    historialCitas: [],
    facturas: [],
  },
  {
    id: 4,
    nombre: "Laura Díaz",
    telefono: "—",
    email: "Laura.diaz.com",
    direccion: "Col. Centro",
    mascotas: [{ id: "m5", nombre: "Lucky", especie: "Canino", raza: "Beagle" }],
    ultimaCita: "04 abr 2024",
    estadoCom: "Consentido",
    historialCitas: [],
    facturas: [],
  },
];

const estadoOptions: EstadoFiltro[] = ["Todos", "Consentido", "No consiente", "Pendiente"];

// --- Props para Componentes ---
interface ChipProps {
  children: ReactNode;
  tone?: string;
}

const Chip = ({ children, tone = "blue" }: ChipProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200`}
  >
    {children}
  </span>
);

interface TabButtonProps {
  active: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
      active
        ? "border-blue-600 text-blue-700"
        : "border-transparent text-blue-600/70 hover:text-blue-800 hover:border-blue-200"
    }`}
  >
    {children}
  </button>
);

export default function PropietariosUI() {
  // --- Estados Tipados ---
  const [query, setQuery] = useState<string>("");
  const [estado, setEstado] = useState<EstadoFiltro>("Todos");
  const [selectedId, setSelectedId] = useState<number>(propietarios[0].id);
  const [tab, setTab] = useState<TabActiva>("datos");
  
  // =================================================================
  // ESTA ES LA SOLUCIÓN PARA EL ERROR DE LA LÍNEA 306
  // Al añadir ": RolUsuario", le decimos a TS que "rol" puede ser
  // "Recepción" O "Admin", haciendo válida la comparación.
  // =================================================================
  const rol: RolUsuario = "Recepción"; // Cambia a "Admin" para ver todos los controles

  const listaFiltrada: Propietario[] = useMemo(() => {
    let data = propietarios;
    if (estado !== "Todos") {
      data = data.filter((p) => p.estadoCom === estado);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.telefono.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, estado]);

  // El tipo es Propietario | undefined (si la listaFiltrada estuviera vacía)
  const seleccionado = useMemo(
    () => listaFiltrada.find((p) => p.id === selectedId) || listaFiltrada[0],
    [selectedId, listaFiltrada]
  );

  // --- Manejadores de Eventos Tipados ---
  const handleEstadoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // Usamos 'as' para decirle a TS que confiamos en que el valor es del tipo correcto
    setEstado(e.target.value as EstadoFiltro);
  };

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // --- Funciones Internas Tipadas ---
  function toggleConsentimiento(p: Propietario) {
    const next: EstadoComunicacion = p.estadoCom === "Consentido" ? "Pendiente" : "Consentido";
    
    // Actualiza en vivo el array para demo
    const idx = propietarios.findIndex((x) => x.id === p.id);
    if (idx >= 0) {
      propietarios[idx] = { ...propietarios[idx], estadoCom: next };
    }
    // fuerza refresco cambiando el id seleccionado (hack simple para demo)
    setSelectedId((v) => (v === p.id ? -1 : p.id));
    setTimeout(() => setSelectedId(p.id), 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/60 to-blue-100/30 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Propietarios</h1>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm border-blue-200 text-blue-700"
              value={estado}
              onChange={handleEstadoChange}
            >
              {estadoOptions.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
            <button className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm shadow-sm hover:bg-blue-700">
              + Nuevo propietario
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tabla */}
        <section className="lg:col-span-7 rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-100/50">
          <div className="p-3 border-b border-blue-100 flex items-center gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm border-blue-200"
              placeholder="Buscar por nombre, teléfono o email..."
              value={query}
              onChange={handleQueryChange}
            />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-50/80">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Contacto</th>
                  <th className="px-4 py-2 font-medium">Mascotas</th>
                  <th className="px-4 py-2 font-medium">Últimas citas</th>
                  <th className="px-4 py-2 font-medium">Estado com.</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((p) => ( // 'p' es inferido como tipo Propietario
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setTab("datos");
                    }}
                    className={`cursor-pointer border-t border-blue-50 hover:bg-blue-50/60 ${
                      seleccionado?.id === p.id ? "bg-blue-50/90 ring-1 ring-inset ring-blue-200" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-700">{p.telefono !== "—" ? p.telefono : p.email}</td>
                    <td className="px-4 py-3">{p.mascotas.length}</td>
                    <td className="px-4 py-3">{p.ultimaCita}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          p.estadoCom === "Consentido"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : p.estadoCom === "Pendiente"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {p.estadoCom}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detalle */}
        <section className="lg:col-span-5 rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-100/50">
          {seleccionado ? (
            <div className="flex flex-col h-full">
              {/* Encabezado detalle */}
              <div className="p-4 border-b border-blue-100 flex items-start justify-between">
                <div>
                  {/* TypeScript sabe que 'seleccionado' existe aquí */}
                  <h2 className="text-lg font-semibold">{seleccionado.nombre}</h2>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Chip>{seleccionado.estadoCom}</Chip>
                    <Chip>
                      {seleccionado.mascotas.length} mascota{seleccionado.mascotas.length !== 1 ? "s" : ""}
                    </Chip>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Line icon="☎" label="Teléfono" value={seleccionado.telefono} />
                    <Line icon="✉" label="Email" value={seleccionado.email} />
                    <Line icon="⌂" label="Dirección" value={seleccionado.direccion} />
                    <Line icon="🗓" label="Última cita" value={seleccionado.ultimaCita} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* ESTA ES LA LÍNEA 306 (APROX) QUE DABA ERROR */}
                  {/* AHORA DEBERÍA ESTAR CORRECTA */}
                  {(rol === "Admin" || rol === "Recepción") && (
                    <>
                      <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Editar</button>
                      <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Recordatorio</button>
                      <button
                        className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50"
                        onClick={() => toggleConsentimiento(seleccionado)}
                      >
                        Marcar consentimiento
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 pt-2">
                <nav className="flex gap-4">
                  <TabButton active={tab === "datos"} onClick={() => setTab("datos")}>Datos</TabButton>
                  <TabButton active={tab === "mascotas"} onClick={() => setTab("mascotas")}>Mascotas vinculadas</TabButton>
                  <TabButton active={tab === "citas"} onClick={() => setTab("citas")}>Historial de citas</TabButton>
                  <TabButton active={tab === "facturacion"} onClick={() => setTab("facturacion")}>Facturación</TabButton>
                </nav>
              </div>

              {/* Paneles */}
              <div className="p-4">
                {tab === "datos" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Info label="Teléfono" value={seleccionado.telefono} />
                    <Info label="Email" value={seleccionado.email} />
                    <Info label="Dirección" value={seleccionado.direccion} />
                    <Info label="Consentimiento" value={seleccionado.estadoCom} />
                  </div>
                )}

                {tab === "mascotas" && (
                  <div className="space-y-2">
                    {seleccionado.mascotas.length === 0 ? (
                      <EmptyState>Sin mascotas vinculadas</EmptyState>
                    ) : (
                      seleccionado.mascotas.map((m) => ( // 'm' es inferido como tipo Mascota
                        <div key={m.id} className="rounded-xl border border-blue-100 p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{m.nombre}</div>
                            <div className="text-xs text-gray-600">{m.especie} • {m.raza}</div>
                          </div>
                          <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Ver paciente</button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === "citas" && (
                  <ListTable
                    cols={["Fecha", "Motivo", "Sucursal", "Estado"]}
                    rows={seleccionado.historialCitas.map((c) => [c.fecha, c.motivo, c.sucursal, c.estado])}
                    emptyMsg="Sin historial de citas"
                  />
                )}

                {tab === "facturacion" && (
                  <ListTable
                    cols={["Folio", "Fecha", "Total", "Estatus"]}
                    rows={seleccionado.facturas.map((f) => [f.folio, f.fecha, `$${f.total.toFixed(2)}`, f.estatus])}
                    emptyMsg="Sin facturas"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-6"><EmptyState>Selecciona un propietario</EmptyState></div>
          )}
        </section>
      </main>
    </div>
  );
}

// --- Props para Componentes Auxiliares ---

interface LineProps {
  icon: string;
  label: string;
  value: string;
}

function Line({ icon, label, value }: LineProps) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5">{icon}</span>
      <div>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

interface InfoProps {
  label: string;
  value: string;
}

function Info({ label, value }: InfoProps) {
  return (
    <div className="text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

interface ListTableProps {
  cols: string[];
  rows: (string | number)[][];
  emptyMsg: string;
}

function ListTable({ cols, rows, emptyMsg }: ListTableProps) {
  if (!rows || rows.length === 0) {
    return <EmptyState>{emptyMsg}</EmptyState>;
  }
  return (
    <div className="overflow-auto border border-blue-100 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-blue-50">
          <tr className="text-left text-gray-600">
            {cols.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-blue-50">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2">{String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EmptyStateProps {
  children: ReactNode;
}

function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center text-blue-600 text-sm">
      {children}
    </div>
  );
}
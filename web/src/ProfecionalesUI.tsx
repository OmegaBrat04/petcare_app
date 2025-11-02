import React, { useState, useMemo } from "react"; // Esta línea ya la corregiste

// --- Datos de ejemplo (sin especialidad) ---
const profesionales = [
  {
    id: 1,
    nombre: "Laura Gómez",
    sucursal: "Central",
    disponibilidad: "Disponible",
    telefono: "555-100-2000",
    email: "laura.gomez@vet.com",
    bio: "Atención general y cirugía menor. Amante de los gatos rescatados.",
    horarios: [
      { dia: "Lun", inicio: "09:00", fin: "14:00" },
      { dia: "Mie", inicio: "12:00", fin: "18:00" },
      { dia: "Vie", inicio: "09:00", fin: "14:00" },
    ],
    permisos: ["Admin"],
  },
  {
    id: 2,
    nombre: "Juan Pérez",
    sucursal: "Este",
    disponibilidad: "Disponible",
    telefono: "555-300-4000",
    email: "juan.perez@vet.com",
    bio: "Clínica general, control preventivo y manejo de vacunas.",
    horarios: [
      { dia: "Mar", inicio: "10:00", fin: "16:00" },
      { dia: "Jue", inicio: "10:00", fin: "16:00" },
    ],
    permisos: ["Dueño"],
  },
  {
    id: 3,
    nombre: "Marta Ruiz",
    sucursal: "Oeste",
    disponibilidad: "En consulta",
    telefono: "555-700-1122",
    email: "marta.ruiz@vet.com",
    bio: "Seguimiento de pacientes crónicos y nutrición.",
    horarios: [
      { dia: "Lun", inicio: "12:00", fin: "18:00" },
      { dia: "Sab", inicio: "09:00", fin: "13:00" },
    ],
    permisos: [],
  },
  {
    id: 4,
    nombre: "Carlos Sanchez",
    sucursal: "Norte",
    disponibilidad: "Ausente",
    telefono: "555-888-9999",
    email: "carlos.sanchez@vet.com",
    bio: "Control postoperatorio y curaciones.",
    horarios: [
      { dia: "Mar", inicio: "09:00", fin: "14:00" },
      { dia: "Jue", inicio: "09:00", fin: "14:00" },
    ],
    permisos: [],
  },
];

const sucursales = ["Todas", "Central", "Este", "Oeste", "Norte"];
const estados = ["Todos", "Disponible", "En consulta", "Ausente"];

const Status = ({ value }: { value: string }) => {
  const map: Record<string, string> = {
    Disponible: "bg-green-500",
    "En consulta": "bg-yellow-500",
    Ausente: "bg-red-500",
  };
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${map[value] || "bg-gray-300"}`}></span>
      <span className="font-medium">{value}</span>
    </span>
  );
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="chip chip-blue">{children}</span>
);

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`tab-button ${active ? "active" : ""}`}
  >
    {children}
  </button>
);

export default function ProfesionalesUI() {
  const [query, setQuery] = useState("");
  const [fSuc, setFSuc] = useState("Todas");
  const [fEst, setFEst] = useState("Todos");
  const [selectedId, setSelectedId] = useState(profesionales[1].id);
  const [tab, setTab] = useState("datos");
  const [rol] = useState<"Admin" | "Dueño" | "Otro">("Admin"); // ✅ Corregido para tipado correcto

  const listaFiltrada = useMemo(() => {
    let data = profesionales;
    if (fSuc !== "Todas") data = data.filter((p) => p.sucursal === fSuc);
    if (fEst !== "Todos") data = data.filter((p) => p.disponibilidad === fEst);
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return data;
  }, [query, fSuc, fEst]);

  const seleccionado = useMemo(
    () => listaFiltrada.find((p) => p.id === selectedId) || listaFiltrada[0],
    [selectedId, listaFiltrada]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/60 to-blue-100/30 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profesionales</h1>
          <div className="flex items-center gap-2">
            <select
              className="select-filter"
              value={fSuc}
              onChange={(e) => setFSuc(e.target.value)}
            >
              {sucursales.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="select-filter"
              value={fEst}
              onChange={(e) => setFEst(e.target.value)}
            >
              {estados.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {(rol === "Admin" || rol === "Dueño") && (
              <button className="btn-primary">+ Nuevo profesional</button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tabla */}
        <section className="lg:col-span-7 card">
          <div className="p-3 border-b border-blue-100 flex items-center gap-3">
            <input
              className="input-search"
              placeholder="Buscar por nombre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-auto">
            <table className="table-base">
              <thead className="sticky top-0 bg-blue-50/80">
                <tr>
                  <th>Nombre</th>
                  <th>Sucursal</th>
                  <th>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setTab("datos");
                    }}
                    className={`cursor-pointer ${
                      seleccionado?.id === p.id
                        ? "bg-blue-50/90 ring-1 ring-inset ring-blue-200"
                        : "hover:bg-blue-50/60"
                    }`}
                  >
                    <td className="font-medium">{p.nombre}</td>
                    <td>{p.sucursal}</td>
                    <td>
                      <Status value={p.disponibilidad} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detalle */}
        <section className="lg:col-span-5 card">
          {seleccionado ? (
            <div className="flex flex-col h-full">
              {/* Encabezado detalle */}
              <div className="p-4 border-b border-blue-100 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="avatar-circle">
                    {seleccionado.nombre.split(" ")[0][0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{seleccionado.nombre}</h2>
                    <div className="text-sm text-gray-600">{seleccionado.sucursal}</div>
                    <div className="mt-2">
                      <Status value={seleccionado.disponibilidad} />
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {seleccionado.permisos.map((p) => (
                        <Chip key={p}>{p}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button className="btn-secondary">Configurar agenda</button>
                  <button className="btn-secondary">Vacaciones / ausencias</button>
                  {(rol === "Admin" || rol === "Dueño") && (
                    <button className="btn-secondary">Permisos de usuario</button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 pt-2">
                <nav className="flex gap-4">
                  <TabButton active={tab === "datos"} onClick={() => setTab("datos")}>Datos</TabButton>
                  <TabButton active={tab === "turnos"} onClick={() => setTab("turnos")}>Horario/turnos</TabButton>
                  <TabButton active={tab === "bio"} onClick={() => setTab("bio")}>Bio pública</TabButton>
                </nav>
              </div>

              {/* Paneles */}
              <div className="p-4">
                {tab === "datos" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Info label="Teléfono" value={seleccionado.telefono} />
                    <Info label="Email" value={seleccionado.email} />
                    <Info label="Sucursal" value={seleccionado.sucursal} />
                    <Info label="Disponibilidad" value={seleccionado.disponibilidad} />
                  </div>
                )}

                {tab === "turnos" && (
                  <ListTable
                    cols={["Día", "Inicio", "Fin"]}
                    rows={seleccionado.horarios.map((h) => [h.dia, h.inicio, h.fin])}
                    emptyMsg="Sin turnos configurados"
                  />
                )}

                {tab === "bio" && (
                  <div className="space-y-3">
                    {seleccionado.bio ? (
                      <p className="text-sm leading-relaxed">{seleccionado.bio}</p>
                    ) : (
                      <EmptyState>Sin bio pública</EmptyState>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6"><EmptyState>Selecciona un profesional</EmptyState></div>
          )}
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

function ListTable({
  cols,
  rows,
  emptyMsg,
}: {
  cols: string[];
  rows: (string | number)[][];
  emptyMsg: string;
}) {
  if (!rows || rows.length === 0) {
    return <EmptyState>{emptyMsg}</EmptyState>;
  }
  return (
    <div className="overflow-auto border border-blue-100 rounded-xl">
      <table className="table-base">
        <thead className="bg-blue-50">
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">{children}</div>
  );
}

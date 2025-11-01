import React, { useMemo, useState } from "react";

// Definición de tipos
interface Propietario {
  nombre: string;
  direccion: string;
}

interface Vacuna {
  id: string;
  fecha: string;
  lote: string;
  veterinaria: string;
  adjuntos: number;
}

interface Desparasitacion {
  id: string;
  tipo: string;
  producto: string;
  fecha: string;
}

interface Historial {
  id: string;
  fecha: string;
  nota: string;
}

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  fecha: string;
}

interface Paciente {
  id: number;
  nombre: string;
  especie: "Canino" | "Felino";
  raza: string;
  propietario: Propietario;
  edad: string;
  ultimaVisita: string;
  sucursal: string;
  microchip: string;
  sexo: "Macho" | "Hembra";
  peso: string;
  fechaNac: string;
  vacunas: Vacuna[];
  desparasitaciones: Desparasitacion[];
  historial: Historial[];
  documentos: Documento[];
  etiquetas: string[];
}

// Props de componentes
interface ChipProps {
  children: React.ReactNode;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface InfoProps {
  label: string;
  value?: string;
}

interface ListTableProps {
  cols: string[];
  rows: (string | number)[][];
  emptyMsg: string;
}

interface EmptyStateProps {
  children: React.ReactNode;
}

const pacientes: Paciente[] = [
  {
    id: 1,
    nombre: "Luna",
    especie: "Felino",
    raza: "Siames",
    propietario: { nombre: "Ana López", direccion: "456 Calle B, Ciudad" },
    edad: "5 años",
    ultimaVisita: "15 abr 2024",
    sucursal: "Central",
    microchip: "981020000123456",
    sexo: "Hembra",
    peso: "4.5 kg",
    fechaNac: "2019-03-10",
    vacunas: [
      { id: "v1", fecha: "05 feb 2024", lote: "LOT-AZ12", veterinaria: "Central", adjuntos: 1 },
      { id: "v2", fecha: "15 ago 2023", lote: "LOT-ME88", veterinaria: "Central", adjuntos: 0 },
    ],
    desparasitaciones: [
      { id: "d1", tipo: "Interna", producto: "Albendazol", fecha: "10 ene 2024" },
      { id: "d2", tipo: "Externa", producto: "Fipronil", fecha: "10 ene 2024" },
    ],
    historial: [
      { id: "h1", fecha: "15 abr 2024", nota: "Consulta por control anual. Examen físico normal." },
      { id: "h2", fecha: "20 nov 2023", nota: "Limpieza dental. Envío de cuidados postoperatorios." },
    ],
    documentos: [
      { id: "doc1", tipo: "PDF", nombre: "Constancia vacunación.pdf", fecha: "05 feb 2024" },
    ],
    etiquetas: ["Esterilizada", "Al día"],
  },
  {
    id: 2,
    nombre: "Thor",
    especie: "Canino",
    raza: "Golden Retriever",
    propietario: { nombre: "Carlos Gómez", direccion: "Av. Alameda 120" },
    edad: "3 años",
    ultimaVisita: "20 mar 2024",
    sucursal: "Oeste",
    microchip: "980000000001234",
    sexo: "Macho",
    peso: "28 kg",
    fechaNac: "2021-01-02",
    vacunas: [],
    desparasitaciones: [],
    historial: [],
    documentos: [],
    etiquetas: ["Cachorro grande"],
  },
  {
    id: 3,
    nombre: "Momo",
    especie: "Felino",
    raza: "Doméstico britz.",
    propietario: { nombre: "María Torres", direccion: "C. 9 oriente" },
    edad: "1 año",
    ultimaVisita: "08 abr 2024",
    sucursal: "Central",
    microchip: "981020000009876",
    sexo: "Macho",
    peso: "3.2 kg",
    fechaNac: "2024-04-05",
    vacunas: [],
    desparasitaciones: [],
    historial: [],
    documentos: [],
    etiquetas: [],
  },
  {
    id: 4,
    nombre: "Lucky",
    especie: "Canino",
    raza: "Beagle",
    propietario: { nombre: "Laura Díaz", direccion: "Col. Centro" },
    edad: "2 años",
    ultimaVisita: "25 feb 2024",
    sucursal: "Este",
    microchip: "980000000009999",
    sexo: "Macho",
    peso: "10.1 kg",
    fechaNac: "2023-03-18",
    vacunas: [],
    desparasitaciones: [],
    historial: [],
    documentos: [],
    etiquetas: ["Alergia pulgas"],
  },
];

const Chip: React.FC<ChipProps> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs text-blue-700 bg-blue-50">
    {children}
  </span>
);

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
      active ? "border-blue-600 text-blue-700" : "border-transparent text-blue-600/70 hover:text-blue-800 hover:border-blue-200"
    }`}
  >
    {children}
  </button>
);

// Componente principal con tipos
const PacientesUI: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(pacientes[0].id);
  const [tab, setTab] = useState<"perfil" | "vacunas" | "desparasitaciones" | "historial" | "documentos">("perfil");
  const [filtroEspecie, setFiltroEspecie] = useState<"Todas" | "Canino" | "Felino">("Todas");

  const listaFiltrada = useMemo(() => {
    let data = pacientes;
    if (filtroEspecie !== "Todas") {
      data = data.filter((p) => p.especie === filtroEspecie);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.propietario.nombre.toLowerCase().includes(q) ||
          p.raza.toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, filtroEspecie]);

  const seleccionado = useMemo(
    () => listaFiltrada.find((p) => p.id === selectedId) || listaFiltrada[0],
    [selectedId, listaFiltrada]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/60 to-blue-100/30 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pacientes</h1>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filtroEspecie}
              onChange={(e) => setFiltroEspecie(e.target.value as "Todas" | "Canino" | "Felino")}
              aria-label="Filtrar por especie"
            >
              <option value="Todas">Todas</option>
              <option value="Canino">Canino</option>
              <option value="Felino">Felino</option>
            </select>
            <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Rango de fechas</button>
            <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Profesional</button>
            <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Etiquetas</button>
            <button className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm shadow-sm hover:bg-blue-700">+ Nueva mascota</button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tabla */}
        <section className="lg:col-span-7 rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-100/50">
          <div className="p-3 border-b flex items-center gap-3">
            <input
              className="w-full rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50"
              placeholder="Buscar por nombre, propietario o raza..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Filtros</button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-50/80">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Especie / Raza</th>
                  <th className="px-4 py-2 font-medium">Propietario</th>
                  <th className="px-4 py-2 font-medium">Edad</th>
                  <th className="px-4 py-2 font-medium">Última visita</th>
                  <th className="px-4 py-2 font-medium">Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setTab("perfil");
                    }}
                    className={`cursor-pointer border-t border-blue-50 hover:bg-blue-50/60 ${
                      seleccionado?.id === p.id ? "bg-blue-50/90 ring-1 ring-inset ring-blue-200" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-700">{p.especie} / {p.raza}</td>
                    <td className="px-4 py-3">{p.propietario.nombre}</td>
                    <td className="px-4 py-3">{p.edad}</td>
                    <td className="px-4 py-3">{p.ultimaVisita}</td>
                    <td className="px-4 py-3">{p.sucursal}</td>
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
              <div className="p-4 border-b flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{seleccionado.nombre}</h2>
                  <p className="text-sm text-gray-600">{seleccionado.especie} • {seleccionado.raza}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {seleccionado.etiquetas.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Editar</button>
                  <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Imprimir</button>
                  <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Adjuntar</button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 pt-2">
                <nav className="flex gap-4">
                  <TabButton active={tab === "perfil"} onClick={() => setTab("perfil")}>Perfil</TabButton>
                  <TabButton active={tab === "vacunas"} onClick={() => setTab("vacunas")}>Vacunas</TabButton>
                  <TabButton active={tab === "desparasitaciones"} onClick={() => setTab("desparasitaciones")}>Desparasitaciones</TabButton>
                  <TabButton active={tab === "historial"} onClick={() => setTab("historial")}>Historial clínico</TabButton>
                  <TabButton active={tab === "documentos"} onClick={() => setTab("documentos")}>Documentos</TabButton>
                </nav>
              </div>

              {/* Paneles */}
              <div className="p-4">
                {tab === "perfil" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Info label="Microchip" value={seleccionado.microchip} />
                      <Info label="Sexo" value={seleccionado.sexo} />
                      <Info label="Peso" value={seleccionado.peso} />
                      <Info label="Fecha nac." value={seleccionado.fechaNac} />
                      <Info label="Última visita" value={seleccionado.ultimaVisita} />
                    </div>
                    <div className="space-y-2">
                      <Info label="Propietario" value={seleccionado.propietario.nombre} />
                      <Info label="Dirección" value={seleccionado.propietario.direccion} />
                      <div className="rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center h-32">
                        <span className="text-blue-300">Foto / avatar</span>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "vacunas" && (
                  <ListTable
                    cols={["Fecha", "Lote", "Veterinaria", "Adjuntos"]}
                    rows={seleccionado.vacunas.map((v) => [v.fecha, v.lote, v.veterinaria, v.adjuntos])}
                    emptyMsg="Sin registros de vacunas"
                  />
                )}

                {tab === "desparasitaciones" && (
                  <ListTable
                    cols={["Tipo", "Producto", "Fecha"]}
                    rows={seleccionado.desparasitaciones.map((d) => [d.tipo, d.producto, d.fecha])}
                    emptyMsg="Sin registros de desparasitación"
                  />
                )}

                {tab === "historial" && (
                  <div className="space-y-3">
                    {seleccionado.historial.length === 0 && (
                      <EmptyState>Sin notas clínicas</EmptyState>
                    )}
                    {seleccionado.historial.map((h) => (
                      <div key={h.id} className="rounded-xl border p-3">
                        <div className="text-xs text-gray-600 mb-1">{h.fecha}</div>
                        <p className="text-sm">{h.nota}</p>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "documentos" && (
                  <div className="space-y-3">
                    {seleccionado.documentos.length === 0 && (
                      <EmptyState>Sin documentos</EmptyState>
                    )}
                    {seleccionado.documentos.map((d) => (
                      <div key={d.id} className="rounded-xl border p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{d.nombre}</div>
                          <div className="text-xs text-gray-600">{d.tipo} • {d.fecha}</div>
                        </div>
                        <button className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-sm hover:bg-blue-50">Ver</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6"><EmptyState>Selecciona un paciente</EmptyState></div>
          )}
        </section>
      </main>
    </div>
  );
};

const Info: React.FC<InfoProps> = ({ label, value }) => (
  <div className="text-sm">
    <div className="text-gray-500">{label}</div>
    <div className="font-medium">{value || "—"}</div>
  </div>
);

const ListTable: React.FC<ListTableProps> = ({ cols, rows, emptyMsg }) => {
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
            <tr key={i} className="border-t">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2">{String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ children }) => (
  <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center text-blue-600 text-sm">
    {children}
  </div>
);

export default PacientesUI;
import React, { useState } from "react";
import "@/styles/propietarios.css";

type RolType = "Admin" | "Recepcion";

interface Cita {
  fecha: string;
  motivo: string;
  sucursal: string;
  estado: string;
}

interface Factura {
  folio: string;
  fecha: string;
  total: number;
  estatus: string;
}

interface Propietario {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  consentimiento: boolean;
  historialCitas: Cita[];
  facturas: Factura[];
}

// 🔹 Chip reutilizable
const Chip = ({
  label,
  type = "success",
}: {
  label: string;
  type?: "success" | "warning" | "danger";
}) => {
  const classes = {
    success: "chip chip-success",
    warning: "chip chip-warning",
    danger: "chip chip-danger",
  }[type];

  return <span className={classes}>{label}</span>;
};

// 🔹 Tabla genérica reutilizable
const ListTable = ({
  cols,
  rows,
  emptyMsg,
}: {
  cols: string[];
  rows: (string | number)[][];
  emptyMsg?: string;
}) => {
  if (rows.length === 0)
    return <div className="empty-state">{emptyMsg ?? "Sin datos"}</div>;

  return (
    <table className="table-base">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((d, j) => (
              <td key={j}>{d}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// 🔹 Estado vacío visual
const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="empty-state">{children}</div>
);

// 🔹 Datos iniciales simulados
const initialPropietarios: Propietario[] = [
  {
    id: 1,
    nombre: "Ana López",
    telefono: "555-123-4567",
    email: "ana@example.com",
    consentimiento: true,
    historialCitas: [
      { fecha: "2025-09-12", motivo: "Vacunación", sucursal: "Norte", estado: "Completada" },
    ],
    facturas: [
      { folio: "A001", fecha: "2025-09-12", total: 450.0, estatus: "Pagada" },
    ],
  },
  {
    id: 2,
    nombre: "Luis Torres",
    telefono: "555-987-6543",
    email: "luis@example.com",
    consentimiento: false,
    historialCitas: [],
    facturas: [],
  },
];

const PropietariosUI: React.FC = () => {
  const [propietariosData, setPropietariosData] = useState(initialPropietarios);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"info" | "citas" | "facturacion">("info");
  const [rol, setRol] = useState<RolType>("Recepcion"); // ✅ corrección del error TS

  const seleccionado = propietariosData.find((p) => p.id === selectedId);

  const toggleConsentimiento = (id: number) => {
    setPropietariosData((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, consentimiento: !p.consentimiento } : p
      )
    );
  };

  return (
    <div className="layout">
      {/* 🔹 Sidebar */}
      <aside className="sidebar">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Propietarios</h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {propietariosData.map((p) => (
            <div
              key={p.id}
              className={`sidebar-item ${
                selectedId === p.id ? "active" : ""
              }`}
              onClick={() => setSelectedId(p.id)}
            >
              <div>
                <p className="font-semibold">{p.nombre}</p>
                <p className="text-xs text-gray-500">{p.telefono}</p>
              </div>
              {p.consentimiento ? (
                <Chip label="✔" type="success" />
              ) : (
                <Chip label="✖" type="danger" />
              )}
            </div>
          ))}
        </div>

        {(rol === "Admin" || rol === "Recepcion") && (
          <button className="btn-primary mt-4 w-full">+ Agregar</button>
        )}
      </aside>

      {/* 🔹 Main section */}
      <main className="flex-1 p-6 overflow-y-auto">
        {seleccionado ? (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {seleccionado.nombre}
              </h2>

              <div className="flex items-center gap-2">
                <Chip
                  label={
                    seleccionado.consentimiento
                      ? "Consentimiento Activo"
                      : "Sin Consentimiento"
                  }
                  type={seleccionado.consentimiento ? "success" : "warning"}
                />
                {rol === "Admin" && (
                  <button
                    className="btn-secondary"
                    onClick={() => toggleConsentimiento(seleccionado.id)}
                  >
                    Cambiar
                  </button>
                )}
              </div>
            </div>

            {/* 🔹 Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className={`tab-button ${
                  tab === "info" ? "active" : ""
                }`}
                onClick={() => setTab("info")}
              >
                Información
              </button>
              <button
                className={`tab-button ${
                  tab === "citas" ? "active" : ""
                }`}
                onClick={() => setTab("citas")}
              >
                Citas
              </button>
              <button
                className={`tab-button ${
                  tab === "facturacion" ? "active" : ""
                }`}
                onClick={() => setTab("facturacion")}
              >
                Facturación
              </button>
            </div>

            {/* 🔹 Contenido dinámico */}
            {tab === "info" && (
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <p><strong>Teléfono:</strong> {seleccionado.telefono}</p>
                <p><strong>Email:</strong> {seleccionado.email}</p>
                <p><strong>Consentimiento:</strong>{" "}
                  {seleccionado.consentimiento ? "Sí" : "No"}
                </p>
              </div>
            )}

            {tab === "citas" && (
              <div className="mt-4">
                <ListTable
                  cols={["Fecha", "Motivo", "Sucursal", "Estado"]}
                  rows={seleccionado.historialCitas.map((c) => [
                    c.fecha,
                    c.motivo,
                    c.sucursal,
                    c.estado,
                  ])}
                  emptyMsg="Sin citas registradas"
                />
              </div>
            )}

            {tab === "facturacion" && (
              <div className="mt-4">
                <ListTable
                  cols={["Folio", "Fecha", "Total", "Estatus"]}
                  rows={seleccionado.facturas.map((f) => [
                    f.folio,
                    f.fecha,
                    `$${f.total.toFixed(2)}`,
                    f.estatus,
                  ])}
                  emptyMsg="Sin facturas registradas"
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyState>Selecciona un propietario para ver sus detalles</EmptyState>
        )}
      </main>
    </div>
  );
};

export default PropietariosUI;

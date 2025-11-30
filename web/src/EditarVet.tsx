import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./RegistroVeterinariaUI.css";
import { API_ENDPOINTS } from "./api.config";
import PETCARE_LOGO_URL from "./assets/PetCare Manager.png";

// --- COMPONENTES VISUALES ---

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className }) => (
  <section className={`card-base overflow-hidden mb-6 ${className || ""}`}>
    <div className="px-6 py-4 border-b border-gray-100 bg-white">
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-6 bg-white">{children}</div>
  </section>
);

const Field: React.FC<any> = ({ label, fullWidth, ...props }) => (
  <label className={`block ${fullWidth ? "col-span-1 sm:col-span-2" : ""}`}>
    <span className="text-sm text-gray-600 font-semibold mb-1.5 block">
      {label}
    </span>
    <input className="input-base w-full" {...props} />
  </label>
);

const Textarea: React.FC<any> = ({ label, fullWidth, ...props }) => (
  <label className={`block ${fullWidth ? "col-span-1 sm:col-span-2" : ""}`}>
    <span className="text-sm text-gray-600 font-semibold mb-1.5 block">
      {label}
    </span>
    <textarea className="input-base w-full min-h-[100px]" {...props} />
  </label>
);

// --- COMPONENTE PRINCIPAL ---

export default function EditarVet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // 1. ESTADO PARA CONTROLAR LAS PESTAÑAS
  const [activeTab, setActiveTab] = useState<"info" | "servicios">("info");

  const [formData, setFormData] = useState<any>({});
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [newService, setNewService] = useState({ nombre: "", precio: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar Datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await fetch(
          API_ENDPOINTS.veterinarias.obtenerDetalle(Number(id))
        );
        if (!response.ok) throw new Error("Error al cargar");
        const data = await response.json();

        setFormData({
          nombreComercial: data.nombre_comercial,
          razonSocial: data.razon_social || "",
          rfc: data.rfc || "",
          descripcionVeterinaria: data.descripcion || "",
          categorias: data.categorias || "",
          nombreResponsable: data.nombre_responsable,
          apellidosResponsable: data.apellidos_responsable,
          emailResponsable: data.email_responsable,
          telefonoResponsable: data.telefono_responsable,
          puesto: data.puesto || "",
          documentoIdentidad: data.documento_identidad || "",
          calle: data.calle,
          numeroExterior: data.numero_exterior,
          colonia: data.colonia,
          ciudad: data.ciudad,
          estado: data.estado,
          codigoPostal: data.codigo_postal,
          referencias: data.referencias || "",
          telefonoClinica: data.telefono_clinica,
          emailClinica: data.email_clinica,
          whatsapp: data.whatsapp || "",
          sitioWeb: data.sitio_web || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
        });

        setLogoUrl(data.logo);

        if (data.servicios) {
          setServicesList(
            data.servicios.map((s: any) => ({
              nombre: s.nombre,
              precio: s.precio,
              activo: true,
            }))
          );
        }
      } catch (error) {
        console.error(error);
        alert("Error cargando datos.");
        navigate("/inicio");
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, [id, navigate]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddService = () => {
    if (!newService.nombre || !newService.precio)
      return alert("Escribe nombre y precio.");
    setServicesList([...servicesList, { ...newService, activo: true }]);
    setNewService({ nombre: "", precio: "" });
  };

  const handleRemoveService = (index: number) => {
    const updated = [...servicesList];
    updated.splice(index, 1);
    setServicesList(updated);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!confirm("¿Guardar cambios? La solicitud podría volver a revisión."))
      return;

    const payload = {
      ...formData,
      descripcion: formData.descripcionVeterinaria,
      logo: logoUrl,
      servicios: servicesList.map((s) => ({
        nombre: s.nombre,
        precio: s.precio,
        activo: true,
      })),
    };

    try {
      const res = await fetch(
        API_ENDPOINTS.veterinarias.actualizarRegistro(Number(id)),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        alert("Veterinaria actualizada correctamente.");
        navigate("/inicio");
      } else {
        alert("Error al actualizar.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    }
  };

  if (isLoading)
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando información...
      </div>
    );

  return (
    <div className="ui-layout min-h-screen bg-gray-50 pb-20">
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Izquierda: Logo y Título */}
          <div className="flex items-center gap-4 w-1/3">
            <Link
              to="/inicio"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
              title="Volver"
            >
              ←
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={PETCARE_LOGO_URL}
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-blue-900 leading-tight">
                  Editar Veterinaria
                </h1>
                <p className="text-xs text-gray-500">ID: {id}</p>
              </div>
            </div>
          </div>

          {/* CENTRO: SELECTOR DE PESTAÑAS (TABS) */}
          <div className="flex justify-center w-1/3">
            <div className="flex bg-gray-100 p-1 rounded-lg shadow-inner">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "info"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Editar Información
              </button>
              <button
                onClick={() => setActiveTab("servicios")}
                className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "servicios"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Editar Servicios
              </button>
            </div>
          </div>

          {/* Derecha: Botones de Acción */}
          <div className="flex justify-end gap-3 w-1/3">
            <Link
              to="/inicio"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 text-sm"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition-all text-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* --- PESTAÑA 1: INFORMACIÓN --- */}
        {activeTab === "info" && (
          <div className="space-y-6 animate-fade-in">
            {/* Sección Logo e Identidad */}
            <Section
              title="Identidad Visual"
              subtitle="Haz clic en la imagen para cambiar el logo"
            >
              <div className="flex flex-col items-center justify-center py-4">
                <div
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      className="w-full h-full object-cover"
                      alt="Logo"
                    />
                  ) : (
                    <span className="text-4xl">🏥</span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">
                      Cambiar
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Recomendado: 500x500px PNG o JPG
                </p>
              </div>
            </Section>

            <Section title="Información de la Clínica">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Nombre Comercial"
                  name="nombreComercial"
                  value={formData.nombreComercial}
                  onChange={handleChange}
                />
                <Field
                  label="Razón Social"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleChange}
                />
                <Field
                  label="RFC"
                  name="rfc"
                  value={formData.rfc}
                  onChange={handleChange}
                />
                <Field
                  label="Categorías"
                  name="categorias"
                  value={formData.categorias}
                  onChange={handleChange}
                />
                <Textarea
                  label="Descripción"
                  fullWidth
                  name="descripcionVeterinaria"
                  value={formData.descripcionVeterinaria}
                  onChange={handleChange}
                />
              </div>
            </Section>

            <Section title="Ubicación y Contacto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Calle"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                />
                <Field
                  label="Número"
                  name="numeroExterior"
                  value={formData.numeroExterior}
                  onChange={handleChange}
                />
                <Field
                  label="Colonia"
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                />
                <Field
                  label="Código Postal"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                />
                <Field
                  label="Ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                />
                <Field
                  label="Estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                />
                <div className="sm:col-span-2 border-t border-gray-100 my-2"></div>
                <Field
                  label="Teléfono Clínica"
                  name="telefonoClinica"
                  value={formData.telefonoClinica}
                  onChange={handleChange}
                />
                <Field
                  label="Email Clínica"
                  name="emailClinica"
                  value={formData.emailClinica}
                  onChange={handleChange}
                />
              </div>
            </Section>

            <Section
              title="Datos del Responsable"
              subtitle="Información privada de contacto administrativo"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Nombre(s)"
                  name="nombreResponsable"
                  value={formData.nombreResponsable}
                  onChange={handleChange}
                />
                <Field
                  label="Apellidos"
                  name="apellidosResponsable"
                  value={formData.apellidosResponsable}
                  onChange={handleChange}
                />
                <Field
                  label="Email Personal"
                  name="emailResponsable"
                  value={formData.emailResponsable}
                  onChange={handleChange}
                />
                <Field
                  label="Teléfono Personal"
                  name="telefonoResponsable"
                  value={formData.telefonoResponsable}
                  onChange={handleChange}
                />
              </div>
            </Section>
          </div>
        )}

        {/* --- PESTAÑA 2: SERVICIOS --- */}
        {activeTab === "servicios" && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl shadow-lg overflow-hidden relative">
              <div className="bg-blue-100 px-6 py-5 border-b border-blue-200 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-blue-900">
                    🛠️ Gestión de Servicios
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Define los servicios y precios visibles para tus clientes
                  </p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  {servicesList.length} Activos
                </span>
              </div>

              <div className="p-6">
                {/* Formulario Rápido */}
                <div className="bg-white p-4 rounded-lg border border-blue-200 mb-6 shadow-sm">
                  <label className="text-sm font-bold text-blue-900 mb-2 block">
                    Agregar Nuevo Servicio
                  </label>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        className="input-base w-full text-sm"
                        placeholder="Ej. Consulta General"
                        value={newService.nombre}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            nombre: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        className="input-base w-full text-sm"
                        placeholder="$ Precio"
                        value={newService.precio}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            precio: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={handleAddService}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center justify-center"
                      style={{ height: "42px" }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de Servicios */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {servicesList.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-4xl block mb-2">📋</span>
                      <p className="text-gray-500 text-sm">
                        No hay servicios registrados aún.
                      </p>
                    </div>
                  )}

                  {servicesList.map((serv, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-blue-100 group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">
                            {serv.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            Servicio estándar
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-green-600 font-bold text-lg bg-green-50 px-3 py-1 rounded-md border border-green-100">
                          ${serv.precio}
                        </div>
                        <button
                          onClick={() => handleRemoveService(idx)}
                          className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                          title="Eliminar servicio"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

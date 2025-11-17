import React, { useState, useRef, useEffect } from "react";
import "./RegistroVeterinariaUI.css";
import { API_ENDPOINTS } from "./api.config";

// --- MODIFICACIÓN: Importar el logo localmente ---
// (Esto asume que has movido tu imagen a 'src/assets/PetCare Manager.png')
import PETCARE_LOGO_URL from "./assets/PetCare Manager.png";

const mapSrc = "/mnt/data/4b0234d6-b38b-4b8c-aecc-e8fc007ee5a.jpg";
const fallbackSrc =
  "https://images.unsplash.com/photo-1502920917128-1aa500764b8a?q=80&w=1200&auto=format&fit=crop";

// --- INTERFACES DE DATOS Y ESTADO ---

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  activo: boolean;
}

interface Horario {
  id: number;
  dia: string;
  apertura: string;
  cierre: string;
}

// Interfaz para el estado unificado del formulario
interface FormData {
  // Responsable
  nombreResponsable: string;
  apellidosResponsable: string;
  emailResponsable: string;
  telefonoResponsable: string;
  documentoIdentidad: string;
  puesto: string;

  // Veterinaria
  nombreComercial: string;
  descripcionVeterinaria: string;
  categorias: string;
  razonSocial: string;
  rfc: string;

  // Ubicación
  calle: string;
  numeroExterior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencias: string;

  // Contacto
  telefonoClinica: string;
  whatsapp: string;
  emailClinica: string;
  sitioWeb: string;
  facebook: string;
  instagram: string;
}

const initialServices: Servicio[] = [];
const initialSchedule: Horario[] = [];

const initialFormData: FormData = {
  nombreResponsable: "",
  apellidosResponsable: "",
  emailResponsable: "",
  telefonoResponsable: "",
  documentoIdentidad: "",
  puesto: "",
  nombreComercial: "",
  descripcionVeterinaria: "",
  categorias: "",
  razonSocial: "",
  rfc: "",
  calle: "",
  numeroExterior: "",
  colonia: "",
  ciudad: "",
  estado: "",
  codigoPostal: "",
  referencias: "",
  telefonoClinica: "",
  whatsapp: "",
  emailClinica: "",
  sitioWeb: "",
  facebook: "",
  instagram: "",
};

// --- VALIDACIONES (REGEX) ---

const ALLOWED_DOMAINS = [
  "@gmail.com",
  "@hotmail.com",
  "@outlook.com",
  "@yahoo.com",
  "@icloud.com",
];
const REGEX_EMAIL_GENERAL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_PHONE = /^\d{10}$/;
const REGEX_POSTAL_CODE = /^\d{5}$/;
const REGEX_NAME = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const REGEX_URL = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

const isPhoneValid = (phone: string) => REGEX_PHONE.test(phone);
const isPostalCodeValid = (cp: string) => REGEX_POSTAL_CODE.test(cp);
const isNameValid = (name: string) => REGEX_NAME.test(name);
const isGeneralEmailValid = (email: string) => REGEX_EMAIL_GENERAL.test(email);
const isUrlValid = (url: string) => REGEX_URL.test(url);
const isRestrictedEmailValid = (email: string, domains: string[]) => {
  if (!isGeneralEmailValid(email)) return false;
  return domains.some((domain) => email.endsWith(domain));
};

// --- Componente de Alerta Personalizado ---
const CustomAlert: React.FC<{
  title: string;
  message: string;
  onClose: () => void;
}> = ({ title, message, onClose }) => {
  // Procesar el mensaje para respetar los saltos de línea
  const messageLines = message.split("\n");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all ease-out duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <img
              src={PETCARE_LOGO_URL}
              alt="PetCare Logo"
              className="h-10 w-10 mr-3 object-contain"
            />
            <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
              {title}
            </h3>
          </div>
        </div>
        {/* Body */}
        <div className="p-6">
          {messageLines.map((line, index) => (
            <p
              key={index}
              className="text-sm text-gray-700 mb-2 whitespace-pre-wrap"
            >
              {line}
            </p>
          ))}
        </div>
        {/* Footer */}
        <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="btn-primary">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
// --- FIN DE LA MODIFICACIÓN ---

// --- COMPONENTES UI REUTILIZABLES ---

const Step: React.FC<{
  n: number;
  label: string;
  active?: boolean;
  done?: boolean;
}> = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div
      className={`step-circle ${
        done ? "step-done" : active ? "step-active" : "step-inactive"
      }`}
    >
      {n}
    </div>
    <div className={`text-sm ${active ? "text-blue-700" : "text-gray-600"}`}>
      {label}
    </div>
  </div>
);

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <section className="card-base overflow-hidden">
    <div className="px-4 py-3 border-b border-blue-100">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  fullWidth?: boolean;
  isRequired?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  placeholder = "",
  type = "text",
  disabled = false,
  fullWidth = false,
  isRequired = false,
  ...rest
}) => (
  <label className={`text-sm block ${fullWidth ? "sm:col-span-2" : ""}`}>
    <span className="text-gray-600">
      {label}
      {isRequired && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className="input-base bg-white disabled:bg-gray-50"
      {...rest}
    />
  </label>
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  placeholder?: string;
  fullWidth?: boolean;
  isRequired?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  placeholder = "",
  rows = 3,
  fullWidth = false,
  isRequired = false,
  ...rest
}) => (
  <label className={`text-sm block ${fullWidth ? "sm:col-span-2" : ""}`}>
    <span className="text-gray-600">
      {label}
      {isRequired && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    <textarea
      placeholder={placeholder}
      rows={rows}
      className="input-base bg-white disabled:bg-gray-50"
      {...rest}
    />
  </label>
);

const Chip: React.FC<{ service: Servicio; onClick: (id: number) => void }> = ({
  service,
  onClick,
}) => (
  <button
    key={service.id}
    type="button"
    onClick={() => onClick(service.id)}
    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
      service.activo
        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    }`}
  >
    {service.nombre}
  </button>
);

const StepNavigation: React.FC<{
  current: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onFinalSubmit: () => void;
}> = ({ current, total, onNext, onPrev, onFinalSubmit }) => (
  <div className="flex justify-between mt-6">
    {current > 1 ? (
      <button className="btn-secondary" onClick={onPrev}>
        {"<"} Anterior
      </button>
    ) : (
      <div />
    )}
    {current < total ? (
      <button className="btn-primary ml-auto" onClick={onNext}>
        Siguiente {">"}
      </button>
    ) : (
      <button
        className="btn-primary ml-auto bg-green-600 hover:bg-green-700"
        onClick={onFinalSubmit}
      >
        Verificar
      </button>
    )}
  </div>
);

// --- Lógica del formulario guiado por pasos (Wizard) ---

const STEP_LABELS = [
  "Responsable",
  "Veterinaria",
  "Ubicación",
  "Contacto",
  "Servicios",
  "Publicación",
];

interface FormStepProps {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  servicesList: Servicio[];
  setServicesList: React.Dispatch<React.SetStateAction<Servicio[]>>;
  scheduleList: Horario[];
  setScheduleList: React.Dispatch<React.SetStateAction<Horario[]>>;
  formData: FormData;
  handleChange: (name: keyof FormData, value: string) => void;
  handleEnviarVerificacion: () => void;
  logoUrl: string | null;
  handleLogoChange: (file: File | null) => void;
}

const FormStep: React.FC<FormStepProps> = ({
  step,
  onNext,
  onPrev,
  servicesList,
  setServicesList,
  scheduleList,
  setScheduleList,
  formData,
  handleChange,
  handleEnviarVerificacion,
  logoUrl,
  handleLogoChange,
}) => {
  // Estado local para el nuevo servicio
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  // Estado local para el nuevo horario
  const [newScheduleDay, setNewScheduleDay] = useState("");
  const [newScheduleOpen, setNewScheduleOpen] = useState("");
  const [newScheduleClose, setNewScheduleClose] = useState("");

  // Limpiar sub-formularios al cambiar de paso
  useEffect(() => {
    setNewScheduleDay("");
    setNewScheduleOpen("");
    setNewScheduleClose("");
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServicePrice("");
  }, [step]);

  // Handler para agregar horario
  const handleAddSchedule = () => {
    if (
      !newScheduleDay.trim() ||
      !newScheduleOpen.trim() ||
      !newScheduleClose.trim()
    ) {
      onNext(); // Llama a onNext para que la validación del padre se active
      return;
    }

    const newId = Math.max(0, ...scheduleList.map((s) => s.id)) + 1;
    const nuevoHorario: Horario = {
      id: newId,
      dia: newScheduleDay.trim(),
      apertura: newScheduleOpen.trim(),
      cierre: newScheduleClose.trim(),
    };

    setScheduleList((prev) => [...prev, nuevoHorario]);
    // Limpiar campos
    setNewScheduleDay("");
    setNewScheduleOpen("");
    setNewScheduleClose("");
  };

  // Handler para eliminar horario
  const handleRemoveSchedule = (id: number) => {
    setScheduleList((prev) => prev.filter((item) => item.id !== id));
  };

  // Handler para agregar servicio
  const handleAddService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) {
      onNext(); // Llama a onNext para que la validación del padre se active
      return;
    }
    const price = parseFloat(newServicePrice);
    if (isNaN(price) || price < 0) {
      onNext(); // Llama a onNext para que la validación del padre se active
      return;
    }

    const newId = Math.max(0, ...servicesList.map((s) => s.id)) + 1;
    const nuevoServicio: Servicio = {
      id: newId,
      nombre: newServiceName.trim(),
      precio: price,
      activo: true,
    };

    setServicesList((prev) => [...prev, nuevoServicio]); // Limpiar campos
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServicePrice("");
  };

  const handleServiceToggle = (id: number) => {
    setServicesList((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, activo: !service.activo } : service
      )
    );
  };

  // Referencia para el input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoChange(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickUploadArea = () => {
    fileInputRef.current?.click();
  };

  // Handler para eliminar el logo
  const handleRemoveLogo = () => {
    handleLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Contenido de cada paso
  const stepsContent: Record<number, React.ReactNode> = {
    // Responsable
    1: (
      <Section
        title="Datos del responsable"
        subtitle="Persona de contacto legal / administrativo"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nombre(s)"
            placeholder="Ej. Ana"
            value={formData.nombreResponsable}
            onChange={(e) => handleChange("nombreResponsable", e.target.value)}
            isRequired
          />
          <Field
            label="Apellidos"
            placeholder="Ej. López"
            value={formData.apellidosResponsable}
            onChange={(e) =>
              handleChange("apellidosResponsable", e.target.value)
            }
            isRequired
          />
          <Field
            label="Documento de identidad"
            placeholder="CURP/RFC (opcional)"
            value={formData.documentoIdentidad}
            onChange={(e) =>
              handleChange("documentoIdentidad", e.target.value)
            }
          />
          <Field
            label="Puesto"
            placeholder="Administrador(a) / Dueño(a)"
            value={formData.puesto}
            onChange={(e) => handleChange("puesto", e.target.value)}
          />
          <Field
            label="Teléfono"
            placeholder="(###) ### ####"
            value={formData.telefonoResponsable}
            onChange={(e) =>
              handleChange("telefonoResponsable", e.target.value)
            }
            isRequired
          />
          <Field
            label="Email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.emailResponsable}
            onChange={(e) => handleChange("emailResponsable", e.target.value)}
            isRequired
          />
        </div>
      </Section>
    ),
    // Veterinaria
    2: (
      <Section
        title="Datos de la veterinaria"
        subtitle="Información que verá el público en el mapa"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nombre comercial"
            placeholder="Ej. Vet Central"
            value={formData.nombreComercial}
            onChange={(e) => handleChange("nombreComercial", e.target.value)}
            isRequired
          />
          <Field
            label="Razón social"
            placeholder="(opcional)"
            value={formData.razonSocial}
            onChange={(e) => handleChange("razonSocial", e.target.value)}
          />
          <Field
            label="RFC"
            placeholder="(opcional)"
            value={formData.rfc}
            onChange={(e) => handleChange("rfc", e.target.value)}
          />
          <Field
            label="Categorías"
            placeholder="Clínica, 24/7, Emergencias"
            value={formData.categorias}
            onChange={(e) => handleChange("categorias", e.target.value)}
            isRequired
          />
          <Textarea
            label="Descripción"
            placeholder="Breve descripción de la clínica (máx. 240 caracteres)"
            fullWidth
            value={formData.descripcionVeterinaria}
            onChange={(e) =>
              handleChange("descripcionVeterinaria", e.target.value)
            }
            isRequired
          />
          <div className="sm:col-span-2 space-y-4 rounded-xl border border-blue-100 p-4 bg-blue-50/50">
            <h4 className="text-md font-semibold">Añadir horario</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Día(s)"
                placeholder="Ej. Lunes a Viernes"
                value={newScheduleDay}
                onChange={(e) => setNewScheduleDay(e.target.value)}
              />
              <Field
                label="Hora Apertura"
                type="time"
                placeholder="Ej. 09:00"
                value={newScheduleOpen}
                onChange={(e) => setNewScheduleOpen(e.target.value)}
              />
              <Field
                label="Hora Cierre"
                type="time"
                placeholder="Ej. 18:00"
                value={newScheduleClose}
                onChange={(e) => setNewScheduleClose(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddSchedule}
            >
              Agregar Horario
            </button>
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-gray-700">
                Horarios agregados
              </h4>
              {scheduleList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  Aún no se ha agregado ningún horario.
                </p>
              ) : (
                <ul className="divide-y divide-blue-200">
                  {scheduleList.map((horario) => (
                    <li
                      key={horario.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-semibold">{horario.dia}</div>
                        <div className="text-sm text-gray-600">
                          {horario.apertura} - {horario.cierre}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(horario.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-gray-600">Logotipo</div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                >
                  Eliminar Logo
                </button>
              )}
            </div>
            <div
              className={`h-28 rounded-xl border border-blue-100 bg-blue-50 flex flex-col items-center justify-center text-sm text-blue-700 cursor-pointer transition-colors duration-200 ${
                isDragging ? "dropzone-active" : ""
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClickUploadArea}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logotipo de la veterinaria"
                  className="h-full w-auto object-contain p-2"
                />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-8 h-8 text-blue-400 mb-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l1.5-1.5m1.5 1.5l1.5-1.5m1.5 1.5l1.5-1.5M10.5 10.5l4.5-4.5m-4.5 4.5h4.5m-4.5 4.5h4.5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 7.5l-4.5 4.5m4.5-4.5v4.5m0-4.5H15m7.5 0v4.5m-7.5-4.5h-4.5L12 9l-3.75 3.75M12 15l-3.75-3.75M12 15v4.5M12 15h4.5m-4.5 0H12l3.75-3.75M12 15l3.75-3.75M12 15h-4.5V12L9.75 9m4.5 0l3.75-3.75M12 9V4.5M12 9H7.5M12 9L7.5 4.5M12 9L16.5 4.5M12 9L7.5 4.5M12 9H16.5m-4.5 0h-4.5m4.5 0L12 4.5m0 4.5V4.5M12 9L7.5 4.5M12 9L16.5 4.5"
                    />
                  </svg>
                  Arrastra tu logo o{" "}
                  <span className="underline ml-1">haz clic para subir</span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        </div>
      </Section>
    ),
    // Ubicación
    3: (
      <Section
        title="Ubicación"
        subtitle="Se usará para posicionar el pin en el mapa"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Calle"
            placeholder="Av. 15 de Mayo"
            value={formData.calle}
            onChange={(e) => handleChange("calle", e.target.value)}
            isRequired
          />
          <Field
            label="Número exterior"
            placeholder="456"
            value={formData.numeroExterior}
            onChange={(e) => handleChange("numeroExterior", e.target.value)}
            isRequired
          />
          <Field
            label="Colonia"
            placeholder="Centro"
            value={formData.colonia}
            onChange={(e) => handleChange("colonia", e.target.value)}
            isRequired
          />
          <Field
            label="Ciudad"
            placeholder="Ciudad"
            value={formData.ciudad}
            onChange={(e) => handleChange("ciudad", e.target.value)}
            isRequired
          />
          <Field
            label="Estado"
            placeholder="Estado"
            value={formData.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            isRequired
          />
          <Field
            label="Código postal"
            placeholder="#####"
            value={formData.codigoPostal}
            onChange={(e) => handleChange("codigoPostal", e.target.value)}
            isRequired
          />
          <Textarea
            label="Referencias"
            placeholder="Frente a parque / esquina..."
            fullWidth
            value={formData.referencias}
            onChange={(e) => handleChange("referencias", e.target.value)}
          />
        </div>
      </Section>
    ),
    // Contacto y redes
    4: (
      <Section title="Contacto y redes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Teléfono de la clínica"
            placeholder="(###) ### ####"
            value={formData.telefonoClinica}
            onChange={(e) => handleChange("telefonoClinica", e.target.value)}
            isRequired
          />
          <Field
            label="WhatsApp"
            placeholder="(###) ### ####"
            value={formData.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
          />
          <Field
            label="Email"
            type="email"
            placeholder="contacto@veterinaria.com"
            value={formData.emailClinica}
            onChange={(e) => handleChange("emailClinica", e.target.value)}
            isRequired
          />
          <Field
            label="Sitio web"
            placeholder="https://"
            value={formData.sitioWeb}
            onChange={(e) => handleChange("sitioWeb", e.target.value)}
          />
          <Field
            label="Facebook"
            placeholder="https://facebook.com/"
            value={formData.facebook}
            onChange={(e) => handleChange("facebook", e.target.value)}
          />
          <Field
            label="Instagram"
            placeholder="https://instagram.com/"
            value={formData.instagram}
            onChange={(e) => handleChange("instagram", e.target.value)}
          />
        </div>
      </Section>
    ),
    // Servicios
    5: (
      <Section title="Gestión de Servicios">
        <div className="space-y-6">
          {/* Formulario de Nuevo Servicio */}
          <div className="rounded-xl border border-blue-100 p-4 bg-blue-50/50">
            <h4 className="text-md font-semibold mb-3">
              Añadir nuevo servicio
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Nombre del servicio"
                placeholder="Ej. Cirugía Menor"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
              <Field
                label="Precio (USD)"
                placeholder="Ej. 120.00"
                type="number"
                min="0"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
              <div className="sm:col-span-1 flex items-end">
                <button
                  className="btn-primary w-full h-10"
                  onClick={handleAddService}
                >
                  Agregar
                </button>
              </div>
              <Textarea
                label="Descripción"
                placeholder="Descripción detallada del servicio."
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* Servicios Principales (Lista interactiva) */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Servicios principales (Activar / Desactivar)
            </div>
            {servicesList.length === 0 ? (
              <div className="text-gray-500 italic">
                Aún no se ha agregado ningún servicio.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {servicesList.map((service) => (
                  <Chip
                    key={service.id}
                    service={service}
                    onClick={handleServiceToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    ),
    // Publicación
    6: (
      <Section
        title="Publicación y verificación"
        subtitle="Estos datos afectan la visibilidad en el mapa"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Estado de publicación"
            placeholder="Borrador / Publicada / No publicada"
          />
          <Field
            label="Estatus de verificación"
            placeholder="Pendiente / Aprobada"
          />
          <div className="sm:col-span-2">
            <div className="text-sm text-gray-600 mb-1">
              Documentos de verificación
            </div>
            <div className="h-28 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center text-sm text-blue-700">
              Soltar archivos aquí (mock)
            </div>
          </div>
        </div>
      </Section>
    ),
  };

  return (
    <div className="space-y-4">
      {stepsContent[step]}
      <StepNavigation
        current={step}
        total={STEP_LABELS.length}
        onNext={onNext}
        onPrev={onPrev}
        onFinalSubmit={handleEnviarVerificacion}
      />
    </div>
  );
};

export default function AgregarVeterinariaUI() {
  const [currentStep, setCurrentStep] = useState(1);
  const [servicesList, setServicesList] = useState<Servicio[]>(initialServices);
  const [scheduleList, setScheduleList] =
    useState<Horario[]>(initialSchedule);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const totalSteps = STEP_LABELS.length;

  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoUrl(null);
    }
  };

  // 🚨 FUNCIÓN DE ENVÍO DE DATOS
  const handleEnviarVerificacion = async () => {
    const finalValidationErrors: string[] = [];
    if (!isNameValid(formData.nombreResponsable))
      finalValidationErrors.push("Nombre del responsable");
    if (!isPhoneValid(formData.telefonoResponsable))
      finalValidationErrors.push("Teléfono del responsable");
    if (!isRestrictedEmailValid(formData.emailResponsable, ALLOWED_DOMAINS))
      finalValidationErrors.push("Email del responsable");
    if (!formData.nombreComercial.trim())
      finalValidationErrors.push("Nombre comercial");
    if (scheduleList.length === 0)
      finalValidationErrors.push("Al menos un horario");
    if (!formData.calle.trim()) finalValidationErrors.push("Calle");
    if (!formData.ciudad.trim()) finalValidationErrors.push("Ciudad");
    if (!isPhoneValid(formData.telefonoClinica))
      finalValidationErrors.push("Teléfono de la clínica");
    if (!isGeneralEmailValid(formData.emailClinica))
      finalValidationErrors.push("Email de la clínica");
    if (servicesList.length === 0)
      finalValidationErrors.push("Al menos un servicio");

    if (finalValidationErrors.length > 0) {
      setAlertInfo({
        title: "PetCare Manager",
        message:
          "Aún faltan campos obligatorios antes de enviar:\n\n• " +
          finalValidationErrors.join("\n• "),
      });
      return;
    }

    try {
      // 1. CONSOLIDAR EL PAYLOAD
      const payload = {
        ...formData,
        servicios: servicesList.filter((s) => s.activo),
        horarios: scheduleList,
        logoUrl: logoUrl,
      };

      console.log("Enviando Payload:", payload);

      // 2. HACER LA PETICIÓN FETCH
      const response = await fetch(API_ENDPOINTS.veterinarias.registro, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 3. MANEJAR RESPUESTA
      const data = await response.json();
      console.log("✅ Respuesta del servidor:", data);

      if (response.ok) {
        setAlertInfo({
          title: "PetCare Manager",
          message: `Registro enviado con éxito ✅.\nID: ${data.id || "N/A"}`,
        });
      } else {
        setAlertInfo({
          title: "PetCare Manager",
          message: `Error al registrar.\nDetalle: ${
            data.mensaje || "Error desconocido del servidor."
          }`,
        });
      }
    } catch (error: any) {
      console.error("❌ Error de conexión:", error);
      setAlertInfo({
        title: "PetCare Manager",
        message: `No se pudo conectar con el servidor backend.\nError: ${error.message}`,
      });
    }
  };

  // Lógica de validación avanzada
  const handleNextStep = () => {
    const missingFields: string[] = [];

    // Validar Paso 1: Responsable
    if (currentStep === 1) {
      if (!isNameValid(formData.nombreResponsable))
        missingFields.push("• Nombre (solo letras y espacios)");
      if (!isNameValid(formData.apellidosResponsable))
        missingFields.push("• Apellidos (solo letras y espacios)");
      if (!isPhoneValid(formData.telefonoResponsable))
        missingFields.push("• Teléfono (debe tener 10 dígitos)");
      if (!isRestrictedEmailValid(formData.emailResponsable, ALLOWED_DOMAINS))
        missingFields.push(
          "• Email (debe ser @gmail, @hotmail, @outlook, etc.)"
        );
    }
    // Validar Paso 2: Veterinaria
    else if (currentStep === 2) {
      if (!formData.nombreComercial.trim())
        missingFields.push("• Nombre comercial");
      if (!formData.categorias.trim()) missingFields.push("• Categorías");
      if (!formData.descripcionVeterinaria.trim())
        missingFields.push("• Descripción");
      if (scheduleList.length === 0) {
        missingFields.push("• Horarios (debe agregar al menos uno)");
      }
    }
    // Validar Paso 3: Ubicación
    else if (currentStep === 3) {
      if (!formData.calle.trim()) missingFields.push("• Calle");
      if (!formData.numeroExterior.trim())
        missingFields.push("• Número exterior");
      if (!formData.colonia.trim()) missingFields.push("• Colonia");
      if (!isNameValid(formData.ciudad))
        missingFields.push("• Ciudad (solo letras y espacios)");
      if (!isNameValid(formData.estado))
        missingFields.push("• Estado (solo letras y espacios)");
      if (!isPostalCodeValid(formData.codigoPostal))
        missingFields.push("• Código postal (debe tener 5 dígitos)");
    }
    // Validar Paso 4: Contacto y redes
    else if (currentStep === 4) {
      if (!isPhoneValid(formData.telefonoClinica))
        missingFields.push("• Teléfono de la clínica (debe tener 10 dígitos)");
      if (!isGeneralEmailValid(formData.emailClinica))
        missingFields.push("• Email (formato inválido, ej. c@v.com)");

      // Validar campos opcionales SOLO SI tienen contenido
      if (formData.whatsapp.trim() && !isPhoneValid(formData.whatsapp)) {
        missingFields.push("• WhatsApp (debe tener 10 dígitos)");
      }
      if (formData.sitioWeb.trim() && !isUrlValid(formData.sitioWeb)) {
        missingFields.push("• Sitio web (URL inválida)");
      }
      if (formData.facebook.trim() && !isUrlValid(formData.facebook)) {
        missingFields.push("• Facebook (URL inválida)");
      }
      if (formData.instagram.trim() && !isUrlValid(formData.instagram)) {
        missingFields.push("• Instagram (URL inválida)");
      }
    }
    // Validar Paso 5: Servicios
    else if (currentStep === 5) {
      if (servicesList.length === 0) {
        setAlertInfo({
          title: "PetCare Manager",
          message:
            "Debes agregar al menos un servicio para continuar.\n\nPuedes desactivarlo si no quieres que sea público, pero debe estar en la lista.",
        });
        return; // No avanzar
      }
    }

    // Mostrar modal si faltan campos
    if (missingFields.length > 0) {
      setAlertInfo({
        title: "PetCare Manager",
        message:
          "Por favor, corrige los siguientes errores:\n\n" +
          missingFields.join("\n"),
      });
      return; // No avanzar
    }

    // Si todo está bien, avanzar
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const activeServices = servicesList
    .filter((s) => s.activo)
    .map((s) => s.nombre)
    .join(", ");

  // Helper para acortar texto si es muy largo
  const truncate = (text: string, length: number) => {
    if (!text || text.length <= length) return text || "—";
    return text.substring(0, length) + "...";
  };

  return (
    <div className="ui-layout">
      {alertInfo && (
        <CustomAlert
          title={alertInfo.title}
          message={alertInfo.message}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 header-base">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* --- MODIFICACIÓN: Añadir el logo aquí --- */}
            <img
              src={PETCARE_LOGO_URL}
              alt="PetCare Manager Logo"
              className="h-8 w-8 object-contain" // Ajusta h-8 y w-8 para el tamaño deseado
            />
            {/* ------------------------------------------- */}
            <h1 className="text-xl font-semibold">Agregar veterinaria</h1>
            <span className="text-sm text-gray-500">Prototipo visual</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={handleEnviarVerificacion}>
              Enviar a verificación
            </button>
          </div>
        </div>
      </header>

      {/* Steps Navigation Bar */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <div className="card-base p-3 flex flex-wrap items-center gap-6">
          {STEP_LABELS.map((label, index) => (
            <Step
              key={index}
              n={index + 1}
              label={label}
              active={currentStep === index + 1}
              done={currentStep > index + 1}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <FormStep
            step={currentStep}
            onNext={handleNextStep}
            onPrev={prevStep}
            servicesList={servicesList}
            setServicesList={setServicesList}
            scheduleList={scheduleList}
            setScheduleList={setScheduleList}
            formData={formData}
            handleChange={handleChange}
            handleEnviarVerificacion={handleEnviarVerificacion}
            logoUrl={logoUrl}
            handleLogoChange={handleLogoChange}
          />
        </div>

        {/* Panel derecho (Resumen constante) */}
        <aside className="xl:col-span-4 space-y-4">
          <Section title="Resumen del registro">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="col-span-2 flex items-center gap-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded-md object-cover border border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <div className="text-gray-500">Nombre comercial</div>
                  <div className="font-semibold truncate">
                    {formData.nombreComercial || "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500">Ciudad</div>
                <div className="font-semibold truncate">
                  {formData.ciudad || "—"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Teléfono (clínica)</div>
                <div className="font-semibold truncate">
                  {formData.telefonoClinica || "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Email (clínica)</div>
                <div className="font-semibold truncate">
                  {formData.emailClinica || "—"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Servicios</div>
                <div className="font-semibold truncate">
                  {truncate(activeServices, 20) || "—"}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-gray-500">Responsable</div>
                <div className="font-semibold truncate">
                  {`${formData.nombreResponsable} ${formData.apellidosResponsable}`.trim() ||
                    "—"}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Checklist de formularios">
            <ul className="text-sm space-y-3">
              {STEP_LABELS.map((label, index) => {
                const stepNumber = index + 1;
                const isDone = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;

                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2 transition-all ${
                      isActive
                        ? "font-semibold text-blue-600" // Activo
                        : isDone
                        ? "text-gray-500" // Completado
                        : "text-gray-400" // Pendiente
                    }`}
                  >
                    {/* Icono dinámico */}
                    <span>
                      {isDone ? "✅" : isActive ? "➡️" : "⚪️"}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </Section>
        </aside>
      </main>
    </div>
  );
}
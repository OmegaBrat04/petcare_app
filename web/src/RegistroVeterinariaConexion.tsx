import React, { useState } from "react";
import "./RegistroVeterinariaUI.css";

const mapSrc = "/mnt/data/4b0234d6-b38b-4b8c-aecc-e8fc0057ee5a.jpg";
const fallbackSrc = "https://images.unsplash.com/photo-1502920917128-1aa500764b8a?q=80&w=1200&auto=format&fit=crop";

// --- INTERFACES DE DATOS Y ESTADO ---

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  activo: boolean;
}

// Interfaz para el estado unificado del formulario
interface FormData {
    nombreResponsable: string;
    apellidosResponsable: string;
    emailResponsable: string;
    telefonoResponsable: string;
    nombreComercial: string;
    horaApertura: string;
    horaCierre: string;
    descripcionVeterinaria: string;
    // Debes expandir esto para incluir todos los demás campos de los pasos 3, 4 y 6
}

const initialServices: Servicio[] = []; 

const initialFormData: FormData = {
    nombreResponsable: '',
    apellidosResponsable: '',
    emailResponsable: '',
    telefonoResponsable: '',
    nombreComercial: '',
    horaApertura: '',
    horaCierre: '',
    descripcionVeterinaria: '',
};

// --- COMPONENTES UI REUTILIZABLES ---

const Step: React.FC<{ n: number; label: string; active?: boolean; done?: boolean; onClick: (n: number) => void }> = ({ n, label, active, done, onClick }) => (
  <div className="flex items-center gap-2 cursor-pointer" onClick={() => onClick(n)}>
    <div
      className={`step-circle ${
        done ? "step-done" : active ? "step-active" : "step-inactive"
      }`}
    >
      {n}
    </div>
    <div className={`text-sm ${active ? "text-blue-700" : "text-gray-600"}`}>{label}</div>
  </div>
);

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
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
}

const Field: React.FC<FieldProps> = ({ label, placeholder = "", type = "text", disabled = false, fullWidth = false, ...rest }) => (
  <label className={`text-sm block ${fullWidth ? 'sm:col-span-2' : ''}`}>
    <span className="text-gray-600">{label}</span>
    <input
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className="input-base bg-white disabled:bg-gray-50"
      {...rest} 
    />
  </label>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    placeholder?: string;
    fullWidth?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({ label, placeholder = "", rows = 3, fullWidth = false, ...rest }) => (
  <label className={`text-sm block ${fullWidth ? 'sm:col-span-2' : ''}`}>
    <span className="text-gray-600">{label}</span>
    <textarea 
      placeholder={placeholder} 
      rows={rows} 
      className="input-base bg-white disabled:bg-gray-50" 
      {...rest}
    />
  </label>
);

const Chip: React.FC<{ service: Servicio; onClick: (id: number) => void }> = ({ service, onClick }) => (
  <button
    key={service.id}
    type="button"
    onClick={() => onClick(service.id)}
    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
      service.activo
        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    }`}
  >
    {service.nombre}
  </button>
);

const StepNavigation: React.FC<{ current: number; total: number; onNext: () => void; onPrev: () => void; onFinalSubmit: () => void }> = ({ current, total, onNext, onPrev, onFinalSubmit }) => (
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
      // Botón "Verificar"
      <button className="btn-primary ml-auto bg-green-600 hover:bg-green-700" onClick={onFinalSubmit}>
        Verificar
      </button>
    )}
  </div>
);

// --- Lógica del formulario guiado por pasos (Wizard) ---

const STEP_LABELS = ["Responsable", "Veterinaria", "Ubicación", "Contacto", "Servicios", "Publicación"];

interface FormStepProps { 
  step: number; 
  onNext: () => void; 
  onPrev: () => void; 
  servicesList: Servicio[]; 
  setServicesList: React.Dispatch<React.SetStateAction<Servicio[]>>;
  formData: FormData;
  handleChange: (name: keyof FormData, value: string) => void;
  handleEnviarVerificacion: () => void; // Función de envío final
}

const FormStep: React.FC<FormStepProps> = ({ step, onNext, onPrev, servicesList, setServicesList, formData, handleChange, handleEnviarVerificacion }) => {
  
  // Estado local para el nuevo servicio
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Función para agregar un nuevo servicio
  const handleAddService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) {
      alert('Nombre y Precio son obligatorios.');
      return;
    }

    const newId = Math.max(0, ...servicesList.map(s => s.id)) + 1;
    const nuevoServicio: Servicio = {
      id: newId,
      nombre: newServiceName.trim(),
      precio: parseFloat(newServicePrice),
      activo: true,
    };

    setServicesList(prev => [...prev, nuevoServicio]);
    // Limpiar campos
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServicePrice('');
  };

  // Función para toggler el estado activo/inactivo del servicio
  const handleServiceToggle = (id: number) => {
    setServicesList(prev => 
      prev.map(service => 
        service.id === id ? { ...service, activo: !service.activo } : service
      )
    );
  };
  
  // Contenido de cada paso
  const stepsContent: Record<number, React.ReactNode> = {
    1: ( // Responsable
      <Section title="Datos del responsable" subtitle="Persona de contacto legal / administrativo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre(s)" placeholder="Ej. Ana" value={formData.nombreResponsable} onChange={(e) => handleChange('nombreResponsable', e.target.value)} />
          <Field label="Apellidos" placeholder="Ej. López" value={formData.apellidosResponsable} onChange={(e) => handleChange('apellidosResponsable', e.target.value)} />
          <Field label="Documento de identidad" placeholder="CURP/RFC (opcional)" />
          <Field label="Puesto" placeholder="Administrador(a) / Dueño(a)" />
          <Field label="Teléfono" placeholder="(###) ### ####" value={formData.telefonoResponsable} onChange={(e) => handleChange('telefonoResponsable', e.target.value)} />
          <Field label="Email" type="email" placeholder="correo@ejemplo.com" value={formData.emailResponsable} onChange={(e) => handleChange('emailResponsable', e.target.value)} />
        </div>
      </Section>
    ),
    2: ( // Veterinaria
      <Section title="Datos de la veterinaria" subtitle="Información que verá el público en el mapa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre comercial" placeholder="Ej. Vet Central" value={formData.nombreComercial} onChange={(e) => handleChange('nombreComercial', e.target.value)} />
          <Field label="Razón social" placeholder="(opcional)" />
          <Field label="RFC" placeholder="(opcional)" />
          <Field label="Categorías" placeholder="Clínica, 24/7, Emergencias" />
          
          <Textarea label="Descripción" placeholder="Breve descripción de la clínica (máx. 240 caracteres)" fullWidth value={formData.descripcionVeterinaria} onChange={(e) => handleChange('descripcionVeterinaria', e.target.value)} />
          
          <Field label="Hora Apertura" placeholder="Ej. 09:00" value={formData.horaApertura} onChange={(e) => handleChange('horaApertura', e.target.value)} />
          <Field label="Hora Cierre" placeholder="Ej. 18:00" value={formData.horaCierre} onChange={(e) => handleChange('horaCierre', e.target.value)} />

          <div className="sm:col-span-2">
            <div className="text-sm text-gray-600 mb-1">Logotipo</div>
            <div className="h-28 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center text-sm text-blue-700">Arrastra tu logo (mock)</div>
          </div>
        </div>
      </Section>
    ),
    // ... (Pasos 3, 4, 5, 6 se mantienen) ...
    3: (
        <Section title="Ubicación" subtitle="Se usará para posicionar el pin en el mapa">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Calle y número" placeholder="Av. 15 de Mayo 456" />
                <Field label="Colonia" placeholder="Centro" />
                <Field label="Ciudad" placeholder="Ciudad" />
                <Field label="Estado" placeholder="Estado" />
                <Field label="Código postal" placeholder="#####" />
                <Field label="Referencias" placeholder="Frente a parque / esquina..." />
            </div>
            <div className="mt-4 rounded-2xl overflow-hidden border border-blue-100">
                <div className="px-4 py-2 text-sm text-gray-600 border-b border-blue-100 bg-blue-50">Vista previa del mapa</div>
                <div className="relative">
                    <img src={mapSrc} onError={(e) => (e.currentTarget.src = fallbackSrc)} alt="Mapa" className="w-full h-64 object-cover" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                        <div className="h-3 w-3 rounded-full border-2 border-white shadow bg-blue-600" />
                        <div className="bg-white/90 text-[10px] px-2 py-1 rounded-md border border-blue-100 mt-1 shadow">Nueva sucursal</div>
                    </div>
                </div>
            </div>
        </Section>
    ),
    4: (
        <Section title="Contacto y redes">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teléfono de la clínica" placeholder="(###) ### ####" />
                <Field label="WhatsApp" placeholder="(###) ### ####" />
                <Field label="Email" type="email" placeholder="contacto@veterinaria.com" />
                <Field label="Sitio web" placeholder="https://" />
                <Field label="Facebook" placeholder="https://facebook.com/" />
                <Field label="Instagram" placeholder="https://instagram.com/" />
            </div>
        </Section>
    ),
    5: (
        <Section title="Gestión de Servicios">
            <div className="space-y-6">
                
                {/* Formulario de Nuevo Servicio */}
                <div className="rounded-xl border border-blue-100 p-4 bg-blue-50/50">
                    <h4 className="text-md font-semibold mb-3">Añadir nuevo servicio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Nombre del servicio" placeholder="Ej. Cirugía Menor" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
                        <Field label="Precio (USD)" placeholder="Ej. 120.00" type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
                        <div className="sm:col-span-1 flex items-end">
                            <button className="btn-primary w-full h-10" onClick={handleAddService}>Agregar</button>
                        </div>
                        <Textarea label="Descripción" placeholder="Descripción detallada del servicio." value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} fullWidth />
                    </div>
                </div>
                
                {/* Servicios Principales (Lista interactiva) */}
                <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Servicios principales (Activar / Desactivar)</div>
                    {servicesList.length === 0 ? (
                        <div className="text-gray-500 italic">Aún no se ha agregado ningún servicio.</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">{servicesList.map(service => (<Chip key={service.id} service={service} onClick={handleServiceToggle} />))}</div>
                    )}
                </div>
            </div>
        </Section>
    ),
    6: ( // Publicación
        <Section title="Publicación y verificación" subtitle="Estos datos afectan la visibilidad en el mapa">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Estado de publicación" placeholder="Borrador / Publicada / No publicada" />
                <Field label="Estatus de verificación" placeholder="Pendiente / Aprobada" />
                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Documentos de verificación</div>
                    <div className="h-28 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center text-sm text-blue-700">Soltar archivos aquí (mock)</div>
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
    const [formData, setFormData] = useState<FormData>(initialFormData); 
    const totalSteps = STEP_LABELS.length;

    const handleChange = (name: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 🚨 FUNCIÓN DE ENVÍO DE DATOS
    const handleEnviarVerificacion = async () => {
        
        // 🚨 VALIDACIÓN CRÍTICA DEL FRONTEND
        if (!formData.nombreResponsable || !formData.nombreComercial || !formData.emailResponsable) {
            alert('Por favor, completa Nombre, Nombre Comercial y Email del responsable. Son campos obligatorios.');
            return;
        }

        try {
            // 1. CONSOLIDAR EL PAYLOAD
            const payload = {
                ...formData, 
                servicios: servicesList.filter(s => s.activo), 
            };
            
            console.log("Enviando Payload:", payload); 
            
            // 2. HACER LA PETICIÓN FETCH (URL ABSOLUTA para evitar errores de proxy)
            const response = await fetch("http://localhost:3001/api/veterinarias/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // 3. MANEJAR RESPUESTA
            const data = await response.json();
            console.log("✅ Respuesta del servidor:", data);

            if (response.ok) {
                alert(`Registro enviado con éxito ✅. ID: ${data.id || 'N/A'}`);
            } else {
                alert(`Error al registrar. Detalle: ${data.mensaje || "Error desconocido del servidor."}`);
            }
        } catch (error) {
            console.error("❌ Error de conexión:", error);
            alert("No se pudo conectar con el servidor backend. ¿Está corriendo en el puerto 3001?");
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const goToStep = (step: number) => setCurrentStep(Math.max(1, Math.min(step, totalSteps)));

    const activeServices = servicesList.filter(s => s.activo).map(s => s.nombre).join(', ');

    return (
        <div className="ui-layout">
            {/* Header */}
            <header className="sticky top-0 z-10 header-base">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold">Agregar veterinaria</h1>
                        <span className="text-sm text-gray-500">Prototipo visual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn-secondary">Guardar borrador</button>
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
                            onClick={goToStep}
                        />
                    ))}
                </div>
            </div>

            {/* Body */}
            <main className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-8">
                    <FormStep 
                        step={currentStep} 
                        onNext={nextStep} 
                        onPrev={prevStep} 
                        servicesList={servicesList}
                        setServicesList={setServicesList}
                        formData={formData} 
                        handleChange={handleChange}
                        handleEnviarVerificacion={handleEnviarVerificacion}
                    />
                </div>

                {/* Panel derecho (Resumen constante) */}
                <aside className="xl:col-span-4 space-y-4">
                    <Section title="Resumen del registro">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-gray-500">Visibilidad</div>
                                <div className="font-semibold">Borrador</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Verificación</div>
                                <div className="font-semibold">Pendiente</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Categorías</div>
                                <div className="font-semibold">Clínica, 24/7</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Servicios</div>
                                <div className="font-semibold">{activeServices || '—'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-gray-500 mb-1">Proyección en mapa</div>
                                <div className="h-2 rounded-full bg-blue-100">
                                    <div className="h-2 w-3/5 bg-blue-500 rounded-full" />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Cobertura estimada 5 km</div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Checklist de publicación">
                        <ul className="text-sm space-y-2">
                            <li>• Datos del responsable ✳</li>
                            <li>• Nombre y descripción ✳</li>
                            <li>• Dirección y pin en mapa ✳</li>
                            <li>• Contacto y redes ✳</li>
                            <li>• Horario y servicios ✳</li>
                            <li>• Documentos de verificación (opcional) ✳</li>
                        </ul>
                    </Section>

                    <div className="card-base p-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold">¿Listo para publicar?</div>
                            <div className="text-xs text-gray-600">Puedes enviar a verificación cuando completes los campos.</div>
                        </div>
                        <button className="btn-primary" onClick={handleEnviarVerificacion}>
                            Enviar a verificación
                        </button>
                    </div>
                </aside>
            </main>
        </div>
    );
}
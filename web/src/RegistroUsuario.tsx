import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Reutilizamos los estilos de Login.css
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from './api.config';

// Interfaz para tipar la respuesta de la API
interface RegistroResponse {
    success: boolean;
    message?: string;
    idUsuario?: number;
}

const RegistroUsuario: React.FC = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        // Simulación: La contraseña real debería hashearse en el backend.
        const payload = {
            NombreCompleto: nombre,
            Email: email,
            ContrasenaHash: password,
            Rol: 'Propietario' // Por defecto, es dueño de veterinaria
        };

        try {
            // Usando el endpoint que definiremos en api.config.ts
            const response = await fetch(API_ENDPOINTS.auth.register, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data: RegistroResponse = await response.json();

            if (response.ok && data.success) {
                alert(`¡Registro exitoso! Ya puedes iniciar sesión.`);
                // Redirigir al inicio de sesión
                navigate('/');

            } else {
                // El error que viste en la imagen probablemente ocurrió aquí
                alert(`Error al registrar usuario: ${data.message || 'El email ya está registrado.'}`);
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servicio de registro.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <div className="login-header">
                    <img src={PETCARE_ICON_URL} alt="PetCare Manager" className="login-logo-icon" />
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                    <h2 className="login-title">Registro de Propietario</h2>
                </div>

                <form onSubmit={handleRegister} className="login-form">

                    <div className="input-group">
                        <label htmlFor="nombre">Nombre Completo</label>
                        <input
                            type="text"
                            id="nombre"
                            placeholder="Juan Pérez"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Registrarse
                    </button>

                    {/* Enlace para volver al login */}
                    <Link to="/" className="forgot-password">¿Ya tienes cuenta? Inicia sesión aquí</Link>
                </form>
            </div>
            <div className="paw-print login-top-left"></div>
            <div className="paw-print login-bottom-right"></div>
        </div>
    );
};

export default RegistroUsuario;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importamos useNavigate y Link
import './Login.css';
import PETCARE_ICON_URL from "./assets/PetCare Manager.png";
import { API_ENDPOINTS } from './api.config'; // Importamos la configuración

// Interfaz para tipar la respuesta esperada del backend
interface LoginResponse {
    success: boolean;
    token?: string;
    rol?: 'Admin' | 'Propietario';
    nombre?: string;
    message?: string;
}

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Hook para la redirección

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validaciones básicas de campos
        if (!email.trim() || !password.trim()) {
            alert("El email y la contraseña son obligatorios.");
            return;
        }

        try {
            // 2. Llamada al endpoint de autenticación
            const response = await fetch(API_ENDPOINTS.auth.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data: LoginResponse = await response.json();

            if (response.ok && data.success) {
                // 3. Autenticación exitosa

                // Guardar token y rol (aunque el rol no se use para la redirección ahora)
                if (data.token && data.rol) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userRole', data.rol);

                    alert(`¡Bienvenido, ${data.nombre || 'usuario'}!`);

                    // 4. Redirección ÚNICA al dashboard existente
                    navigate('/dashboard');
                }

            } else {
                // 5. Autenticación fallida (ej. credenciales incorrectas)
                alert(`Error al iniciar sesión: ${data.message || 'Credenciales inválidas.'}`);
            }

        } catch (error) {
            console.error("Error de conexión o servidor:", error);
            alert("No se pudo conectar con el servicio de autenticación. Inténtelo más tarde.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Encabezado del Formulario */}
                <div className="login-header">
                    <img src={PETCARE_ICON_URL} alt="PetCare Manager" className="login-logo-icon" />
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                    <h2 className="login-title">Acceso al Panel Web</h2>
                </div>

                {/* Formulario */}
                <form onSubmit={handleLogin} className="login-form">

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="ejemplo@dominio.com"
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

                    <button type="submit" className="login-button">
                        Iniciar Sesión
                    </button>

                    {/* ENLACE MODIFICADO: Ahora apunta a la ruta de registro */}
                    <Link to="/register" className="forgot-password">¿No tienes cuenta? Regístrate aquí</Link>
                </form>
            </div>
            {/* Huellas decorativas del diseño */}
            <div className="paw-print login-top-left"></div>
            <div className="paw-print login-bottom-right"></div>
        </div>
    );
};

export default Login;
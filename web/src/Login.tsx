import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from './api.config';
import PETCARE_LOGO_URL from "./assets/PetCare Manager.png";
import './Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Petición al Backend Unificado
            const response = await fetch(API_ENDPOINTS.auth.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // ⚠️ CORRECCIÓN CLAVE AQUÍ:
                // El backend devuelve: { user: { id: 1, nombre: '...' } }
                // Antes buscábamos data.idUsuario (que era undefined)

                if (data.user && data.user.id) {
                    localStorage.setItem('idUsuario', data.user.id.toString());
                    localStorage.setItem('nombreUsuario', data.user.nombre);
                    localStorage.setItem('rolUsuario', data.user.rol);

                    console.log("✅ Login exitoso. Usuario guardado:", data.user);

                    if (data.user.rol === 'Admin') {
                        navigate('/admin');
                    } else {
                        navigate('/inicio');
                    }
                } else {
                    setError('Error: El servidor no devolvió la información del usuario.');
                }
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="text-center mb-8">
                    <img src={PETCARE_LOGO_URL} alt="PetCare Logo" className="w-24 mx-auto mb-4" />
                    <div className="brand-text">
                        <span className="brand-main">PetCare</span>
                        <span className="brand-sub">Manager</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="veterinario@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button w-full mt-4"
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/register" className="text-sm text-blue-600 hover:underline">
                        ¿No tienes cuenta? Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
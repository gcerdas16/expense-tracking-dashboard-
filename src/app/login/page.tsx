'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login exitoso, redirigir al dashboard
                router.push('/');
                router.refresh();
            } else {
                // Mostrar error
                if (response.status === 429) {
                    setError(data.error || 'Demasiados intentos. Intenta más tarde.');
                } else if (response.status === 401) {
                    const attemptsMsg = data.attemptsRemaining !== undefined 
                        ? ` (${data.attemptsRemaining} intentos restantes)` 
                        : '';
                    setError(`${data.error}${attemptsMsg}`);
                } else {
                    setError(data.error || 'Error al iniciar sesión');
                }
            }
        } catch (error) {
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-purple-500/30">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                            <Lock className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Gastos</h1>
                        <p className="text-gray-400">Ingresa tu contraseña para continuar</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Ingresa tu contraseña"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-800 disabled:to-purple-900 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Iniciar Sesión
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-xs mt-8">
                        Protegido por autenticación segura
                    </p>
                </div>
            </div>
        </div>
    );
}

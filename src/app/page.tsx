'use client';

import ExpenseDashboard from '@/components/ExpenseDashboard';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="relative">
            {/* Botón de logout flotante */}
            <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
                title="Cerrar sesión"
            >
                {loggingOut ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saliendo...
                    </>
                ) : (
                    <>
                        <LogOut size={18} />
                        Cerrar Sesión
                    </>
                )}
            </button>

            {/* Dashboard */}
            <ExpenseDashboard />
        </div>
    );
}

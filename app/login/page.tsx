'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
    const { user, loading, login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.replace(user.rol === 'admin' ? '/admin' : '/reservas');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.error || 'Error de autenticación');
        }
        setIsLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f8f9fb 0%, #fce8ed 50%, #f8f9fb 100%)' }}>
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <Image
                            src="/logo.png"
                            alt="Huentala Wines Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        Huentala Wines
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Bodega Urbana — Sistema de Reservas
                    </p>
                </div>

                {/* Card */}
                <div
                    className="p-8 rounded-2xl"
                    style={{
                        background: 'var(--color-surface)',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--color-border-light)',
                    }}
                >
                    <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
                        Iniciar sesión
                    </h2>

                    {error && (
                        <div
                            className="mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2"
                            style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                style={{
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Contraseña
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                style={{
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-60 cursor-pointer"
                            style={{
                                background: 'var(--color-primary)',
                                boxShadow: '0 2px 8px rgba(212,17,66,0.2)',
                            }}
                            onMouseOver={(e) => { if (!isLoading) (e.target as HTMLElement).style.background = 'var(--color-primary-hover)'; }}
                            onMouseOut={(e) => (e.target as HTMLElement).style.background = 'var(--color-primary)'}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Ingresando...
                                </span>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
                    Huentala Wines Bodega Urbana © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}

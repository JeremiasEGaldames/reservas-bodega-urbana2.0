'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import type { RolUsuario } from '@/lib/types';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles: RolUsuario[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (!allowedRoles.includes(user.rol)) {
                router.replace(user.rol === 'admin' ? '/admin' : '/reservas');
            } else {
                setAuthorized(true);
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Verificando acceso...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

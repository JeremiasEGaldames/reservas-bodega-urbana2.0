'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Usuario, AuthState } from './types';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ user: null, loading: true });

    useEffect(() => {
        const stored = localStorage.getItem('bodega_user');
        if (stored) {
            try {
                const user = JSON.parse(stored) as Usuario;
                setState({ user, loading: false });
            } catch {
                localStorage.removeItem('bodega_user');
                setState({ user: null, loading: false });
            }
        } else {
            setState({ user: null, loading: false });
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Error de autenticación' };
            }

            const user = data.user as Usuario;
            localStorage.setItem('bodega_user', JSON.stringify(user));
            setState({ user, loading: false });
            return { success: true };
        } catch {
            return { success: false, error: 'Error de conexión' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('bodega_user');
        setState({ user: null, loading: false });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password, nombre, rol } = await request.json();

        if (!email || !password || !nombre || !rol) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            );
        }

        if (!['recepcion', 'admin'].includes(rol)) {
            return NextResponse.json(
                { error: 'Rol inválido' },
                { status: 400 }
            );
        }

        const salt = await bcrypt.genSalt(6);
        const password_hash = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('usuarios')
            .insert({
                email,
                password_hash,
                nombre,
                rol,
                activo: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'El email ya está registrado' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ user: data });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

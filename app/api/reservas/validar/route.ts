import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const body = await req.json();
        const { fecha, idioma, reservaId } = body;

        if (!fecha || !idioma) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Faltan datos requeridos.'
                },
                { status: 400 }
            );
        }

        const { data: turno, error: errorTurno } =
            await supabase
                .from('disponibilidad')
                .select('*')
                .eq('fecha', fecha)
                .eq('idioma', idioma)
                .single();

        if (errorTurno || !turno) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Este turno no existe.'
                },
                { status: 404 }
            );
        }

        if (turno.bloqueada) {
            return NextResponse.json({
                permitido: false,
                motivo: turno.motivo_bloqueo
                    || 'Este día está bloqueado.'
            });
        }

        if (turno.cupos_cerrados) {
            return NextResponse.json({
                permitido: false,
                motivo: 'Los cupos están cerrados.'
            });
        }

        if (!turno.disponible) {
            return NextResponse.json({
                permitido: false,
                motivo: 'Este turno no está disponible.'
            });
        }

        let query = supabase
            .from('visitas')
            .select('cantidad_huespedes')
            .eq('fecha', fecha)
            .eq('idioma', idioma)
            .neq('estado', 'cancelada');

        if (reservaId) {
            query = query.neq('id', reservaId);
        }

        const {
            data: reservasActivas,
            error: errorReservas
        } = await query;

        if (errorReservas) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Error al verificar disponibilidad.'
                },
                { status: 500 }
            );
        }

        const huespedesTotales = (reservasActivas || [])
            .reduce(
                (acc, r) => acc + (r.cantidad_huespedes || 0),
                0
            );

        const cuposRestantes =
            turno.capacidad_maxima - huespedesTotales;

        if (cuposRestantes <= 0) {
            return NextResponse.json({
                permitido: false,
                motivo: 'No quedan cupos disponibles.'
            });
        }

        return NextResponse.json({
            permitido: true,
            cuposRestantes
        });

    } catch (error) {
        console.error('Error en validar reserva:', error);
        return NextResponse.json(
            {
                permitido: false,
                motivo: 'Error interno. Intentá nuevamente.'
            },
            { status: 500 }
        );
    }
}

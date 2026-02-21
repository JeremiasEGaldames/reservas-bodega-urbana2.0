import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { fecha, idioma } = await req.json();

        if (!fecha || !idioma) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Faltan datos requeridos.'
                },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Buscar el turno exacto en disponibilidad
        const { data: turno, error } = await supabase
            .from('disponibilidad')
            .select('*')
            .eq('fecha', fecha)
            .eq('idioma', idioma)
            .single();

        if (error || !turno) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Este turno no existe.'
                },
                { status: 404 }
            );
        }

        // Verificar si está bloqueado
        if (turno.bloqueada) {
            return NextResponse.json({
                permitido: false,
                motivo: turno.motivo_bloqueo
                    || 'Este día está bloqueado.'
            });
        }

        // Verificar si los cupos están cerrados
        if (turno.cupos_cerrados) {
            return NextResponse.json({
                permitido: false,
                motivo: 'Los cupos para este turno están cerrados.'
            });
        }

        // Verificar si está marcado como no disponible
        if (!turno.disponible) {
            return NextResponse.json({
                permitido: false,
                motivo: 'Este turno no está disponible.'
            });
        }

        // Contar reservas activas para ese turno
        const { data: reservasActivas, error: errorCount } =
            await supabase
                .from('visitas')
                .select('cantidad_huespedes')
                .eq('fecha', fecha)
                .eq('idioma', idioma)
                .neq('estado', 'cancelada');

        if (errorCount) {
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Error al verificar disponibilidad.'
                },
                { status: 500 }
            );
        }

        // Sumar huéspedes ya reservados
        const huespedesTotales = (reservasActivas || [])
            .reduce((acc, r) => acc + (r.cantidad_huespedes || 0), 0);

        const cuposRestantes =
            turno.capacidad_maxima - huespedesTotales;

        if (cuposRestantes <= 0) {
            return NextResponse.json({
                permitido: false,
                motivo: 'No quedan cupos disponibles para este turno.'
            });
        }

        // Todo OK — permitir la reserva
        return NextResponse.json({
            permitido: true,
            cuposRestantes
        });

    } catch (e) {
        return NextResponse.json(
            {
                permitido: false,
                motivo: 'Error interno del servidor.'
            },
            { status: 500 }
        );
    }
}

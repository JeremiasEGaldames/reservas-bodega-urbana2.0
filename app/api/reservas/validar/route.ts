import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        console.log('[validar] Inicio de request');

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('[validar] Entorno - URL definida:', !!url);
        console.log('[validar] Entorno - SERVICE_ROLE_KEY definida:', !!serviceKey);

        if (!serviceKey) {
            console.error('[validar] ALERTA: SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno');
        }

        const supabase = createClient(
            url!,
            serviceKey!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const body = await req.json();
        console.log('[validar] Body recibido:', JSON.stringify(body));
        const { fecha, idioma, reservaId } = body;
        console.log('[validar] Parametros:', { fecha, idioma, reservaId });

        if (!fecha || !idioma) {
            console.warn('[validar] Faltan datos obligatorios');
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Faltan datos requeridos.'
                },
                { status: 400 }
            );
        }

        console.log('[validar] Consultando disponibilidad para:', { fecha, idioma });
        const { data: turno, error: errorTurno } =
            await supabase
                .from('disponibilidad')
                .select('*')
                .eq('fecha', fecha)
                .eq('idioma', idioma)
                .single();

        if (errorTurno) {
            console.error('[validar] Error al consultar disponibilidad:', errorTurno);
        }

        if (errorTurno || !turno) {
            console.warn('[validar] Turno no encontrado');
            return NextResponse.json(
                {
                    permitido: false,
                    motivo: 'Este turno no existe.'
                },
                { status: 404 }
            );
        }

        console.log('[validar] Turno DB:', turno);

        if (turno.bloqueada) {
            console.log('[validar] Turno bloqueado:', turno.motivo_bloqueo);
            return NextResponse.json({
                permitido: false,
                motivo: turno.motivo_bloqueo
                    || 'Este día está bloqueado.'
            });
        }

        if (turno.cupos_cerrados) {
            console.log('[validar] Cupos cerrados');
            return NextResponse.json({
                permitido: false,
                motivo: 'Los cupos están cerrados.'
            });
        }

        if (!turno.disponible) {
            console.log('[validar] No disponible');
            return NextResponse.json({
                permitido: false,
                motivo: 'Este turno no está disponible.'
            });
        }

        console.log('[validar] Contando reservas actuales...');
        let query = supabase
            .from('visitas')
            .select('cantidad_huespedes')
            .eq('fecha', fecha)
            .eq('idioma', idioma)
            .neq('estado', 'cancelada');

        if (reservaId) {
            console.log('[validar] Excluyendo reservaId:', reservaId);
            query = query.neq('id', reservaId);
        }

        const {
            data: reservasActivas,
            error: errorReservas
        } = await query;

        if (errorReservas) {
            console.error('[validar] Error al contar reservas:', errorReservas);
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

        console.log('[validar] Huespedes ocupados:', huespedesTotales, 'Capacidad:', turno.capacidad_maxima);

        const cuposRestantes =
            turno.capacidad_maxima - huespedesTotales;

        console.log('[validar] Cupos restantes finales:', cuposRestantes);

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

    } catch (error: any) {
        console.error('[validar] CRASH DETECTADO:', error);
        if (error instanceof Error) {
            console.error('[validar] Stack trace:', error.stack);
            console.error('[validar] Mensaje:', error.message);
        }
        return NextResponse.json(
            {
                permitido: false,
                motivo: 'Error interno de validación. Revisa logs del servidor.'
            },
            { status: 500 }
        );
    }
}

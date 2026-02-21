'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import CalendarView from '@/components/CalendarView';
import DayDetailPanel from '@/components/DayDetailPanel';
import ReservationForm from '@/components/ReservationForm';
import ReservationList from '@/components/ReservationList';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Disponibilidad, Visita, TurnoStatus, ReservaFormData } from '@/lib/types';

export default function ReservasPage() {
    return (
        <ProtectedRoute allowedRoles={['recepcion', 'admin']}>
            <ReservasContent />
        </ProtectedRoute>
    );
}

function ReservasContent() {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVisita, setEditingVisita] = useState<Visita | null>(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const formularioAbierto = useRef(false);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const fetchData = useCallback(async () => {
        setLoading(true);
        const startDate = format(subMonths(currentMonth, 1), 'yyyy-MM-01');
        const endDate = format(addMonths(currentMonth, 2), 'yyyy-MM-01');

        const [dispRes, visitasRes] = await Promise.all([
            supabase.rpc('get_disponibilidad', {
                p_fecha_inicio: startDate,
                p_fecha_fin: endDate
            }),
            supabase
                .from('visitas')
                .select('*')
                .gte('fecha', startDate)
                .lt('fecha', endDate)
                .order('created_at', { ascending: false }),
        ]);

        if (dispRes.data) setDisponibilidad(dispRes.data);
        if (visitasRes.data) setVisitas(visitasRes.data);
        setLoading(false);
    }, [currentMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Realtime subscriptions & Polling (Capas 1 y 2)
    useEffect(() => {
        let dispChannel: any;
        let visitasChannel: any;

        const subscribeDisp = () => {
            dispChannel = supabase
                .channel('disponibilidad-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'disponibilidad' }, () => {
                    if (formularioAbierto.current) return;
                    fetchData();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Realtime disponibilidad conectado');
                    }
                    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.warn('Realtime disponibilidad desconectado, reconectando...');
                        setTimeout(() => {
                            if (dispChannel) supabase.removeChannel(dispChannel);
                            subscribeDisp();
                        }, 3000);
                    }
                });
        };

        const subscribeVisitas = () => {
            visitasChannel = supabase
                .channel('visitas-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => {
                    if (formularioAbierto.current) return;
                    fetchData();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Realtime visitas conectado');
                    }
                    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.warn('Realtime visitas desconectado, reconectando...');
                        setTimeout(() => {
                            if (visitasChannel) supabase.removeChannel(visitasChannel);
                            subscribeVisitas();
                        }, 3000);
                    }
                });
        };

        subscribeDisp();
        subscribeVisitas();

        // Polling de respaldo cada 30 segundos (Capa 2)
        const intervalo = setInterval(() => {
            if (formularioAbierto.current) return;
            fetchData();
        }, 30000);

        return () => {
            if (dispChannel) supabase.removeChannel(dispChannel);
            if (visitasChannel) supabase.removeChannel(visitasChannel);
            clearInterval(intervalo);
        };
    }, [fetchData]);

    // Detector de visibilidad de pestaña (Capa 3)
    useEffect(() => {
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                if (formularioAbierto.current) return;
                fetchData();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchData]);

    const getTurnos = (date: string): TurnoStatus[] => {
        const dayDisp = disponibilidad.filter((d) => d.fecha === date);
        const dayVisitas = visitas.filter((v) => v.fecha === date && v.estado !== 'cancelada');

        return dayDisp.map((d) => {
            const reservas = dayVisitas
                .filter((v) => v.idioma === d.idioma && v.id !== editingVisita?.id) // Excluir la propia reserva al editar para no contar doble si se mantiene el turno
                .reduce((sum, v) => sum + v.cantidad_huespedes, 0);

            return {
                id: d.id,
                horario: d.horario,
                idioma: d.idioma,
                disponible: d.disponible,
                bloqueada: d.bloqueada,
                cupos_cerrados: d.cupos_cerrados,
                capacidad_maxima: d.capacidad_maxima,
                reservas_count: reservas,
                cupos_disponibles: Math.max(0, d.capacidad_maxima - reservas),
                motivo_bloqueo: d.motivo_bloqueo,
            };
        });
    };

    const handleCreateReserva = async (data: ReservaFormData & { fecha: string; horario: string }) => {
        const { error } = await supabase.from('visitas').insert({
            fecha: data.fecha,
            horario: data.horario,
            idioma: data.idioma,
            nombre: data.nombre,
            apellido: data.apellido,
            hotel: data.hotel,
            email: data.hotel === 'Externo' ? data.email : null,
            telefono: data.hotel === 'Externo' ? data.telefono : null,
            cantidad_huespedes: data.cantidad_huespedes,
            notas: data.notas || null,
            created_by: user?.id || null,
            estado: 'confirmada',
        });

        if (error) throw error;
        setMostrarForm(false);
        formularioAbierto.current = false;
        fetchData();
    };

    const handleUpdateReserva = async (data: ReservaFormData & { fecha: string; horario: string }) => {
        if (!editingVisita) return;

        const { error } = await supabase.from('visitas').update({
            // fecha: data.fecha, // Por ahora mantenemos la fecha original, o podríamos permitir cambiarla
            horario: data.horario,
            idioma: data.idioma,
            nombre: data.nombre,
            apellido: data.apellido,
            hotel: data.hotel,
            email: data.hotel === 'Externo' ? data.email : null,
            telefono: data.hotel === 'Externo' ? data.telefono : null,
            cantidad_huespedes: data.cantidad_huespedes,
            notas: data.notas || null,
            updated_at: new Date().toISOString()
        }).eq('id', editingVisita.id);

        if (error) throw error;
        setEditingVisita(null);
        setMostrarForm(false);
        formularioAbierto.current = false;
        fetchData();
    };

    const handleDelete = (id: string) => {
        setConfirmModal({
            open: true,
            title: 'Eliminar reserva',
            message: '¿Estás seguro de que querés eliminar esta reserva? Esta acción liberará los cupos inmediatamente.',
            onConfirm: async () => {
                const { error } = await supabase.from('visitas').delete().eq('id', id);
                if (error) {
                    console.error('Error al eliminar:', error);
                    alert(`Error al eliminar la reserva: ${error.message}`);
                    return;
                }
                setConfirmModal((prev) => ({ ...prev, open: false }));
                if (editingVisita?.id === id) setEditingVisita(null);
                fetchData();
            },
        });
    };

    const handleChangeStatus = async (id: string, estado: Visita['estado']) => {
        await supabase.from('visitas').update({
            estado,
            updated_at: new Date().toISOString()
        }).eq('id', id);
        fetchData();
    };

    const turnos = selectedDate ? getTurnos(selectedDate) : [];

    const initialFormData: Partial<ReservaFormData & { id: string }> | undefined = editingVisita ? {
        id: editingVisita.id,
        nombre: editingVisita.nombre,
        apellido: editingVisita.apellido,
        hotel: editingVisita.hotel,
        email: editingVisita.email || '',
        telefono: editingVisita.telefono || '',
        cantidad_huespedes: editingVisita.cantidad_huespedes,
        idioma: editingVisita.idioma,
        notas: editingVisita.notas || '',
    } : undefined;

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
            <Navbar role="recepcion" />
            <main className="lg:ml-[240px] pt-14 lg:pt-0 min-h-screen">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                            Agenda de Reservas
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            Huentala Wines Bodega Urbana — Panel de Recepción
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <div className="lg:col-span-2">
                                <CalendarView
                                    currentMonth={currentMonth}
                                    selectedDate={selectedDate}
                                    disponibilidad={disponibilidad}
                                    visitas={visitas}
                                    onSelectDate={(date) => {
                                        setSelectedDate(date);
                                        setEditingVisita(null); // Reset admin mode on date change
                                        setMostrarForm(true);
                                        formularioAbierto.current = true;
                                    }}
                                    onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                />

                                {/* Reservas del día */}
                                {selectedDate && (
                                    <div className="mt-6">
                                        <div
                                            className="rounded-xl p-5 md:p-6"
                                            style={{
                                                background: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                boxShadow: 'var(--shadow-sm)',
                                            }}
                                        >
                                            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                                                Reservas del día
                                            </h3>
                                            <ReservationList
                                                visitas={visitas}
                                                selectedDate={selectedDate}
                                                showActions={true}
                                                onDelete={handleDelete}
                                                onEdit={(v) => {
                                                    setEditingVisita(v);
                                                    setMostrarForm(true);
                                                    formularioAbierto.current = true;
                                                }}
                                                onChangeStatus={handleChangeStatus}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right sidebar */}
                            <div className="space-y-6">
                                {selectedDate && mostrarForm ? (
                                    <>
                                        <DayDetailPanel
                                            selectedDate={selectedDate}
                                            turnos={turnos}
                                            onClose={() => {
                                                setMostrarForm(false);
                                                formularioAbierto.current = false;
                                            }}
                                        />
                                        <ReservationForm
                                            key={editingVisita ? `edit-${editingVisita.id}` : 'new'} // Force re-render on mode change
                                            selectedDate={selectedDate}
                                            turnos={turnos}
                                            initialData={initialFormData}
                                            isEditing={!!editingVisita}
                                            onSubmit={editingVisita ? handleUpdateReserva : handleCreateReserva}
                                            onCancel={() => {
                                                setEditingVisita(null);
                                                setMostrarForm(false);
                                                formularioAbierto.current = false;
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div
                                        className="rounded-xl p-8 text-center"
                                        style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            boxShadow: 'var(--shadow-sm)',
                                        }}
                                    >
                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                        </svg>
                                        <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                                            Selecciona una fecha
                                        </h4>
                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            Hacé click en un día del calendario para ver disponibilidad y crear reservas
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
            />
        </div>
    );
}

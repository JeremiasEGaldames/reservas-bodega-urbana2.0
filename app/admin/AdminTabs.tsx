'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import type { Disponibilidad, Visita, TurnoStatus, Usuario, ReservaFormData } from '@/lib/types';
import ReservationForm from '@/components/ReservationForm';
import ReservationList from '@/components/ReservationList';
import CalendarView from '@/components/CalendarView';
import DayDetailPanel from '@/components/DayDetailPanel';
import StatusBadge from '@/components/StatusBadge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// Helper function reused across tabs
export const getTurnos = (date: string, disponibilidad: Disponibilidad[], visitas: Visita[]): TurnoStatus[] => {
    const dayDisp = disponibilidad.filter((d) => d.fecha === date);
    const dayVisitas = visitas.filter((v) => v.fecha === date && v.estado !== 'cancelada');
    return dayDisp.map((d) => {
        const reservas = dayVisitas.filter((v) => v.idioma === d.idioma).reduce((sum, v) => sum + v.cantidad_huespedes, 0);

        // Si el turno está bloqueado o con cupos cerrados, los disponibles son 0 a efectos de reserva
        const cuposReales = (d.bloqueada || d.cupos_cerrados || !d.disponible)
            ? 0
            : Math.max(0, d.capacidad_maxima - reservas);

        return {
            id: d.id,
            horario: d.horario,
            idioma: d.idioma,
            disponible: d.disponible,
            bloqueada: d.bloqueada,
            cupos_cerrados: d.cupos_cerrados,
            capacidad_maxima: d.capacidad_maxima,
            reservas_count: reservas,
            cupos_disponibles: cuposReales,
            motivo_bloqueo: d.motivo_bloqueo,
        };
    });
};

// --- Panel Tab ---
export function PanelTab({ visitas, disponibilidad }: { visitas: Visita[], disponibilidad: Disponibilidad[] }) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayVisitas = visitas.filter((v) => v.fecha === todayStr && v.estado !== 'cancelada');
    const todayTotal = todayVisitas.reduce((s, v) => s + v.cantidad_huespedes, 0);
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekVisitas = visitas.filter((v) => v.fecha >= weekStart && v.fecha <= weekEnd && v.estado !== 'cancelada');
    const weekTotal = weekVisitas.reduce((s, v) => s + v.cantidad_huespedes, 0);
    const pendientes = visitas.filter((v) => v.estado === 'pendiente').length;
    const todayTurnos = getTurnos(todayStr, disponibilidad, visitas);

    const stats = [
        { label: 'Huéspedes Hoy', value: todayTotal, icon: '👥', color: 'var(--color-primary)' },
        { label: 'Semanal', value: weekTotal, icon: '📊', color: 'var(--color-success)' },
        { label: 'Pendientes', value: pendientes, icon: '⏳', color: 'var(--color-warning)' },
        { label: 'Reservas Hoy', value: todayVisitas.length, icon: '📅', color: '#6366f1' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="p-4 md:p-5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{s.icon}</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Turnos Hoy</h3>
                    {todayTurnos.length > 0 ? todayTurnos.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: 'var(--color-bg)', border: t.bloqueada || t.cupos_cerrados ? '1px dashed var(--color-danger-light)' : 'none' }}>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {t.idioma === 'pt' ? '🇧🇷' : t.idioma === 'es' ? '🇦🇷' : '🇬🇧'} {t.horario?.slice(0, 5)} — {t.idioma === 'pt' ? 'Português' : t.idioma === 'es' ? 'Español' : 'Inglés'}
                                </span>
                                {(t.bloqueada || t.cupos_cerrados) && (
                                    <span className="text-[10px] uppercase font-bold text-red-500">
                                        {t.bloqueada ? 'Día Bloqueado' : 'Cupos Cerrados'}
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: t.cupos_disponibles > 5 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                    {t.cupos_disponibles}/{t.capacidad_maxima}
                                    <span className="text-[10px] ml-1 opacity-60 font-normal">disponibles</span>
                                </p>
                                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                    {t.reservas_count} reservas actuales
                                </p>
                            </div>
                        </div>
                    )) : <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay turnos configurados para hoy</p>}
                </div>

                <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Últimas reservas</h3>
                    <div className="space-y-2">
                        {visitas.slice(0, 5).map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-2">
                                <div>
                                    <span className="text-sm font-medium">{v.nombre} {v.apellido}</span>
                                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{v.hotel}</span>
                                </div>
                                <StatusBadge status={v.estado} size="sm" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Reservas Tab ---
export function ReservasTab({ visitas, disponibilidad, fetchData, user, selectedDate, setSelectedDate, onChangeStatus, onDelete }: any) {
    const [filterFecha, setFilterFecha] = useState('');
    const [filterHotel, setFilterHotel] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterIdioma, setFilterIdioma] = useState('');
    const [showNewReserva, setShowNewReserva] = useState(false);
    const [editingVisita, setEditingVisita] = useState<Visita | null>(null);

    let filtered = [...visitas];
    if (filterFecha) filtered = filtered.filter((v) => v.fecha === filterFecha);
    if (filterHotel) filtered = filtered.filter((v) => v.hotel === filterHotel);
    if (filterEstado) filtered = filtered.filter((v) => v.estado === filterEstado);
    if (filterIdioma) filtered = filtered.filter((v) => v.idioma === filterIdioma);

    const handleCreateReserva = async (data: { nombre: string; apellido: string; hotel: string; email: string; telefono: string; cantidad_huespedes: number; idioma: string; notas: string; fecha: string; horario: string }) => {
        const { error } = await supabase.from('visitas').insert({
            fecha: data.fecha, horario: data.horario, idioma: data.idioma,
            nombre: data.nombre, apellido: data.apellido, hotel: data.hotel,
            email: data.hotel === 'Externo' ? data.email : null,
            telefono: data.hotel === 'Externo' ? data.telefono : null,
            cantidad_huespedes: data.cantidad_huespedes, notas: data.notas || null,
            created_by: user?.id || null, estado: 'confirmada',
        });
        if (error) throw error;
        setShowNewReserva(false);
        fetchData();
    };

    const handleUpdateReserva = async (data: ReservaFormData & { fecha: string; horario: string }) => {
        if (!editingVisita) return;
        const { error } = await supabase.from('visitas').update({
            // fecha: data.fecha,
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
        fetchData();
    };

    const initialFormData: Partial<ReservaFormData> | undefined = editingVisita ? {
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
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Gestión de Reservas</h2>
                <button
                    onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setShowNewReserva(true); }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer"
                    style={{ background: 'var(--color-primary)' }}
                >
                    + Nueva Reserva
                </button>
            </div>

            <div className="flex flex-wrap gap-3 p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <input type="date" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className="px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                <select value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los hoteles</option>
                    <option value="Sheraton">Sheraton</option>
                    <option value="Huentala">Huentala</option>
                    <option value="Hualta">Hualta</option>
                    <option value="Externo">Externo</option>
                </select>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
                <select value={filterIdioma} onChange={(e) => setFilterIdioma(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los turnos</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="es">🇦🇷 Español</option>
                    <option value="en">🇬🇧 Inglés</option>
                </select>
            </div>

            {(showNewReserva || editingVisita) && selectedDate && (
                <ReservationForm
                    key={editingVisita ? `edit-${editingVisita.id}` : 'new'}
                    selectedDate={selectedDate}
                    turnos={getTurnos(selectedDate, disponibilidad, visitas.filter((v: Visita) => v.id !== editingVisita?.id))}
                    onSubmit={editingVisita ? handleUpdateReserva : handleCreateReserva}
                    onCancel={() => { setShowNewReserva(false); setEditingVisita(null); }}
                    initialData={initialFormData}
                    isEditing={!!editingVisita}
                />
            )}

            <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <ReservationList
                    visitas={filtered}
                    showActions
                    onChangeStatus={onChangeStatus}
                    onDelete={onDelete}
                    onEdit={(v) => {
                        setEditingVisita(v);
                        if (v.fecha && setSelectedDate) setSelectedDate(v.fecha);
                        setShowNewReserva(false);
                    }}
                />
            </div>
        </div>
    );
}

// --- Calendario Tab ---
export function CalendarioTab({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, disponibilidad, visitas, fetchData }: any) {
    const [bulkDays, setBulkDays] = useState(90);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [blockModal, setBlockModal] = useState<{ open: boolean; fecha: string; motivo: string }>({ open: false, fecha: '', motivo: '' });

    const turnos = selectedDate ? getTurnos(selectedDate, disponibilidad, visitas) : [];

    const handleUpdateCapacidad = async (id: string, cap: number) => {
        const { error } = await supabase.from('disponibilidad').update({ capacidad_maxima: cap }).eq('id', id);
        if (error) {
            console.error('Error updating capacity:', error);
            alert(`Error al actualizar capacidad: ${error.message}`);
        }
        fetchData();
    };

    const handleToggleCupos = async (id: string, closed: boolean) => {
        const { error } = await supabase.from('disponibilidad').update({ cupos_cerrados: closed }).eq('id', id);
        if (error) {
            console.error('Error toggling quotas:', error);
            alert(`Error al cambiar estado de cupos: ${error.message}`);
        }
        fetchData();
    };

    const handleBlockDay = async () => {
        if (!blockModal.fecha) return;
        const { error } = await supabase.from('disponibilidad').update({ bloqueada: true, motivo_bloqueo: blockModal.motivo || null }).eq('fecha', blockModal.fecha);
        if (error) {
            console.error('Error blocking day:', error);
            alert(`Error al bloquear el día: ${error.message}`);
            return;
        }
        setBlockModal({ open: false, fecha: '', motivo: '' });
        fetchData();
    };

    const handleUnblockDay = async (fecha: string) => {
        const { error } = await supabase.from('disponibilidad').update({ bloqueada: false, motivo_bloqueo: null }).eq('fecha', fecha);
        if (error) {
            console.error('Error unblocking day:', error);
            alert(`Error al desbloquear el día: ${error.message}`);
        }
        fetchData();
    };

    const handleGenerateBulk = async () => {
        setBulkLoading(true);
        const today = new Date();
        const existing = new Set(disponibilidad.map((d: any) => `${d.fecha}-${d.idioma}`));
        const inserts: any[] = [];
        for (let i = 0; i < bulkDays; i++) {
            const date = format(new Date(today.getTime() + i * 86400000), 'yyyy-MM-dd');
            if (!existing.has(`${date}-pt`)) inserts.push({ fecha: date, horario: '18:30:00', idioma: 'pt', capacidad_maxima: 20 });
            if (!existing.has(`${date}-es`)) inserts.push({ fecha: date, horario: '19:00:00', idioma: 'es', capacidad_maxima: 20 });
            if (!existing.has(`${date}-en`)) inserts.push({ fecha: date, horario: '19:30:00', idioma: 'en', capacidad_maxima: 20 });
        }
        if (inserts.length > 0) await supabase.from('disponibilidad').insert(inserts);
        setBulkLoading(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Gestión de Disponibilidad</h2>
                <div className="flex gap-2">
                    <select value={bulkDays} onChange={(e) => setBulkDays(Number(e.target.value))} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                        <option value={30}>30 días</option>
                        <option value={60}>60 días</option>
                        <option value={90}>90 días</option>
                    </select>
                    <button onClick={handleGenerateBulk} disabled={bulkLoading} className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer disabled:opacity-60" style={{ background: 'var(--color-primary)' }}>
                        {bulkLoading ? 'Generando...' : 'Generar fechas'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CalendarView
                        currentMonth={currentMonth}
                        selectedDate={selectedDate}
                        disponibilidad={disponibilidad}
                        visitas={visitas}
                        onSelectDate={setSelectedDate}
                        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    />
                </div>
                <div className="space-y-4">
                    {selectedDate ? (
                        <>
                            <DayDetailPanel selectedDate={selectedDate} turnos={turnos} />
                            <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Controles</h4>
                                {turnos.map((t) => (
                                    <div key={t.id} className="p-3 rounded-lg mb-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{t.idioma === 'pt' ? '🇧🇷 PT' : t.idioma === 'es' ? '🇦🇷 ES' : '🇬🇧 EN'} {t.horario?.slice(0, 5)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cupos:</label>
                                            <input type="number" min={0} value={t.capacidad_maxima} onChange={(e) => handleUpdateCapacidad(t.id, parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 text-sm rounded-md" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggleCupos(t.id, !t.cupos_cerrados)} className="text-[11px] px-2 py-1 rounded-md font-medium cursor-pointer" style={{ background: t.cupos_cerrados ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: t.cupos_cerrados ? 'var(--color-danger)' : '#065f46' }}>
                                                {t.cupos_cerrados ? 'Abrir cupos' : 'Cerrar cupos'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => setBlockModal({ open: true, fecha: selectedDate, motivo: '' })} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium text-white cursor-pointer" style={{ background: 'var(--color-danger)' }}>Bloquear día</button>
                                    <button onClick={() => handleUnblockDay(selectedDate)} className="flex-1 text-xs px-3 py-2 rounded-lg font-medium cursor-pointer" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Desbloquear</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Selecciona una fecha para gestionar</p>
                        </div>
                    )}
                </div>
            </div>

            {blockModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setBlockModal({ ...blockModal, open: false })} />
                    <div className="relative w-full max-w-md p-6 rounded-xl animate-fade-in" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 className="text-lg font-semibold mb-4">Bloquear día</h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>Fecha: {blockModal.fecha}</p>
                        <textarea value={blockModal.motivo} onChange={(e) => setBlockModal({ ...blockModal, motivo: e.target.value })} placeholder="Motivo del bloqueo (opcional)" rows={3} className="w-full px-3 py-2 text-sm rounded-lg mb-4 resize-none" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setBlockModal({ ...blockModal, open: false })} className="px-4 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)' }}>Cancelar</button>
                            <button onClick={handleBlockDay} className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer" style={{ background: 'var(--color-danger)' }}>Bloquear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Huespedes Tab ---
export function HuespedesTab({ visitas, lastSync, fetchData, onChangeStatus, onDelete }: any) {
    const [filterTurno, setFilterTurno] = useState('');
    const [filterHotel, setFilterHotel] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [dateRange, setDateRange] = useState(format(new Date(), 'yyyy-MM-dd'));

    const filtered = visitas.filter((v: any) => {
        if (dateRange && v.fecha !== dateRange) return false;
        if (filterTurno && v.idioma !== filterTurno) return false;
        if (filterHotel && v.hotel !== filterHotel) return false;
        if (filterEstado && v.estado !== filterEstado) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Listado de Huéspedes</h2>
                <div className="flex items-center gap-3">
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Última actualización: {format(lastSync, 'HH:mm:ss')}</div>
                    <button onClick={fetchData} className="px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>🔄 Actualizar ahora</button>
                </div>
            </div>
            <div className="flex flex-wrap gap-3 p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <input type="date" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                <select value={filterTurno} onChange={(e) => setFilterTurno(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los turnos</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="es">🇦🇷 Español</option>
                    <option value="en">🇬🇧 Inglés</option>
                </select>
                <select value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los hoteles</option>
                    <option value="Sheraton">Sheraton</option>
                    <option value="Huentala">Huentala</option>
                    <option value="Hualta">Hualta</option>
                    <option value="Externo">Externo</option>
                </select>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Nombre</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase hidden md:table-cell" style={{ color: 'var(--color-text-muted)' }}>Hotel</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase hidden lg:table-cell" style={{ color: 'var(--color-text-muted)' }}>Contacto</th>
                                <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Cant.</th>
                                <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Turno</th>
                                <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Estado</th>
                                <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v: any) => (
                                <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                    <td className="px-4 py-3"><div className="font-medium">{v.nombre} {v.apellido}</div></td>
                                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{v.hotel}</td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-xs" style={{ color: 'var(--color-text-muted)' }}>{v.hotel === 'Externo' ? <>{v.email}<br />{v.telefono}</> : '—'}</td>
                                    <td className="px-4 py-3 text-center">{v.cantidad_huespedes}</td>
                                    <td className="px-4 py-3 text-center">{v.idioma === 'pt' ? '🇧🇷' : v.idioma === 'es' ? '🇦🇷' : '🇬🇧'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <select value={v.estado} onChange={(e) => onChangeStatus(v.id, e.target.value as Visita['estado'])} className="text-xs px-2 py-1 rounded-md cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="confirmada">Confirmada</option>
                                            <option value="cancelada">Cancelada</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => onDelete(v.id)} className="text-xs px-2 py-1 rounded-md cursor-pointer" style={{ color: 'var(--color-danger)' }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Analisis Tab ---
export function AnalisisTab({ visitas }: { visitas: Visita[] }) {
    const [rangeType, setRangeType] = useState<'week' | 'month' | 'custom'>('month');
    const [customStart, setCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    let startDate: string, endDate: string;
    if (rangeType === 'week') { startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd'); endDate = format(new Date(), 'yyyy-MM-dd'); }
    else if (rangeType === 'month') { startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd'); endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd'); }
    else { startDate = customStart; endDate = customEnd; }

    const rangeVisitas = visitas.filter((v) => v.fecha >= startDate && v.fecha <= endDate && v.estado !== 'cancelada');
    const totalReservas = rangeVisitas.length;
    const reservasPt = rangeVisitas.filter((v) => v.idioma === 'pt').length;
    const reservasEs = rangeVisitas.filter((v) => v.idioma === 'es').length;
    const reservasEn = rangeVisitas.filter((v) => v.idioma === 'en').length;
    const totalHuespedes = rangeVisitas.reduce((s, v) => s + v.cantidad_huespedes, 0);
    const promedioHuespedes = totalReservas > 0 ? (totalHuespedes / totalReservas).toFixed(1) : '0';
    const uniqueDays = new Set(rangeVisitas.map((v) => v.fecha));
    const promedioDiario = uniqueDays.size > 0 ? (totalReservas / uniqueDays.size).toFixed(1) : '0';
    const porHotel = ['Sheraton', 'Huentala', 'Hualta', 'Externo'].map((h) => ({ name: h, value: rangeVisitas.filter((v) => v.hotel === h).length }));
    const pieData = [{ name: 'Português', value: reservasPt }, { name: 'Español', value: reservasEs }, { name: 'Inglés', value: reservasEn }];
    const COLORS = ['#10b981', 'var(--color-primary)', '#6366f1'];
    const dateCountMap: Record<string, number> = {};
    rangeVisitas.forEach((v) => { dateCountMap[v.fecha] = (dateCountMap[v.fecha] || 0) + 1; });
    const topDates = Object.entries(dateCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([fecha, total]) => ({ fecha, total }));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Panel de Análisis</h2>
                <div className="flex gap-2">
                    <button onClick={() => setRangeType('week')} className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${rangeType === 'week' ? 'text-white' : ''}`} style={{ background: rangeType === 'week' ? 'var(--color-primary)' : 'var(--color-bg)', border: '1px solid var(--color-border)' }}>Semana</button>
                    <button onClick={() => setRangeType('month')} className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${rangeType === 'month' ? 'text-white' : ''}`} style={{ background: rangeType === 'month' ? 'var(--color-primary)' : 'var(--color-bg)', border: '1px solid var(--color-border)' }}>Mes</button>
                    <button onClick={() => setRangeType('custom')} className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${rangeType === 'custom' ? 'text-white' : ''}`} style={{ background: rangeType === 'custom' ? 'var(--color-primary)' : 'var(--color-bg)', border: '1px solid var(--color-border)' }}>Custom</button>
                </div>
            </div>
            {rangeType === 'custom' && (
                <div className="flex gap-3 items-center">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>a</span>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reservas', value: totalReservas, color: 'var(--color-primary)' },
                    { label: 'Promedio Diario', value: promedioDiario, color: 'var(--color-success)' },
                    { label: 'Promedio Huéspedes', value: promedioHuespedes, color: '#6366f1' },
                    { label: 'Total Huéspedes', value: totalHuespedes, color: 'var(--color-warning)' },
                ].map((s) => (
                    <div key={s.label} className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Reservas por Idioma</h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Reservas por Hotel</h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={porHotel}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Config Tab ---
export function ConfigTab({ fetchData }: { fetchData: () => void }) {
    const [config, setConfig] = useState<Record<string, string>>({});
    const [configLoading, setConfigLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase.from('configuracion').select('*');
            if (data) {
                const obj: Record<string, string> = {};
                data.forEach((c: { clave: string; valor: string }) => { obj[c.clave] = c.valor; });
                setConfig(obj);
            }
            setConfigLoading(false);
        };
        fetchConfig();
    }, []);

    const saveConfig = async () => {
        setSaving(true);
        try {
            // 1. Guardar en tabla configuracion
            const entries = Object.entries(config);
            for (const [clave, valor] of entries) {
                await supabase.from('configuracion').upsert({ clave, valor });
            }

            // 2. Aplicar a todos los días futuros en disponibilidad
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            // Actualizar PT
            const updatePT: any = {};
            if (config.horario_pt) updatePT.horario = config.horario_pt;
            if (config.capacidad_default_pt) updatePT.capacidad_maxima = parseInt(config.capacidad_default_pt);

            if (Object.keys(updatePT).length > 0) {
                await supabase.from('disponibilidad')
                    .update(updatePT)
                    .eq('idioma', 'pt')
                    .gte('fecha', todayStr);
            }

            // Actualizar ES
            const updateES: any = {};
            if (config.horario_es) updateES.horario = config.horario_es;
            if (config.capacidad_default_es) updateES.capacidad_maxima = parseInt(config.capacidad_default_es);

            if (Object.keys(updateES).length > 0) {
                await supabase.from('disponibilidad')
                    .update(updateES)
                    .eq('idioma', 'es')
                    .gte('fecha', todayStr);
            }

            // Actualizar EN
            const updateEN: any = {};
            if (config.horario_en) updateEN.horario = config.horario_en;
            if (config.capacidad_default_en) updateEN.capacidad_maxima = parseInt(config.capacidad_default_en);

            if (Object.keys(updateEN).length > 0) {
                await supabase.from('disponibilidad')
                    .update(updateEN)
                    .eq('idioma', 'en')
                    .gte('fecha', todayStr);
            }

            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
            if (fetchData) fetchData();
        } catch (err) {
            console.error('Error saving config:', err);
            // Podríamos implementar un toast de error aquí también si fuera necesario
        } finally {
            setSaving(false);
        }
    };

    if (configLoading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6 relative">
            {/* Custom Toast Notification */}
            {showToast && (
                <div className="fixed top-20 right-6 z-[100] animate-fade-in-up">
                    <div
                        className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border"
                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-success)', color: 'var(--color-text)' }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'var(--color-success-light)' }}>
                            <svg className="w-5 h-5" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-sm">Configuración guardada</p>
                            <p className="text-xs opacity-70">Los cambios se aplicaron a los turnos futuros.</p>
                        </div>
                        <button onClick={() => setShowToast(false)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Configuración del Sistema</h2>
            <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Gestión Maestra de Turnos</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Los cambios realizados aquí se aplicarán automáticamente a todos los días futuros en el calendario.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Portugués Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <span>🇧🇷</span> Turno Portugués
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Horario (HH:MM)</label>
                                <input type="time" value={config.horario_pt || '18:30'} onChange={(e) => setConfig({ ...config, horario_pt: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Capacidad (Cupos)</label>
                                <input type="number" value={config.capacidad_default_pt || '20'} onChange={(e) => setConfig({ ...config, capacidad_default_pt: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Español Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <span>🇦🇷</span> Turno Español
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Horario (HH:MM)</label>
                                <input type="time" value={config.horario_es || '19:00'} onChange={(e) => setConfig({ ...config, horario_es: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Capacidad (Cupos)</label>
                                <input type="number" value={config.capacidad_default_es || '20'} onChange={(e) => setConfig({ ...config, capacidad_default_es: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Inglés Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <span>🇬🇧</span> Turno Inglés
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Horario (HH:MM)</label>
                                <input type="time" value={config.horario_en || '19:30'} onChange={(e) => setConfig({ ...config, horario_en: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Capacidad (Cupos)</label>
                                <input type="number" value={config.capacidad_default_en || '20'} onChange={(e) => setConfig({ ...config, capacidad_default_en: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <button onClick={saveConfig} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'var(--color-primary)' }}>
                        {saving ? 'Aplicando cambios...' : 'Guardar y Actualizar Todo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Usuarios Tab ---
export function UsuariosTab() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [usrLoading, setUsrLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', nombre: '', rol: 'recepcion' });

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('usuarios').select('*').order('created_at');
            if (data) setUsuarios(data);
            setUsrLoading(false);
        };
        fetchUsers();
    }, []);

    const createUser = async () => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (res.ok) {
                setShowCreate(false);
                setNewUser({ email: '', password: '', nombre: '', rol: 'recepcion' });
                const { data: usersData } = await supabase.from('usuarios').select('*').order('created_at');
                if (usersData) setUsuarios(usersData);
            } else {
                alert(`Error al crear usuario: ${data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error('Error in createUser:', err);
            alert('Error de red al intentar crear el usuario');
        }
    };

    const toggleActive = async (id: string, activo: boolean) => {
        await supabase.from('usuarios').update({ activo }).eq('id', id);
        setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, activo } : u)));
    };

    if (usrLoading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Gestión de Usuarios</h2>
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer" style={{ background: 'var(--color-primary)' }}>+ Nuevo Usuario</button>
            </div>
            {showCreate && (
                <div className="rounded-xl p-5 animate-fade-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} placeholder="Nombre" className="px-3 py-2.5 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                        <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" className="px-3 py-2.5 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                        <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Contraseña" className="px-3 py-2.5 text-sm rounded-lg" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                        <select value={newUser.rol} onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })} className="px-3 py-2.5 text-sm rounded-lg cursor-pointer" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                            <option value="recepcion">Recepción</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button onClick={createUser} className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer" style={{ background: 'var(--color-primary)' }}>Crear Usuario</button>
                </div>
            )}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                            <th className="text-left px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Nombre</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs uppercase hidden sm:table-cell" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Rol</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Estado</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                <td className="px-4 py-3 font-medium">{u.nombre}</td>
                                <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                <td className="px-4 py-3 text-center"><span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: u.rol === 'admin' ? 'var(--color-primary-light)' : 'var(--color-bg)', color: u.rol === 'admin' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{u.rol}</span></td>
                                <td className="px-4 py-3 text-center"><span className="w-2 h-2 rounded-full inline-block" style={{ background: u.activo ? 'var(--color-success)' : 'var(--color-danger)' }} /></td>
                                <td className="px-4 py-3 text-center"><button onClick={() => toggleActive(u.id, !u.activo)} className="text-xs px-2 py-1 rounded-md cursor-pointer" style={{ color: u.activo ? 'var(--color-danger)' : 'var(--color-success)' }}>{u.activo ? 'Desactivar' : 'Activar'}</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

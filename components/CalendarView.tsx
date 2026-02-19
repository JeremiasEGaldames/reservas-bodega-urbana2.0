'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Disponibilidad, Visita } from '@/lib/types';

interface CalendarViewProps {
    currentMonth: Date;
    selectedDate: string | null;
    disponibilidad: Disponibilidad[];
    visitas: Visita[];
    onSelectDate: (date: string) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export default function CalendarView({
    currentMonth,
    selectedDate,
    disponibilidad,
    visitas,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
}: CalendarViewProps) {
    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const result: Date[] = [];
        let day = calStart;
        while (day <= calEnd) {
            result.push(day);
            day = addDays(day, 1);
        }
        return result;
    }, [currentMonth]);

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayDisp = disponibilidad.filter((d) => d.fecha === dateStr);
        const dayVisitas = visitas.filter((v) => v.fecha === dateStr && v.estado !== 'cancelada');

        if (dayDisp.length === 0) return { status: 'none' as const, esSlots: 0, enSlots: 0, esCap: 0, enCap: 0 };

        const esDisp = dayDisp.find((d) => d.idioma === 'es');
        const enDisp = dayDisp.find((d) => d.idioma === 'en');

        const esReservas = dayVisitas.filter((v) => v.idioma === 'es').reduce((sum, v) => sum + v.cantidad_huespedes, 0);
        const enReservas = dayVisitas.filter((v) => v.idioma === 'en').reduce((sum, v) => sum + v.cantidad_huespedes, 0);

        const esCap = esDisp?.capacidad_maxima ?? 0;
        const enCap = enDisp?.capacidad_maxima ?? 0;
        const esSlots = Math.max(0, esCap - esReservas);
        const enSlots = Math.max(0, enCap - enReservas);

        const allBlocked = dayDisp.every((d) => d.bloqueada || d.cupos_cerrados || !d.disponible);
        const totalSlots = esSlots + enSlots;
        const totalCap = esCap + enCap;

        if (allBlocked) return { status: 'blocked' as const, esSlots, enSlots, esCap, enCap };
        if (totalSlots === 0) return { status: 'full' as const, esSlots, enSlots, esCap, enCap };
        if (totalSlots < totalCap * 0.3) return { status: 'limited' as const, esSlots, enSlots, esCap, enCap };
        return { status: 'available' as const, esSlots, enSlots, esCap, enCap };
    };

    const statusColors = {
        available: { bg: '#d1fae5', dot: '#10b981' },
        limited: { bg: '#fef3c7', dot: '#f59e0b' },
        full: { bg: '#fee2e2', dot: '#ef4444' },
        blocked: { bg: '#f3f4f6', dot: '#9ca3af' },
        none: { bg: 'transparent', dot: 'transparent' },
    };

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <button
                    onClick={onPrevMonth}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h3 className="text-base font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h3>
                <button
                    onClick={onNextMonth}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 px-2 md:px-4 py-2" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                {weekDays.map((d) => (
                    <div key={d} className="text-center text-[11px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 px-2 md:px-4 py-2 gap-y-1">
                {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const currentMonth_ = isSameMonth(day, currentMonth);
                    const selected = selectedDate === dateStr;
                    const today = isToday(day);
                    const { status, esSlots, enSlots } = getDayStatus(day);

                    return (
                        <button
                            key={i}
                            onClick={() => currentMonth_ && onSelectDate(dateStr)}
                            disabled={!currentMonth_}
                            className={`relative flex flex-col items-center py-1.5 md:py-2 rounded-lg transition-all cursor-pointer ${!currentMonth_ ? 'opacity-30' : ''
                                }`}
                            style={{
                                background: selected ? 'var(--color-primary-light)' : 'transparent',
                                outline: selected ? '2px solid var(--color-primary)' : 'none',
                                outlineOffset: '-2px',
                            }}
                            onMouseOver={(e) => {
                                if (!selected && currentMonth_) (e.currentTarget.style.background = 'var(--color-surface-hover)');
                            }}
                            onMouseOut={(e) => {
                                if (!selected) (e.currentTarget.style.background = 'transparent');
                            }}
                        >
                            <span
                                className={`text-sm font-medium ${today ? 'font-bold' : ''}`}
                                style={{
                                    color: selected ? 'var(--color-primary)' : today ? 'var(--color-primary)' : 'var(--color-text)',
                                }}
                            >
                                {format(day, 'd')}
                            </span>
                            {currentMonth_ && status !== 'none' && (
                                <div className="flex gap-0.5 mt-0.5">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: esSlots > 0 ? statusColors[status].dot : '#ef4444',
                                        }}
                                        title={`ES: ${esSlots} cupos`}
                                    />
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: enSlots > 0 ? statusColors[status].dot : '#ef4444',
                                        }}
                                        title={`EN: ${enSlots} cupos`}
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 md:px-6 py-3 text-[11px]" style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} /> Disponible
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> Limitado
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} /> Lleno
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#9ca3af' }} /> Bloqueado
                </span>
            </div>
        </div>
    );
}

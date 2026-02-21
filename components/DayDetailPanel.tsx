'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TurnoStatus } from '@/lib/types';

interface DayDetailPanelProps {
    selectedDate: string;
    turnos: TurnoStatus[];
    onClose?: () => void;
}

export default function DayDetailPanel({ selectedDate, turnos, onClose }: DayDetailPanelProps) {
    const dateObj = new Date(selectedDate + 'T12:00:00');

    return (
        <div
            className="rounded-xl p-5 md:p-6 animate-fade-in"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                        {format(dateObj, "EEEE d 'de' MMMM", { locale: es })}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        Detalle de turnos disponibles
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {turnos.map((turno) => {
                    const cuposRestantes = turno.cupos_disponibles;
                    const capacidadMaxima = turno.capacidad_maxima;

                    let bgColor = 'var(--color-bg)';
                    let borderColor = 'var(--color-border-light)';
                    let textColor = 'var(--color-text)';
                    let subtitleColor = 'var(--color-text-muted)';
                    let cuposColor = 'var(--color-success)';
                    let cursor = 'cursor-pointer';
                    let label = `${cuposRestantes} cupos disponibles`;
                    let isDisabled = false;

                    if (turno.bloqueada) {
                        bgColor = '#f3f4f6'; // bg-gray-100
                        borderColor = '#e5e7eb'; // border-gray-200
                        textColor = '#9ca3af'; // text-gray-400
                        subtitleColor = '#9ca3af';
                        cuposColor = '#9ca3af';
                        cursor = 'cursor-not-allowed';
                        label = 'Bloqueado';
                        isDisabled = true;
                    } else if (turno.cupos_cerrados) {
                        bgColor = '#f3f4f6'; // bg-gray-100
                        borderColor = '#e5e7eb'; // border-gray-200
                        textColor = '#9ca3af'; // text-gray-400
                        subtitleColor = '#9ca3af';
                        cuposColor = '#9ca3af';
                        cursor = 'cursor-not-allowed';
                        label = 'Cupos cerrados';
                        isDisabled = true;
                    } else if (cuposRestantes <= 0) {
                        bgColor = '#fef2f2'; // bg-red-50
                        borderColor = '#fecaca'; // border-red-200
                        textColor = '#f87171'; // text-red-400
                        subtitleColor = '#f87171';
                        cuposColor = '#ef4444'; // text-red-500
                        cursor = 'cursor-not-allowed';
                        label = 'Sin cupos';
                        isDisabled = true;
                    } else if (cuposRestantes / capacidadMaxima <= 0.25) {
                        borderColor = '#fcd34d'; // border-amber-300
                        cuposColor = '#d97706'; // text-amber-600
                        label = `${cuposRestantes} cupos disponibles`;
                    }

                    return (
                        <div
                            key={turno.id}
                            className={`p-3 rounded-lg transition-all ${!isDisabled ? 'hover:shadow-md' : ''}`}
                            style={{
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                cursor: cursor
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                        {turno.idioma === 'pt' ? '🇧🇷' :
                                            turno.idioma === 'es' ? '🇦🇷' : '🇬🇧'}
                                    </span>
                                    <div>
                                        <span className="text-sm font-semibold" style={{ color: textColor }}>
                                            {turno.horario?.slice(0, 5)} hs
                                        </span>
                                        <span className="text-xs ml-2" style={{ color: subtitleColor }}>
                                            {turno.idioma === 'pt' ? '🇧🇷 Português' :
                                                turno.idioma === 'es' ? '🇦🇷 Español' :
                                                    '🇬🇧 English'}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold" style={{ color: cuposColor }}>
                                    {label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

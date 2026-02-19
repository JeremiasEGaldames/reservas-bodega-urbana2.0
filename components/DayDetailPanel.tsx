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
                    const isClosed = turno.bloqueada || turno.cupos_cerrados || !turno.disponible;
                    const pct = turno.capacidad_maxima > 0
                        ? ((turno.capacidad_maxima - turno.cupos_disponibles) / turno.capacidad_maxima) * 100
                        : 0;

                    return (
                        <div
                            key={turno.id}
                            className={`p-3 rounded-lg ${isClosed ? 'opacity-50' : ''}`}
                            style={{
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border-light)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                        {turno.idioma === 'es' ? '🇪🇸' : '🇬🇧'}
                                    </span>
                                    <div>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {turno.horario?.slice(0, 5)} hs
                                        </span>
                                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                                            {turno.idioma === 'es' ? 'Español' : 'Inglés'}
                                        </span>
                                    </div>
                                </div>
                                {isClosed ? (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                        {turno.bloqueada ? 'Bloqueado' : 'Cerrado'}
                                    </span>
                                ) : (
                                    <span className="text-sm font-bold" style={{
                                        color: turno.cupos_disponibles > 5 ? 'var(--color-success)' : turno.cupos_disponibles > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
                                    }}>
                                        {turno.cupos_disponibles} / {turno.capacidad_maxima}
                                    </span>
                                )}
                            </div>
                            {!isClosed && (
                                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-light)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${pct}%`,
                                            background: pct > 80 ? 'var(--color-danger)' : pct > 50 ? 'var(--color-warning)' : 'var(--color-success)',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

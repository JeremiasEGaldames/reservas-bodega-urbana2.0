'use client';

import type { Visita } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface ReservationListProps {
    visitas: Visita[];
    selectedDate?: string;
    showActions?: boolean;
    onChangeStatus?: (id: string, estado: Visita['estado']) => void;
    onDelete?: (id: string) => void;
    onEdit?: (visita: Visita) => void;
}

export default function ReservationList({
    visitas,
    selectedDate,
    showActions = false,
    onChangeStatus,
    onDelete,
    onEdit,
}: ReservationListProps) {
    const filtered = selectedDate ? visitas.filter((v) => v.fecha === selectedDate) : visitas;

    if (filtered.length === 0) {
        return (
            <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No hay reservas para esta fecha
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {filtered.map((visita) => (
                <div
                    key={visita.id}
                    className="p-3 md:p-4 rounded-lg transition-colors"
                    style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border-light)',
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {visita.nombre} {visita.apellido}
                                </span>
                                <StatusBadge status={visita.estado} size="sm" />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>🏨 {visita.hotel}</span>
                                <span>👥 {visita.cantidad_huespedes}</span>
                                <span>{visita.idioma === 'es' ? '🇪🇸' : '🇬🇧'} {visita.horario?.slice(0, 5)}</span>
                                {visita.hotel === 'Externo' && visita.email && (
                                    <span>✉️ {visita.email}</span>
                                )}
                            </div>
                            {visita.notas && (
                                <p className="text-[11px] mt-1.5 italic" style={{ color: 'var(--color-text-muted)' }}>
                                    &quot;{visita.notas}&quot;
                                </p>
                            )}
                        </div>
                        {showActions && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {visita.estado === 'pendiente' && onChangeStatus && (
                                    <button
                                        onClick={() => onChangeStatus(visita.id, 'confirmada')}
                                        className="p-1.5 rounded-md transition-colors cursor-pointer"
                                        style={{ color: 'var(--color-success)' }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-success-light)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                        title="Confirmar"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </button>
                                )}
                                {visita.estado !== 'cancelada' && onChangeStatus && (
                                    <button
                                        onClick={() => onChangeStatus(visita.id, 'cancelada')}
                                        className="p-1.5 rounded-md transition-colors cursor-pointer"
                                        style={{ color: 'var(--color-warning)' }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-warning-light)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                        title="Cancelar"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(visita)}
                                        className="p-1.5 rounded-md transition-colors cursor-pointer"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                        title="Editar"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(visita.id)}
                                        className="p-1.5 rounded-md transition-colors cursor-pointer"
                                        style={{ color: 'var(--color-danger)' }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-danger-light)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                        title="Eliminar"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

'use client';

import type { EstadoReserva } from '@/lib/types';

interface StatusBadgeProps {
    status: EstadoReserva;
    size?: 'sm' | 'md';
}

const statusConfig: Record<EstadoReserva, { label: string; bg: string; text: string; dot: string }> = {
    pendiente: {
        label: 'Pendiente',
        bg: 'var(--color-warning-light)',
        text: '#92400e',
        dot: 'var(--color-warning)',
    },
    confirmada: {
        label: 'Confirmada',
        bg: 'var(--color-success-light)',
        text: '#065f46',
        dot: 'var(--color-success)',
    },
    cancelada: {
        label: 'Cancelada',
        bg: 'var(--color-danger-light)',
        text: '#991b1b',
        dot: 'var(--color-danger)',
    },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
            style={{ background: config.bg, color: config.text }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: config.dot }}
            />
            {config.label}
        </span>
    );
}

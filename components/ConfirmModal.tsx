'use client';

import { ReactNode } from 'react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null;

    const btnColor = variant === 'danger' ? 'var(--color-danger)' : 'var(--color-primary)';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
            <div
                className="relative w-full max-w-md p-6 rounded-xl animate-fade-in"
                style={{
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    {title}
                </h3>
                <div className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                    {message}
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        style={{
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors cursor-pointer"
                        style={{ background: btnColor }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import type { ReservaFormData, HotelType, IdiomaType, TurnoStatus } from '@/lib/types';

interface ReservationFormProps {
    selectedDate: string;
    turnos: TurnoStatus[];
    onSubmit: (data: ReservaFormData & { fecha: string; horario: string }) => Promise<void>;
    onCancel?: () => void;
    initialData?: Partial<ReservaFormData>;
    isEditing?: boolean;
}

const hotels: HotelType[] = ['Sheraton', 'Huentala', 'Hualta', 'Externo'];

export default function ReservationForm({
    selectedDate,
    turnos,
    onSubmit,
    onCancel,
    initialData,
    isEditing = false,
}: ReservationFormProps) {
    const [form, setForm] = useState<ReservaFormData>({
        nombre: initialData?.nombre || '',
        apellido: initialData?.apellido || '',
        hotel: initialData?.hotel || 'Sheraton',
        email: initialData?.email || '',
        telefono: initialData?.telefono || '',
        cantidad_huespedes: initialData?.cantidad_huespedes || 1,
        idioma: initialData?.idioma || 'es',
        notas: initialData?.notas || '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedTurno = turnos.find((t) => t.idioma === form.idioma);
    const horario = selectedTurno?.horario || (form.idioma === 'es' ? '19:00:00' : '19:30:00');

    // Determinar si el día está bloqueado o no disponible
    const allTurnsBlocked = turnos.length > 0 && turnos.every(t => t.bloqueada);
    const noAvailableTurns = turnos.length > 0 && turnos.every(t => t.bloqueada || t.cupos_cerrados || !t.disponible || t.cupos_disponibles <= 0);
    const activeReason = turnos.find(t => t.bloqueada && t.motivo_bloqueo)?.motivo_bloqueo;

    const isBlocked = allTurnsBlocked || (noAvailableTurns && !isEditing);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (form.hotel === 'Externo' && (!form.email || !form.telefono)) return;

        setLoading(true);
        setError(null);

        try {
            // VALIDACIÓN EN SERVIDOR antes de insertar
            const validacion = await fetch('/api/reservas/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha: selectedDate,
                    idioma: form.idioma,
                    reservaId: initialData && isEditing ? (initialData as any).id : null,
                }),
            });

            const resultado = await validacion.json();

            if (!resultado.permitido) {
                setError(resultado.motivo || 'No es posible realizar esta reserva.');
                setLoading(false);
                return;
            }

            await onSubmit({
                ...form,
                fecha: selectedDate,
                horario,
            });
            setSuccess(true);
            if (!isEditing) {
                setForm({
                    nombre: '',
                    apellido: '',
                    hotel: 'Sheraton',
                    email: '',
                    telefono: '',
                    cantidad_huespedes: 1,
                    idioma: 'es',
                    notas: '',
                });
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
    };

    return (
        <div
            className="rounded-xl p-5 md:p-6"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                {isEditing ? 'Editar Reserva' : 'Nueva Reserva'}
            </h3>

            {success && (
                <div
                    className="mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in"
                    style={{ background: 'var(--color-success-light)', color: '#065f46' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Reserva creada exitosamente
                </div>
            )}

            {error && (
                <div
                    className="mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in"
                    style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {error}
                </div>
            )}

            {isBlocked && !isEditing ? (
                <div
                    className="p-8 text-center border-2 border-dashed rounded-xl animate-fade-in"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-danger-light)' }}>
                        <svg className="w-6 h-6" style={{ color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h4 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                        {allTurnsBlocked
                            ? (activeReason ? `Día bloqueado por ${activeReason}` : 'Día bloqueado')
                            : 'Día no disponible'}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        No se pueden realizar nuevas reservas para esta fecha.
                    </p>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-6 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                            Volver
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre & Apellido */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                                placeholder="Nombre del huésped"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Apellido *
                            </label>
                            <input
                                type="text"
                                value={form.apellido}
                                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                                placeholder="Apellido del huésped"
                                required
                            />
                        </div>
                    </div>

                    {/* Hotel */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                            Hotel *
                        </label>
                        <select
                            value={form.hotel}
                            onChange={(e) => setForm({ ...form, hotel: e.target.value as HotelType })}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all cursor-pointer"
                            style={inputStyle}
                        >
                            {hotels.map((h) => (
                                <option key={h} value={h}>
                                    {h}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email & Teléfono for Externo */}
                    {form.hotel === 'Externo' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                                    placeholder="email@ejemplo.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    value={form.telefono}
                                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                                    placeholder="+54 261 ..."
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Cantidad & Turno */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Cantidad de huéspedes *
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={form.cantidad_huespedes}
                                onChange={(e) => setForm({ ...form, cantidad_huespedes: parseInt(e.target.value) || 1 })}
                                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                                Turno / Idioma *
                            </label>
                            <div className="flex gap-2">
                                {turnos.map((turno) => {
                                    const isSelected = form.idioma === turno.idioma;
                                    const isDisabled = turno.bloqueada || turno.cupos_cerrados || !turno.disponible || turno.cupos_disponibles <= 0;
                                    return (
                                        <button
                                            key={turno.idioma}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => setForm({ ...form, idioma: turno.idioma as IdiomaType })}
                                            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                                            style={{
                                                background: isSelected ? 'var(--color-primary)' : 'var(--color-bg)',
                                                color: isSelected ? 'white' : 'var(--color-text)',
                                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            }}
                                        >
                                            <div>{turno.horario.slice(0, 5)}</div>
                                            <div className="text-[11px] opacity-80 mt-0.5">
                                                {turno.idioma === 'es' ? '🇪🇸 Español' : '🇬🇧 Inglés'}
                                            </div>
                                            <div className="text-[10px] opacity-60 mt-0.5">
                                                {turno.cupos_disponibles} cupos
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                            Notas adicionales
                        </label>
                        <textarea
                            value={form.notas}
                            onChange={(e) => setForm({ ...form, notas: e.target.value })}
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all resize-none"
                            style={inputStyle}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                            placeholder="Restricciones alimentarias, celebraciones, etc."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                style={{
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-60 cursor-pointer"
                            style={{
                                background: 'var(--color-primary)',
                                boxShadow: '0 2px 8px rgba(212,17,66,0.2)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {isEditing ? 'Guardando...' : 'Reservando...'}
                                </span>
                            ) : isEditing ? (
                                'Guardar cambios'
                            ) : (
                                'Crear Reserva'
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ConfirmModal from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Disponibilidad, Visita } from '@/lib/types';
import { PanelTab, ReservasTab, CalendarioTab, HuespedesTab, AnalisisTab, ConfigTab, UsuariosTab } from './AdminTabs';

type AdminTab = 'panel' | 'reservas' | 'calendario' | 'huespedes' | 'analisis' | 'config' | 'usuarios';

export default function AdminPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminContent />
        </ProtectedRoute>
    );
}

function AdminContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get('tab') as AdminTab) || 'panel';

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<Date>(new Date());

    // Modal states
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const fetchData = useCallback(async () => {
        const startDate = format(subMonths(currentMonth, 2), 'yyyy-MM-01');
        const endDate = format(addMonths(currentMonth, 4), 'yyyy-MM-01');

        const [dispRes, visitasRes] = await Promise.all([
            supabase.from('disponibilidad').select('*').gte('fecha', startDate).lt('fecha', endDate).order('fecha'),
            supabase.from('visitas').select('*').gte('fecha', startDate).lt('fecha', endDate).order('created_at', { ascending: false }),
        ]);

        if (dispRes.data) setDisponibilidad(dispRes.data);
        if (visitasRes.data) setVisitas(visitasRes.data);
        setLastSync(new Date());
        setLoading(false);
    }, [currentMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Realtime logic
    useEffect(() => {
        const ch1 = supabase.channel('admin-disp').on('postgres_changes', { event: '*', schema: 'public', table: 'disponibilidad' }, () => { fetchData(); }).subscribe();
        const ch2 = supabase.channel('admin-vis').on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => { fetchData(); }).subscribe();
        return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
    }, [fetchData]);

    const handleChangeStatus = async (id: string, estado: Visita['estado']) => {
        await supabase.from('visitas').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
        fetchData();
    };

    const handleDelete = (id: string) => {
        setConfirmModal({
            open: true, title: 'Eliminar reserva',
            message: '¿Estás seguro de que querés eliminar esta reserva? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                const { error } = await supabase.from('visitas').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting:', error);
                    alert(`Error al eliminar la reserva: ${error.message}`);
                    return;
                }
                setConfirmModal((prev) => ({ ...prev, open: false }));
                fetchData();
            },
        });
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
            <Navbar role="admin" />
            <main className="lg:ml-[240px] pt-14 lg:pt-0 min-h-screen">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'panel' && <PanelTab visitas={visitas} disponibilidad={disponibilidad} />}
                            {activeTab === 'reservas' && (
                                <ReservasTab
                                    visitas={visitas}
                                    disponibilidad={disponibilidad}
                                    fetchData={fetchData}
                                    user={user}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    onChangeStatus={handleChangeStatus}
                                    onDelete={handleDelete}
                                />
                            )}
                            {activeTab === 'calendario' && (
                                <CalendarioTab
                                    currentMonth={currentMonth}
                                    setCurrentMonth={setCurrentMonth}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    disponibilidad={disponibilidad}
                                    visitas={visitas}
                                    fetchData={fetchData}
                                />
                            )}
                            {activeTab === 'huespedes' && (
                                <HuespedesTab
                                    visitas={visitas}
                                    lastSync={lastSync}
                                    fetchData={fetchData}
                                    onChangeStatus={handleChangeStatus}
                                    onDelete={handleDelete}
                                />
                            )}
                            {activeTab === 'analisis' && <AnalisisTab visitas={visitas} />}
                            {activeTab === 'config' && <ConfigTab fetchData={fetchData} />}
                            {activeTab === 'usuarios' && <UsuariosTab />}
                        </>
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

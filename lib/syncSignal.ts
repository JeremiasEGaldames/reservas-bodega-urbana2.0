import { createClient } from '@/lib/supabase';

export async function emitirSyncSignal(
    motivo: string
): Promise<void> {
    try {
        const supabase = createClient();
        const { error } = await supabase
            .from('sync_signal')
            .update({
                updated_at: new Date().toISOString(),
                motivo
            })
            .eq('id', 1);

        if (error) {
            console.error('syncSignal error:', error);
        }
    } catch (e) {
        console.error('syncSignal excepción:', e);
    }
}
